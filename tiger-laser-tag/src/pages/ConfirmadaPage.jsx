import { useSearchParams, Link } from "react-router-dom";

export default function ReservaConfirmada(){

  const [params] = useSearchParams();
  const code = params.get("code");

  return (

    <section className="py-24 bg-tiger-cream min-h-screen">

      <div className="container mx-auto px-4 max-w-2xl text-center">

        {/* ICONO */}

        <div className="text-6xl mb-6">
          🎉
        </div>

        {/* TITULO */}

        <h1 className="text-4xl md:text-5xl font-heading font-bold text-tiger-green mb-4">
          ¡Reserva confirmada!
        </h1>

        <p className="text-gray-600 mb-10">
          Tu partida de Laser Tag ha sido reservada correctamente.
        </p>

        {/* TARJETA CODIGO */}

        {code && (

          <div className="bg-white shadow-lg rounded-2xl p-8 mb-10 border">

            <p className="text-sm text-gray-500 mb-2">
              Tu código de reserva
            </p>

            <div className="text-2xl font-mono font-bold text-tiger-green tracking-widest">
              {code}
            </div>

            <p className="text-sm text-gray-500 mt-4">
              Guárdalo o revisa tu email para consultar o modificar tu reserva.
            </p>

          </div>

        )}

        {/* INFO IMPORTANTE */}

        <div className="bg-tiger-green/10 border border-tiger-green/20 rounded-xl p-6 mb-10 text-sm text-gray-700">

          <p className="mb-2">
            ⚡ Llega <strong>15 minutos antes</strong> de tu partida para preparar el equipo.
          </p>

          <p>
            Si necesitas modificar tu reserva, puedes hacerlo hasta <strong>48 horas antes</strong>.
          </p>

        </div>

        {/* BOTONES */}

        <div className="flex flex-col md:flex-row justify-center gap-4">

          <Link
            to="/mis-reservas"
            className="bg-tiger-orange text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Gestionar mi reserva
          </Link>

          <Link
            to="/"
            className="border border-gray-300 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Volver al inicio
          </Link>

        </div>

      </div>

    </section>

  );

}