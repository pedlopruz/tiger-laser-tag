import { supabaseAdmin } from "./supabaseAdmin.js";

export default async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const { month } = req.query;

  if (!month) {
    return res.status(400).json({
      error: "Month required"
    });
  }

  try {

    const start = `${month}-01`;

    const endDate = new Date(month + "-01");
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);

    const end = endDate.toLocaleDateString("sv-SE");

    /* --------------------------
       1️⃣ Obtener días con slots activos
    -------------------------- */

    const { data, error } = await supabaseAdmin
      .rpc("get_available_days", {
        start_date: start,
        end_date: end
      });

    if (error) throw error;

    /* --------------------------
       2️⃣ Obtener días únicos
    -------------------------- */

    const uniqueDays = [...new Set(data.map(s => s.date))];

    return res.status(200).json({
      availableDays: uniqueDays
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Error fetching availability"
    });

  }

}