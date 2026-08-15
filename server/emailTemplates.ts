// ============================================================================
// FRAYZEN SHOP - PERSONNALISATION DES MODÈLES D'EMAILS (SUPABASE & SYSTEM)
// ============================================================================

export interface EmailCustomizationOptions {
  storeName?: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  whatsapp1?: string;
  whatsapp2?: string;
  headerBadge?: string;
  customNote?: string;
}

export function generateResetPasswordEmailHtml(options: EmailCustomizationOptions = {}): string {
  const {
    storeName = '⚡ FRAYZEN SHOP',
    tagline = 'Recharge Diamants & Cartes Cadeaux Haïti',
    primaryColor = '#1E90FF',
    secondaryColor = '#0052CC',
    whatsapp1 = '+509 4712 4969',
    whatsapp2 = '+509 3788 2211',
    headerBadge = '🔒 SÉCURITÉ DU COMPTE',
    customNote = 'FRAYZEN SHOP pap janm mande w modpas ou ni kòd sekrè w sou WhatsApp.'
  } = options;

  const cleanPhone1 = whatsapp1.replace(/[^0-9]/g, '');
  const cleanPhone2 = whatsapp2.replace(/[^0-9]/g, '');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation de mot de passe - ${storeName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #070B14;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #E2E8F0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #070B14;
      padding: 35px 12px;
      box-sizing: border-box;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: linear-gradient(180deg, #10172A 0%, #0B0F1D 100%);
      border: 1px solid #1E293B;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .header {
      background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
      padding: 32px 24px;
      text-align: center;
      position: relative;
    }
    .brand-title {
      color: #FFFFFF;
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 2px;
      margin: 0;
      text-transform: uppercase;
      text-shadow: 0 4px 12px rgba(0,0,0,0.35);
    }
    .brand-subtitle {
      color: #E0F2FE;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 1px;
      margin: 6px 0 0 0;
      text-transform: uppercase;
      opacity: 0.95;
    }
    .content {
      padding: 36px 28px;
    }
    .badge {
      display: inline-block;
      background-color: rgba(30, 144, 255, 0.12);
      border: 1px solid ${primaryColor};
      color: #38BDF8;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      padding: 6px 16px;
      border-radius: 50px;
      margin-bottom: 22px;
    }
    .greeting {
      font-size: 22px;
      font-weight: 800;
      color: #FFFFFF;
      margin: 0 0 16px 0;
      letter-spacing: -0.5px;
    }
    .paragraph {
      font-size: 15px;
      line-height: 1.65;
      color: #94A3B8;
      margin: 0 0 18px 0;
    }
    .highlight-box {
      background: linear-gradient(135deg, rgba(30, 144, 255, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%);
      border: 1px solid rgba(30, 144, 255, 0.25);
      border-radius: 16px;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0;
    }
    .btn-primary {
      display: inline-block;
      background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
      color: #FFFFFF !important;
      text-decoration: none;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.5px;
      padding: 16px 36px;
      border-radius: 14px;
      box-shadow: 0 10px 30px rgba(30, 144, 255, 0.45);
    }
    .token-box {
      background-color: #070B16;
      border: 1px dashed #334155;
      border-radius: 14px;
      padding: 16px 20px;
      text-align: center;
      margin: 24px 0;
    }
    .token-label {
      font-size: 12px;
      color: #64748B;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .token-code {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 8px;
      color: #38BDF8;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .security-notice {
      background-color: rgba(245, 158, 11, 0.08);
      border-left: 4px solid #F59E0B;
      padding: 14px 18px;
      border-radius: 0 12px 12px 0;
      margin: 24px 0 12px 0;
    }
    .security-text {
      font-size: 12px;
      color: #FCD34D;
      margin: 0;
      line-height: 1.55;
    }
    .divider {
      border-top: 1px solid #1E293B;
      margin: 28px 0 20px 0;
    }
    .whatsapp-btn {
      display: inline-block;
      background-color: #059669;
      color: #FFFFFF !important;
      text-decoration: none;
      font-size: 12px;
      font-weight: 700;
      padding: 8px 18px;
      border-radius: 10px;
      margin: 5px 4px;
    }
    .footer {
      text-align: center;
      padding: 0 24px 28px 24px;
    }
    .footer-text {
      font-size: 12px;
      color: #64748B;
      line-height: 1.6;
      margin: 4px 0;
    }
    .footer-highlight {
      color: #94A3B8;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- HEADER -->
      <div class="header">
        <div class="brand-title">${storeName}</div>
        <div class="brand-subtitle">${tagline}</div>
      </div>

      <!-- BODY CONTENT -->
      <div class="content">
        <div style="text-align: center;">
          <span class="badge">${headerBadge}</span>
        </div>

        <h1 class="greeting">Bonjour / Bonswa Chè Kliyan,</h1>
        
        <p class="paragraph">
          Nou resevwa yon demann pou réinitialiser mot de passe kont <strong>${storeName}</strong> ou a ki asosye ak adrès email :
        </p>

        <div class="highlight-box">
          <div style="font-size: 11px; color: #64748B; text-transform: uppercase; font-weight: 700;">Kont Kliyan :</div>
          <div style="font-size: 15px; color: #38BDF8; font-weight: 800; margin-top: 2px;">{{ .Email }}</div>
        </div>

        <p class="paragraph">
          Klike sou bouton anba a pou w ka chwazi yon nouvo mot de passe an tout sekirite sou sit ofisyèl la :
        </p>

        <!-- ACTION BUTTON -->
        <div class="btn-container">
          <a href="{{ .ConfirmationURL }}" target="_blank" class="btn-primary">
            🔑 Réinitialiser mon mot de passe
          </a>
        </div>

        <!-- CODE TOKEN -->
        <div class="token-box">
          <div class="token-label">Kòd Sekirite Tanporè (Token) :</div>
          <div class="token-code">{{ .Token }}</div>
        </div>

        <!-- SECURITY ADVICE -->
        <div class="security-notice">
          <p class="security-text">
            ⚠️ <strong>Konsèy Sekirite :</strong> ${customNote} Si se pa ou menm ki fè demann sa a, pa gen okenn pwoblèm, ou mèt inyore email sa a, kont ou ap rete an sekirite.
          </p>
        </div>

        <div class="divider"></div>

        <div style="text-align: center; margin: 16px 0;">
          <div style="font-size: 11px; color: #64748B; font-weight: 700; margin-bottom: 6px;">BEZWEN YON ÈD RAPID SOU WHATSAPP ?</div>
          <a href="https://wa.me/${cleanPhone1}?text=Bonjou%20Frayzen%20Shop,%20mwen%20bezwen%20ed%20ak%20mot%20de%20passe%20mwen." target="_blank" class="whatsapp-btn">
            💬 WhatsApp 1: ${whatsapp1}
          </a>
          <a href="https://wa.me/${cleanPhone2}?text=Bonjou%20Frayzen%20Shop,%20mwen%20bezwen%20ed%20ak%20mot%20de%20passe%20mwen." target="_blank" class="whatsapp-btn">
            💬 WhatsApp 2: ${whatsapp2}
          </a>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <p class="footer-text footer-highlight">
          ${storeName} &bull; Sèvis Livrezon Kòd PIN & Rechargement Otomatik
        </p>
        <p class="footer-text">
          Natcash &bull; MonCash &bull; Free Fire &bull; PUBG &bull; Roblox &bull; Kat Kado
        </p>
        <p class="footer-text" style="font-size: 11px; margin-top: 8px; color: #475569;">
          &copy; ${new Date().getFullYear()} ${storeName}. Tout dwa rezève.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function generateConfirmSignupEmailHtml(options: EmailCustomizationOptions = {}): string {
  const {
    storeName = '⚡ FRAYZEN SHOP',
    tagline = 'Byenvini sou Premye Platfòm Rechaj Ayiti',
    primaryColor = '#1E90FF',
    secondaryColor = '#0052CC',
    whatsapp1 = '+509 4712 4969',
    whatsapp2 = '+509 3788 2211',
    headerBadge = '✅ KONFIMASYON KONT',
    customNote = 'Aktive kont ou pou w kòmanse rechaje epi resevwa kòd PIN otomatikman.'
  } = options;

  const cleanPhone1 = whatsapp1.replace(/[^0-9]/g, '');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmez votre compte - ${storeName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #070B14;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #E2E8F0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #070B14;
      padding: 35px 12px;
      box-sizing: border-box;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: linear-gradient(180deg, #10172A 0%, #0B0F1D 100%);
      border: 1px solid #1E293B;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .header {
      background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .brand-title {
      color: #FFFFFF;
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 2px;
      margin: 0;
      text-transform: uppercase;
    }
    .brand-subtitle {
      color: #E0F2FE;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 1px;
      margin: 6px 0 0 0;
      text-transform: uppercase;
    }
    .content {
      padding: 36px 28px;
    }
    .badge {
      display: inline-block;
      background-color: rgba(16, 185, 129, 0.15);
      border: 1px solid #10B981;
      color: #34D399;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      padding: 6px 16px;
      border-radius: 50px;
      margin-bottom: 22px;
    }
    .greeting {
      font-size: 22px;
      font-weight: 800;
      color: #FFFFFF;
      margin: 0 0 16px 0;
    }
    .paragraph {
      font-size: 15px;
      line-height: 1.65;
      color: #94A3B8;
      margin: 0 0 18px 0;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0;
    }
    .btn-primary {
      display: inline-block;
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: #FFFFFF !important;
      text-decoration: none;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.5px;
      padding: 16px 36px;
      border-radius: 14px;
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
    }
    .token-box {
      background-color: #070B16;
      border: 1px dashed #334155;
      border-radius: 14px;
      padding: 16px 20px;
      text-align: center;
      margin: 24px 0;
    }
    .token-code {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 8px;
      color: #34D399;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .footer {
      text-align: center;
      padding: 0 24px 28px 24px;
      border-top: 1px solid #1E293B;
    }
    .footer-text {
      font-size: 12px;
      color: #64748B;
      line-height: 1.6;
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="brand-title">${storeName}</div>
        <div class="brand-subtitle">${tagline}</div>
      </div>
      <div class="content">
        <div style="text-align: center;">
          <span class="badge">${headerBadge}</span>
        </div>
        <h1 class="greeting">Byenvini sou ${storeName} !</h1>
        <p class="paragraph">
          Mèsi paske w kreye yon kont sou platfòm nou an (<strong>{{ .Email }}</strong>). ${customNote}
        </p>
        <div class="btn-container">
          <a href="{{ .ConfirmationURL }}" target="_blank" class="btn-primary">
            🚀 Konfime Email Mwen
          </a>
        </div>
        <div class="token-box">
          <div style="font-size: 12px; color: #64748B; text-transform: uppercase; font-weight: 700; margin-bottom: 6px;">Kòd Konfimasyon (Token) :</div>
          <div class="token-code">{{ .Token }}</div>
        </div>
      </div>
      <div class="footer">
        <p class="footer-text">
          ${storeName} &bull; WhatsApp Sipò : ${whatsapp1}
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export const SUPABASE_RESET_PASSWORD_TEMPLATE_HTML = generateResetPasswordEmailHtml();
export const SUPABASE_CONFIRM_SIGNUP_TEMPLATE_HTML = generateConfirmSignupEmailHtml();

export function renderEmailPreview(type: 'reset' | 'confirm', customEmail?: string, options?: EmailCustomizationOptions): string {
  const email = customEmail || 'emmanuelselicour.2002@gmail.com';
  const confirmationUrl = '#';
  const token = '748921';

  let html = type === 'reset' 
    ? generateResetPasswordEmailHtml(options) 
    : generateConfirmSignupEmailHtml(options);

  return html
    .replace(/\{\{\s*\.Email\s*\}\}/g, email)
    .replace(/\{\{\s*\.ConfirmationURL\s*\}\}/g, confirmationUrl)
    .replace(/\{\{\s*\.Token\s*\}\}/g, token);
}
