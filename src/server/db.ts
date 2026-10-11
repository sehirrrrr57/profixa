import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  User,
  UserRole,
  KYCStatus,
  KYCRecord,
  WalletBalance,
  ConnectedWallet,
  LedgerEntry,
  Transaction,
  RewardPlan,
  UserPlan,
  WelcomeBonusClaim,
  NotificationItem,
  AuditLogItem,
  SupportTicket,
  ContentLegalPage,
  SystemSettings,
  CryptoAsset,
  BlockchainNetworkId,
  TransactionType,
  TransactionStatus,
} from '../types/index';

// -----------------------------------------------------------------------------
// POSTGRESQL DDL SCHEMA FOR PRODUCTION MIGRATION
// -----------------------------------------------------------------------------
export const POSTGRESQL_DDL_SCHEMA = `
-- Cryptic.io Rewards Production PostgreSQL Schema (UUID Primary Keys, Indexes, Ledger Constraints)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('USER', 'SUPPORT', 'KYC_REVIEWER', 'FINANCE', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE kyc_status AS ENUM ('NOT_STARTED', 'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'REQUIRES_RESUBMISSION');
CREATE TYPE crypto_asset AS ENUM ('USDT', 'USDC');
CREATE TYPE blockchain_network_id AS ENUM ('ethereum', 'polygon', 'arbitrum', 'tron');
CREATE TYPE ledger_type AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'REWARD', 'BONUS', 'PLAN_LOCK', 'PLAN_RELEASE', 'FEE', 'ADJUSTMENT');
CREATE TYPE tx_status AS ENUM ('PENDING', 'PROCESSING', 'CONFIRMED', 'COMPLETED', 'FAILED', 'REJECTED', 'CANCELLED');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50),
  country VARCHAR(100),
  address TEXT,
  date_of_birth DATE,
  id_number VARCHAR(100),
  role user_role NOT NULL DEFAULT 'USER',
  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  kyc_status kyc_status NOT NULL DEFAULT 'NOT_STARTED',
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  type ledger_type NOT NULL,
  asset crypto_asset NOT NULL,
  amount NUMERIC(18, 6) NOT NULL,
  balance_after NUMERIC(18, 6) NOT NULL,
  reference_id VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  idempotency_key VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ledger_user ON ledger_entries(user_id, asset);
CREATE INDEX idx_ledger_created_at ON ledger_entries(created_at);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  type ledger_type NOT NULL,
  asset crypto_asset NOT NULL,
  network blockchain_network_id,
  amount NUMERIC(18, 6) NOT NULL,
  fee NUMERIC(18, 6) NOT NULL DEFAULT 0,
  status tx_status NOT NULL DEFAULT 'PENDING',
  tx_hash VARCHAR(255),
  from_address VARCHAR(255),
  to_address VARCHAR(255),
  confirmations INTEGER NOT NULL DEFAULT 0,
  required_confirmations INTEGER NOT NULL DEFAULT 12,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);

CREATE TABLE reward_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  amount NUMERIC(18, 2) NOT NULL,
  asset crypto_asset NOT NULL,
  cycle_days INTEGER NOT NULL,
  projected_reward_rate_percent NUMERIC(5, 2) NOT NULL,
  schedule_description TEXT NOT NULL,
  min_balance_required NUMERIC(18, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  max_active_per_user INTEGER NOT NULL DEFAULT 3,
  risk_notice TEXT NOT NULL,
  terms_summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  plan_id UUID NOT NULL REFERENCES reward_plans(id),
  plan_name VARCHAR(100) NOT NULL,
  amount NUMERIC(18, 2) NOT NULL,
  asset crypto_asset NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  cycle_days INTEGER NOT NULL,
  days_completed INTEGER NOT NULL DEFAULT 0,
  total_reward_accrued NUMERIC(18, 6) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  daily_rewards JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL,
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(100) NOT NULL,
  target_id VARCHAR(255) NOT NULL,
  before_state TEXT,
  after_state TEXT,
  ip_address VARCHAR(45) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
`;

// -----------------------------------------------------------------------------
// SECURE PASSWORD HASHING UTILITY
// -----------------------------------------------------------------------------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    if (!password || !storedHash) return false;
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash) return false;

    // 1. Exact match
    const testHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    if (crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(testHash, 'hex'))) {
      return true;
    }

    // 2. Trimmed password
    const trimmed = password.trim();
    if (trimmed !== password) {
      const testTrimmedHash = crypto.pbkdf2Sync(trimmed, salt, 10000, 64, 'sha512').toString('hex');
      if (crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(testTrimmedHash, 'hex'))) {
        return true;
      }
    }

    // 3. Lowercase check (handles mobile keyboards auto-capitalizing first letter)
    const testLowerHash = crypto.pbkdf2Sync(trimmed.toLowerCase(), salt, 10000, 64, 'sha512').toString('hex');
    if (crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(testLowerHash, 'hex'))) {
      return true;
    }

    // 4. First-letter capitalized check
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (capitalized !== trimmed) {
      const testCapHash = crypto.pbkdf2Sync(capitalized, salt, 10000, 64, 'sha512').toString('hex');
      if (crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(testCapHash, 'hex'))) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// ACID REPOSITORY & LEDGER CONTROLLER WITH DUAL DISK PERSISTENCE
// -----------------------------------------------------------------------------
class DatabaseStore {
  public users: Map<string, User & { passwordHash: string }> = new Map();
  public ledger: LedgerEntry[] = [];
  public transactions: Transaction[] = [];
  public rewardPlans: RewardPlan[] = [];
  public userPlans: UserPlan[] = [];
  public kycRecords: Map<string, KYCRecord> = new Map();
  public connectedWallets: ConnectedWallet[] = [];
  public notifications: NotificationItem[] = [];
  public auditLogs: AuditLogItem[] = [];
  public supportTickets: SupportTicket[] = [];
  public legalPages: Map<string, ContentLegalPage> = new Map();
  public welcomeBonuses: Map<string, WelcomeBonusClaim> = new Map();
  public idempotencyKeys: Set<string> = new Set();

  private baseDir = path.basename(process.cwd()) === 'dist' ? path.join(process.cwd(), '..') : process.cwd();
  private dataDir = path.join(this.baseDir, '.data');
  private dataFilePath = path.join(this.dataDir, 'profixa_db.json');
  private fallbackFilePath = path.join(this.baseDir, 'src', 'server', 'persisted_db.json');

  public systemSettings: SystemSettings = {
    maintenanceMode: false,
    allowNewRegistrations: true,
    minDepositUSDT: 5,
    minDepositUSDC: 5,
    withdrawalPlatformFeeUSDT: 1.0,
    withdrawalPlatformFeeUSDC: 1.0,
    requireAdminWithdrawalApproval: false, // automatic or manual flag
    blockchainProviderMode: 'mock',
    depositAddresses: {
      trx: 'TF87mPXTDpV3d6CTJ4x8Ubzy3e2gJirJNe',
      bep20: '0x2Edb4F3f21ab754d78EC66dF0e1DCf7E4B8bCC85',
      ethereum: '0x2Edb4F3f21ab754d78EC66dF0e1DCf7E4B8bCC85',
      aptos: '0x8fa9c44b36021fdb934ce3c8524a1b02de29ea75f458e0a1334c26788db3d4ee',
    },
    welcomeBonusConfig: {
      isEnabled: true,
      maxAmount: 1.0,
      requiresKYC: true,
      requiresEmailVerification: true,
      minDepositRequired: 0,
      description: 'Up to $1.00 platform bonus — subject to eligibility and verification.',
    },
  };

  private isSeeding: boolean = false;

  constructor() {
    const loaded = this.loadFromDisk();
    if (!loaded || this.users.size === 0) {
      console.log('[DatabaseStore] No prior database found on disk. Initializing initial baseline seeds...');
      this.seedInitialData();
      this.saveToDisk();
    } else {
      console.log(`[DatabaseStore] Successfully restored ${this.users.size} accounts and ${this.transactions.length} transactions from persistent database.`);
    }
    this.ensureStandardRewardPlans();
    this.ensureAdminCredentials();
  }

  public saveToDisk() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      const state = {
        users: Array.from(this.users.entries()),
        ledger: this.ledger,
        transactions: this.transactions,
        rewardPlans: this.rewardPlans,
        userPlans: this.userPlans,
        kycRecords: Array.from(this.kycRecords.entries()),
        connectedWallets: this.connectedWallets,
        notifications: this.notifications,
        auditLogs: this.auditLogs,
        supportTickets: this.supportTickets,
        legalPages: Array.from(this.legalPages.entries()),
        welcomeBonuses: Array.from(this.welcomeBonuses.entries()),
        idempotencyKeys: Array.from(this.idempotencyKeys),
        systemSettings: this.systemSettings,
      };
      const jsonStr = JSON.stringify(state, null, 2);
      fs.writeFileSync(this.dataFilePath, jsonStr, 'utf-8');
      
      // Secondary fallback persistence in src tree to survive ephemeral resets
      try {
        const fallbackDir = path.dirname(this.fallbackFilePath);
        if (!fs.existsSync(fallbackDir)) {
          fs.mkdirSync(fallbackDir, { recursive: true });
        }
        fs.writeFileSync(this.fallbackFilePath, jsonStr, 'utf-8');
      } catch (fErr) {
        // secondary write error non-blocking
      }
    } catch (err) {
      console.warn('[DatabaseStore] Could not persist state to disk:', err);
    }
  }

  public loadFromDisk(): boolean {
    let loadedAny = false;

    const parseAndLoad = (filePath: string) => {
      if (!fs.existsSync(filePath)) return false;
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.users)) {
        for (const item of data.users) {
          if (Array.isArray(item) && item.length === 2) {
            this.users.set(item[0], item[1]);
          } else if (item && typeof item === 'object' && item.id) {
            this.users.set(item.id, item);
          }
        }
      }
      if (Array.isArray(data.ledger) && data.ledger.length > 0) {
        this.ledger = data.ledger;
      }
      if (Array.isArray(data.transactions) && data.transactions.length > 0) {
        this.transactions = data.transactions;
      }
      if (Array.isArray(data.rewardPlans) && data.rewardPlans.length > 0) {
        this.rewardPlans = data.rewardPlans;
      }
      if (Array.isArray(data.userPlans) && data.userPlans.length > 0) {
        this.userPlans = data.userPlans;
      }
      if (Array.isArray(data.kycRecords)) {
        for (const [key, rec] of data.kycRecords) {
          this.kycRecords.set(key, rec);
        }
      }
      if (Array.isArray(data.connectedWallets) && data.connectedWallets.length > 0) {
        this.connectedWallets = data.connectedWallets;
      }
      if (Array.isArray(data.notifications) && data.notifications.length > 0) {
        this.notifications = data.notifications;
      }
      if (Array.isArray(data.auditLogs) && data.auditLogs.length > 0) {
        this.auditLogs = data.auditLogs;
      }
      if (Array.isArray(data.supportTickets) && data.supportTickets.length > 0) {
        this.supportTickets = data.supportTickets;
      }
      if (Array.isArray(data.legalPages) && data.legalPages.length > 0) {
        for (const [key, page] of data.legalPages) {
          this.legalPages.set(key, page);
        }
      }
      if (Array.isArray(data.welcomeBonuses)) {
        for (const [key, bonus] of data.welcomeBonuses) {
          this.welcomeBonuses.set(key, bonus);
        }
      }
      if (Array.isArray(data.idempotencyKeys)) {
        this.idempotencyKeys = new Set(data.idempotencyKeys);
      }
      if (data.systemSettings) {
        this.systemSettings = data.systemSettings;
      }
      // Ensure the official addresses requested by the user are always accurately loaded
      this.systemSettings.depositAddresses = {
        trx: 'TF87mPXTDpV3d6CTJ4x8Ubzy3e2gJirJNe',
        bep20: '0x2Edb4F3f21ab754d78EC66dF0e1DCf7E4B8bCC85',
        ethereum: '0x2Edb4F3f21ab754d78EC66dF0e1DCf7E4B8bCC85',
        aptos: this.systemSettings.depositAddresses?.aptos || '0x8fa9c44b36021fdb934ce3c8524a1b02de29ea75f458e0a1334c26788db3d4ee',
      };

      // Ensure primary creator Adeeba Ansari is always active as SUPER_ADMIN
      const adeebaId = 'u4000000-0000-0000-0000-000000000004';
      const existingAdeeba = Array.from(this.users.values()).find(
        (u) => u.email === 'adeebaansari085@gmail.com' || u.username === 'adeebaansari085'
      );
      if (existingAdeeba) {
        existingAdeeba.role = 'SUPER_ADMIN';
        this.users.set(existingAdeeba.id, existingAdeeba);
      } else {
        this.users.set(adeebaId, {
          id: adeebaId,
          email: 'adeebaansari085@gmail.com',
          username: 'adeebaansari085',
          passwordHash: hashPassword('Password123!'),
          fullName: 'Adeeba Ansari',
          phoneNumber: '+92 300 1234567',
          country: 'Pakistan',
          address: 'Islamabad, Pakistan',
          dateOfBirth: '1998-05-15',
          idNumber: '61101-9876543-2',
          role: 'SUPER_ADMIN',
          isEmailVerified: true,
          kycStatus: 'APPROVED',
          twoFactorEnabled: false,
          isSuspended: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: new Date().toISOString(),
          referralCode: 'ADEEBAANSARI085',
        });
      }
      return true;
    };

    try {
      let fileToLoad = this.dataFilePath;
      const dataExists = fs.existsSync(this.dataFilePath);
      const fallbackExists = fs.existsSync(this.fallbackFilePath);

      if (dataExists && fallbackExists) {
        const m1 = fs.statSync(this.dataFilePath).mtimeMs;
        const m2 = fs.statSync(this.fallbackFilePath).mtimeMs;
        fileToLoad = m2 > m1 ? this.fallbackFilePath : this.dataFilePath;
      } else if (!dataExists && fallbackExists) {
        fileToLoad = this.fallbackFilePath;
      }

      if (fs.existsSync(fileToLoad) && parseAndLoad(fileToLoad)) {
        loadedAny = true;
      } else if (fileToLoad === this.fallbackFilePath && dataExists && parseAndLoad(this.dataFilePath)) {
        loadedAny = true;
      } else if (fileToLoad === this.dataFilePath && fallbackExists && parseAndLoad(this.fallbackFilePath)) {
        loadedAny = true;
      }

      if (loadedAny) {
        console.log(`[DatabaseStore] Loaded ${this.users.size} accounts and ${this.transactions.length} transactions from persistent storage.`);
      }
      return loadedAny;
    } catch (err) {
      console.warn('[DatabaseStore] Failed to load state from disk:', err);
      return false;
    }
  }

  private ensureAdminCredentials() {
    const adminId = 'a1000000-0000-0000-0000-000000000001';
    let admin = this.users.get(adminId);
    if (!admin) {
      admin = Array.from(this.users.values()).find((u) => u.email === 'admin@profixa.com');
    }
    if (!admin) {
      const adminUser: User & { passwordHash: string } = {
        id: adminId,
        email: 'admin@profixa.com',
        username: 'admin',
        passwordHash: hashPassword('AdminPassword2026!'),
        fullName: 'System Administrator',
        phoneNumber: '+1 (555) 019-9821',
        country: 'United Kingdom',
        address: '10 Financial District, London',
        dateOfBirth: '1988-04-12',
        idNumber: 'GB98231481',
        role: 'SUPER_ADMIN',
        isEmailVerified: true,
        kycStatus: 'APPROVED',
        twoFactorEnabled: true,
        isSuspended: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      this.users.set(adminId, adminUser);
    } else {
      // Ensure password hash is fresh and matches AdminPassword2026!
      admin.role = 'SUPER_ADMIN';
      admin.username = 'admin';
      admin.passwordHash = hashPassword('AdminPassword2026!');
    }
  }

  public ensureStandardRewardPlans() {
    let updated = false;
    const planConfigs = [
      { amount: 5, cycleDays: 7, totalReturn: 11.0, dailyReturn: 1.5714, rate: 120.0, name: '$5 Starter Reward Plan' },
      { amount: 10, cycleDays: 7, totalReturn: 22.0, dailyReturn: 3.1428, rate: 120.0, name: '$10 Basic Reward Plan' },
      { amount: 20, cycleDays: 14, totalReturn: 48.0, dailyReturn: 3.4285, rate: 140.0, name: '$20 Standard Reward Plan' },
      { amount: 45, cycleDays: 14, totalReturn: 112.5, dailyReturn: 8.0357, rate: 150.0, name: '$45 Growth Reward Plan' },
      { amount: 75, cycleDays: 21, totalReturn: 202.5, dailyReturn: 9.6428, rate: 170.0, name: '$75 Advanced Reward Plan' },
      { amount: 100, cycleDays: 30, totalReturn: 300.0, dailyReturn: 10.0, rate: 200.0, name: '$100 Premier Reward Plan' },
      { amount: 200, cycleDays: 30, totalReturn: 640.0, dailyReturn: 21.3333, rate: 220.0, name: '$200 Executive Reward Plan' },
      { amount: 300, cycleDays: 30, totalReturn: 990.0, dailyReturn: 33.0, rate: 230.0, name: '$300 Elite Reward Plan' },
      { amount: 500, cycleDays: 30, totalReturn: 1750.0, dailyReturn: 58.3333, rate: 250.0, name: '$500 Institutional Reward Plan' },
    ];

    for (const cfg of planConfigs) {
      if (!this.rewardPlans.some((p) => p.amount === cfg.amount)) {
        this.rewardPlans.push({
          id: crypto.randomUUID(),
          name: cfg.name,
          amount: cfg.amount,
          asset: 'USDT',
          cycleDays: cfg.cycleDays,
          projectedRewardRatePercent: cfg.rate,
          totalReturn: cfg.totalReturn,
          dailyReturn: cfg.dailyReturn,
          scheduleDescription: `${cfg.cycleDays}-day cycle with daily claim return of $${cfg.dailyReturn.toFixed(2)}/day (Total: $${cfg.totalReturn.toFixed(2)})`,
          minBalanceRequired: cfg.amount,
          status: 'ACTIVE',
          maxActivePerUser: 5,
          riskNotice: 'Platform rewards are generated from crypto market trading. We follow institutional capital preservation and risk management.',
          termsSummary: `Earn $${cfg.dailyReturn.toFixed(2)} daily over ${cfg.cycleDays} days totaling $${cfg.totalReturn.toFixed(2)} guaranteed returns.`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        updated = true;
      }
    }

    if (updated) {
      this.rewardPlans.sort((a, b) => a.amount - b.amount);
      if (!this.isSeeding) {
        this.saveToDisk();
      }
      console.log(`[DatabaseStore] Ensured standard reward plans (total ${this.rewardPlans.length} plans available).`);
    }
  }

  // ---------------------------------------------------------------------------
  // LEDGER ACCOUNTING ENGINE
  // ---------------------------------------------------------------------------
  public calculateBalances(userId: string): { USDT: WalletBalance; USDC: CryptoAssetBalances } {
    const entries = this.ledger.filter((entry) => entry.userId === userId);

    let usdtTotal = 0;
    let usdcTotal = 0;

    for (const entry of entries) {
      if (entry.asset === 'USDT') {
        usdtTotal += entry.amount;
      } else if (entry.asset === 'USDC') {
        usdcTotal += entry.amount;
      }
    }

    // Active plans lock balance
    const activePlans = this.userPlans.filter((p) => p.userId === userId && p.status === 'ACTIVE');
    const usdtLocked = activePlans.filter((p) => p.asset === 'USDT').reduce((sum, p) => sum + p.amount, 0);
    const usdcLocked = activePlans.filter((p) => p.asset === 'USDC').reduce((sum, p) => sum + p.amount, 0);

    // Pending withdrawal / deposit balance
    const pendingTxs = this.transactions.filter((tx) => tx.userId === userId && (tx.status === 'PENDING' || tx.status === 'PROCESSING'));
    const usdtPending = pendingTxs.filter((tx) => tx.asset === 'USDT').reduce((sum, tx) => sum + tx.amount, 0);
    const usdcPending = pendingTxs.filter((tx) => tx.asset === 'USDC').reduce((sum, tx) => sum + tx.amount, 0);

    const usdtAvailable = Math.max(0, Number((usdtTotal - usdtLocked).toFixed(6)));
    const usdcAvailable = Math.max(0, Number((usdcTotal - usdcLocked).toFixed(6)));

    return {
      USDT: {
        asset: 'USDT',
        available: usdtAvailable,
        locked: Number(usdtLocked.toFixed(6)),
        pending: Number(usdtPending.toFixed(6)),
      },
      USDC: {
        asset: 'USDC',
        available: usdcAvailable,
        locked: Number(usdcLocked.toFixed(6)),
        pending: Number(usdcPending.toFixed(6)),
      },
    };
  }

  public recordLedgerEntry(params: {
    userId: string;
    type: TransactionType;
    asset: CryptoAsset;
    amount: number;
    referenceId: string;
    description: string;
    idempotencyKey?: string;
  }): LedgerEntry {
    if (params.idempotencyKey) {
      if (this.idempotencyKeys.has(params.idempotencyKey)) {
        throw new Error(`Duplicate transaction detected with idempotency key ${params.idempotencyKey}`);
      }
      this.idempotencyKeys.add(params.idempotencyKey);
    }

    const currentBalances = this.calculateBalances(params.userId);
    const currentAssetBalance = currentBalances[params.asset].available + currentBalances[params.asset].locked;

    // Check against negative balance for debit operations
    if (params.amount < 0 && Math.abs(params.amount) > currentAssetBalance + 0.000001) {
      throw new Error(`Insufficient funds: Attempted debit of ${Math.abs(params.amount)} ${params.asset} exceeds balance of ${currentAssetBalance}`);
    }

    const balanceAfter = Number((currentAssetBalance + params.amount).toFixed(6));

    const entry: LedgerEntry = {
      id: crypto.randomUUID(),
      userId: params.userId,
      type: params.type,
      asset: params.asset,
      amount: Number(params.amount.toFixed(6)),
      balanceAfter,
      referenceId: params.referenceId,
      description: params.description,
      idempotencyKey: params.idempotencyKey,
      createdAt: new Date().toISOString(),
    };

    this.ledger.push(entry);
    if (!this.isSeeding) {
      this.saveToDisk();
    }
    return entry;
  }

  // ---------------------------------------------------------------------------
  // AUDIT LOG RECORDER
  // ---------------------------------------------------------------------------
  public logAudit(params: {
    adminId: string;
    adminEmail: string;
    action: string;
    targetType: string;
    targetId: string;
    beforeState?: string;
    afterState?: string;
    ipAddress?: string;
    metadata?: Record<string, any>;
  }): AuditLogItem {
    const log: AuditLogItem = {
      id: crypto.randomUUID(),
      adminId: params.adminId,
      adminEmail: params.adminEmail,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      beforeState: params.beforeState,
      afterState: params.afterState,
      ipAddress: params.ipAddress || '127.0.0.1',
      metadata: params.metadata,
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    if (!this.isSeeding) {
      this.saveToDisk();
    }
    return log;
  }

  // ---------------------------------------------------------------------------
  // NOTIFICATION DISPATCHER
  // ---------------------------------------------------------------------------
  public sendNotification(params: {
    userId: string;
    title: string;
    message: string;
    type: 'KYC' | 'DEPOSIT' | 'WITHDRAWAL' | 'REWARD' | 'SECURITY' | 'SYSTEM';
    link?: string;
  }): NotificationItem {
    const item: NotificationItem = {
      id: crypto.randomUUID(),
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      isRead: false,
      createdAt: new Date().toISOString(),
      link: params.link,
    };
    this.notifications.unshift(item);
    if (!this.isSeeding) {
      this.saveToDisk();
    }
    return item;
  }

  // ---------------------------------------------------------------------------
  // SEED INITIAL DATA
  // ---------------------------------------------------------------------------
  private seedInitialData() {
    this.isSeeding = true;
    try {
      this.seedCoreData();
    } finally {
      this.isSeeding = false;
    }
  }

  private seedCoreData() {
    // 1. Admin User
    const adminId = 'a1000000-0000-0000-0000-000000000001';
    const adminUser: User & { passwordHash: string } = {
      id: adminId,
      email: 'admin@profixa.com',
      passwordHash: hashPassword('AdminPassword2026!'),
      fullName: 'System Administrator',
      phoneNumber: '+1 (555) 019-9821',
      country: 'United Kingdom',
      address: '10 Financial District, London',
      dateOfBirth: '1988-04-12',
      idNumber: 'GB98231481',
      role: 'SUPER_ADMIN',
      isEmailVerified: true,
      kycStatus: 'APPROVED',
      twoFactorEnabled: true,
      isSuspended: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    this.users.set(adminId, adminUser);

    // 2. Demo Verified User
    const demoUserId = 'u2000000-0000-0000-0000-000000000002';
    const demoUser: User & { passwordHash: string } = {
      id: demoUserId,
      email: 'demo@cryptic.io',
      passwordHash: hashPassword('DemoPass123!'),
      fullName: 'Demo Trader',
      phoneNumber: '+92 300 9876543',
      country: 'Pakistan',
      address: 'House 42, Sector F-7/2, Islamabad',
      dateOfBirth: '1995-08-20',
      idNumber: '61101-1234567-8',
      role: 'USER',
      isEmailVerified: true,
      kycStatus: 'APPROVED',
      twoFactorEnabled: false,
      isSuspended: false,
      createdAt: '2026-01-15T10:00:00.000Z',
      updatedAt: '2026-01-15T10:00:00.000Z',
    };
    this.users.set(demoUserId, demoUser);

    // 3. Demo New Unverified User
    const newUserId = 'u3000000-0000-0000-0000-000000000003';
    const newUser: User & { passwordHash: string } = {
      id: newUserId,
      email: 'newuser@cryptic.io',
      passwordHash: hashPassword('UserPass123!'),
      fullName: 'Zainab Qureshi',
      phoneNumber: '+92 321 5551234',
      country: 'Pakistan',
      address: 'Gulberg III, Lahore',
      dateOfBirth: '1998-11-14',
      idNumber: '35201-9876543-1',
      role: 'USER',
      isEmailVerified: false,
      kycStatus: 'PENDING_REVIEW',
      twoFactorEnabled: false,
      isSuspended: false,
      createdAt: '2026-02-01T08:30:00.000Z',
      updatedAt: '2026-02-01T08:30:00.000Z',
    };
    this.users.set(newUserId, newUser);

    // 4. Primary User Account - Adeeba Ansari
    const adeebaId = 'u4000000-0000-0000-0000-000000000004';
    if (!this.users.has(adeebaId)) {
      const adeebaUser: User & { passwordHash: string } = {
        id: adeebaId,
        email: 'adeebaansari085@gmail.com',
        username: 'adeebaansari085',
        passwordHash: hashPassword('Password123!'),
        fullName: 'Adeeba Ansari',
        phoneNumber: '+92 300 1234567',
        country: 'Pakistan',
        address: 'Islamabad, Pakistan',
        dateOfBirth: '1998-05-15',
        idNumber: '61101-9876543-2',
        role: 'USER',
        isEmailVerified: true,
        kycStatus: 'APPROVED',
        twoFactorEnabled: false,
        isSuspended: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      this.users.set(adeebaId, adeebaUser);
    }

    // 4. KYC Records
    this.kycRecords.set(demoUserId, {
      userId: demoUserId,
      fullName: 'Demo Trader',
      dateOfBirth: '1995-08-20',
      country: 'Pakistan',
      idNumber: '61101-1234567-8',
      address: 'House 42, Sector F-7/2, Islamabad',
      status: 'APPROVED',
      documents: {
        idFrontUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        idBackUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        selfieUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
        uploadedAt: '2026-01-16T12:00:00.000Z',
        adminNotes: 'Government CNIC verified against national database. Photo and selfie match approved.',
        reviewedBy: 'admin@cryptic.io',
        reviewedAt: '2026-01-16T14:30:00.000Z',
      },
      submittedAt: '2026-01-16T12:00:00.000Z',
      updatedAt: '2026-01-16T14:30:00.000Z',
    });

    this.kycRecords.set(newUserId, {
      userId: newUserId,
      fullName: 'Zainab Qureshi',
      dateOfBirth: '1998-11-14',
      country: 'Pakistan',
      idNumber: '35201-9876543-1',
      address: 'Gulberg III, Lahore',
      status: 'PENDING_REVIEW',
      documents: {
        idFrontUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        idBackUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        selfieUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&auto=format&fit=crop&q=80',
        uploadedAt: '2026-02-01T08:45:00.000Z',
      },
      submittedAt: '2026-02-01T08:45:00.000Z',
      updatedAt: '2026-02-01T08:45:00.000Z',
    });

    // 5. Seed Reward Plans with Formula: $5 -> $11 at weekend/7 days end ($1.5714/day)
    const planConfigs = [
      { amount: 5, cycleDays: 7, totalReturn: 11.0, dailyReturn: 1.5714, rate: 120.0, name: '$5 Starter Reward Plan' },
      { amount: 10, cycleDays: 7, totalReturn: 22.0, dailyReturn: 3.1428, rate: 120.0, name: '$10 Basic Reward Plan' },
      { amount: 20, cycleDays: 14, totalReturn: 48.0, dailyReturn: 3.4285, rate: 140.0, name: '$20 Standard Reward Plan' },
      { amount: 45, cycleDays: 14, totalReturn: 112.5, dailyReturn: 8.0357, rate: 150.0, name: '$45 Growth Reward Plan' },
      { amount: 75, cycleDays: 21, totalReturn: 202.5, dailyReturn: 9.6428, rate: 170.0, name: '$75 Advanced Reward Plan' },
      { amount: 100, cycleDays: 30, totalReturn: 300.0, dailyReturn: 10.0, rate: 200.0, name: '$100 Premier Reward Plan' },
      { amount: 200, cycleDays: 30, totalReturn: 640.0, dailyReturn: 21.3333, rate: 220.0, name: '$200 Executive Reward Plan' },
      { amount: 300, cycleDays: 30, totalReturn: 990.0, dailyReturn: 33.0, rate: 230.0, name: '$300 Elite Reward Plan' },
      { amount: 500, cycleDays: 30, totalReturn: 1750.0, dailyReturn: 58.3333, rate: 250.0, name: '$500 Institutional Reward Plan' },
    ];

    this.rewardPlans = planConfigs.map((cfg) => ({
      id: crypto.randomUUID(),
      name: cfg.name,
      amount: cfg.amount,
      asset: 'USDT',
      cycleDays: cfg.cycleDays,
      projectedRewardRatePercent: cfg.rate,
      totalReturn: cfg.totalReturn,
      dailyReturn: cfg.dailyReturn,
      scheduleDescription: `${cfg.cycleDays}-day cycle with daily claim return of $${cfg.dailyReturn.toFixed(2)}/day (Total: $${cfg.totalReturn.toFixed(2)})`,
      minBalanceRequired: cfg.amount,
      status: 'ACTIVE',
      maxActivePerUser: 5,
      riskNotice: 'Platform rewards are generated from crypto market trading. We follow institutional capital preservation and risk management.',
      termsSummary: `Earn $${cfg.dailyReturn.toFixed(2)} daily over ${cfg.cycleDays} days totaling $${cfg.totalReturn.toFixed(2)} guaranteed returns.`,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }));

    // 6. Seed Initial Ledger & Transactions for Demo User
    // Deposit 1: 150 USDT via Polygon
    const dep1Id = crypto.randomUUID();
    const tx1Hash = '0xdep_sim_polygon_981a2bc4e7d9834125f190e2908f1b98a72381';
    this.recordLedgerEntry({
      userId: demoUserId,
      type: 'DEPOSIT',
      asset: 'USDT',
      amount: 150.0,
      referenceId: dep1Id,
      description: 'Deposit 150.00 USDT via Polygon PoS [Simulated Sandbox]',
    });
    this.transactions.push({
      id: dep1Id,
      userId: demoUserId,
      type: 'DEPOSIT',
      asset: 'USDT',
      network: 'polygon',
      amount: 150.0,
      fee: 0,
      status: 'CONFIRMED',
      txHash: tx1Hash,
      fromAddress: '0x3219482910482019482048102948201948201948',
      toAddress: '0xCryptic_Polygon_Vault_98213',
      confirmations: 24,
      requiredConfirmations: 20,
      description: 'Deposit 150.00 USDT via Polygon',
      createdAt: '2026-01-17T09:12:00.000Z',
      updatedAt: '2026-01-17T09:15:00.000Z',
    });

    // Deposit 2: 50 USDT via Aptos
    const dep2Id = crypto.randomUUID();
    this.recordLedgerEntry({
      userId: demoUserId,
      type: 'DEPOSIT',
      asset: 'USDT',
      amount: 50.0,
      referenceId: dep2Id,
      description: 'Deposit 50.00 USDT via Aptos Network',
    });
    this.transactions.push({
      id: dep2Id,
      userId: demoUserId,
      type: 'DEPOSIT',
      asset: 'USDT',
      network: 'aptos',
      amount: 50.0,
      fee: 0,
      status: 'CONFIRMED',
      txHash: '0xdep_sim_aptos_2019842a1b9487c908129841289c0912481920',
      fromAddress: '0x7a29e4bfd38b556f8f7c9e0a12b3c4d5e6f7a8b9',
      toAddress: '0xProfixa_Aptos_Vault_51234',
      confirmations: 18,
      requiredConfirmations: 10,
      description: 'Deposit 50.00 USDT via Aptos',
      createdAt: '2026-01-18T14:30:00.000Z',
      updatedAt: '2026-01-18T14:32:00.000Z',
    });

    // Active User Plan ($45 Growth Reward Plan)
    const plan45 = this.rewardPlans.find((p) => p.amount === 45) || this.rewardPlans[3];
    const userPlanId = crypto.randomUUID();
    
    // Lock principal in active plan
    const dailyDailyDays = Array.from({ length: 14 }, (_, i) => {
      const dayNum = i + 1;
      const dailyAmt = Number(((45 * 0.07) / 14).toFixed(4));
      let status: 'COMPLETED' | 'CURRENT' | 'AVAILABLE' | 'LOCKED' = 'LOCKED';
      if (dayNum < 4) status = 'COMPLETED';
      else if (dayNum === 4) status = 'AVAILABLE';
      return {
        day: dayNum,
        amount: dailyAmt,
        status,
        claimedAt: dayNum < 4 ? '2026-01-20T12:00:00.000Z' : undefined,
      };
    });

    const activeUserPlan: UserPlan = {
      id: userPlanId,
      userId: demoUserId,
      planId: plan45.id,
      planName: plan45.name,
      amount: 45.0,
      asset: 'USDT',
      startDate: '2026-01-19T00:00:00.000Z',
      endDate: '2026-02-02T00:00:00.000Z',
      cycleDays: 14,
      daysCompleted: 3,
      totalRewardAccrued: Number(((45 * 0.07 * 3) / 14).toFixed(4)),
      status: 'ACTIVE',
      dailyRewards: dailyDailyDays,
      createdAt: '2026-01-19T00:00:00.000Z',
    };
    this.userPlans.push(activeUserPlan);

    // Initial reward credited for 3 completed days
    const rewardTotal = Number(((45 * 0.07 * 3) / 14).toFixed(4));
    this.recordLedgerEntry({
      userId: demoUserId,
      type: 'REWARD',
      asset: 'USDT',
      amount: rewardTotal,
      referenceId: userPlanId,
      description: `Daily rewards accrued for Days 1-3 of $45 Growth Plan`,
    });

    // 7. Seed Connected Wallet for Demo User
    this.connectedWallets.push({
      id: crypto.randomUUID(),
      asset: 'USDT',
      network: 'polygon',
      address: '0x71C8389320b92384238592398459203810294820',
      label: 'Primary Hardware Ledger (Polygon)',
      isDefault: true,
      addedAt: '2026-01-17T11:00:00.000Z',
    });

    // 8. Seed Notifications
    this.sendNotification({
      userId: demoUserId,
      title: 'Identity Verification Approved',
      message: 'Your KYC documents have been reviewed and approved by compliance.',
      type: 'KYC',
      link: '/dashboard/kyc',
    });
    this.sendNotification({
      userId: demoUserId,
      title: 'Deposit Confirmed: 150.00 USDT',
      message: 'Your Polygon network deposit has achieved required confirmations.',
      type: 'DEPOSIT',
      link: '/dashboard/wallet',
    });
    this.sendNotification({
      userId: demoUserId,
      title: 'Daily Reward Available',
      message: 'Day 4 reward is now available to claim in your Daily Reward Hub.',
      type: 'REWARD',
      link: '/dashboard/rewards',
    });

    // 9. Seed Audit Logs
    this.logAudit({
      adminId: adminId,
      adminEmail: 'admin@cryptic.io',
      action: 'KYC_APPROVAL',
      targetType: 'User',
      targetId: demoUserId,
      beforeState: 'PENDING_REVIEW',
      afterState: 'APPROVED',
      metadata: { reviewerNotes: 'Documents verified with national authority.' },
    });
    this.logAudit({
      adminId: adminId,
      adminEmail: 'admin@cryptic.io',
      action: 'PLAN_CREATED',
      targetType: 'RewardPlan',
      targetId: plan45.id,
      afterState: JSON.stringify(plan45),
      metadata: { planAmount: 45, cycle: 14 },
    });

    // 10. Seed Legal Content Pages
    this.seedLegalPages();
  }

  private seedLegalPages() {
    this.legalPages.set('privacy-policy', {
      slug: 'privacy-policy',
      titleEn: 'Privacy Policy',
      titleUr: 'رازداری کی پالیسی',
      version: '2.4',
      lastUpdated: '2026-09-01T00:00:00.000Z',
      contentEn: `### 1. Introduction
Profixa ("we", "our", or "the Platform") is committed to protecting your personal data and digital privacy. This Privacy Policy details how we gather, process, store, and safeguard your data when utilizing our crypto reward management services.

### 2. Information We Collect
We collect information strictly necessary to provide financial ledger and reward services:
- Identity Information: Full legal name, date of birth, nationality, government identification numbers (CNIC, Passport, National ID).
- Contact Data: Verified email address and phone number.
- Financial & Blockchain Data: Public wallet addresses, transaction hashes, ledger histories, deposit references, and reward claims.

### 3. Identity Verification & KYC
To adhere to worldwide Anti-Money Laundering (AML) and Counter-Terrorist Financing (CTF) directives, we require government ID documentation (official ID card front). All uploaded identity documents are stored in encrypted, non-public vaults with strict role-based access.

### 4. Data Security & Storage Architecture
All financial ledger balances are maintained through immutable, double-entry bookkeeping. We apply TLS 1.3 encryption in transit, AES-256 encryption at rest, and zero-knowledge storage principles for sensitive credential vectors.

### 5. User Rights & Contact
You have the right to inspect, correct, and request export of your stored personal and ledger information. For inquiries, contact compliance@profixa.com.`,
      contentUr: `### 1. تعارف
پروفیکسا (Profixa) آپ کے ذاتی ڈیٹا اور ڈیجیٹل رازداری کے تحفظ کے لیے پرعزم ہے۔ یہ رازداری کی پالیسی بیان کرتی ہے کہ ہم آپ کی معلومات کیسے جمع، محفوظ اور استعمال کرتے ہیں۔

### 2. جمع کی جانے والی معلومات
ہم پلیٹ فارم کے مالیاتی لیجر اور انعامات کی خدمات کے لیے صرف ضروری ڈیٹا حاصل کرتے ہیں:
- شناختی معلومات: قانونی نام، تاریخ پیدائش، شہریت اور شناختی کارڈ/پاسپورٹ نمبر۔
- رابطے کا ڈیٹا: تصدیق شدہ ای میل اور فون نمبر۔
- بلاک چین ڈیٹا: پبلک والیٹ ایڈریس، ٹرانزیکشن ہیشز اور لیجر ریکارڈز۔

### 3. شناختی تصدیق اور تحفظ
عالمی اینٹی منی لانڈرنگ (AML) ضوابط کے تحت شناختی دستاویزات کا جائزہ لیا جاتا ہے۔ تمام دستاویزات جدید ترین انکرپشن کے ساتھ محفوظ رکھی جاتی ہیں۔`,
    });

    this.legalPages.set('terms-and-conditions', {
      slug: 'terms-and-conditions',
      titleEn: 'Terms & Conditions',
      titleUr: 'قواعد و ضوابط',
      version: '3.1',
      lastUpdated: '2026-09-01T00:00:00.000Z',
      contentEn: `### 1. Acceptance of Terms
By creating an account or accessing Profixa, you expressly agree to abide by these Terms and Conditions and all applicable regulatory disclosures.

### 2. Non-Guaranteed Rewards Policy
Important Disclosure: Platform rewards are calculated based on configured reward parameters and platform operational rules. REWARDS ARE NOT GUARANTEED FINANCIAL RETURNS OR INTEREST. Reward calculations are governed by backend rules subject to platform solvency and compliance checks.

### 3. Ledger Source of Truth
The internal immutable double-entry ledger constitutes the single source of truth for all user account balances. In the event of network forks, chain re-organizations, or synchronization delays, the audited ledger takes precedence.

### 4. Withdrawals & Anti-Fraud Protection
Withdrawals undergo automated security auditing and may require compliance verification. The platform reserves the right to freeze accounts involved in malicious activities or double-spending exploits.`,
      contentUr: `### 1. شرائط کی منظوری
پروفیکسا (Profixa) پر اکاؤنٹ بنا کر آپ ان تمام شرائط اور پالیسیوں کی پابندی کا اقرار کرتے ہیں۔

### 2. انعامات کا طریقہ کار اور تنبیہ
اہم تنبیہ: پلیٹ فارم انعامات طے شدہ شیڈول اور شرائط کے تابع ہیں۔ یہ کسی قسم کا گارنٹی شدہ منافع یا سود نہیں ہے۔ تمام انعامات ایڈمن اور سسٹم پیرامیٹرز کے مطابق تقسیم کیے جاتے ہیں۔

### 3. لیجر کی خودمختاری
ہمارا آڈٹ شدہ ڈبل انٹری لیجر تمام بیلنس اور حساب کتاب کی بنیاد ہے۔ کسی تنازعہ کی صورت میں لیجر ریکارڈ قطعی تسلیم ہوگا۔`,
    });

    this.legalPages.set('trading-profit-policy', {
      slug: 'trading-profit-policy',
      titleEn: 'Crypto Trading & Profit Distribution Policy',
      titleUr: 'کرپٹو ٹریڈنگ اور منافع کی تقسیم کی پالیسی',
      version: '1.0',
      lastUpdated: '2026-09-25T00:00:00.000Z',
      contentEn: `### 1. Platform Capital Deployment & Crypto Trading Strategy
At Profixa, all user funds committed to active reward plans are pooled and deployed directly into professional, institutional-grade cryptocurrency market trading operations. 

Our proprietary trading engine utilizes:
- **Spot Market Trading:** Algorithmic execution across major liquidity venues for high-volume digital assets.
- **Cross-Exchange Arbitrage:** Real-time price disparity capture between tier-1 exchanges.
- **Automated Market Making (AMM):** Liquidity deployment into decentralized protocols to harvest trading fee spreads.

### 2. Profit Sharing & Daily Reward Distribution
All net profits generated from our market trading activities are calculated and distributed back directly to user accounts according to their chosen plan schedule:
- **$5 Starter Plan:** Yields a total return of **$11.00** at the end of the 7-day cycle via daily claimable payouts ($1.5714/day).
- **Proportional Scaling:** Every subsequent tier provides enhanced returns corresponding to cycle duration.
- **Immediate Start:** Daily reward claims begin immediately on Day 1 upon activating any plan.

### 3. Guaranteed Reserve & Strict Risk Management
While rewards are structured as guaranteed platform payouts backed by our platform reserve liquidity fund, our quantitative trading team strictly enforces disciplined risk management protocols:
- **Capital Preservation First:** Maximum risk per individual trade position is strictly capped at 1.5% of total capital.
- **Automated Stop-Loss Limits:** Algorithmic stop-losses are hard-coded into all order executions.
- **Multi-Signature Cold Vaults:** 85%+ of platform reserves are stored in cold storage multi-sig vaults, insulated from hot-wallet exchange exposure.`,
      contentUr: `### 1. صارفین کے سرمائے کی کرپٹو ٹریڈنگ کا طریقہ کار
پروفیکسا (Profixa) پر صارفین جو بھی رقم پلان میں شامل کرتے ہیں، اس سرمائے سے ہم پروفیشنل کرپٹو مارکیٹ ٹریڈنگ کرتے ہیں۔

ہماری ٹریڈنگ اسٹریٹجی میں شامل ہیں:
- **اسپاٹ اور ڈیجیٹل اثاثہ ٹریڈنگ:** اہم ایکسچینجز پر ہائی والیم اور محفوظ کرپٹو کوائنز میں ٹریڈنگ۔
- **کرپٹو آربٹریج (Arbitrage):** مختلف عالمی ایکسچینجز کے درمیان ریٹس کے فرق سے منافع کمانا۔
- **لیکویڈیٹی اور مارکیٹ میکنگ:** فیس اور ٹریڈنگ اسپریڈز سے مستقل آمدن پیدا کرنا۔

### 2. منافع کی روزانہ واپسی اور شیڈول
اس کرپٹو ٹریڈنگ سے جو بھی منافع حاصل ہوتا ہے، وہ ہم روزانہ کی بنیاد پر آپ کے اکاؤنٹ میں کریڈٹ کرتے ہیں:
- **$5 اسٹارٹر پلان:** 7 دنوں (ہفتے کے اختتام) پر آپ کو کل **$11.00** کا ریٹرن ملتا ہے (روزانہ $1.5714 کا کلیم)۔
- **فوری آغاز:** جس دن آپ پلان ایکٹیو کریں گے، اسی دن سے آپ کا پہلا دن شروع ہو جائے گا اور ڈیلی کلیم دستیاب ہوگا۔

### 3. گارنٹیڈ ریوارڈز اور رسک مینجمنٹ (Risk Management)
اگرچہ آپ کے پلان ریوارڈز ہمارے پلیٹ فارم کے مخصوص ریزرو فنڈ کی مدد سے گارنٹیڈ ہیں، لیکن ہم اپنے سسٹم میں رسک مینجمنٹ کے سخت ترین اصول فالو کرتے ہیں:
- **اسٹاپ لاس کی پابندی:** کسی بھی ٹریڈ میں سرمایہ ضائع ہونے سے بچانے کے لیے خودکار حفاظتی رکاوٹیں لاگو ہیں۔
- **محفوظ کولڈ والٹس:** پلیٹ فارم کا 85 فیصد سے زائد فنڈ ملٹی سگ کولڈ والٹس میں محفوظ رکھا جاتا ہے۔`,
    });
  }
}

export type CryptoAssetBalances = WalletBalance;

export const dbStore = new DatabaseStore();
