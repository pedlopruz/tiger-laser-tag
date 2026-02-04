import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: "María González",
      text: "¡Una experiencia increíble! Los niños se divirtieron muchísimo en la fiesta de cumpleaños. El personal fue muy atento y las instalaciones están impecables.",
      rating: 5
    },
    {
      name: "Carlos Martínez",
      text: "Perfecto para eventos corporativos. Nuestro equipo pasó un rato fantástico y fortalecimos la cohesión del grupo. ¡Muy recomendable!",
      rating: 5
    },
    {
      name: "Laura Sánchez",
      text: "Mi hijo celebró aquí su cumpleaños y no podría estar más contenta. Todo estuvo organizado a la perfección. Volveremos sin duda.",
      rating: 5
    },
    {
      name: "Javier Ruiz",
      text: "Una actividad diferente y emocionante. El equipamiento es de última generación y las partidas son muy dinámicas. ¡Lo pasamos genial!",
      rating: 5
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <footer className="bg-tiger-green text-tiger-cream">
      {/* Testimonials Section */}
      <div className="border-b border-tiger-golden/20 py-12">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-heading font-bold text-tiger-golden text-center mb-8">
            {t('footer.testimonialsTitle')}
          </h3>
          <div className="relative max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="text-center px-12"
              >
                <div className="flex justify-center mb-4">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <span key={i} className="text-tiger-golden text-2xl">★</span>
                  ))}
                </div>
                <p className="text-lg mb-4 italic">"{testimonials[currentTestimonial].text}"</p>
                <p className="font-semibold text-tiger-golden">- {testimonials[currentTestimonial].name}</p>
              </motion.div>
            </AnimatePresence>
            <button
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 -translate-y-1/2 text-tiger-golden hover:text-tiger-orange transition-colors"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-tiger-golden hover:text-tiger-orange transition-colors"
            >
              <ChevronRight size={32} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Business Info */}
          <div>
            <img 
              src="https://horizons-cdn.hostinger.com/a7a25aad-bbc8-4902-9e19-553c079a77c2/ea48480a66418958fadd30f1f8277b35.png" 
              alt="Tiger Laser Tag" 
              className="h-16 w-16 mb-4"
            />
            <h4 className="text-tiger-golden font-heading font-bold text-xl mb-3">{t('footer.aboutTitle')}</h4>
            <p className="text-sm leading-relaxed">
              {t('footer.aboutDesc')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-tiger-golden font-heading font-bold text-lg mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              <li><Link to="/el-juego" className="hover:text-tiger-golden transition-colors">{t('navigation.elJuego')}</Link></li>
              <li><Link to="/precios" className="hover:text-tiger-golden transition-colors">{t('navigation.precios')}</Link></li>
              <li><Link to="/cumpleaños" className="hover:text-tiger-golden transition-colors">{t('navigation.cumpleanos')}</Link></li>
              <li><Link to="/faq" className="hover:text-tiger-golden transition-colors">{t('navigation.faq')}</Link></li>
              <li><Link to="/blog" className="hover:text-tiger-golden transition-colors">{t('navigation.blog')}</Link></li>
              <li><Link to="/contacto" className="hover:text-tiger-golden transition-colors">{t('navigation.contacto')}</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-tiger-golden font-heading font-bold text-lg mb-4">{t('footer.contactTitle')}</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Phone size={20} className="text-tiger-golden mt-1 flex-shrink-0" />
                <div>
                  <a href="tel:+34912345678" className="hover:text-tiger-golden transition-colors">
                    +34 912 345 678
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Mail size={20} className="text-tiger-golden mt-1 flex-shrink-0" />
                <div>
                  <a href="mailto:info@tigerlasertag.com" className="hover:text-tiger-golden transition-colors">
                    info@tigerlasertag.com
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin size={20} className="text-tiger-golden mt-1 flex-shrink-0" />
                <div>
                  <span className="text-sm">
                    Calle del Láser, 123<br />
                    29600 Marbella, España
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media & Hours */}
          <div>
            <h4 className="text-tiger-golden font-heading font-bold text-lg mb-4">{t('footer.followUs')}</h4>
            <div className="flex space-x-4 mb-6">
              <a href="#" className="text-tiger-cream hover:text-tiger-golden transition-colors">
                <Facebook size={24} />
              </a>
              <a href="#" className="text-tiger-cream hover:text-tiger-golden transition-colors">
                <Instagram size={24} />
              </a>
              <a href="#" className="text-tiger-cream hover:text-tiger-golden transition-colors">
                <Twitter size={24} />
              </a>
              <a href="#" className="text-tiger-cream hover:text-tiger-golden transition-colors">
                <Youtube size={24} />
              </a>
            </div>
            <h4 className="text-tiger-golden font-heading font-bold text-lg mb-3">{t('footer.hoursTitle')}</h4>
            <p className="text-sm whitespace-pre-line">
              {t('footer.hoursDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-tiger-golden/20 py-6">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;