// src/components/admin/AdminLogin.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log("1. Enviando petición...");
      console.log("Contraseña:", password);
      
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      console.log("2. Respuesta recibida, status:", res.status);
      
      // Intentar leer la respuesta como texto primero para depurar
      const text = await res.text();
      console.log("3. Respuesta texto:", text);
      
      let data;
      try {
        data = JSON.parse(text);
        console.log("4. Datos parseados:", data);
      } catch (e) {
        console.error("Error parseando JSON:", e);
        throw new Error("Respuesta inválida del servidor");
      }

      if (res.status === 200 && data.success) {
        console.log("5. Login exitoso, guardando token");
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminLoginTime', Date.now());
        onLogin();
      } else {
        console.log("5. Login fallido");
        setError(data.error || 'Contraseña incorrecta');
      }
    } catch (err) {
      console.error("❌ Error en fetch:", err);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Panel de Administración - Tiger Laser Tag</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-tiger-cream flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center mb-4"
            >
              <div className="bg-tiger-golden/20 p-4 rounded-full">
                <Shield className="text-tiger-golden" size={48} />
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-3xl md:text-4xl font-heading font-bold text-tiger-green mb-2"
            >
              Tiger Laser Tag
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-tiger-green/70"
            >
              Panel de Administración
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="text-center mb-6">
              <Lock className="mx-auto text-tiger-green mb-2" size={32} />
              <h2 className="text-xl font-bold text-tiger-green">Acceso Restringido</h2>
              <p className="text-gray-500 text-sm mt-1">
                Ingresa la contraseña de administrador
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-tiger-orange focus:border-tiger-orange transition-all outline-none"
                  placeholder="••••••••"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2"
                >
                  <span>❌</span>
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-tiger-orange hover:bg-tiger-orange/90 text-white py-3 text-base font-bold rounded-lg transition-all duration-300 group"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Verificando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Acceder al panel
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-400">
                Área restringida para administradores
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}