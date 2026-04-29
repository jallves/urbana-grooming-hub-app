import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';

type UpdateRequest = {
  appointmentId?: string;
  serviceId?: string;
  barberId?: string;
  date?: string;
  time?: string;
  notes?: string | null;
};

const TZ = 'America/Sao_Paulo';
const EDIT_LEAD_TIME_MS = 60 * 60 * 1000;
const SLOT_STEP_MINUTES = 30;
const OPEN_MINUTES = 9 * 60;
const CLOSE_MINUTES = 20 * 60;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const isUuid = (value?: string) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const normalizeTime = (value?: string) => {
  if (!value) return '';
  const match = value.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
  if (!match) return '';
  return `${match[1]}:${match[2]}`;
};

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

const getSaoPauloNowAsComparableMs = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
};

const dateTimeAsComparableMs = (date: string, time: string) => {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return Date.UTC(year, month - 1, day, hour, minute || 0, 0);
};

const getExtraDuration = (extras: unknown) => {
  if (!Array.isArray(extras)) return 0;
  return extras.reduce((total, extra: any) => total + (Number(extra?.duracao) || 0), 0);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ success: false, error: 'Método não permitido' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace('Bearer ', '').trim();

    if (!jwt) {
      return json({ success: false, error: 'Sessão não encontrada. Faça login novamente.' }, 401);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(jwt);
    const user = userData?.user;

    if (userError || !user) {
      return json({ success: false, error: 'Sessão inválida. Faça login novamente.' }, 401);
    }

    const body = (await req.json()) as UpdateRequest;
    const appointmentId = body.appointmentId;
    const serviceId = body.serviceId;
    const barberId = body.barberId;
    const date = body.date;
    const time = normalizeTime(body.time);

    if (!isUuid(appointmentId) || !isUuid(serviceId) || !isUuid(barberId)) {
      return json({ success: false, error: 'Dados inválidos para atualizar o agendamento.' }, 400);
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !time) {
      return json({ success: false, error: 'Data ou horário inválido.' }, 400);
    }

    const slotStart = toMinutes(time);
    if (slotStart % SLOT_STEP_MINUTES !== 0) {
      return json({ success: false, error: 'Escolha um horário em intervalos de 30 minutos.' }, 400);
    }

    const { data: client, error: clientError } = await supabaseAdmin
      .from('painel_clientes')
      .select('id, nome, user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (clientError || !client) {
      return json({ success: false, error: 'Perfil de cliente não encontrado para esta conta.' }, 403);
    }

    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from('painel_agendamentos')
      .select('id, cliente_id, data, hora, status, servico_id, barbeiro_id, notas')
      .eq('id', appointmentId)
      .maybeSingle();

    if (appointmentError || !appointment) {
      return json({ success: false, error: 'Agendamento não encontrado.' }, 404);
    }

    if (appointment.cliente_id !== client.id) {
      return json({ success: false, error: 'Você só pode alterar seus próprios agendamentos.' }, 403);
    }

    if (!['agendado', 'confirmado'].includes(String(appointment.status))) {
      return json({ success: false, error: 'Somente agendamentos agendados ou confirmados podem ser alterados.' }, 400);
    }

    const originalTime = normalizeTime(appointment.hora);
    const originalAppointmentMs = dateTimeAsComparableMs(appointment.data, originalTime);
    if (originalAppointmentMs - getSaoPauloNowAsComparableMs() < EDIT_LEAD_TIME_MS) {
      return json({ success: false, error: 'Alterações são permitidas até 1 hora antes do horário marcado.' }, 400);
    }

    const newAppointmentMs = dateTimeAsComparableMs(date, time);
    if (newAppointmentMs - getSaoPauloNowAsComparableMs() < EDIT_LEAD_TIME_MS) {
      return json({ success: false, error: 'Escolha um horário com pelo menos 1 hora de antecedência.' }, 400);
    }

    const { data: service, error: serviceError } = await supabaseAdmin
      .from('painel_servicos')
      .select('id, nome, preco, duracao, ativo, is_active')
      .eq('id', serviceId)
      .maybeSingle();

    if (serviceError || !service || service.ativo === false || service.is_active === false) {
      return json({ success: false, error: 'Serviço indisponível.' }, 400);
    }

    const duration = Number(service.duracao) || 30;
    const slotEnd = slotStart + duration;
    if (slotStart < OPEN_MINUTES || slotEnd > CLOSE_MINUTES) {
      return json({ success: false, error: 'Horário fora do expediente disponível para clientes.' }, 400);
    }

    const { data: barber, error: barberError } = await supabaseAdmin
      .from('painel_barbeiros')
      .select('id, nome, staff_id, ativo, is_active')
      .eq('id', barberId)
      .maybeSingle();

    if (barberError || !barber || barber.ativo === false || barber.is_active === false) {
      return json({ success: false, error: 'Barbeiro indisponível.' }, 400);
    }

    const { data: serviceStaffRows, error: serviceStaffError } = await supabaseAdmin
      .from('service_staff')
      .select('staff_id')
      .eq('service_id', serviceId);

    if (serviceStaffError) {
      return json({ success: false, error: 'Erro ao validar barbeiro para o serviço.' }, 500);
    }

    if (serviceStaffRows?.length && !serviceStaffRows.some((row) => row.staff_id === barberId)) {
      return json({ success: false, error: 'Este barbeiro não atende o serviço selecionado.' }, 400);
    }

    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from('painel_agendamentos')
      .select('id, hora, servicos_extras, painel_servicos(duracao)')
      .eq('barbeiro_id', barberId)
      .eq('data', date)
      .neq('status', 'cancelado');

    if (appointmentsError) {
      return json({ success: false, error: 'Erro ao validar horários existentes.' }, 500);
    }

    for (const existing of appointments || []) {
      const existingStart = toMinutes(normalizeTime(existing.hora));
      const serviceInfo = Array.isArray(existing.painel_servicos)
        ? existing.painel_servicos[0]
        : existing.painel_servicos;
      const existingDuration = Number(serviceInfo?.duracao) || 30;
      const existingEnd = existingStart + existingDuration + getExtraDuration(existing.servicos_extras);
      if (slotStart < existingEnd && slotEnd > existingStart) {
        return json({ success: false, error: `Horário ${time} já está ocupado para este barbeiro.` }, 409);
      }
    }

    const idsForAvailability = [barberId, barber.staff_id].filter(Boolean);
    const { data: blocks, error: blocksError } = await supabaseAdmin
      .from('barber_availability')
      .select('start_time, end_time, is_available')
      .in('barber_id', idsForAvailability)
      .eq('date', date)
      .eq('is_available', false);

    if (blocksError) {
      return json({ success: false, error: 'Erro ao validar bloqueios do barbeiro.' }, 500);
    }

    for (const block of blocks || []) {
      const blockStart = toMinutes(normalizeTime(block.start_time));
      const blockEnd = toMinutes(normalizeTime(block.end_time));
      if (slotStart < blockEnd && slotEnd > blockStart) {
        return json({ success: false, error: 'Este horário está bloqueado para o barbeiro selecionado.' }, 409);
      }
    }

    const updatePayload: Record<string, unknown> = {
      servico_id: serviceId,
      barbeiro_id: barberId,
      data: date,
      hora: time,
      updated_at: new Date().toISOString(),
    };

    if (Object.prototype.hasOwnProperty.call(body, 'notes')) {
      updatePayload.notas = typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : null;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('painel_agendamentos')
      .update(updatePayload)
      .eq('id', appointmentId)
      .eq('cliente_id', client.id)
      .select('id, data, hora, status, servico_id, barbeiro_id, notas')
      .maybeSingle();

    if (updateError || !updated) {
      console.error('[client-update-appointment] update failed:', updateError);
      return json({ success: false, error: 'Não foi possível gravar a alteração no banco.' }, 500);
    }

    return json({
      success: true,
      appointment: updated,
      message: `Agendamento atualizado para ${date.split('-').reverse().join('/')} às ${time}.`,
    });
  } catch (error) {
    console.error('[client-update-appointment] unexpected error:', error);
    return json({ success: false, error: 'Erro inesperado ao atualizar o agendamento.' }, 500);
  }
});
