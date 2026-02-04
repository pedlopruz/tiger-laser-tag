import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

const BlogPage = () => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const articles = [
    {
      image: "https://images.unsplash.com/photo-1511882150382-421056c89033",
      title: "Los 5 mejores consejos para ganar en Laser Tag",
      date: "15 Enero 2026",
      excerpt: "Descubre las estrategias que usan los profesionales para dominar la arena. Desde el posicionamiento hasta el trabajo en equipo, te revelamos todos los secretos.",
      category: "Consejos"
    },
    {
      image: "https://images.unsplash.com/photo-1604215601663-3040f779ccdd",
      title: "Cumpleaños inolvidables: Ideas para decorar tu fiesta",
      date: "10 Enero 2026",
      excerpt: "Haz que el cumpleaños de tu hijo sea único con estas ideas de decoración temática que complementarán perfectamente la experiencia de laser tag.",
      category: "Eventos"
    },
    {
      image: "https://images.unsplash.com/photo-1659238693251-1e0f86d633ba",
      title: "La historia del Laser Tag: De juego militar a entretenimiento",
      date: "5 Enero 2026",
      excerpt: "Conoce los orígenes fascinantes del laser tag y cómo se ha convertido en una de las actividades de entretenimiento más populares del mundo.",
      category: "Historia"
    },
    {
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c",
      title: "Team Building: Por qué el Laser Tag es perfecto para tu empresa",
      date: "28 Diciembre 2025",
      excerpt: "Descubre cómo el laser tag puede mejorar la cohesión de tu equipo de trabajo y fortalecer las habilidades de comunicación y estrategia.",
      category: "Corporativo"
    },
    {
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
      title: "Nuevos modos de juego disponibles en Tiger Laser Tag",
      date: "20 Diciembre 2025",
      excerpt: "Presentamos tres nuevos modos de juego que elevarán tu experiencia al siguiente nivel. Más emoción, más estrategia, más diversión.",
      category: "Novedades"
    },
    {
      image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac",
      title: "Beneficios del Laser Tag para el desarrollo infantil",
      date: "15 Diciembre 2025",
      excerpt: "El laser tag no es solo diversión. Conoce cómo esta actividad ayuda al desarrollo físico, social y cognitivo de los niños.",
      category: "Educación"
    }
  ];

  const handleReadMore = (title) => {
    toast({
      title: "🚧 " + t('reserva.processing'),
      description: title,
    });
  };

  return (
    <>
      <Helmet>
        <title>{t('blog.title')} | Tiger Laser Tag</title>
        <meta name="description" content={t('blog.subtitle')} />
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
            {t('blog.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-tiger-cream max-w-2xl mx-auto"
          >
            {t('blog.subtitle')}
          </motion.p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-20 bg-tiger-cream">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {articles.map((article, index) => (
              <motion.article
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 flex flex-col"
              >
                {/* Article Image */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-tiger-orange text-white px-3 py-1 rounded-full text-sm font-bold">
                      {article.category}
                    </span>
                  </div>
                </div>

                {/* Article Content */}
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex items-center space-x-2 text-tiger-green/60 text-sm mb-3">
                    <Calendar size={16} />
                    <span>{article.date}</span>
                  </div>
                  
                  <h2 className="text-xl font-heading font-bold text-tiger-green mb-3 line-clamp-2">
                    {article.title}
                  </h2>
                  
                  <p className="text-tiger-green/70 mb-4 line-clamp-3 flex-grow">
                    {article.excerpt}
                  </p>

                  <button
                    onClick={() => handleReadMore(article.title)}
                    className="flex items-center space-x-2 text-tiger-golden hover:text-tiger-orange font-bold transition-colors group"
                  >
                    <span>{t('blog.readMore')}</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Newsletter Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 bg-gradient-to-r from-tiger-green to-tiger-green-dark rounded-xl p-8 md:p-12 text-center max-w-4xl mx-auto"
          >
            <h3 className="text-3xl font-heading font-bold text-tiger-golden mb-4">
              {t('blog.newsletterTitle')}
            </h3>
            <p className="text-tiger-cream text-lg mb-6">
              {t('blog.newsletterText')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder={t('blog.emailPlaceholder')}
                className="flex-grow px-4 py-3 rounded-lg text-tiger-green focus:outline-none focus:ring-2 focus:ring-tiger-golden"
              />
              <button 
                onClick={() => toast({
                  title: "🚧 " + t('reserva.processing'),
                  description: t('blog.newsletterTitle'),
                })}
                className="bg-tiger-orange hover:bg-tiger-orange/90 text-white px-6 py-3 rounded-lg font-bold transition-all duration-300 hover:scale-105"
              >
                {t('blog.btnSubscribe')}
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default BlogPage;