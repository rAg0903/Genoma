/**
 * Servico de Notificacoes (e-mail / SMS).
 *
 * Transportes plugaveis:
 *   - E-mail: nodemailer (SMTP) se SMTP_HOST estiver configurado; caso contrario
 *     regista no log (modo de contingencia).
 *   - SMS: webhook HTTP se SMS_WEBHOOK_URL estiver configurado.
 */
const { bus, EVENTS } = require('../events');

// ─── Mailer ───────────────────────────────────────────────────────────────────

let mailerPromise = null;

const getMailer = async () => {
  if (!process.env.SMTP_HOST) return null;
  if (mailerPromise) return mailerPromise;
  mailerPromise = (async () => {
    try {
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

// ─── Templates HTML ───────────────────────────────────────────────────────────

const logoUrl = process.env.APP_URL
  ? `${process.env.APP_URL}/genoma-logo.png`
  : 'https://via.placeholder.com/120x40?text=GENOMA';

const htmlWrapper = (title, body) => `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body{margin:0;padding:0;background:#f8fafc;font-family:Inter,Helvetica,Arial,sans-serif;color:#1e293b}
  .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0}
  .header{background:#0f766e;padding:24px 32px;display:flex;align-items:center;gap:12px}
  .header-title{color:#fff;font-size:18px;font-weight:700;margin:0}
  .body{padding:32px}
  h2{margin:0 0 16px;font-size:16px;font-weight:600;color:#0f766e}
  p{margin:0 0 12px;font-size:14px;line-height:1.6;color:#475569}
  .highlight{background:#f0fdfa;border-left:4px solid #0d9488;padding:12px 16px;border-radius:4px;margin:16px 0}
  .highlight p{margin:0;font-weight:600;color:#0f766e}
  .btn{display:inline-block;margin-top:20px;padding:12px 24px;background:#0d9488;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600}
  .footer{padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;text-align:center}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <span class="header-title">🧬 Genoma — Sistema de Laboratório Genómico</span>
  </div>
  <div class="body">
    <h2>${title}</h2>
    ${body}
  </div>
  <div class="footer">
    Esta mensagem foi gerada automaticamente. Por favor nao responda a este e-mail.<br/>
    Genoma Laboratório | ${new Date().getFullYear()}
  </div>
</div>
</body>
</html>`;

const templates = {
  agendamentoCriado: (p) => htmlWrapper(
    'Nova colheita agendada',
    `<p>Foi agendada uma colheita no sistema Genoma.</p>
     <div class="highlight">
       <p>Processo: ${p.numero_processo || p.processo_id || '—'}</p>
       <p>Data prevista: ${p.data_prevista || '—'}</p>
       <p>Posto: ${p.posto_nome || '—'}</p>
       <p>Kit reservado: ${p.kit_codigo || '—'}</p>
     </div>
     <p>Aceda ao portal para gerir este agendamento.</p>`,
  ),

  resultadoDisponivel: (p) => htmlWrapper(
    'Resultado genético disponível',
    `<p>O resultado genético do processo <strong>${p.numero_processo || p.processo_id || '—'}</strong> está disponível para validação.</p>
     <div class="highlight">
       <p>Paciente: ${p.paciente_nome || '—'}</p>
       <p>Teste: ${p.teste_nome || '—'}</p>
     </div>
     <p>Aceda ao portal para consultar e validar o resultado.</p>`,
  ),

  relatorioEnviado: (p) => htmlWrapper(
    `Relatório Genoma — Processo ${p.numero_processo || ''}`,
    `<p>O relatório genético do processo <strong>${p.numero_processo || p.processo_id || '—'}</strong> foi gerado e está disponível.</p>
     <div class="highlight">
       <p>Paciente: ${p.paciente_nome || '—'}</p>
     </div>
     <p>Aceda à plataforma Genoma para consultar o relatório completo.</p>`,
  ),

  faturaEmitida: (p) => htmlWrapper(
    'Fatura emitida',
    `<p>Foi emitida uma fatura para o processo <strong>${p.numero_processo || p.processo_id || '—'}</strong>.</p>
     <div class="highlight">
       <p>Valor: ${p.valor != null ? `€ ${Number(p.valor).toFixed(2)}` : '—'}</p>
       <p>Data de emissao: ${p.data_emissao || new Date().toLocaleDateString('pt-PT')}</p>
     </div>
     <p>Aceda ao portal para consultar e liquidar a fatura.</p>`,
  ),

  stockBaixo: (p) => htmlWrapper(
    'Alerta de stock baixo de kits',
    `<div class="highlight">
       <p>${p.descricao || 'Stock de kits'}: ${p.disponiveis} disponivel(eis)</p>
     </div>
     <p>O nivel de kits esta abaixo do minimo recomendado. Considere efectuar uma requisicao de reposicao.</p>`,
  ),
};

// ─── Envio ────────────────────────────────────────────────────────────────────

const sendEmail = async ({ to, subject, html, text }) => {
  if (!to) return { skipped: true, reason: 'sem destinatario' };
  const mailer = await getMailer();
  if (!mailer) {
    console.log(`[notifications:email][LOG] Para: ${to} | Assunto: ${subject}\n${text || subject}`);
    return { sent: false, transport: 'log' };
  }
  await mailer.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@genoma.local',
    to,
    subject,
    html,
    text: text || subject,
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

// ─── Listeners ────────────────────────────────────────────────────────────────

const registerListeners = () => {
  // Agendamento criado → notifica posto
  bus.on(EVENTS.AGENDAMENTO_CRIADO, async (payload) => {
    await sendEmail({
      to: payload.posto_email || process.env.NOTIFY_POSTOS_EMAIL,
      subject: `Nova colheita agendada — ${payload.data_prevista || ''} · ${payload.posto_nome || ''}`,
      html: templates.agendamentoCriado(payload),
      text: `Nova colheita agendada para ${payload.data_prevista || ''} no posto ${payload.posto_nome || ''}. Kit reservado: ${payload.kit_codigo || 'n/d'}.`,
    });
  });

  // Colheita registada → SMS para logística
  bus.on(EVENTS.COLHEITA_REGISTADA, async (payload) => {
    await sendSms({
      to: payload.contacto_logistica || process.env.NOTIFY_LOGISTICA_SMS,
      body: `Colheita realizada. Kit ${payload.kit_codigo || ''} pronto para expedicao ao laboratorio.`,
    });
  });

  // Resultado disponivel → e-mail para médico
  bus.on(EVENTS.RESULTADO_DISPONIVEL, async (payload) => {
    await sendEmail({
      to: payload.medico_email || process.env.NOTIFY_MEDICOS_EMAIL,
      subject: `Resultado disponivel — ${payload.paciente_nome || payload.numero_processo || ''}`,
      html: templates.resultadoDisponivel(payload),
      text: `O resultado genetico do processo ${payload.numero_processo || payload.processo_id || ''} esta disponivel para validacao.`,
    });
  });

  // Relatório enviado → e-mail para médico e/ou utente
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
        subject: `Relatorio Genoma — Processo ${payload.numero_processo || ''}`,
        html: templates.relatorioEnviado(payload),
        text: `O seu relatorio genetico (processo ${payload.numero_processo || ''}) esta disponivel na plataforma Genoma.`,
      });
    }
  });

  // Fatura emitida → e-mail para médico/empresa
  bus.on(EVENTS.FATURA_EMITIDA, async (payload) => {
    await sendEmail({
      to: payload.destinatario_email || process.env.NOTIFY_FATURACAO_EMAIL,
      subject: `Fatura emitida — Processo ${payload.numero_processo || ''}`,
      html: templates.faturaEmitida(payload),
      text: `Fatura emitida para o processo ${payload.numero_processo || ''} no valor de ${payload.valor != null ? `EUR ${Number(payload.valor).toFixed(2)}` : 'n/d'}.`,
    });
  });

  // Stock baixo → e-mail para stock manager
  bus.on(EVENTS.STOCK_BAIXO, async (payload) => {
    await sendEmail({
      to: process.env.NOTIFY_STOCK_EMAIL,
      subject: `Alerta: stock baixo de kits (${payload.disponiveis} disponiveis)`,
      html: templates.stockBaixo(payload),
      text: `Stock baixo detetado: ${payload.descricao || ''} (disponiveis: ${payload.disponiveis}).`,
    });
  });
};

module.exports = { sendEmail, sendSms, registerListeners };
