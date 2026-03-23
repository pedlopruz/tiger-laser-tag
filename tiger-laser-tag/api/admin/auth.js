// /api/admin/auth.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (password === adminPassword) {
    // Generar token simple (expira en 24h)
    const token = Buffer.from(`${Date.now()}:${password}`).toString('base64');
    return res.status(200).json({ success: true, token });
  }

  return res.status(401).json({ error: "Invalid password" });
}