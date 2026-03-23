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

  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos obligatorios.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify( {action:"contact", ...formData}),
      });

      if (!response.ok) {
        throw new Error('Error al enviar');
      }

      toast({
        title: "Mensaje enviado",
        description: "Te responderemos lo antes posible.",
      });

      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'general',
        message: ''
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema enviando el mensaje.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('contacto.title')} - Tiger Laser Tag</title>
        <meta name="description" content={t('contacto.subtitle')} />
      </Helmet>

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

      <section className="py-20 bg-tiger-cream">
        <div className="container mx-auto px-4 max-w-6xl">

          {/* MAPA */}
          <div className="bg-white rounded-xl shadow-xl p-6 mb-16">
            <h2 className="text-3xl font-heading font-bold text-tiger-golden mb-6">
              {t('contacto.mapTitle')}
            </h2>

            <div className="rounded-xl overflow-hidden h-[450px]">
              <iframe
                src="https://www.google.com/maps?q=C.+Andrés+Segovia+1A+29604+Marbella,+Málaga&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
              ></iframe>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">

            {/* INFO */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-3xl font-heading font-bold text-tiger-golden mb-6">
                {t('contacto.infoTitle')}
              </h2>

              <div className="space-y-6 text-tiger-green">
                <p><strong>Teléfono:</strong> +34 912 345 678</p>
                <p><strong>Email:</strong> info@tigerlasertag.com</p>
                <p><strong>Dirección:</strong> C. Andrés Segovia 1A, Marbella</p>
              </div>
            </div>

            {/* FORM */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-3xl font-heading font-bold text-tiger-golden mb-6">
                {t('contacto.formTitle')}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">

                <input
                  type="text"
                  name="name"
                  placeholder={t('contacto.name')}
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-tiger-green/20 focus:ring-2 focus:ring-tiger-golden"
                  required
                />

                <input
                  type="email"
                  name="email"
                  placeholder={t('contacto.email')}
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-tiger-green/20 focus:ring-2 focus:ring-tiger-golden"
                  required
                />

                <input
                  type="tel"
                  name="phone"
                  placeholder={t('contacto.phone')}
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-tiger-green/20 focus:ring-2 focus:ring-tiger-golden"
                />

                <textarea
                  name="message"
                  placeholder={t('contacto.message')}
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border border-tiger-green/20 focus:ring-2 focus:ring-tiger-golden resize-none"
                  required
                />

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-tiger-orange hover:bg-tiger-orange/90 text-white py-6 text-lg font-bold rounded-lg flex items-center justify-center space-x-2"
                >
                  {loading ? "Enviando..." : t('contacto.btnSend')}
                  <Send size={20} />
                </Button>

              </form>
            </div>

          </div>
        </div>
      </section>
    </>
  );
};

export default ContactoPage;