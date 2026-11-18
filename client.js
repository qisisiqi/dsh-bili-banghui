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
      .bd-warn{margin-bottom:10px;padding:8px 12px;border-radius:8px;border:1px solid rgba(251,114,153,.4);background:rgba(251,114,153,.08);color:var(--tx2);font-size:12px}
      .bd-grid{display:grid;grid-template-columns:300px 1fr;gap:12px;height:min(700px,calc(100dvh - 250px));min-height:380px}
      .bd-list{border:1px solid var(--bd);border-radius:10px;background:var(--l1);overflow:auto;min-height:0}
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
      .bd-set-row{display:flex;gap:10px;font-size:12px;margin:6px 0}
      .bd-set-label{color:var(--tx3);width:44px;flex:0 0 auto}
      .bd-set-val{color:var(--tx2);word-break:break-all}
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
      const [suggest, setSuggest] = React.useState('')
      const [suggesting, setSuggesting] = React.useState(false)
      const fileRef = React.useRef(null)

      const load = React.useCallback(() => {
        apiGet('/persona').then((r) => {
          if (!r?.ok) { toast(r?.error || '读取失败'); return }
          setText(r.text || ''); setPath(r.path || ''); setMtime(r.mtime || 0); setDirty(false)
          setSamples(Number(r.samples) || 0)
        })
      }, [toast])
      React.useEffect(() => { load() }, [load])

      const runSuggest = async () => {
        if (suggesting) return
        setSuggesting(true)
        const r = await apiPost('/persona/suggest', {}).catch((e) => ({ ok: false, error: String(e?.message ?? e) }))
        setSuggesting(false)
        if (!r?.ok) { toast(r?.error || '归纳失败'); return }
        setSuggest(r.text || '')
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
            h('span', { style: { marginLeft: 'auto', fontSize: 11, color: 'var(--tx3)' } },
              `语料 ${samples} 条${mtime ? ` · 更新于 ${fmt(mtime)}` : ''}`),
            h('button', { className: 'bd-btn', onClick: onClose }, '关闭')),
          h('div', { className: 'bd-modal-body' },
            h('div', { className: 'bd-path' }, path ? `文件：${path}` : '加载中…'),
            h('textarea', {
              className: 'bd-ta',
              value: text,
              spellCheck: false,
              onChange: (e) => { setText(e.target.value); setDirty(true) },
            }),
            suggest ? h('div', { className: 'bd-suggest' },
              h('div', { className: 'bd-suggest-head' }, '归纳结果（只追加到末尾，不改原文）'),
              h('pre', { className: 'bd-suggest-body' }, suggest),
              h('div', { className: 'bd-suggest-actions' },
                h('button', { className: 'bd-btn', onClick: () => setSuggest('') }, '丢弃'),
                h('button', { className: 'bd-primary', onClick: applySuggest }, '追加到档案'))) : null),
          h('div', { className: 'bd-modal-foot' },
            h('button', {
              className: 'bd-btn',
              disabled: suggesting || samples < 3,
              title: samples < 3 ? '语料少于 3 条，先多发几条' : '读最近 80 条语料，归纳新特征',
              onClick: runSuggest,
            }, suggesting ? '归纳中…' : `从样本归纳（${samples}）`),
            h('button', { className: 'bd-btn', onClick: () => fileRef.current?.click() }, '导入文件'),
            h('button', {
              className: 'bd-btn',
              onClick: () => {
                if (dirty && !window.confirm('放弃当前修改，重新从文件载入？')) return
                load()
                toast('已重新载入')
              },
            }, '重新载入'),
            h('button', { className: 'bd-primary', disabled: busy || !dirty, onClick: save }, busy ? '保存中…' : '保存'),
            h('input', { ref: fileRef, type: 'file', accept: '.md,.txt,text/markdown,text/plain', style: { display: 'none' }, onChange: onPick }))))
    }

    /* ── API Key 弹窗 ── */
    function KeyModal({ onClose, toast }) {
      const [info, setInfo] = React.useState(null)
      const [draft, setDraft] = React.useState('')
      const [busy, setBusy] = React.useState(false)
      const load = React.useCallback(() => { apiGet('/key').then(setInfo).catch(() => setInfo({ ok: false })) }, [])
      React.useEffect(() => { load() }, [load])
      const save = async () => {
        const key = draft.trim()
        if (!key) return
        setBusy(true)
        const r = await apiPost('/key', { key }).catch((e) => ({ ok: false, error: String(e?.message ?? e) }))
        setBusy(false)
        if (!r?.ok) { toast(r?.error || '保存失败'); return }
        setDraft('')
        toast('Key 已更新')
        load()
      }
      const clear = async () => {
        if (!window.confirm('清空 API Key？之后「AI帮回」会不可用。')) return
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
              h('span', { className: 'bd-set-val' }, info ? `${info.model} @ ${info.apiBase}` : '—')),
            h('input', {
              className: 'bd-inp',
              type: 'password',
              placeholder: '粘贴新的 sk- 开头的 key',
              value: draft,
              spellCheck: false,
              onChange: (e) => setDraft(e.target.value),
            }),
            h('div', { className: 'bd-comp-hint' }, '只在本机使用；保存后立即生效，无需重启。')),
          h('div', { className: 'bd-modal-foot' },
            h('button', { className: 'bd-btn', onClick: clear, disabled: !info?.hasKey }, '清空'),
            h('button', { className: 'bd-primary', disabled: busy || !draft.trim(), onClick: save }, busy ? '保存中…' : '保存'))))
    }

    /* ── 新回复通知（全局浮层，右下角） ── */
    function Notifier({ layout }) {
      const [toast, setToast] = React.useState(null)
      React.useEffect(() => {
        let timer = null
        const readMs = () => readPoll()
        const tick = async () => {
          if (!readMs()) return
          try {
            const r = await apiGet('/replies')
            const items = Array.isArray(r?.items) ? r.items : []
            const maxId = items.reduce((a, x) => Math.max(a, Number(x.notifId) || 0), 0)
            const last = Number(localStorage.getItem('bd-last-notif') || 0)
            if (!last) { if (maxId) localStorage.setItem('bd-last-notif', String(maxId)); return }
            if (maxId > last) {
              const fresh = items.filter((x) => Number(x.notifId) > last).sort((a, b) => b.time - a.time)
              if (fresh[0]) setToast({ name: fresh[0].name, text: fresh[0].text, n: fresh.length })
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
        onClick: () => { setToast(null); try { layout?.selectPanel?.('bili-banghui') } catch { /* 忽略 */ } },
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
      const [picked, setPicked] = React.useState('')
      const [sending, setSending] = React.useState(false)
      const [replyErr, setReplyErr] = React.useState('')
      const [ver, setVer] = React.useState(0)
      const [cands, setCands] = React.useState([])
      const [drafting, setDrafting] = React.useState(false)
      const [draftErr, setDraftErr] = React.useState('')
      const [stance, setStance] = React.useState('')
      const [confirmSend, setConfirmSend] = React.useState('')
      const [pending, setPending] = React.useState([])
      const [emojiOpen, setEmojiOpen] = React.useState(false)
      const [emojiPkgs, setEmojiPkgs] = React.useState([])
      const [emojiTab, setEmojiTab] = React.useState(0)
      const [emojiLoading, setEmojiLoading] = React.useState(false)
      const sendingRef = React.useRef(false)
      const reqSeq = React.useRef(0)
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
      const shown = items.filter((x) => x.time >= cutoff).filter((x) => {
        if (statusFilter === 'todo') return !x.replied && !x.muted
        if (statusFilter === 'done') return x.replied || x.muted
        return true
      })
      const keyOf = (x) => `${x.bvid}|${x.root}|${x.mid}`
      const cur = shown.find((x) => keyOf(x) === picked) || shown[0] || null
      React.useEffect(() => { if (!picked && shown.length) setPicked(keyOf(shown[0])) }, [shown.length, picked])

      const curKey = cur ? keyOf(cur) : ''
      const [drafts, setDrafts] = React.useState({})
      const replyText = drafts[curKey] || ''
      const setReplyText = React.useCallback((v) => {
        setDrafts((d) => ({ ...d, [curKey]: v }))
      }, [curKey])
      const [lastRefresh, setLastRefresh] = React.useState('')
              React.useEffect(() => { setCands([]); setReplyErr(''); setDraftErr(''); setStance('') }, [curKey])

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
        return apiGet(`/thread?bvid=${encodeURIComponent(bvid)}&root=${encodeURIComponent(root)}&target=${target}&fresh=${ver}`)
      }, [curKey, ver, cur && cur.source]), 60000)
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
            h('div', { className: 'bd-sn strong' }, x.text),
            h('div', { className: 'bd-meta' },
              h('span', { className: 'bd-tag ' + (x.muted ? '' : x.replied ? 'ok' : 'hot') },
                x.muted ? '不回' : x.replied ? '已回' : '未回'),
              x.count > 1 ? h('span', { className: 'bd-tag' }, `聊了 ${x.count} 次`) : null,
              h('button', {
                className: 'bd-row-mute',
                onClick: async (e) => {
                  e.stopPropagation()
                  await apiPost('/state', { key: `${x.bvid}|${x.root}|${x.mid}`, muted: !x.muted })
                  list.refresh()
                },
              }, x.muted ? '恢复' : '不回')))))
      }

      // ── 右侧：主楼 + 我和他在这层的往来（只留你俩的对话） ──
      const floorRows = rows
      const rootId = cur ? Number(cur.root) : 0
      const byId = new Map(floorRows.map((r) => [r.rpid, r]))
      const isMine = (r) => !!(myMid && r && r.mid === myMid)
      const isHis = (r) => !!(cur && r && r.mid === cur.mid)
      const inSet = new Set()
      if (cur) {
        // 他直接回主楼或回你的，作为起点
        for (const r of floorRows) {
          if (isHis(r) && (r.target === rootId || isMine(byId.get(r.target)))) inSet.add(r.rpid)
        }
        // 沿 target 链只扩展「你俩」的节点，别人的插话不进来
        let changed = true
        while (changed) {
          changed = false
          for (const r of floorRows) {
            if (inSet.has(r.rpid)) continue
            const t = byId.get(r.target)
            if (!t || !inSet.has(t.rpid)) continue
            if (isMine(r) || isHis(r)) { inSet.add(r.rpid); changed = true }
          }
        }
      }
      const chainRows = floorRows.filter((r) => inSet.has(r.rpid))
      const pendingRows = pending.filter((p) => p.key === curKey).map((p) => p.row)
      const shownRows = [...chainRows, ...pendingRows]
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
      const regenOne = async (key, tag) => {
        const out = await genCands({ single: key, tag })
        const one = out && out.list && out.list[0]
        if (out?.stance) setStance(out.stance)
        if (one) setCands((arr) => arr.map((c) => (c.key === key ? { ...one, key } : c)))
      }

      const doSend = async () => {
        if (sendingRef.current) return
        const text = confirmSend
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
        if (!r?.ok) { setReplyErr(r?.error || '发送失败'); return }
        if (r.rpid) snap.row.rpid = r.rpid
        setPending((p) => [...p, snap])
        setReplyText('')
        toast(r.logged ? '已发出（已记流水）' : '已发出（流水没写成）')
        setTimeout(() => setVer((v) => v + 1), 1200)
        setTimeout(() => setVer((v) => v + 1), 5000)
        setTimeout(() => setPending((p) => p.filter((x) => x !== snap)), 20000)
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
                [['all', '全部'], ['todo', '待回'], ['done', '已回']].map(([k, label]) =>
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
                  h('button', { className: 'bd-menu-item', onClick: () => { setMenuOpen(false); setLoginOpen(true) } }, '重新扫码登录')) : null))),
          warn ? h('div', { className: 'bd-warn' }, warn) : null,
          h('div', { className: 'bd-grid' },
            h('div', { className: 'bd-list' },
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
                        h('div', { className: 'bd-bub' }, r.text)))
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
                      h('span', { className: 'bd-cand-len' }, `${c.text.length} 字`),
                      h('button', {
                        className: 'bd-cand-swap',
                        disabled: drafting,
                        onClick: (e) => { e.stopPropagation(); regenOne(c.key, c.tag) },
                      }, '换一个')),
                    h('div', { className: 'bd-cand-text' }, c.text)))) : null,
                drafting ? h('div', { className: 'bd-comp-hint' }, '正在生成…') : null,
                draftErr ? h('div', { className: 'bd-comp-err' }, draftErr) : null,
                h('div', { className: 'bd-comp-box' },
                  h('textarea', {
                    className: 'bd-comp-ta',
                    rows: 2,
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
                replyErr ? h('div', { className: 'bd-comp-err' }, replyErr) : null)))),

        loginOpen ? h(LoginModal, {
          toast,
          onClose: () => setLoginOpen(false),
          onDone: () => { setLoginOpen(false); me.refresh(); list.refresh(); toast('登录成功') },
        }) : null,
        personaOpen ? h(PersonaModal, { toast, onClose: () => setPersonaOpen(false) }) : null,
        keyOpen ? h(KeyModal, { toast, onClose: () => setKeyOpen(false) }) : null,
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
