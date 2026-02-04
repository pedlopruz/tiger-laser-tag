import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Target, Gamepad2, Users, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
const ElJuegoPage = () => {
  const {
    t
  } = useTranslation();
  return <>
      <Helmet>
        <title>{t('elJuego.title')} | Tiger Laser Tag</title>
        <meta name="description" content={t('elJuego.subtitle')} />
      </Helmet>

      {/* HERO */}
      <section className="relative h-[420px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1659238693251-1e0f86d633ba" alt="Jugadores de Laser Tag" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-tiger-green/80 to-tiger-green-dark/95"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.h1 initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8
        }} className="text-5xl md:text-6xl font-heading font-bold text-tiger-golden mb-6">
            {t('elJuego.title')}
          </motion.h1>

          <p className="text-xl md:text-2xl text-tiger-cream max-w-3xl mx-auto">
            {t('elJuego.subtitle')}
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="py-24 bg-tiger-cream">
        <div className="container mx-auto px-4 space-y-32">

          {/* SECCIÓN 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center mb-6">
                <Target size={36} className="text-tiger-golden mr-4" />
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-tiger-green">
                  {t('elJuego.whatIs.title')}
                </h2>
              </div>

              <div className="w-20 h-1 bg-tiger-golden mb-8"></div>

              <p className="text-lg md:text-xl text-tiger-green/80 leading-relaxed">
                {t('elJuego.whatIs.content')}
              </p>
            </div>

            <motion.div initial={{
            opacity: 0,
            y: 40
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.7
          }}>
              <img src="https://horizons-cdn.hostinger.com/a7a25aad-bbc8-4902-9e19-553c079a77c2/photo-1659238693251-1e0f86d633ba-Sek0Q.jpg" alt="Qué es el Laser Tag" className="rounded-2xl shadow-xl w-full h-[360px] object-cover" />
            </motion.div>
          </div>

          {/* SECCIÓN 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{
            opacity: 0,
            y: 40
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.7
          }}>
              <img src="https://images.unsplash.com/photo-1521412644187-c49fa049e84d" alt="Cómo funciona el juego" className="rounded-2xl shadow-xl w-full h-[360px] object-cover" />
            </motion.div>

            <div>
              <div className="flex items-center mb-6">
                <Gamepad2 size={36} className="text-tiger-golden mr-4" />
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-tiger-green">
                  {t('elJuego.howWorks.title')}
                </h2>
              </div>

              <div className="w-20 h-1 bg-tiger-golden mb-8"></div>

              <p className="text-lg md:text-xl text-tiger-green/80 leading-relaxed">
                {t('elJuego.howWorks.content')}
              </p>
            </div>
          </div>

          {/* SECCIÓN 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center mb-6">
                <Users size={36} className="text-tiger-golden mr-4" />
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-tiger-green">
                  {t('elJuego.rules.title')}
                </h2>
              </div>

              <div className="w-20 h-1 bg-tiger-golden mb-8"></div>

              <p className="text-lg md:text-xl text-tiger-green/80 leading-relaxed">
                {t('elJuego.rules.content')}
              </p>
            </div>

            <motion.div initial={{
            opacity: 0,
            y: 40
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.7
          }}>
              <img src="https://images.unsplash.com/photo-1511512578047-dfb367046420" alt="Reglas importantes" className="rounded-2xl shadow-xl w-full h-[360px] object-cover" />
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div initial={{
          opacity: 0,
          y: 40
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.8
        }} className="bg-tiger-green rounded-2xl py-20 text-center">
            <h3 className="text-4xl font-heading font-bold text-tiger-golden mb-6">
              {t('elJuego.ctaTitle')}
            </h3>

            <p className="text-tiger-cream text-xl mb-12 max-w-3xl mx-auto">
              {t('elJuego.ctaDesc')}
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a href="/precios" className="bg-tiger-orange hover:bg-tiger-orange/90 text-white px-12 py-5 rounded-full font-bold text-lg transition-all duration-300 hover:scale-105">
                {t('elJuego.btnPrices')}
              </a>

              <a href="/contacto" className="border-2 border-tiger-golden text-tiger-golden hover:bg-tiger-golden hover:text-tiger-green px-12 py-5 rounded-full font-bold text-lg transition-all duration-300">
                {t('elJuego.btnContact')}
              </a>
            </div>
          </motion.div>

        </div>
      </section>
    </>;
};
export default ElJuegoPage;