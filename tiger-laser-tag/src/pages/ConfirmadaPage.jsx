import { useSearchParams } from "react-router-dom";

export default function ReservaConfirmada(){

  const [params] = useSearchParams();
  const code = params.get("code");

  return (

    <section className="py-24 bg-tiger-cream">

      <div className="container mx-auto text-center max-w-xl">

        <h1 className="text-4xl font-bold text-tiger-green mb-6">
          Reserva confirmada 🎉
        </h1>

        {code && (
          <p className="mb-6">
            Código de reserva: <strong>{code}</strong>
          </p>
        )}

        <a
          href="/"
          className="bg-tiger-orange text-white px-6 py-3 rounded-lg"
        >
          Volver al inicio
        </a>

      </div>

    </section>

  );

}