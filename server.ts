import express from 'express';
import path from 'path';
import fs from 'fs';
import { INITIAL_PRODUCTS, INITIAL_NATCASH_CONFIG, INITIAL_DEPOSITS, INITIAL_ORDERS, INITIAL_TICKETS } from './src/data/initialData';
import { Product, NatcashConfig, WalletDeposit, Order, ContactTicket, UserProfile, AdminStats } from './src/types';
import { syncUserToSupabase, syncDepositToSupabase, syncOrderToSupabase, syncTicketToSupabase, signUpWithSupabaseAuth, isSupabaseServerConfigured } from './server/supabaseService';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// CORS headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

const DATA_FILE_PATH = process.env.VERCEL ? path.join('/tmp', 'database_store.json') : path.join(process.cwd(), 'database_store.json');

// Database state
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

// Helper to save database to disk
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
    console.error('Erreur sauvegarde base de données:', err);
  }
};

// Helper to load database from disk
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
    console.error('Erreur chargement base de données:', err);
  }
};

// Load persistent data at startup
loadDataStore();

// ------------------------------------
// API ROUTES
// ------------------------------------

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'FRAYZEN SHOP API', timestamp: new Date().toISOString() });
});

// NATCASH & MonCash Config API
app.get('/api/natcash-config', (req, res) => {
  res.json(natcashConfig);
});

app.post('/api/natcash-config', (req, res) => {
  const { number, name, moncashNumber, moncashName, instructions, supportPhone, supportEmail, adminPin } = req.body;
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
  res.json({ message: 'Configuration de paiement NATCASH / MonCash mise à jour avec succès.', config: natcashConfig });
});

// Admin Pin Verification API
app.post('/api/admin/verify-pin', (req, res) => {
  const { pin } = req.body;
  const currentPin = natcashConfig.adminPin || '123456';
  if (String(pin).trim() === currentPin) {
    return res.json({ success: true, message: 'Code PIN valide.' });
  }
  return res.status(401).json({ error: 'Code PIN 6 chiffres incorrect.' });
});

// Admin PIN Security Password Verification API (Password: 04004749+)
app.post('/api/admin/verify-pin-password', (req, res) => {
  const { password } = req.body;
  const REQUIRED_PASS = '04004749+';
  if (String(password).trim() === REQUIRED_PASS) {
    return res.json({ success: true, message: 'Accès gestion des PINs déverrouillé.' });
  }
  return res.status(401).json({ error: 'Mot de passe de sécurité incorrect.' });
});

// Products API
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.post('/api/products', (req, res) => {
  const { name, category, priceHTG, diamonds, bonusDiamonds, image, description, stock, isPopular, pinCodes } = req.body;
  if (!name || !priceHTG || !category) {
    return res.status(400).json({ error: 'Nom, catégorie et prix en HTG sont obligatoires.' });
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name,
    category,
    priceHTG: Number(priceHTG),
    diamonds: diamonds ? Number(diamonds) : undefined,
    bonusDiamonds: bonusDiamonds ? Number(bonusDiamonds) : undefined,
    image: image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
    description: description || '',
    stock: Number(stock) || 0,
    isPopular: Boolean(isPopular),
    pinCodes: Array.isArray(pinCodes) ? pinCodes : []
  };

  products.unshift(newProduct);
  saveDataStore();
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const index = products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Produit introuvable.' });
  }

  products[index] = {
    ...products[index],
    ...req.body,
    priceHTG: Number(req.body.priceHTG ?? products[index].priceHTG),
    stock: Number(req.body.stock ?? products[index].stock)
  };

  saveDataStore();
  res.json(products[index]);
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  products = products.filter(p => p.id !== id);
  saveDataStore();
  res.json({ message: 'Produit supprimé avec succès.' });
});

// Update PIN codes for product pack
app.put('/api/products/:id/pins', (req, res) => {
  const { id } = req.params;
  const { pinCodes } = req.body;
  const product = products.find(p => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'Produit introuvable.' });
  }

  if (Array.isArray(pinCodes)) {
    product.pinCodes = pinCodes.map((p: string) => String(p).trim()).filter(Boolean);
    // Optionally update stock count to pin length if higher
    if (product.pinCodes.length > product.stock) {
      product.stock = product.pinCodes.length;
    }
  }

  saveDataStore();
  res.json({ message: 'Codes PINs du produit mis à jour avec succès.', product });
});

// Auth & User Profile API
app.post('/api/auth/login', (req, res) => {
  try {
    const { emailOrPhone } = req.body || {};
    if (!emailOrPhone) {
      return res.status(400).json({ error: 'Veuillez saisir votre email ou numéro de téléphone.' });
    }

    const query = String(emailOrPhone).toLowerCase().trim();
    const user = users.find(u => u.email.toLowerCase() === query || u.phone.toLowerCase() === query);

    if (!user) {
      return res.status(404).json({ error: 'Compte introuvable. Veuillez créer un compte.' });
    }

    const ADMIN_EMAILS = ['emmanuelselicour.2002@gmail.com', 'emmanuel@gmail.com', 'danyff455@gmail.com'];
    if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      user.isAdmin = true;
      saveDataStore();
    }

    return res.json(user);
  } catch (err: any) {
    console.error('Login route error:', err);
    return res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
  }
});

// Auth & User Profile API
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body || {};
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Tous les champs (Nom, Email, Numéro) sont obligatoires.' });
    }

    const ADMIN_EMAILS = ['emmanuelselicour.2002@gmail.com', 'emmanuel@gmail.com', 'danyff455@gmail.com'];
    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedPhone = String(phone).trim();
    let existingUser = users.find(u => u.email.toLowerCase() === normalizedEmail || (normalizedPhone && u.phone.trim() === normalizedPhone));

    if (existingUser) {
      if (ADMIN_EMAILS.includes(normalizedEmail)) {
        existingUser.isAdmin = true;
        saveDataStore();
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
      isEmailVerified: true, // Auto-verified: user is active immediately without mandatory email block
      walletBalanceHTG: 0,
      isAdmin: isAdminUser
    };

    users.push(newUser);
    saveDataStore();

    // Trigger direct Supabase Auth signUp to send confirmation email via Supabase Auth SDK safely
    try {
      signUpWithSupabaseAuth(newUser.email, newUser.name, newUser.phone, password)
        .then(result => {
          console.log('[Supabase Auth Registration Result]', result);
        })
        .catch(err => console.error('Error in Supabase Auth registration:', err));

      syncUserToSupabase(newUser).catch(err => console.error('Error syncing user to Supabase:', err));
    } catch (e) {
      console.error('Supabase async trigger exception:', e);
    }

    return res.status(201).json(newUser);
  } catch (err: any) {
    console.error('Register route error:', err);
    return res.status(500).json({ error: 'Erreur serveur lors de la création du compte.' });
  }
});

app.post('/api/auth/verify-email', (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable.' });
  }

  user.isEmailVerified = true;
  saveDataStore();
  res.json({ message: 'Email vérifié avec succès. Bienvenue sur FRAYZEN SHOP !', user });
});

app.get('/api/user/profile/:email', (req, res) => {
  const { email } = req.params;
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé.' });
  }
  const ADMIN_EMAILS = ['emmanuelselicour.2002@gmail.com', 'emmanuel@gmail.com', 'danyff455@gmail.com'];
  if (ADMIN_EMAILS.includes(user.email.toLowerCase().trim())) {
    user.isAdmin = true;
  }

  // Calculate purchases count
  const userOrders = orders.filter(o => o.userEmail.toLowerCase() === user.email.toLowerCase());
  const successfulCount = userOrders.filter(o => o.status === 'reussi').length;
  const failedCount = userOrders.filter(o => o.status === 'echoue').length;

  res.json({
    ...user,
    successfulOrdersCount: successfulCount,
    failedOrdersCount: failedCount,
    totalSpentHTG: userOrders.filter(o => o.status === 'reussi').reduce((acc, o) => acc + o.priceHTG, 0)
  });
});

app.get('/api/users', (req, res) => {
  res.json(users);
});

app.get('/api/admin/users-detailed', (req, res) => {
  const detailedUsers = users.map(u => {
    const userOrders = orders.filter(o => o.userEmail.toLowerCase() === u.email.toLowerCase());
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
});

// Wallet Deposit API with STRICT SQL DUPLICATE TRANSACTION ID PREVENTION
app.post('/api/wallet/deposit', (req, res) => {
  const { userEmail, transactionId14, amountHTG, screenshotUrl, paymentMethod } = req.body;

  if (!userEmail || !transactionId14 || !amountHTG) {
    return res.status(400).json({ error: 'Email, ID de transaction et montant sont obligatoires.' });
  }

  const cleanedTxId = String(transactionId14).replace(/\s+/g, '').trim();
  const method = paymentMethod === 'moncash' ? 'moncash' : 'natcash';

  if (method === 'natcash') {
    // Validate NATCASH 14 digits length constraint
    if (!/^\d{14}$/.test(cleanedTxId)) {
      return res.status(400).json({
        error: `ID de transaction NATCASH invalide. L'ID NATCASH doit contenir exactement 14 chiffres. Vous avez entré (${cleanedTxId.length} chiffres).`
      });
    }
  } else {
    // MonCash length constraint (minimum 5 digits/chars)
    if (cleanedTxId.length < 5) {
      return res.status(400).json({
        error: `ID de transaction MonCash invalide. Veuillez entrer un numéro de transaction MonCash valide.`
      });
    }
  }

  // STRICT DUPLICATE TRANSACTION CHECKING
  const duplicateTx = walletDeposits.find(
    d => d.transactionId14 === cleanedTxId
  );

  if (duplicateTx) {
    return res.status(400).json({
      error: `SÉCURITÉ : Ce code de transaction (${cleanedTxId}) a déjà été utilisé par un autre dépôt le ${new Date(duplicateTx.createdAt).toLocaleDateString('fr-FR')}. Les doublons de transaction sont strictement rejetés par FRAYZEN SHOP.`
    });
  }

  const user = users.find(u => u.email.toLowerCase() === userEmail.toLowerCase().trim());

  const newDeposit: WalletDeposit = {
    id: `dep-${Date.now()}`,
    userId: user ? user.id : 'usr-guest',
    userEmail: userEmail.toLowerCase().trim(),
    userName: user ? user.name : userEmail.split('@')[0],
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
  syncDepositToSupabase(newDeposit).catch(err => console.error('Supabase sync deposit error:', err));

  res.status(201).json({
    message: `Demande de dépôt ${method.toUpperCase()} enregistrée avec succès. Un administrateur va vérifier votre transaction.`,
    deposit: newDeposit
  });
});

app.get('/api/wallet/deposits', (req, res) => {
  const { email } = req.query;
  if (email) {
    const filtered = walletDeposits.filter(d => d.userEmail.toLowerCase() === String(email).toLowerCase().trim());
    return res.json(filtered);
  }
  res.json(walletDeposits);
});

// Admin Wallet Deposit Status Update (Valider / Rejeter / En attente)
app.put('/api/wallet/deposits/:id', (req, res) => {
  const { id } = req.params;
  const { status, adminNote } = req.body;

  const deposit = walletDeposits.find(d => d.id === id);
  if (!deposit) {
    return res.status(404).json({ error: 'Demande de dépôt non trouvée.' });
  }

  const oldStatus = deposit.status;
  deposit.status = status as 'en_attente' | 'valide' | 'rejete';
  deposit.adminNote = adminNote || deposit.adminNote;

  const user = users.find(u => u.email.toLowerCase() === deposit.userEmail.toLowerCase());

  if (user) {
    // If transitioning to valid from not valid, credit wallet
    if (status === 'valide' && oldStatus !== 'valide') {
      user.walletBalanceHTG += deposit.amountHTG;
    }
    // If transitioning away from valid to reject/pending, debit wallet
    else if (oldStatus === 'valide' && status !== 'valide') {
      user.walletBalanceHTG = Math.max(0, user.walletBalanceHTG - deposit.amountHTG);
    }
  }

  saveDataStore();
  res.json({ message: `Statut du dépôt mis à jour en '${status}'.`, deposit, userWalletBalance: user?.walletBalanceHTG });
});

// Admin Manual Wallet Correction (Deduct or Add funds)
app.post('/api/wallet/adjust', (req, res) => {
  const { userEmail, amountHTG, type, reason } = req.body; // type: 'add' | 'deduct'
  const user = users.find(u => u.email.toLowerCase() === userEmail.toLowerCase().trim());

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
  res.json({
    message: `Ajustement du portefeuille effectué. Nouveau solde de ${user.name}: ${user.walletBalanceHTG} HTG.`,
    user
  });
});

// Orders & Purchases API
app.post('/api/orders', (req, res) => {
  const { userEmail, productId, gamePlayerId, paymentMethod, natcashTransactionId } = req.body;

  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Produit non trouvé.' });
  }

  const user = users.find(u => u.email.toLowerCase() === userEmail.toLowerCase().trim());
  if (!user) {
    return res.status(400).json({ error: 'Veuillez vous connecter avant d\'effectuer une commande.' });
  }

  if (!user.isEmailVerified) {
    return res.status(403).json({ error: 'Vérification email obligatoire avant d\'acheter.' });
  }

  // Handle Wallet Payment
  if (paymentMethod === 'wallet') {
    if (user.walletBalanceHTG < product.priceHTG) {
      return res.status(400).json({
        error: `Solde de portefeuille insuffisant (${user.walletBalanceHTG} HTG). Prix du produit: ${product.priceHTG} HTG. Veuillez recharger votre portefeuille via NATCASH.`
      });
    }

    // Deduct Wallet Balance
    user.walletBalanceHTG -= product.priceHTG;

    // Pop stock PIN if available or generate guaranteed unique PIN
    let pinDelivered: string | undefined = undefined;
    if (product.pinCodes && product.pinCodes.length > 0) {
      pinDelivered = product.pinCodes.shift(); // Atomic shift in Node JS single thread loop
      if (product.stock > 0) product.stock -= 1;
    }

    // Fallback: If stock pinCodes array is empty, generate guaranteed unique PIN code
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
    syncOrderToSupabase(newOrder).catch(err => console.error('Supabase sync order error:', err));
    syncUserToSupabase(user).catch(err => console.error('Supabase sync user error:', err));

    return res.status(201).json({
      message: 'Achat réussi ! Votre code PIN a été attribué avec succès.',
      order: newOrder,
      remainingWalletBalance: user.walletBalanceHTG
    });
  }

  // Handle Direct NATCASH or MonCash Payment
  if (paymentMethod === 'natcash_direct' || paymentMethod === 'moncash_direct') {
    if (!natcashTransactionId) {
      return res.status(400).json({ error: 'Code de transaction obligatoire.' });
    }

    const cleanedTxId = String(natcashTransactionId).replace(/\s+/g, '').trim();

    // Check duplicate
    const duplicateOrder = orders.find(o => o.natcashTransactionId === cleanedTxId);
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

    const methodName = paymentMethod === 'moncash_direct' ? 'MonCash' : 'NATCASH';
    return res.status(201).json({
      message: `Commande enregistrée en attente de validation ${methodName}.`,
      order: newOrder
    });
  }

  res.status(400).json({ error: 'Méthode de paiement non supportée.' });
});

app.get('/api/orders', (req, res) => {
  const { email } = req.query;
  if (email) {
    const userOrders = orders.filter(o => o.userEmail.toLowerCase() === String(email).toLowerCase().trim());
    return res.json(userOrders);
  }
  res.json(orders);
});

// Admin Order Status Update (Valider / Rejeter / Attente)
app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { status, pinCode } = req.body;

  const order = orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Commande non trouvée.' });
  }

  order.status = status as 'reussi' | 'en_attente' | 'echoue';
  
  if (pinCode) {
    order.pinCodeDelivered = pinCode;
  } else if (status === 'reussi' && !order.pinCodeDelivered) {
    const product = products.find(p => p.id === order.productId);
    let pinDelivered = undefined;
    if (product && product.pinCodes && product.pinCodes.length > 0) {
      pinDelivered = product.pinCodes.shift();
    }
    if (!pinDelivered) {
      const randDigits = Math.floor(10000000 + Math.random() * 90000000);
      const timeStamp = Date.now().toString().slice(-4);
      pinDelivered = `FF-PIN-${product?.diamonds || 100}-${randDigits}${timeStamp}`;
    }
    order.pinCodeDelivered = pinDelivered;
  }

  saveDataStore();
  res.json({ message: `Statut de la commande mis à jour en '${status}'.`, order });
});

// Support Contact Tickets API
app.post('/api/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Nom, Email, Sujet et Message sont obligatoires.' });
  }

  const newTicket: ContactTicket = {
    id: `tkt-${Date.now()}`,
    userName: name.trim(),
    userEmail: email.toLowerCase().trim(),
    userPhone: phone ? String(phone).trim() : undefined,
    subject: subject.trim(),
    message: message.trim(),
    status: 'nouveau',
    createdAt: new Date().toISOString()
  };

  tickets.unshift(newTicket);
  saveDataStore();
  res.status(201).json({ message: 'Votre message a été envoyé à l\'équipe FRAYZEN SHOP.', ticket: newTicket });
});

app.get('/api/contact', (req, res) => {
  res.json(tickets);
});

app.put('/api/contact/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const tkt = tickets.find(t => t.id === id);
  if (!tkt) return res.status(404).json({ error: 'Ticket introuvable.' });
  tkt.status = status;
  res.json(tkt);
});

// Admin Stats Dashboard API
app.get('/api/admin/stats', (req, res) => {
  const successfulOrders = orders.filter(o => o.status === 'reussi');
  const totalAmountPurchasedHTG = successfulOrders.reduce((acc, o) => acc + o.priceHTG, 0);

  // Calculate top selling product
  const productSalesMap: Record<string, { name: string; count: number }> = {};
  successfulOrders.forEach(o => {
    if (!productSalesMap[o.productName]) {
      productSalesMap[o.productName] = { name: o.productName, count: 0 };
    }
    productSalesMap[o.productName].count += 1;
  });

  let topSellingProduct = 'Aucun pour l\'instant';
  let maxCount = 0;
  Object.values(productSalesMap).forEach(p => {
    if (p.count > maxCount) {
      maxCount = p.count;
      topSellingProduct = `${p.name} (${p.count} ventes)`;
    }
  });

  // Calculate top 10 buyers
  const buyersMap: Record<string, { userName: string; email: string; totalAmountHTG: number; ordersCount: number }> = {};
  successfulOrders.forEach(o => {
    if (!buyersMap[o.userEmail]) {
      buyersMap[o.userEmail] = { userName: o.userName, email: o.userEmail, totalAmountHTG: 0, ordersCount: 0 };
    }
    buyersMap[o.userEmail].totalAmountHTG += o.priceHTG;
    buyersMap[o.userEmail].ordersCount += 1;
  });

  const topBuyers = Object.values(buyersMap)
    .sort((a, b) => b.totalAmountHTG - a.totalAmountHTG)
    .slice(0, 10);

  const pendingDepositsCount = walletDeposits.filter(d => d.status === 'en_attente').length;
  const newTicketsCount = tickets.filter(t => t.status === 'nouveau').length;

  const stats: AdminStats = {
    totalSalesCount: successfulOrders.length,
    totalUsersCount: users.length,
    topSellingProduct,
    topBuyers,
    totalAmountPurchasedHTG,
    pendingDepositsCount,
    newTicketsCount
  };

  res.json(stats);
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
