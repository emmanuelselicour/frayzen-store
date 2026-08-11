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

// ============================================================================
// FETCH HELPERS WITH DB QUERY & SAFE INITIAL FALLBACK
// ============================================================================

export const fetchProductsFromSupabase = async (): Promise<Product[]> => {
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0 && !error) {
        const rawProducts: Product[] = data.map((p: any, idx: number) => {
          const rawPrice = p.price_htg ?? p.priceHTG ?? p.price_HTG ?? p.price ?? p.amount ?? p.cost;
          const numPrice = Number(rawPrice);

          // Match with INITIAL_PRODUCTS
          let initMatch = INITIAL_PRODUCTS.find(i =>
            i.id === p.id ||
            (p.name && i.name && p.name.toLowerCase().trim() === i.name.toLowerCase().trim()) ||
            (p.diamonds && Number(p.diamonds) === i.diamonds) ||
            (!isNaN(numPrice) && numPrice > 0 && numPrice === i.priceHTG)
          );

          if (!initMatch && idx < INITIAL_PRODUCTS.length && (!p.name || p.name === 'Produit')) {
            initMatch = INITIAL_PRODUCTS[idx];
          }

          const finalPrice = (!isNaN(numPrice) && numPrice > 0)
            ? numPrice
            : (initMatch?.priceHTG && initMatch.priceHTG > 0 ? initMatch.priceHTG : 0);

          const finalName = (p.name && p.name !== 'Produit' && p.name.trim() !== '')
            ? p.name
            : (initMatch?.name || 'Produit');

          const finalDiamonds = p.diamonds ? Number(p.diamonds) : initMatch?.diamonds;
          const finalBonus = p.bonus_diamonds ? Number(p.bonus_diamonds) : (p.bonusDiamonds ? Number(p.bonusDiamonds) : initMatch?.bonusDiamonds);

          const productObj: Product = {
            id: p.id || initMatch?.id || `prod-${idx}`,
            name: finalName,
            category: (p.category as ProductCategory) || initMatch?.category || 'free_fire',
            priceHTG: finalPrice,
            diamonds: finalDiamonds,
            bonusDiamonds: finalBonus,
            image: p.image || initMatch?.image,
            description: (p.description && p.description !== 'Produit' && p.description.trim() !== '') ? p.description : initMatch?.description,
            stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : (initMatch?.stock ?? 100),
            isPopular: p.is_popular !== undefined && p.is_popular !== null ? Boolean(p.is_popular) : Boolean(p.isPopular ?? initMatch?.isPopular),
            pinCodes: Array.isArray(p.pin_codes) ? p.pin_codes : (Array.isArray(p.pinCodes) ? p.pinCodes : (initMatch?.pinCodes || []))
          };

          // Auto-heal DB row if Supabase row had generic name 'Produit' or missing diamonds or price
          if (!p.name || p.name === 'Produit' || !p.diamonds || !p.price_htg || Number(p.price_htg) <= 0) {
            syncProductToSupabase(productObj).catch(() => {});
          }

          return productObj;
        });

        // Deduplicate products by priceHTG or diamonds or id
        const uniqueMap = new Map<string, Product>();
        for (const prod of rawProducts) {
          const key = prod.priceHTG > 0 ? `price-${prod.priceHTG}` : (prod.diamonds ? `diam-${prod.diamonds}` : prod.id);
          const existing = uniqueMap.get(key);
          if (!existing) {
            uniqueMap.set(key, prod);
          } else {
            // Keep the one with a specific non-generic name if existing is 'Produit'
            if (existing.name === 'Produit' && prod.name !== 'Produit') {
              uniqueMap.set(key, prod);
            }
            // Delete duplicate row from Supabase if it had a different id
            if (prod.id !== existing.id) {
              deleteProductFromSupabase(prod.id).catch(() => {});
            }
          }
        }

        const mappedProducts = Array.from(uniqueMap.values());

        // Ensure all default initial products exist if missing
        for (const initP of INITIAL_PRODUCTS) {
          const exists = mappedProducts.some(mp =>
            mp.id === initP.id ||
            mp.priceHTG === initP.priceHTG ||
            (mp.diamonds && mp.diamonds === initP.diamonds) ||
            mp.name === initP.name
          );
          if (!exists) {
            mappedProducts.push(initP);
            syncProductToSupabase(initP).catch(() => {});
          }
        }

        mappedProducts.sort((a, b) => a.priceHTG - b.priceHTG);
        return mappedProducts;
      } else if (error || !data || data.length === 0) {
        // Auto-seed INITIAL_PRODUCTS if table is empty
        for (const initP of INITIAL_PRODUCTS) {
          syncProductToSupabase(initP).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('[Supabase] Erreur lecture table products:', err);
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
      console.warn('[Supabase] Erreur lecture natcash_config:', err);
    }
  }
  return INITIAL_NATCASH_CONFIG;
};

export const fetchDepositsFromSupabase = async (email?: string): Promise<WalletDeposit[]> => {
  if (supabaseAdmin) {
    try {
      let query = supabaseAdmin.from('wallet_deposits').select('*').order('created_at', { ascending: false });
      if (email) {
        query = query.ilike('user_email', email.trim());
      }
      const { data, error } = await query;
      if (data && !error) {
        return data.map((d: any) => ({
          id: d.id,
          userId: d.user_id || d.userId,
          userEmail: d.user_email || d.userEmail,
          userName: d.user_name || d.userName,
          userPhone: d.user_phone || d.userPhone,
          transactionId14: d.transaction_id_14 || d.transactionId14,
          paymentMethod: d.payment_method || d.paymentMethod || 'natcash',
          amountHTG: Number(d.amount_htg ?? d.amountHTG),
          status: d.status,
          createdAt: d.created_at || d.createdAt,
          adminNote: d.admin_note || d.adminNote,
          screenshotUrl: d.screenshot_url || d.screenshotUrl
        }));
      }
    } catch (err) {
      console.warn('[Supabase] Erreur lecture wallet_deposits:', err);
    }
  }
  return [];
};

export const fetchOrdersFromSupabase = async (email?: string): Promise<Order[]> => {
  if (supabaseAdmin) {
    try {
      let query = supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false });
      if (email) {
        query = query.ilike('user_email', email.trim());
      }
      const { data, error } = await query;
      if (data && !error) {
        return data.map((o: any) => ({
          id: o.id,
          userId: o.user_id || o.userId,
          userEmail: o.user_email || o.userEmail,
          userName: o.user_name || o.userName,
          productId: o.product_id || o.productId,
          productName: o.product_name || o.productName,
          priceHTG: Number(o.price_htg ?? o.priceHTG ?? o.price ?? 0),
          gamePlayerId: o.game_player_id || o.gamePlayerId,
          paymentMethod: o.payment_method || o.paymentMethod,
          natcashTransactionId: o.natcash_transaction_id || o.natcashTransactionId,
          pinCodeDelivered: o.pin_code_delivered || o.pinCodeDelivered,
          status: o.status,
          createdAt: o.created_at || o.createdAt
        }));
      }
    } catch (err) {
      console.warn('[Supabase] Erreur lecture orders:', err);
    }
  }
  return [];
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
      console.warn('[Supabase Auth List Warning]:', err);
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
      console.warn('[Supabase DB Users Warning]:', err);
    }
  }

  return Array.from(usersMap.values());
};

export const fetchTicketsFromSupabase = async (): Promise<ContactTicket[]> => {
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.from('tickets').select('*').order('created_at', { ascending: false });
      if (data && !error) {
        return data.map((t: any) => ({
          id: t.id,
          userId: t.user_id || t.userId,
          userName: t.user_name || t.userName,
          userEmail: t.user_email || t.userEmail,
          userPhone: t.user_phone || t.userPhone,
          subject: t.subject,
          message: t.message,
          status: t.status,
          createdAt: t.created_at || t.createdAt
        }));
      }
    } catch (err) {
      console.warn('[Supabase] Erreur lecture tickets:', err);
    }
  }
  return [];
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
      console.error('[Supabase Auth Error]', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user, session: data.session };
  } catch (err: any) {
    console.error('[Supabase Auth Exception]', err);
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
    console.error('[Supabase] Erreur sync natcash_config:', err);
  }
};

export const syncProductToSupabase = async (product: Product) => {
  if (!supabaseAdmin) return;
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
      pin_codes: product.pinCodes || []
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('[Supabase] Erreur sync product:', err);
  }
};

export const deleteProductFromSupabase = async (id: string) => {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.from('products').delete().eq('id', id);
  } catch (err) {
    console.error('[Supabase] Erreur suppression product:', err);
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
    console.error('[Supabase] Erreur sync user:', err);
  }
};

export const syncDepositToSupabase = async (deposit: WalletDeposit) => {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.from('wallet_deposits').upsert({
      id: deposit.id,
      user_id: deposit.userId,
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
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('[Supabase] Erreur sync deposit:', err);
  }
};

export const syncOrderToSupabase = async (order: Order) => {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.from('orders').upsert({
      id: order.id,
      user_id: order.userId,
      user_email: order.userEmail,
      user_name: order.userName,
      product_id: order.productId,
      product_name: order.productName,
      price_htg: order.priceHTG,
      game_player_id: order.gamePlayerId,
      payment_method: order.paymentMethod,
      natcash_transaction_id: order.natcashTransactionId || null,
      pin_code_delivered: order.pinCodeDelivered || null,
      status: order.status,
      created_at: order.createdAt
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('[Supabase] Erreur sync order:', err);
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
    console.error('[Supabase] Erreur sync ticket:', err);
  }
};
