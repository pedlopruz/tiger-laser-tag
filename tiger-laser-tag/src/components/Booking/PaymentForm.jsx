import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function PaymentFormContent({ reservationCode, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/reserva-confirmada?code=${reservationCode}`
      }
    });

    if (error) {
      console.error('Error de pago:', error);
      onError?.(error.message);
    }
    
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          🔒 Pago seguro de <strong>100€</strong> (fianza). 
          Se cargará a tu tarjeta al confirmar la reserva.
        </p>
      </div>
      
      <PaymentElement />
      
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-tiger-orange hover:bg-tiger-orange/90 text-white py-3 text-lg font-bold"
      >
        {isProcessing ? "Procesando pago..." : "Pagar 100€ y confirmar reserva"}
      </Button>
    </form>
  );
}

export default function PaymentForm({ clientSecret, reservationCode, onError }) {
  if (!clientSecret) {
    return <div className="text-red-500">Error: No se pudo iniciar el pago</div>;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentFormContent 
        reservationCode={reservationCode}
        onError={onError}
      />
    </Elements>
  );
}