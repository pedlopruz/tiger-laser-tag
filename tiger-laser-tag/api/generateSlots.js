import { generateSlotsForRange } from "./generateSlotsLogic.js";

export default async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const today = new Date();
    const year = today.getFullYear();

    let startDate = today;
    let endDate = new Date(year, 11, 31); // 31 diciembre

    // 👉 si estamos en enero → generar TODO el año
    if (today.getMonth() === 0) {
      startDate = new Date(year, 0, 1);
    }

    await generateSlotsForRange(startDate, endDate);

    return res.status(200).json({
      message: "Slots generated",
      from: startDate,
      to: endDate
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Error generating slots"
    });

  }

}