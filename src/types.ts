export type ProductCategory = 'free_fire' | 'passes' | 'mobile_legends' | 'cards';

export type AllowedPaymentMethod = 'wallet' | 'natcash' | 'moncash';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  priceHTG: number;
  diamonds?: number;
  bonusDiamonds?: number;
  image: string;
  description: string;
  stock: number;
  isPopular?: boolean;
  pinCodes?: string[];
  allowedPaymentMethods?: AllowedPaymentMethod[];
}

export type DepositStatus = 'en_attente' | 'valide' | 'rejete' | 'manque_preuve' | 'id_manquant';

export interface WalletDeposit {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  transactionId14: string; // 14-digit NATCASH transaction ID or MonCash Tx ID
  paymentMethod?: 'natcash' | 'moncash' | 'admin_manual';
  amountHTG: number;
  status: DepositStatus;
  createdAt: string;
  screenshotUrl?: string;
  adminNote?: string;
}

export type OrderStatus = 'reussi' | 'en_attente' | 'echoue';

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  productId: string;
  productName: string;
  priceHTG: number;
  gamePlayerId: string;
  paymentMethod: 'wallet' | 'natcash_direct' | 'moncash_direct';
  natcashTransactionId?: string;
  pinCodeDelivered?: string;
  status: OrderStatus;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  isEmailVerified: boolean;
  walletBalanceHTG: number;
  isAdmin?: boolean;
}

export interface ContactTicket {
  id: string;
  userId?: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  subject: string;
  message: string;
  status: 'nouveau' | 'en_cours' | 'resolu';
  createdAt: string;
}

export interface NatcashConfig {
  number: string;
  name: string;
  moncashNumber: string;
  moncashName: string;
  instructions: string;
  supportPhone: string;
  supportEmail: string;
  adminPin?: string;
}

export interface UserDetailedMetrics extends UserProfile {
  totalPurchasesCount: number;
  successfulPurchasesCount: number;
  failedPurchasesCount: number;
}

export interface PackSaleStat {
  productName: string;
  count: number;
  totalHTG: number;
}

export interface AdminStats {
  totalSalesCount: number;
  totalUsersCount: number;
  topSellingProduct: string;
  topBuyers: { userName: string; email: string; totalAmountHTG: number; ordersCount: number; lastOrderDate?: string }[];
  packSales?: PackSaleStat[];
  totalAmountPurchasedHTG: number;
  pendingDepositsCount: number;
  newTicketsCount: number;
}
