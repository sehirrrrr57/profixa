// Core domain types for Cryptic.io Rewards

export type UserRole = 'USER' | 'SUPPORT' | 'KYC_REVIEWER' | 'FINANCE' | 'ADMIN' | 'SUPER_ADMIN';

export type KYCStatus = 'NOT_STARTED' | 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'REQUIRES_RESUBMISSION';

export type CryptoAsset = 'USDT' | 'USDC';

export type BlockchainNetworkId = 'trx' | 'aptos' | 'bep20' | 'tron' | 'ethereum' | 'polygon' | 'arbitrum';

export interface BlockchainNetwork {
  id: BlockchainNetworkId;
  name: string;
  symbol: string;
  standard: string; // ERC20, TRC20, etc.
  confirmationBlocks: number;
  explorerUrl: string;
  minDeposit: number;
  withdrawalFee: number;
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'REWARD' | 'PLAN_LOCK' | 'PLAN_RELEASE' | 'BONUS' | 'FEE' | 'ADJUSTMENT';

export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'CONFIRMED' | 'COMPLETED' | 'FAILED' | 'REJECTED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  phoneNumber?: string;
  country?: string;
  address?: string;
  dateOfBirth?: string;
  idNumber?: string;
  role: UserRole;
  isEmailVerified: boolean;
  kycStatus: KYCStatus;
  twoFactorEnabled: boolean;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
  referralCode?: string;
  referredBy?: string;
  balance?: number;
  totalDeposited?: number;
  hasDeposited?: boolean;
  referredByName?: string;
}

export interface ReferredUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  joinedAt: string;
  hasActivePlan: boolean;
  activePlanName?: string;
  planAmount?: number;
  kycStatus: KYCStatus;
  bonusEarned: number;
  status: 'ACTIVE' | 'PENDING' | 'QUALIFIED';
  tierLevel: number;
  hasDeposited?: boolean;
  totalDeposited?: number;
  depositStatus?: string;
}

export interface ReferralTier {
  name: string;
  minReferrals: number;
  commissionRate: number; // e.g. 5, 7.5, 10%
  perks: string[];
}

export interface ReferralSummary {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  activeReferrals: number;
  totalBonusEarned: number;
  pendingBonus: number;
  commissionRate: number;
  currentTier: string;
  nextTierRequirement: number;
  tierStructure: ReferralTier[];
  referredUsers: ReferredUser[];
}

export interface KYCDocuments {
  idFrontUrl?: string;
  idBackUrl?: string;
  selfieUrl?: string;
  uploadedAt?: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface KYCRecord {
  userId: string;
  fullName: string;
  dateOfBirth: string;
  country: string;
  idNumber: string;
  address: string;
  status: KYCStatus;
  documents: KYCDocuments;
  submittedAt?: string;
  updatedAt: string;
}

export interface WalletBalance {
  asset: CryptoAsset;
  available: number;
  locked: number;
  pending: number;
}

export interface ConnectedWallet {
  id: string;
  asset: CryptoAsset;
  network: BlockchainNetworkId;
  address: string;
  label: string;
  isDefault: boolean;
  addedAt: string;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  type: TransactionType;
  asset: CryptoAsset;
  amount: number; // positive for credit, negative for debit
  balanceAfter: number;
  referenceId: string; // references depositId, withdrawalId, userPlanId, etc.
  description: string;
  idempotencyKey?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  asset: CryptoAsset;
  network?: BlockchainNetworkId;
  amount: number;
  fee: number;
  status: TransactionStatus;
  txHash?: string;
  fromAddress?: string;
  toAddress?: string;
  destinationAddress?: string;
  confirmations?: number;
  requiredConfirmations?: number;
  description: string;
  proofImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RewardPlan {
  id: string;
  name: string;
  amount: number;
  asset: CryptoAsset;
  cycleDays: number;
  projectedRewardRatePercent: number; // e.g. 120% profit, 220% total return
  totalReturn: number; // e.g. 11 for $5 plan
  dailyReturn: number; // e.g. 1.5714 for $5 plan
  scheduleDescription: string; // e.g. "Daily reward schedule"
  minBalanceRequired: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  maxActivePerUser: number;
  riskNotice: string;
  termsSummary: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPlan {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  amount: number;
  asset: CryptoAsset;
  startDate: string;
  endDate: string;
  cycleDays: number;
  daysCompleted: number;
  totalRewardAccrued: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  dailyRewards: {
    day: number;
    amount: number;
    status: 'COMPLETED' | 'CURRENT' | 'AVAILABLE' | 'LOCKED' | 'MISSED';
    claimedAt?: string;
  }[];
  createdAt: string;
}

export interface WelcomeBonusConfig {
  isEnabled: boolean;
  maxAmount: number;
  requiresKYC: boolean;
  requiresEmailVerification: boolean;
  minDepositRequired: number;
  description: string;
}

export interface WelcomeBonusClaim {
  id: string;
  userId: string;
  amount: number;
  asset: CryptoAsset;
  status: 'ELIGIBLE' | 'CLAIMED' | 'EXPIRED' | 'LOCKED';
  claimedAt?: string;
  withdrawable?: boolean;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'KYC' | 'DEPOSIT' | 'WITHDRAWAL' | 'REWARD' | 'SECURITY' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface AuditLogItem {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  beforeState?: string;
  afterState?: string;
  ipAddress: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  category: 'ACCOUNT' | 'KYC' | 'DEPOSIT' | 'WITHDRAWAL' | 'REWARDS' | 'TECHNICAL' | 'OTHER';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED';
  messages: {
    id: string;
    sender: 'USER' | 'SUPPORT';
    senderName: string;
    content: string;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface ContentLegalPage {
  slug:
    | 'privacy-policy'
    | 'terms-and-conditions'
    | 'risk-disclosure'
    | 'reward-terms'
    | 'wallet-terms'
    | 'kyc-aml-policy'
    | 'trading-profit-policy';
  titleEn: string;
  titleUr: string;
  contentEn: string;
  contentUr: string;
  version: string;
  lastUpdated: string;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  minDepositUSDT: number;
  minDepositUSDC: number;
  withdrawalPlatformFeeUSDT: number;
  withdrawalPlatformFeeUSDC: number;
  requireAdminWithdrawalApproval: boolean;
  blockchainProviderMode: 'mock' | 'alchemy' | 'infura' | 'quicknode';
  depositAddresses: {
    trx: string;
    bep20: string;
    ethereum: string;
    aptos?: string;
  };
  welcomeBonusConfig: WelcomeBonusConfig;
}
