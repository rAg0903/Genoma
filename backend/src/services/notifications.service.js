/**
 * Servico de Notificacoes (e-mail / SMS).
 *
 * Reativa o subsistema de notificacoes do CRM, agora orientado a eventos.
 * Os transportes sao pluggaveis:
 *   - E-mail: usa nodemailer se SMTP_HOST estiver configurado e o pacote
 *     estiver instalado; caso contrario, regista a notificacao no log
 *     (modo de contingencia, equivalente ao envio manual).
 *   - SMS: usa um webhook/HTTP se SMS_WEBHOOK_URL estiver configurado;
 *     caso contrario, regista no log.
 */
const { bus, EVENTS } = require('../events');

let mailerPromise = null;

const getMailer = async () => {
  if (!process.env.SMTP_HOST) return null;
  if (mailerPromise) return mailerPromise;
  mailerPromise = (async () => {
    try {
      // require lazy para nao quebrar quando nodemailer nao esta instalado.
      const nodemailer = require('nodemailer');
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
    } catch (error) {
      console.warn('[notifications] nodemailer indisponivel, a usar modo log:', error.message);
      return null;
    }
  })();
  return mailerPromise;
};

const sendEmail = async ({ to, subject, body }) => {
  if (!to) return { skipped: true, reason: 'sem destinatario' };
  const mailer = await getMailer();
  if (!mailer) {
    console.log(`[notifications:email][LOG] Para: ${to} | Assunto: ${subject}\n${body}`);
    return { sent: false, transport: 'log' };
  }
  await mailer.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@genoma.local',
    to,
    subject,
    text: body,
  });
  return { sent: true, transport: 'smtp' };
};

const sendSms = async ({ to, body }) => {
  if (!to) return { skipped: true, reason: 'sem destinatario' };
  const webhook = process.env.SMS_WEBHOOK_URL;
  if (!webhook) {
    console.log(`[notifications:sms][LOG] Para: ${to}\n${body}`);
    return { sent: false, transport: 'log' };
  }
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message: body }),
    });
    return { sent: true, transport: 'webhook' };
  } catch (error) {
    console.error('[notifications:sms] falha no envio:', error.message);
    return { sent: false, transport: 'webhook', error: error.message };
  }
};

/**
 * Regista os listeners de eventos -> notificacoes. Deve ser chamado uma vez no
 * arranque da aplicacao.
 */
const registerListeners = () => {
  bus.on(EVENTS.AGENDAMENTO_CRIADO, async (payload) => {
    // Notifica o posto de colheita (equivalente ao e-mail automatico antigo).
    await sendEmail({
      to: payload.posto_email || process.env.NOTIFY_POSTOS_EMAIL,
      subject: 'Nova colheita agendada',
      body: `Foi agendada uma colheita (${payload.numero_processo || payload.processo_id}) `
        + `para ${payload.data_prevista || ''} no posto ${payload.posto_nome || ''}. `
        + `Kit reservado: ${payload.kit_codigo || 'n/d'}.`,
    });
  });

  bus.on(EVENTS.COLHEITA_REGISTADA, async (payload) => {
    await sendSms({
      to: payload.contacto_logistica || process.env.NOTIFY_LOGISTICA_SMS,
      body: `Colheita realizada. Kit ${payload.kit_codigo || ''} pronto para expedicao ao laboratorio.`,
    });
  });

  bus.on(EVENTS.RELATORIO_ENVIADO, async (payload) => {
    const destinatarios = [];
    if (payload.destino === 'Medico' || payload.destino === 'Ambos') {
      destinatarios.push(payload.medico_email);
    }
    if (payload.destino === 'Utente' || payload.destino === 'Ambos') {
      destinatarios.push(payload.utente_email);
    }
    for (const to of destinatarios.filter(Boolean)) {
      await sendEmail({
        to,
        subject: `Relatorio Genoma - Processo ${payload.numero_processo || ''}`,
        body: 'O seu relatorio genetico esta disponivel. Aceda a plataforma Genoma para consultar.',
      });
    }
  });

  bus.on(EVENTS.STOCK_BAIXO, async (payload) => {
    await sendEmail({
      to: process.env.NOTIFY_STOCK_EMAIL,
      subject: 'Alerta de stock baixo de kits',
      body: `Stock baixo detetado: ${payload.descricao || ''} (disponiveis: ${payload.disponiveis}).`,
    });
  });
};

module.exports = { sendEmail, sendSms, registerListeners };
