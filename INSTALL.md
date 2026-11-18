# 安装 / 换电脑（傻瓜版）

整个插件就是一个文件夹：**`dsh-bili-banghui`**。拷走它就能带走插件；个人数据都在里面的 `data\`，不想带走就删掉 `data\` 再拷。

## 一、装到另一台电脑

1. 把 `dsh-bili-banghui` 文件夹放到任意位置（建议 `C:\Users\<你>\dsh-bili-banghui`，路径别带中文也行，别带空格更稳）。
2. 打开 DSH，在任意会话里对 AI 说一句：

   > 安装插件 link:C:\Users\<你>\dsh-bili-banghui

   AI 会用 `plugin_manager` 的 `install_bundle` 装好，并写进 profile。
3. 完全退出 DSH，再打开。
4. 左侧栏出现「**B站帮回**」就成功了。

## 二、首次配置（三步）

打开工作台，点右上角头像区域：

1. **登录**：点「登录」→ 用 B站 App 扫码 → 手机确认。凭证会写到 `data\credential.json`。
2. **API Key**：头像菜单 →「API Key」→ 粘贴 `sk-...` → 保存。（没有它「AI帮回」不能用，其它功能不受影响）
3. **人设档案**：头像菜单 →「人设档案」→ 点「导入文件」选你的 `persona.md` → 保存。以后在这里改也行。

轮询间隔在右上角下拉里选（默认「不轮询」）。

## 三、可选：B站 工具（bili_*）

插件的列表/对话/发送都不依赖 MCP；只有你想在对话里用 `bili_reply` 这类工具时，才需要另外挂 MCP server。
做法见主 README 的「MCP 可选」一节；本机已由 profile 的 `cordis.patch.yml` 挂好。

## 四、目录说明

```
dsh-bili-banghui\
  index.js          宿主接口
  client.js         页面
  lib\workbench.js  数据层
  cordis.patch.yml  挂载声明
  data\             ← 所有个人数据（可整体拷走/备份）
    credential.json   B站 凭证
    persona.md        人设档案
    reply-log.md      发送流水
    samples.jsonl     语料
    apikey.txt        模型 Key
    muted.json        不回名单
```

## 五、升级 / 回滚

- 插件是 link 安装，改文件后：只改 `client.js` → 窗口 `Ctrl+R`；改 `index.js`/`lib` → 重启 DSH。
- 仓库有 git：出问题让 AI「回滚到上一个提交」即可。

## 六、排错

| 现象 | 先查 |
|---|---|
| 左侧没图标 | 插件是否启用；重启 DSH |
| 页面空白 | 控制台报错（slot），多半是 DSH 版本接口变了 |
| 数据全空 | 右上角是否登录；`data\credential.json` 是否存在 |
| AI帮回报错 | 头像菜单里 Key 是否有效、余额是否够 |
