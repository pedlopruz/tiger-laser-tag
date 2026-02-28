import React from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Calendar, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import articles from "@/data/articles";

const BlogPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>{t("blog.title")} | Tiger Laser Tag</title>
        <meta name="description" content={t("blog.subtitle")} />
      </Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-b from-tiger-green to-tiger-green-dark py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl font-heading font-bold text-tiger-golden mb-4"
          >
            {t("blog.title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-tiger-cream max-w-2xl mx-auto"
          >
            {t("blog.subtitle")}
          </motion.p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-20 bg-tiger-cream">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {articles.map((article, index) => {
              const articleData = t(
                `blogArticles.${article.slug}`,
                { returnObjects: true }
              );

              return (
                <motion.article
                  key={article.slug}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 flex flex-col"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={article.image}
                      alt={articleData.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-tiger-orange text-white px-3 py-1 rounded-full text-sm font-bold">
                        {t(`blog.categories.${article.category}`)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-grow flex flex-col">
                    <div className="flex items-center space-x-2 text-tiger-green/60 text-sm mb-3">
                      <Calendar size={16} />
                      <span>{articleData.date}</span>
                    </div>

                    <h2 className="text-xl font-heading font-bold text-tiger-green mb-3 line-clamp-2">
                      {articleData.title}
                    </h2>

                    <p className="text-tiger-green/70 mb-4 line-clamp-3 flex-grow">
                      {articleData.excerpt}
                    </p>

                    <button
                      onClick={() =>
                        navigate(`/blog/${article.slug}`)
                      }
                      className="flex items-center space-x-2 text-tiger-golden hover:text-tiger-orange font-bold transition-colors group"
                    >
                      <span>{t("blog.readMore")}</span>
                      <ArrowRight
                        size={18}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

export default BlogPage;