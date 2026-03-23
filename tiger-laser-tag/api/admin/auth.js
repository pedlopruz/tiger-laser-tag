// /api/admin/auth.js

export default async function handler(req,res){

  if(req.method !== "POST"){
    return res.status(405).json({error:"Method not allowed"});
  }

  const { action } = req.body;

  try{

    switch(action){

      case "login":
        return login(req,res);

      case "logout":
        return logout(req,res);

      default:
        return res.status(400).json({
          error:"Invalid action"
        });

    }

  }catch(err){

    console.error(err);

    return res.status(500).json({
      error:"Internal server error"
    });

  }

}
async function login(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (password === adminPassword) {
    const token = Buffer.from(`${Date.now()}:${password}`).toString('base64');
    return res.status(200).json({ 
      success: true,  // ✅ Importante: enviar success: true
      token 
    });
  }

  return res.status(401).json({ error: "Invalid password" });
}

// api/admin/logout.js
 async function logout(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Aquí podrías agregar un log de auditoría
    console.log(`Logout realizado - IP: ${req.socket.remoteAddress}`);
    
    return res.status(200).json({ 
      success: true, 
      message: "Sesión cerrada correctamente" 
    });
    
  } catch (error) {
    console.error("Error en logout:", error);
    return res.status(500).json({ 
      error: "Error al cerrar sesión",
      details: error.message 
    });
  }
}