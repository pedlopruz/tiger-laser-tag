// src/components/admin/SettingsPanel.jsx
import { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient'; // ✅ Cambiar a supabase
import { Button } from '@/components/ui/button';

export default function SettingsPanel() {
  const [settings, setSettings] = useState({
    slot_duration: 60,
    max_capacity: 20,
    weekday_start: '17:00',
    weekday_end: '23:00',
    weekend_start: '16:00',
    weekend_end: '23:30'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .single();

      if (error) throw error;
      if (data) {
        setSettings({
          slot_duration: data.slot_duration || 60,
          max_capacity: data.max_capacity || 20,
          weekday_start: data.weekday_start || '17:00',
          weekday_end: data.weekday_end || '23:00',
          weekend_start: data.weekend_start || '16:00',
          weekend_end: data.weekend_end || '23:30'
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await supabaseAdmin
        .from('business_settings')
        .update(settings)
        .eq('id', (await supabaseAdmin.from('business_settings').select('id').single()).data?.id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Error al guardar la configuración' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tiger-orange"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-tiger-green">Configuración del Sistema</h2>
            <p className="text-sm text-gray-500 mt-1">Gestiona los parámetros generales del negocio</p>
          </div>
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="bg-tiger-green hover:bg-tiger-green/90"
          >
            {saving ? (
              <>
                <RefreshCw size={16} className="animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <AlertCircle size={16} />
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* Duración de slots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración de cada slot (minutos)
              </label>
              <select
                value={settings.slot_duration}
                onChange={(e) => handleChange('slot_duration', parseInt(e.target.value))}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-tiger-orange"
              >
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
                <option value={90}>90 minutos</option>
                <option value={120}>120 minutos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacidad máxima por slot
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.max_capacity}
                onChange={(e) => handleChange('max_capacity', parseInt(e.target.value))}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-tiger-orange"
              />
            </div>
          </div>

          {/* Horarios días laborables */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-tiger-green mb-4">Horarios Laborables (Lunes a Viernes)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hora de apertura</label>
                <input
                  type="time"
                  value={settings.weekday_start}
                  onChange={(e) => handleChange('weekday_start', e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-tiger-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hora de cierre</label>
                <input
                  type="time"
                  value={settings.weekday_end}
                  onChange={(e) => handleChange('weekday_end', e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-tiger-orange"
                />
              </div>
            </div>
          </div>

          {/* Horarios fines de semana */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-tiger-green mb-4">Horarios Fines de Semana (Sábado y Domingo)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hora de apertura</label>
                <input
                  type="time"
                  value={settings.weekend_start}
                  onChange={(e) => handleChange('weekend_start', e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-tiger-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hora de cierre</label>
                <input
                  type="time"
                  value={settings.weekend_end}
                  onChange={(e) => handleChange('weekend_end', e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-tiger-orange"
                />
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-amber-800">
              ⚠️ Los cambios en la configuración afectarán a la generación de nuevos slots.
              Los slots ya existentes no se modificarán automáticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}