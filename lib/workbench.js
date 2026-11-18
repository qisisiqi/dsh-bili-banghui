/**
 * B站帮回数据层（只读）
 *   列表：x/msgfeed/reply（回复我的），按「人 × 楼层」聚合
 *   楼层：x/v2/reply/reply（按 root 拉整层子回复）
 *   我：x/web-interface/nav（头像、昵称、mid）
 * 只发 GET，不写任何数据。
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const REFERER = 'https://www.bilibili.com/'

const REPLY_FEED = 'https://api.bilibili.com/x/msgfeed/reply?platform=web&build=0&mobi_app=web'
const VIEW_API = 'https://api.bilibili.com/x/web-interface/view?bvid='
const SUB_REPLY = 'https://api.bilibili.com/x/v2/reply/reply?type=1'
const NAV_API = 'https://api.bilibili.com/x/web-interface/nav'

const getJson = async (url, cookie) => {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Referer: REFERER, Cookie: cookie || '' } })
  if (!res.ok) throw new Error(`B站接口 HTTP ${res.status}`)
  const json = await res.json().catch(() => null)
  if (!json) throw new Error('B站接口返回空')
  if (json.code !== 0) throw new Error(`B站接口 code ${json.code}${json.message ? '：' + json.message : ''}`)
  return json.data
}

const bvidOf = (uri) => {
  const m = /\/video\/(BV[0-9A-Za-z]+)/.exec(String(uri || ''))
  return m ? m[1] : ''
}

/** 去掉 B站 自动加的「回复 @某人：」前缀 */
const stripMention = (s) => String(s || '').replace(/^回复\s*@[^：:]{1,40}[：:]\s*/, '')

/** 我：昵称、头像、mid */
export async function fetchMe(cookie) {
  const data = await getJson(NAV_API, cookie)
  return {
    mid: Number(data?.mid) || 0,
    uname: String(data?.uname || ''),
    face: String(data?.face || ''),
  }
}

/** 回复我的 → 按「人 × 楼层」聚合（同一人同一层只留最新一条，带条数） */
export async function fetchReplyList(cookie) {
  const data = await getJson(REPLY_FEED, cookie)
  const items = Array.isArray(data?.items) ? data.items : []
  const flat = items
    .map((it) => {
      const u = it.user || {}
      const x = it.item || {}
      return {
        notifId: it.id,
        name: u.nickname || '',
        avatar: u.avatar || '',
        mid: u.mid || 0,
        time: it.reply_time ? it.reply_time * 1000 : 0,
        text: stripMention(x.source_content),
        mine: stripMention(x.target_reply_content),
        rootText: String(x.root_reply_content || ''),
        bvid: bvidOf(x.uri) || bvidOf(x.native_uri),
        root: Number(x.root_id) || 0,
        source: Number(x.source_id) || 0,
        target: Number(x.target_id) || 0,
        uri: x.uri || '',
      }
    })
    .filter((x) => x.name && x.text && x.bvid && x.root)

  // 一行 = 「某人在某一层」：同一人在同层的多次回复并成一条会话，换人就另起
  const byConv = new Map()
  for (const x of flat) {
    const key = `${x.bvid}|${x.root}|${x.mid}`
    const cur = byConv.get(key)
    if (!cur) {
      byConv.set(key, { ...x, count: 1 })
    } else {
      cur.count += 1
      if (x.time > cur.time) Object.assign(cur, x, { count: cur.count })
    }
  }
  return [...byConv.values()].sort((a, b) => b.time - a.time)
}

/** bvid → {aid, title}（10 分钟内复用） */
const videoCache = new Map()
export async function fetchVideoMeta(cookie, bvid) {
  const hit = videoCache.get(bvid)
  if (hit && Date.now() - hit.at < 600000) return hit.meta
  const data = await getJson(VIEW_API + encodeURIComponent(bvid), cookie)
  const aid = Number(data?.aid) || 0
  if (!aid) throw new Error('拿不到该视频的 aid')
  const meta = { aid, title: String(data?.title || '') }
  videoCache.set(bvid, { at: Date.now(), meta })
  return meta
}

/** 兼容旧调用：只要 aid */
export async function fetchAid(cookie, bvid) {
  const meta = await fetchVideoMeta(cookie, bvid)
  return meta.aid
}

/** 按楼层根拉整层子回复：从最新一页往回拉，够用就停（同楼层 60 秒内复用） */
const threadCache = new Map()
const MAX_PAGES = 20

export async function fetchThread(cookie, { bvid, root, fresh = false, target = 0 }) {
  if (!bvid || !root) throw new Error('缺少 bvid 或楼层')
  const want = Number(target) || 0
  const cacheKey = `${bvid}|${root}|${want}`
  if (fresh) threadCache.delete(cacheKey)
  const hit = threadCache.get(cacheKey)
  if (hit && Date.now() - hit.at < 60000) return hit.data
  const meta = await fetchVideoMeta(cookie, bvid)
  const aid = meta.aid
  const base = `${SUB_REPLY}&oid=${aid}&root=${Number(root)}&ps=20`
  const first = await getJson(`${base}&pn=1`, cookie)
  const total = Number(first?.page?.count) || 0
  // B站 这层是正序分页：pn=1 最早，pn 越大越新。超过上限时保留最新的一段。
  const totalPages = Math.max(Math.ceil(total / 20), 1)
  const pages = Math.min(totalPages, MAX_PAGES)
  const startPage = totalPages - pages + 1
  const truncated = startPage > 1

  const collected = new Map()
  const add = (data) => {
    for (const r of Array.isArray(data?.replies) ? data.replies : []) collected.set(r.rpid, r)
  }
  if (startPage === 1) add(first)

  const found = () => want > 0 && collected.has(want)
  if (pages > 1) {
    const order = []
    for (let pn = totalPages; pn >= Math.max(startPage, 2); pn -= 1) order.push(pn)
    for (let i = 0; i < order.length; i += 3) {
      const chunk = order.slice(i, i + 3)
      const got = await Promise.all(chunk.map((pn) => getJson(`${base}&pn=${pn}`, cookie).catch(() => null)))
      for (const d of got) add(d)
      // 楼层太长被截断时才提前停：已经拿到要回的那条就不用继续往回翻
      if (truncated && found()) break
    }
  }

  const rows = [...collected.values()].map((r) => ({
    rpid: r.rpid,
    name: r.member?.uname || '',
    avatar: r.member?.avatar || '',
    mid: r.mid || 0,
    time: (Number(r.ctime) || 0) * 1000,
    text: stripMention(r.content?.message),
    target: Number(r.parent) || 0,
  }))
  rows.sort((a, b) => a.time - b.time)

  const r0 = first?.root
  const rootInfo = r0
    ? {
        mid: r0.mid || 0,
        name: r0.member?.uname || '',
        avatar: r0.member?.avatar || '',
        text: stripMention(r0.content?.message),
        time: (Number(r0.ctime) || 0) * 1000,
      }
    : null

  const data = { rows, root: rootInfo, title: meta.title, truncated }
  threadCache.set(cacheKey, { at: Date.now(), data })
  return data
}
