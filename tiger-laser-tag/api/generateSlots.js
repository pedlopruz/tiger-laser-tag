import { generateSlotsForRange } from "./generateSlotsLogic.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {  
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { startDate, endDate } = req.body;

    console.log("generateSlots called:", { startDate, endDate });

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate y endDate son requeridos" });
    }

    const result = await generateSlotsForRange(
      new Date(startDate),
      new Date(endDate)
    );

    return res.status(200).json({
      message: "Slots generated",
      inserted: result.inserted,
      from: startDate,
      to: endDate
    });

  } catch (error) {
    console.error("Error in generateSlots:", error);
    return res.status(500).json({ error: error.message ?? "Error generating slots" });
  }
}