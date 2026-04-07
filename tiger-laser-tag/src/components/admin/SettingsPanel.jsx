// src/components/admin/SettingsPanel.jsx
import { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle, Calendar, Zap, CheckCircle, Lock, Unlock, X, Clock } from 'lucide-react';
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

  // Estado para gestión de bloqueos
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotsForDate, setSlotsForDate] = useState([]);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockingSlot, setBlockingSlot] = useState(null);
  const [blockingDate, setBlockingDate] = useState(null);

  useEffect(() => {
    loadSettings();
    loadBlockedSlots();
    loadBlockedDates();
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

  // Cargar slots bloqueados
  const loadBlockedSlots = async () => {
    setLoadingBlocks(true);
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('id, date, start_time, end_time, status, reserved')
        .eq('status', 'blocked')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setBlockedSlots(data || []);
    } catch (error) {
      console.error('Error loading blocked slots:', error);
    } finally {
      setLoadingBlocks(false);
    }
  };

  // Cargar días bloqueados (de la tabla slot_blocks)
  const loadBlockedDates = async () => {
    try {
      const { data, error } = await supabase
        .from('slot_blocks')
        .select('date, reason, created_at')
        .order('date', { ascending: true });

      if (error) throw error;
      setBlockedDates(data || []);
    } catch (error) {
      console.error('Error loading blocked dates:', error);
    }
  };

  // Cargar slots de una fecha específica
  const loadSlotsForDate = async (date) => {
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('id, date, start_time, end_time, status, reserved')
        .eq('date', date)
        .order('start_time');

      if (error) throw error;
      setSlotsForDate(data || []);
    } catch (error) {
      console.error('Error loading slots for date:', error);
    }
  };

  // Bloquear un slot específico
  const blockSlot = async (slotId, reason = '') => {
    try {
      const { error } = await supabase
        .from('time_slots')
        .update({ status: 'blocked' })
        .eq('id', slotId);

      if (error) throw error;

      // Registrar el bloqueo en la tabla de bloqueos
      if (reason) {
        await supabase
          .from('slot_blocks')
          .insert([{
            slot_id: slotId,
            reason: reason,
            created_at: new Date().toISOString()
          }]);
      }

      await loadBlockedSlots();
      await loadSlotsForDate(selectedDate);
      setBlockModalOpen(false);
      setBlockReason('');
      setBlockingSlot(null);
      
      setMessage({ type: 'success', text: 'Slot bloqueado correctamente' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error blocking slot:', error);
      setMessage({ type: 'error', text: 'Error al bloquear el slot' });
    }
  };

  // Desbloquear un slot específico
  const unblockSlot = async (slotId) => {
    try {
      const { error } = await supabase
        .from('time_slots')
        .update({ status: 'active' })
        .eq('id', slotId);

      if (error) throw error;

      // Eliminar el registro de bloqueo
      await supabase
        .from('slot_blocks')
        .delete()
        .eq('slot_id', slotId);

      await loadBlockedSlots();
      await loadSlotsForDate(selectedDate);
      
      setMessage({ type: 'success', text: 'Slot desbloqueado correctamente' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error unblocking slot:', error);
      setMessage({ type: 'error', text: 'Error al desbloquear el slot' });
    }
  };

  // Bloquear un día entero
  const blockFullDay = async (date, reason = '') => {
    try {
      // Obtener todos los slots activos de ese día
      const { data: slots, error: fetchError } = await supabase
        .from('time_slots')
        .select('id')
        .eq('date', date)
        .eq('status', 'active');

      if (fetchError) throw fetchError;

      if (slots && slots.length > 0) {
        const slotIds = slots.map(s => s.id);
        
        const { error: updateError } = await supabase
          .from('time_slots')
          .update({ status: 'blocked' })
          .in('id', slotIds);

        if (updateError) throw updateError;
      }

      // Registrar el bloqueo del día
      const { error: insertError } = await supabase
        .from('slot_blocks')
        .insert([{
          date: date,
          reason: reason || 'Día completo bloqueado',
          created_at: new Date().toISOString()
        }]);

      if (insertError) throw insertError;

      await loadBlockedSlots();
      await loadBlockedDates();
      await loadSlotsForDate(selectedDate);
      
      setMessage({ type: 'success', text: `Día ${date} bloqueado correctamente` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error blocking full day:', error);
      setMessage({ type: 'error', text: 'Error al bloquear el día' });
    }
  };

  // Desbloquear un día entero
  const unblockFullDay = async (date) => {
    try {
      // Obtener todos los slots bloqueados de ese día (que no tengan reservas)
      const { data: slots, error: fetchError } = await supabase
        .from('time_slots')
        .select('id')
        .eq('date', date)
        .eq('status', 'blocked')
        .eq('reserved', 0);

      if (fetchError) throw fetchError;

      if (slots && slots.length > 0) {
        const slotIds = slots.map(s => s.id);
        
        const { error: updateError } = await supabase
          .from('time_slots')
          .update({ status: 'active' })
          .in('id', slotIds);

        if (updateError) throw updateError;
      }

      // Eliminar el registro de bloqueo del día
      const { error: deleteError } = await supabase
        .from('slot_blocks')
        .delete()
        .eq('date', date);

      if (deleteError) throw deleteError;

      await loadBlockedSlots();
      await loadBlockedDates();
      await loadSlotsForDate(selectedDate);
      
      setMessage({ type: 'success', text: `Día ${date} desbloqueado correctamente` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error unblocking full day:', error);
      setMessage({ type: 'error', text: 'Error al desbloquear el día' });
    }
  };

  // Verificar si un día está completamente bloqueado
  const isDayFullyBlocked = (date) => {
    return blockedDates.some(b => b.date === date);
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const { data: existing } = await supabase
        .from('business_settings')
        .select('id')
        .single();

      if (existing?.id) {
        const { error } = await supabase
          .from('business_settings')
          .update(settings)
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('business_settings')
          .insert(settings);
        
        if (error) throw error;
      }
      
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

  const handleDateSelect = async (date) => {
    setSelectedDate(date);
    await loadSlotsForDate(date);
    setBlockModalOpen(true);
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

      {/* ── Gestión de bloqueos de slots ── */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-tiger-green flex items-center gap-2">
            <Lock size={20} />
            Gestión de Bloqueos
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Bloquea o desbloquea slots específicos o días completos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Selección de fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona una fecha
            </label>
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-tiger-orange"
            />
            <Button
              onClick={() => handleDateSelect(selectedDate)}
              className="w-full mt-3 bg-tiger-green hover:bg-tiger-green/90"
            >
              <Calendar size={16} className="mr-2" />
              Ver slots del día
            </Button>
          </div>

          {/* Resumen de días bloqueados y slots bloqueados */}
          <div>
            {/* Días bloqueados */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} />
                Días bloqueados
              </label>
              <div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
                {blockedDates.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center">No hay días bloqueados</p>
                ) : (
                  <div className="space-y-2">
                    {blockedDates.map(block => (
                      <div key={block.date} className="flex justify-between items-center text-sm bg-red-50 p-2 rounded">
                        <span className="text-red-700">{block.date}</span>
                        <button
                          onClick={() => unblockFullDay(block.date)}
                          className="text-green-600 hover:text-green-800"
                          title="Desbloquear día"
                        >
                          <Unlock size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Slots bloqueados individuales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Clock size={16} />
                Slots bloqueados (individuales)
              </label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                {blockedSlots.filter(slot => slot.reserved === 0).length === 0 ? (
                  <p className="text-gray-500 text-sm text-center">No hay slots bloqueados</p>
                ) : (
                  <div className="space-y-2">
                    {blockedSlots.filter(slot => slot.reserved === 0).map(slot => (
                      <div key={slot.id} className="flex justify-between items-center text-sm bg-orange-50 p-2 rounded">
                        <div>
                          <span className="font-medium">{slot.date}</span>
                          <span className="text-gray-500 mx-2">•</span>
                          <span>{slot.start_time?.slice(0,5)} - {slot.end_time?.slice(0,5)}</span>
                        </div>
                        <button
                          onClick={() => unblockSlot(slot.id)}
                          className="text-green-600 hover:text-green-800"
                          title="Desbloquear slot"
                        >
                          <Unlock size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal de slots del día ── */}
      {blockModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-tiger-green">
                  Slots del día {selectedDate}
                </h3>
                <button
                  onClick={() => setBlockModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Botón para bloquear/desbloquear día completo */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                <span className="font-medium">Acción rápida:</span>
                {isDayFullyBlocked(selectedDate) ? (
                  <Button
                    onClick={() => unblockFullDay(selectedDate)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Unlock size={16} className="mr-2" />
                    Desbloquear día completo
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      const reason = prompt('Motivo del bloqueo (opcional):');
                      blockFullDay(selectedDate, reason || 'Bloqueado manualmente');
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Lock size={16} className="mr-2" />
                    Bloquear día completo
                  </Button>
                )}
              </div>

              {/* Lista de slots */}
              <div className="space-y-2">
                {slotsForDate.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No hay slots para este día</p>
                ) : (
                  slotsForDate.map(slot => {
                    const isBlockedByReservation = slot.reserved > 0;
                    const isBlockedByAdmin = slot.status === 'blocked' && !isBlockedByReservation;
                    
                    return (
                      <div key={slot.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <span className="font-medium">
                            {slot.start_time?.slice(0,5)} - {slot.end_time?.slice(0,5)}
                          </span>
                          <span className={`ml-3 text-xs px-2 py-1 rounded ${
                            isBlockedByReservation 
                              ? 'bg-purple-100 text-purple-800' 
                              : isBlockedByAdmin
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                          }`}>
                            {isBlockedByReservation ? 'Reservado' : isBlockedByAdmin ? 'Bloqueado' : 'Activo'}
                          </span>
                        </div>
                        <div>
                          {slot.status === 'blocked' ? (
                            <button
                              onClick={() => unblockSlot(slot.id)}
                              className="text-green-600 hover:text-green-800"
                              title="Desbloquear"
                              disabled={isBlockedByReservation}
                            >
                              <Unlock size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const reason = prompt('Motivo del bloqueo (opcional):');
                                blockSlot(slot.id, reason || 'Bloqueado manualmente');
                              }}
                              className="text-red-600 hover:text-red-800"
                              title="Bloquear"
                              disabled={isBlockedByReservation}
                            >
                              <Lock size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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