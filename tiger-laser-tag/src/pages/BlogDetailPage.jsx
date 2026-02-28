import React from "react";
import { Helmet } from "react-helmet";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import articles from "@/data/articles";

const BlogDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const articleExists = articles.find(a => a.slug === slug);

  if (!articleExists) {
    return (
      <div className="p-20 text-center">
        {t("blog.articleNotFound")}
      </div>
    );
  }

  const articleData = t(
    `blogArticles.${slug}`,
    { returnObjects: true }
  );

  return (
    <>
      <Helmet>
        <title>{articleData.title} | Tiger Laser Tag</title>
        <meta name="description" content={articleData.excerpt} />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-20">
        <button
          onClick={() => navigate("/blog")}
          className="mb-6 text-tiger-orange font-bold hover:underline"
        >
          ← {t("blog.back")}
        </button>

        <img
          src={articleExists.image}
          alt={articleData.title}
          className="w-full h-96 object-cover rounded-xl mb-8"
        />

        <h1 className="text-4xl font-heading font-bold text-tiger-green mb-4">
          {articleData.title}
        </h1>

        <p className="text-tiger-green/60 mb-8">
          {articleData.date}
        </p>

        <div className="text-lg leading-relaxed whitespace-pre-line text-tiger-green">
          {articleData.content}
        </div>
      </div>
    </>
  );
};

export default BlogDetailPage;