import { supabaseAdmin } from "./supabaseAdmin.js";

export default async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const { data, error } = await supabaseAdmin
      .from("plans")
      .select("*")
      .eq("active", true)
      .order("price");

    if (error) throw error;

    return res.status(200).json(data);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Error fetching plans"
    });

  }

}