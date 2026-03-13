# XD-Food-Story（团队快速上手）

这个项目已经是前后端分离架构：

- 前端：`src/`（React + Vite）
- 后端：`server/`（Node + Express）
- 数据：`server/data/recommended_menus_frontend_ui.json`

## 1) 先配 `.env`

复制 `.env.example` 为 `.env`，至少确认这几项：

- `PORT=3001`
- `LLM_API_KEY=你的key`
- `LLM_BASE_URL=https://api.deepseek.com/v1`
- `LLM_MODEL=deepseek-chat`

如果你不用大模型，也能跑（会走规则 fallback）。

## 2) 一套命令跑起来

```bash
npm install
npm run build
npm run server
```

打开：`http://localhost:3001`

开发模式（可选）：

```bash
npm run server
npm run dev
```

前端地址：`http://localhost:5173`

## 3) 前后端分工（当前实现）

前端负责：

- 页面渲染、交互、收藏、详情弹层
- 搜索关键词本地过滤（前端全量缓存后本地筛）
- 组织聊天上下文并传给后端（`conversation_history`）

后端负责：

- 菜单数据读取、分页、过滤、排序
- 推荐链路：意图解析 → 候选召回/打分 → 解释生成
- LLM 调用与 fallback（无 key 时自动降级）
- 生产环境静态托管 `dist`

## 4) 我们下一步重点

1. 网站性能优化（首屏、滚动流畅度、图片与重渲染成本）
2. AI 推荐能力增强（推荐理由质量、命中率、可解释性）
3. 标签多重筛选（放在搜索框下方，支持组合条件）
   - 示例：`海棠一楼` + `小炒热菜` + `午餐` + `15~20元`
4. 建议补充
   - 加埋点与性能看板（先量化再优化）
   - 给推荐结果加评估集（离线评测 + 人工打分）
   - 增加错误可观测性（请求链路日志、前端异常上报）

## 5) 团队文档（都在仓库内）

- `docs/AI前后端接口契约.md`
- `docs/新对话完整Prompt.md`
- `docs/团队协作说明.md`
