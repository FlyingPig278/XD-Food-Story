import fs from 'fs';
import path from 'path';

const FAVORITES_FILE = path.join(process.cwd(), 'api', 'favorites.json');

async function readData() {
  try {
    if (!fs.existsSync(FAVORITES_FILE)) return {};
    const data = fs.readFileSync(FAVORITES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Read favorites failed:", error);
    return {};
  }
}

async function writeData(data) {
  // On Vercel, filesystem is read-only. For now, we skip persistence on cloud.
  // Real apps would use Redis/KV here.
  if (process.env.VERCEL) return;
  fs.writeFileSync(FAVORITES_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export default async function handler(req, res) {
  const sessionId = req.headers["x-session-id"];

  if (!sessionId || sessionId.length < 8) {
    return res.status(401).json({ success: false, error: { message: "Valid Session ID required." } });
  }

  try {
    if (req.method === "GET") {
      const data = await readData();
      const favorites = data[sessionId] || [];
      return res.status(200).json({ success: true, data: favorites });
    }

    if (req.method === "POST") {
      const { favorites } = req.body;
      const data = await readData();
      data[sessionId] = favorites || [];
      await writeData(data);
      return res.status(200).json({ success: true, data: favorites });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("[api/favorites] error:", error);
    return res.status(500).json({ success: false, error: { message: "Internal Server Error" } });
  }
}
