# dsh-bili-banghui · B站帮回

> **声明**：非官方插件，与哔哩哔哩（B站）无隶属关系。
> 所有凭证、人设、流水、语料只保存在本机 `data\` 目录，插件不上传任何数据；API Key 也只在本机使用。

DSH 左侧栏插件：把 B站「回复我的」按 **人 × 楼层** 聚合成会话，右侧显示 主楼 → 他 → 你 的单线对话，AI 按对方态度出 3 条候选，可直接在面板内发送并记账。

> 换电脑 / 首次安装看 [INSTALL.md](INSTALL.md)。

## 功能

- 列表：按人×楼层聚合，最新回复倒序，今天/昨天/日期分组；今天/近 7 天/全部筛选
- 状态：未回 / 已回（以 `data/reply-log.md` 为准）/ 不回（`data/muted.json`）
- 对话：主楼（作者头像+时间）→ 他 → 你；旁人插话折叠
- 顶栏：BV 号 + 视频标题（缓存 10 分钟）
- **AI帮回**：先单独判态度（赞同/友善/中立/抬杠/攻击），再按态度出 3 条（A 主选 / B 变体 / C 收尾）；每条可「换一个」
- 发送：二次确认 → 写 B站 → 自动记流水 + 回流 `samples.jsonl`；同条 30 秒、全局 5 秒防重
- 轮询：10 分钟–8 小时可配（默认关）；新回复右下角通知，点击跳工作台
- 表情：内置 62 个 B站 常用表情（随包分发，不联网），点图插入 `[doge]` 这类代码
- 头像菜单：人设档案 / API Key / 重新扫码

## 目录（全部在这一个文件夹里）

```
dsh-bili-banghui\
  index.js            宿主：HTTP 路由、登录、人设读写、候选生成、发送
  client.js           前端：页面、弹窗、通知浮层
  lib\workbench.js    数据层：msgfeed、楼层翻页、视频信息、缓存
  cordis.patch.yml    挂载声明（只挂 UI）
  package.json        版本/清单
  locale\ icon.svg    插件市场展示信息
  data\               ← 个人数据，不进 git、不发包
    credential.json     B站 凭证
    persona.md          人设档案
    reply-log.md        发送流水
    samples.jsonl       语料（发送时自动追加）
    apikey.txt          模型 Key
    muted.json          不回名单
```

数据目录默认就是 `data\`，可用 patch 里的 `credFile/personaFile/keyFile` 覆盖。

## 配置

`cordis.patch.yml` 的 `config` 只留 `apiBase` / `model`，路径默认走 `data\`；页面里也能改 Key 和人设。

## 开发

- 只改 `client.js` → 窗口 `Ctrl+R`
- 改 `index.js` / `lib/*` → 重启 DSH
- link 安装，改完不用重装；git 仓库在插件目录里，可回滚

## MCP 可选

列表/对话/发送都直连 B站 接口，**不依赖 MCP**。只有想在对话里用 `bili_*` 工具时才需要挂 MCP server（本机已挂在 profile 的 `cordis.patch.yml`）。

## 限制

- 「已回」只认流水里的记录，手机/网页手动回过的看不出来
- B站 楼中楼只有两层，视图是按 `target_id` 还原的
- 楼层按页拉（最多 8 页 / 160 条），超长楼层只看最近部分
