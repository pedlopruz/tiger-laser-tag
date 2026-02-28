import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, message } = req.body;

  try {
    await resend.emails.send({
      from: "Tiger Laser Tag <onboarding@resend.dev>",
      to: 'plopezr2011@gmail.com',
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