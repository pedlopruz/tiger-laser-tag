import React from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import BookingLayout from "../components/Booking/BookingLayout";

export default function Reservar() {
  return (
    <>
      <Helmet>
        <title>Reserva tu partida - Tiger Laser Tag</title>
        <meta
          name="description"
          content="Reserva tu partida de Laser Tag en Marbella. Elige fecha, horario y número de jugadores."
        />
      </Helmet>

      {/* HERO HEADER */}

      <section className="bg-gradient-to-b from-tiger-green to-tiger-green-dark py-20">
        <div className="container mx-auto px-4 text-center">

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl font-heading font-bold text-tiger-golden mb-4"
          >
            Reserva tu partida
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-tiger-cream max-w-2xl mx-auto"
          >
            Elige fecha, horario y número de jugadores para asegurar tu
            experiencia de Laser Tag.
          </motion.p>

          {/* BOTÓN CONSULTAR RESERVA */}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8"
          >
            <Link
              to="/mis-reservas"
              className="inline-block bg-tiger-golden text-tiger-green font-semibold px-6 py-3 rounded-lg shadow hover:opacity-90 transition"
            >
              ¿Ya tienes una reserva? Consultarla aquí
            </Link>
          </motion.div>

        </div>
      </section>

      {/* BOOKING SECTION */}

      <section className="py-20 bg-tiger-cream">
        <div className="container mx-auto px-4 max-w-7xl">
          <BookingLayout />
        </div>
      </section>
    </>
  );
}