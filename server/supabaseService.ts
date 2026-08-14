import 'dotenv/config';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { Product, ProductCategory, NatcashConfig, WalletDeposit, DepositStatus, Order, ContactTicket, UserProfile, PinRecord } from '../src/types';
import { INITIAL_PRODUCTS, INITIAL_NATCASH_CONFIG } from '../src/data/initialData';

// ============================================================================
// CONFIGURATION SUPABASE (ENVIRONNEMENT VERCEL / NODE)
// ============================================================================
const supabaseUrl = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  ''
).trim();

const supabaseKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''
).trim();

if (!supabaseUrl || !supabaseKey) {
  console.error("Erreur: Les variables d'environnement Supabase sont introuvables.");
}

export const isSupabaseServerConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('VOTRE_PROJET')
);

export const supabaseServer = isSupabaseServerConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const supabaseAdmin = supabaseServer;

const handleSupabaseError = (action: string, err: any) => {
  const msg = err?.message || String(err || '');
  if (
    msg.includes('fetch failed') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('network') ||
    msg.includes('Failed to fetch') ||
    msg.includes('TypeError')
  ) {
    // Network unavailable / Supabase offline: silent fallback to local storage
    return;
  }
  console.warn(`[Supabase] ${action}:`, msg);
};

// ============================================================================
// FETCH HELPERS WITH DB QUERY & SAFE INITIAL FALLBACK
// ============================================================================

export const parsePinCodes = (rawPins: any): string[] => {
  if (!rawPins) return [];
  if (Array.isArray(rawPins)) {
    return rawPins.map(p => String(p).trim()).filter(Boolean);
  }
  if (typeof rawPins === 'string') {
    const trimmed = rawPins.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(p => String(p).trim()).filter(Boolean);
        }
      } catch { /* ignore */ }
    }
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const inner = trimmed.slice(1, -1);
      return inner.split(',').map(s => s.replace(/^"|"$/g, '').trim()).filter(Boolean);
    }
    return trimmed.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
  }
  return [];
};

export const fetchProductsFromSupabase = async (localProductsFallback?: Product[]): Promise<Product[]> => {
  const productsMap = new Map<string, Product>();

  // 1. Load local fallback products
  if (Array.isArray(localProductsFallback)) {
    for (const p of localProductsFallback) {
      if (p && p.id) {
        productsMap.set(String(p.id).trim(), { ...p, pinCodes: Array.isArray(p.pinCodes) ? [...p.pinCodes] : [] });
      }
    }
  }

  // 2. Load INITIAL_PRODUCTS
  for (const initP of INITIAL_PRODUCTS) {
    if (!productsMap.has(initP.id)) {
      productsMap.set(initP.id, { ...initP, pinCodes: Array.isArray(initP.pinCodes) ? [...initP.pinCodes] : [] });
    }
  }

  // 3. Query Supabase
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0 && !error) {
        for (const p of data) {
          const pCode = String(p.product_code || p.id || '').trim();
          if (!pCode) continue;

          const rawPrice = p.price ?? p.price_htg ?? p.priceHTG ?? p.amount;
          const numPrice = Number(rawPrice);
          const numDiamonds = (p.diamonds_amount !== undefined && p.diamonds_amount !== null) ? Number(p.diamonds_amount) : (p.diamonds ? Number(p.diamonds) : undefined);

          let existing = productsMap.get(pCode) || productsMap.get(p.id);

          const finalPrice = (!isNaN(numPrice) && numPrice > 0)
            ? numPrice
            : (existing?.priceHTG || 0);

          const rawNameStr = String(p.title || p.name || '').trim();
          const finalName = (rawNameStr && rawNameStr !== 'Produit')
            ? rawNameStr
            : (existing?.name || 'Pack Diamants');

          const finalDiamonds = numDiamonds || existing?.diamonds;
          const finalBonus = p.bonus_diamonds !== undefined ? Number(p.bonus_diamonds) : existing?.bonusDiamonds;

          const allowedMethods = Array.isArray(p.allowed_payment_methods)
            ? p.allowed_payment_methods
            : (existing?.allowedPaymentMethods || (p.category === 'free_fire' ? ['wallet'] : ['wallet', 'moncash', 'natcash']));

          const parsedDbPins = parsePinCodes(p.pin_codes ?? p.pinCodes);
          const combinedPinsSet = new Set<string>();
          if (existing?.pinCodes) {
            existing.pinCodes.forEach(pin => combinedPinsSet.add(pin));
          }
          parsedDbPins.forEach(pin => combinedPinsSet.add(pin));
          const finalPinCodes = Array.from(combinedPinsSet);

          const productObj: Product = {
            id: pCode || existing?.id || `prod-${Date.now()}`,
            name: finalName,
            category: (p.category as ProductCategory) || existing?.category || 'free_fire',
            priceHTG: finalPrice,
            diamonds: finalDiamonds,
            bonusDiamonds: finalBonus,
            image: p.image_url || p.image || existing?.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
            description: (p.description && p.description !== 'Produit' && p.description.trim() !== '') ? p.description : (existing?.description || 'Top Up par ID Free Fire'),
            stock: p.stock !== undefined && p.stock !== null ? Math.max(Number(p.stock), finalPinCodes.length) : (finalPinCodes.length > 0 ? finalPinCodes.length : (existing?.stock ?? 100)),
            isPopular: p.is_popular !== undefined && p.is_popular !== null ? Boolean(p.is_popular) : Boolean(p.isPopular ?? existing?.isPopular),
            pinCodes: finalPinCodes,
            allowedPaymentMethods: allowedMethods
          };

          productsMap.set(productObj.id, productObj);
        }
      }
    } catch (err) {
      handleSupabaseError('Erreur lecture table products', err);
    }
  }

  const resultList = Array.from(productsMap.values());
  resultList.sort((a, b) => a.priceHTG - b.priceHTG);
  return resultList;
};

export const fetchNatcashConfigFromSupabase = async (): Promise<NatcashConfig> => {
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('natcash_config')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (data && !error) {
        return {
          number: data.number || INITIAL_NATCASH_CONFIG.number,
          name: data.name || INITIAL_NATCASH_CONFIG.name,
          moncashNumber: data.moncash_number || data.moncashNumber || INITIAL_NATCASH_CONFIG.moncashNumber,
          moncashName: data.moncash_name || data.moncashName || INITIAL_NATCASH_CONFIG.moncashName,
          instructions: data.instructions || INITIAL_NATCASH_CONFIG.instructions,
          supportPhone: data.support_phone || data.supportPhone || INITIAL_NATCASH_CONFIG.supportPhone,
          supportEmail: data.support_email || data.supportEmail || INITIAL_NATCASH_CONFIG.supportEmail,
          adminPin: data.admin_pin || data.adminPin || INITIAL_NATCASH_CONFIG.adminPin,
          adminEmail: data.admin_email || data.adminEmail || INITIAL_NATCASH_CONFIG.adminEmail,
          adminPassword: data.admin_password || data.adminPassword || INITIAL_NATCASH_CONFIG.adminPassword
        };
      }
    } catch (err) {
      handleSupabaseError('Erreur lecture natcash_config', err);
    }
  }
  return INITIAL_NATCASH_CONFIG;
};

export const getUserDetailsMap = async (fallbackUsers: UserProfile[] = []) => {
  const userDetailsMap = new Map<string, { email: string; name: string; phone: string }>();

  if (Array.isArray(fallbackUsers)) {
    fallbackUsers.forEach(u => {
      if (u) {
        const meta = { email: u.email || '', name: u.name || '', phone: u.phone || '' };
        if (u.id) userDetailsMap.set(String(u.id), meta);
        if (u.email) userDetailsMap.set(String(u.email).toLowerCase().trim(), meta);
      }
    });
  }

  if (supabaseAdmin) {
    try {
      // 1. From public.users
      const { data: dbUsers } = await supabaseAdmin.from('users').select('*');
      if (dbUsers) {
        dbUsers.forEach(u => {
          const meta = { email: u.email || '', name: u.name || '', phone: u.phone || '' };
          if (u.id) userDetailsMap.set(String(u.id), meta);
          if (u.email) userDetailsMap.set(String(u.email).toLowerCase().trim(), meta);
        });
      }

      // 2. From Auth users list
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      if (listData && listData.users) {
        listData.users.forEach((u: any) => {
          const meta = {
            email: u.email || '',
            name: u.user_metadata?.name || u.email?.split('@')[0] || '',
            phone: u.user_metadata?.phone || u.phone || ''
          };
          if (u.id) {
            if (!userDetailsMap.has(String(u.id))) userDetailsMap.set(String(u.id), meta);
          }
          if (u.email) {
            const em = String(u.email).toLowerCase().trim();
            if (!userDetailsMap.has(em)) userDetailsMap.set(em, meta);
          }
        });
      }
    } catch (err) {
      console.error('[Supabase] Error building userDetailsMap:', err);
    }
  }

  return userDetailsMap;
};

function withTimeout<T>(promise: Promise<T>, ms: number = 1500, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ]);
}

export const fetchDepositsFromSupabase = async (email?: string, fallbackDeposits: WalletDeposit[] = []): Promise<WalletDeposit[]> => {
  const depsMap = new Map<string, WalletDeposit>();

  // 1. Populate from local fallback
  if (Array.isArray(fallbackDeposits)) {
    for (const d of fallbackDeposits) {
      if (d && d.id) {
        depsMap.set(String(d.id).trim(), d);
      }
    }
  }

  let userDetailsMap = new Map<string, { email: string; name: string; phone: string }>();

  // 2. Query Supabase DB with 1500ms timeout max
  if (supabaseAdmin) {
    try {
      await withTimeout(
        (async () => {
          userDetailsMap = await getUserDetailsMap();

          const { data, error } = await supabaseAdmin
            .from('wallet_deposits')
            .select('*')
            .order('created_at', { ascending: false });

          if (data && !error) {
            for (const d of data) {
              const userMeta = userDetailsMap.get(String(d.user_id)) || (d.user_email ? userDetailsMap.get(String(d.user_email).toLowerCase().trim()) : undefined);
              const txId = d.transaction_id || d.transaction_id_14 || d.transactionId14 || '';

              // Find existing local fallback deposit if present by transactionId or ID
              let existingKey: string | null = null;
              for (const [k, v] of depsMap.entries()) {
                if (k === String(d.id) || (txId && v.transactionId14 === txId)) {
                  existingKey = k;
                  break;
                }
              }
              const existingLocal = existingKey ? depsMap.get(existingKey) : undefined;

              // Determine the true status: preference to DB status, unless DB status is 'en_attente' while local was already updated
              const dbStatus = d.status;
              const localStatus = existingLocal?.status;
              let finalStatus = dbStatus || localStatus || 'en_attente';
              if (dbStatus === 'en_attente' && localStatus && localStatus !== 'en_attente') {
                finalStatus = localStatus;
              }

              const item: WalletDeposit = {
                id: existingLocal?.id || String(d.id),
                userId: String(d.user_id || existingLocal?.userId || ''),
                userEmail: d.user_email || d.userEmail || existingLocal?.userEmail || userMeta?.email || '',
                userName: d.user_name || d.userName || existingLocal?.userName || userMeta?.name || '',
                userPhone: d.user_phone || d.userPhone || existingLocal?.userPhone || userMeta?.phone || '',
                transactionId14: txId || existingLocal?.transactionId14 || '',
                paymentMethod: d.payment_method || d.paymentMethod || existingLocal?.paymentMethod || 'natcash',
                amountHTG: Number(d.amount ?? d.amount_htg ?? d.amountHTG ?? existingLocal?.amountHTG ?? 0),
                status: finalStatus as DepositStatus,
                createdAt: d.created_at || d.createdAt || existingLocal?.createdAt || new Date().toISOString(),
                adminNote: d.admin_note !== undefined ? d.admin_note : existingLocal?.adminNote,
                screenshotUrl: d.screenshot_url || d.screenshotUrl || existingLocal?.screenshotUrl
              };

              if (existingKey && existingKey !== item.id) {
                depsMap.delete(existingKey);
              }
              depsMap.set(String(item.id).trim(), item);
            }
          }
        })(),
        1500,
        null
      );
    } catch (err) {
      handleSupabaseError('Erreur lecture wallet_deposits', err);
    }
  }

  let result = Array.from(depsMap.values());
  if (email) {
    const targetEmail = String(email).toLowerCase().trim();
    result = result.filter(d => {
      if (d.userEmail && d.userEmail.toLowerCase().trim() === targetEmail) return true;
      const meta = userDetailsMap.get(d.userId);
      return meta && meta.email.toLowerCase().trim() === targetEmail;
    });
  }

  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const fetchOrdersFromSupabase = async (email?: string, fallbackOrders: Order[] = []): Promise<Order[]> => {
  const ordersMap = new Map<string, Order>();

  // 1. Populate from local fallback
  if (Array.isArray(fallbackOrders)) {
    for (const o of fallbackOrders) {
      if (o && o.id) {
        ordersMap.set(String(o.id).trim(), o);
      }
    }
  }

  let userDetailsMap = new Map<string, { email: string; name: string; phone: string }>();

  // 2. Query Supabase DB
  if (supabaseAdmin) {
    try {
      userDetailsMap = await getUserDetailsMap();

      const prodMap = new Map<string, string>();
      const { data: dbProducts } = await supabaseAdmin.from('products').select('*');
      if (dbProducts) {
        dbProducts.forEach(p => {
          if (p.id) prodMap.set(String(p.id), p.title || p.name);
          if (p.product_code) prodMap.set(String(p.product_code), p.title || p.name);
        });
      }

      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        for (const o of data) {
          const userMeta = userDetailsMap.get(String(o.user_id)) || (o.user_email ? userDetailsMap.get(String(o.user_email).toLowerCase().trim()) : undefined);
          const pName = o.product_name || o.productName || prodMap.get(String(o.product_id)) || 'Pack Diamants Free Fire';

          const ordObj: Order = {
            id: String(o.id),
            userId: String(o.user_id || ''),
            userEmail: o.user_email || o.userEmail || userMeta?.email || '',
            userName: o.user_name || o.userName || userMeta?.name || '',
            productId: String(o.product_id || o.productId || ''),
            productName: pName,
            priceHTG: Number(o.amount ?? o.price_htg ?? o.priceHTG ?? 0),
            gamePlayerId: o.game_player_id || o.gamePlayerId || '',
            paymentMethod: o.payment_method || o.paymentMethod || 'wallet',
            natcashTransactionId: o.natcash_transaction_id || o.natcashTransactionId,
            pinCodeDelivered: o.pin_code_delivered || o.pin_code || o.pinCodeDelivered,
            status: (o.status === 'livre' || o.status === 'livré' ? 'reussi' : o.status) || 'reussi',
            createdAt: o.created_at || o.createdAt || new Date().toISOString()
          };
          ordersMap.set(String(ordObj.id).trim(), ordObj);
        }
      }
    } catch (err) {
      handleSupabaseError('Erreur lecture orders', err);
    }
  }

  let result = Array.from(ordersMap.values());
  if (email) {
    const targetEmail = String(email).toLowerCase().trim();
    result = result.filter(o => {
      if (o.userEmail && o.userEmail.toLowerCase().trim() === targetEmail) return true;
      const meta = userDetailsMap.get(o.userId);
      return meta && meta.email.toLowerCase().trim() === targetEmail;
    });
  }

  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const fetchUsersFromSupabase = async (fallbackUsers: UserProfile[] = []): Promise<UserProfile[]> => {
  const usersMap = new Map<string, UserProfile>();
  const ADMIN_EMAILS = [
    'junioradrien284@gmail.com',
    'emmanuelselicour.2002@gmail.com',
    'emmanuel@gmail.com'
  ];

  // 1. Core Default Admin (Junior Adrien)
  const defaultAdmin: UserProfile = {
    id: 'usr-admin-junior',
    name: 'Junior Adrien',
    email: 'junioradrien284@gmail.com',
    phone: '50941355116',
    createdAt: new Date().toISOString(),
    isEmailVerified: true,
    walletBalanceHTG: 0,
    isAdmin: true
  };
  usersMap.set(defaultAdmin.email.toLowerCase(), defaultAdmin);

  // 2. Secondary Admin
  const secondaryAdmin: UserProfile = {
    id: 'usr-admin',
    name: 'Emmanuel Selicour',
    email: 'emmanuel@gmail.com',
    phone: '50941355116',
    createdAt: new Date().toISOString(),
    isEmailVerified: true,
    walletBalanceHTG: 0,
    isAdmin: true
  };
  usersMap.set(secondaryAdmin.email.toLowerCase(), secondaryAdmin);

  // 3. Local memory fallback users
  if (Array.isArray(fallbackUsers)) {
    for (const u of fallbackUsers) {
      if (u && u.email) {
        const key = String(u.email).toLowerCase().trim();
        usersMap.set(key, {
          ...u,
          email: key,
          walletBalanceHTG: Number(u.walletBalanceHTG ?? 0),
          isAdmin: Boolean(u.isAdmin || ADMIN_EMAILS.includes(key)),
          passwordHash: u.passwordHash || u.password,
          password: u.password
        });
      }
    }
  }

  // 3. Query Supabase DB 'users' Table
  if (supabaseAdmin) {
    try {
      await withTimeout(
        (async () => {
          const { data: dbData, error: dbErr } = await supabaseAdmin.from('users').select('*').order('created_at', { ascending: false });
          if (dbData && Array.isArray(dbData) && !dbErr) {
            for (const u of dbData) {
              if (u.email) {
                const key = String(u.email).toLowerCase().trim();
                const existing = usersMap.get(key);
                const isAdmin = Boolean(u.is_admin ?? u.isAdmin ?? existing?.isAdmin ?? ADMIN_EMAILS.includes(key));
                const dbPass = u.password_hash || u.passwordHash || u.password || existing?.passwordHash || existing?.password;
                usersMap.set(key, {
                  id: u.id || existing?.id || `usr-${Date.now()}`,
                  name: u.name || existing?.name || key.split('@')[0],
                  email: key,
                  phone: u.phone || existing?.phone || '',
                  createdAt: u.created_at || u.createdAt || existing?.createdAt || new Date().toISOString(),
                  isEmailVerified: isAdmin ? true : Boolean(u.is_email_verified ?? u.isEmailVerified ?? existing?.isEmailVerified ?? false),
                  walletBalanceHTG: Number(u.wallet_balance_htg ?? u.walletBalanceHTG ?? existing?.walletBalanceHTG ?? 0),
                  isAdmin,
                  passwordHash: dbPass,
                  password: dbPass
                });
              }
            }
          }
        })(),
        1500,
        null
      );
    } catch (err) {
      handleSupabaseError('DB users warning', err);
    }
  }

  return Array.from(usersMap.values());
};

export const fetchTicketsFromSupabase = async (fallbackTickets: ContactTicket[] = []): Promise<ContactTicket[]> => {
  const ticketsMap = new Map<string, ContactTicket>();

  if (Array.isArray(fallbackTickets)) {
    for (const t of fallbackTickets) {
      if (t && t.id) {
        ticketsMap.set(String(t.id).trim(), t);
      }
    }
  }

  if (supabaseAdmin) {
    // 1. Fetch from 'contacts' table
    try {
      const { data: contactsData, error: cErr } = await supabaseAdmin.from('contacts').select('*').order('created_at', { ascending: false });
      if (contactsData && !cErr && Array.isArray(contactsData)) {
        for (const c of contactsData) {
          const item: ContactTicket = {
            id: String(c.id),
            userId: c.user_id || c.userId || '',
            userName: c.name || c.user_name || c.userName || '',
            userEmail: c.email || c.user_email || c.userEmail || '',
            userPhone: c.phone || c.user_phone || c.userPhone || '',
            subject: c.subject || 'Support',
            message: c.message || '',
            status: c.status || 'nouveau',
            createdAt: c.created_at || c.createdAt || new Date().toISOString()
          };
          ticketsMap.set(String(item.id).trim(), item);
        }
      }
    } catch (err) {
      handleSupabaseError('Erreur lecture contacts', err);
    }

    // 2. Fetch from 'tickets' table
    try {
      const { data: ticketsData, error: tErr } = await supabaseAdmin.from('tickets').select('*').order('created_at', { ascending: false });
      if (ticketsData && !tErr && Array.isArray(ticketsData)) {
        for (const t of ticketsData) {
          const item: ContactTicket = {
            id: String(t.id),
            userId: t.user_id || t.userId || '',
            userName: t.user_name || t.userName || '',
            userEmail: t.user_email || t.userEmail || '',
            userPhone: t.user_phone || t.userPhone || '',
            subject: t.subject || 'Support',
            message: t.message || '',
            status: t.status || 'nouveau',
            createdAt: t.created_at || t.createdAt || new Date().toISOString()
          };
          ticketsMap.set(String(item.id).trim(), item);
        }
      }
    } catch (err) {
      handleSupabaseError('Erreur lecture tickets', err);
    }
  }

  return Array.from(ticketsMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// ============================================================================
// SUPABASE AUTH & SYNC MUTATIONS
// ============================================================================

export function hashUserPassword(password: string): string {
  if (!password) return '';
  return crypto.createHash('sha256').update(password + '_frayzen_secure_salt_2026').digest('hex');
}

export function verifyUserPassword(inputPassword?: string, storedHashOrPassword?: string): boolean {
  if (!inputPassword || !storedHashOrPassword) return false;
  const trimmedInput = String(inputPassword).trim();
  const trimmedStored = String(storedHashOrPassword).trim();
  if (trimmedInput === trimmedStored) return true;
  const inputHash = hashUserPassword(trimmedInput);
  return inputHash === trimmedStored;
}

export const signInWithSupabaseAuth = async (email: string, password: string) => {
  if (!supabaseServer) {
    return { success: false, error: 'Supabase non configuré.' };
  }
  try {
    const { data, error } = await supabaseServer.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: String(password).trim()
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, user: data.user, session: data.session };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erreur Supabase Auth' };
  }
};

export const signUpWithSupabaseAuth = async (email: string, name: string, phone: string, password?: string) => {
  if (!supabaseAdmin) {
    return { success: false, message: 'Supabase non configuré.' };
  }

  try {
    const userPassword = password || `Frayzen_${Math.random().toString(36).slice(-8)}!`;
    const { data, error } = await supabaseAdmin.auth.signUp({
      email: email.toLowerCase().trim(),
      password: userPassword,
      options: {
        data: {
          full_name: name,
          name: name,
          phone: phone,
          shop: 'FRAYZEN SHOP',
          app_name: 'FRAYZEN SHOP',
          company: 'FRAYZEN SHOP'
        }
      }
    });

    if (error) {
      handleSupabaseError('Auth error', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user, session: data.session };
  } catch (err: any) {
    handleSupabaseError('Auth exception', err);
    return { success: false, error: err?.message || 'Erreur Supabase Auth' };
  }
};

export const resendVerificationEmail = async (email: string) => {
  if (!supabaseAdmin) {
    return { success: false, error: 'Supabase non configuré.' };
  }
  try {
    const targetEmail = email.toLowerCase().trim();
    const { error } = await supabaseAdmin.auth.resend({
      type: 'signup',
      email: targetEmail
    });

    if (error) {
      console.warn('[Supabase Auth resend signup error]:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, message: `Email de confirmation renvoyé avec succès à ${targetEmail}.` };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erreur lors du renvoi de l\'email.' };
  }
};

// Helper to generate or format deterministic UUID
export function toUuid(idStr?: string): string {
  if (!idStr) return crypto.randomUUID();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr);
  if (isUuid) return idStr;
  const hash = crypto.createHash('md5').update(String(idStr)).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

// Helper to ensure user exists in Supabase Auth & public.users table to satisfy foreign keys
export const ensureAuthUserInSupabase = async (
  email?: string,
  name?: string,
  phone?: string,
  walletBalanceHTG?: number
): Promise<string> => {
  if (!supabaseAdmin) return crypto.randomUUID();
  const targetEmail = (email || 'client@frayzen.com').toLowerCase().trim();
  const userName = name || targetEmail.split('@')[0];
  const userPhone = phone || null;
  const isAdmin = ['junioradrien284@gmail.com', 'emmanuelselicour.2002@gmail.com', 'emmanuel@gmail.com'].includes(targetEmail);

  try {
    // 1. Check in public.users table first
    const { data: existingPublic } = await supabaseAdmin
      .from('users')
      .select('id, email, name, phone, wallet_balance_htg, is_email_verified')
      .ilike('email', targetEmail)
      .maybeSingle();

    if (existingPublic && existingPublic.id) {
      if (walletBalanceHTG !== undefined && existingPublic.wallet_balance_htg !== walletBalanceHTG) {
        await supabaseAdmin
          .from('users')
          .update({ wallet_balance_htg: walletBalanceHTG })
          .eq('id', existingPublic.id);
      }
      return existingPublic.id;
    }

    // 2. Deterministic UUID for fast user resolution
    const authUserId = toUuid('usr-' + targetEmail);

    // 3. Ensure user row in public.users table
    const initBalance = walletBalanceHTG !== undefined ? walletBalanceHTG : 0;
    await supabaseAdmin.from('users').upsert({
      id: authUserId,
      email: targetEmail,
      name: userName,
      phone: userPhone,
      wallet_balance_htg: initBalance,
      is_admin: isAdmin,
      is_email_verified: isAdmin ? true : false,
      created_at: new Date().toISOString()
    }, { onConflict: 'id' });

    return authUserId;
  } catch (err) {
    console.error('[Supabase] ensureAuthUserInSupabase error:', err);
    return toUuid('usr-' + targetEmail);
  }
};

export const syncNatcashConfigToSupabase = async (config: NatcashConfig) => {
  if (!supabaseAdmin) return;
  try {
    const payload: any = {
      id: 1,
      number: config.number,
      name: config.name,
      moncash_number: config.moncashNumber,
      moncash_name: config.moncashName,
      instructions: config.instructions,
      support_phone: config.supportPhone,
      support_email: config.supportEmail,
      admin_pin: config.adminPin
    };
    if (config.adminEmail) payload.admin_email = config.adminEmail;
    if (config.adminPassword) payload.admin_password = config.adminPassword;

    const { error } = await supabaseAdmin.from('natcash_config').upsert(payload, { onConflict: 'id' });
    if (error) {
      // Fallback if custom columns not present in table schema
      delete payload.admin_email;
      delete payload.admin_password;
      await supabaseAdmin.from('natcash_config').upsert(payload, { onConflict: 'id' });
    }
  } catch (err) {
    handleSupabaseError('Erreur sync natcash_config', err);
  }
};

export const syncProductToSupabase = async (product: Product) => {
  if (!supabaseAdmin) return;
  try {
    const prodUuid = toUuid(product.id);
    const pinCodesArr = Array.isArray(product.pinCodes) ? product.pinCodes : [];

    const payload: any = {
      id: prodUuid,
      product_code: product.id,
      title: product.name,
      description: product.description || 'Top Up par ID Free Fire - Livré à l\'instant',
      price: Number(product.priceHTG) || 0,
      diamonds_amount: Number(product.diamonds) || null,
      bonus_diamonds: Number(product.bonusDiamonds) || 0,
      image_url: product.image,
      category: product.category || 'free_fire',
      stock: Math.max(Number(product.stock) || 0, pinCodesArr.length),
      is_popular: Boolean(product.isPopular),
      pin_codes: pinCodesArr
    };

    const { error } = await supabaseAdmin.from('products').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] Error syncing product:', error.message || error);
    } else {
      console.log('[Supabase] Product synced successfully:', product.id);
    }
  } catch (err: any) {
    handleSupabaseError('Erreur sync product', err);
  }
};

export const deleteProductFromSupabase = async (id: string) => {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.from('products').delete().eq('id', toUuid(id));
  } catch (err) {
    handleSupabaseError('Erreur suppression product', err);
  }
};

export const syncUserToSupabase = async (user: UserProfile) => {
  if (!supabaseAdmin) return;
  try {
    const authUserId = await ensureAuthUserInSupabase(user.email, user.name, user.phone, user.walletBalanceHTG);
    const payload: any = {
      id: authUserId,
      name: user.name,
      email: user.email.toLowerCase().trim(),
      phone: user.phone,
      created_at: user.createdAt,
      is_email_verified: user.isEmailVerified,
      wallet_balance_htg: user.walletBalanceHTG,
      is_admin: user.isAdmin
    };
    if (user.passwordHash || user.password) {
      payload.password_hash = user.passwordHash || (user.password ? hashUserPassword(user.password) : undefined);
    }

    const { error } = await supabaseAdmin.from('users').upsert(payload, { onConflict: 'id' });
    if (error) {
      // Fallback if password_hash column does not exist in schema
      delete payload.password_hash;
      await supabaseAdmin.from('users').upsert(payload, { onConflict: 'id' });
    }
  } catch (err) {
    handleSupabaseError('Erreur sync user', err);
  }
};

export const syncDepositToSupabase = async (deposit: WalletDeposit) => {
  if (!supabaseAdmin) return;
  try {
    const authUserId = await ensureAuthUserInSupabase(deposit.userEmail, deposit.userName, deposit.userPhone);
    const depUuid = toUuid(deposit.id);

    const payload: any = {
      id: depUuid,
      user_id: authUserId,
      transaction_id: deposit.transactionId14 || deposit.id,
      amount: Number(deposit.amountHTG) || 0,
      payment_method: deposit.paymentMethod || 'natcash',
      status: deposit.status || 'en_attente',
      created_at: deposit.createdAt || new Date().toISOString()
    };

    if (deposit.userEmail) payload.user_email = deposit.userEmail.toLowerCase().trim();
    if (deposit.userName) payload.user_name = deposit.userName;
    if (deposit.userPhone) payload.user_phone = deposit.userPhone;
    if (deposit.adminNote) payload.admin_note = deposit.adminNote;
    if (deposit.screenshotUrl) payload.screenshot_url = deposit.screenshotUrl;

    const { error } = await supabaseAdmin.from('wallet_deposits').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('[Supabase] Primary deposit upsert notice:', error.message || error);
    } else {
      console.log('[Supabase] Deposit upserted successfully:', deposit.id, 'status:', deposit.status);
    }

    // Secondary update by transaction_id to guarantee match regardless of UUID scheme
    if (deposit.transactionId14) {
      const txUpdatePayload: any = {
        status: deposit.status,
        amount: Number(deposit.amountHTG) || 0
      };
      if (deposit.adminNote !== undefined) txUpdatePayload.admin_note = deposit.adminNote;
      const { error: txErr } = await supabaseAdmin
        .from('wallet_deposits')
        .update(txUpdatePayload)
        .eq('transaction_id', deposit.transactionId14);

      if (txErr) {
        console.warn('[Supabase] Deposit update by transaction_id notice:', txErr.message || txErr);
      } else {
        console.log('[Supabase] Deposit updated by transaction_id:', deposit.transactionId14, 'status:', deposit.status);
      }
    }
  } catch (err) {
    handleSupabaseError('Erreur sync deposit', err);
  }
};

export const syncOrderToSupabase = async (order: Order) => {
  if (!supabaseAdmin) return;
  try {
    const authUserId = await ensureAuthUserInSupabase(order.userEmail, order.userName);
    const ordUuid = toUuid(order.id);

    // Resolve real product_id from products table in Supabase
    let realProductId: string | null = null;
    if (order.productId) {
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.productId)) {
        realProductId = order.productId;
      } else {
        const { data: foundProd } = await supabaseAdmin
          .from('products')
          .select('id')
          .or(`product_code.eq.${order.productId},id.eq.${order.productId}`)
          .maybeSingle();
        if (foundProd) {
          realProductId = foundProd.id;
        }
      }
    }

    // Map status for DB check constraint orders_status_check ('livre', 'en_attente', 'annule')
    let dbStatus = 'livre';
    const rawSt = String(order.status || '').toLowerCase().trim();
    if (rawSt === 'en_attente' || rawSt === 'pending') {
      dbStatus = 'en_attente';
    } else if (rawSt === 'annule' || rawSt === 'annulé' || rawSt === 'cancelled') {
      dbStatus = 'annule';
    }

    const payload: any = {
      id: ordUuid,
      user_id: authUserId,
      product_id: realProductId,
      game_player_id: order.gamePlayerId || 'N/A',
      amount: Number(order.priceHTG) || 0,
      payment_method: order.paymentMethod || 'wallet',
      status: dbStatus,
      pin_code_delivered: order.pinCodeDelivered || null,
      natcash_transaction_id: order.natcashTransactionId || null,
      created_at: order.createdAt || new Date().toISOString()
    };

    const { error } = await supabaseAdmin.from('orders').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] Error syncing order:', error.message || error);
    } else {
      console.log('[Supabase] Order synced successfully:', order.id);
    }
  } catch (err) {
    handleSupabaseError('Erreur sync order', err);
  }
};

export const syncTicketToSupabase = async (ticket: ContactTicket) => {
  if (!supabaseAdmin) return;
  try {
    const authUserId = await ensureAuthUserInSupabase(ticket.userEmail, ticket.userName, ticket.userPhone);
    const ctUuid = toUuid(ticket.id);

    const payload: any = {
      id: ctUuid,
      user_id: authUserId,
      full_name: ticket.userName || 'Client',
      email: ticket.userEmail || 'non_fourni@frayzen.com',
      phone_number: ticket.userPhone || null,
      subject: ticket.subject || 'Demande de support',
      message: ticket.message || '',
      status: ticket.status || 'nouveau',
      created_at: ticket.createdAt || new Date().toISOString()
    };

    const { error } = await supabaseAdmin.from('contacts').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] Error syncing contact ticket:', error.message || error);
    } else {
      console.log('[Supabase] Contact ticket synced successfully:', ticket.id);
    }
  } catch (err) {
    handleSupabaseError('Erreur sync contacts', err);
  }
};

export const fetchPinsFromSupabase = async (fallbackPins: PinRecord[] = []): Promise<PinRecord[]> => {
  const pinsMap = new Map<string, PinRecord>();

  if (Array.isArray(fallbackPins)) {
    fallbackPins.forEach(p => {
      if (p && p.id) {
        pinsMap.set(p.id, p);
      }
    });
  }

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.from('pins').select('*');
      if (data && !error) {
        data.forEach((p: any) => {
          const pinObj: PinRecord = {
            id: p.id || `pin-${Date.now()}`,
            pinCode: String(p.pin_code || p.pinCode || p.code || '').trim(),
            productId: String(p.product_id || p.productId || '').trim(),
            productName: String(p.product_name || p.productName || 'Pack Diamants').trim(),
            packPriceHTG: Number(p.pack_price_htg || p.price_htg || p.packPriceHTG || 0),
            diamonds: p.diamonds ? Number(p.diamonds) : undefined,
            status: p.status === 'sold' ? 'sold' : 'available',
            soldToUserId: p.sold_to_user_id || p.soldToUserId || undefined,
            soldToEmail: p.sold_to_email || p.soldToEmail || undefined,
            soldToUserName: p.sold_to_user_name || p.soldToUserName || undefined,
            soldOrderId: p.sold_order_id || p.soldOrderId || undefined,
            soldAt: p.sold_at || p.soldAt || undefined,
            createdAt: p.created_at || p.createdAt || new Date().toISOString()
          };
          if (pinObj.pinCode) {
            pinsMap.set(pinObj.id, pinObj);
          }
        });
      }
    } catch (err) {
      handleSupabaseError('Erreur lecture table pins', err);
    }
  }

  return Array.from(pinsMap.values());
};

export const syncPinToSupabase = async (pin: PinRecord) => {
  if (!supabaseAdmin) return;
  try {
    const payload = {
      id: pin.id,
      pin_code: pin.pinCode,
      product_id: pin.productId,
      product_name: pin.productName,
      pack_price_htg: Number(pin.packPriceHTG) || 0,
      diamonds: pin.diamonds ? Number(pin.diamonds) : null,
      status: pin.status || 'available',
      sold_to_user_id: pin.soldToUserId || null,
      sold_to_email: pin.soldToEmail ? pin.soldToEmail.toLowerCase().trim() : null,
      sold_to_user_name: pin.soldToUserName || null,
      sold_order_id: pin.soldOrderId || null,
      sold_at: pin.soldAt || null,
      created_at: pin.createdAt || new Date().toISOString()
    };

    const { error } = await supabaseAdmin.from('pins').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] Error syncing pin:', error.message || error);
    } else {
      console.log('[Supabase] Pin synced successfully:', pin.pinCode, 'status:', pin.status);
    }
  } catch (err) {
    handleSupabaseError('Erreur sync pin', err);
  }
};

export const syncAllPinsToSupabase = async (pinsArr: PinRecord[]) => {
  if (!supabaseAdmin || !Array.isArray(pinsArr) || pinsArr.length === 0) return;
  try {
    const payloads = pinsArr.map(pin => ({
      id: pin.id,
      pin_code: pin.pinCode,
      product_id: pin.productId,
      product_name: pin.productName,
      pack_price_htg: Number(pin.packPriceHTG) || 0,
      diamonds: pin.diamonds ? Number(pin.diamonds) : null,
      status: pin.status || 'available',
      sold_to_user_id: pin.soldToUserId || null,
      sold_to_email: pin.soldToEmail ? pin.soldToEmail.toLowerCase().trim() : null,
      sold_to_user_name: pin.soldToUserName || null,
      sold_order_id: pin.soldOrderId || null,
      sold_at: pin.soldAt || null,
      created_at: pin.createdAt || new Date().toISOString()
    }));

    const { error } = await supabaseAdmin.from('pins').upsert(payloads, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] Error syncing batch pins:', error.message || error);
    } else {
      console.log(`[Supabase] Batch of ${pinsArr.length} PINs synced successfully.`);
    }
  } catch (err) {
    handleSupabaseError('Erreur sync batch pins', err);
  }
};

export const deletePinFromSupabase = async (pinId: string) => {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.from('pins').delete().eq('id', pinId);
  } catch (err) {
    handleSupabaseError('Erreur suppression pin', err);
  }
};
