// src/components/admin/SettingsPanel.jsx
import { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle, Calendar, Zap, CheckCircle, Lock, Unlock, X, Clock, Users } from 'lucide-react';
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
  const [sharedDate, setSharedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sharedSlotsForDate, setSharedSlotsForDate] = useState([]);
  const [sharedPlan, setSharedPlan] = useState(null);
  const [sharedModalOpen, setSharedModalOpen] = useState(false);
  const [sharedMessage, setSharedMessage] = useState(null);
  const [loadingShared, setLoadingShared] = useState(false);

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

  useEffect(() => {
    loadSettings();
    loadBlockedSlots();
    loadBlockedDates();
    loadSharedPlan();
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

  // Cargar slots bloqueados (solo los que están en estado 'blocked' y no tienen reservas)
  const loadBlockedSlots = async () => {
    setLoadingBlocks(true);
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('id, date, start_time, end_time, status')
        .eq('status', 'blocked')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      console.log('Slots bloqueados cargados:', data);
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
        .select('id, date, start_time, end_time, status, reserved_spots')
        .eq('date', date)
        .order('start_time');

      if (error) throw error;
      setSlotsForDate(data || []);
    } catch (error) {
      console.error('Error loading slots for date:', error);
    }
  };

  // Bloquear un slot específico (sin pedir motivo)
  const blockSlot = async (slotId) => {
    try {
      const { error } = await supabase
        .from('time_slots')
        .update({ status: 'blocked' })
        .eq('id', slotId);

      if (error) throw error;

      await loadBlockedSlots();
      await loadSlotsForDate(selectedDate);
      
      setMessage({ type: 'success', text: 'Slot bloqueado correctamente' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error blocking slot:', error);
      setMessage({ type: 'error', text: 'Error al bloquear el slot: ' + error.message });
    }
  };

  // Desbloquear un slot específico
  const unblockSlot = async (slotId) => {
    try {
      console.log('Desbloqueando slot:', slotId);
      
      const { error } = await supabase
        .from('time_slots')
        .update({ status: 'active' })
        .eq('id', slotId);

      if (error) throw error;

      // Eliminar el registro de bloqueo si existe
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
      setMessage({ type: 'error', text: 'Error al desbloquear el slot: ' + error.message });
    }
  };

  // Bloquear un día entero (sin pedir motivo)
  const blockFullDay = async (date) => {
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
          reason: 'Bloqueado manualmente',
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
      setMessage({ type: 'error', text: 'Error al bloquear el día: ' + error.message });
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
        .eq('status', 'blocked');

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
      setMessage({ type: 'error', text: 'Error al desbloquear el día: ' + error.message });
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
      // 1️⃣ Leer la duración anterior ANTES de guardar
      const { data: existing } = await supabase
        .from('business_settings')
        .select('id, slot_duration')
        .single();

      const previousSlotDuration = existing?.slot_duration || 60;

      // 2️⃣ Guardar la nueva configuración
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

      // 3️⃣ Actualizar planes solo si cambió la duración
      if (previousSlotDuration !== settings.slot_duration) {
        const { data: plans, error: plansError } = await supabase
          .from('plans')
          .select('id, active, duration_minutes');

        if (plansError) throw plansError;

        const updates = plans.map(plan => {
          let newDuration;

          if (plan.active === false) {
            // Plan compartido → siempre 1 slot
            newDuration = settings.slot_duration;
          } else {
            // Detectar cuántos slots tenía usando la duración ANTERIOR
            const slotCount = plan.duration_minutes / previousSlotDuration;
            const roundedSlotCount = slotCount <= 1.5 ? 1 : 2;
            newDuration = settings.slot_duration * roundedSlotCount;
          }

          return { id: plan.id, newDuration, oldDuration: plan.duration_minutes };
        });

        // Aplicar updates solo a los que cambian
        for (const { id, newDuration, oldDuration } of updates) {
          if (newDuration !== oldDuration) {
            await supabase
              .from('plans')
              .update({ duration_minutes: newDuration })
              .eq('id', id);
          }
        }

        setMessage({
          type: 'success',
          text: `Configuración guardada. Planes actualizados a ${settings.slot_duration} min (1 slot) y ${settings.slot_duration * 2} min (2 slots).`
        });
      } else {
        setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
      }

      setTimeout(() => setMessage(null), 4000);
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

  // Cargar el plan compartido (active: false)
  const loadSharedPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('active', false)
        .single();
      if (error) throw error;
      setSharedPlan(data);
    } catch (error) {
      console.error('Error loading shared plan:', error);
    }
  };

  // Cargar slots de una fecha para el modal compartido
  const loadSharedSlotsForDate = async (date) => {
    setLoadingShared(true);
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('id, date, start_time, end_time, status, shared_plan_id, max_capacity')
        .eq('date', date)
        .order('start_time');
      if (error) throw error;
      setSharedSlotsForDate(data || []);
    } catch (error) {
      console.error('Error loading slots:', error);
    } finally {
      setLoadingShared(false);
    }
  };

  // Asignar plan compartido a un slot
  const assignSharedPlan = async (slotId) => {
    if (!sharedPlan) {
      setSharedMessage({ type: 'error', text: 'No hay ningún plan compartido configurado (active: false)' });
      return;
    }
    try {
      const { error } = await supabase
        .from('time_slots')
        .update({ shared_plan_id: sharedPlan.id })
        .eq('id', slotId);
      if (error) throw error;
      await loadSharedSlotsForDate(sharedDate);
      setSharedMessage({ type: 'success', text: 'Slot asignado como compartido' });
      setTimeout(() => setSharedMessage(null), 3000);
    } catch (error) {
      setSharedMessage({ type: 'error', text: 'Error al asignar: ' + error.message });
    }
  };

  // Quitar plan compartido de un slot
  const removeSharedPlan = async (slotId) => {
    try {
      const { error } = await supabase
        .from('time_slots')
        .update({ shared_plan_id: null })
        .eq('id', slotId);
      if (error) throw error;
      await loadSharedSlotsForDate(sharedDate);
      setSharedMessage({ type: 'success', text: 'Slot convertido a reserva normal' });
      setTimeout(() => setSharedMessage(null), 3000);
    } catch (error) {
      setSharedMessage({ type: 'error', text: 'Error al quitar: ' + error.message });
    }
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
                {blockedSlots.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center">No hay slots bloqueados</p>
                ) : (
                  <div className="space-y-2">
                    {blockedSlots.map(slot => (
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
                    onClick={() => blockFullDay(selectedDate)}
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
                    const isBlockedByReservation = (slot.reserved_spots || 0) > 0;
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
                          {slot.status === 'blocked' && !isBlockedByReservation ? (
                            <button
                              onClick={() => unblockSlot(slot.id)}
                              className="text-green-600 hover:text-green-800"
                              title="Desbloquear"
                            >
                              <Unlock size={18} />
                            </button>
                          ) : !isBlockedByReservation && (
                            <button
                              onClick={() => blockSlot(slot.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Bloquear"
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

      {/* ── Gestión de slots compartidos ── */}
<div className="bg-white rounded-xl shadow-sm p-6">
  <div className="mb-6">
    <h2 className="text-xl font-bold text-tiger-green flex items-center gap-2">
      <Users size={20} />
      Slots Compartidos
    </h2>
    <p className="text-sm text-gray-500 mt-1">
      Activa o desactiva el modo compartido en slots específicos.
      Un slot compartido permite que varios grupos se apunten hasta completar el aforo.
    </p>
    {sharedPlan ? (
      <div className="mt-2 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-1 rounded-full">
        <Users size={12} />
        Plan compartido activo: <strong>{sharedPlan.name}</strong> — €{sharedPlan.price}/persona
      </div>
    ) : (
      <div className="mt-2 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-1 rounded-full">
        <AlertCircle size={12} />
        No hay ningún plan con active: false configurado
      </div>
    )}
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Selecciona una fecha
      </label>
      <input
        type="date"
        value={sharedDate}
        min={new Date().toISOString().split('T')[0]}
        onChange={(e) => setSharedDate(e.target.value)}
        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-tiger-orange"
      />
    </div>
    <div className="flex items-end">
      <Button
        onClick={async () => {
          await loadSharedSlotsForDate(sharedDate);
          setSharedModalOpen(true);
        }}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        disabled={!sharedPlan}
      >
        <Users size={16} className="mr-2" />
        Ver slots del día
      </Button>
    </div>
  </div>

  {sharedMessage && (
    <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
      sharedMessage.type === 'success'
        ? 'bg-green-50 text-green-800 border border-green-200'
        : 'bg-red-50 text-red-800 border border-red-200'
    }`}>
      {sharedMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {sharedMessage.text}
    </div>
  )}
</div>

    {/* ── Modal slots compartidos ── */}
    {sharedModalOpen && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-tiger-green">
                Slots del {sharedDate}
              </h3>
              <button onClick={() => setSharedModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              <strong>Plan:</strong> {sharedPlan?.name} — €{sharedPlan?.price}/persona
            </div>

            {loadingShared ? (
              <div className="text-center py-8 text-gray-500">Cargando slots...</div>
            ) : sharedSlotsForDate.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No hay slots para este día</div>
            ) : (
              <div className="space-y-2">
                {sharedSlotsForDate.map(slot => {
                  const isShared = !!slot.shared_plan_id;
                  const isBlocked = slot.status === 'blocked';
                  const canToggle = !isBlocked;

                  return (
                    <div
                      key={slot.id}
                      className={`flex justify-between items-center p-3 border rounded-lg ${
                        isShared ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isShared
                            ? 'bg-blue-100 text-blue-700'
                            : isBlocked
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                        }`}>
                          {isShared ? '🤝 Compartido' : isBlocked ? '🔒 Bloqueado' : '✅ Normal'}
                        </span>
                        <span className="text-xs text-gray-400">
                          Aforo: {slot.max_capacity}
                        </span>
                      </div>

                      {canToggle && (
                        isShared ? (
                          <button
                            onClick={() => removeSharedPlan(slot.id)}
                            className="text-sm text-gray-600 hover:text-red-600 border border-gray-300 hover:border-red-300 px-3 py-1 rounded-lg transition"
                          >
                            Quitar compartido
                          </button>
                        ) : (
                          <button
                            onClick={() => assignSharedPlan(slot.id)}
                            className="text-sm text-blue-600 hover:text-blue-800 border border-blue-300 hover:border-blue-500 px-3 py-1 rounded-lg transition"
                          >
                            Activar compartido
                          </button>
                        )
                      )}

                      {isBlocked && (
                        <span className="text-xs text-gray-400 italic">No disponible</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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