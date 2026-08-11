import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURATION SUPABASE (ENV & CODE FALLBACK)
// Si vous supprimez/recréez votre projet sur Vercel et ne voulez pas retaper les
// variables dans le Dashboard Vercel, vous pouvez directement coller votre URL et
// votre Clé Supabase ci-dessous. Le code utilisera process.env si présent,
// sinon il utilisera ces clés par défaut.
// ============================================================================
export const CONFIG_SUPABASE = {
  // Supabase URL with fallback
  url: process.env.SUPABASE_URL || 'https://dvmncltvtbavumltjgdx.supabase.co',
  // Supabase Key with fallback
  key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2bW5jbHR2dGJhdnVtbHRqZ2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzOTkxNTcsImV4cCI6MjEwMTk3NTE1N30.JoRTi5mKWXawqVAqnQrcjDis_Cu838sp1GGytL3ruuY'
};

const supabaseUrl = CONFIG_SUPABASE.url.trim();
const supabaseKey = CONFIG_SUPABASE.key.trim();

export const isSupabaseServerConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('VOTRE_PROJET')
);

export const supabaseServer = isSupabaseServerConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Supabase Auth Direct Sign Up
export const signUpWithSupabaseAuth = async (email: string, name: string, phone: string, password?: string) => {
  if (!supabaseServer) {
    console.log('[Supabase Auth] Supabase URL / API key not configured yet.');
    return { success: false, message: 'Supabase URL/Key non configuré.' };
  }

  try {
    const userPassword = password || `Frayzen_${Math.random().toString(36).slice(-8)}!`;
    const { data, error } = await supabaseServer.auth.signUp({
      email,
      password: userPassword,
      options: {
        data: {
          full_name: name,
          phone: phone,
          shop: 'FRAYZEN SHOP'
        }
      }
    });

    if (error) {
      console.error('[Supabase Auth Error]', error.message);
      return { success: false, error: error.message };
    }

    console.log('[Supabase Auth Success] Confirmation email triggered for:', email);
    return { success: true, user: data.user, session: data.session };
  } catch (err: any) {
    console.error('[Supabase Auth Exception]', err);
    return { success: false, error: err?.message || 'Erreur Supabase Auth' };
  }
};

// Sync functions to Supabase database tables if configured
export const syncUserToSupabase = async (user: any) => {
  if (!supabaseServer) return;
  try {
    await supabaseServer.from('users').upsert({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      created_at: user.createdAt,
      is_email_verified: user.isEmailVerified,
      wallet_balance_htg: user.walletBalanceHTG,
      is_admin: user.isAdmin
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('Erreur sync utilisateur vers Supabase:', err);
  }
};

export const syncDepositToSupabase = async (deposit: any) => {
  if (!supabaseServer) return;
  try {
    await supabaseServer.from('wallet_deposits').upsert({
      id: deposit.id,
      user_id: deposit.userId,
      user_email: deposit.userEmail,
      user_name: deposit.userName,
      user_phone: deposit.userPhone,
      transaction_id_14: deposit.transactionId14,
      amount_htg: deposit.amountHTG,
      payment_method: deposit.paymentMethod || 'natcash',
      status: deposit.status,
      created_at: deposit.createdAt,
      admin_note: deposit.adminNote || null
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('Erreur sync dépôt vers Supabase:', err);
  }
};

export const syncOrderToSupabase = async (order: any) => {
  if (!supabaseServer) return;
  try {
    await supabaseServer.from('orders').upsert({
      id: order.id,
      user_id: order.userId,
      user_email: order.userEmail,
      user_name: order.userName,
      product_id: order.productId,
      product_name: order.productName,
      price_htg: order.priceHTG,
      game_player_id: order.gamePlayerId,
      payment_method: order.paymentMethod,
      pin_code_delivered: order.pinCodeDelivered || null,
      status: order.status,
      created_at: order.createdAt
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('Erreur sync commande vers Supabase:', err);
  }
};

export const syncTicketToSupabase = async (ticket: any) => {
  if (!supabaseServer) return;
  try {
    await supabaseServer.from('tickets').upsert({
      id: ticket.id,
      user_id: ticket.userId,
      user_name: ticket.userName,
      user_email: ticket.userEmail,
      user_phone: ticket.userPhone,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      created_at: ticket.createdAt
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('Erreur sync ticket vers Supabase:', err);
  }
};
