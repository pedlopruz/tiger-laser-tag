import { generateSlotsForMonth } from "../utils/generateSlotsLogic.js";

export default async function handler(req, res) {

  const now = new Date();

  const year = now.getFullYear();
  const month = now.getMonth() + 2; // genera el mes siguiente

  await generateSlotsForMonth(year, month);

  res.status(200).json({
    message: "Slots generated automatically"
  });

}