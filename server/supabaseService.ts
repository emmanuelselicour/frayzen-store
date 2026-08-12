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
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0 && !error) {
        // Map raw DB rows to Product objects, matching with INITIAL_PRODUCTS
        const rawProducts: { prod: Product; originalId: string; rawName: string }[] = data.map((p: any, idx: number) => {
          const rawPrice = p.price_htg ?? p.priceHTG ?? p.price_HTG ?? p.price ?? p.amount ?? p.cost;
          const numPrice = Number(rawPrice);
          const numDiamonds = p.diamonds ? Number(p.diamonds) : undefined;

          // Find match in INITIAL_PRODUCTS
          let initMatch = INITIAL_PRODUCTS.find(i =>
            i.id === p.id ||
            (i.diamonds && numDiamonds && i.diamonds === numDiamonds) ||
            (i.priceHTG && !isNaN(numPrice) && numPrice > 0 && i.priceHTG === numPrice) ||
            (p.name && i.name && p.name.toLowerCase().trim() === i.name.toLowerCase().trim())
          );

          // Find match in localProductsFallback
          const localMatch = localProductsFallback?.find(lp =>
            lp.id === p.id ||
            (lp.diamonds && numDiamonds && lp.diamonds === numDiamonds) ||
            (lp.priceHTG && numPrice && lp.priceHTG === numPrice)
          );

          // If no initMatch, check if row index corresponds to INITIAL_PRODUCTS
          if (!initMatch && idx < INITIAL_PRODUCTS.length && (!p.name || p.name === 'Produit')) {
            initMatch = INITIAL_PRODUCTS[idx];
          }

          const finalPrice = (!isNaN(numPrice) && numPrice > 0)
            ? numPrice
            : (initMatch?.priceHTG && initMatch.priceHTG > 0 ? initMatch.priceHTG : 0);

          const rawNameStr = String(p.name || '').trim();
          const finalName = (rawNameStr && rawNameStr !== 'Produit')
            ? rawNameStr
            : (initMatch?.name || 'Produit');

          const finalDiamonds = numDiamonds || initMatch?.diamonds;
          const finalBonus = p.bonus_diamonds ? Number(p.bonus_diamonds) : (p.bonusDiamonds ? Number(p.bonusDiamonds) : initMatch?.bonusDiamonds);

          const allowedMethods = Array.isArray(p.allowed_payment_methods)
            ? p.allowed_payment_methods
            : (Array.isArray(p.allowedPaymentMethods) ? p.allowedPaymentMethods : (initMatch?.allowedPaymentMethods || (p.category === 'free_fire' || initMatch?.category === 'free_fire' ? ['wallet'] : ['wallet', 'moncash', 'natcash'])));

          const parsedDbPins = parsePinCodes(p.pin_codes ?? p.pinCodes ?? p.pin_code ?? p.pincodes);
          const finalPinCodes = parsedDbPins.length > 0
            ? parsedDbPins
            : (localMatch?.pinCodes && localMatch.pinCodes.length > 0 ? localMatch.pinCodes : (initMatch?.pinCodes || []));

          const productObj: Product = {
            id: p.id || initMatch?.id || `prod-${idx}`,
            name: finalName,
            category: (p.category as ProductCategory) || initMatch?.category || 'free_fire',
            priceHTG: finalPrice,
            diamonds: finalDiamonds,
            bonusDiamonds: finalBonus,
            image: p.image || initMatch?.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
            description: (p.description && p.description !== 'Produit' && p.description.trim() !== '') ? p.description : (initMatch?.description || 'Top Up par ID Free Fire - Livré à l\'instant'),
            stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : (finalPinCodes.length > 0 ? finalPinCodes.length : (initMatch?.stock ?? 100)),
            isPopular: p.is_popular !== undefined && p.is_popular !== null ? Boolean(p.is_popular) : Boolean(p.isPopular ?? initMatch?.isPopular),
            pinCodes: finalPinCodes,
            allowedPaymentMethods: allowedMethods
          };

          return { prod: productObj, originalId: String(p.id || ''), rawName: rawNameStr };
        });

        // Deduplicate: key = priceHTG or diamonds or id
        const uniqueProductsMap = new Map<string, { prod: Product; originalId: string; rawName: string }>();
        const idsToDeleteFromDB: string[] = [];

        for (const item of rawProducts) {
          const { prod, originalId, rawName } = item;

          // Key for grouping
          const key = prod.priceHTG > 0
            ? `price-${prod.priceHTG}`
            : (prod.diamonds ? `diam-${prod.diamonds}` : `id-${prod.id}`);

          const existing = uniqueProductsMap.get(key);

          if (!existing) {
            uniqueProductsMap.set(key, item);
          } else {
            // Compare existing vs item: keep the better one
            const existingIsGeneric = !existing.rawName || existing.rawName === 'Produit';
            const itemIsGeneric = !rawName || rawName === 'Produit';

            if (existingIsGeneric && !itemIsGeneric) {
              // Replace existing with item
              if (existing.originalId && existing.originalId !== item.originalId) {
                idsToDeleteFromDB.push(existing.originalId);
              }
              uniqueProductsMap.set(key, item);
            } else {
              // Keep existing, discard item
              if (originalId && originalId !== existing.originalId) {
                idsToDeleteFromDB.push(originalId);
              }
            }
          }
        }

        // Delete duplicate IDs from Supabase DB asynchronously
        for (const delId of idsToDeleteFromDB) {
          if (delId) {
            deleteProductFromSupabase(delId).catch(() => {});
          }
        }

        const finalProductsList = Array.from(uniqueProductsMap.values()).map(item => item.prod);

        // Ensure all default INITIAL_PRODUCTS exist
        for (const initP of INITIAL_PRODUCTS) {
          const exists = finalProductsList.some(p =>
            p.id === initP.id ||
            p.priceHTG === initP.priceHTG ||
            (p.diamonds && initP.diamonds && p.diamonds === initP.diamonds) ||
            p.name.toLowerCase().trim() === initP.name.toLowerCase().trim()
          );

          if (!exists) {
            finalProductsList.push(initP);
            syncProductToSupabase(initP).catch(() => {});
          } else {
            // Also sync updated/healed item to DB
            const matched = finalProductsList.find(p => p.priceHTG === initP.priceHTG || p.id === initP.id);
            if (matched) {
              syncProductToSupabase(matched).catch(() => {});
            }
          }
        }

        // Clean up any remaining "Produit" generic named items if they duplicate a real pack
        const cleanedProducts = finalProductsList.filter((p, index, self) => {
          if (p.name === 'Produit') {
            const hasBetter = self.some(other => other !== p && other.priceHTG === p.priceHTG && other.name !== 'Produit');
            if (hasBetter) {
              if (p.id) deleteProductFromSupabase(p.id).catch(() => {});
              return false;
            }
          }
          return true;
        });

        cleanedProducts.sort((a, b) => a.priceHTG - b.priceHTG);
        return cleanedProducts;
      } else if (error || !data || data.length === 0) {
        // Auto-seed INITIAL_PRODUCTS if table is empty
        for (const initP of INITIAL_PRODUCTS) {
          syncProductToSupabase(initP).catch(() => {});
        }
      }
    } catch (err) {
      handleSupabaseError('Erreur lecture table products', err);
    }
  }

  return INITIAL_PRODUCTS;
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

  if (Array.isArray(fallbackDeposits)) {
    for (const d of fallbackDeposits) {
      if (d && d.id) {
        if (!email || d.userEmail?.toLowerCase().trim() === email.toLowerCase().trim()) {
          depsMap.set(String(d.id).trim(), d);
        }
      }
    }
  }

  if (supabaseAdmin) {
    try {
      let query = supabaseAdmin.from('wallet_deposits').select('*').order('created_at', { ascending: false });
      if (email) {
        query = query.ilike('user_email', email.trim());
      }
      const { data, error } = await query;
      if (data && !error) {
        for (const d of data) {
          const item: WalletDeposit = {
            id: String(d.id),
            userId: String(d.user_id || d.userId || ''),
            userEmail: d.user_email || d.userEmail || '',
            userName: d.user_name || d.userName || '',
            userPhone: d.user_phone || d.userPhone || '',
            transactionId14: d.transaction_id_14 || d.transactionId14 || '',
            paymentMethod: d.payment_method || d.paymentMethod || 'natcash',
            amountHTG: Number(d.amount_htg ?? d.amountHTG ?? 0),
            status: d.status,
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

  return Array.from(depsMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const fetchOrdersFromSupabase = async (email?: string, fallbackOrders: Order[] = []): Promise<Order[]> => {
  const ordersMap = new Map<string, Order>();

  if (Array.isArray(fallbackOrders)) {
    for (const o of fallbackOrders) {
      if (o && o.id) {
        if (!email || o.userEmail.toLowerCase().trim() === email.toLowerCase().trim()) {
          ordersMap.set(String(o.id).trim(), o);
        }
      }
    }
  }

  if (supabaseAdmin) {
    try {
      let query = supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false });
      if (email) {
        query = query.ilike('user_email', email.trim());
      }
      const { data, error } = await query;
      if (data && !error) {
        for (const o of data) {
          const ordObj: Order = {
            id: String(o.id),
            userId: String(o.user_id || o.userId || ''),
            userEmail: o.user_email || o.userEmail || '',
            userName: o.user_name || o.userName || '',
            productId: String(o.product_id || o.productId || ''),
            productName: o.product_name || o.productName || '',
            priceHTG: Number(o.price_htg ?? o.priceHTG ?? o.price ?? 0),
            gamePlayerId: o.game_player_id || o.gamePlayerId || '',
            paymentMethod: o.payment_method || o.paymentMethod || 'wallet',
            natcashTransactionId: o.natcash_transaction_id || o.natcashTransactionId,
            pinCodeDelivered: o.pin_code_delivered || o.pinCodeDelivered,
            status: o.status,
            createdAt: o.created_at || o.createdAt
          };
          ordersMap.set(String(ordObj.id).trim(), ordObj);
        }
      }
    } catch (err) {
      handleSupabaseError('Erreur lecture orders', err);
    }
  }

  return Array.from(ordersMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
        ticketsMap.set(t.id, t);
      }
    }
  }

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.from('tickets').select('*').order('created_at', { ascending: false });
      if (data && !error && Array.isArray(data)) {
        for (const t of data) {
          ticketsMap.set(t.id, {
            id: t.id,
            userId: t.user_id || t.userId,
            userName: t.user_name || t.userName,
            userEmail: t.user_email || t.userEmail,
            userPhone: t.user_phone || t.userPhone,
            subject: t.subject,
            message: t.message,
            status: t.status || 'nouveau',
            createdAt: t.created_at || t.createdAt
          });
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
    const fullPayload = {
      id: String(deposit.id).trim(),
      user_id: String(deposit.userId || '').trim(),
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
      // Fallback: try minimal payload in case optional columns are missing in user Supabase schema
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
      console.log('[Supabase] Deposit synced successfully:', deposit.id);
    }
  } catch (err) {
    handleSupabaseError('Erreur sync deposit', err);
  }
};

export const syncOrderToSupabase = async (order: Order) => {
  if (!supabaseAdmin) return;
  try {
    const fullPayload = {
      id: String(order.id).trim(),
      user_id: String(order.userId || '').trim(),
      user_email: order.userEmail,
      user_name: order.userName,
      product_id: String(order.productId || '').trim(),
      product_name: order.productName,
      price_htg: order.priceHTG,
      game_player_id: order.gamePlayerId,
      payment_method: order.paymentMethod,
      natcash_transaction_id: order.natcashTransactionId || null,
      pin_code_delivered: order.pinCodeDelivered || null,
      status: order.status,
      created_at: order.createdAt
    };

    const { error } = await supabaseAdmin.from('orders').upsert(fullPayload, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase] Error in syncOrderToSupabase:', error.message || error);
      // Fallback: try minimal payload
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
      console.log('[Supabase] Order synced successfully:', order.id);
    }
  } catch (err) {
    handleSupabaseError('Erreur sync order', err);
  }
};

export const syncTicketToSupabase = async (ticket: ContactTicket) => {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.from('tickets').upsert({
      id: ticket.id,
      user_id: ticket.userId || null,
      user_name: ticket.userName,
      user_email: ticket.userEmail,
      user_phone: ticket.userPhone || null,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      created_at: ticket.createdAt
    }, { onConflict: 'id' });
  } catch (err) {
    handleSupabaseError('Erreur sync ticket', err);
  }
};
