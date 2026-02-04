import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Cake, Users, Clock, Gift, Camera, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

const CumpleañosPage = () => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleBooking = () => {
    toast({
      title: "🚧 " + t('reserva.processing'),
      description: t('cumpleanos.packageTitle'),
    });
  };

  const included = [
    { icon: Clock, text: t('cumpleanos.included.room') },
    { icon: Users, text: t('cumpleanos.included.kids') },
    { icon: Sparkles, text: t('cumpleanos.included.games') },
    { icon: Gift, text: t('cumpleanos.included.decoration') },
    { icon: Cake, text: t('cumpleanos.included.cake') },
    { icon: Camera, text: t('cumpleanos.included.photos') },
  ];

  const additionalFeatures = t('cumpleanos.featuresList', { returnObjects: true });
  const infoList = t('cumpleanos.infoList', { returnObjects: true });

  return (
    <>
      <Helmet>
        <title>{t('cumpleanos.title')} - Tiger Laser Tag</title>
        <meta name="description" content={t('cumpleanos.subtitle')} />
      </Helmet>

      {/* Hero Section */}
      <section className="relative h-96 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1604215601663-3040f779ccdd" 
            alt="Niños jugando laser tag" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-tiger-green/80 to-tiger-green-dark/90"></div>
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Cake className="text-tiger-golden mx-auto mb-4" size={64} />
            <h1 className="text-5xl md:text-6xl font-heading font-bold text-tiger-golden mb-4">
              {t('cumpleanos.title')}
            </h1>
            <p className="text-xl text-tiger-cream max-w-2xl mx-auto">
              {t('cumpleanos.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-tiger-cream">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Pricing Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-gradient-to-br from-white to-tiger-golden/5 rounded-2xl shadow-2xl overflow-hidden border-4 border-tiger-golden mb-12"
            >
              <div className="bg-tiger-golden text-tiger-green text-center py-4">
                <h2 className="text-3xl font-heading font-bold flex items-center justify-center space-x-2">
                  <Sparkles size={28} />
                  <span>{t('cumpleanos.packageTitle')}</span>
                  <Sparkles size={28} />
                </h2>
              </div>
              
              <div className="p-8 md:p-12">
                <div className="text-center mb-8">
                  <span className="text-6xl font-bold text-tiger-golden">180€</span>
                  <p className="text-tiger-green/60 text-lg mt-2">{t('cumpleanos.kidsIncluded')}</p>
                  <p className="text-tiger-green/60">{t('cumpleanos.extraChild')}</p>
                </div>

                {/* What's Included */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {included.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-center space-x-3 bg-white rounded-lg p-4 shadow"
                    >
                      <div className="bg-tiger-orange/10 p-3 rounded-full">
                        <item.icon className="text-tiger-orange" size={24} />
                      </div>
                      <span className="font-medium text-tiger-green">{item.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Button */}
                <div className="text-center">
                  <Button
                    onClick={handleBooking}
                    className="bg-tiger-orange hover:bg-tiger-orange/90 text-white px-12 py-6 text-xl font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    {t('cumpleanos.btnReserve')}
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Detailed Description */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-8 md:p-12 mb-12"
            >
              <h3 className="text-3xl font-heading font-bold text-tiger-golden mb-6 text-center">
                {t('cumpleanos.descriptionTitle')}
              </h3>
              <p className="text-tiger-green/80 text-lg leading-relaxed mb-6">
                {t('cumpleanos.descriptionText')}
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {additionalFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Check size={20} className="text-tiger-golden mt-1 flex-shrink-0" />
                    <span className="text-tiger-green/80">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Age and Requirements */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid md:grid-cols-2 gap-6"
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-xl font-heading font-bold text-tiger-golden mb-4">
                  {t('cumpleanos.agesTitle')}
                </h4>
                <p className="text-tiger-green/80 leading-relaxed">
                  {t('cumpleanos.agesDesc')}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-xl font-heading font-bold text-tiger-golden mb-4">
                  {t('cumpleanos.infoTitle')}
                </h4>
                <ul className="text-tiger-green/80 space-y-2">
                  {infoList.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Final CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-12 bg-gradient-to-r from-tiger-green to-tiger-green-dark rounded-xl p-8 text-center"
            >
              <h3 className="text-3xl font-heading font-bold text-tiger-golden mb-4">
                {t('cumpleanos.doubtsTitle')}
              </h3>
              <p className="text-tiger-cream text-lg mb-6">
                {t('cumpleanos.doubtsText')}
              </p>
              <a 
                href="/contacto"
                className="bg-tiger-golden hover:bg-tiger-golden/90 text-tiger-green px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 hover:scale-105 inline-block"
              >
                {t('cumpleanos.btnContact')}
              </a>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CumpleañosPage;