import api from './api';

// --- Interfaces based on your backend ---

export interface WalletBalance {
  balance: number;
  currency: string;
}

export interface Transaction {
  id: number;
  amount: number;
  transaction_type: 'deposit' | 'transfer' | 'stokvel_contribution';
  status: 'completed' | 'pending' | 'failed';
  reference: string;
  description: string;
  created_at: string;
  completed_at?: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  pages: number;
  current_page: number;
}

export interface Card {
  id: number;
  card_number: string; // Masked, e.g., "**** **** **** 1234"
  card_holder: string;
  expiry_date: string;
  card_type: string;
  is_default: boolean;
}

export interface AddCardPayload {
  card_number: string;
  card_holder: string;
  expiry_date: string; // "MM/YY"
  cvv: string;
}

export interface DepositPayload {
    amount: number;
    card_id: number;
}

export interface TransferPayload {
    amount: number;
    recipient_email: string;
    description: string;
}


// --- API Service Functions ---

export const getWalletBalance = async (): Promise<WalletBalance> => {
  const { data } = await api.get('/wallet/balance');
  return data;
};

export const getTransactions = async (page = 1, per_page = 10): Promise<TransactionsResponse> => {
  const { data } = await api.get('/wallet/transactions', {
    params: { page, per_page },
  });
  return data;
};

export const getCards = async (): Promise<Card[]> => {
  const { data } = await api.get('/wallet/cards');
  return data;
};

export const addCard = async (cardData: AddCardPayload): Promise<{ message: string }> => {
  const { data } = await api.post('/wallet/cards', cardData);
  return data;
};

export const deleteCard = async (cardId: number): Promise<{ message: string }> => {
  const { data } = await api.delete(`/wallet/cards/${cardId}`);
  return data;
};

export const makeDeposit = async (depositData: DepositPayload): Promise<{ message: string, new_balance: number }> => {
    const { data } = await api.post('/wallet/deposit', depositData);
    return data;
};

export const makeTransfer = async (transferData: TransferPayload): Promise<{ message: string, new_balance: number }> => {
    const { data } = await api.post('/wallet/transfer', transferData);
    return data;
}; 