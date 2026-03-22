//api/contact.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.body;

  try{

    switch(action){

      case "contact":
        return ContactForm(req,res);

      case "reservation":
        return sendReservationEmail(req,res);

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

async function ContactForm(req,res){

  const { name, email, phone, message } = req.body;

  try {
    await resend.emails.send({
      from: "Tiger Laser Tag <plopezr2011@gmail.com>",
      to: 'plopez2011@gmail.com',
      subject: `Nuevo mensaje de ${name}`,
      html: `
        <h2>Nuevo mensaje desde la web</h2>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Teléfono:</strong> ${phone}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${message}</p>
      `
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(500).json({ error: 'Error sending email' });
  }

}

async function sendReservationEmail(req,res){
  console.log("=== ENVÍO DE EMAIL ===");
  console.log("Method:", req.method);
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    name,
    email,
    phone,
    reservation_code,
    date,
    time_range,
    duration,
    plan_name,
    plan_price,
    people,
    personas_electroshock,
    total_price,
    menor_edad
  } = req.body;

  console.log("Datos recibidos:", {
    name,
    email,
    reservation_code,
    plan_name,
    people,
    total_price
  });

  // Validar campos requeridos
  if (!name || !email || !reservation_code) {
    console.error("❌ Faltan campos requeridos");
    return res.status(400).json({
      error: "Missing required fields: name, email, reservation_code"
    });
  }

  // Validar que la API key existe
  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY no está configurada");
    return res.status(500).json({ 
      error: "Email service not configured",
      details: "API key missing"
    });
  }

  console.log("✅ RESEND_API_KEY existe");

  try {
    // Formatear fecha
    const formattedDate = new Date(date).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const noElectroshock = people - personas_electroshock;
    const logoUrl = "https://horizons-cdn.hostinger.com/a7a25aad-bbc8-4902-9e19-553c079a77c2/ea48480a66418958fadd30f1f8277b35.png";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #1a4d3e;
            padding: 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .logo {
            max-width: 180px;
            margin: 0 auto;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .reservation-details {
            background-color: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .detail-label {
            font-weight: bold;
            color: #1a4d3e;
          }
          .total {
            font-size: 18px;
            font-weight: bold;
            color: #d4af37;
            background-color: #1a4d3e;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
            margin-top: 20px;
          }
          .code {
            font-size: 20px;
            font-weight: bold;
            text-align: center;
            background-color: #f0f0f0;
            padding: 10px;
            border-radius: 5px;
            letter-spacing: 2px;
            margin: 20px 0;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            color: #856404;
            padding: 10px;
            border-radius: 5px;
            margin-top: 20px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoUrl}" alt="Tiger Laser Tag" class="logo" style="max-width: 180px; height: auto;">
        </div>
        <div class="content">
          <h2>Hola ${name},</h2>
          <p>Tu reserva ha sido confirmada exitosamente. A continuación encontrarás los detalles:</p>
          
          <div class="reservation-details">
            <h3>Detalles de la reserva</h3>
            <div class="detail-row">
              <span class="detail-label">Código de reserva:</span>
              <span>${reservation_code}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Fecha:</span>
              <span>${formattedDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Horario:</span>
              <span>${time_range || 'No especificado'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Duración:</span>
              <span>${duration || 1} hora(s)</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Plan:</span>
              <span>${plan_name || 'No especificado'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Precio por persona:</span>
              <span>${plan_price ? `€${plan_price}` : 'No especificado'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Total jugadores:</span>
              <span>${people} persona(s)</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Participan en Electroshock:</span>
              <span>${personas_electroshock} persona(s)</span>
            </div>
            ${noElectroshock > 0 ? `
            <div class="detail-row">
              <span class="detail-label">No participan en Electroshock:</span>
              <span>${noElectroshock} persona(s)</span>
            </div>
            ` : ''}
            <div class="total">
              TOTAL: €${total_price}
            </div>
          </div>

          <div class="code">
            🎯 Código: ${reservation_code}
          </div>

          <p><strong>Información importante:</strong></p>
          <ul>
            <li>Por favor, presenta este código en recepción el día de tu reserva.</li>
            <li>Se recomienda llegar 15 minutos antes del horario reservado.</li>
            <li>El tiempo de juego comienza puntualmente a la hora reservada.</li>
          </ul>

          ${menor_edad ? `
          <div class="warning">
            ⚠️ <strong>Importante:</strong> Algunos participantes son menores de 15 años. 
            Deberá firmarse un consentimiento en el recinto.
          </div>
          ` : ''}

          <p><strong>¿Necesitas modificar tu reserva?</strong></p>
          <p>Puedes gestionar tu reserva a través del siguiente enlace:</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/mis-reservas?code=${reservation_code}">Gestionar mi reserva</a></p>
        </div>
        <div class="footer">
          <p>Tiger Laser Tag - La mejor experiencia de Laser Tag</p>
          <p>© ${new Date().getFullYear()} Tiger Laser Tag. Todos los derechos reservados.</p>
        </div>
      </body>
      </html>
    `;

    console.log("Intentando enviar email a:", email);
    
    const { data, error } = await resend.emails.send({
      from: "Tiger Laser Tag <plopezr2011@gmail.com>",
      to: email,
      subject: `Confirmación de reserva - Tiger Laser Tag - Código: ${reservation_code}`,
      html: emailHtml
    });

    if (error) {
      console.error("❌ Error de Resend:", error);
      return res.status(500).json({ 
        error: "Error sending email", 
        details: error,
        message: error.message
      });
    }

    console.log("✅ Email enviado exitosamente:", data);
    
    // También enviar al administrador
    if (process.env.ADMIN_EMAIL) {
      try {
        await resend.emails.send({
          from: "Tiger Laser Tag <plopezr2011@gmail.com>",
          to: process.env.ADMIN_EMAIL,
          subject: `Nueva reserva: ${reservation_code} - ${name}`,
          html: `
            <h2>Nueva reserva creada</h2>
            <p><strong>Código:</strong> ${reservation_code}</p>
            <p><strong>Cliente:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Teléfono:</strong> ${phone || 'No proporcionado'}</p>
            <p><strong>Total:</strong> €${total_price}</p>
          `
        });
        console.log("✅ Email al admin enviado");
      } catch (adminError) {
        console.error("Error enviando email al admin:", adminError);
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: "Email de confirmación enviado",
      data
    });

  } catch (error) {
    console.error("❌ Error general:", error);
    return res.status(500).json({ 
      error: "Error sending email", 
      details: error.message 
    });
  }
}