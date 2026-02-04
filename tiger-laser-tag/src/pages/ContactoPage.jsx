import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

const ContactoPage = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'general',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos obligatorios.",
        variant: "destructive"
      });
      return;
    }

    // Simulate form submission
    toast({
      title: t('reserva.successTitle'),
      description: t('reserva.successDesc', { name: formData.name }),
    });

    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: 'general',
      message: ''
    });
  };

  return (
    <>
      <Helmet>
        <title>{t('contacto.title')} - Tiger Laser Tag</title>
        <meta name="description" content={t('contacto.subtitle')} />
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
            {t('contacto.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-tiger-cream max-w-2xl mx-auto"
          >
            {t('contacto.subtitle')}
          </motion.p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20 bg-tiger-cream">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-white rounded-xl shadow-lg p-8"
            >
              <h2 className="text-3xl font-heading font-bold text-tiger-golden mb-6">
                {t('contacto.formTitle')}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-tiger-green font-medium mb-2">
                    {t('contacto.name')}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-tiger-green/20 focus:outline-none focus:ring-2 focus:ring-tiger-golden text-tiger-green"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-tiger-green font-medium mb-2">
                    {t('contacto.email')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-tiger-green/20 focus:outline-none focus:ring-2 focus:ring-tiger-golden text-tiger-green"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-tiger-green font-medium mb-2">
                    {t('contacto.phone')}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-tiger-green/20 focus:outline-none focus:ring-2 focus:ring-tiger-golden text-tiger-green"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-tiger-green font-medium mb-2">
                    {t('contacto.subject')}
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-tiger-green/20 focus:outline-none focus:ring-2 focus:ring-tiger-golden text-tiger-green"
                  >
                    <option value="general">{t('contacto.subjects.general')}</option>
                    <option value="reserva">{t('contacto.subjects.booking')}</option>
                    <option value="cumpleaños">{t('contacto.subjects.birthday')}</option>
                    <option value="corporativo">{t('contacto.subjects.corporate')}</option>
                    <option value="otro">{t('contacto.subjects.other')}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-tiger-green font-medium mb-2">
                    {t('contacto.message')}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-tiger-green/20 focus:outline-none focus:ring-2 focus:ring-tiger-golden text-tiger-green resize-none"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-tiger-orange hover:bg-tiger-orange/90 text-white py-6 text-lg font-bold rounded-lg transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <span>{t('contacto.btnSend')}</span>
                  <Send size={20} />
                </Button>
              </form>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              {/* Contact Details */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-3xl font-heading font-bold text-tiger-golden mb-6">
                  {t('contacto.infoTitle')}
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-tiger-orange/10 p-3 rounded-lg">
                      <Phone className="text-tiger-orange" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-tiger-green mb-1">{t('contacto.phone')}</h3>
                      <a href="tel:+34912345678" className="text-tiger-green/70 hover:text-tiger-golden transition-colors">
                        +34 912 345 678
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-tiger-golden/10 p-3 rounded-lg">
                      <Mail className="text-tiger-golden" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-tiger-green mb-1">{t('contacto.email')}</h3>
                      <a href="mailto:info@tigerlasertag.com" className="text-tiger-green/70 hover:text-tiger-golden transition-colors">
                        info@tigerlasertag.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-tiger-orange/10 p-3 rounded-lg">
                      <MapPin className="text-tiger-orange" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-tiger-green mb-1">Dirección</h3>
                      <p className="text-tiger-green/70">
                        Calle del Láser, 123<br />
                        28001 Madrid, España
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-tiger-golden/10 p-3 rounded-lg">
                      <Clock className="text-tiger-golden" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-tiger-green mb-1">{t('footer.hoursTitle')}</h3>
                      <div className="text-tiger-green/70 space-y-1 whitespace-pre-line">
                         {t('footer.hoursDesc')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-heading font-bold text-tiger-golden mb-4">
                  {t('contacto.mapTitle')}
                </h2>
                <div className="bg-tiger-cream rounded-lg h-64 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="text-tiger-golden mx-auto mb-2" size={48} />
                    <p className="text-tiger-green/60">{t('contacto.mapPlaceholder')}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ContactoPage;