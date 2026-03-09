import { generateSlotsForMonth } from "../generateSlotsLogic.js";

export default async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const year = nextMonth.getFullYear();
    const month = nextMonth.getMonth() + 1;

    await generateSlotsForMonth(year, month);

    return res.status(200).json({
      message: "Slots generated automatically",
      year,
      month
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Error generating slots"
    });

  }

}