import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Helmet } from "react-helmet";

export default function ReservaConfirmada() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const code = params.get("code");

  return (
    <>
      <Helmet>
        <title>{t('reservaConfirmada.meta.title')}</title>
        <meta name="description" content={t('reservaConfirmada.meta.description')} />
      </Helmet>

      <section className="py-24 bg-tiger-cream min-h-screen">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          {/* ICONO */}
          <div className="text-6xl mb-6">
            🎉
          </div>

          {/* TITULO */}
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-tiger-green mb-4">
            {t('reservaConfirmada.title')}
          </h1>

          <p className="text-gray-600 mb-10">
            {t('reservaConfirmada.subtitle')}
          </p>

          {/* TARJETA CODIGO */}
          {code && (
            <div className="bg-white shadow-lg rounded-2xl p-8 mb-10 border">
              <p className="text-sm text-gray-500 mb-2">
                {t('reservaConfirmada.reservationCode')}
              </p>
              <div className="text-2xl font-mono font-bold text-tiger-green tracking-widest">
                {code}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                {t('reservaConfirmada.saveCodeMessage')}
              </p>
            </div>
          )}

          {/* INFO IMPORTANTE */}
          <div className="bg-tiger-green/10 border border-tiger-green/20 rounded-xl p-6 mb-10 text-sm text-gray-700">
            <p className="mb-2">
              ⚡ {t('reservaConfirmada.arrivalNotice')} <strong>{t('reservaConfirmada.arrivalTime')}</strong> {t('reservaConfirmada.arrivalNoticeEnd')}
            </p>
            <p>
              {t('reservaConfirmada.modificationNotice')} <strong>{t('reservaConfirmada.modificationDeadline')}</strong>.
            </p>
          </div>

          {/* BOTONES */}
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Link
              to="/mis-reservas"
              className="bg-tiger-orange text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              {t('reservaConfirmada.manageButton')}
            </Link>
            <Link
              to="/"
              className="border border-gray-300 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              {t('reservaConfirmada.backButton')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}