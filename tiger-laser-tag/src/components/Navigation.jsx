import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const menuItems = [
    { name: t('navigation.elJuego'), path: '/el-juego' },
    { name: t('navigation.precios'), path: '/precios' },
    { name: t('navigation.cumpleanos'), path: '/cumpleaños' },
    { name: t('navigation.faq'), path: '/faq' },
    { name: t('navigation.blog'), path: '/blog' },
    { name: t('navigation.contacto'), path: '/contacto' },
  ];

  const languages = [
    { code: 'ES', label: 'Español', flag: 'https://flagcdn.com/w20/es.png' },
    { code: 'EN', label: 'English', flag: 'https://flagcdn.com/w20/gb.png' },
    { code: 'FR', label: 'Français', flag: 'https://flagcdn.com/w20/fr.png' },
    { code: 'DE', label: 'Deutsch', flag: 'https://flagcdn.com/w20/de.png' },
  ];

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode.toLowerCase());
    setIsOpen(false);
  };

  const currentLang =
    languages.find(
      (l) => l.code.toLowerCase() === i18n.language.toLowerCase()
    ) || languages[0];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-tiger-green shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">

          {/* LOGO */}
          <Link to="/" className="flex items-center space-x-3">
            <img
              src="https://horizons-cdn.hostinger.com/a7a25aad-bbc8-4902-9e19-553c079a77c2/ea48480a66418958fadd30f1f8277b35.png"
              alt="Tiger Laser Tag Logo"
              className="h-14 w-14 object-contain"
            />
            <span className="text-tiger-golden font-bold text-2xl font-heading hidden sm:block">
              Tiger Laser Tag
            </span>
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden lg:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`font-medium transition-colors duration-300 ${
                  isActive(item.path)
                    ? 'text-tiger-golden'
                    : 'text-tiger-cream hover:text-tiger-golden'
                }`}
              >
                {item.name}
              </Link>
            ))}

            <Link
              to="/reserva"
              className="ml-4 px-6 py-2 rounded-full bg-tiger-golden text-tiger-green font-bold 
                         hover:bg-tiger-cream transition-all duration-300 shadow-lg"
            >
              {t('navigation.reservaYa')}
            </Link>
          </div>

          {/* LANGUAGE + MOBILE */}
          <div className="flex items-center space-x-4">

            {/* LANGUAGE SELECTOR */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-2 py-1 rounded-md text-tiger-cream hover:text-tiger-golden transition-colors">
                <img
                  src={currentLang.flag}
                  alt={currentLang.label}
                  className="w-5 h-4 object-cover rounded-sm"
                />
                <span className="text-xs font-semibold hidden sm:block">
                  {currentLang.code}
                </span>
              </button>

              <div className="absolute right-0 mt-2 w-32 bg-tiger-green-dark rounded-lg shadow-xl
                              opacity-0 invisible group-hover:opacity-100 group-hover:visible
                              transition-all duration-300">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className="w-full px-3 py-2 flex items-center gap-2
                               text-tiger-cream hover:text-tiger-golden
                               hover:bg-tiger-green transition-colors"
                  >
                    <img
                      src={lang.flag}
                      alt={lang.label}
                      className="w-5 h-4 object-cover rounded-sm"
                    />
                    <span className="text-xs font-semibold">
                      {lang.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* MOBILE BUTTON */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden text-tiger-cream hover:text-tiger-golden transition-colors"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden"
            >
              <div className="py-4 space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-tiger-green-dark text-tiger-golden'
                        : 'text-tiger-cream hover:bg-tiger-green-dark hover:text-tiger-golden'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </nav>
  );
};

export default Navigation;