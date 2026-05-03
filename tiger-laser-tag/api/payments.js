import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("=== API PAYMENTS CALLED ===");
  console.log("Action:", req.body?.action);

  const { action } = req.body;

  try {
    if (action === "create-payment-intent") {
      return createPaymentIntent(req, res);
    }
    
    if (action === "cancel-payment-intent") {
      return cancelPaymentIntent(req, res);
    }

    return res.status(400).json({ error: "Invalid action" });

  } catch (error) {
    console.error('Error in payment handler:', error);
    res.status(500).json({ error: error.message });
  }
}

async function createPaymentIntent(req, res) {
  const { reservationData } = req.body;

  if (!reservationData) {
    console.error('❌ Missing reservationData');
    return res.status(400).json({ error: "Missing reservationData" });
  }

  try {
    const { nanoid } = await import('nanoid');
    const reservation_code = nanoid(12);

    console.log(`📝 Creando PaymentIntent para reserva ${reservation_code}`);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 10000,
      currency: 'eur',
      metadata: {
        reservation_code: reservation_code,
        reservation_data: JSON.stringify(reservationData)
      },
      description: `Fianza reserva Laser Tag - ${reservation_code}`
    });

    console.log(`✅ PaymentIntent creado: ${paymentIntent.id}`);

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      reservationCode: reservation_code
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
}

async function cancelPaymentIntent(req, res) {
  const { paymentIntentId } = req.body;

  if (!paymentIntentId) {
    return res.status(400).json({ error: "Missing paymentIntentId" });
  }

  try {
    await stripe.paymentIntents.cancel(paymentIntentId);
    console.log(`✅ PaymentIntent cancelado: ${paymentIntentId}`);
    
    res.status(200).json({
      success: true,
      message: "PaymentIntent cancelado correctamente"
    });
  } catch (error) {
    console.error('Error canceling payment intent:', error);
    res.status(500).json({ error: error.message });
  }
}