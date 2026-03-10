export default function ReservaConfirmada(){

  return(

    <section className="py-24 bg-tiger-cream">

      <div className="container mx-auto text-center max-w-xl">

        <h1 className="text-4xl font-bold text-tiger-green mb-6">
          Reserva confirmada 🎉
        </h1>

        <p className="text-lg mb-10">
          Hemos recibido tu reserva correctamente.
        </p>

        <a
          href="/"
          className="bg-tiger-orange text-white px-6 py-3 rounded-lg"
        >
          Volver al inicio
        </a>

      </div>

    </section>

  )

}