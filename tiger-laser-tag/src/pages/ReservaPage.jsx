import BookingLayout from "../components/Booking/BookingLayout";

export default function Reservar() {
  return (
    <section className="py-20 bg-tiger-cream">
      <div className="container mx-auto px-4">

        <h1 className="text-4xl font-heading font-bold text-tiger-green text-center mb-12">
          Reserva tu partida
        </h1>

        <BookingLayout />

      </div>
    </section>
  );
}