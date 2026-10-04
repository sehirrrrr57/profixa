// Client API client for Cryptic.io Rewards

const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('cryptic_token');
  } catch {
    return null;
  }
};

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `HTTP error ${response.status}: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  register: (body: any) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => apiRequest('/auth/me'),
  verifyEmail: () => apiRequest('/auth/verify-email', { method: 'POST' }),
  forgotPassword: (email: string) => apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (body: { email: string; newPassword: string }) =>
    apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),

  // User & Profile
  getProfile: () => apiRequest('/user/profile'),
  updateProfile: (body: any) => apiRequest('/user/profile', { method: 'PATCH', body: JSON.stringify(body) }),
  changePassword: (body: any) => apiRequest('/user/change-password', { method: 'POST', body: JSON.stringify(body) }),
  toggle2FA: () => apiRequest('/user/toggle-2fa', { method: 'POST' }),
  getConnectedWallets: () => apiRequest('/user/connected-wallets'),
  addConnectedWallet: (body: any) => apiRequest('/user/connected-wallets', { method: 'POST', body: JSON.stringify(body) }),
  removeConnectedWallet: (id: string) => apiRequest(`/user/connected-wallets/${id}`, { method: 'DELETE' }),

  // KYC
  getKYCStatus: () => apiRequest('/kyc/status'),
  saveKYCPersonalInfo: (body: any) => apiRequest('/kyc/personal-info', { method: 'POST', body: JSON.stringify(body) }),
  uploadKYCDocument: (body: any) => apiRequest('/kyc/upload-document', { method: 'POST', body: JSON.stringify(body) }),
  submitKYC: () => apiRequest('/kyc/submit', { method: 'POST' }),

  // Plans & Rewards
  getPlans: () => apiRequest('/plans'),
  getUserPlans: () => apiRequest('/user/plans'),
  activatePlan: (id: string) => apiRequest(`/plans/${id}/activate`, { method: 'POST' }),
  advancePlanDay: (id: string) => apiRequest(`/plans/${id}/advance-day`, { method: 'POST' }),
  getRewardsHub: () => apiRequest('/rewards/hub'),
  claimReward: (planId?: string) =>
    apiRequest('/rewards/claim', { method: 'POST', body: JSON.stringify({ planId }) }),
  getBonusStatus: () => apiRequest('/rewards/bonus'),
  claimBonus: () => apiRequest('/rewards/bonus/claim', { method: 'POST' }),

  // Referrals
  getReferralSummary: () => apiRequest('/referrals/summary'),
  claimReferralBonus: () => apiRequest('/referrals/claim-bonus', { method: 'POST' }),

  // Wallet
  getBalances: () => apiRequest('/wallet/balances'),
  getDepositAddress: (asset: string, network: string) =>
    apiRequest('/wallet/deposit-address', { method: 'POST', body: JSON.stringify({ asset, network }) }),
  submitDeposit: (body: any) =>
    apiRequest('/wallet/submit-deposit', { method: 'POST', body: JSON.stringify(body) }),
  simulateDeposit: (body: any) => apiRequest('/wallet/simulate-deposit', { method: 'POST', body: JSON.stringify(body) }),
  withdraw: (body: any) => apiRequest('/wallet/withdraw', { method: 'POST', body: JSON.stringify(body) }),

  // Transactions
  getTransactions: (params?: { type?: string; asset?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest(`/transactions?${query}`);
  },

  // Notifications
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => apiRequest('/notifications/read-all', { method: 'POST' }),

  // Support
  getTickets: () => apiRequest('/support/tickets'),
  createTicket: (body: any) => apiRequest('/support/tickets', { method: 'POST', body: JSON.stringify(body) }),
  replyTicket: (id: string, content: string) =>
    apiRequest(`/support/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify({ content }) }),

  // Legal CMS
  getContentPage: (slug: string) => apiRequest(`/content/${slug}`),

  // Admin Console
  getAdminOverview: () => apiRequest('/admin/overview'),
  getAdminUsers: () => apiRequest('/admin/users'),
  toggleSuspendUser: (id: string, reason?: string) =>
    apiRequest(`/admin/users/${id}/toggle-suspend`, { method: 'POST', body: JSON.stringify({ reason }) }),
  manualAdjustment: (id: string, body: any) =>
    apiRequest(`/admin/users/${id}/manual-adjustment`, { method: 'POST', body: JSON.stringify(body) }),
  getAdminKYCQueue: () => apiRequest('/admin/kyc'),
  reviewKYC: (userId: string, decision: string, notes?: string) =>
    apiRequest(`/admin/kyc/${userId}/decision`, { method: 'POST', body: JSON.stringify({ decision, notes }) }),
  getAdminDeposits: () => apiRequest('/admin/deposits'),
  processDeposit: (id: string, decision: 'APPROVE' | 'REJECT') =>
    apiRequest(`/admin/deposits/${id}/decision`, { method: 'POST', body: JSON.stringify({ decision }) }),
  getAdminWithdrawals: () => apiRequest('/admin/withdrawals'),
  reviewWithdrawal: (id: string, decision: 'APPROVE' | 'REJECT') =>
    apiRequest(`/admin/withdrawals/${id}/decision`, { method: 'POST', body: JSON.stringify({ decision }) }),
  processWithdrawal: (id: string, decision: 'APPROVE' | 'REJECT') =>
    apiRequest(`/admin/withdrawals/${id}/decision`, { method: 'POST', body: JSON.stringify({ decision }) }),
  getAdminLedger: () => apiRequest('/admin/ledger'),
  getAdminAuditLogs: () => apiRequest('/admin/audit-logs'),
  getAdminSettings: () => apiRequest('/admin/settings'),
  updateAdminSettings: (body: any) => apiRequest('/admin/settings', { method: 'PATCH', body: JSON.stringify(body) }),
  updateContentPage: (slug: string, body: any) =>
    apiRequest(`/admin/content/${slug}`, { method: 'PATCH', body: JSON.stringify(body) }),
};
