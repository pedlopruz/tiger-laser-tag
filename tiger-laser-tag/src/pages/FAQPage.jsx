import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const { t } = useTranslation();

  const faqs = t('faq.questions', { returnObjects: true });

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <Helmet>
        <title>{t('faq.title')} - Tiger Laser Tag</title>
        <meta name="description" content={t('faq.subtitle')} />
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
            {t('faq.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-tiger-cream max-w-2xl mx-auto"
          >
            {t('faq.subtitle')}
          </motion.p>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-20 bg-tiger-cream">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-tiger-golden/5 transition-colors"
                >
                  <h3 className={`text-lg font-heading font-bold pr-4 ${
                    openIndex === index ? 'text-tiger-golden' : 'text-tiger-green'
                  }`}>
                    {faq.q}
                  </h3>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className={openIndex === index ? 'text-tiger-golden' : 'text-tiger-green'} size={24} />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-tiger-green/80 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 bg-gradient-to-r from-tiger-green to-tiger-green-dark rounded-xl p-8 text-center max-w-4xl mx-auto"
          >
            <h3 className="text-3xl font-heading font-bold text-tiger-golden mb-4">
              {t('faq.notFoundTitle')}
            </h3>
            <p className="text-tiger-cream text-lg mb-6">
              {t('faq.notFoundText')}
            </p>
            <a 
              href="/contacto"
              className="bg-tiger-orange hover:bg-tiger-orange/90 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 hover:scale-105 inline-block"
            >
              {t('faq.btnContact')}
            </a>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default FAQPage;