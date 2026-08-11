import express from 'express';
import path from 'path';
import fs from 'fs';
import { INITIAL_PRODUCTS, INITIAL_NATCASH_CONFIG, INITIAL_DEPOSITS, INITIAL_ORDERS, INITIAL_TICKETS } from './src/data/initialData';
import { Product, ProductCategory, NatcashConfig, WalletDeposit, Order, ContactTicket, UserProfile, AdminStats } from './src/types';
import {
  fetchProductsFromSupabase,
  fetchNatcashConfigFromSupabase,
  fetchDepositsFromSupabase,
  fetchOrdersFromSupabase,
  fetchUsersFromSupabase,
  fetchTicketsFromSupabase,
  syncNatcashConfigToSupabase,
  syncProductToSupabase,
  deleteProductFromSupabase,
  syncUserToSupabase,
  syncDepositToSupabase,
  syncOrderToSupabase,
  syncTicketToSupabase,
  signUpWithSupabaseAuth,
  isSupabaseServerConfigured
} from './server/supabaseService';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// CORS headers & Vercel serverless function path rewrites handler
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle Vercel serverless function path rewrites for API endpoints
  if (req.url.startsWith('/api/index') || req.url === '/api' || req.url === '/api/') {
    const matchedPath = req.headers['x-matched-path'] as string;
    if (matchedPath && matchedPath.startsWith('/api') && !matchedPath.includes('index')) {
      req.url = matchedPath;
    } else {
      const urlParts = req.url.split('?');
      if (urlParts[1]) {
        const params = new URLSearchParams(urlParts[1]);
        const pathParam = params.get('path');
        if (pathParam) {
          req.url = '/api/' + pathParam.replace(/^\//, '');
        }
      }
    }
  }

  next();
});

const DATA_FILE_PATH = process.env.VERCEL ? path.join('/tmp', 'database_store.json') : path.join(process.cwd(), 'database_store.json');

// Memory store fallback
let products: Product[] = [...INITIAL_PRODUCTS];
let natcashConfig: NatcashConfig = { ...INITIAL_NATCASH_CONFIG };
let walletDeposits: WalletDeposit[] = [...INITIAL_DEPOSITS];
let orders: Order[] = [...INITIAL_ORDERS];
let tickets: ContactTicket[] = [...INITIAL_TICKETS];
let users: UserProfile[] = [
  {
    id: 'usr-admin',
    name: 'Emmanuel Selicour',
    email: 'emmanuel@gmail.com',
    phone: '50941355116',
    createdAt: new Date().toISOString(),
    isEmailVerified: true,
    walletBalanceHTG: 0,
    isAdmin: true
  }
];

// Save to disk helper
const saveDataStore = () => {
  try {
    const data = {
      products,
      natcashConfig,
      walletDeposits,
      orders,
      tickets,
      users
    };
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erreur sauvegarde base de données local:', err);
  }
};

// Load from disk helper
const loadDataStore = () => {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.products)) products = data.products;
      if (data.natcashConfig) natcashConfig = data.natcashConfig;
      if (Array.isArray(data.walletDeposits)) walletDeposits = data.walletDeposits;
      if (Array.isArray(data.orders)) orders = data.orders;
      if (Array.isArray(data.tickets)) tickets = data.tickets;
      if (Array.isArray(data.users)) users = data.users;
    } else {
      saveDataStore();
    }
  } catch (err) {
    console.error('Erreur chargement base de données local:', err);
  }
};

loadDataStore();

// ------------------------------------
// API ROUTES
// ------------------------------------

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'FRAYZEN SHOP API', supabaseConfigured: isSupabaseServerConfigured, timestamp: new Date().toISOString() });
});

// NATCASH & MonCash Config API
app.get('/api/natcash-config', async (req, res) => {
  try {
    const config = await fetchNatcashConfigFromSupabase();
    res.json(config);
  } catch (err: any) {
    console.error('Error in GET /api/natcash-config:', err);
    res.json(natcashConfig || INITIAL_NATCASH_CONFIG);
  }
});

app.post('/api/natcash-config', async (req, res) => {
  try {
    const { number, name, moncashNumber, moncashName, instructions, supportPhone, supportEmail, adminPin } = req.body || {};
    if (!number || !name) {
      return res.status(400).json({ error: 'Le numéro NATCASH et le nom du destinataire sont requis.' });
    }
    natcashConfig = {
      number: String(number).trim(),
      name: String(name).trim(),
      moncashNumber: moncashNumber ? String(moncashNumber).trim() : natcashConfig.moncashNumber,
      moncashName: moncashName ? String(moncashName).trim() : natcashConfig.moncashName,
      instructions: instructions || natcashConfig.instructions,
      supportPhone: supportPhone || natcashConfig.supportPhone,
      supportEmail: supportEmail || natcashConfig.supportEmail,
      adminPin: adminPin ? String(adminPin).trim() : (natcashConfig.adminPin || '123456')
    };
    saveDataStore();
    await syncNatcashConfigToSupabase(natcashConfig);
    res.json({ message: 'Configuration de paiement NATCASH / MonCash mise à jour avec succès.', config: natcashConfig });
  } catch (err: any) {
    console.error('Error in POST /api/natcash-config:', err);
    res.status(500).json({ error: err?.message || 'Erreur lors de la mise à jour de la configuration.' });
  }
});

// Admin Pin Verification API
app.post('/api/admin/verify-pin', async (req, res) => {
  try {
    const { pin } = req.body || {};
    const config = await fetchNatcashConfigFromSupabase();
    const currentPin = config.adminPin || '123456';
    if (String(pin).trim() === currentPin) {
      return res.json({ success: true, message: 'Code PIN valide.' });
    }
    return res.status(401).json({ error: 'Code PIN 6 chiffres incorrect.' });
  } catch (err: any) {
    console.error('Error in /api/admin/verify-pin:', err);
    return res.status(500).json({ error: err?.message || 'Erreur lors de la vérification du code PIN.' });
  }
});

// Admin PIN Security Password Verification API (Password: 04004749+)
app.post('/api/admin/verify-pin-password', (req, res) => {
  try {
    const { password } = req.body || {};
    const REQUIRED_PASS = '04004749+';
    if (String(password).trim() === REQUIRED_PASS) {
      return res.json({ success: true, message: 'Accès gestion des PINs déverrouillé.' });
    }
    return res.status(401).json({ error: 'Mot de passe de sécurité incorrect.' });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Erreur lors de la vérification du mot de passe.' });
  }
});

// Products API
app.get('/api/products', async (req, res) => {
  try {
    const prods = await fetchProductsFromSupabase();
    res.json(prods);
  } catch (err: any) {
    console.error('Error in GET /api/products:', err);
    res.json(products.length > 0 ? products : INITIAL_PRODUCTS);
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, category, priceHTG, diamonds, bonusDiamonds, image, description, stock, isPopular, pinCodes, allowedPaymentMethods } = req.body || {};
    if (!name || !priceHTG || !category) {
      return res.status(400).json({ error: 'Nom, catégorie et prix en HTG sont obligatoires.' });
    }

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: String(name).trim(),
      category: (String(category).trim() as ProductCategory),
      priceHTG: Number(priceHTG),
      diamonds: diamonds ? Number(diamonds) : undefined,
      bonusDiamonds: bonusDiamonds ? Number(bonusDiamonds) : undefined,
      image: image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
      description: description || '',
      stock: Number(stock) || 0,
      isPopular: Boolean(isPopular),
      pinCodes: Array.isArray(pinCodes) ? pinCodes : [],
      allowedPaymentMethods: Array.isArray(allowedPaymentMethods) && allowedPaymentMethods.length > 0
        ? allowedPaymentMethods
        : (String(category).trim() === 'free_fire' ? ['wallet'] : ['wallet', 'moncash', 'natcash'])
    };

    products.unshift(newProduct);
    saveDataStore();
    await syncProductToSupabase(newProduct);
    res.status(201).json(newProduct);
  } catch (err: any) {
    console.error('Error in POST /api/products:', err);
    res.status(500).json({ error: err?.message || 'Erreur lors de la création du produit.' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentProds = await fetchProductsFromSupabase();
    const index = currentProds.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    const updatedProduct: Product = {
      ...currentProds[index],
      ...req.body,
      priceHTG: Number(req.body.priceHTG ?? currentProds[index].priceHTG),
      stock: Number(req.body.stock ?? currentProds[index].stock)
    };

    const localIndex = products.findIndex(p => p.id === id);
    if (localIndex !== -1) {
      products[localIndex] = updatedProduct;
    } else {
      products.unshift(updatedProduct);
    }
    saveDataStore();
    await syncProductToSupabase(updatedProduct);

    res.json(updatedProduct);
  } catch (err: any) {
    console.error('Error in PUT /api/products/:id:', err);
    res.status(500).json({ error: err?.message || 'Erreur lors de la mise à jour du produit.' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    products = products.filter(p => p.id !== id);
    saveDataStore();
    await deleteProductFromSupabase(id);
    res.json({ message: 'Produit supprimé avec succès.' });
  } catch (err: any) {
    console.error('Error in DELETE /api/products/:id:', err);
    res.status(500).json({ error: err?.message || 'Erreur lors de la suppression du produit.' });
  }
});

// Update PIN codes for product pack
app.put('/api/products/:id/pins', async (req, res) => {
  try {
    const { id } = req.params;
    const { pinCodes } = req.body || {};
    const prods = await fetchProductsFromSupabase();
    const product = prods.find(p => p.id === id);
    if (!product) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    if (Array.isArray(pinCodes)) {
      product.pinCodes = pinCodes.map((p: string) => String(p).trim()).filter(Boolean);
      if (product.pinCodes.length > product.stock) {
        product.stock = product.pinCodes.length;
      }
    }

    const localProd = products.find(p => p.id === id);
    if (localProd) {
      localProd.pinCodes = product.pinCodes;
      localProd.stock = product.stock;
    }
    saveDataStore();
    await syncProductToSupabase(product);

    res.json({ message: 'Codes PINs du produit mis à jour avec succès.', product });
  } catch (err: any) {
    console.error('Error in PUT /api/products/:id/pins:', err);
    res.status(500).json({ error: err?.message || 'Erreur lors de la mise à jour des PINs.' });
  }
});

// Auth & User Profile API
app.post('/api/auth/login', async (req, res) => {
  try {
    const { emailOrPhone } = req.body || {};
    if (!emailOrPhone) {
      return res.status(400).json({ error: 'Veuillez saisir votre email ou numéro de téléphone.' });
    }

    const query = String(emailOrPhone).toLowerCase().trim();
    const allUsers = await fetchUsersFromSupabase(users);
    let user = allUsers.find(u => u.email.toLowerCase() === query || u.phone.toLowerCase() === query);

    if (!user) {
      return res.status(404).json({ error: 'Compte introuvable. Veuillez créer un compte.' });
    }

    const ADMIN_EMAILS = ['emmanuelselicour.2002@gmail.com', 'emmanuel@gmail.com', 'danyff455@gmail.com'];
    if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      user.isAdmin = true;
      await syncUserToSupabase(user);
    }

    return res.json(user);
  } catch (err: any) {
    console.error('Login route error:', err);
    return res.status(500).json({ error: err?.message || 'Erreur serveur lors de la connexion.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body || {};
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Tous les champs (Nom, Email, Numéro) sont obligatoires.' });
    }

    const ADMIN_EMAILS = ['emmanuelselicour.2002@gmail.com', 'emmanuel@gmail.com', 'danyff455@gmail.com'];
    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedPhone = String(phone).trim();

    const allUsers = await fetchUsersFromSupabase(users);
    let existingUser = allUsers.find(u => u.email.toLowerCase() === normalizedEmail || (normalizedPhone && u.phone.trim() === normalizedPhone));

    if (existingUser) {
      if (ADMIN_EMAILS.includes(normalizedEmail)) {
        existingUser.isAdmin = true;
        await syncUserToSupabase(existingUser);
      }
      return res.json(existingUser);
    }

    const isAdminUser = ADMIN_EMAILS.includes(normalizedEmail);

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: String(name).trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
      walletBalanceHTG: 0,
      isAdmin: isAdminUser
    };

    users.push(newUser);
    saveDataStore();

    try {
      await syncUserToSupabase(newUser);
      await signUpWithSupabaseAuth(newUser.email, newUser.name, newUser.phone, password);
    } catch (e) {
      console.error('Supabase async trigger exception:', e);
    }

    return res.status(201).json(newUser);
  } catch (err: any) {
    console.error('Register route error:', err);
    return res.status(500).json({ error: err?.message || 'Erreur serveur lors de la création du compte.' });
  }
});

app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { email } = req.body || {};
    const allUsers = await fetchUsersFromSupabase(users);
    const user = allUsers.find(u => u.email.toLowerCase() === String(email).toLowerCase().trim());
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    user.isEmailVerified = true;
    await syncUserToSupabase(user);
    res.json({ message: 'Email vérifié avec succès. Bienvenue sur FRAYZEN SHOP !', user });
  } catch (err: any) {
    console.error('Error in /api/auth/verify-email:', err);
    res.status(500).json({ error: err?.message || 'Erreur lors de la vérification de l\'email.' });
  }
});

app.get('/api/user/profile/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const allUsers = await fetchUsersFromSupabase(users);
    const user = allUsers.find(u => u.email.toLowerCase() === String(email).toLowerCase().trim());
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }
    const ADMIN_EMAILS = ['emmanuelselicour.2002@gmail.com', 'emmanuel@gmail.com', 'danyff455@gmail.com'];
    if (ADMIN_EMAILS.includes(user.email.toLowerCase().trim())) {
      user.isAdmin = true;
    }

    const allOrders = await fetchOrdersFromSupabase();
    const userOrders = allOrders.filter(o => o.userEmail.toLowerCase() === user.email.toLowerCase());
    const successfulCount = userOrders.filter(o => o.status === 'reussi').length;
    const failedCount = userOrders.filter(o => o.status === 'echoue').length;

    res.json({
      ...user,
      successfulOrdersCount: successfulCount,
      failedOrdersCount: failedCount,
      totalSpentHTG: userOrders.filter(o => o.status === 'reussi').reduce((acc, o) => acc + o.priceHTG, 0)
    });
  } catch (err: any) {
    console.error('Error in /api/user/profile/:email:', err);
    res.status(500).json({ error: err?.message || 'Erreur lors de la récupération du profil.' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const allUsers = await fetchUsersFromSupabase(users);
    res.json(allUsers);
  } catch (err: any) {
    console.error('Error in /api/users:', err);
    res.json(users);
  }
});

app.get('/api/admin/users-detailed', async (req, res) => {
  try {
    const allUsers = await fetchUsersFromSupabase(users);
    const allOrders = await fetchOrdersFromSupabase();

    const detailedUsers = allUsers.map(u => {
      const userOrders = allOrders.filter(o => o.userEmail.toLowerCase() === u.email.toLowerCase());
      const totalPurchasesCount = userOrders.length;
      const successfulPurchasesCount = userOrders.filter(o => o.status === 'reussi').length;
      const failedPurchasesCount = userOrders.filter(o => o.status === 'echoue').length;

      return {
        ...u,
        totalPurchasesCount,
        successfulPurchasesCount,
        failedPurchasesCount
      };
    });

    res.json(detailedUsers);
  } catch (err: any) {
    console.error('Error in /api/admin/users-detailed:', err);
    res.status(500).json({ error: err?.message || 'Erreur lors de la récupération des utilisateurs.' });
  }
});

// Wallet Deposit API
app.post('/api/wallet/deposit', async (req, res) => {
  try {
    const { userEmail, transactionId14, amountHTG, screenshotUrl, paymentMethod } = req.body || {};

    if (!userEmail || !transactionId14 || !amountHTG) {
      return res.status(400).json({ error: 'Email, ID de transaction et montant sont obligatoires.' });
    }

    const cleanedTxId = String(transactionId14).replace(/\s+/g, '').trim();
    const method = paymentMethod === 'moncash' ? 'moncash' : 'natcash';

    if (method === 'natcash') {
      if (!/^\d{14}$/.test(cleanedTxId)) {
        return res.status(400).json({
          error: `ID de transaction NATCASH invalide. L'ID NATCASH doit contenir exactement 14 chiffres. Vous avez entré (${cleanedTxId.length} chiffres).`
        });
      }
    } else {
      if (cleanedTxId.length < 5) {
        return res.status(400).json({
          error: `ID de transaction MonCash invalide. Veuillez entrer un numéro de transaction MonCash valide.`
        });
      }
    }

    const allDeposits = await fetchDepositsFromSupabase();
    const duplicateTx = allDeposits.find(d => d.transactionId14 === cleanedTxId);

    if (duplicateTx) {
      return res.status(400).json({
        error: `SÉCURITÉ : Ce code de transaction (${cleanedTxId}) a déjà été utilisé par un autre dépôt le ${new Date(duplicateTx.createdAt).toLocaleDateString('fr-FR')}. Les doublons de transaction sont strictly rejetés par FRAYZEN SHOP.`
      });
    }

    const allUsers = await fetchUsersFromSupabase(users);
    const user = allUsers.find(u => u.email.toLowerCase() === String(userEmail).toLowerCase().trim());

    const newDeposit: WalletDeposit = {
      id: `dep-${Date.now()}`,
      userId: user ? user.id : 'usr-guest',
      userEmail: String(userEmail).toLowerCase().trim(),
      userName: user ? user.name : String(userEmail).split('@')[0],
      userPhone: user ? user.phone : 'Non spécifié',
      transactionId14: cleanedTxId,
      paymentMethod: method,
      amountHTG: Number(amountHTG),
      status: 'en_attente',
      createdAt: new Date().toISOString(),
      screenshotUrl: screenshotUrl || undefined
    };

    walletDeposits.unshift(newDeposit);
    saveDataStore();
    await syncDepositToSupabase(newDeposit);

    res.status(201).json({
      message: `Demande de dépôt ${method.toUpperCase()} enregistrée avec succès. Un administrateur va vérifier votre transaction.`,
      deposit: newDeposit
    });
  } catch (err: any) {
    console.error('Error in POST /api/wallet/deposit:', err);
    res.status(500).json({ error: err?.message || 'Erreur lors du dépôt de portefeuille.' });
  }
});

app.get('/api/wallet/deposits', async (req, res) => {
  try {
    const { email } = req.query;
    const deps = await fetchDepositsFromSupabase(email ? String(email) : undefined);
    res.json(deps);
  } catch (err: any) {
    console.error('Error in GET /api/wallet/deposits:', err);
    res.json(walletDeposits);
  }
});

app.put('/api/wallet/deposits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body || {};

    const allDeposits = await fetchDepositsFromSupabase();
    const deposit = allDeposits.find(d => d.id === id);
    if (!deposit) {
      return res.status(404).json({ error: 'Demande de dépôt non trouvée.' });
    }

    const oldStatus = deposit.status;
    deposit.status = status as 'en_attente' | 'valide' | 'rejete';
    deposit.adminNote = adminNote || deposit.adminNote;

    const allUsers = await fetchUsersFromSupabase(users);
    const user = allUsers.find(u => u.email.toLowerCase() === deposit.userEmail.toLowerCase());

    if (user) {
      if (status === 'valide' && oldStatus !== 'valide') {
        user.walletBalanceHTG += deposit.amountHTG;
        await syncUserToSupabase(user);
      } else if (oldStatus === 'valide' && status !== 'valide') {
        user.walletBalanceHTG = Math.max(0, user.walletBalanceHTG - deposit.amountHTG);
        await syncUserToSupabase(user);
      }
    }

    saveDataStore();
    await syncDepositToSupabase(deposit);

    res.json({ message: `Statut du dépôt mis à jour en '${status}'.`, deposit, userWalletBalance: user?.walletBalanceHTG });
  } catch (err: any) {
    console.error('Error in PUT /api/wallet/deposits/:id:', err);
    res.status(500).json({ error: err?.message || 'Erreur lors de la mise à jour du dépôt.' });
  }
});

app.post('/api/wallet/adjust', async (req, res) => {
  try {
    const { userEmail, amountHTG, type } = req.body || {};
    const allUsers = await fetchUsersFromSupabase(users);
    const user = allUsers.find(u => u.email.toLowerCase() === String(userEmail).toLowerCase().trim());

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    const amount = Number(amountHTG);
    if (type === 'deduct') {
      user.walletBalanceHTG = Math.max(0, user.walletBalanceHTG - amount);
    } else {
      user.walletBalanceHTG += amount;
    }

    saveDataStore();
    await syncUserToSupabase(user);

    res.json({
      message: `Ajustement du portefeuille effectué. Nouveau solde de ${user.name}: ${user.walletBalanceHTG} HTG.`,
      user
    });
  } catch (err: any) {
    console.error('Error in /api/wallet/adjust:', err);
    res.status(500).json({ error: err?.message || 'Erreur lors de l\'ajustement du solde.' });
  }
});

// Orders & Purchases API
app.post('/api/orders', async (req, res) => {
  try {
    const { userEmail, productId, gamePlayerId, paymentMethod, natcashTransactionId } = req.body || {};

    const allProducts = await fetchProductsFromSupabase();
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé.' });
    }

    const allUsers = await fetchUsersFromSupabase(users);
    const user = allUsers.find(u => u.email.toLowerCase() === String(userEmail).toLowerCase().trim());
    if (!user) {
      return res.status(400).json({ error: 'Veuillez vous connecter avant d\'effectuer une commande.' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ error: 'Vérification email obligatoire avant d\'acheter.' });
    }

    if (paymentMethod === 'wallet') {
      if (user.walletBalanceHTG < product.priceHTG) {
        return res.status(400).json({
          error: `Solde de portefeuille insuffisant (${user.walletBalanceHTG} HTG). Prix du produit: ${product.priceHTG} HTG. Veuillez recharger votre portefeuille via NATCASH.`
        });
      }

      user.walletBalanceHTG -= product.priceHTG;

      let pinDelivered: string | undefined = undefined;
      if (product.pinCodes && product.pinCodes.length > 0) {
        pinDelivered = product.pinCodes.shift();
        if (product.stock > 0) product.stock -= 1;
      }

      if (!pinDelivered) {
        const randDigits = Math.floor(10000000 + Math.random() * 90000000);
        const timeStamp = Date.now().toString().slice(-4);
        pinDelivered = `FF-PIN-${product.diamonds || 100}-${randDigits}${timeStamp}`;
      }

      const newOrder: Order = {
        id: `ord-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        productId: product.id,
        productName: product.name,
        priceHTG: product.priceHTG,
        gamePlayerId: String(gamePlayerId).trim(),
        paymentMethod: 'wallet',
        pinCodeDelivered: pinDelivered,
        status: 'reussi',
        createdAt: new Date().toISOString()
      };

      orders.unshift(newOrder);
      saveDataStore();
      await syncOrderToSupabase(newOrder);
      await syncUserToSupabase(user);
      await syncProductToSupabase(product);

      return res.status(201).json({
        message: 'Achat réussi ! Votre code PIN a été attribué avec succès.',
        order: newOrder,
        remainingWalletBalance: user.walletBalanceHTG
      });
    }

    if (paymentMethod === 'natcash_direct' || paymentMethod === 'moncash_direct') {
      if (!natcashTransactionId) {
        return res.status(400).json({ error: 'Code de transaction obligatoire.' });
      }

      const cleanedTxId = String(natcashTransactionId).replace(/\s+/g, '').trim();

      const allOrders = await fetchOrdersFromSupabase();
      const duplicateOrder = allOrders.find(o => o.natcashTransactionId === cleanedTxId);
      if (duplicateOrder) {
        return res.status(400).json({ error: `Ce code de transaction (${cleanedTxId}) a déjà été utilisé.` });
      }

      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        productId: product.id,
        productName: product.name,
        priceHTG: product.priceHTG,
        gamePlayerId: String(gamePlayerId).trim(),
        paymentMethod: paymentMethod,
        natcashTransactionId: cleanedTxId,
        status: 'en_attente',
        createdAt: new Date().toISOString()
      };

      orders.unshift(newOrder);
      saveDataStore();
      await syncOrderToSupabase(newOrder);

      const methodName = paymentMethod === 'moncash_direct' ? 'MonCash' : 'NATCASH';
      return res.status(201).json({
        message: `Commande enregistrée en attente de validation ${methodName}.`,
        order: newOrder
      });
    }

    res.status(400).json({ error: 'Méthode de paiement non supportée.' });
  } catch (err: any) {
    console.error('Error in POST /api/orders:', err);
    res.status(500).json({ error: err?.message || 'Erreur lors de la création de la commande.' });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const { email } = req.query;
    const ords = await fetchOrdersFromSupabase(email ? String(email) : undefined);
    res.json(ords);
  } catch (err: any) {
    console.error('Error in GET /api/orders:', err);
    res.json(orders);
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, pinCode } = req.body || {};

    const allOrders = await fetchOrdersFromSupabase();
    const order = allOrders.find(o => o.id === id);
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    order.status = status as 'reussi' | 'en_attente' | 'echoue';
    
    if (pinCode) {
      order.pinCodeDelivered = pinCode;
    } else if (status === 'reussi' && !order.pinCodeDelivered) {
      const allProducts = await fetchProductsFromSupabase();
      const product = allProducts.find(p => p.id === order.productId);
      let pinDelivered = undefined;
      if (product && product.pinCodes && product.pinCodes.length > 0) {
        pinDelivered = product.pinCodes.shift();
        await syncProductToSupabase(product);
      }
      if (!pinDelivered) {
        const randDigits = Math.floor(10000000 + Math.random() * 90000000);
        const timeStamp = Date.now().toString().slice(-4);
        pinDelivered = `FF-PIN-${product?.diamonds || 100}-${randDigits}${timeStamp}`;
      }
      order.pinCodeDelivered = pinDelivered;
    }

    saveDataStore();
    await syncOrderToSupabase(order);
    res.json({ message: `Statut de la commande mis à jour en '${status}'.`, order });
  } catch (err: any) {
    console.error('Error in PUT /api/orders/:id:', err);
    res.status(500).json({ error: err?.message || 'Erreur lors de la mise à jour de la commande.' });
  }
});

// Support Contact Tickets API
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body || {};
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Nom, Email, Sujet et Message sont obligatoires.' });
    }

    const newTicket: ContactTicket = {
      id: `tkt-${Date.now()}`,
      userName: String(name).trim(),
      userEmail: String(email).toLowerCase().trim(),
      userPhone: phone ? String(phone).trim() : undefined,
      subject: String(subject).trim(),
      message: String(message).trim(),
      status: 'nouveau',
      createdAt: new Date().toISOString()
    };

    tickets.unshift(newTicket);
    saveDataStore();
    await syncTicketToSupabase(newTicket);
    res.status(201).json({ message: 'Votre message a été envoyé à l\'équipe FRAYZEN SHOP.', ticket: newTicket });
  } catch (err: any) {
    console.error('Error in POST /api/contact:', err);
    res.status(500).json({ error: err?.message || 'Erreur lors de l\'envoi du message.' });
  }
});

app.get('/api/contact', async (req, res) => {
  try {
    const tkts = await fetchTicketsFromSupabase(tickets);
    res.json(tkts);
  } catch (err: any) {
    console.error('Error in GET /api/contact:', err);
    res.json(tickets);
  }
});

app.put('/api/contact/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const tkts = await fetchTicketsFromSupabase(tickets);
    const tkt = tkts.find(t => t.id === id);
    if (!tkt) return res.status(404).json({ error: 'Ticket introuvable.' });
    tkt.status = status;
    const memIdx = tickets.findIndex(t => t.id === id);
    if (memIdx !== -1) tickets[memIdx].status = status;
    saveDataStore();
    await syncTicketToSupabase(tkt);
    res.json(tkt);
  } catch (err: any) {
    console.error('Error in PUT /api/contact/:id:', err);
    res.status(500).json({ error: err?.message || 'Erreur lors de la mise à jour du ticket.' });
  }
});

app.delete('/api/contact/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const idx = tickets.findIndex(t => t.id === id);
    if (idx !== -1) tickets.splice(idx, 1);
    saveDataStore();
    res.json({ message: 'Ticket supprimé.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erreur lors de la suppression.' });
  }
});

// Admin Stats Dashboard API
app.get('/api/admin/stats', async (req, res) => {
  try {
    const allOrders = await fetchOrdersFromSupabase();
    const allUsers = await fetchUsersFromSupabase(users);
    const allDeposits = await fetchDepositsFromSupabase();
    const allTickets = await fetchTicketsFromSupabase(tickets);

    const successfulOrders = allOrders.filter(o => o.status === 'reussi');
    const totalAmountPurchasedHTG = successfulOrders.reduce((acc, o) => acc + o.priceHTG, 0);

    const packSalesMap: Record<string, { productName: string; count: number; totalHTG: number }> = {};
    successfulOrders.forEach(o => {
      const pName = o.productName || 'Pack Diamants';
      if (!packSalesMap[pName]) {
        packSalesMap[pName] = { productName: pName, count: 0, totalHTG: 0 };
      }
      packSalesMap[pName].count += 1;
      packSalesMap[pName].totalHTG += o.priceHTG;
    });

    const packSales = Object.values(packSalesMap).sort((a, b) => b.count - a.count);

    let topSellingProduct = 'Aucun pour l\'instant';
    if (packSales.length > 0) {
      topSellingProduct = `${packSales[0].productName} (${packSales[0].count} ventes)`;
    }

    const buyersMap: Record<string, { userName: string; email: string; totalAmountHTG: number; ordersCount: number; lastOrderDate?: string }> = {};
    successfulOrders.forEach(o => {
      if (!buyersMap[o.userEmail]) {
        buyersMap[o.userEmail] = { userName: o.userName, email: o.userEmail, totalAmountHTG: 0, ordersCount: 0, lastOrderDate: o.createdAt };
      }
      buyersMap[o.userEmail].totalAmountHTG += o.priceHTG;
      buyersMap[o.userEmail].ordersCount += 1;
      if (!buyersMap[o.userEmail].lastOrderDate || new Date(o.createdAt).getTime() > new Date(buyersMap[o.userEmail].lastOrderDate!).getTime()) {
        buyersMap[o.userEmail].lastOrderDate = o.createdAt;
      }
    });

    const topBuyers = Object.values(buyersMap)
      .sort((a, b) => b.totalAmountHTG - a.totalAmountHTG)
      .slice(0, 10);

    const pendingDepositsCount = allDeposits.filter(d => d.status === 'en_attente').length;
    const newTicketsCount = allTickets.filter(t => t.status === 'nouveau').length;

    const stats: AdminStats = {
      totalSalesCount: successfulOrders.length,
      totalUsersCount: allUsers.length,
      topSellingProduct,
      topBuyers,
      packSales,
      totalAmountPurchasedHTG,
      pendingDepositsCount,
      newTicketsCount
    };

    res.json(stats);
  } catch (err: any) {
    console.error('Error in /api/admin/stats:', err);
    res.status(500).json({ error: err?.message || 'Erreur lors de la récupération des statistiques.' });
  }
});

// Fallback for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Route API non trouvée: ${req.method} ${req.originalUrl || req.url}` });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled API Error:', err);
  res.status(500).json({ error: err?.message || 'Erreur interne du serveur.' });
});

// ------------------------------------
// VITE OR STATIC SERVER MIDDLEWARE
// ------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FRAYZEN SHOP Server running on http://0.0.0.0:${PORT}`);
  });
}

// Export express app for serverless environments (Vercel)
export default app;

if (!process.env.VERCEL) {
  startServer();
}
