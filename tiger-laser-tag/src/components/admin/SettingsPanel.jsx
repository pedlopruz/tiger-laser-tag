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
  const [availableSharedPlans, setAvailableSharedPlans] = useState([]);
  const [sharedModalOpen, setSharedModalOpen] = useState(false);
  const [sharedMessage, setSharedMessage] = useState(null);
  const [loadingShared, setLoadingShared] = useState(false);

  const [slotRange, setSlotRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  });
  const [generating, setGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState(null);

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
    loadAllSharedPlans();
  }, []);

  // Cargar configuración - MANEJA MÚLTIPLES FILAS
  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Tomar el registro más reciente (mayor ID)
        const latestSettings = data.sort((a, b) => (b.id || 0) - (a.id || 0))[0];
        
        setSettings({
          slot_duration: latestSettings.slot_duration || 60,
          max_capacity: latestSettings.max_capacity || 20,
          weekday_start: latestSettings.weekday_start || '17:00',
          weekday_end: latestSettings.weekday_end || '23:00',
          weekend_start: latestSettings.weekend_start || '16:00',
          weekend_end: latestSettings.weekend_end || '23:30'
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Guardar configuración - MANEJA MÚLTIPLES FILAS
  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const { data: existing } = await supabase
        .from('business_settings')
        .select('id');

      if (existing && existing.length > 0) {
        // Actualizar el primer registro
        const { error } = await supabase
          .from('business_settings')
          .update(settings)
          .eq('id', existing[0].id);
        if (error) throw error;
        
        // Eliminar duplicados si existen
        if (existing.length > 1) {
          const idsToDelete = existing.slice(1).map(r => r.id);
          await supabase.from('business_settings').delete().in('id', idsToDelete);
        }
      } else {
        // Insertar nuevo registro
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

  // Cargar TODOS los planes compartidos disponibles
  const loadAllSharedPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('active', false)
        .order('duration_minutes', { ascending: true });
      
      if (error) throw error;
      setAvailableSharedPlans(data || []);
      
      // Cargar el plan para la duración actual
      if (data && data.length > 0) {
        await loadSharedPlanForDuration(settings.slot_duration);
      }
    } catch (error) {
      console.error('Error loading shared plans:', error);
      setAvailableSharedPlans([]);
    }
  };

  // Cargar plan compartido específico para una duración
  const loadSharedPlanForDuration = async (durationMinutes) => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('active', false)
        .eq('duration_minutes', durationMinutes)
        .maybeSingle();
      
      if (error) throw error;
      setSharedPlan(data || null);
      return data;
    } catch (error) {
      console.error('Error loading shared plan for duration:', error);
      setSharedPlan(null);
      return null;
    }
  };

  // Cuando cambia la duración del slot, actualizar el plan compartido
  const handleDurationChange = async (newDuration) => {
    handleChange('slot_duration', parseInt(newDuration));
    await loadSharedPlanForDuration(parseInt(newDuration));
  };

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
      setBlockedSlots(data || []);
    } catch (error) {
      console.error('Error loading blocked slots:', error);
    } finally {
      setLoadingBlocks(false);
    }
  };

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

  const loadSlotsForDate = async (date) => {
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('id, date, start_time, end_time, status, reserved_spots, max_capacity')
        .eq('date', date)
        .order('start_time');
      if (error) throw error;
      setSlotsForDate(data || []);
    } catch (error) {
      console.error('Error loading slots for date:', error);
    }
  };

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

  const unblockSlot = async (slotId) => {
    try {
      const { error } = await supabase
        .from('time_slots')
        .update({ status: 'active' })
        .eq('id', slotId);
      if (error) throw error;
      await supabase.from('slot_blocks').delete().eq('slot_id', slotId);
      await loadBlockedSlots();
      await loadSlotsForDate(selectedDate);
      setMessage({ type: 'success', text: 'Slot desbloqueado correctamente' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error unblocking slot:', error);
      setMessage({ type: 'error', text: 'Error al desbloquear el slot: ' + error.message });
    }
  };

  const blockFullDay = async (date) => {
    try {
      const { data: slots, error: fetchError } = await supabase
        .from('time_slots')
        .select('id')
        .eq('date', date)
        .eq('status', 'active');
      if (fetchError) throw fetchError;

      if (slots && slots.length > 0) {
        const { error: updateError } = await supabase
          .from('time_slots')
          .update({ status: 'blocked' })
          .in('id', slots.map(s => s.id));
        if (updateError) throw updateError;
      }

      const { error: insertError } = await supabase
        .from('slot_blocks')
        .insert([{ date, reason: 'Bloqueado manualmente', created_at: new Date().toISOString() }]);
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

  const unblockFullDay = async (date) => {
    try {
      const { data: slots, error: fetchError } = await supabase
        .from('time_slots')
        .select('id')
        .eq('date', date)
        .eq('status', 'blocked');
      if (fetchError) throw fetchError;

      if (slots && slots.length > 0) {
        const { error: updateError } = await supabase
          .from('time_slots')
          .update({ status: 'active' })
          .in('id', slots.map(s => s.id));
        if (updateError) throw updateError;
      }

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

  const isDayFullyBlocked = (date) => blockedDates.some(b => b.date === date);

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
        body: JSON.stringify({ startDate: slotRange.startDate, endDate: slotRange.endDate })
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

  const assignSharedPlan = async (slotId, slotDuration) => {
    let planFor1Slot = availableSharedPlans.find(p => p.duration_minutes === slotDuration);
    let planFor2Slots = availableSharedPlans.find(p => p.duration_minutes === slotDuration * 2);

    if (!planFor1Slot) {
      setSharedMessage({ 
        type: 'error', 
        text: `No hay plan Reserva libre para ${slotDuration} minutos (1 slot)` 
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('time_slots')
        .update({ 
          shared_plan_id: planFor1Slot.id,
          shared_plan_id_2slots: planFor2Slots?.id || null  // ← null si no existe
        })
        .eq('id', slotId);
      if (error) throw error;

      await loadSharedSlotsForDate(sharedDate);
      setSharedMessage({ 
        type: 'success', 
        text: `Slot Reserva Libre activado${planFor2Slots ? ' (también disponible para 2 slots)' : ''}` 
      });
      setTimeout(() => setSharedMessage(null), 3000);
    } catch (error) {
      setSharedMessage({ type: 'error', text: 'Error al asignar: ' + error.message });
    }
  };

  const removeSharedPlan = async (slotId) => {
    try {
      const { error } = await supabase
        .from('time_slots')
        .update({ shared_plan_id: null, shared_plan_id_2slots: null })
        .eq('id', slotId);
      if (error) throw error;
      await loadSharedSlotsForDate(sharedDate);
      setSharedMessage({ type: 'success', text: 'Slot convertido a reserva normal' });
      setTimeout(() => setSharedMessage(null), 3000);
    } catch (error) {
      setSharedMessage({ type: 'error', text: 'Error al quitar: ' + error.message });
    }
  };

  // Obtener la duración de un slot basado en start_time y end_time
  const getSlotDuration = (startTime, endTime) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return (end - start) / (1000 * 60);
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
          <Button onClick={saveSettings} disabled={saving} className="bg-tiger-green hover:bg-tiger-green/90">
            {saving ? <><RefreshCw size={16} className="animate-spin mr-2" />Guardando...</> : <><Save size={16} className="mr-2" />Guardar Cambios</>}
          </Button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            <AlertCircle size={16} />
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duración de cada slot (minutos)</label>
              <select
                value={settings.slot_duration}
                onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-tiger-orange"
              >
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
                <option value={90}>90 minutos</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                💡 Asegúrate de tener planes con <strong>{settings.slot_duration} min</strong> (1 slot)
                y <strong>{settings.slot_duration * 2} min</strong> (2 slots) en la base de datos.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Capacidad máxima por slot</label>
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
                <input type="time" value={settings.weekday_start} onChange={(e) => handleChange('weekday_start', e.target.value)} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-tiger-orange" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hora de cierre</label>
                <input type="time" value={settings.weekday_end} onChange={(e) => handleChange('weekday_end', e.target.value)} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-tiger-orange" />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-tiger-green mb-4">Horarios Fines de Semana (Sábado y Domingo)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hora de apertura</label>
                <input type="time" value={settings.weekend_start} onChange={(e) => handleChange('weekend_start', e.target.value)} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-tiger-orange" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hora de cierre</label>
                <input type="time" value={settings.weekend_end} onChange={(e) => handleChange('weekend_end', e.target.value)} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-tiger-orange" />
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

      {/* ── Gestión de bloqueos ── */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-tiger-green flex items-center gap-2">
            <Lock size={20} />
            Gestión de Bloqueos
          </h2>
          <p className="text-sm text-gray-500 mt-1">Bloquea o desbloquea slots específicos o días completos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona una fecha</label>
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-tiger-orange"
            />
            <Button onClick={() => handleDateSelect(selectedDate)} className="w-full mt-3 bg-tiger-green hover:bg-tiger-green/90">
              <Calendar size={16} className="mr-2" />
              Ver slots del día
            </Button>
          </div>

          <div>
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
                        <button onClick={() => unblockFullDay(block.date)} className="text-green-600 hover:text-green-800">
                          <Unlock size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

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
                        <button onClick={() => unblockSlot(slot.id)} className="text-green-600 hover:text-green-800">
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

      {/* ── Modal bloqueos ── */}
      {blockModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-tiger-green">Slots del día {selectedDate}</h3>
                <button onClick={() => setBlockModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                <span className="font-medium">Acción rápida:</span>
                {isDayFullyBlocked(selectedDate) ? (
                  <Button onClick={() => unblockFullDay(selectedDate)} className="bg-green-600 hover:bg-green-700 text-white">
                    <Unlock size={16} className="mr-2" />Desbloquear día completo
                  </Button>
                ) : (
                  <Button onClick={() => blockFullDay(selectedDate)} className="bg-red-600 hover:bg-red-700 text-white">
                    <Lock size={16} className="mr-2" />Bloquear día completo
                  </Button>
                )}
              </div>

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
                          <span className="font-medium">{slot.start_time?.slice(0,5)} - {slot.end_time?.slice(0,5)}</span>
                          <span className={`ml-3 text-xs px-2 py-1 rounded ${isBlockedByReservation ? 'bg-purple-100 text-purple-800' : isBlockedByAdmin ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {isBlockedByReservation ? 'Reservado' : isBlockedByAdmin ? 'Bloqueado' : 'Activo'}
                          </span>
                        </div>
                        <div>
                          {slot.status === 'blocked' && !isBlockedByReservation ? (
                            <button onClick={() => unblockSlot(slot.id)} className="text-green-600 hover:text-green-800"><Unlock size={18} /></button>
                          ) : !isBlockedByReservation && (
                            <button onClick={() => blockSlot(slot.id)} className="text-red-600 hover:text-red-800"><Lock size={18} /></button>
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
            Slots Reserva Libre
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Activa o desactiva la reserva libre  en slots específicos.
            Un slot de reserva libre permite que varios grupos se apunten hasta completar el aforo.
          </p>
          
          {/* Mostrar planes disponibles por duración */}
          {availableSharedPlans.length > 0 ? (
            <div className="mt-2 space-y-1">
              {availableSharedPlans.map(plan => (
                <div key={plan.id} className={`inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full mr-2 mb-2 ${plan.duration_minutes === settings.slot_duration ? 'bg-green-100 border border-green-300 text-green-700' : 'bg-gray-100 border border-gray-300 text-gray-600'}`}>
                  <Users size={12} />
                  {plan.duration_minutes} min: <strong>{plan.name}</strong> — €{plan.price}/persona
                  {plan.duration_minutes === settings.slot_duration && (
                    <span className="ml-1 text-green-600">✓ Activo</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-1 rounded-full">
              <AlertCircle size={12} />
              No hay planes de reserva libre configurados. Crea planes con active=false y duration_minutes=30,60,90
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona una fecha</label>
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
              onClick={async () => { await loadSharedSlotsForDate(sharedDate); setSharedModalOpen(true); }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={availableSharedPlans.length === 0}
            >
              <Users size={16} className="mr-2" />
              Ver slots del día
            </Button>
          </div>
        </div>

        {sharedMessage && (
          <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${sharedMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
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
                <h3 className="text-xl font-bold text-tiger-green">Slots del {sharedDate}</h3>
                <button onClick={() => setSharedModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>

              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <p className="font-medium text-blue-800 mb-2">Planes de reserva libre disponibles:</p>
                <div className="space-y-1">
                  {availableSharedPlans.map(plan => (
                    <div key={plan.id} className="text-xs text-blue-700">
                      • {plan.duration_minutes} minutos: <strong>{plan.name}</strong> (€{plan.price}/persona)
                    </div>
                  ))}
                </div>
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
                    const slotDuration = getSlotDuration(slot.start_time, slot.end_time);
                    const planForThisSlot = availableSharedPlans.find(p => p.duration_minutes === slotDuration);
                    
                    return (
                      <div key={slot.id} className={`flex justify-between items-center p-3 border rounded-lg ${isShared ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{slot.start_time?.slice(0,5)} - {slot.end_time?.slice(0,5)}</span>
                          <span className="text-xs text-gray-500">({slotDuration} min)</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${isShared ? 'bg-blue-100 text-blue-700' : isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {isShared ? '🤝 Reserva Libre' : isBlocked ? '🔒 Bloqueado' : '✅ Normal'}
                          </span>
                          <span className="text-xs text-gray-400">Aforo: {slot.max_capacity}</span>
                        </div>

                        {!isBlocked && (
                          isShared ? (
                            <button onClick={() => removeSharedPlan(slot.id)} className="text-sm text-gray-600 hover:text-red-600 border border-gray-300 hover:border-red-300 px-3 py-1 rounded-lg transition">
                              Quitar reserva libre
                            </button>
                          ) : (
                            <button 
                              onClick={() => assignSharedPlan(slot.id, slotDuration)} 
                              className={`text-sm px-3 py-1 rounded-lg transition ${planForThisSlot ? 'text-blue-600 hover:text-blue-800 border border-blue-300 hover:border-blue-500' : 'text-gray-400 border border-gray-200 cursor-not-allowed'}`}
                              disabled={!planForThisSlot}
                              title={!planForThisSlot ? `No hay plan de reserva libre para duración de ${slotDuration} minutos` : ''}
                            >
                              Activar reserva libre {planForThisSlot && `(${planForThisSlot.duration_minutes}min)`}
                            </button>
                          )
                        )}
                        {isBlocked && <span className="text-xs text-gray-400 italic">No disponible</span>}
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
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${generateMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
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