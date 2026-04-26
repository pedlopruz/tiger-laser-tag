import { supabaseAdmin } from "./supabaseAdmin.js";

export default async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 🔥 TRAER TODOS LOS PLANES - sin filtrar por active
    const { data, error } = await supabaseAdmin
      .from("plans")
      .select("*")
      .order("duration_minutes", { ascending: true })
      .order("price", { ascending: true });

    if (error) throw error;

    return res.status(200).json(data);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Error fetching plans"
    });
  }
}