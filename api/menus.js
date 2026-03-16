import { getMeta, getMenuDetail, listMenus } from "../server/services/menuService.js";

export default async function handler(req, res) {
  const { pathname, searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const id = pathname.split("/").pop();

  try {
    // 模拟元数据接口 /api/menus/meta (如果需要) 或直接处理全局 meta
    if (pathname.includes("/meta")) {
      const meta = await getMeta();
      return res.status(200).json({ success: true, data: meta });
    }

    // 处理详情 /api/menus/:id
    if (id && id !== "menus") {
      const item = await getMenuDetail(id);
      if (!item) {
        return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Menu item not found." } });
      }
      return res.status(200).json({ success: true, data: { item } });
    }

    // 处理列表 /api/menus
    const query = Object.fromEntries(searchParams);
    const result = await listMenus(query);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("[api/menus] error:", error);
    return res.status(500).json({ success: false, error: { message: "Internal Server Error" } });
  }
}
