import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, User, Mail, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

const ReservaPage = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    participants: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Basic validation
    if (!formData.name || !formData.email || !formData.phone || !formData.date || !formData.time || !formData.participants) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos obligatorios.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: t('reserva.successTitle'),
        description: t('reserva.successDesc', { name: formData.name }),
        className: "bg-tiger-green text-tiger-cream border-tiger-golden"
      });
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        date: '',
        time: '',
        participants: '',
        notes: ''
      });
    }, 1500);
  };

  return (
    <>
      <Helmet>
        <title>{t('reserva.title')} - Marbella</title>
        <meta name="description" content={t('reserva.subtitle')} />
      </Helmet>

      <section className="relative py-20 bg-tiger-green overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511882150382-421056c89033')] bg-cover bg-center opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-heading font-bold text-tiger-golden mb-4"
          >
            {t('reserva.title')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-tiger-cream max-w-2xl mx-auto"
          >
            {t('reserva.subtitle')}
          </motion.p>
        </div>
      </section>

      <section className="py-16 bg-tiger-cream">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border-t-4 border-tiger-golden"
          >
            <div className="p-8 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-xl font-heading font-bold text-tiger-green flex items-center gap-2 border-b border-tiger-green/10 pb-2">
                    <User size={20} className="text-tiger-orange" />
                    {t('reserva.contactData')}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-bold text-tiger-green/80">{t('reserva.name')}</label>
                      <input 
                        type="text" 
                        id="name" 
                        name="name" 
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-tiger-golden focus:ring-2 focus:ring-tiger-golden/20 outline-none transition-all"
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-bold text-tiger-green/80">{t('reserva.email')}</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input 
                          type="email" 
                          id="email" 
                          name="email" 
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-tiger-golden focus:ring-2 focus:ring-tiger-golden/20 outline-none transition-all"
                          placeholder="tu@email.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="phone" className="text-sm font-bold text-tiger-green/80">{t('reserva.phone')}</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input 
                          type="tel" 
                          id="phone" 
                          name="phone" 
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-tiger-golden focus:ring-2 focus:ring-tiger-golden/20 outline-none transition-all"
                          placeholder="+34 600 000 000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-xl font-heading font-bold text-tiger-green flex items-center gap-2 border-b border-tiger-green/10 pb-2">
                    <Calendar size={20} className="text-tiger-orange" />
                    {t('reserva.details')}
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="date" className="text-sm font-bold text-tiger-green/80">{t('reserva.date')}</label>
                      <input 
                        type="date" 
                        id="date" 
                        name="date" 
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-tiger-golden focus:ring-2 focus:ring-tiger-golden/20 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="time" className="text-sm font-bold text-tiger-green/80">{t('reserva.time')}</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <select 
                          id="time" 
                          name="time" 
                          value={formData.time}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-tiger-golden focus:ring-2 focus:ring-tiger-golden/20 outline-none transition-all appearance-none bg-white"
                        >
                          <option value="">--:--</option>
                          <option value="16:00">16:00</option>
                          <option value="17:00">17:00</option>
                          <option value="18:00">18:00</option>
                          <option value="19:00">19:00</option>
                          <option value="20:00">20:00</option>
                          <option value="21:00">21:00</option>
                          <option value="22:00">22:00</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="participants" className="text-sm font-bold text-tiger-green/80">{t('reserva.participants')}</label>
                      <div className="relative">
                        <Users className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input 
                          type="number" 
                          id="participants" 
                          name="participants" 
                          min="1"
                          max="30"
                          value={formData.participants}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-tiger-golden focus:ring-2 focus:ring-tiger-golden/20 outline-none transition-all"
                          placeholder="4"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-bold text-tiger-green/80">{t('reserva.notes')}</label>
                  <textarea 
                    id="notes" 
                    name="notes" 
                    rows="3"
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-tiger-golden focus:ring-2 focus:ring-tiger-golden/20 outline-none transition-all resize-none"
                    placeholder={t('reserva.notesPlaceholder')}
                  ></textarea>
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-tiger-orange to-[#ff8c5a] hover:from-[#e55a2b] hover:to-[#ff7b45] text-white font-bold text-lg py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">{t('reserva.processing')}</span>
                    ) : (
                      <span className="flex items-center gap-2">{t('reserva.btnConfirm')} <CheckCircle size={20} /></span>
                    )}
                  </Button>
                  <p className="text-xs text-center text-tiger-green/60 mt-4 flex items-center justify-center gap-1">
                    <AlertCircle size={14} />
                    {t('reserva.warning')}
                  </p>
                </div>

              </form>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default ReservaPage;