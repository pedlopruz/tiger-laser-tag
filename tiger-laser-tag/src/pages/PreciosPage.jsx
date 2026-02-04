import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Check, Users, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

const PreciosPage = () => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const packages = [
    {
      name: t('precios.packages.basic.name'),
      price: "15€",
      duration: "15 min",
      participants: "1",
      features: t('precios.packages.basic.features', { returnObjects: true }),
      isPremium: false
    },
    {
      name: t('precios.packages.standard.name'),
      price: "25€",
      duration: "30 min",
      participants: "1",
      features: t('precios.packages.standard.features', { returnObjects: true }),
      isPremium: false
    },
    {
      name: t('precios.packages.premium.name'),
      price: "40€",
      duration: "45 min",
      participants: "1",
      features: t('precios.packages.premium.features', { returnObjects: true }),
      isPremium: true
    },
    {
      name: t('precios.packages.group.name'),
      price: "120€",
      duration: "30 min",
      participants: "Max 10",
      features: t('precios.packages.group.features', { returnObjects: true }),
      isPremium: false
    },
    {
      name: t('precios.packages.vip.name'),
      price: "250€",
      duration: "45 min",
      participants: "Max 15",
      features: t('precios.packages.vip.features', { returnObjects: true }),
      isPremium: true
    }
  ];

  const handleBooking = (packageName) => {
    toast({
      title: "🚧 " + t('reserva.processing'),
      description: packageName,
    });
  };

  const infoList = t('precios.infoList', { returnObjects: true });

  return (
    <>
      <Helmet>
        <title>{t('precios.title')} - Tiger Laser Tag</title>
        <meta name="description" content={t('precios.subtitle')} />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-tiger-green to-tiger-green-dark py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl font-heading font-bold text-tiger-golden mb-4"
          >
            {t('precios.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-tiger-cream max-w-2xl mx-auto"
          >
            {t('precios.subtitle')}
          </motion.p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-tiger-cream">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {packages.map((pkg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex flex-col ${
                  pkg.isPremium ? 'border-4 border-tiger-golden' : ''
                }`}
              >
                {pkg.isPremium && (
                  <div className="bg-tiger-golden text-tiger-green text-center py-2 rounded-t-lg font-bold flex items-center justify-center space-x-2">
                    <Star size={16} fill="currentColor" />
                    <span>{t('precios.common.premiumLabel')}</span>
                    <Star size={16} fill="currentColor" />
                  </div>
                )}
                <div className="p-8 flex-grow">
                  <h3 className="text-2xl font-heading font-bold text-tiger-green mb-2">
                    {pkg.name}
                  </h3>
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-tiger-golden">{pkg.price}</span>
                    <span className="text-tiger-green/60 ml-2">{t('precios.common.perPerson')}</span>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center space-x-2 text-tiger-green/80">
                      <Clock size={18} className="text-tiger-orange" />
                      <span>{pkg.duration}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-tiger-green/80">
                      <Users size={18} className="text-tiger-orange" />
                      <span>{pkg.participants}</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {pkg.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <Check size={20} className="text-tiger-golden mt-0.5 flex-shrink-0" />
                        <span className="text-tiger-green/80">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8 pt-0">
                  <Button
                    onClick={() => handleBooking(pkg.name)}
                    className="w-full bg-tiger-orange hover:bg-tiger-orange/90 text-white py-6 text-lg font-bold rounded-lg transition-all duration-300"
                  >
                    {t('precios.common.btnReserve')}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-16 bg-white rounded-xl p-8 shadow-lg max-w-4xl mx-auto"
          >
            <h3 className="text-2xl font-heading font-bold text-tiger-golden mb-4 text-center">
              {t('precios.infoTitle')}
            </h3>
            <ul className="space-y-2 text-tiger-green/80">
              {infoList.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default PreciosPage;