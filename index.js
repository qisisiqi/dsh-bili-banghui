/**
 * dsh-bili-banghui —— Host 半部
 *  - 只读数据：回复列表 / 整层对话 / 我
 *  - 登录：生成二维码、轮询扫码结果、写凭证（不向外暴露 cookie）
 *  - 人设：读写本地 persona.md
 */
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync, appendFileSync, renameSync, unlinkSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchReplyList, fetchThread, fetchMe, fetchAid } from './lib/workbench.js'

export const inject = ['webServer']

// 插件自带数据目录：凭证、人设、流水、样本、Key、不回名单都在这里
const PLUGIN_DIR = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(PLUGIN_DIR, 'data')

const DEFAULTS = {
  credFile: join(DATA_DIR, 'credential.json'),
  personaFile: join(DATA_DIR, 'persona.md'),
  // 留空则自动探测 python/python3；只为生成登录二维码，失败会降级为登录链接
  python: '',
  keyFile: join(DATA_DIR, 'apikey.txt'),
  apiBase: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const QR_GEN = 'https://passport.bilibili.com/x/passport-login/web/qrcode/generate?source=main-fe-header'
const qrPoll = (key) => `https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=${encodeURIComponent(key)}&source=main-fe-header`
const SPI = 'https://api.bilibili.com/x/frontend/finger/spi'

const readCred = (file) => {
  try {
    const raw = JSON.parse(readFileSync(file, 'utf8'))
    return raw?.sessdata ? raw : null
  } catch {
    return null
  }
}

const cookieOf = (c) =>
  `SESSDATA=${c.sessdata}; bili_jct=${c.bili_jct || ''}; buvid3=${c.buvid3 || ''}; DedeUserID=${c.dedeuserid || ''}`

// 原子写：先写临时文件再 rename，避免进程被杀留下半截 JSON；同一进程内串行化
let writeChain = Promise.resolve()
const atomicWrite = (file, content, enc = 'utf8') => {
  writeChain = writeChain.then(() => new Promise((resolve) => {
    const tmp = `${file}.tmp-${process.pid}-${Date.now()}`
    try {
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(tmp, content, enc)
      renameSync(tmp, file)
      resolve(true)
    } catch {
      try { if (existsSync(tmp)) unlinkSync(tmp) } catch { /* 兜住 */ }
      resolve(false)
    }
  }))
  return writeChain
}

const pickCookies = (list) => {
  const want = { SESSDATA: 'sessdata', bili_jct: 'bili_jct', DedeUserID: 'dedeuserid', buvid3: 'buvid3' }
  const jar = {}
  for (const raw of list ?? []) {
    const first = String(raw).split(';')[0] || ''
    const i = first.indexOf('=')
    if (i <= 0) continue
    const name = first.slice(0, i).trim()
    const val = first.slice(i + 1).trim()
    if (want[name]) jar[want[name]] = val
  }
  return jar
}

/** 往 reply-log.md 本月表格顶部插一行（不存正文） */
const appendReplyLog = (file, { bvid, name, rpid, myRpid }) => {
  try {
    if (!existsSync(file)) return false
    const lines = readFileSync(file, 'utf8').split(/\r?\n/)
    const d = new Date()
    const date = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const safeName = String(name || '').replace(/\|/g, ' ')
    const row = `| ${date} | ${bvid} | ${safeName} | ${rpid} | ${myRpid} |`
    let idx = -1
    for (let i = 0; i < lines.length; i += 1) {
      if (lines[i].startsWith('| 日期 |') && String(lines[i + 1] || '').includes('---')) { idx = i + 1; break }
    }
    if (idx < 0) return false
    lines.splice(idx + 1, 0, row)
    writeFileSync(file, lines.join('\n'), 'utf8')
    return true
  } catch {
    return false
  }
}

/** 从 reply-log.md 里读出「已回过的对方评论 id」 */
const readRepliedSet = (logPath) => {
  const set = new Set()
  try {
    for (const line of readFileSync(logPath, 'utf8').split(/\r?\n/)) {
      if (!line.startsWith('|') || line.startsWith('|---')) continue
      const cells = line.split('|').map((x) => x.trim())
      if (cells.length < 7) continue
      const rpid = Number(cells[4])
      if (rpid > 0) set.add(rpid)
    }
  } catch { /* 没有流水就空集 */ }
  return set
}

// 内置表情：随包体分发，不走网络（assets/emotes 下是 png，emotes.json 是索引）
const EMOTE_DIR = join(PLUGIN_DIR, 'assets', 'emotes')
const EMOTE_JSON = join(PLUGIN_DIR, 'assets', 'emotes.json')

const runPythonQr = (python, url) => new Promise((resolve) => {  const out = join(tmpdir(), 'bili-banghui-qr.png')
  const code = 'import sys, qrcode; qrcode.make(sys.argv[1]).save(sys.argv[2])'
  let child
  try {
    child = spawn(python, ['-c', code, url, out], { windowsHide: true })
  } catch {
    return resolve('')
  }
  child.on('error', () => resolve(''))
  child.on('exit', (c) => {
    try {
      if (c === 0 && existsSync(out)) return resolve(readFileSync(out).toString('base64'))
    } catch { /* 兜住 */ }
    resolve('')
  })
})

export function apply(ctx, config = {}) {
  try { mkdirSync(DATA_DIR, { recursive: true }) } catch { /* 兜住 */ }
  const cfg = { ...DEFAULTS, ...(config || {}) }
  const web = ctx.get?.('webServer') ?? ctx.webServer
  const disposers = []
  const qrKeys = new Map()   // key -> { url, at }

  const sendJson = (res, status, data) => {
    try {
      res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
      res.end(JSON.stringify(data))
    } catch { /* 客户端断开 */ }
  }

  const stateFile = join(dirname(cfg.keyFile), 'muted.json')
  const sendGuard = new Map()
  let lastSendAt = 0
  const readMuted = () => {
    try {
      const arr = JSON.parse(readFileSync(stateFile, 'utf8'))
      return Array.isArray(arr) ? arr : []
    } catch { return [] }
  }
  const writeMuted = (arr) => {
    try {
      mkdirSync(dirname(stateFile), { recursive: true })
      writeFileSync(stateFile, JSON.stringify(arr), 'utf8')
      return true
    } catch { return false }
  }
  const readBody = async (req) => {
    try {
      const chunks = []
      for await (const c of req) chunks.push(c)
      return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
    } catch { return {} }
  }

  if (web?.register) {
    disposers.push(web.register({
      kind: 'prefix',
      path: '/api/bili-banghui',
      handler: async (req, res) => {
        const url = new URL(req.url, 'http://127.0.0.1')
        const path = url.pathname
        // 只接受本机来源：防跨站 POST 用本机接口代发评论
        const origin = String(req.headers.origin || '')
        const host = String(req.headers.host || '')
        const localOrigin = /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i
        const localHost = /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i
        if ((origin && !localOrigin.test(origin)) || (host && !localHost.test(host))) {
          return sendJson(res, 403, { ok: false, error: 'forbidden origin' })
        }
        try {
          // ── 状态 ──
          if (req.method === 'GET' && path === '/api/bili-banghui/emojis') {
            try {
              const list = existsSync(EMOTE_JSON) ? JSON.parse(readFileSync(EMOTE_JSON, 'utf8')) : []
              const emotes = (Array.isArray(list) ? list : []).map((e) => ({
                text: `[${e.text}]`,
                url: `/api/bili-banghui/emote/${e.file}`,
              }))
              if (!emotes.length) return sendJson(res, 200, { ok: false, error: '没有内置表情', packages: [] })
              return sendJson(res, 200, { ok: true, packages: [{ name: '常用', emotes }] })
            } catch (e) {
              return sendJson(res, 200, { ok: false, error: String(e?.message ?? e), packages: [] })
            }
          }
          if (req.method === 'GET' && path.startsWith('/api/bili-banghui/emote/')) {
            const name = path.slice('/api/bili-banghui/emote/'.length)
            if (!/^\d{1,3}\.png$/.test(name)) { res.writeHead(400); res.end(); return }
            const f = join(EMOTE_DIR, name)
            if (!existsSync(f)) { res.writeHead(404); res.end(); return }
            try {
              res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' })
              res.end(readFileSync(f))
            } catch { try { res.writeHead(500); res.end() } catch { /* 兜住 */ } }
            return
          }
          if (req.method === 'GET' && path === '/api/bili-banghui/status') {
            return sendJson(res, 200, { ok: true, loggedIn: !!readCred(cfg.credFile) })
          }

          // ── 登录：生成二维码 ──
          if (req.method === 'POST' && path === '/api/bili-banghui/login/start') {
            const r = await fetch(QR_GEN, { headers: { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' } })
            const j = await r.json().catch(() => null)
            if (j?.code !== 0 || !j?.data?.url) return sendJson(res, 200, { ok: false, error: '生成二维码失败' })
            for (const [k, v] of qrKeys) if (Date.now() - v.at > 300_000) qrKeys.delete(k)
            const key = String(j.data.qrcode_key || '')
            const qr = await runPythonQr(cfg.python || (process.platform === 'win32' ? 'python' : 'python3'), j.data.url)
            qrKeys.set(key, { url: j.data.url, at: Date.now() })
            return sendJson(res, 200, { ok: true, key, url: j.data.url, qr })
          }

          // ── 登录：轮询 ──
          if (req.method === 'GET' && path === '/api/bili-banghui/login/poll') {
            const key = String(url.searchParams.get('key') || '')
            if (!key) return sendJson(res, 200, { ok: false, error: '缺少 key' })
            const r = await fetch(qrPoll(key), { headers: { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' } })
            const j = await r.json().catch(() => null)
            const code = Number(j?.data?.code)
            if (code === 86101) return sendJson(res, 200, { ok: true, state: 'waiting' })
            if (code === 86090) return sendJson(res, 200, { ok: true, state: 'scanned' })
            if (code === 86038) return sendJson(res, 200, { ok: true, state: 'expired' })
            if (code !== 0) return sendJson(res, 200, { ok: true, state: 'waiting' })

            // 成功：凭证在 Set-Cookie 里
            const setCookies = typeof r.headers.getSetCookie === 'function' ? r.headers.getSetCookie() : []
            const jar = pickCookies(setCookies)
            if (!jar.sessdata) return sendJson(res, 200, { ok: false, state: 'error', error: '登录成功但没拿到 SESSDATA' })
            if (!jar.buvid3) {
              try {
                const spi = await fetch(SPI, { headers: { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' } }).then((x) => x.json())
                jar.buvid3 = String(spi?.data?.b_3 || '')
              } catch { /* 兜住 */ }
            }
            await atomicWrite(cfg.credFile, JSON.stringify({
              sessdata: jar.sessdata,
              bili_jct: jar.bili_jct || '',
              buvid3: jar.buvid3 || '',
              dedeuserid: jar.dedeuserid || '',
              savedAt: new Date().toISOString(),
            }, null, 2), 'utf8').then((wrote) => {
              if (wrote === false) throw new Error('凭证写入失败（磁盘或权限问题）')
            })
            qrKeys.delete(key)
            return sendJson(res, 200, { ok: true, state: 'done' })
          }

          // ── 人设：读 / 写 ──
          if (path === '/api/bili-banghui/persona' && req.method === 'GET') {
            try {
              const text = existsSync(cfg.personaFile) ? readFileSync(cfg.personaFile, 'utf8') : ''
              const st = existsSync(cfg.personaFile) ? statSync(cfg.personaFile) : null
              let samples = 0
              try {
                const sp = join(dirname(cfg.personaFile), 'samples.jsonl')
                if (existsSync(sp)) samples = readFileSync(sp, 'utf8').split(/\r?\n/).filter(Boolean).length
              } catch { /* 忽略 */ }
              return sendJson(res, 200, { ok: true, path: cfg.personaFile, text, mtime: st ? st.mtimeMs : 0, samples })
            } catch (e) {
              return sendJson(res, 200, { ok: false, error: String(e?.message ?? e) })
            }
          }
          if (path === '/api/bili-banghui/persona/suggest' && req.method === 'POST') {
            try {
              const apiKey = existsSync(cfg.keyFile) ? readFileSync(cfg.keyFile, 'utf8').trim() : ''
              if (!apiKey) return sendJson(res, 200, { ok: false, error: `没找到 API key：${cfg.keyFile}` })
              const sp = join(dirname(cfg.personaFile), 'samples.jsonl')
              if (!existsSync(sp)) return sendJson(res, 200, { ok: false, error: '还没有语料（samples.jsonl）' })
              const lines = readFileSync(sp, 'utf8').split(/\r?\n/).filter(Boolean).slice(-80)
              const samples = lines.map((l) => {
                try { return String(JSON.parse(l).text || '') } catch { return '' }
              }).filter(Boolean)
              if (samples.length < 3) return sendJson(res, 200, { ok: false, error: '样本太少（少于 3 条），先多发几条' })
              const persona = existsSync(cfg.personaFile) ? readFileSync(cfg.personaFile, 'utf8').slice(0, 6000) : ''
              const resp = await fetch(`${String(cfg.apiBase).replace(/\/$/, '')}/chat/completions`, {
                method: 'POST',
                headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
                body: JSON.stringify({
                  model: cfg.model,
                  temperature: 0.3,
                  max_tokens: 700,
                  messages: [
                    { role: 'system', content: '你在帮 B站 用户整理自己的语言习惯。只输出 markdown 列表（每条一行 "- "），不要标题、不要解释。' },
                    { role: 'user', content: `现有档案（只作参考，不要复述）：\n${persona}\n\n最近说过的 ${samples.length} 条评论：\n${samples.join('\n')}\n\n请归纳出 4–8 条「新出现的」语言特征：句式、口头禅、语气词、表情习惯、常聊话题。只写档案里还没有或写得不全的；不确定的不要写。` },
                  ],
                }),
              })
              const js = await resp.json().catch(() => null)
              if (!resp.ok || !js) return sendJson(res, 200, { ok: false, error: `模型接口 HTTP ${resp.status}` })
              const text = String(js.choices?.[0]?.message?.content || '').trim()
              if (!text) return sendJson(res, 200, { ok: false, error: '模型没返回内容' })
              return sendJson(res, 200, { ok: true, text, samples: samples.length })
            } catch (e) {
              return sendJson(res, 200, { ok: false, error: String(e?.message ?? e) })
            }
          }
          if (path === '/api/bili-banghui/persona' && req.method === 'POST') {
            const body = await readBody(req)
            const text = String(body?.text ?? '')
            if (!text.trim()) return sendJson(res, 200, { ok: false, error: '内容为空，未保存' })
            try {
              writeFileSync(cfg.personaFile, text, 'utf8')
              return sendJson(res, 200, { ok: true, path: cfg.personaFile, bytes: Buffer.byteLength(text, 'utf8') })
            } catch (e) {
              return sendJson(res, 200, { ok: false, error: String(e?.message ?? e) })
            }
          }

          // ── API Key（模型）读写 ──
          if (path === '/api/bili-banghui/key' && req.method === 'GET') {
            const k = existsSync(cfg.keyFile) ? readFileSync(cfg.keyFile, 'utf8').trim() : ''
            return sendJson(res, 200, {
              ok: true,
              hasKey: !!k,
              path: cfg.keyFile,
              masked: k ? `${k.slice(0, 4)}****${k.slice(-4)}` : '',
              apiBase: cfg.apiBase,
              model: cfg.model,
            })
          }
          if (path === '/api/bili-banghui/key' && req.method === 'POST') {
            const body = await readBody(req)
            if (body?.clear) {
              try {
                await atomicWrite(cfg.keyFile, '', 'utf8')
                return sendJson(res, 200, { ok: true, hasKey: false })
              } catch (e) { return sendJson(res, 200, { ok: false, error: String(e?.message ?? e) }) }
            }
            const key = String(body?.key || '').trim()
            if (!/^sk-[A-Za-z0-9]{16,}$/.test(key)) {
              return sendJson(res, 200, { ok: false, error: '格式不对：应以 sk- 开头，只含字母数字' })
            }
            try {
              await atomicWrite(cfg.keyFile, key, 'ascii')
              return sendJson(res, 200, { ok: true, hasKey: true, masked: `${key.slice(0, 4)}****${key.slice(-4)}` })
            } catch (e) {
              return sendJson(res, 200, { ok: false, error: String(e?.message ?? e) })
            }
          }

          // ── 已回 / 不回 状态 ──
          if (path === '/api/bili-banghui/state' && req.method === 'GET') {
            return sendJson(res, 200, { ok: true, muted: readMuted(), replied: [...readRepliedSet(join(dirname(cfg.personaFile), 'reply-log.md'))] })
          }
          if (path === '/api/bili-banghui/state' && req.method === 'POST') {
            const body = await readBody(req)
            const key = String(body?.key || '')
            if (!key.includes('|')) return sendJson(res, 200, { ok: false, error: 'key 不对' })
            const cur = new Set(readMuted())
            if (body?.muted) cur.add(key)
            else cur.delete(key)
            const ok = writeMuted([...cur])
            return sendJson(res, 200, { ok, muted: [...cur] })
          }

          // ── 以下需要凭证 ──
          const cred = readCred(cfg.credFile)
          if (!cred) return sendJson(res, 200, { ok: false, error: '未登录：请点右上角登录', items: [], rows: [] })
          const cookie = cookieOf(cred)

          if (req.method === 'POST' && path === '/api/bili-banghui/reply') {
            try {
              const body = await readBody(req)
              const bvid = String(body?.bvid || '')
              const root = Number(body?.root || 0)
              const rpid = Number(body?.rpid || 0)
              const text = String(body?.text || '').trim()
              if (!bvid || !text) return sendJson(res, 200, { ok: false, error: '缺少视频或正文' })
              if (text.length > 1000) return sendJson(res, 200, { ok: false, error: '超过 1000 字，B站 会截断' })
              if (!cred.bili_jct) return sendJson(res, 200, { ok: false, error: '凭证缺少 bili_jct，请重新扫码' })
              const now = Date.now()
              const guardKey = `${bvid}|${rpid}`
              if (now - (sendGuard.get(guardKey) || 0) < 30000) {
                return sendJson(res, 200, { ok: false, error: '这条刚回过，30 秒内不重复发' })
              }
              if (now - lastSendAt < 5000) {
                return sendJson(res, 200, { ok: false, error: '发得太快，缓 5 秒' })
              }
              const aid = await fetchAid(cookie, bvid)
              const form = new URLSearchParams({
                oid: String(aid), type: '1', root: String(root || rpid || 0),
                parent: String(rpid || 0), message: text, csrf: cred.bili_jct, plat: '1',
              })
              const r = await fetch('https://api.bilibili.com/x/v2/reply/add', {
                method: 'POST',
                headers: {
                  'User-Agent': UA, Cookie: cookie,
                  Referer: `https://www.bilibili.com/video/${bvid}`,
                  'content-type': 'application/x-www-form-urlencoded',
                },
                body: form,
              })
              const j = await r.json().catch(() => null)
              if (!j || j.code !== 0) {
                return sendJson(res, 200, { ok: false, error: `B站返回 ${j?.code ?? '?'}：${j?.message || '无响应'}` })
              }
              const newRpid = Number(j.data?.rpid) || 0
              sendGuard.set(guardKey, Date.now())
              lastSendAt = Date.now()
              // 语料回流：发出去的正文直接进 samples.jsonl，供以后提炼人设
              let sampled = false
              try {
                if (newRpid) {
                  const rec = {
                    rpid: newRpid,
                    oid: aid,
                    root: root || rpid || 0,
                    ctime: Math.floor(Date.now() / 1000),
                    text,
                    uri: `https://www.bilibili.com/video/${bvid}`,
                    bvid,
                    source: 'desk',
                  }
                  appendFileSync(join(dirname(cfg.personaFile), 'samples.jsonl'), JSON.stringify(rec) + '\n', 'utf8')
                  sampled = true
                }
              } catch { /* 语料写失败不影响发送 */ }
              const logged = appendReplyLog(join(dirname(cfg.personaFile), 'reply-log.md'), {
                bvid, name: String(body?.name || ''), rpid: rpid || root || 0, myRpid: newRpid,
              })
              return sendJson(res, 200, { ok: true, rpid: newRpid, logged, sampled })
            } catch (e) {
              return sendJson(res, 200, { ok: false, error: String(e?.message ?? e) })
            }
          }

          if (req.method === 'GET' && path === '/api/bili-banghui/me') {
            return sendJson(res, 200, { ok: true, me: await fetchMe(cookie) })
          }
          if (req.method === 'GET' && path === '/api/bili-banghui/replies') {
            const items = await fetchReplyList(cookie)
            const replied = readRepliedSet(join(dirname(cfg.personaFile), 'reply-log.md'))
            const muted = new Set(readMuted())
            const out = items.map((x) => ({
              ...x,
              replied: replied.has(Number(x.source)),
              muted: muted.has(`${x.bvid}|${x.root}|${x.mid}`),
            }))
            return sendJson(res, 200, { ok: true, items: out })
          }
          if (req.method === 'POST' && path === '/api/bili-banghui/draft') {
            try {
              const body = await readBody(req)
              const apiKey = existsSync(cfg.keyFile) ? readFileSync(cfg.keyFile, 'utf8').trim() : ''
              if (!apiKey) return sendJson(res, 200, { ok: false, error: `没找到 API key：${cfg.keyFile}` })

              const personaRaw = existsSync(cfg.personaFile)
                ? readFileSync(cfg.personaFile, 'utf8')
                : ''
              // 只取「语言 DNA / 反驳套路 / 话题语气」三段，避免整份档案稀释注意力
              const pStart = personaRaw.indexOf('## 三、')
              const pEnd = personaRaw.indexOf('## 六、')
              const persona = (pStart >= 0 && pEnd > pStart ? personaRaw.slice(pStart, pEnd) : personaRaw).slice(0, 5000)
              const rootText = String(body?.rootText || '')
              const mine = String(body?.mine || '')
              const his = String(body?.his || '')
              const name = String(body?.name || '')
              const single = String(body?.single || '')
              const singleTag = String(body?.tag || '')

              const system = [
                '你在替一位 B站 用户起草回复。必须完全模仿他（她）的人设和语气。',
                '',
                '对方态度已由前一步判定，见用户消息里的「对方态度」。严格按它写，不要自己改判。',
                '',
                '固定输出 3 条：',
                '- A：主选。最像本人、最稳，直接接住他这句话里的具体点。',
                '- B：变体。换一个角度或力度（更软/更硬/换论据）。',
                '- C：收尾。最短、最省事的一条；友善时就是更简短的附和或一句梗。',
                '',
                '语气规则：',
                '- 赞同：三条都顺着说/玩梗，禁止辩论和反问。',
                '- 友善：三条都轻快，接梗或回答。',
                '- 中立：三条都简短表态，不主动抬杠。',
                '- 抬杠：A 讲理、B 更硬、C 收尾。',
                '- 攻击：A 冷处理讲理、B 更硬、C 一句收尾或明显不想聊。',
                '',
                '输出格式：只输出一个 JSON 对象，不要解释、不要代码块：',
                '{"stance":"赞同|友善|中立|抬杠|攻击","candidates":[{"key":"A","tag":"定位·打法","text":"正文"}]}',
                '规则：',
                '1. 必须 3 条，key 依次为 A、B、C，不要多也不要少。',
                '2. text 为纯正文，不含「回复 @某人」，一般不超过 100 个汉字，1–2 个 [表情]。',
                '3. 赞同/友善时不要用「反问」「归谬」「免战牌」这类打法。',
                '4. 每条都必须先直接接住他最后一句话，再补一句；不许另起话题。',
                '5. 口语短句，像微信打字；不要堆连接词（说到底/说白了/换句话说/首先），不要书面腔。',
                '6. 不骂脏话、不问候家人、不碰政治地域性别、不透露账号、不提 AI。',
                '7. 不要用「确实」「你说得对」「有道理」开头凑数；除非他在陈述事实、你只是补一句。',
                '',
                '这是他的性格与语言习惯档案：',
                persona,
              ].join('\n')

              const history = Array.isArray(body?.history) ? body.history.slice(-8).map((x) => String(x)) : []

              // 第一步：先单独判定态度（小请求、低温度），避免一份 prompt 里既判又写导致跑偏
              let stance = '中立'
              try {
                const clsResp = await fetch(`${String(cfg.apiBase).replace(/\/$/, '')}/chat/completions`, {
                  method: 'POST',
                  headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
                  body: JSON.stringify({
                    model: cfg.model,
                    temperature: 0,
                    max_tokens: 8,
                    messages: [
                      { role: 'system', content: '判断这句回复对我的态度，只输出一个词：赞同、友善、中立、抬杠、攻击。反问/质问/否定我的判断=抬杠；带侮辱或嘲讽人格=攻击。' },
                      { role: 'user', content: `主楼：${rootText}\n我说过：${mine || '（无）'}\n他回我：“${his}”` },
                    ],
                  }),
                })
                const cls = await clsResp.json().catch(() => null)
                const word = String(cls?.choices?.[0]?.message?.content || '').trim()
                stance = ['赞同', '友善', '中立', '抬杠', '攻击'].find((s) => word.includes(s)) || '中立'
              } catch { /* 判不出来按中立 */ }

              const user = [
                `对方昵称：${name}`,
                `主楼原文：${rootText || '（无）'}`,
                history.length ? `最近对话（从早到晚）：\n${history.join('\n')}` : `我之前说的那条：${mine || '（无）'}`,
                '',
                `对方态度（已判定，必须按它写）：${stance}`,
                `他这次回我：“${his}”`,
                '先判断他的态度，再决定出几条、怎么写。只输出 JSON 对象。',
                '',
                single
                  ? `只出 1 条替换项：candidates 里只放 1 条，key 为 "${single}"，打法保持「${singleTag || '同风格'}」但换个说法。`
                  : '固定输出 3 条：A 主选、B 变体、C 收尾。',
              ].join('\n')

              const resp = await fetch(`${String(cfg.apiBase).replace(/\/$/, '')}/chat/completions`, {
                method: 'POST',
                headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
                body: JSON.stringify({
                  model: cfg.model,
                  temperature: 0.75,
                  max_tokens: 700,
                  messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
                }),
              })
              const js = await resp.json().catch(() => null)
              if (!resp.ok || !js) {
                return sendJson(res, 200, { ok: false, error: `模型接口 HTTP ${resp.status}：${js?.error?.message || '无响应'}` })
              }
              const content = String(js.choices?.[0]?.message?.content || '')
              const oStart = content.indexOf('{')
              const oEnd = content.lastIndexOf('}')
              const aStart = content.indexOf('[')
              const aEnd = content.lastIndexOf(']')
              let parsed = null
              let arr = null
              if (oStart >= 0 && oEnd > oStart) {
                try { parsed = JSON.parse(content.slice(oStart, oEnd + 1)) } catch { /* 兜底走数组 */ }
              }
              if (parsed && Array.isArray(parsed.candidates)) {
                arr = parsed.candidates
              } else if (aStart >= 0 && aEnd > aStart) {
                try { arr = JSON.parse(content.slice(aStart, aEnd + 1)) } catch { /* 下面兜 */ }
              }
              if (!Array.isArray(arr) || !arr.length) {
                return sendJson(res, 200, { ok: false, error: '模型没有返回可解析的候选', raw: content.slice(0, 300) })
              }
              const candidates = arr.slice(0, 3).map((c, i) => ({
                key: String(c?.key || 'ABC'[i] || 'A'),
                tag: String(c?.tag || ''),
                text: String(c?.text || '').trim(),
              })).filter((c) => c.text)
              return sendJson(res, 200, { ok: true, stance, candidates })
            } catch (e) {
              return sendJson(res, 200, { ok: false, error: String(e?.message ?? e) })
            }
          }
          if (req.method === 'GET' && path === '/api/bili-banghui/thread') {
            const t = await fetchThread(cookie, {
              bvid: String(url.searchParams.get('bvid') || ''),
              root: Number(url.searchParams.get('root') || 0),
              fresh: Number(url.searchParams.get('fresh') || 0) > 0,
            })
            return sendJson(res, 200, { ok: true, rows: t.rows, root: t.root, title: t.title })
          }
          return sendJson(res, 404, { ok: false, error: `unknown ${req.method} ${path}` })
        } catch (e) {
          sendJson(res, 500, { ok: false, error: String(e?.message ?? e) })
        }
      },
    }))
  }

  return () => {
    for (const d of disposers) { try { d?.() } catch { /* 兜住 */ } }
  }
}
