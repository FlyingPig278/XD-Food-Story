import { getUserFavorites, saveUserFavorites } from "../server/services/favoriteService.js";

export default async function handler(req, res) {
  const sessionId = req.headers["x-session-id"];

  if (!sessionId || sessionId.length < 8) {
    return res.status(401).json({ success: false, error: { message: "Valid Session ID required." } });
  }

  try {
    if (req.method === "GET") {
      const favorites = await getUserFavorites(sessionId);
      return res.status(200).json({ success: true, data: favorites });
    }

    if (req.method === "POST") {
      const { favorites } = req.body;
      const saved = await saveUserFavorites(sessionId, favorites || []);
      return res.status(200).json({ success: true, data: saved });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("[api/favorites] error:", error);
    return res.status(500).json({ success: false, error: { message: "Internal Server Error" } });
  }
}
