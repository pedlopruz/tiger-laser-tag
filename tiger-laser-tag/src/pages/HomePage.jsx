import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Users, Trophy, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const HomePage = () => {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{t('home.heroTitle')} - Marbella</title>
        <meta name="description" content={t('home.heroSubtitle')} />
      </Helmet>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1511882150382-421056c89033"
            alt="Laser Tag Arena"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-tiger-green/90 via-tiger-green/70 to-tiger-green-dark/90"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold text-tiger-golden mb-6 leading-tight">
              {t('home.heroTitle')}
            </h1>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold text-tiger-golden mb-6 leading-tight">
              {t('home.heroTitleS')}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl lg:text-3xl text-tiger-cream mb-8 max-w-3xl mx-auto"
            >
              {t('home.heroSubtitle')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link to="/reserva">
                <Button className="bg-tiger-orange hover:bg-tiger-orange/90 text-white px-8 py-6 text-lg font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  {t('home.ctaReserve')}
                </Button>
              </Link>
              <Link to="/el-juego">
                <Button
                  variant="outline"
                  className="border-2 border-tiger-golden text-tiger-golden hover:bg-tiger-golden hover:text-tiger-green px-8 py-6 text-lg font-bold rounded-lg transition-all duration-300"
                >
                  {t('home.ctaDiscover')}
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-6 h-10 border-2 border-tiger-golden rounded-full flex justify-center pt-2"
          >
            <div className="w-1 h-2 bg-tiger-golden rounded-full"></div>
          </motion.div>
        </motion.div>
      </section>

      {/* Business Introduction Section */}
      <section className="py-20 bg-tiger-cream">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-tiger-green mb-4">
              {t('home.welcomeTitle')}
            </h2>
            <p className="text-xl text-tiger-green/80 max-w-3xl mx-auto">
              {t('home.welcomeDesc')}
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="bg-tiger-orange/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Zap className="text-tiger-orange" size={32} />
              </div>
              <h3 className="text-xl font-heading font-bold text-tiger-green mb-3 text-center">
                {t('home.features.techTitle')}
              </h3>
              <p className="text-tiger-green/70 text-center">
                {t('home.features.techDesc')}
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="bg-tiger-golden/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Users className="text-tiger-golden" size={32} />
              </div>
              <h3 className="text-xl font-heading font-bold text-tiger-green mb-3 text-center">
                {t('home.features.everyoneTitle')}
              </h3>
              <p className="text-tiger-green/70 text-center">
                {t('home.features.everyoneDesc')}
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="bg-tiger-orange/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Trophy className="text-tiger-orange" size={32} />
              </div>
              <h3 className="text-xl font-heading font-bold text-tiger-green mb-3 text-center">
                {t('home.features.competitionTitle')}
              </h3>
              <p className="text-tiger-green/70 text-center">
                {t('home.features.competitionDesc')}
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="bg-tiger-golden/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Shield className="text-tiger-golden" size={32} />
              </div>
              <h3 className="text-xl font-heading font-bold text-tiger-green mb-3 text-center">
                {t('home.features.securityTitle')}
              </h3>
              <p className="text-tiger-green/70 text-center">
                {t('home.features.securityDesc')}
              </p>
            </motion.div>
          </div>

          {/* Final Claim Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mt-20 text-center"
          >
            <h3 className="text-3xl md:text-4xl font-heading font-bold text-tiger-green mb-4">
              {t('home.finalTitle')}
            </h3>
            <p className="text-xl text-tiger-green/80 max-w-3xl mx-auto">
              {t('home.finalSubtitle')}
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default HomePage;