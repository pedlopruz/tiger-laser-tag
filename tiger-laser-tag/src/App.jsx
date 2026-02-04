import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';

import ScrollToTop from '@/components/ScrollToTop';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import ElJuegoPage from '@/pages/ElJuegoPage';
import PreciosPage from '@/pages/PreciosPage';
import CumpleañosPage from '@/pages/CumpleañosPage';
import FAQPage from '@/pages/FAQPage';
import BlogPage from '@/pages/BlogPage';
import ContactoPage from '@/pages/ContactoPage';
import ReservaPage from '@/pages/ReservaPage';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-grow">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/el-juego" element={<ElJuegoPage />} />
                <Route path="/precios" element={<PreciosPage />} />
                <Route path="/cumpleaños" element={<CumpleañosPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/contacto" element={<ContactoPage />} />
                <Route path="/reserva" element={<ReservaPage />} />
              </Routes>
            </AnimatePresence>
          </main>
          <Footer />
          <Toaster />
        </div>
      </Router>
    </I18nextProvider>
  );
}

export default App;