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

      case "cancellation":
        console.log("=== CANCELLATION ACTION RECIBIDA ===");
        console.log("Body completo:", req.body);
        return sendCancellationEmail(req, res);

      case "change_players":
        console.log("=== CHANGE_PLAYERS ACTION RECIBIDA ===");
        console.log("Body completo:", req.body);
        return sendChangePlayersEmail(req, res);
      
      case "change_date":
        console.log("=== CHANGE_DATE ACTION RECIBIDA ===");
        console.log("Body completo:", req.body);
        return sendChangeDateEmail(req, res);

      case "confirm_reservation":
        return confirmReservationEmail(req, res);
    

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
      from: "Tiger Laser Tag <noreply@tigerlasertag.es>",
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

async function sendReservationEmail(req, res) {
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
    menor_edad,
    status = "pending" // ← Añadido: estado de la reserva
  } = req.body;

  console.log("Datos recibidos:", {
    name,
    email,
    reservation_code,
    plan_name,
    people,
    total_price,
    status
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
    
    // ✅ Función mejorada para obtener la URL base
    const getBaseUrl = () => {
      // En producción, Vercel proporciona VERCEL_URL
      if (process.env.VERCEL_URL) {
        const url = process.env.VERCEL_URL.startsWith('https://') 
          ? process.env.VERCEL_URL 
          : `https://${process.env.VERCEL_URL}`;
        console.log("Usando VERCEL_URL:", url);
        return url;
      }
      
      // En desarrollo local
      console.log("Usando localhost");
      return 'http://localhost:5173';
    };

    const baseUrl = getBaseUrl();
    const logoUrl = `https://i.imgur.com/CKWBWRc.png`;
    
    console.log("URL del logo:", logoUrl);

    // URL para confirmar reserva (con parámetros)
    const confirmUrl = `${baseUrl}/confirmar-reserva?code=${reservation_code}&email=${encodeURIComponent(email)}`;
    const manageUrl = `${baseUrl}/mis-reservas`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
            height: auto;
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
          .button-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin: 25px 0;
          }
          .btn {
            display: block;
            padding: 14px 20px;
            text-align: center;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            transition: all 0.3s ease;
          }
          .btn-primary {
            background-color: #d4af37;
            color: #1a4d3e;
            border: 2px solid #d4af37;
          }
          .btn-primary:hover {
            background-color: #c4a030;
            transform: scale(1.02);
          }
          .btn-secondary {
            background-color: #1a4d3e;
            color: white;
            border: 2px solid #1a4d3e;
          }
          .btn-secondary:hover {
            background-color: #0f3529;
            transform: scale(1.02);
          }
          .btn-outline {
            background-color: transparent;
            color: #1a4d3e;
            border: 2px solid #1a4d3e;
          }
          .btn-outline:hover {
            background-color: #1a4d3e;
            color: white;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-align: center;
            margin: 10px 0;
          }
          .status-pending {
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffc107;
          }
          .status-confirmed {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #28a745;
          }
          .info-box {
            background-color: #e8f4f8;
            border-left: 4px solid #1a4d3e;
            padding: 12px;
            margin: 15px 0;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
          hr {
            margin: 20px 0;
            border: none;
            border-top: 1px solid #ddd;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoUrl}" alt="Tiger Laser Tag" class="logo">
        </div>
        <div class="content">
          <h2>Hola ${name},</h2>
          <p>Tu reserva ha sido <strong>creada exitosamente</strong>. A continuación encontrarás los detalles:</p>
          
          <!-- Badge de estado -->
          <div style="text-align: center;">
            <span class="status-badge status-${status === 'confirmed' ? 'confirmed' : 'pending'}">
              ${status === 'confirmed' ? '✓ RESERVA CONFIRMADA' : '⏳ RESERVA PENDIENTE'}
            </span>
          </div>
          
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

          <!-- SECCIÓN DE GESTIÓN Y CONFIRMACIÓN -->
          ${status === 'pending' ? `
            <div class="info-box">
              <strong>⚠️ Tu reserva está pendiente de confirmación</strong><br>
              Para asegurar tu reserva, por favor confírmala haciendo clic en el botón de abajo.
              Una vez confirmada, no podrás modificar los datos.
            </div>
            
            <div class="button-container">
              <a href="${confirmUrl}" class="btn btn-primary">
                ✅ CONFIRMAR RESERVA
              </a>
              <a href="${manageUrl}" class="btn btn-outline">
                ✏️ EDITAR RESERVA
              </a>
            </div>
          ` : `
            <div class="info-box">
              <strong>✓ Reserva confirmada</strong><br>
              Tu reserva ya está confirmada. Si necesitas hacer algún cambio, por favor contacta con nosotros directamente.
            </div>
            
            <div class="button-container">
              <a href="${manageUrl}" class="btn btn-secondary">
                📋 VER MIS RESERVAS
              </a>
            </div>
          `}

          <hr>

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
      from: "Tiger Laser Tag <noreply@tigerlasertag.es>",
      to: email,
      subject: `${
        status === 'confirmed' 
          ? '✅ Reserva confirmada' 
          : '⏳ Pendiente de confirmación'
      } - Tiger Laser Tag - Código: ${reservation_code}`,
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
          from: "Tiger Laser Tag <noreply@tigerlasertag.es>",
          to: process.env.ADMIN_EMAIL,
          subject: `Nueva reserva pendiente: ${reservation_code} - ${name}`,
          html: `
            <h2>Nueva reserva creada (PENDIENTE)</h2>
            <p><strong>Código:</strong> ${reservation_code}</p>
            <p><strong>Cliente:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Teléfono:</strong> ${phone || 'No proporcionado'}</p>
            <p><strong>Fecha:</strong> ${formattedDate}</p>
            <p><strong>Horario:</strong> ${time_range || 'No especificado'}</p>
            <p><strong>Plan:</strong> ${plan_name || 'No especificado'}</p>
            <p><strong>Personas:</strong> ${people}</p>
            <p><strong>Total:</strong> €${total_price}</p>
            <hr>
            <p><a href="${baseUrl}/admin">Revisar reservas pendientes en el panel</a></p>
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

async function sendCancellationEmail(req, res) {
  console.log("=== DENTRO DE sendCancellationEmail ===");
  console.log("req.body:", req.body);

  const {
    name,
    email,
    reservation_code,
    date,
    time_range,
    plan_name,
    people,
    total_price
  } = req.body;  // ← leer de req.body, no del tercer parámetro

  if (!name || !email || !reservation_code) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY no está configurada");
    return res.status(500).json({ error: "Email service not configured" });
  }

  try {
    const formattedDate = date ? new Date(date).toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    }) : "No especificada";

    const getBaseUrl = () => {
      if (process.env.VERCEL_URL) {
        return process.env.VERCEL_URL.startsWith("https://")
          ? process.env.VERCEL_URL
          : `https://${process.env.VERCEL_URL}`;
      }
      return "http://localhost:5173";
    };

    const baseUrl = getBaseUrl();
    const logoUrl = `https://i.imgur.com/CKWBWRc.png`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1a4d3e; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .logo { max-width: 180px; margin: 0 auto; height: auto; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .reservation-details { background-color: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #1a4d3e; }
          .cancelled-badge { font-size: 16px; font-weight: bold; text-align: center; background-color: #dc2626; color: #fff; padding: 12px; border-radius: 5px; margin: 20px 0; }
          .code { font-size: 20px; font-weight: bold; text-align: center; background-color: #f0f0f0; padding: 10px; border-radius: 5px; letter-spacing: 2px; margin: 20px 0; color: #999; text-decoration: line-through; }
          .new-booking { background-color: #1a4d3e; color: #d4af37; text-align: center; padding: 12px; border-radius: 5px; margin-top: 20px; }
          .new-booking a { color: #d4af37; font-weight: bold; text-decoration: none; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoUrl}" alt="Tiger Laser Tag" class="logo">
        </div>
        <div class="content">
          <h2>Hola ${name},</h2>
          <p>Tu reserva ha sido <strong>cancelada correctamente</strong>. A continuación encontrarás un resumen:</p>
          <div class="cancelled-badge">❌ RESERVA CANCELADA</div>
          <div class="reservation-details">
            <h3>Detalles de la reserva cancelada</h3>
            <div class="detail-row"><span class="detail-label">Código de reserva:</span><span>${reservation_code}</span></div>
            <div class="detail-row"><span class="detail-label">Fecha:</span><span>${formattedDate}</span></div>
            <div class="detail-row"><span class="detail-label">Horario:</span><span>${time_range || "No especificado"}</span></div>
            <div class="detail-row"><span class="detail-label">Plan:</span><span>${plan_name || "No especificado"}</span></div>
            <div class="detail-row"><span class="detail-label">Jugadores:</span><span>${people} persona(s)</span></div>
            <div class="detail-row"><span class="detail-label">Total:</span><span>€${total_price}</span></div>
          </div>
          <div class="code">🎯 Código: ${reservation_code}</div>
          <p>Si deseas hacer una nueva reserva, puedes hacerlo desde nuestra web:</p>
          <div class="new-booking">
            <a href="${baseUrl}/reservar">👉 Hacer una nueva reserva</a>
          </div>
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            Si no has solicitado esta cancelación o tienes alguna duda, contacta con nosotros lo antes posible.
          </p>
        </div>
        <div class="footer">
          <p>Tiger Laser Tag - La mejor experiencia de Laser Tag</p>
          <p>© ${new Date().getFullYear()} Tiger Laser Tag. Todos los derechos reservados.</p>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: "Tiger Laser Tag <noreply@tigerlasertag.es>",
      to: email,
      subject: `Reserva cancelada - Tiger Laser Tag - Código: ${reservation_code}`,
      html: emailHtml
    });

    if (error) {
      console.error("❌ Error de Resend:", error);
      return res.status(500).json({ error: "Error sending email", details: error });
    }

    console.log("✅ Email de cancelación enviado a:", email);

    if (process.env.ADMIN_EMAIL) {
      await resend.emails.send({
        from: "Tiger Laser Tag <noreply@tigerlasertag.es>",
        to: process.env.ADMIN_EMAIL,
        subject: `Reserva cancelada: ${reservation_code} - ${name}`,
        html: `
          <h2>Reserva cancelada por el cliente</h2>
          <p><strong>Código:</strong> ${reservation_code}</p>
          <p><strong>Cliente:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Fecha:</strong> ${formattedDate}</p>
          <p><strong>Horario:</strong> ${time_range || "No especificado"}</p>
          <p><strong>Plan:</strong> ${plan_name || "No especificado"}</p>
          <p><strong>Personas:</strong> ${people}</p>
          <p><strong>Total cancelado:</strong> €${total_price}</p>
          <hr>
          <p><a href="${baseUrl}/admin">Ver panel de administración</a></p>
        `
      });
      console.log("✅ Email de cancelación al admin enviado");
    }

    return res.status(200).json({ success: true, message: "Email de cancelación enviado", data });

  } catch (error) {
    console.error("❌ Error general:", error);
    return res.status(500).json({ error: "Error sending email", details: error.message });
  }
}

async function sendChangePlayersEmail(req, res) {
  console.log("=== ENVÍO DE EMAIL CAMBIO DE JUGADORES ===");

  const {
    name,
    email,
    reservation_code,
    date,
    time_range,
    plan_name,
    original_people,
    new_people,
    new_total,
    extra_payment
  } = req.body;

  if (!name || !email || !reservation_code) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: "Email service not configured" });
  }

  try {
    const formattedDate = date ? new Date(date).toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    }) : "No especificada";

    const getBaseUrl = () => {
      if (process.env.VERCEL_URL) {
        return process.env.VERCEL_URL.startsWith("https://")
          ? process.env.VERCEL_URL
          : `https://${process.env.VERCEL_URL}`;
      }
      return "http://localhost:5173";
    };

    const baseUrl = getBaseUrl();
    const logoUrl = "https://i.imgur.com/CKWBWRc.png";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1a4d3e; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .logo { max-width: 180px; margin: 0 auto; height: auto; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .reservation-details { background-color: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #1a4d3e; }
          .updated-badge { font-size: 16px; font-weight: bold; text-align: center; background-color: #1a4d3e; color: #d4af37; padding: 12px; border-radius: 5px; margin: 20px 0; }
          .players-change { display: flex; align-items: center; justify-content: center; gap: 16px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0; }
          .players-old { font-size: 20px; color: #999; text-decoration: line-through; }
          .players-arrow { font-size: 20px; color: #1a4d3e; }
          .players-new { font-size: 24px; font-weight: bold; color: #1a4d3e; }
          .total { font-size: 18px; font-weight: bold; color: #d4af37; background-color: #1a4d3e; padding: 10px; border-radius: 5px; text-align: center; margin-top: 20px; }
          .extra-payment { background-color: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 12px; border-radius: 5px; margin-top: 16px; font-size: 14px; text-align: center; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoUrl}" alt="Tiger Laser Tag" class="logo">
        </div>
        <div class="content">
          <h2>Hola ${name},</h2>
          <p>El número de jugadores de tu reserva ha sido <strong>actualizado correctamente</strong>.</p>

          <div class="updated-badge">✅ JUGADORES ACTUALIZADOS</div>

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
              <span>${time_range || "No especificado"}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Plan:</span>
              <span>${plan_name || "No especificado"}</span>
            </div>
          </div>

          <h3 style="text-align: center; color: #1a4d3e;">Cambio de jugadores</h3>
          <div class="players-change">
            <span class="players-old">${original_people} jugadores</span>
            <span class="players-arrow">→</span>
            <span class="players-new">${new_people} jugadores</span>
          </div>

          <div class="total">NUEVO TOTAL: €${new_total}</div>

          ${extra_payment > 0 ? `
          <div class="extra-payment">
            💳 Se ha generado un pago adicional de <strong>€${extra_payment}</strong> por el incremento de jugadores.
          </div>
          ` : ""}

          <div class="manage-btn">
            <a href="${baseUrl}/mis-reservas">👉 Gestionar mi reserva</a>
          </div>
        </div>
        <div class="footer">
          <p>Tiger Laser Tag - La mejor experiencia de Laser Tag</p>
          <p>© ${new Date().getFullYear()} Tiger Laser Tag. Todos los derechos reservados.</p>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: "Tiger Laser Tag <noreply@tigerlasertag.es>",
      to: email,
      subject: `Jugadores actualizados - Tiger Laser Tag - Código: ${reservation_code}`,
      html: emailHtml
    });

    if (error) {
      console.error("❌ Error de Resend:", error);
      return res.status(500).json({ error: "Error sending email", details: error });
    }

    console.log("✅ Email de cambio de jugadores enviado a:", email);
    return res.status(200).json({ success: true, message: "Email enviado", data });

  } catch (error) {
    console.error("❌ Error general:", error);
    return res.status(500).json({ error: "Error sending email", details: error.message });
  }
}

async function sendChangeDateEmail(req, res) {
  console.log("=== ENVÍO DE EMAIL CAMBIO DE FECHA ===");

  const {
    name,
    email,
    reservation_code,
    old_date,
    old_time_range,
    new_date,
    new_time_range,
    plan_name,
    people,
    total_price
  } = req.body;

  if (!name || !email || !reservation_code) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: "Email service not configured" });
  }

  try {
    const formatDate = (date) => date ? new Date(date).toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    }) : "No especificada";

    const formattedOldDate = formatDate(old_date);
    const formattedNewDate = formatDate(new_date);

    const getBaseUrl = () => {
      if (process.env.VERCEL_URL) {
        return process.env.VERCEL_URL.startsWith("https://")
          ? process.env.VERCEL_URL
          : `https://${process.env.VERCEL_URL}`;
      }
      return "http://localhost:5173";
    };

    const baseUrl = getBaseUrl();
    const logoUrl = "https://i.imgur.com/CKWBWRc.png";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1a4d3e; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .logo { max-width: 180px; margin: 0 auto; height: auto; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .updated-badge { font-size: 16px; font-weight: bold; text-align: center; background-color: #1a4d3e; color: #d4af37; padding: 12px; border-radius: 5px; margin: 20px 0; }
          .date-change { display: flex; gap: 12px; margin: 20px 0; }
          .date-box { flex: 1; border-radius: 8px; padding: 14px; text-align: center; }
          .date-box.old { background-color: #fee2e2; border: 1px solid #fca5a5; }
          .date-box.old .label { color: #dc2626; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 6px; }
          .date-box.old .value { color: #991b1b; font-weight: bold; font-size: 14px; text-decoration: line-through; }
          .date-box.new { background-color: #dcfce7; border: 1px solid #86efac; }
          .date-box.new .label { color: #16a34a; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 6px; }
          .date-box.new .value { color: #15803d; font-weight: bold; font-size: 14px; }
          .arrow { display: flex; align-items: center; justify-content: center; font-size: 24px; color: #1a4d3e; padding-top: 10px; }
          .reservation-details { background-color: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #1a4d3e; }
          .total { font-size: 18px; font-weight: bold; color: #d4af37; background-color: #1a4d3e; padding: 10px; border-radius: 5px; text-align: center; margin-top: 20px; }
          .manage-btn { background-color: #1a4d3e; color: #d4af37; text-align: center; padding: 12px; border-radius: 5px; margin-top: 20px; }
          .manage-btn a { color: #d4af37; font-weight: bold; text-decoration: none; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoUrl}" alt="Tiger Laser Tag" class="logo">
        </div>
        <div class="content">
          <h2>Hola ${name},</h2>
          <p>El horario de tu reserva ha sido <strong>actualizado correctamente</strong>.</p>

          <div class="updated-badge">📅 HORARIO ACTUALIZADO</div>

          <div class="date-change">
            <div class="date-box old">
              <div class="label">Horario anterior</div>
              <div class="value">${formattedOldDate}</div>
              <div class="value" style="text-decoration: none; font-size: 12px; margin-top: 4px;">${old_time_range || "No especificado"}</div>
            </div>
            <div class="arrow">→</div>
            <div class="date-box new">
              <div class="label">Nuevo horario</div>
              <div class="value">${formattedNewDate}</div>
              <div class="value" style="font-size: 12px; margin-top: 4px;">${new_time_range || "No especificado"}</div>
            </div>
          </div>

          <div class="reservation-details">
            <h3>Detalles de la reserva</h3>
            <div class="detail-row">
              <span class="detail-label">Código de reserva:</span>
              <span>${reservation_code}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Plan:</span>
              <span>${plan_name || "No especificado"}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Jugadores:</span>
              <span>${people} persona(s)</span>
            </div>
            <div class="total">TOTAL: €${total_price}</div>
          </div>

          <p>Recuerda llegar 15 minutos antes del nuevo horario reservado.</p>

          <div class="manage-btn">
            <a href="${baseUrl}/mis-reservas">👉 Gestionar mi reserva</a>
          </div>
        </div>
        <div class="footer">
          <p>Tiger Laser Tag - La mejor experiencia de Laser Tag</p>
          <p>© ${new Date().getFullYear()} Tiger Laser Tag. Todos los derechos reservados.</p>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: "Tiger Laser Tag <noreply@tigerlasertag.es>",
      to: email,
      subject: `Horario actualizado - Tiger Laser Tag - Código: ${reservation_code}`,
      html: emailHtml
    });

    if (error) {
      console.error("❌ Error de Resend:", error);
      return res.status(500).json({ error: "Error sending email", details: error });
    }

    console.log("✅ Email de cambio de fecha enviado a:", email);
    return res.status(200).json({ success: true, message: "Email enviado", data });

  } catch (error) {
    console.error("❌ Error general:", error);
    return res.status(500).json({ error: "Error sending email", details: error.message });
  }
}


async function confirmReservationEmail(req, res) {
  console.log("=== ENVÍO DE EMAIL DE CONFIRMACIÓN FINAL ===");
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
    
    // Obtener URL base
    const getBaseUrl = () => {
      if (process.env.VERCEL_URL) {
        const url = process.env.VERCEL_URL.startsWith('https://') 
          ? process.env.VERCEL_URL 
          : `https://${process.env.VERCEL_URL}`;
        return url;
      }
      return 'http://localhost:5173';
    };

    const baseUrl = getBaseUrl();
    const logoUrl = `https://i.imgur.com/CKWBWRc.png`;
    const manageUrl = `${baseUrl}/mis-reservas`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${reservation_code}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
            height: auto;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .confirmation-badge {
            background-color: #28a745;
            color: white;
            text-align: center;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
          }
          .confirmation-badge h2 {
            margin: 0;
            font-size: 24px;
          }
          .confirmation-badge p {
            margin: 5px 0 0;
            font-size: 14px;
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
          .qr-container {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background-color: white;
            border-radius: 10px;
          }
          .qr-container img {
            width: 150px;
            height: 150px;
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
          .success-box {
            background-color: #d4edda;
            border-left: 4px solid #28a745;
            padding: 12px;
            margin: 15px 0;
            font-size: 14px;
            color: #155724;
          }
          .btn {
            display: block;
            padding: 14px 20px;
            text-align: center;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            transition: all 0.3s ease;
            background-color: #1a4d3e;
            color: white;
            border: 2px solid #1a4d3e;
          }
          .btn:hover {
            background-color: #0f3529;
            transform: scale(1.02);
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
          hr {
            margin: 20px 0;
            border: none;
            border-top: 1px solid #ddd;
          }
          .info-list {
            margin: 15px 0;
            padding-left: 20px;
          }
          .info-list li {
            margin: 8px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoUrl}" alt="Tiger Laser Tag" class="logo">
        </div>
        <div class="content">
          <div class="confirmation-badge">
            <h2>✅ ¡RESERVA CONFIRMADA!</h2>
            <p>Tu reserva ha sido confirmada exitosamente</p>
          </div>

          <p>Hola <strong>${name}</strong>,</p>
          
          <div class="success-box">
            <strong>🎉 ¡Todo listo!</strong><br>
            Tu reserva ya está confirmada. No es necesario que hagas nada más.
            Presenta el siguiente código QR o el código numérico en recepción el día de tu visita.
          </div>

          <div class="qr-container">
            <img src="${qrCodeUrl}" alt="Código QR de reserva">
            <p style="margin-top: 10px; font-size: 12px; color: #666;">
              Escanea este código QR en recepción
            </p>
          </div>

          <div class="code">
            🎯 Código: ${reservation_code}
          </div>

          <div class="reservation-details">
            <h3>📋 Detalles de la reserva</h3>
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
              TOTAL PAGADO: €${total_price}
            </div>
          </div>

          <hr>

          <p><strong>📌 Información importante para tu visita:</strong></p>
          <ul class="info-list">
            <li>⏰ <strong>Llegada:</strong> Por favor, llega con <strong>15 minutos de antelación</strong> a la hora reservada.</li>
            <li>📱 <strong>QR/Código:</strong> Presenta el código QR o el código numérico en recepción.</li>
            <li>👟 <strong>Vestimenta:</strong> Usa ropa y calzado cómodo (zapatillas deportivas).</li>
            <li>🔞 <strong>Menores:</strong> Los menores de 15 años deben venir acompañados de un adulto responsable.</li>
            <li>⏱️ <strong>Puntualidad:</strong> El tiempo de juego comienza puntualmente. Los retrasos no se recuperan.</li>
            <li>❌ <strong>Cancelaciones:</strong> Si no puedes asistir, contacta con nosotros con al menos 24h de antelación.</li>
          </ul>

          ${menor_edad ? `
          <div class="warning">
            ⚠️ <strong>Importante:</strong> Algunos participantes son menores de 15 años. 
            El adulto responsable deberá firmar un consentimiento en el recinto.
          </div>
          ` : ''}

          <div style="margin: 30px 0;">
            <a href="${manageUrl}" class="btn">
              📋 VER MIS RESERVAS
            </a>
          </div>

          <div class="success-box">
            <strong>📍 Dirección:</strong><br>
            Tiger Laser Tag<br>
            [Tu dirección aquí]<br>
            <a href="https://maps.google.com/?q=[TU_DIRECCION]" style="color: #1a4d3e;">Ver en Google Maps →</a>
          </div>
        </div>
        <div class="footer">
          <p><strong>Tiger Laser Tag</strong> - La mejor experiencia de Laser Tag</p>
          <p>📞 Teléfono: [TU_TELÉFONO] | ✉️ Email: [TU_EMAIL]</p>
          <p>© ${new Date().getFullYear()} Tiger Laser Tag. Todos los derechos reservados.</p>
          <p style="font-size: 11px; margin-top: 10px;">
            Este es un email automático, por favor no responder a este mensaje.
          </p>
        </div>
      </body>
      </html>
    `;

    console.log("Intentando enviar email de confirmación final a:", email);
    
    const { data, error } = await resend.emails.send({
      from: "Tiger Laser Tag <noreply@tigerlasertag.es>",
      to: email,
      subject: `✅ Reserva Confirmada - Tiger Laser Tag - Código: ${reservation_code}`,
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

    console.log("✅ Email de confirmación final enviado exitosamente:", data);
    
    return res.status(200).json({ 
      success: true, 
      message: "Confirmation email sent successfully",
      data 
    });

  } catch (error) {
    console.error("❌ Error inesperado:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      message: error.message 
    });
  }
}