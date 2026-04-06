// src/components/admin/SettingsPanel.jsx
import { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle, Calendar, Zap, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
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

  // Estado para generación de slots
  const [slotRange, setSlotRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  });
  const [generating, setGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState(null);

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
      const { error } = await supabase
        .from('business_settings')
        .update(settings)
        .eq('id', (await supabase.from('business_settings').select('id').single()).data?.id);

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

  const generateSlots = async () => {
    if (!slotRange.startDate || !slotRange.endDate) {
      setGenerateMessage({ type: 'error', text: 'Selecciona un rango de fechas válido' });
      return;
    }

    if (slotRange.startDate > slotRange.endDate) {
      setGenerateMessage({ type: 'error', text: 'La fecha de inicio debe ser anterior a la fecha de fin' });
      return;
    }

    if (!confirm(`¿Generar slots del ${slotRange.startDate} al ${slotRange.endDate}? Los slots ya existentes en ese rango no se duplicarán.`)) return;

    setGenerating(true);
    setGenerateMessage(null);

    try {
      const res = await fetch('/api/generateSlots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: slotRange.startDate,
          endDate: slotRange.endDate
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error generando slots');

      setGenerateMessage({
        type: 'success',
        text: `✅ Slots generados correctamente. Se insertaron ${data.inserted ?? '—'} nuevos slots.`
      });
    } catch (error) {
      console.error('Error generating slots:', error);
      setGenerateMessage({ type: 'error', text: `Error al generar slots: ${error.message}` });
    } finally {
      setGenerating(false);
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
      {/* ── Configuración general ── */}
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
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <AlertCircle size={16} />
            {message.text}
          </div>
        )}

        <div className="space-y-6">
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

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              ⚠️ Los cambios en la configuración afectarán a la generación de nuevos slots.
              Los slots ya existentes no se modificarán automáticamente.
            </p>
          </div>
        </div>
      </div>

      {/* ── Generación de slots ── */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-tiger-green flex items-center gap-2">
            <Zap size={20} />
            Generar Slots
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Genera los slots de reserva para el rango de fechas seleccionado usando la configuración actual.
            Los slots ya existentes en ese rango no se duplicarán.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={14} className="inline mr-1" />
              Fecha de inicio
            </label>
            <input
              type="date"
              value={slotRange.startDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSlotRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-tiger-orange"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={14} className="inline mr-1" />
              Fecha de fin
            </label>
            <input
              type="date"
              value={slotRange.endDate}
              min={slotRange.startDate}
              onChange={(e) => setSlotRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-tiger-orange"
            />
          </div>
        </div>

        {/* Resumen de configuración que se usará */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm text-gray-600">
          <p className="font-medium text-gray-700 mb-2">Se usará la siguiente configuración:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <span>⏱ Duración: <strong>{settings.slot_duration} min</strong></span>
            <span>👥 Capacidad: <strong>{settings.max_capacity} personas</strong></span>
            <span>📅 L-V: <strong>{settings.weekday_start} – {settings.weekday_end}</strong></span>
            <span>📅 S-D: <strong>{settings.weekend_start} – {settings.weekend_end}</strong></span>
          </div>
          <p className="text-xs text-amber-700 mt-2">
            💡 Si has modificado la configuración arriba, guárdala antes de generar slots.
          </p>
        </div>

        {generateMessage && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            generateMessage.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {generateMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {generateMessage.text}
          </div>
        )}

        <Button
          onClick={generateSlots}
          disabled={generating || !slotRange.startDate || !slotRange.endDate}
          className="w-full bg-tiger-orange hover:bg-tiger-orange/90 text-white font-bold py-3"
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <RefreshCw size={16} className="animate-spin" />
              Generando slots...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Zap size={16} />
              Generar slots del {slotRange.startDate} al {slotRange.endDate}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}