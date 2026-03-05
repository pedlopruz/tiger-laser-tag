import { generateSlotsForMonth } from "./utils/generateSlotsLogic.js";

export default async function handler(req, res) {
  const { year, month } = req.query;

  await generateSlotsForMonth(Number(year), Number(month));

  res.status(200).json({ message: "Slots generated successfully" });
}