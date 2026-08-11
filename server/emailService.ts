// Email service updated to use direct Supabase Auth (`supabase.auth.signUp()`)
// SMTP variables have been removed as requested.

export interface SendWelcomeEmailParams {
  userName: string;
  userEmail: string;
  userPhone: string;
}

export const generateWelcomeEmailHTML = ({ userName, userEmail, userPhone }: SendWelcomeEmailParams): string => {
  const dateFormatted = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const appUrl = process.env.APP_URL || 'https://frayzenshop.com';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur FRAYZEN SHOP</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .email-wrapper {
      width: 100%;
      background-color: #0b0f19;
      padding: 30px 10px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 30px rgba(0, 0, 0, 0.6);
    }
    .email-header {
      background: linear-gradient(135deg, #0b1329 0%, #1e3a8a 50%, #1e90ff 100%);
      padding: 36px 24px;
      text-align: center;
      border-bottom: 2px solid #3b82f6;
    }
    .email-header-title {
      margin: 0;
      font-size: 28px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: 1.5px;
    }
    .email-header-subtitle {
      margin: 8px 0 0 0;
      font-size: 13px;
      color: #93c5fd;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .email-body {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 14px;
    }
    .paragraph {
      font-size: 14px;
      line-height: 1.6;
      color: #cbd5e1;
      margin-bottom: 24px;
    }
    .info-card {
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 14px;
      padding: 22px;
      margin-bottom: 24px;
    }
    .info-card-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #60a5fa;
      font-weight: 800;
      margin-top: 0;
      margin-bottom: 16px;
      border-bottom: 1px solid #334155;
      padding-bottom: 8px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 13px;
    }
    .info-label {
      color: #94a3b8;
      font-weight: 600;
    }
    .info-value {
      color: #ffffff;
      font-weight: 700;
      text-align: right;
    }
    .status-badge {
      display: inline-block;
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid #10b981;
      color: #34d399;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 800;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <h1 class="email-header-title">FRAYZEN SHOP</h1>
        <p class="email-header-subtitle">Plateforme N°1 Recharge Diamants Free Fire en Haïti</p>
      </div>
      <div class="email-body">
        <div class="greeting">Bonjour ${userName},</div>
        <p class="paragraph">
          Félicitations et bienvenue sur <strong>FRAYZEN SHOP</strong> ! Votre compte a été créé avec succès via Supabase Auth.
        </p>
        <div class="info-card">
          <div class="info-card-title">Informations de votre profil client</div>
          <div class="info-row"><span class="info-label">Nom complet :</span><span class="info-value">${userName}</span></div>
          <div class="info-row"><span class="info-label">Adresse Email :</span><span class="info-value">${userEmail}</span></div>
          <div class="info-row"><span class="info-label">Numéro Téléphone :</span><span class="info-value">${userPhone}</span></div>
          <div class="info-row"><span class="info-label">Date de création :</span><span class="info-value">${dateFormatted}</span></div>
          <div class="info-row"><span class="info-label">Statut du compte :</span><span class="info-value"><span class="status-badge">ACTIF (SUPABASE AUTH)</span></span></div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};
