# AI 前后端接口契约（当前实现）

## 基础信息

- Base URL（开发）：`http://localhost:3001`
- 所有业务接口前缀：`/api`
- 响应格式：JSON

## 核心接口

### `GET /api/health`

- 用途：健康检查与 LLM 开关状态

### `GET /api/meta`

- 用途：返回筛选选项元信息（店铺、时间段、价格区间等）

### `GET /api/menus`

- 用途：菜单分页查询
- 常用参数：`page`、`pageSize`、`keyword`、`shop`、`category`、`mealTime`

### `GET /api/menus/:id`

- 用途：查询单个菜品详情

### `POST /api/recommend/query`

- 用途：自然语言推荐主入口
- 请求体核心字段：
  - `query`: string
  - `conversation_history`: 最近几轮对话数组（可选）
  - `debug`: boolean（可选）

### `POST /api/recommend/parse-intent`

- 用途：仅做意图解析

### `POST /api/recommend/search`

- 用途：按结构化意图返回候选

### `POST /api/recommend/explain`

- 用途：对候选结果生成解释

## 约定说明

- 无 LLM key 时，后端会自动走 fallback，不影响接口可用性。
- 推荐链路统一在后端执行，前端不直接调用模型。
- 前端搜索框关键词过滤可在本地执行，减少输入期后端压力。
