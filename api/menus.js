import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 绝对路径定位：强制去项目根目录下的 api 文件夹里找 data.json
    // 使用 process.cwd() 配合 vercel.json 的 includeFiles
    const filePath = path.join(process.cwd(), 'api', 'data.json');
    if (!fs.existsSync(filePath)) {
        // 容灾处理：尝试从原本的 server 目录找
        const fallbackPath = path.join(process.cwd(), 'server', 'data', 'recommended_menus_frontend_ui.json');
        if (fs.existsSync(fallbackPath)) {
            const fileData = fs.readFileSync(fallbackPath, 'utf8');
            return res.status(200).json({ success: true, data: JSON.parse(fileData) });
        }
        throw new Error("File not found at " + filePath);
    }

    const fileData = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(fileData);
    
    // 为了保持与前端之前逻辑的兼容性，我们包裹一层 { success: true, data: ... }
    // 如果您的前端直接读取的是数组，请将下面的包装改为直接返回 jsonData
    res.status(200).json({ success: true, data: jsonData });
  } catch (error) {
    console.error("读取 JSON 失败:", error);
    res.status(500).json({ 
      error: '找不到菜单数据，请检查 data.json 是否在 api 文件夹内',
      details: error.message 
    });
  }
}
