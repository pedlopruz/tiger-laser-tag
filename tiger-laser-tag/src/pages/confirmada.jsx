import { useRouter } from "next/router";

export default function ReservaConfirmada(){

  const router = useRouter();
  const { code } = router.query;

  return(

    <section className="py-24 bg-tiger-cream">

      <div className="container mx-auto text-center max-w-xl">

        <h1 className="text-4xl font-bold text-tiger-green mb-6">
          Reserva confirmada 🎉
        </h1>

        <p className="text-lg mb-6">
          Hemos recibido tu reserva correctamente.
        </p>

        {code && (

          <div className="bg-white rounded-xl shadow p-6 mb-10">

            <p className="text-sm text-gray-500 mb-2">
              Tu código de reserva
            </p>

            <p className="text-2xl font-bold text-tiger-orange">
              {code}
            </p>

            <p className="text-sm text-gray-500 mt-3">
              Guárdalo por si necesitas consultar o cancelar tu reserva.
            </p>

          </div>

        )}

        <a
          href="/"
          className="bg-tiger-orange text-white px-6 py-3 rounded-lg hover:opacity-90 transition"
        >
          Volver al inicio
        </a>

      </div>

    </section>

  )

}