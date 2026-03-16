import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SERVER_ROOT = __dirname;
export const PROJECT_ROOT = path.resolve(SERVER_ROOT, "..");
const getSafeDataPath = () => {
    if (process.env.DATA_FILE_PATH) return process.env.DATA_FILE_PATH;
    
    const apiPath = path.join(PROJECT_ROOT, "api", "data.json");
    if (fs.existsSync(apiPath)) return apiPath;
    
    return path.join(PROJECT_ROOT, "server", "data", "recommended_menus_frontend_ui.json");
};

export const DATA_FILE_PATH = getSafeDataPath();
export const PORT = Number(process.env.PORT || 3001);
export const SERVER_TIMEZONE = process.env.SERVER_TIMEZONE || "Asia/Shanghai";

export const LLM_API_KEY =
  process.env.LLM_API_KEY ||
  process.env.DASHSCOPE_API_KEY ||
  process.env.OPENAI_API_KEY ||
  "";
export const LLM_BASE_URL = (
  process.env.LLM_BASE_URL ||
  "https://dashscope.aliyuncs.com/compatible-mode/v1"
).replace(/\/+$/, "");
export const LLM_MODEL = process.env.LLM_MODEL || "qwen3.5-plus";
export const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS || 20000);
export const LLM_ENABLE_THINKING =
  String(process.env.LLM_ENABLE_THINKING || "false").toLowerCase() === "true";
export const LLM_ENABLED = Boolean(LLM_API_KEY);

export const IS_VERCEL = !!process.env.VERCEL;
export const IS_PROD = process.env.NODE_ENV === "production" || IS_VERCEL;
