/**
 * dsh-bili-banghui —— Client 半部
 * 注册：sidebar.panellist（图标）+ main（B站帮回）
 * 右上角：账号头像 → 菜单（人设档案 / 重新扫码）
 */
window.__ModuleLoader__.load({
  id: 'dsh-bili-banghui',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const PANEL_ID = 'bili-banghui'
    const TAG_ID = 'dsh-bili-banghui/desk.css'
    const T = { title: 'B站帮回', subtitle: '按人×楼层聚合「回复我的」' }

    // 轮询间隔档位（毫秒，文案）
    const POLL_OPTS = [
      [0, '不轮询'],
      [600000, '10 分钟'], [1200000, '20 分钟'], [1800000, '30 分钟'],
      [3600000, '1 小时'], [7200000, '2 小时'], [10800000, '3 小时'],
      [14400000, '4 小时'], [18000000, '5 小时'], [21600000, '6 小时'],
      [25200000, '7 小时'], [28800000, '8 小时'],
    ]
    const readPoll = () => {
      const raw = localStorage.getItem('bd-poll')
      if (raw === null) return 0
      const v = Number(raw)
      return POLL_OPTS.some(([ms]) => ms === v) ? v : 0
    }

    // 看过哪几条（打开过就算），轮询不再推这些
    // 自动清理：多少天没新回复就不在列表里显示（只影响显示，不动 B站）
    const readTtl = () => {
      const v = Number(localStorage.getItem('bd-ttl') || 0)
      return [0, 30, 60, 90, 180].includes(v) ? v : 0
    }

    const readSeen = () => {
      try {
        const arr = JSON.parse(localStorage.getItem('bd-seen') || '[]')
        return new Set(Array.isArray(arr) ? arr.map(Number) : [])
      } catch { return new Set() }
    }
    const markSeen = (notifId) => {
      const id = Number(notifId) || 0
      if (!id) return
      const seen = readSeen()
      if (seen.has(id)) return
      seen.add(id)
      localStorage.setItem('bd-seen', JSON.stringify([...seen].slice(-300)))
    }

    // 表情代码 → 图片；字数按「看得见的字」算，一个 [doge] 算 1 个字
    const EMOTE_RE = /\[[^\[\]\n]{1,12}\]/g
    const countChars = (t) => String(t || '').replace(EMOTE_RE, 'x').length
    const renderRich = (text, map) => {
      const s = String(text || '')
      if (!map || !s.includes('[')) return s
      const out = []
      let last = 0
      const re = /\[[^\[\]\n]{1,12}\]/g
      let m
      while ((m = re.exec(s))) {
        if (m.index > last) out.push(s.slice(last, m.index))
        const url = map[m[0]]
        if (url) out.push(h('img', { key: `e${m.index}`, className: 'bd-emote-inline', src: url, alt: m[0], loading: 'lazy' }))
        else out.push(m[0])
        last = m.index + m[0].length
      }
      if (last < s.length) out.push(s.slice(last))
      return out
    }

    const STYLE = `
      .bd{--bg:var(--dsw-alias-bg-base,#fff);--l1:var(--dsw-alias-bg-layer-1,#f7f8fa);--l2:var(--dsw-alias-bg-layer-2,#fff);--l3:var(--dsw-alias-bg-layer-3,#eef0f3);--bd:var(--dsw-alias-border-l1,#e5e7eb);--tx:var(--dsw-alias-label-primary,#1f2328);--tx2:var(--dsw-alias-label-secondary,#5b6470);--tx3:var(--dsw-alias-label-caption,#8b939e);--acc:#fb7299;
        color:var(--tx);font-size:13px;line-height:1.5}
      .bd *{box-sizing:border-box}
      .bd-page{padding:22px 24px 40px;max-width:1320px;margin:0 auto}
      .bd-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:12px;position:relative}
      .bd-title{margin:0;font-size:16px;font-weight:600}
      .bd-sub{margin:3px 0 0;font-size:12px;color:var(--tx3)}
      .bd-tools{display:flex;align-items:center;gap:9px}
      .bd-tabs{display:flex;gap:2px;border-radius:8px;background:var(--l3);padding:2px}
      .bd-tab{border:0;background:transparent;color:var(--tx2);font:inherit;font-size:12px;padding:4px 10px;border-radius:6px;cursor:pointer}
      .bd-tab[aria-selected="true"]{background:var(--l2);color:var(--tx);box-shadow:0 1px 2px rgba(0,0,0,.08)}
      .bd-btn{border:1px solid var(--bd);background:transparent;color:var(--tx2);font:inherit;font-size:12px;padding:5px 11px;border-radius:8px;cursor:pointer}
      .bd-btn:hover{color:var(--tx)}
      .bd-user{position:relative}
      .bd-user-btn{display:flex;align-items:center;gap:7px;border:1px solid var(--bd);background:transparent;border-radius:99px;padding:3px 9px 3px 3px;cursor:pointer;color:var(--tx)}
      .bd-user-btn:hover{background:var(--l3)}
      .bd-user-btn img{width:24px;height:24px;border-radius:50%;object-fit:cover;display:block}
      .bd-user-name{font-size:12px;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .bd-menu{position:absolute;right:0;top:38px;z-index:30;min-width:200px;background:var(--l2);border:1px solid var(--bd);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.16);padding:6px}
      .bd-menu-head{padding:7px 9px 8px;border-bottom:1px solid var(--bd);margin-bottom:4px}
      .bd-menu-name{font-size:12.5px;font-weight:600}
      .bd-menu-sub{font-size:11px;color:var(--tx3);margin-top:2px}
      .bd-menu-item{display:block;width:100%;text-align:left;border:0;background:transparent;color:var(--tx);font:inherit;font-size:12.5px;padding:7px 9px;border-radius:7px;cursor:pointer}
      .bd-menu-item:hover{background:var(--l3)}
      .bd-menu-sep{border-top:1px solid var(--bd);margin:6px 0}
      .bd-menu-label{font-size:10.5px;color:var(--tx3);padding:2px 9px 4px}
      .bd-menu-select{width:calc(100% - 12px);margin:0 6px 6px;background:var(--l2);border:1px solid var(--bd);border-radius:7px;color:var(--tx);font:12px/1.6 inherit;padding:5px 7px}
      .bd-list-abs{position:absolute;top:7px;right:9px;z-index:2}
      .bd-clear-list{font-size:10.5px;line-height:1;padding:3px 7px;border-radius:99px;background:var(--l1)}
      .bd-warn{margin-bottom:10px;padding:8px 12px;border-radius:8px;border:1px solid rgba(251,114,153,.4);background:rgba(251,114,153,.08);color:var(--tx2);font-size:12px}
      .bd-grid{display:grid;grid-template-columns:300px 1fr;gap:12px;height:min(700px,calc(100dvh - 250px));min-height:380px}
      .bd-list{position:relative;border:1px solid var(--bd);border-radius:10px;background:var(--l1);overflow:auto;min-height:0}
      .bd-group{position:sticky;top:0;z-index:1;padding:7px 11px 5px;font-size:10.5px;color:var(--tx3);background:var(--l1);border-bottom:1px solid var(--bd)}
      .bd-row{display:grid;grid-template-columns:46px 1fr;gap:9px;width:100%;text-align:left;border:0;border-bottom:1px solid var(--bd);background:transparent;color:inherit;padding:10px 11px;cursor:pointer}
      .bd-row:hover{background:var(--l3)}
      .bd-row[aria-selected="true"]{background:var(--l2);box-shadow:inset 2px 0 0 var(--acc)}
      .bd-ava{position:relative;width:34px;height:34px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:var(--l3);color:var(--tx3);font-size:13px;flex:0 0 auto;border:1px solid var(--bd)}
      .bd-ava img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
      .bd-ava.s{width:22px;height:22px;font-size:10px;margin-right:-8px;border:1.5px solid var(--l1);z-index:1}
      .bd-ava.s:last-of-type{margin-right:0}
      .bd-nm{display:flex;gap:6px;align-items:baseline;font-size:12.5px;font-weight:600;min-width:0}
      .bd-nm>span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .bd-tm{margin-left:auto;font-size:10.5px;font-weight:400;color:var(--tx3);white-space:nowrap;font-variant-numeric:tabular-nums}
      .bd-sn{margin-top:2px;font-size:11.5px;line-height:17px;color:var(--tx2);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .bd-meta{display:flex;gap:6px;margin-top:5px;flex-wrap:wrap}
      .bd-tag{font-size:10px;line-height:1;padding:3px 6px;border-radius:99px;background:var(--l3);color:var(--tx3)}
      .bd-tag.hot{background:rgba(251,114,153,.12);color:#e4688d}
      .bd-tag.ok{background:rgba(79,192,141,.12);color:#3f9d76}
      .bd-row-mute{margin-left:auto;border:1px solid var(--bd);background:transparent;color:var(--tx3);font:inherit;font-size:10px;line-height:1;padding:3px 7px;border-radius:99px;cursor:pointer}
      .bd-row-mute:hover{color:var(--tx);border-color:var(--tx3)}
      .bd-chat{border:1px solid var(--bd);border-radius:10px;background:var(--l1);display:flex;flex-direction:column;min-height:0}
      .bd-chat-head{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--bd)}
      .bd-bv{font-size:10.5px;color:var(--tx3);border:1px solid var(--bd);border-radius:99px;padding:2px 7px}
      .bd-vt{font-size:11.5px;color:var(--tx3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:56%}
      .bd-root-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}
      .bd-root-name{font-size:12.5px;font-weight:600;color:var(--tx)}
      .bd-root-time{font-size:10.5px;color:var(--tx3)}
      .bd-body{flex:1;overflow:auto;padding:14px;min-height:0}
      .bd-root{background:var(--l2);border:1px solid var(--bd);border-radius:10px;padding:10px 12px;margin-bottom:14px}
      .bd-root-text{font-size:12.5px;line-height:19px;white-space:pre-wrap;word-break:break-word;color:var(--tx2)}
      .bd-sn.strong{color:var(--tx);font-weight:500}
      .bd-msg{display:flex;gap:8px;margin-bottom:12px;align-items:flex-start;width:100%}
      .bd-msg.me{flex-direction:row-reverse}
      .bd-wrap{max-width:70%;min-width:0}
      .bd-bub{background:var(--l2);border:1px solid var(--bd);border-radius:10px;padding:8px 11px;font-size:12.5px;line-height:19px;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere}
      .bd-msg.me .bd-bub{background:rgba(251,114,153,.08);border-color:rgba(251,114,153,.35)}
      .bd-who{font-size:10.5px;color:var(--tx3);margin-bottom:3px;display:flex;gap:6px}
      .bd-msg.me .bd-who{flex-direction:row-reverse}
      .bd-branch{margin:2px 0 12px;padding:7px 11px;border-radius:8px;border:1px dashed var(--bd);background:transparent;color:var(--tx3);font-size:11.5px;cursor:pointer;width:100%;text-align:left}
      .bd-branch:hover{color:var(--tx2);border-color:var(--tx3)}
      .bd-others{margin-top:6px;padding-left:8px;border-left:2px solid var(--bd)}
      .bd-other{font-size:11.5px;line-height:18px;color:var(--tx3);margin:6px 0}
      .bd-other b{color:var(--tx2);font-weight:600}
      .bd-note{padding:9px 14px;border-top:1px solid var(--bd);font-size:11px;color:var(--tx3)}
      .bd-composer{padding:10px 12px;border-top:1px solid var(--bd);background:var(--l1)}
      .bd-comp-box{position:relative}
      .bd-comp-ta{width:100%;resize:vertical;background:var(--l2);border:1px solid var(--bd);border-radius:8px;color:var(--tx);font:12.5px/1.6 inherit;padding:7px 66px 7px 9px}
      .bd-comp-count{position:absolute;right:10px;bottom:8px;font-size:10.5px;color:var(--tx3);pointer-events:none}
      .bd-comp-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}
      .bd-cand-swap{margin-left:auto;font-size:10.5px;color:var(--tx3);border:1px solid var(--bd);background:transparent;border-radius:6px;padding:2px 7px;cursor:pointer;font-family:inherit}
      .bd-cand-swap:hover{color:var(--tx);border-color:var(--tx3)}
      .bd-cand-swap:disabled{opacity:.45;cursor:default}
      .bd-comp-err{font-size:11.5px;color:#e5647d;margin-top:6px}
      .bd-comp-hint{font-size:10.5px;color:var(--tx3);margin-top:6px}
      .bd-cands{display:flex;flex-direction:column;gap:6px;margin-bottom:9px;max-height:30vh;overflow:auto}
      .bd-cands-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11px;color:var(--tx3);margin-bottom:6px}
      .bd-cands-close{border:0;background:transparent;color:var(--tx3);font-size:16px;line-height:1;cursor:pointer;padding:0 5px;border-radius:6px}
      .bd-cands-close:hover{background:var(--l3);color:var(--tx)}
      .bd-emoji-wrap{border:1px solid var(--bd);border-radius:9px;background:var(--l2);margin-bottom:8px;overflow:hidden}
      .bd-emoji-tabs{display:flex;gap:2px;padding:5px 6px;border-bottom:1px solid var(--bd);overflow-x:auto;background:var(--l1)}
      .bd-emoji-tab{border:0;background:transparent;color:var(--tx3);font:inherit;font-size:11px;padding:3px 8px;border-radius:6px;cursor:pointer;white-space:nowrap}
      .bd-emoji-tab.on{background:var(--l2);color:var(--tx)}
      .bd-emoji{max-height:24vh;overflow:auto;padding:6px;display:grid;grid-template-columns:repeat(auto-fill,minmax(42px,1fr));gap:4px}
      .bd-emoji-item{border:1px solid transparent;background:transparent;padding:3px;border-radius:6px;cursor:pointer;display:grid;place-items:center;min-height:36px}
      .bd-emoji-item:hover{background:var(--l3);border-color:var(--bd)}
      .bd-emoji-item img{width:28px;height:28px;object-fit:contain;display:block}
      .bd-stance{font-size:11px;color:var(--tx3);margin-bottom:6px}
      .bd-stance b{color:var(--acc);margin-left:2px;font-weight:600}
      .bd-cand{text-align:left;background:var(--l2);border:1px solid var(--bd);border-radius:9px;padding:8px 11px;cursor:pointer;color:inherit}
      .bd-cand:hover{border-color:var(--acc);background:var(--l3)}
      .bd-cand-head{display:flex;align-items:baseline;gap:7px;margin-bottom:3px;font-size:10.5px;color:var(--tx3)}
      .bd-cand-head b{color:var(--acc);font-size:12.5px}
      .bd-cand-tag{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .bd-cand-len{white-space:nowrap}
      .bd-emote-inline{height:17px;width:auto;vertical-align:-3px;margin:0 1px;border-radius:3px}
      .bd-cand-text{font-size:13px;line-height:19px;color:var(--tx)}
      .bd-empty{padding:14px;font-size:12px;color:var(--tx3)}
      .bd-mask{position:fixed;inset:0;background:rgba(0,0,0,.45);display:grid;place-items:center;z-index:9999;padding:20px}
      .bd-modal{width:min(760px,92vw);max-height:88vh;display:flex;flex-direction:column;background:var(--l2);border:1px solid var(--bd);border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden}
      .bd-modal-head{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--bd)}
      .bd-modal-title{font-size:14px;font-weight:600}
      .bd-modal-body{padding:14px 16px;overflow:auto;min-height:0}
      .bd-modal-foot{display:flex;gap:8px;justify-content:flex-end;padding:10px 16px;border-top:1px solid var(--bd);background:var(--l1)}
      .bd-qr{width:220px;height:220px;display:block;margin:0 auto;border-radius:10px;background:#fff;padding:8px}
      .bd-qr-state{text-align:center;font-size:12.5px;color:var(--tx2);margin-top:12px}
      .bd-ta{width:100%;height:46vh;min-height:260px;resize:vertical;background:var(--l1);border:1px solid var(--bd);border-radius:8px;color:var(--tx);font:12px/1.6 ui-monospace,Consolas,monospace;padding:10px}
      .bd-suggest{margin-top:10px;border:1px dashed var(--bd);border-radius:8px;padding:8px 10px;background:var(--l1)}
      .bd-suggest-head{font-size:11px;color:var(--tx3);margin-bottom:4px}
      .bd-suggest-body{margin:0;font-size:12px;line-height:19px;white-space:pre-wrap;color:var(--tx);max-height:24vh;overflow:auto}
      .bd-suggest-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}
      .bd-confirm-text{white-space:pre-wrap;word-break:break-word;font-size:13px;line-height:20px;background:var(--l1);border:1px solid var(--bd);border-radius:8px;padding:10px 12px;max-height:36vh;overflow:auto}
      .bd-path{font-size:11px;color:var(--tx3);margin-bottom:8px;word-break:break-all}
      .bd-set-row{display:grid;grid-template-columns:52px 1fr;align-items:center;gap:12px;font-size:13.5px;margin:10px 0}
      .bd-set-row>select,.bd-set-row>input{width:100%;min-width:0;margin:0}
      .bd-set-label{color:var(--tx2);font-size:13px;white-space:nowrap;text-align:left}
      .bd-set-val{color:var(--tx);word-break:break-all;font-size:13.5px}
      .bd-set-hint{margin:-4px 0 8px 64px;font-size:12.5px;line-height:1.7;color:var(--tx3)}
      .bd-inp{width:100%;margin-top:12px;background:var(--l1);border:1px solid var(--bd);border-radius:8px;color:var(--tx);font:12.5px/1.5 inherit;padding:8px 10px}
      .bd-primary{border:1px solid var(--acc);background:var(--acc);color:#fff;font:inherit;font-size:12px;padding:6px 14px;border-radius:8px;cursor:pointer}
      .bd-primary:disabled{opacity:.5;cursor:not-allowed}
      .bd-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:var(--l2);border:1px solid var(--bd);border-radius:9px;padding:8px 14px;font-size:12.5px;z-index:10000;box-shadow:0 8px 24px rgba(0,0,0,.2)}
      .bd-msg.to-me .bd-bub{border-color:rgba(251,114,153,.5)}
      .bd-select{border:1px solid var(--bd);background:transparent;color:var(--tx2);font:inherit;font-size:12px;padding:5px 8px;border-radius:8px;cursor:pointer}
      .bd-note-toast{position:fixed;right:20px;bottom:20px;z-index:10001;max-width:320px;background:#23262b;color:#e8eaed;border:1px solid #3a3f46;border-radius:10px;box-shadow:0 12px 36px rgba(0,0,0,.35);padding:10px 13px;cursor:pointer}
      @media (max-width:820px){.bd-grid{grid-template-columns:1fr;height:auto}.bd-chat{height:60vh;min-height:320px}.bd-page{padding:16px 14px 32px}.bd-wrap{max-width:84%}}
    `

    function ensureStyle() {
      if (typeof document === 'undefined') return
      if (document.querySelector(`style[data-plugin-css="${TAG_ID}"]`)) return
      const tag = document.createElement('style')
      tag.dataset.plugin = 'dsh-bili-banghui'
      tag.dataset.pluginCss = TAG_ID
      tag.textContent = STYLE
      document.head.appendChild(tag)
    }

    const API = '/api/bili-banghui'
    const apiJson = async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(`HTTP ${res.status}${body?.error ? '：' + body.error : ''}`)
      }
      return res.json()
    }
    const apiGet = (p) => fetch(API + p, { headers: { accept: 'application/json' } }).then(apiJson)
    const apiPost = (p, body) => fetch(API + p, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body || {}),
    }).then(apiJson)

    function usePoll(load, ms) {
      const [data, setData] = React.useState(null)
      const [error, setError] = React.useState('')
      const tick = React.useCallback(async () => {
        try {
          const v = await load()
          setData(v)
          setError('')
          return v
        } catch (e) {
          setError(String(e?.message ?? e))
          return null
        }
      }, [load])
      React.useEffect(() => {
        let alive = true
        let timer = null
        const run = () => { if (alive) tick() }
        const start = () => {
          run()
          if (timer) clearInterval(timer)
          timer = ms > 0 ? setInterval(run, ms) : null
        }
        const onVis = () => { if (document.hidden) { if (timer) clearInterval(timer); timer = null } else start() }
        start()
        document.addEventListener('visibilitychange', onVis)
        return () => {
          alive = false
          if (timer) clearInterval(timer)
          document.removeEventListener('visibilitychange', onVis)
        }
      }, [tick, ms])
      return { data, error, refresh: tick }
    }

    const pad2 = (n) => String(n).padStart(2, '0')
    const fmt = (ms) => {
      if (!ms) return '—'
      const d = new Date(ms)
      return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
    }
    const dayOf = (ms) => {
      const d = new Date(ms)
      const now = new Date()
      const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
      const diff = Math.round((start(now) - start(d)) / 86400000)
      if (diff === 0) return '今天'
      if (diff === 1) return '昨天'
      return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
    }

    const Ava = ({ src, name, size }) => h('span', {
      className: 'bd-ava',
      style: size ? { width: size, height: size } : undefined,
    }, (name || '?').slice(0, 1),
      src ? h('img', { src, alt: '', onError: (e) => { e.currentTarget.style.display = 'none' } }) : null)

    /* ── 登录弹窗 ── */
    function LoginModal({ onClose, onDone, toast }) {
      const [qr, setQr] = React.useState('')
      const [qrUrl, setQrUrl] = React.useState('')
      const [key, setKey] = React.useState('')
      const [state, setState] = React.useState('loading')
      const [error, setError] = React.useState('')

      React.useEffect(() => {
        let alive = true
        apiPost('/login/start').then((r) => {
          if (!alive) return
          if (!r?.ok) { setState('error'); setError(r?.error || '生成二维码失败'); return }
          setQr(r.qr || '')
          setQrUrl(r.url || '')
          setKey(r.key || '')
          setState('waiting')
        }).catch((e) => { setState('error'); setError(String(e?.message ?? e)) })
        return () => { alive = false }
      }, [])

      React.useEffect(() => {
        if (!key) return
        let alive = true
        let n = 0
        const MAX_POLLS = 95   // 95 × 2s ≈ 190s，覆盖 B站 二维码有效期
        const timer = setInterval(async () => {
          if (!alive) return
          n += 1
          if (n > MAX_POLLS) { clearInterval(timer); setState('expired'); return }
          try {
            const r = await apiGet(`/login/poll?key=${encodeURIComponent(key)}`)
            if (!alive) return
            if (r?.state === 'done') { clearInterval(timer); onDone() }
            else if (r?.state === 'scanned') setState('scanned')
            else if (r?.state === 'expired') { clearInterval(timer); setState('expired') }
            else if (r?.state === 'error') { clearInterval(timer); setState('error'); setError(r.error || '登录失败') }
          } catch { /* 网络抖动忽略 */ }
        }, 2000)
        return () => { alive = false; clearInterval(timer) }
      }, [key, onDone])

      const text = state === 'loading' ? '正在生成二维码…'
        : state === 'scanned' ? '已扫码，请在手机上点「确认登录」'
        : state === 'expired' ? '二维码过期了，关掉重开一次'
        : state === 'error' ? (error || '出错了')
        : '用 B站 App 扫码登录'

      return h('div', { className: 'bd-mask', onClick: (e) => { if (e.target === e.currentTarget) onClose() } },
        h('div', { className: 'bd-modal', style: { width: 320 } },
          h('div', { className: 'bd-modal-head' },
            h('span', { className: 'bd-modal-title' }, '扫码登录'),
            h('span', { style: { marginLeft: 'auto' } }, h('button', { className: 'bd-btn', onClick: onClose }, '关闭'))),
          h('div', { className: 'bd-modal-body' },
            qr ? h('img', { className: 'bd-qr', src: `data:image/png;base64,${qr}`, alt: '登录二维码' })
              : (qrUrl
                  ? h('div', { className: 'bd-empty', style: { textAlign: 'center' } },
                      '二维码图片生成失败，', h('a', { href: qrUrl, target: '_blank', rel: 'noreferrer', style: { color: 'var(--acc)' } }, '点这里用浏览器打开登录链接'))
                  : h('div', { className: 'bd-empty', style: { textAlign: 'center' } }, state === 'loading' ? '生成中…' : '没有二维码')),
            h('div', { className: 'bd-qr-state' }, text))))
    }

    /* ── 人设档案弹窗 ── */
    function PersonaModal({ onClose, toast }) {
      const [text, setText] = React.useState('')
      const [path, setPath] = React.useState('')
      const [mtime, setMtime] = React.useState(0)
      const [dirty, setDirty] = React.useState(false)
      const [busy, setBusy] = React.useState(false)
      const [samples, setSamples] = React.useState(0)
      const [samplesNew, setSamplesNew] = React.useState(0)
      const [askTemplate, setAskTemplate] = React.useState(false)
      const [askReload, setAskReload] = React.useState(false)
      const [used, setUsed] = React.useState(null)
      const [suggest, setSuggest] = React.useState('')
      const [suggesting, setSuggesting] = React.useState(false)
      const fileRef = React.useRef(null)

      const load = React.useCallback(() => {
        apiGet('/persona').then((r) => {
          if (!r?.ok) { toast(r?.error || '读取失败'); return }
          setText(r.text || ''); setPath(r.path || ''); setMtime(r.mtime || 0); setDirty(false)
          setSamples(Number(r.samples) || 0); setSamplesNew(Number(r.samplesNew) || 0)
          setUsed({ chars: Number(r.excerptChars) || 0, total: Number(r.totalChars) || 0, sections: Array.isArray(r.sections) ? r.sections : [] })
        })
      }, [toast])
      React.useEffect(() => { load() }, [load])

      const runSuggest = async () => {
        if (suggesting) return
        setSuggesting(true)
        const r = await apiPost('/persona/suggest', {}).catch((e) => ({ ok: false, error: String(e?.message ?? e) }))
        setSuggesting(false)
        if (!r?.ok) { toast(r?.error || '总结失败'); return }
        setSuggest(r.text || '')
        setSamplesNew(0)
      }
      const applySuggest = () => {
        if (!suggest.trim()) return
        const d = new Date()
        const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        setText((t) => `${t.replace(/\s+$/, '')}\n\n## 自动归纳（${stamp}）\n\n${suggest.trim()}\n`)
        setDirty(true)
        setSuggest('')
        toast('已追加到档案，记得点「保存」')
      }

      const save = async () => {
        setBusy(true)
        const r = await apiPost('/persona', { text })
        setBusy(false)
        if (r?.ok) { setDirty(false); setMtime(Date.now()); toast(`已保存（${r.bytes} 字节）`) }
        else toast(r?.error || '保存失败')
      }
      const onPick = (e) => {
        const f = e.target.files?.[0]
        if (!f) return
        const reader = new FileReader()
        reader.onload = () => { setText(String(reader.result || '')); setDirty(true); toast(`已导入 ${f.name}，记得点保存`) }
        reader.readAsText(f, 'utf-8')
        e.target.value = ''
      }

      return h('div', { className: 'bd-mask', onClick: (e) => { if (e.target === e.currentTarget) onClose() } },
        h('div', { className: 'bd-modal' },
          h('div', { className: 'bd-modal-head' },
            h('span', { className: 'bd-modal-title' }, '人设档案'),
            h('button', { className: 'bd-btn', style: { marginLeft: 'auto' }, onClick: onClose }, '关闭')),
          h('div', { className: 'bd-modal-body' },
            h('div', { className: 'bd-path', style: { fontSize: 14, lineHeight: 1.85, color: 'var(--tx)' } },
              '这里写你怎么说话、什么立场、爱用哪些词，AI 回消息时会照着学。',
              h('div', { style: { marginTop: 4 } }, '用 ## 分段读得更准；不分段就整篇读，最多读 6000 字左右，重要的往前放。'),
              h('div', { style: { marginTop: 4 } }, '不会写就点「插入模板」照着改；写过的内容想补充，点「从回复总结语料」让它自己从你发过的话里总结。'),
              !text.trim()
                ? h('div', { style: { marginTop: 4 } }, '现在还是空的：不写也能用，只是 AI 不知道你的口气。')
                : null),
            h('textarea', {
              className: 'bd-ta',
              value: text,
              spellCheck: false,
              onChange: (e) => { setText(e.target.value); setDirty(true) },
            }),
            suggest ? h('div', { className: 'bd-suggest' },
              h('div', { className: 'bd-suggest-head' }, '总结结果（只追加到末尾，不改原文）'),
              h('pre', { className: 'bd-suggest-body' }, suggest),
              h('div', { className: 'bd-suggest-actions' },
                h('button', { className: 'bd-btn', onClick: () => setSuggest('') }, '丢弃'),
                h('button', { className: 'bd-primary', onClick: applySuggest }, '追加到档案'))) : null),
          h('div', { className: 'bd-modal-foot' },
            h('button', {
              className: 'bd-btn',
              disabled: suggesting || samplesNew < 3,
              title: samplesNew < 3 ? '新语料不足 3 条（总结过的不会重复算）' : '只总结上次之后的新语料',
              onClick: runSuggest,
            }, suggesting ? '总结中…' : `从回复总结语料（${samplesNew}）`),
            h('button', {
              className: 'bd-btn',
              title: '把当前内容存成 persona.md',
              onClick: () => {
                if (!text.trim()) { toast('档案还是空的'); return }
                downloadText('persona.md', text)
                toast('人设已导出')
              },
            }, '导出人设'),
            h('button', { className: 'bd-btn', onClick: () => fileRef.current?.click() }, '导入文件'),
            h('button', {
              className: 'bd-btn',
              title: '插入一份示例人设，照着改',
              onClick: () => setAskTemplate(true),
            }, '插入模板'),
            h('button', {
              className: 'bd-btn',
              onClick: () => {
                if (!dirty) { load(); toast('已重新载入'); return }
                setAskReload(true)
              },
            }, '重新载入'),
            h('button', { className: 'bd-primary', disabled: busy || !dirty, onClick: save }, busy ? '保存中…' : '保存'),
            h('input', { ref: fileRef, type: 'file', accept: '.md,.txt,text/markdown,text/plain', style: { display: 'none' }, onChange: onPick }))),
        askTemplate ? h('div', {
          className: 'bd-mask',
          style: { position: 'fixed', inset: 0, zIndex: 20 },
          onClick: (e) => { if (e.target === e.currentTarget) setAskTemplate(false) },
        },
          h('div', { className: 'bd-modal', style: { width: 430 } },
            h('div', { className: 'bd-modal-head' },
              h('span', { className: 'bd-modal-title' }, '插入人设模板')),
            h('div', { className: 'bd-modal-body' },
              h('div', { style: { fontSize: 14, lineHeight: 1.8, color: 'var(--tx)' } }, '模板内容只供参考，可自行修改，或者导入你自己的模板。')),
            h('div', { className: 'bd-modal-foot' },
              h('button', { className: 'bd-btn', onClick: () => setAskTemplate(false) }, '取消'),
              h('button', {
                className: 'bd-primary',
                onClick: () => {
                  setText((t) => `${t.replace(/\s+$/, '')}${t.trim() ? '\n\n' : ''}${PERSONA_TEMPLATE}`)
                  setDirty(true)
                  setAskTemplate(false)
                  toast('已插入模板，改完点保存')
                },
              }, '插入')))) : null,
        askReload ? h(ConfirmBox, {
          title: '重新载入',
          text: '会放弃当前未保存的修改，从文件重新读一遍。确定？',
          okLabel: '重新载入',
          onCancel: () => setAskReload(false),
          onOk: () => { setAskReload(false); load(); toast('已重新载入') },
        }) : null)
    }

    /* ── API Key / 模型弹窗 ── */
    function KeyModal({ onClose, toast }) {
      const [info, setInfo] = React.useState(null)
      const [draft, setDraft] = React.useState('')
      const [model, setModel] = React.useState('')
      const [apiBase, setApiBase] = React.useState('')
      const [busy, setBusy] = React.useState(false)
      const [askClear, setAskClear] = React.useState(false)
      const [remoteModels, setRemoteModels] = React.useState([])
      const load = React.useCallback(() => {
        apiGet('/key').then((r) => {
          setInfo(r)
          if (r?.model) setModel(r.model)
          if (r?.apiBase) setApiBase(r.apiBase)
          // 有 Key 就顺手把真实模型列表拉回来，不用手动点
          if (r?.hasKey) {
            apiGet('/models').then((m) => {
              if (m?.ok && Array.isArray(m.models) && m.models.length) setRemoteModels(m.models)
            }).catch(() => {})
          }
        }).catch(() => setInfo({ ok: false }))
      }, [])
      React.useEffect(() => { load() }, [load])
      const save = async () => {
        const key = draft.trim()
        if (!key && !model.trim() && !apiBase.trim()) return
        setBusy(true)
        const r = await apiPost('/key', { key, model: model.trim(), apiBase: apiBase.trim() })
          .catch((e) => ({ ok: false, error: String(e?.message ?? e) }))
        setBusy(false)
        if (!r?.ok) { toast(r?.error || '保存失败'); return }
        setDraft('')
        toast(key ? 'Key 已更新' : '设置已保存')
        load()
      }
      const clear = async () => {
        const r = await apiPost('/key', { clear: true }).catch(() => ({ ok: false }))
        if (r?.ok) { toast('已清空'); load() }
      }
      return h('div', { className: 'bd-mask', onClick: (e) => { if (e.target === e.currentTarget) onClose() } },
        h('div', { className: 'bd-modal', style: { width: 460 } },
          h('div', { className: 'bd-modal-head' },
            h('span', { className: 'bd-modal-title' }, 'API Key'),
            h('button', { className: 'bd-btn', style: { marginLeft: 'auto' }, onClick: onClose }, '关闭')),
          h('div', { className: 'bd-modal-body' },
            h('div', { className: 'bd-path' }, info?.path ? `文件：${info.path}` : '读取中…'),
            h('div', { className: 'bd-set-row' },
              h('span', { className: 'bd-set-label' }, '当前'),
              h('span', { className: 'bd-set-val' }, info?.hasKey ? info.masked : '未配置')),
            h('div', { className: 'bd-set-row' },
              h('span', { className: 'bd-set-label' }, '模型'),
              (() => {
                const base = remoteModels.length ? remoteModels : (info?.models || ['deepseek-chat', 'deepseek-reasoner'])
                // 当前用的模型不在列表里时，把它加进去当第一项，避免又冒出一个输入框
                const known = model && !base.includes(model) ? [model, ...base] : base
                const custom = !known.includes(model)
                return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 } },
                  [
                  h('select', {
                    key: 'sel',
                    className: 'bd-inp',
                    style: { width: '100%', minWidth: 0 },
                    value: custom ? '__custom__' : model,
                    onChange: (e) => setModel(e.target.value === '__custom__' ? '' : e.target.value),
                  },
                    known.map((m) => h('option', { key: m, value: m },
                      m === 'deepseek-chat' ? 'deepseek-chat · 日常对话（快）'
                        : m === 'deepseek-reasoner' ? 'deepseek-reasoner · 先思考再答（慢）'
                          : m)),
                    h('option', { key: '__custom__', value: '__custom__' }, '自定义…')),
                  custom || !model
                    ? h('input', {
                        key: 'inp',
                        className: 'bd-inp',
                        style: { width: '100%', minWidth: 0 },
                        value: model,
                        spellCheck: false,
                        placeholder: '自己填模型名，例如 deepseek-chat',
                        onChange: (e) => setModel(e.target.value),
                      })
                    : null,
                  ].filter(Boolean))
              })()),
            h('div', { className: 'bd-set-hint' },
              '列表来自当前接口的 /models 返回，以它为准；chat / reasoner 只是常见别名。换了接口就点「拉取模型」重新取一次。'),
            h('div', { className: 'bd-set-row' },
              h('span', { className: 'bd-set-label' }, '接口'),
              h('input', {
                className: 'bd-inp',
                style: { flex: 1, minWidth: 0 },
                value: apiBase,
                spellCheck: false,
                placeholder: 'https://api.deepseek.com/v1',
                onChange: (e) => setApiBase(e.target.value),
              })),
            h('input', {
              className: 'bd-inp',
              type: 'password',
              placeholder: '粘贴新的 sk- 开头的 key',
              value: draft,
              spellCheck: false,
              onChange: (e) => setDraft(e.target.value),
            }),
            h('div', { className: 'bd-comp-hint' }, '只在本机使用；Key、模型、接口地址保存后立即生效，无需重启。')),
          h('div', { className: 'bd-modal-foot' },
            h('button', {
              className: 'bd-btn',
              disabled: busy,
              title: '用当前 Key 请求 /models，把能用的模型列出来',
              onClick: async () => {
                setBusy(true)
                const r = await apiGet('/models').catch((e) => ({ ok: false, error: String(e?.message ?? e) }))
                setBusy(false)
                if (!r?.ok) { toast(r?.error || '拉取失败'); return }
                setRemoteModels(r.models || [])
                const n = (r.models || []).length
                toast(`拉到 ${n} 个模型，从下拉里挑`)
              },
            }, '拉取模型'),
            h('button', {
              className: 'bd-btn',
              disabled: busy,
              title: '用已保存的 Key / 模型 / 接口发一句 ping 试试',
              onClick: async () => {
                setBusy(true)
                const r = await apiPost('/key/test', {}).catch((e) => ({ ok: false, error: String(e?.message ?? e) }))
                setBusy(false)
                if (r?.ok) toast(`通了：${r.model} 回了「${r.reply || '…'}」`)
                else toast(`不通：${r?.error || '未知错误'}`)
              },
            }, busy ? '测试中…' : '测试'),
            h('button', { className: 'bd-btn', onClick: () => setAskClear(true), disabled: !info?.hasKey }, '清空'),
            h('button', {
              className: 'bd-primary',
              disabled: busy || !model.trim() || (!draft.trim() && model === info?.model && apiBase === info?.apiBase),
              onClick: save,
            }, busy ? '保存中…' : '保存'))),
        askClear ? h(ConfirmBox, {
          title: '清空 API Key',
          text: '清空后「AI帮回」会不可用，要重新粘贴 Key。确定清空？',
          okLabel: '清空',
          onCancel: () => setAskClear(false),
          onOk: () => { setAskClear(false); clear() },
        }) : null)
    }

    // 把文本存成文件（人设、流水导出用）
    const downloadText = (name, content) => {
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = name
      document.body.appendChild(a)
      a.click()
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 1000)
    }

    // 人设模板：插件主人设的脱敏版（本人改过的口吻），去掉账号/UID/语料来源等个人信息
    const PERSONA_TEMPLATE = [
      '## 我是谁',
      '- 上班族；自嘲老头、牢玩家',
      '- 用户心态：愿意为喜欢的东西掏钱，讨厌玩盗版还理直气壮跳脸的',
      '- 玩二游和单机，也看科技、数码、时政；说话是论坛/评论区那一代的口吻',
      '- 对「不合理，不理性，不唯物」不耐烦，但不会见人就怼',
      '',
      '## 我怎么想',
      '- 论点先站得住：讲事实、讲逻辑、讲成本，谁主张谁举证；站不住就认',
      '- 唯物主义：先看钱是谁出的、算力是谁买的、时间是谁花的，不从口号倒推结论',
      '- 合理批判：有对象、有依据、点到为止，不拿身份和情绪当论据',
      '- 合理怀疑：怀疑要给理由，对方讲清楚就不追究，不为赢而赢',
      '- 说完就停，不追求说服',
      '',
      '## 我怎么说话',
      '- 默认 15–35 字，一两句说完；讲理才到 60–100 字',
      '- 结尾多是判断句；反问是偶尔一刀，不是每句都来',
      '- 尾字：吧、呢、啊、嘛、呗；口头禅：其实、确实、说白了、就这么简单',
      '- 起句常用「我看了 / 我试了 / 我刚才… / 有一说一 / 确实 / 懂得都懂」，先说自己做过什么',
      '- 表情 1–3 个，爱连发两个同款',
      '- 不满会直接点名：这点不好、这也太尴尬了、这个太 AI 了',
      '- 对钱和时间务实：不差这点时间、没必要',
      '',
      '## 我怎么回',
      '1. 复述归谬：把对方的诉求翻成「既要又要」',
      '2. 指出偷换：对方替我加的观点，明确不认',
      '3. 给现实方案：花钱买 API / 去医院 / 自己去了解',
      '4. 拆逻辑分点：对方讲商业、讲机制时才用',
      '5. 一句反问收尾：少用',
      '6. 不接第二轮：说完就停',
      '',
      '## 我会接的话题',
      '- 游戏剧情：认真、愿意论证',
      '- 游戏吐槽：损、玩梗',
      '- 数码/AI 付费：讲分配、讲掏钱',
      '- 生活：务实、算账',
      '- 对 UP 主：催更玩梗',
      '',
      '## 例句',
      '- 那你花钱买api啊',
      '- 想得挺美倒是，那付费的不成冤种了',
      '- 有病就去医院，而不是盯着一个app搁着要求这要求那',
      '- 无知不是罪，明明知道自己无知而不去改才是',
      '- 哈哈哈，来了来了，投币了[doge]',
      '',
      '## 别学我什么',
      '- 不学打错字，不带家属，不带地域，不主动引战',
    ].join('\n')

    /* ── 统一风格的确认框 ── */
    function ConfirmBox({ title, text, okLabel = '确定', cancelLabel = '取消', actions = [], onOk, onCancel }) {
      return h('div', {
        className: 'bd-mask',
        style: { position: 'fixed', inset: 0, zIndex: 30 },
        onClick: (e) => { if (e.target === e.currentTarget) onCancel() },
      },
        h('div', { className: 'bd-modal', style: { width: 430 } },
          h('div', { className: 'bd-modal-head' },
            h('span', { className: 'bd-modal-title' }, title)),
          h('div', { className: 'bd-modal-body' },
            h('div', { style: { fontSize: 14, lineHeight: 1.85, color: 'var(--tx)' } }, text)),
          h('div', { className: 'bd-modal-foot' },
            actions.map((a, i) => h('button', { key: `a${i}`, className: 'bd-btn', onClick: a.onClick }, a.label)),
            h('button', { className: 'bd-btn', onClick: onCancel }, cancelLabel),
            h('button', { className: 'bd-primary', onClick: onOk }, okLabel))))
    }

    /* ── 新回复通知（全局浮层，右下角） ── */
    function Notifier({ layout }) {
      const [toast, setToast] = React.useState(null)
      React.useEffect(() => {
        let timer = null
        const readMs = () => readPoll()
        const tick = async () => {
          const ms = readMs()
          if (!ms) return
          try {
            const r = await apiGet('/replies')
            const items = Array.isArray(r?.items) ? r.items : []
            const maxId = items.reduce((a, x) => Math.max(a, Number(x.notifId) || 0), 0)
            const last = Number(localStorage.getItem('bd-last-notif') || 0)
            if (!last) { if (maxId) localStorage.setItem('bd-last-notif', String(maxId)); return }
            if (maxId > last) {
              // 只推「真的还没处理」的：已回、不回都跳过；
              // 太久以前的也不补推（停了一阵再开轮询时，老通知会一股脑算成新的）
              const now = Date.now()
              const maxAge = Math.max(ms * 2, 3600000)
              const seen = readSeen()
              const fresh = items
                .filter((x) => Number(x.notifId) > last)
                .filter((x) => !x.replied && !x.muted)
                .filter((x) => !seen.has(Number(x.notifId)))
                .filter((x) => now - (Number(x.time) || 0) < maxAge)
                .sort((a, b) => b.time - a.time)
              if (fresh[0]) {
                const f = fresh[0]
                setToast({ key: `${f.bvid}|${f.root}|${f.mid}`, name: f.name, text: f.text, n: fresh.length })
              }
            }
            if (maxId) localStorage.setItem('bd-last-notif', String(maxId))
          } catch { /* 网络抖动忽略 */ }
        }
        const start = () => { clearInterval(timer); const ms = readMs(); if (ms) timer = setInterval(tick, ms) }
        const onCfg = () => start()
        window.addEventListener('bd-poll-change', onCfg)
        tick()
        start()
        return () => { window.removeEventListener('bd-poll-change', onCfg); clearInterval(timer) }
      }, [])
      React.useEffect(() => {
        if (!toast) return undefined
        const t = setTimeout(() => setToast(null), 9000)
        return () => clearTimeout(t)
      }, [toast])
      if (!toast) return null
      return h('div', {
        className: 'bd-note-toast',
        onClick: () => { if (toast.key) window.dispatchEvent(new CustomEvent('bd-jump', { detail: { key: toast.key } })); setToast(null); try { layout?.selectPanel?.('bili-banghui') } catch { /* 忽略 */ } },
      },
        h('div', { style: { fontWeight: 600, marginBottom: 2 } }, `${toast.name} 回复了你${toast.n > 1 ? `（+${toast.n} 条）` : ''}`),
        h('div', { style: { fontSize: 12, opacity: .8 } }, toast.text.slice(0, 64)))
    }

    /* ── 主页面 ── */
    function DeskPage() {
      const [poll, setPoll] = React.useState(readPoll)
      const list = usePoll(React.useCallback(() => apiGet('/replies'), []), poll)
      const me = usePoll(React.useCallback(() => apiGet('/me'), []), 300000)
      const account = me.data?.me || null
      const myMid = account?.mid || 0
      const myFace = account?.face || ''

      const [range, setRange] = React.useState('7d')
      const [statusFilter, setStatusFilter] = React.useState('all')
      const [ttl, setTtl] = React.useState(readTtl)
      const [askClearList, setAskClearList] = React.useState(false)
      const [picked, setPicked] = React.useState('')
      const [sending, setSending] = React.useState(false)
      const [replyErr, setReplyErr] = React.useState('')
      const [ver, setVer] = React.useState(0)
      const [cands, setCands] = React.useState([])
      const [drafting, setDrafting] = React.useState(false)
      const [draftErr, setDraftErr] = React.useState('')
      const [stance, setStance] = React.useState('')
      const [confirmSend, setConfirmSend] = React.useState('')
      const [askBlock, setAskBlock] = React.useState(null)
      const [askDelete, setAskDelete] = React.useState(null)
      const [pending, setPending] = React.useState([])
      const [localReplied, setLocalReplied] = React.useState({})
      const [emojiOpen, setEmojiOpen] = React.useState(false)
      const [emojiPkgs, setEmojiPkgs] = React.useState([])
      const [emojiTab, setEmojiTab] = React.useState(0)
      const [emojiLoading, setEmojiLoading] = React.useState(false)
      const [emoteMap, setEmoteMap] = React.useState({})
      const sendingRef = React.useRef(false)
      const reqSeq = React.useRef(0)
      const taRef = React.useRef(null)
      const checkedRef = React.useRef({})

      // 表情映射预先取一次，正文里就能直接渲染成图
      React.useEffect(() => {
        let off = false
        apiGet('/emojis').then((r) => {
          if (off || !r?.ok) return
          const map = {}
          for (const p of r.packages || []) for (const e of p.emotes || []) map[e.text] = e.url
          setEmoteMap(map)
        }).catch(() => {})
        return () => { off = true }
      }, [])

      // 通知浮层点「跳到那个人」
      React.useEffect(() => {
        const onJump = (e) => { if (e?.detail?.key) setPicked(e.detail.key) }
        window.addEventListener('bd-jump', onJump)
        return () => window.removeEventListener('bd-jump', onJump)
      }, [])
      const [menuOpen, setMenuOpen] = React.useState(false)
      const [loginOpen, setLoginOpen] = React.useState(false)
      const [personaOpen, setPersonaOpen] = React.useState(false)
      const [keyOpen, setKeyOpen] = React.useState(false)
      const [toastMsg, setToastMsg] = React.useState('')
      const [openBranch, setOpenBranch] = React.useState({})

      const toastTimer = React.useRef(null)
      const toast = React.useCallback((m) => {
        setToastMsg(m)
        if (toastTimer.current) clearTimeout(toastTimer.current)
        toastTimer.current = setTimeout(() => setToastMsg(''), 2200)
      }, [])

      React.useEffect(() => {
        const close = () => setMenuOpen(false)
        window.addEventListener('click', close)
        return () => window.removeEventListener('click', close)
      }, [])

      const items = Array.isArray(list.data?.items) ? list.data.items : []
      const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      const cutoff = range === 'today' ? dayStart(new Date())
        : range === '7d' ? dayStart(new Date()) - 6 * 86400000 : 0
      const nowTs = Date.now()
      const shown = items
        .filter((x) => x.time >= cutoff)
        .filter((x) => !ttl || x.time >= nowTs - ttl * 86400000)
        .filter((x) => {
          if (statusFilter === 'mute') return x.muted
          if (statusFilter === 'todo') return !x.replied && !localReplied[`${x.bvid}|${x.root}|${x.mid}`] && !x.muted
          if (statusFilter === 'done') return (x.replied || localReplied[`${x.bvid}|${x.root}|${x.mid}`]) && !x.muted
          return true
        })
      const keyOf = (x) => `${x.bvid}|${x.root}|${x.mid}`

      // 后台补判「站内已回」：楼层最后一条是我发的就算回过了（不用一个个点开）
      React.useEffect(() => {
        if (!items.length || !myMid) return undefined
        let cancelled = false
        const todo = items.filter((x) => !x.replied && !x.muted && !checkedRef.current[keyOf(x)]).slice(0, 30)
        if (!todo.length) return undefined
        const run = async () => {
          for (let i = 0; i < todo.length; i += 3) {
            if (cancelled) return
            await Promise.all(todo.slice(i, i + 3).map(async (x) => {
              const key = keyOf(x)
              if (checkedRef.current[key]) return
              const r = await apiGet(`/thread?bvid=${encodeURIComponent(x.bvid)}&root=${encodeURIComponent(x.root)}&target=${encodeURIComponent(x.source)}`).catch(() => null)
              if (cancelled || !r?.ok || !Array.isArray(r.rows) || !r.rows.length) return
              checkedRef.current[key] = true
              const mineDirect = r.rows.some((z) => Number(z.mid) === Number(myMid) && Number(z.target) === Number(x.source))
              if (mineDirect) {
                setLocalReplied((m) => (m[key] ? m : { ...m, [key]: true }))
              }
            }))
          }
        }
        run()
        return () => { cancelled = true }
      }, [items.length, myMid])

      const cur = shown.find((x) => keyOf(x) === picked) || shown[0] || null
      React.useEffect(() => { if (!picked && shown.length) setPicked(keyOf(shown[0])) }, [shown.length, picked])

      const curKey = cur ? keyOf(cur) : ''
      const [drafts, setDrafts] = React.useState({})
      const replyText = drafts[curKey] || ''
      const setReplyText = React.useCallback((v) => {
        setDrafts((d) => ({ ...d, [curKey]: v }))
      }, [curKey])
      const [lastRefresh, setLastRefresh] = React.useState('')
              React.useEffect(() => { setCands([]); setReplyErr(''); setDraftErr(''); setStance(''); setPending((p) => p.filter((x) => x.key === curKey)) }, [curKey])
      // 输入框随内容自动长高（多行不再只靠右下角拖）
      React.useEffect(() => {
        const el = taRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 180)}px`
      }, [replyText, curKey])
      React.useEffect(() => { if (cur && cur.notifId) markSeen(cur.notifId) }, [curKey, cur && cur.notifId])

      const doRefresh = async () => {
        const prev = (list.data?.items || [])[0]?.notifId || 0
        const now = await list.refresh()
        thread.refresh()
        me.refresh()
        const arr = Array.isArray(now?.items) ? now.items : []
        const newest = arr[0]?.notifId || 0
        const t = new Date()
        const hh = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`
        setLastRefresh(hh)
        if (!now) { setLastRefresh(''); toast('刷新失败，检查网络或凭证'); return }
        if (prev && newest > prev) toast(`有新回复 · ${arr.length} 个会话`)
        else if (!prev) toast(`刷新完成 · ${arr.length} 个会话`)
        else toast(`无新回复 · 上次刷新 ${hh}`)
      }
      const thread = usePoll(React.useCallback(async () => {
        if (!curKey) return { ok: true, rows: [] }
        const [bvid, root] = curKey.split('|')
        const target = Number(cur && cur.source) || 0
        const r = await apiGet(`/thread?bvid=${encodeURIComponent(bvid)}&root=${encodeURIComponent(root)}&target=${target}&fresh=${ver}`)
        return { ...r, __key: curKey }
      }, [curKey, ver, cur && cur.source]), 60000)
      // 站内直接回过的：楼层最后一条是我就算已回（不然只有插件发的才认）
      React.useEffect(() => {
        const data = thread.data
        if (!curKey || !data || data.__key !== curKey || !Array.isArray(data.rows) || !myMid || !cur) return
        // 只有「我直接回了他这条」才算已回；我回别人的不算
        const mineLast = data.rows.some((r) => Number(r.mid) === Number(myMid) && Number(r.target) === Number(cur.source))
        setLocalReplied((m) => (m[curKey] === mineLast ? m : { ...m, [curKey]: mineLast }))
      }, [curKey, thread.data, myMid, cur && cur.mid])
      const rowsRaw = Array.isArray(thread.data?.rows) ? thread.data.rows : []
      // 楼层太长时后端只取最新一段：通知里那条一定补上，保证「我在回他哪句」看得到
      const rows = (() => {
        if (!cur) return rowsRaw
        const src = Number(cur.source) || 0
        if (!src || rowsRaw.some((r) => Number(r.rpid) === src)) return rowsRaw
        return [...rowsRaw, {
          rpid: src, name: cur.name, avatar: cur.avatar, mid: cur.mid,
          time: cur.time, text: cur.text, target: Number(cur.target) || 0,
        }]
      })()
      const warn = list.data?.ok === false ? list.data.error : thread.data?.ok === false ? thread.data.error : ''

      // ── 列表：一行 = 一个楼层（参与人用头像堆叠表示） ──
      let lastDay = ''
      const listNodes = []
      for (const x of shown) {
        const g = dayOf(x.time)
        if (g !== lastDay) {
          listNodes.push(h('div', { className: 'bd-group', key: `g-${g}-${listNodes.length}` }, g))
          lastDay = g
        }
        listNodes.push(h('button', {
          key: keyOf(x), className: 'bd-row', 'aria-selected': String(cur && keyOf(x) === keyOf(cur)),
          onClick: () => setPicked(keyOf(x)),
        },
          h(Ava, { src: x.avatar, name: x.name }),
          h('div', { style: { minWidth: 0 } },
            h('div', { className: 'bd-nm' }, h('span', null, x.name), h('span', { className: 'bd-tm' }, fmt(x.time))),
            h('div', { className: 'bd-sn strong' }, renderRich(x.text, emoteMap)),
            h('div', { className: 'bd-meta' },
              h('span', { className: 'bd-tag ' + (x.muted ? '' : (x.replied || localReplied[keyOf(x)]) ? 'ok' : 'hot') },
                x.muted ? '不回' : (x.replied || localReplied[keyOf(x)]) ? '已回' : '未回'),
              x.count > 1 ? h('span', { className: 'bd-tag' }, `聊了 ${x.count} 次`) : null,
              h('button', {
                className: 'bd-row-mute',
                onClick: async (e) => {
                  e.stopPropagation()
                  await apiPost('/state', { key: `${x.bvid}|${x.root}|${x.mid}`, muted: !x.muted })
                  list.refresh()
                },
              }, x.muted ? '恢复' : '不回'),
              h('button', {
                className: 'bd-row-mute',
                style: { marginLeft: 6 },
                title: '从列表里删掉这个对话',
                onClick: (e) => {
                  e.stopPropagation()
                  setAskDelete({ key: keyOf(x), notifId: Number(x.notifId) || 0 })
                },
              }, '删除')))))
      }

      // ── 右侧：主楼 + 我和他在这层的往来（只留你俩的对话） ──
      const floorRows = rows
      const rootId = cur ? Number(cur.root) : 0
      const byId = new Map(floorRows.map((r) => [r.rpid, r]))
      const isMine = (r) => !!(myMid && r && r.mid === myMid)
      const isHis = (r) => !!(cur && r && r.mid === cur.mid)
      const inSet = new Set()
      if (cur) {
        const addRow = (r) => {
          if (!r || inSet.has(r.rpid)) return false
          if (!(isMine(r) || isHis(r))) return false
          inSet.add(r.rpid)
          return true
        }
        // 起点：他回主楼/回我的；我在这一层回主楼的；当前通知指向的那条
        for (const r of floorRows) {
          if (isHis(r) && (r.target === rootId || isMine(byId.get(r.target)))) addRow(r)
          if (isMine(r) && r.target === rootId) addRow(r)
        }
        addRow(byId.get(Number(cur.source) || 0))
        // 双向补全：往下接你俩的子孙，往上补父节点（我在站内直接回主楼的那条也能回来）
        let changed = true
        while (changed) {
          changed = false
          for (const r of floorRows) {
            if (!(isMine(r) || isHis(r))) continue
            if (inSet.has(r.rpid)) {
              const p = byId.get(r.target)
              if (p && addRow(p)) changed = true
            } else {
              const t = byId.get(r.target)
              if (t && inSet.has(t.rpid) && addRow(r)) changed = true
            }
          }
        }
      }
      const chainRows = floorRows.filter((r) => inSet.has(r.rpid))
      // 发出去的乐观行：楼层里已经有了（rpid 或同文同人）就不再重复画一条
      const floorIds = new Set(floorRows.map((r) => Number(r.rpid)))
      const pendingRows = pending
        .filter((p) => p.key === curKey)
        .map((p) => p.row)
        .filter((r) => !floorIds.has(Number(r.rpid))
          && !floorRows.some((f) => f.mid === r.mid && f.text === r.text && Math.abs(Number(f.time) - Number(r.time)) < 180000))
      // 拉黑/删评论后楼层里可能缺他那条（用通知补的），所以统一按时间再排一次
      const shownRows = [...chainRows, ...pendingRows].sort((a, b) => (Number(a.time) || 0) - (Number(b.time) || 0))
      const extraHis = cur ? floorRows.filter((r) => isHis(r) && !inSet.has(r.rpid)) : []

      const genCands = async (extra) => {
        if (!cur || drafting) return null
        const mySeq = ++reqSeq.current
        setDrafting(true)
        setDraftErr('')
        const history = chainRows.slice(-6).map((r) => `${myMid && r.mid === myMid ? '我' : '他'}：${r.text}`)
        const r = await apiPost('/draft', {
          bvid: cur.bvid, root: cur.root, name: cur.name,
          rootText: cur.rootText, mine: cur.mine, his: cur.text, history,
          ...(extra || {}),
        }).catch((e) => ({ ok: false, error: String(e?.message ?? e) }))
        if (mySeq !== reqSeq.current) return null
        setDrafting(false)
        if (!r?.ok) { setDraftErr(r?.error || '生成失败'); return null }
        return { list: Array.isArray(r.candidates) ? r.candidates : [], stance: String(r.stance || '') }
      }
      const runDraft = async () => {
        const out = await genCands()
        if (!out) return
        setStance(out.stance)
        setCands(out.list)
      }
      const regenOne = async (key, tag, longer) => {
        const out = await genCands({ single: key, tag, ...(longer ? { longer: true } : {}) })
        const one = out && out.list && out.list[0]
        if (out?.stance) setStance(out.stance)
        if (one) setCands((arr) => arr.map((c) => (c.key === key ? { ...one, key } : c)))
      }

      const doSend = async (arg) => {
        if (sendingRef.current) return
        const text = (typeof arg === 'string' ? arg : confirmSend).trim()
        if (!cur || !text) { setConfirmSend(''); return }
        sendingRef.current = true
        setConfirmSend('')
        setSending(true)
        setReplyErr('')
        const key = curKey
        const snap = {
          key,
          row: { rpid: -Date.now(), mid: Number(myMid) || 0, name: '我', avatar: myFace, time: Date.now(), text, target: cur.source },
        }
        const r = await apiPost('/reply', {
          bvid: cur.bvid, root: cur.root, rpid: cur.source, text, name: cur.name,
        }).catch((e) => ({ ok: false, error: String(e?.message ?? e) }))
        sendingRef.current = false
        setSending(false)
        if (!r?.ok) {
          setReplyErr(r?.error || '发送失败')
          if (r?.blocked) setAskBlock({ key, mid: Number(cur?.mid) || 0, notifId: Number(cur?.notifId) || 0, msg: r.error || '对方可能把你拉黑了' })
          return
        }
        if (r.rpid) snap.row.rpid = r.rpid
        setPending((p) => [...p, snap])
        setReplyText('')
        // 发出去之后候选框就该收起来，不要留在页面上
        setCands([])
        setStance('')
        setDraftErr('')
        toast(r.logged ? '已发出（已记流水）' : '已发出（流水没写成）')
        setTimeout(() => setVer((v) => v + 1), 1200)
        setTimeout(() => setVer((v) => v + 1), 5000)
        setTimeout(() => setPending((p) => p.filter((x) => x !== snap)), 8000)
        list.refresh()
      }

      return h('div', { className: 'bd' },
        h('div', { className: 'bd-page' },
          h('header', { className: 'bd-head' },
            h('div', null,
              h('h1', { className: 'bd-title' }, T.title),
              h('p', { className: 'bd-sub' }, `${T.subtitle} · ${shown.length} 个楼层${lastRefresh ? ` · 上次刷新 ${lastRefresh}` : ''}`)),
            h('div', { className: 'bd-tools' },
              h('div', { className: 'bd-tabs', role: 'tablist' },
                [['all', '全部'], ['todo', '待回'], ['done', '已回'], ['mute', '不回']].map(([k, label]) =>
                  h('button', {
                    key: k, className: 'bd-tab', role: 'tab', 'aria-selected': String(statusFilter === k),
                    onClick: () => setStatusFilter(k),
                  }, label))),
              h('div', { className: 'bd-tabs', role: 'tablist' },
                [['today', '今天'], ['7d', '近 7 天'], ['all', '全部']].map(([k, label]) =>
                  h('button', {
                    key: k, className: 'bd-tab', role: 'tab', 'aria-selected': String(range === k),
                    onClick: () => setRange(k),
                  }, label))),
              h('select', {
                className: 'bd-select',
                value: String(poll),
                title: '新回复轮询间隔',
                onChange: (e) => {
                  const ms = Number(e.target.value)
                  localStorage.setItem('bd-poll', String(ms))
                  setPoll(ms)
                  window.dispatchEvent(new Event('bd-poll-change'))
                },
              }, POLL_OPTS.map(([v, l]) =>
                h('option', { key: v, value: String(v) }, l))),
              h('button', { className: 'bd-btn', onClick: doRefresh }, '刷新'),
              h('div', { className: 'bd-user', onClick: (e) => e.stopPropagation() },
                myMid
                  ? h('button', { className: 'bd-user-btn', onClick: () => setMenuOpen((v) => !v) },
                      h('img', { src: myFace, alt: '', onError: (e) => { e.target.style.display = 'none' } }),
                      h('span', { className: 'bd-user-name' }, account?.uname || '已登录'))
                  : h('button', { className: 'bd-btn', onClick: () => setLoginOpen(true) }, '登录'),
                menuOpen && myMid ? h('div', { className: 'bd-menu' },
                  h('div', { className: 'bd-menu-head' },
                    h('div', { className: 'bd-menu-name' }, account?.uname || ''),
                    h('div', { className: 'bd-menu-sub' }, `UID ${myMid}`)),
                  h('button', { className: 'bd-menu-item', onClick: () => { setMenuOpen(false); setPersonaOpen(true) } }, '人设档案'),
                  h('button', { className: 'bd-menu-item', onClick: () => { setMenuOpen(false); setKeyOpen(true) } }, 'API Key'),
                  h('div', { className: 'bd-menu-sep' }),
                  h('div', { className: 'bd-menu-label' }, '自动清理旧对话'),
                  h('select', {
                    className: 'bd-menu-select',
                    onClick: (e) => e.stopPropagation(),
                    value: String(ttl),
                    onChange: (e) => {
                      const v = Number(e.target.value)
                      localStorage.setItem('bd-ttl', String(v))
                      setTtl(v)
                      setMenuOpen(false)
                    },
                  },
                    [[0, '不清理'], [30, '30 天没新回复'], [60, '60 天'], [90, '90 天'], [180, '180 天']].map(([v, label]) =>
                      h('option', { key: v, value: String(v) }, label))),
                  h('button', { className: 'bd-menu-item', onClick: () => { setMenuOpen(false); setLoginOpen(true) } }, '重新扫码登录')) : null))),
          warn ? h('div', { className: 'bd-warn' }, warn) : null,
          h('div', { className: 'bd-grid' },
            h('div', { className: 'bd-list' },
              h('button', {
                className: 'bd-btn bd-clear-list bd-list-abs',
                disabled: !items.length,
                title: '把当前列表里的对话从本地隐藏',
                onClick: () => setAskClearList(true),
              }, '清空列表'),
              shown.length ? listNodes : h('div', { className: 'bd-empty' }, list.data ? '这段时间没有回复' : '加载中…')),
            h('div', { className: 'bd-chat' },
              h('div', { className: 'bd-chat-head' },
                h('span', { className: 'bd-nm', style: { fontSize: 13 } }, cur ? cur.name : '—'),
                cur ? h('span', { className: 'bd-bv' }, cur.bvid) : null,
                cur && thread.data?.title ? h('span', { className: 'bd-vt', title: thread.data.title }, thread.data.title) : null,
                h('span', { style: { marginLeft: 'auto' } })),
              h('div', { className: 'bd-body' },
                cur ? [
                  h('div', { className: 'bd-root', key: 'root' },
                    h('div', { className: 'bd-root-head' },
                      h(Ava, { src: thread.data?.root?.avatar || (myMid && thread.data?.root?.mid === myMid ? myFace : ''), name: thread.data?.root?.name || '主楼' }),
                      h('div', null,
                        h('div', { className: 'bd-root-name' }, thread.data?.root?.name || '主楼'),
                        h('div', { className: 'bd-root-time' }, thread.data?.root?.time ? fmt(thread.data.root.time) : ''))),
                    h('div', { className: 'bd-root-text' }, thread.data?.root?.text || cur.rootText || '（这条楼没有主楼文本）')),
                  shownRows.map((r) => {
                    const mine = myMid && r.mid === myMid
                    return h('div', { key: r.rpid, className: 'bd-msg' + (mine ? ' me' : '') },
                      h(Ava, { src: mine ? myFace : r.avatar, name: mine ? '我' : r.name }),
                      h('div', { className: 'bd-wrap' },
                        h('div', { className: 'bd-who' }, `${mine ? '我' : r.name} · ${fmt(r.time)}`),
                        h('div', { className: 'bd-bub' }, renderRich(r.text, emoteMap))))
                  }),
                  extraHis.length ? (openBranch[curKey]
                    ? h('div', { key: 'extra' },
                        h('button', { className: 'bd-branch', onClick: () => setOpenBranch((v) => ({ ...v, [curKey]: false })) },
                          `收起他回复别人的 ${extraHis.length} 条`),
                        h('div', { className: 'bd-others' },
                          extraHis.map((r) => h('div', { key: r.rpid, className: 'bd-other' },
                            h('b', null, r.name), ` · ${fmt(r.time)}：`, r.text))))
                    : h('button', {
                        key: 'extra', className: 'bd-branch',
                        onClick: () => setOpenBranch((v) => ({ ...v, [curKey]: true })),
                      }, `他在本层还回复了别人 ${extraHis.length} 条（与这条无关）`)) : null,
                  !shownRows.length ? h('div', { className: 'bd-empty' }, thread.data ? '这里还没有往来' : '加载中…') : null,
                ] : h('div', { className: 'bd-empty' }, '左边选一条')),
              h('div', { className: 'bd-composer' },
                (cands.length || stance) ? h('div', { className: 'bd-cands-head' },
                  h('span', null, stance ? `对方态度：${stance}` : '候选'),
                  h('button', {
                    className: 'bd-cands-close',
                    title: '关闭候选',
                    onClick: () => { setCands([]); setStance(''); setDraftErr(''); setEmojiOpen(false) },
                  }, '×')) : null,
                cands.length ? h('div', { className: 'bd-cands' },
                  cands.map((c) => h('div', {
                    key: c.key, className: 'bd-cand', onClick: () => { setReplyText(c.text); setReplyErr('') },
                  },
                    h('div', { className: 'bd-cand-head' },
                      h('b', null, c.key),
                      h('span', { className: 'bd-cand-tag' }, c.tag),
                      h('span', { className: 'bd-cand-len' }, `${countChars(c.text)} 字`),
                      h('button', {
                        className: 'bd-cand-swap',
                        disabled: drafting,
                        title: '换个说法',
                        onClick: (e) => { e.stopPropagation(); regenOne(c.key, c.tag) },
                      }, '换一个'),
                      h('button', {
                        className: 'bd-cand-swap',
                        disabled: drafting,
                        title: '把这条写长一点',
                        onClick: (e) => { e.stopPropagation(); regenOne(c.key, c.tag, true) },
                      }, '长一点')),
                    h('div', { className: 'bd-cand-text' }, renderRich(c.text, emoteMap))))) : null,
                drafting ? h('div', { className: 'bd-comp-hint' }, '正在生成…') : null,
                draftErr ? h('div', { className: 'bd-comp-err' }, draftErr) : null,
                h('div', { className: 'bd-comp-box' },
                  h('textarea', {
                    className: 'bd-comp-ta',
                    ref: taRef,
                    rows: 2,
                    style: { resize: 'none', maxHeight: 180, overflowY: 'auto' },
                    maxLength: 1000,
                    placeholder: cur ? `回复 ${cur.name}…` : '左边选一条会话',
                    value: replyText,
                    disabled: !cur,
                    onChange: (e) => { setReplyText(e.target.value); setReplyErr('') },
                  }),
                  h('span', { className: 'bd-comp-count' }, `${replyText.length}/1000`)),
                emojiOpen ? h('div', { className: 'bd-emoji-wrap' },
                  emojiPkgs.length > 1 ? h('div', { className: 'bd-emoji-tabs' },
                    emojiPkgs.map((p, i) => h('button', {
                      key: p.name,
                      className: 'bd-emoji-tab' + (emojiTab === i ? ' on' : ''),
                      onClick: () => setEmojiTab(i),
                    }, p.name))) : null,
                  emojiLoading
                    ? h('div', { className: 'bd-empty' }, '加载表情…')
                    : h('div', { className: 'bd-emoji' },
                        (emojiPkgs[emojiTab]?.emotes || []).map((e) => h('button', {
                          key: e.text, className: 'bd-emoji-item', title: e.text,
                          onClick: () => { setReplyText(replyText + e.text); setEmojiOpen(false) },
                        }, h('img', { src: e.url, alt: e.text, loading: 'lazy' })))),
                  !emojiLoading && !emojiPkgs.length
                    ? h('div', { className: 'bd-empty' }, '表情加载失败，可直接手打 [doge] 这类代码')
                    : null) : null,
                h('div', { className: 'bd-comp-actions' },
                  h('button', {
                    className: 'bd-btn',
                    title: '插入 B站 表情',
                    onClick: async () => {
                      const next = !emojiOpen
                      setEmojiOpen(next)
                      if (next && !emojiPkgs.length && !emojiLoading) {
                        setEmojiLoading(true)
                        const r = await apiGet('/emojis').catch(() => null)
                        setEmojiLoading(false)
                        if (r?.ok) setEmojiPkgs(Array.isArray(r.packages) ? r.packages : [])
                      }
                    },
                  }, '😀 表情'),
                  h('button', {
                    className: 'bd-btn',
                    disabled: !cur || drafting,
                    onClick: runDraft,
                  }, drafting ? '生成中…' : 'AI帮回'),
                  h('button', {
                    className: 'bd-primary',
                    disabled: !cur || !replyText.trim() || sending || replyText.length > 1000,
                    onClick: () => {
                      if (!cur || !replyText.trim()) return
                      setConfirmSend(replyText.trim())
                    },
                  }, sending ? '发送中…' : '发送')),
                replyErr ? h('div', { className: 'bd-comp-err' },
                  replyErr,
                  cur && replyText.trim() ? h('button', {
                    className: 'bd-btn',
                    style: { marginLeft: 8 },
                    disabled: sending,
                    onClick: () => doSend(replyText),
                  }, sending ? '发送中…' : '重试') : null) : null)))),

        loginOpen ? h(LoginModal, {
          toast,
          onClose: () => setLoginOpen(false),
          onDone: () => { setLoginOpen(false); me.refresh(); list.refresh(); toast('登录成功') },
        }) : null,
        personaOpen ? h(PersonaModal, { toast, onClose: () => setPersonaOpen(false) }) : null,
        keyOpen ? h(KeyModal, { toast, onClose: () => setKeyOpen(false) }) : null,
        askBlock ? h(ConfirmBox, {
          title: '回不了这条了',
          text: askBlock.msg + '。可以只标记不回，也可以顺手把对方加入 B站 黑名单，并把这个对话删掉。',
          okLabel: '拉黑并删除',
          cancelLabel: '先不了',
          actions: [{
            label: '标记不回',
            onClick: async () => {
              const k = askBlock.key
              setAskBlock(null)
              const res = await apiPost('/state', { key: k, muted: true }).catch(() => null)
              if (res?.ok) { toast('已标记不回'); list.refresh() } else toast('标记失败')
            },
          }],
          onCancel: () => setAskBlock(null),
          onOk: async () => {
            const snap = askBlock
            setAskBlock(null)
            const b = await apiPost('/block', { mid: snap.mid }).catch((e) => ({ ok: false, error: String(e?.message ?? e) }))
            if (!b?.ok) { toast('拉黑失败：' + (b?.error || '')); return }
            const hideRes = await apiPost('/hide', { key: snap.key, notifId: snap.notifId }).catch(() => null)
            if (!hideRes?.ok) { toast('已拉黑，但删除对话失败'); return }
            toast('已拉黑并删除对话')
            setPicked('')
            list.refresh()
          },
        }) : null,
        askClearList ? h(ConfirmBox, {
          title: '清空列表',
          text: '把现在的 ' + items.length + ' 个对话全部从本地隐藏（不只看今天，也不管当前筛选），不动 B站 上的评论；对方以后再回，会重新出现。确定？',
          okLabel: '清空',
          onCancel: () => setAskClearList(false),
          onOk: async () => {
            const list1 = items.map((x) => ({ key: `${x.bvid}|${x.root}|${x.mid}`, notifId: Number(x.notifId) || 0 }))
            setAskClearList(false)
            await Promise.all(list1.map((it) => apiPost('/hide', it).catch(() => null)))
            setPicked('')
            toast(`已清空 ${list1.length} 个对话`)
            list.refresh()
          },
        }) : null,
        askDelete ? h(ConfirmBox, {
          title: '删除对话',
          text: '只是从这个列表里删掉，不会动 B站 上的评论。对方之后再回你，会重新出现。',
          okLabel: '删除',
          onCancel: () => setAskDelete(null),
          onOk: async () => {
            const snap = askDelete
            setAskDelete(null)
            const r = await apiPost('/hide', { key: snap.key, notifId: snap.notifId }).catch(() => null)
            if (!r?.ok) { toast('删除失败'); return }
            if (snap.key === curKey) setPicked('')
            toast('已删除这个对话')
            list.refresh()
          },
        }) : null,
        confirmSend ? h('div', {
          className: 'bd-mask',
          onClick: (e) => { if (e.target === e.currentTarget) setConfirmSend('') },
        },
          h('div', { className: 'bd-modal', style: { width: 440 } },
            h('div', { className: 'bd-modal-head' },
              h('span', { className: 'bd-modal-title' }, '确认发送')),
            h('div', { className: 'bd-modal-body' },
              h('div', { className: 'bd-path' }, cur ? `回复 ${cur.name}` : ''),
              h('div', { className: 'bd-confirm-text' }, confirmSend)),
            h('div', { className: 'bd-modal-foot' },
              h('button', { className: 'bd-btn', onClick: () => setConfirmSend('') }, '取消'),
              h('button', { className: 'bd-primary', disabled: sending, onClick: doSend }, sending ? '发送中…' : '确认发送')))) : null,
        toastMsg ? h('div', { className: 'bd-toast' }, toastMsg) : null)
    }

    function PanelIcon({ size = 20 }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' },
        h('rect', { x: 3, y: 5, width: 18, height: 14, rx: 3, stroke: '#fb7299', strokeWidth: 1.6 }),
        h('path', { d: 'M7.5 9.5h5M7.5 13h3.5', stroke: '#fb7299', strokeWidth: 1.6, strokeLinecap: 'round' }),
        h('circle', { cx: 16.5, cy: 12, r: 2.4, fill: '#23ade5' }))
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ensureStyle()
        try {
          ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
            name: 'sidebar.panellist', id: PANEL_ID, order: 16, label: () => T.title,
          }, PanelIcon))
        } catch (e) { console.error('[bili-banghui] 注册侧栏图标失败', e) }
        try {
          ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL_ID }, DeskPage))
        } catch (e) { console.error('[bili-banghui] 注册页面失败', e) }
        try {
          const layout = ctx.get?.('layout') ?? ctx.layout
          ctx.slots.inject('shell.overlay', () => ctx.slots.register({
            name: 'shell.overlay', id: 'bili-banghui-notifier',
          }, (props) => h(Notifier, { layout: props?.layout || layout })))
        } catch (e) { console.error('[bili-banghui] 通知浮层注册失败', e) }
      },
    }
  },
})
