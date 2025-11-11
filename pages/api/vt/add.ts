import fs from "fs";
import path from "path";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { pageName } = req.body;
  if (!pageName) {
    return res.status(400).json({ error: "pageName is required" });
  }

  const configPath = path.join(process.cwd(), "vt_config.json");
  const configContent = fs.readFileSync(configPath, "utf-8");
  const config = JSON.parse(configContent);

  // Generate next ID
  const maxId = Math.max(...config.illusts.map((i: any) => i.id), 0);
  const nextId = maxId + 1;

  // Add new entry
  config.illusts.push({
    id: nextId,
    page_ja: pageName,
    page_en: null,
    tags: [],
  });

  // Save
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

  return res.status(200).json({ success: true, id: nextId });
}
