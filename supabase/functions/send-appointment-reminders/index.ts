import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Configuração: horas de antecedência para enviar lembrete
const REMINDER_HOURS_BEFORE = 3;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("🔔 Iniciando verificação de lembretes de agendamento...");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calcular janela de tempo: agendamentos entre agora + 3 horas e agora + 3.5 horas
    // Isso garante que enviamos apenas uma vez por hora
    const now = new Date();
    const reminderStart = new Date(now.getTime() + REMINDER_HOURS_BEFORE * 60 * 60 * 1000);
    const reminderEnd = new Date(reminderStart.getTime() + 30 * 60 * 1000); // 30 min window

    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log(`📅 Buscando agendamentos para lembrete entre ${reminderStart.toISOString()} e ${reminderEnd.toISOString()}`);

    // Buscar agendamentos que precisam de lembrete
    const { data: agendamentos, error: agendamentosError } = await supabase
      .from('painel_agendamentos')
      .select(`
        id,
        data,
        hora,
        status,
        cliente:client_profiles!painel_agendamentos_cliente_id_fkey(id, nome, email, whatsapp),
        barbeiro:painel_barbeiros!painel_agendamentos_barbeiro_id_fkey(id, nome),
        servico:painel_servicos!painel_agendamentos_servico_id_fkey(id, nome, preco, duracao)
      `)
      .in('data', [today, tomorrow])
      .in('status', ['agendado', 'confirmado'])
      .is('lembrete_enviado', null); // Apenas agendamentos sem lembrete enviado

    if (agendamentosError) {
      console.error("❌ Erro ao buscar agendamentos:", agendamentosError);
      throw agendamentosError;
    }

    console.log(`📋 Encontrados ${agendamentos?.length || 0} agendamentos pendentes de lembrete`);

    let emailsSent = 0;
    let emailsFailed = 0;
    const results: any[] = [];

    for (const agendamento of agendamentos || []) {
      try {
        // Construir datetime do agendamento
        const appointmentDateTime = new Date(`${agendamento.data}T${agendamento.hora}`);
        
        // Verificar se está na janela de lembrete (3 horas antes)
        if (appointmentDateTime < reminderStart || appointmentDateTime > reminderEnd) {
          console.log(`⏭️ Agendamento ${agendamento.id} fora da janela de lembrete`);
          continue;
        }

        const cliente = agendamento.cliente;
        const barbeiro = agendamento.barbeiro;
        const servico = agendamento.servico;

        if (!cliente?.email) {
          console.log(`⚠️ Cliente sem e-mail para agendamento ${agendamento.id}`);
          continue;
        }

        // Formatar data para exibição
        const dataFormatada = new Date(agendamento.data).toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });

        const horaFormatada = agendamento.hora.substring(0, 5);
        const precoFormatado = servico?.preco?.toFixed(2).replace('.', ',') || '0,00';

        console.log(`📧 Enviando lembrete para ${cliente.email} - Agendamento ${agendamento.id}`);

        // URL da logo
        const logoUrl = 'https://barbeariacostaurbana.com.br/images/logo-barbearia-costa-urbana.png';

        // Enviar e-mail de lembrete
        const emailResponse = await resend.emails.send({
          from: "Barbearia Costa Urbana <noreply@barbeariacostaurbana.com.br>",
          to: [cliente.email],
          subject: `⏰ Lembrete: Seu horário é hoje às ${horaFormatada}! - Barbearia Costa Urbana`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
              <div style="text-align: center; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
                <img src="${logoUrl}" alt="Barbearia Costa Urbana" style="width: 100px; height: 100px; border-radius: 50%; margin-bottom: 15px; border: 3px solid #D4A574;" />
                <h1 style="margin: 0; font-size: 24px; color: #D4A574;">⏰ Lembrete de Agendamento</h1>
                <p style="margin: 8px 0 0; font-size: 14px; color: #ccc;">Barbearia Costa Urbana</p>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
                  Olá <strong style="color: #D4A574;">${cliente.nome}</strong>! 👋
                </p>
                
                <div style="background: linear-gradient(135deg, #fff3cd, #ffeaa7); border: 2px solid #D4A574; padding: 20px; border-radius: 12px; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0; color: #856404; font-size: 16px; font-weight: bold;">
                    🔔 Seu horário está chegando!
                  </p>
                  <p style="margin: 0; color: #333; font-size: 15px;">
                    Faltam aproximadamente <strong>${REMINDER_HOURS_BEFORE} horas</strong> para o seu atendimento.
                  </p>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #D4A574; margin: 20px 0;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 10px 0; color: #555; font-weight: bold; width: 40%;">📅 Data:</td>
                      <td style="padding: 10px 0; color: #333; font-size: 16px;">${dataFormatada}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #555; font-weight: bold;">🕒 Horário:</td>
                      <td style="padding: 10px 0; color: #D4A574; font-size: 20px; font-weight: bold;">${horaFormatada}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #555; font-weight: bold;">✂️ Serviço:</td>
                      <td style="padding: 10px 0; color: #333;">${servico?.nome || 'Não especificado'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #555; font-weight: bold;">👨‍💼 Profissional:</td>
                      <td style="padding: 10px 0; color: #333;">${barbeiro?.nome || 'Não especificado'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #555; font-weight: bold;">⏱️ Duração:</td>
                      <td style="padding: 10px 0; color: #333;">${servico?.duracao || 30} minutos</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #555; font-weight: bold;">💰 Valor:</td>
                      <td style="padding: 10px 0; color: #333; font-weight: bold;">R$ ${precoFormatado}</td>
                    </tr>
                  </table>
                </div>
                
                <div style="background: #e8f5e9; border: 1px solid #4caf50; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #2e7d32; font-weight: bold;">
                    ✅ <strong>Dica:</strong> Chegue com 10 minutos de antecedência para garantir um atendimento tranquilo!
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="color: #666; margin: 5px 0;">📍 Estamos te esperando!</p>
                  <p style="color: #D4A574; font-weight: bold; font-size: 16px; margin: 15px 0;">
                    Barbearia Costa Urbana ✂️
                  </p>
                  <p style="color: #999; font-size: 12px; font-style: italic;">
                    Este é um lembrete automático. Não responda a este e-mail.
                  </p>
                </div>
              </div>
            </div>
          `,
        });

        console.log(`✅ Lembrete enviado com sucesso para ${cliente.email}`);

        // Marcar agendamento como lembrete enviado
        await supabase
          .from('painel_agendamentos')
          .update({ lembrete_enviado: new Date().toISOString() })
          .eq('id', agendamento.id);

        emailsSent++;
        results.push({
          agendamentoId: agendamento.id,
          email: cliente.email,
          status: 'sent',
          emailId: emailResponse.id
        });

      } catch (emailError: any) {
        console.error(`❌ Erro ao enviar lembrete para agendamento ${agendamento.id}:`, emailError);
        emailsFailed++;
        results.push({
          agendamentoId: agendamento.id,
          status: 'failed',
          error: emailError.message
        });
      }
    }

    console.log(`📊 Resumo: ${emailsSent} enviados, ${emailsFailed} falhas`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processamento concluído`,
        summary: {
          totalProcessed: agendamentos?.length || 0,
          emailsSent,
          emailsFailed,
          reminderHoursBefore: REMINDER_HOURS_BEFORE
        },
        results
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("❌ Erro geral ao processar lembretes:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Erro ao processar lembretes", 
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
