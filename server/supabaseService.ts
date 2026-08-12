import { createClient } from '@supabase/supabase-js';
import { Product, ProductCategory, NatcashConfig, WalletDeposit, Order, ContactTicket, UserProfile } from '../src/types';
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
          const pId = String(p.id || '').trim();
          if (!pId) continue;

          const rawPrice = p.price_htg ?? p.priceHTG ?? p.price_HTG ?? p.price ?? p.amount ?? p.cost;
          const numPrice = Number(rawPrice);
          const numDiamonds = p.diamonds ? Number(p.diamonds) : undefined;

          let existing = productsMap.get(pId);
          if (!existing) {
            existing = productsMap.get(`prod-${pId}`) || Array.from(productsMap.values()).find(item => item.id === pId || (numPrice > 0 && item.priceHTG === numPrice));
          }

          const finalPrice = (!isNaN(numPrice) && numPrice > 0)
            ? numPrice
            : (existing?.priceHTG || 0);

          const rawNameStr = String(p.name || '').trim();
          const finalName = (rawNameStr && rawNameStr !== 'Produit')
            ? rawNameStr
            : (existing?.name || 'Pack Diamants');

          const finalDiamonds = numDiamonds || existing?.diamonds;
          const finalBonus = p.bonus_diamonds ? Number(p.bonus_diamonds) : (p.bonusDiamonds ? Number(p.bonusDiamonds) : existing?.bonusDiamonds);

          const allowedMethods = Array.isArray(p.allowed_payment_methods)
            ? p.allowed_payment_methods
            : (Array.isArray(p.allowedPaymentMethods) ? p.allowedPaymentMethods : (existing?.allowedPaymentMethods || (p.category === 'free_fire' ? ['wallet'] : ['wallet', 'moncash', 'natcash'])));

          const parsedDbPins = parsePinCodes(p.pin_codes ?? p.pinCodes ?? p.pin_code ?? p.pincodes);
          
          // Combine DB pins with any locally known PINs so PINs are NEVER lost
          const combinedPinsSet = new Set<string>();
          if (existing?.pinCodes) {
            existing.pinCodes.forEach(pin => combinedPinsSet.add(pin));
          }
          parsedDbPins.forEach(pin => combinedPinsSet.add(pin));
          const finalPinCodes = Array.from(combinedPinsSet);

          const productObj: Product = {
            id: pId || existing?.id || `prod-${Date.now()}`,
            name: finalName,
            category: (p.category as ProductCategory) || existing?.category || 'free_fire',
            priceHTG: finalPrice,
            diamonds: finalDiamonds,
            bonusDiamonds: finalBonus,
            image: p.image || existing?.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
            description: (p.description && p.description !== 'Produit' && p.description.trim() !== '') ? p.description : (existing?.description || 'Top Up par ID Free Fire'),
            stock: p.stock !== undefined && p.stock !== null ? Math.max(Number(p.stock), finalPinCodes.length) : (finalPinCodes.length > 0 ? finalPinCodes.length : (existing?.stock ?? 100)),
            isPopular: p.is_popular !== undefined && p.is_popular !== null ? Boolean(p.is_popular) : Boolean(p.isPopular ?? existing?.isPopular),
            pinCodes: finalPinCodes,
            allowedPaymentMethods: allowedMethods
          };

          productsMap.set(productObj.id, productObj);
        }
      } else if (error || !data || data.length === 0) {
        for (const initP of INITIAL_PRODUCTS) {
          syncProductToSupabase(initP).catch(() => {});
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
          adminPin: data.admin_pin || data.adminPin || INITIAL_NATCASH_CONFIG.adminPin
        };
      }
    } catch (err) {
      handleSupabaseError('Erreur lecture natcash_config', err);
    }
  }
  return INITIAL_NATCASH_CONFIG;
};

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

  // 2. Query Supabase DB
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('wallet_deposits')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        for (const d of data) {
          const item: WalletDeposit = {
            id: String(d.id),
            userId: String(d.user_id || d.userId || ''),
            userEmail: d.user_email || d.userEmail || d.email || '',
            userName: d.user_name || d.userName || d.name || '',
            userPhone: d.user_phone || d.userPhone || d.phone || '',
            transactionId14: d.transaction_id_14 || d.transactionId14 || d.transaction_id || '',
            paymentMethod: d.payment_method || d.paymentMethod || 'natcash',
            amountHTG: Number(d.amount_htg ?? d.amountHTG ?? d.amount ?? 0),
            status: d.status || 'en_attente',
            createdAt: d.created_at || d.createdAt || new Date().toISOString(),
            adminNote: d.admin_note || d.adminNote,
            screenshotUrl: d.screenshot_url || d.screenshotUrl
          };
          depsMap.set(String(item.id).trim(), item);
        }
      }
    } catch (err) {
      handleSupabaseError('Erreur lecture wallet_deposits', err);
    }
  }

  let result = Array.from(depsMap.values());
  if (email) {
    const targetEmail = String(email).toLowerCase().trim();
    result = result.filter(d => d.userEmail.toLowerCase().trim() === targetEmail);
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

  // 2. Query Supabase DB
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        for (const o of data) {
          const ordObj: Order = {
            id: String(o.id),
            userId: String(o.user_id || o.userId || ''),
            userEmail: o.user_email || o.userEmail || o.email || '',
            userName: o.user_name || o.userName || o.name || '',
            productId: String(o.product_id || o.productId || ''),
            productName: o.product_name || o.productName || '',
            priceHTG: Number(o.price_htg ?? o.priceHTG ?? o.price ?? 0),
            gamePlayerId: o.game_player_id || o.gamePlayerId || o.game_id || '',
            paymentMethod: o.payment_method || o.paymentMethod || 'wallet',
            natcashTransactionId: o.natcash_transaction_id || o.natcashTransactionId || o.transaction_id,
            pinCodeDelivered: o.pin_code_delivered || o.pinCodeDelivered || o.pin_code,
            status: o.status || 'reussi',
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
    result = result.filter(o => o.userEmail.toLowerCase().trim() === targetEmail);
  }

  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const fetchUsersFromSupabase = async (fallbackUsers: UserProfile[] = []): Promise<UserProfile[]> => {
  const usersMap = new Map<string, UserProfile>();
  const ADMIN_EMAILS = ['emmanuelselicour.2002@gmail.com', 'emmanuel@gmail.com', 'danyff455@gmail.com'];

  // 1. Core Default Admin
  const defaultAdmin: UserProfile = {
    id: 'usr-admin',
    name: 'Emmanuel Selicour',
    email: 'emmanuel@gmail.com',
    phone: '50941355116',
    createdAt: new Date().toISOString(),
    isEmailVerified: true,
    walletBalanceHTG: 0,
    isAdmin: true
  };
  usersMap.set(defaultAdmin.email.toLowerCase(), defaultAdmin);

  // 2. Local memory fallback users
  if (Array.isArray(fallbackUsers)) {
    for (const u of fallbackUsers) {
      if (u && u.email) {
        const key = String(u.email).toLowerCase().trim();
        usersMap.set(key, {
          ...u,
          email: key,
          walletBalanceHTG: Number(u.walletBalanceHTG ?? 0),
          isAdmin: Boolean(u.isAdmin || ADMIN_EMAILS.includes(key))
        });
      }
    }
  }

  // 3. Query Supabase
  if (supabaseAdmin) {
    // 3a. Query Supabase Auth Users
    try {
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
      if (authData && authData.users && Array.isArray(authData.users) && !authErr) {
        for (const au of authData.users) {
          if (au.email) {
            const key = String(au.email).toLowerCase().trim();
            const existing = usersMap.get(key);
            const name = au.user_metadata?.full_name || au.user_metadata?.name || existing?.name || key.split('@')[0];
            const phone = au.user_metadata?.phone || existing?.phone || '';
            const createdAt = au.created_at || existing?.createdAt || new Date().toISOString();

            usersMap.set(key, {
              id: existing?.id || au.id || `usr-${Date.now()}`,
              name,
              email: key,
              phone,
              createdAt,
              isEmailVerified: Boolean(au.email_confirmed_at || existing?.isEmailVerified || true),
              walletBalanceHTG: Number(existing?.walletBalanceHTG ?? 0),
              isAdmin: Boolean(existing?.isAdmin || ADMIN_EMAILS.includes(key))
            });
          }
        }
      }
    } catch (err) {
      handleSupabaseError('Auth list warning', err);
    }

    // 3b. Query Supabase DB 'users' Table
    try {
      const { data: dbData, error: dbErr } = await supabaseAdmin.from('users').select('*').order('created_at', { ascending: false });
      if (dbData && Array.isArray(dbData) && !dbErr) {
        for (const u of dbData) {
          if (u.email) {
            const key = String(u.email).toLowerCase().trim();
            const existing = usersMap.get(key);
            usersMap.set(key, {
              id: u.id || existing?.id || `usr-${Date.now()}`,
              name: u.name || existing?.name || key.split('@')[0],
              email: key,
              phone: u.phone || existing?.phone || '',
              createdAt: u.created_at || u.createdAt || existing?.createdAt || new Date().toISOString(),
              isEmailVerified: Boolean(u.is_email_verified ?? u.isEmailVerified ?? existing?.isEmailVerified ?? true),
              walletBalanceHTG: Number(u.wallet_balance_htg ?? u.walletBalanceHTG ?? existing?.walletBalanceHTG ?? 0),
              isAdmin: Boolean(u.is_admin ?? u.isAdmin ?? existing?.isAdmin ?? ADMIN_EMAILS.includes(key))
            });
          }
        }
      }
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

export const signUpWithSupabaseAuth = async (email: string, name: string, phone: string, password?: string) => {
  if (!supabaseAdmin) {
    return { success: false, message: 'Supabase non configuré.' };
  }

  try {
    const userPassword = password || `Frayzen_${Math.random().toString(36).slice(-8)}!`;
    const { data, error } = await supabaseAdmin.auth.signUp({
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
      handleSupabaseError('Auth error', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user, session: data.session };
  } catch (err: any) {
    handleSupabaseError('Auth exception', err);
    return { success: false, error: err?.message || 'Erreur Supabase Auth' };
  }
};

export const syncNatcashConfigToSupabase = async (config: NatcashConfig) => {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.from('natcash_config').upsert({
      id: 1,
      number: config.number,
      name: config.name,
      moncash_number: config.moncashNumber,
      moncash_name: config.moncashName,
      instructions: config.instructions,
      support_phone: config.supportPhone,
      support_email: config.supportEmail,
      admin_pin: config.adminPin
    }, { onConflict: 'id' });
  } catch (err) {
    handleSupabaseError('Erreur sync natcash_config', err);
  }
};

export const syncProductToSupabase = async (product: Product) => {
  if (!supabaseAdmin) return;
  try {
    const pinCodesArr = Array.isArray(product.pinCodes) ? product.pinCodes : [];
    const { error } = await supabaseAdmin.from('products').upsert({
      id: product.id,
      name: product.name,
      category: product.category,
      price_htg: product.priceHTG,
      diamonds: product.diamonds,
      bonus_diamonds: product.bonusDiamonds,
      image: product.image,
      description: product.description,
      stock: product.stock,
      is_popular: product.isPopular,
      pin_codes: pinCodesArr,
      allowed_payment_methods: product.allowedPaymentMethods || (product.category === 'free_fire' ? ['wallet'] : ['wallet', 'moncash', 'natcash'])
    }, { onConflict: 'id' });

    if (error) {
      const msg = String(error.message || '');
      if (msg.includes('pin_code') || msg.includes('column') || msg.includes('array')) {
        console.warn('[Supabase] Retrying product sync with json string format:', msg);
        try {
          await supabaseAdmin.from('products').upsert({
            id: product.id,
            name: product.name,
            category: product.category,
            price_htg: product.priceHTG,
            diamonds: product.diamonds,
            bonus_diamonds: product.bonusDiamonds,
            image: product.image,
            description: product.description,
            stock: product.stock,
            is_popular: product.isPopular,
            pin_codes: JSON.stringify(pinCodesArr),
            allowed_payment_methods: product.allowedPaymentMethods || (product.category === 'free_fire' ? ['wallet'] : ['wallet', 'moncash', 'natcash'])
          }, { onConflict: 'id' });
        } catch {
          // silent fallback
        }
      } else {
        handleSupabaseError('Erreur sync product', error);
      }
    }
  } catch (err: any) {
    handleSupabaseError('Erreur sync product', err);
  }
};

export const deleteProductFromSupabase = async (id: string) => {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.from('products').delete().eq('id', id);
  } catch (err) {
    handleSupabaseError('Erreur suppression product', err);
  }
};

export const syncUserToSupabase = async (user: UserProfile) => {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.from('users').upsert({
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
    handleSupabaseError('Erreur sync user', err);
  }
};

export const syncDepositToSupabase = async (deposit: WalletDeposit) => {
  if (!supabaseAdmin) return;
  try {
    const rawUserId = String(deposit.userId || '').trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawUserId);

    const fullPayload: any = {
      id: String(deposit.id).trim(),
      user_id: isUuid ? rawUserId : null,
      user_email: deposit.userEmail,
      user_name: deposit.userName,
      user_phone: deposit.userPhone,
      transaction_id_14: deposit.transactionId14,
      payment_method: deposit.paymentMethod || 'natcash',
      amount_htg: deposit.amountHTG,
      status: deposit.status,
      created_at: deposit.createdAt,
      admin_note: deposit.adminNote || null,
      screenshot_url: deposit.screenshotUrl || null
    };

    const { error } = await supabaseAdmin.from('wallet_deposits').upsert(fullPayload, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase] Error in syncDepositToSupabase:', error.message || error);
      // Fallback 1: Try without user_id in case user_id constraint is strictly UUID or missing
      delete fullPayload.user_id;
      const { error: err2 } = await supabaseAdmin.from('wallet_deposits').upsert(fullPayload, { onConflict: 'id' });
      
      if (err2) {
        // Fallback 2: Minimal payload
        const minimalPayload = {
          id: String(deposit.id).trim(),
          user_email: deposit.userEmail,
          user_name: deposit.userName,
          transaction_id_14: deposit.transactionId14,
          amount_htg: deposit.amountHTG,
          status: deposit.status,
          created_at: deposit.createdAt
        };
        const { error: minErr } = await supabaseAdmin.from('wallet_deposits').upsert(minimalPayload, { onConflict: 'id' });
        if (minErr) {
          console.error('[Supabase] Minimal fallback syncDepositToSupabase error:', minErr.message || minErr);
        } else {
          console.log('[Supabase] Minimal fallback syncDepositToSupabase succeeded for:', deposit.id);
        }
      } else {
        console.log('[Supabase] Fallback 1 syncDepositToSupabase succeeded for:', deposit.id);
      }
    } else {
      console.log('[Supabase] Deposit synced successfully:', deposit.id);
    }
  } catch (err) {
    handleSupabaseError('Erreur sync deposit', err);
  }
};

export const syncOrderToSupabase = async (order: Order) => {
  if (!supabaseAdmin) return;
  try {
    const rawUserId = String(order.userId || '').trim();
    const isUserUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawUserId);

    const rawProductId = String(order.productId || '').trim();
    const isProdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawProductId);

    const fullPayload: any = {
      id: String(order.id).trim(),
      user_id: isUserUuid ? rawUserId : null,
      user_email: order.userEmail,
      user_name: order.userName,
      product_id: isProdUuid ? rawProductId : rawProductId,
      product_name: order.productName,
      price_htg: order.priceHTG,
      game_player_id: order.gamePlayerId,
      payment_method: order.paymentMethod,
      natcash_transaction_id: order.natcashTransactionId || null,
      pin_code_delivered: order.pinCodeDelivered || null,
      status: order.status,
      created_at: order.createdAt
    };

    let { error } = await supabaseAdmin.from('orders').upsert(fullPayload, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase] Error in syncOrderToSupabase fullPayload:', error.message || error);
      // Fallback 1: Try setting product_id to null if product_id constraint/type failed
      const payload2 = { ...fullPayload, product_id: isProdUuid ? rawProductId : null, user_id: null };
      const { error: err2 } = await supabaseAdmin.from('orders').upsert(payload2, { onConflict: 'id' });

      if (err2) {
        console.error('[Supabase] Fallback 1 syncOrderToSupabase error:', err2.message || err2);
        // Fallback 2: Minimal payload
        const minimalPayload = {
          id: String(order.id).trim(),
          user_email: order.userEmail,
          product_name: order.productName,
          price_htg: order.priceHTG,
          game_player_id: order.gamePlayerId,
          payment_method: order.paymentMethod,
          status: order.status,
          created_at: order.createdAt
        };
        const { error: minErr } = await supabaseAdmin.from('orders').upsert(minimalPayload, { onConflict: 'id' });
        if (minErr) {
          console.error('[Supabase] Minimal fallback syncOrderToSupabase error:', minErr.message || minErr);
        } else {
          console.log('[Supabase] Minimal fallback syncOrderToSupabase succeeded for order:', order.id);
        }
      } else {
        console.log('[Supabase] Fallback 1 syncOrderToSupabase succeeded for order:', order.id);
      }
    } else {
      console.log('[Supabase] Order synced successfully:', order.id);
    }
  } catch (err) {
    handleSupabaseError('Erreur sync order', err);
  }
};

export const syncTicketToSupabase = async (ticket: ContactTicket) => {
  if (!supabaseAdmin) return;
  const rawUserId = String(ticket.userId || '').trim();
  const isUserUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawUserId);

  // 1. Sync to 'contacts' table
  try {
    const contactPayload: any = {
      id: String(ticket.id).trim(),
      user_id: isUserUuid ? rawUserId : null,
      name: ticket.userName,
      user_name: ticket.userName,
      email: ticket.userEmail,
      user_email: ticket.userEmail,
      phone: ticket.userPhone || null,
      user_phone: ticket.userPhone || null,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      created_at: ticket.createdAt
    };

    const { error: cErr } = await supabaseAdmin.from('contacts').upsert(contactPayload, { onConflict: 'id' });
    if (cErr) {
      const minContact = {
        id: String(ticket.id).trim(),
        name: ticket.userName,
        email: ticket.userEmail,
        phone: ticket.userPhone || null,
        subject: ticket.subject,
        message: ticket.message,
        status: ticket.status,
        created_at: ticket.createdAt
      };
      await supabaseAdmin.from('contacts').upsert(minContact, { onConflict: 'id' });
    }
  } catch (err) {
    handleSupabaseError('Erreur sync contacts', err);
  }

  // 2. Sync to 'tickets' table
  try {
    const ticketPayload: any = {
      id: String(ticket.id).trim(),
      user_id: isUserUuid ? rawUserId : null,
      user_name: ticket.userName,
      user_email: ticket.userEmail,
      user_phone: ticket.userPhone || null,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      created_at: ticket.createdAt
    };

    const { error: tErr } = await supabaseAdmin.from('tickets').upsert(ticketPayload, { onConflict: 'id' });
    if (tErr) {
      delete ticketPayload.user_id;
      await supabaseAdmin.from('tickets').upsert(ticketPayload, { onConflict: 'id' });
    }
  } catch (err) {
    handleSupabaseError('Erreur sync tickets', err);
  }
};
