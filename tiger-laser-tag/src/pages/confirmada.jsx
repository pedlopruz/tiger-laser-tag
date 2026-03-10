import { useSearchParams } from "react-router-dom";

export default function ReservaConfirmada(){

  const [params] = useSearchParams();
  const code = params.get("code");

  return (
    <section>
      <h1>Reserva confirmada 🎉</h1>

      {code && (
        <p>Código de reserva: <strong>{code}</strong></p>
      )}
    </section>
  )
}