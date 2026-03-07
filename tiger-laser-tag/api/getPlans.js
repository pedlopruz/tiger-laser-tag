import { supabase } from "./supabaseAdmin.js";

export default async function handler(req, res) {

  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .order("price");

  if (error) {
    return res.status(500).json({ error });
  }

  res.status(200).json(data);

}