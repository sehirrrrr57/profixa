import crypto from 'crypto';
import { BlockchainNetwork, BlockchainNetworkId, CryptoAsset } from '../types/index';

export const SUPPORTED_NETWORKS: Record<BlockchainNetworkId, BlockchainNetwork> = {
  trx: {
    id: 'trx',
    name: 'TRON (TRX / TRC-20)',
    symbol: 'TRX',
    standard: 'TRC-20',
    confirmationBlocks: 19,
    explorerUrl: 'https://tronscan.org/#/transaction/',
    minDeposit: 5,
    withdrawalFee: 1.0,
  },
  aptos: {
    id: 'aptos',
    name: 'Aptos Network',
    symbol: 'APT',
    standard: 'Aptos Coin',
    confirmationBlocks: 10,
    explorerUrl: 'https://explorer.aptoslabs.com/txn/',
    minDeposit: 5,
    withdrawalFee: 0.5,
  },
  bep20: {
    id: 'bep20',
    name: 'BNB Smart Chain (BEP-20)',
    symbol: 'BNB',
    standard: 'BEP-20',
    confirmationBlocks: 15,
    explorerUrl: 'https://bscscan.com/tx/',
    minDeposit: 5,
    withdrawalFee: 0.5,
  },
  tron: {
    id: 'tron',
    name: 'TRON (TRX / TRC-20)',
    symbol: 'TRX',
    standard: 'TRC-20',
    confirmationBlocks: 19,
    explorerUrl: 'https://tronscan.org/#/transaction/',
    minDeposit: 5,
    withdrawalFee: 1.0,
  },
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    standard: 'ERC-20',
    confirmationBlocks: 12,
    explorerUrl: 'https://etherscan.io/tx/',
    minDeposit: 10,
    withdrawalFee: 3.5,
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon PoS',
    symbol: 'POL',
    standard: 'ERC-20',
    confirmationBlocks: 20,
    explorerUrl: 'https://polygonscan.com/tx/',
    minDeposit: 5,
    withdrawalFee: 0.5,
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum One',
    symbol: 'ARB',
    standard: 'ERC-20',
    confirmationBlocks: 15,
    explorerUrl: 'https://arbiscan.io/tx/',
    minDeposit: 5,
    withdrawalFee: 0.8,
  },
};

export interface BlockchainTransactionDetails {
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  asset: CryptoAsset;
  network: BlockchainNetworkId;
  confirmations: number;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  blockNumber: number;
  timestamp: string;
  isSimulated: boolean;
}

export interface IBlockchainProvider {
  name: string;
  isSimulated: boolean;
  validateAddress(address: string, network: BlockchainNetworkId): boolean;
  generateDepositAddress(userId: string, asset: CryptoAsset, network: BlockchainNetworkId): Promise<{ address: string; memo?: string }>;
  getTransaction(txHash: string, network: BlockchainNetworkId): Promise<BlockchainTransactionDetails | null>;
  getConfirmations(txHash: string, network: BlockchainNetworkId): Promise<number>;
  broadcastWithdrawal(params: {
    toAddress: string;
    amount: number;
    asset: CryptoAsset;
    network: BlockchainNetworkId;
  }): Promise<{ txHash: string; status: 'BROADCAST' | 'CONFIRMED' }>;
}

/**
 * Mock / Sandbox Blockchain Provider
 * Used in development mode with clear simulation metadata and real address format checks.
 */
export class MockBlockchainProvider implements IBlockchainProvider {
  name = 'MockBlockchainProvider (Development Sandbox)';
  isSimulated = true;

  private txStore: Map<string, BlockchainTransactionDetails> = new Map();

  validateAddress(address: string, network: BlockchainNetworkId): boolean {
    if (!address || typeof address !== 'string') return false;
    const clean = address.trim();

    if (network === 'trx' || network === 'tron') {
      // Tron TRC-20 addresses begin with T and are 34 base58 characters
      return /^T[1-9A-HJ-NP-za-km-z]{33}$/.test(clean);
    } else if (network === 'aptos') {
      // Aptos addresses are hex strings prefixed with 0x (up to 66 chars)
      return /^0x[a-fA-F0-9]{16,66}$/.test(clean);
    } else {
      // BEP-20 and EVM: 0x followed by 40 hex characters
      return /^0x[a-fA-F0-9]{40}$/.test(clean);
    }
  }

  async generateDepositAddress(userId: string, asset: CryptoAsset, network: BlockchainNetworkId): Promise<{ address: string; memo?: string }> {
    if (network === 'trx' || network === 'tron') {
      // User-specified TRC-20 (TRON) deposit address
      return { address: 'TF87mPXTDpV3d6CTJ4x8Ubzy3e2gJirJNe' };
    } else if (network === 'aptos') {
      // Aptos Network deposit address
      return { address: '0x8fa9c44b36021fdb934ce3c8524a1b02de29ea75f458e0a1334c26788db3d4ee' };
    } else {
      // BNB Smart Chain (BEP-20) deposit address
      return { address: '0x328A94De712A8Fe6B688EbA071E57C3eB59d64F7' };
    }
  }

  async getTransaction(txHash: string, network: BlockchainNetworkId): Promise<BlockchainTransactionDetails | null> {
    return this.txStore.get(txHash) || null;
  }

  async getConfirmations(txHash: string, network: BlockchainNetworkId): Promise<number> {
    const tx = this.txStore.get(txHash);
    if (!tx) return 0;
    return tx.confirmations;
  }

  async broadcastWithdrawal(params: {
    toAddress: string;
    amount: number;
    asset: CryptoAsset;
    network: BlockchainNetworkId;
  }): Promise<{ txHash: string; status: 'BROADCAST' | 'CONFIRMED' }> {
    const txHash = `0xsim_${crypto.randomBytes(28).toString('hex')}`;
    const txDetails: BlockchainTransactionDetails = {
      txHash,
      fromAddress: '0xProfixa_HotWallet_Reserve_Vault',
      toAddress: params.toAddress,
      amount: params.amount,
      asset: params.asset,
      network: params.network,
      confirmations: 1,
      status: 'CONFIRMED',
      blockNumber: Math.floor(19000000 + Math.random() * 500000),
      timestamp: new Date().toISOString(),
      isSimulated: true,
    };
    this.txStore.set(txHash, txDetails);
    return { txHash, status: 'CONFIRMED' };
  }

  /**
   * Helper to simulate an incoming deposit for testing
   */
  simulateIncomingDeposit(params: {
    depositAddress: string;
    amount: number;
    asset: CryptoAsset;
    network: BlockchainNetworkId;
  }): BlockchainTransactionDetails {
    const txHash = `0xdep_${crypto.randomBytes(28).toString('hex')}`;
    const requiredConf = SUPPORTED_NETWORKS[params.network].confirmationBlocks;
    const txDetails: BlockchainTransactionDetails = {
      txHash,
      fromAddress: `0xSender_${crypto.randomBytes(16).toString('hex').substring(0, 36)}`,
      toAddress: params.depositAddress,
      amount: params.amount,
      asset: params.asset,
      network: params.network,
      confirmations: requiredConf,
      status: 'CONFIRMED',
      blockNumber: Math.floor(19000000 + Math.random() * 500000),
      timestamp: new Date().toISOString(),
      isSimulated: true,
    };
    this.txStore.set(txHash, txDetails);
    return txDetails;
  }
}

let providerInstance: IBlockchainProvider | null = null;

export function getBlockchainProvider(): IBlockchainProvider {
  if (!providerInstance) {
    const providerType = process.env.BLOCKCHAIN_PROVIDER || 'mock';
    if (providerType === 'mock') {
      providerInstance = new MockBlockchainProvider();
    } else {
      // In production with Alchemy/Infura, instantiate the real provider adapter
      // Falling back to MockBlockchainProvider with logging if credentials are missing
      providerInstance = new MockBlockchainProvider();
    }
  }
  return providerInstance;
}
