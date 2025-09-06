import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  name?: string;
  role?: string; // Add role property
  profile_picture?: string;
  is_verified?: boolean;
  two_factor_enabled?: boolean;
}

export interface UserStats {
  balance: number;
  currency: string;
  total_savings: number;
  monthly_goal: number;
  goal_progress: number;
}

export interface SavingsGoal {
  label: string;
  target: number;
  progress: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface Beneficiary {
  id: string;
  name: string;
  id_number: string;
  relationship: string;
  date_of_birth: string;
  phone: string;
  email: string;
  profile_pic_url?: string;
  id_doc_url?: string;
  address_doc_url?: string;
  relationship_doc_url?: string;
  status?: string; // Add status field for admin
  user_id?: string; // Add user_id field for admin
}

export interface BeneficiaryForm {
  name: string;
  id_number: string;
  relationship: string;
  date_of_birth: string;
  phone: string;
  email: string;
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  is_published: boolean;
  created_at: string;
  updated_at?: string;
}

export interface FAQForm {
  question: string;
  answer: string;
  category: string;
  is_published: boolean;
}

export interface AdminNotification {
  id: number;
  title: string;
  message: string;
  created_at: string;
}

export interface CustomerConcern {
  id: number;
  user_id?: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'closed';
  created_at: string;
}

export interface ConcernsResponse {
  total: number;
  page: number;
  limit: number;
  concerns: CustomerConcern[];
}

export interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
  mfa_enabled: boolean;
  is_locked: boolean;
  created_at: string;
  last_activity: string;
}

export interface AdminRole {
  id: number;
  name: string;
  description: string;
  permissions: any;
  is_system_role: boolean;
  created_at: string;
}

export interface AuditLog {
  id: number;
  admin_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: any;
  ip_address: string;
  created_at: string;
}

export interface MfaSetupData {
  secret: string;
  qr_url: string;
  backup_codes: string[];
}

export interface AdminForm {
  name: string;
  email: string;
  password: string;
  phone: string;
  role_id: string;
}

export interface EditAdminForm {
  name: string;
  email: string;
  phone: string;
  role_id: string;
}

export interface RoleForm {
  name: string;
  description: string;
  permissions: {
    users: { read: boolean; write: boolean; delete: boolean };
    groups: { read: boolean; write: boolean; delete: boolean };
    analytics: { read: boolean; export: boolean };
    approvals: { read: boolean; approve: boolean; reject: boolean };
    support: { read: boolean; respond: boolean };
    team: { read: boolean; write: boolean; delete: boolean };
    payouts: { read: boolean; approve: boolean; reject: boolean };
    audit: { read: boolean };
    settings: { read: boolean; write: boolean };
    financial: { read: boolean; write: boolean; approve: boolean };
    content: { read: boolean; write: boolean; delete: boolean };
    security: { read: boolean; write: boolean; configure: boolean };
  };
}

export interface PayoutRequest {
  id: number;
  amount: number;
  reason?: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  user_name: string;
  user_email: string;
  group_name: string;
  approvals_needed: number;
  approvals_received: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = error.error?.message || error.message;
    }
    return throwError(() => new Error(errorMessage));
  }

  // Auth endpoints
  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, data)
      .pipe(catchError(this.handleError));
  }

  signup(data: { full_name: string; email: string; phone_number: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, data)
      .pipe(catchError(this.handleError));
  }

  verifyEmail(data: { email: string; verification_code: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/verify-email`, data)
      .pipe(catchError(this.handleError));
  }

  resendEmailVerification(data: { email: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/resend-verification`, data)
      .pipe(catchError(this.handleError));
  }

  verifyPhone(data: { phone: string; verification_code: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/verify-phone`, data)
      .pipe(catchError(this.handleError));
  }

  resendEmailVerificationCode(data: { email: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/resend-email-verification`, data)
      .pipe(catchError(this.handleError));
  }

  resendSmsVerificationCode(data: { phone: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/resend-sms-verification`, data)
      .pipe(catchError(this.handleError));
  }

  requestPasswordReset(data: { email: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/forgot-password`, data)
      .pipe(catchError(this.handleError));
  }

  resetPassword(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/reset-password`, { email })
      .pipe(catchError(this.handleError));
  }

  // User endpoints
  getUserProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/user/profile`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Update profile
  updateUserProfile(data: {
    name?: string; phone?: string; date_of_birth?: string | null;
    gender?: string | null; employment_status?: string | null;
  }): Observable<any> {
    return this.http.put(`${this.baseUrl}/user/profile`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  changePassword(data: { current_password: string; new_password: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/user/security/password`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  start2FA(data: { method: 'email' | 'sms' }): Observable<any> {
    return this.http.post(`${this.baseUrl}/user/security/2fa/start`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  verify2FA(data: { otp_code: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/user/security/2fa/verify`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // 2FA login verification
  verify2FALogin(data: { user_id: string; otp_code: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/verify-2fa-login`, data)
      .pipe(catchError(this.handleError));
  }

  disable2FA(data: { password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/user/security/2fa/disable`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Sessions
  getSessions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user/sessions`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  logoutAllSessions(): Observable<any> {
    return this.http.post(`${this.baseUrl}/user/sessions/logout_all`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Communication settings
  getCommunicationSettings(): Observable<any> {
    return this.http.get(`${this.baseUrl}/user/communication`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateCommunicationSettings(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/user/communication`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Dashboard
  getUserStats(): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.baseUrl}/dashboard/stats`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getSavingsGoal(): Observable<SavingsGoal> {
    return this.http.get<SavingsGoal>(`${this.baseUrl}/user/savings-goal`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  setSavingsGoal(goal: SavingsGoal): Observable<any> {
    return this.http.post(`${this.baseUrl}/user/savings-goal`, goal, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Notifications
  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/user/notifications`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  markNotificationAsRead(notificationId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/user/notifications/${notificationId}/read`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Chat - Remove authentication headers since the endpoint doesn't require auth
  sendChatMessage(message: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/chat`, { message })
      .pipe(catchError(this.handleError));
  }

  // Wallet
  getWalletBalance(): Observable<any> {
    return this.http.get(`${this.baseUrl}/wallet/balance`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getWalletCards(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/wallet/cards`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  addWalletCard(data: { cardholder: string; cardNumber: string; expiry: string; cvv: string; primary?: boolean }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/wallet/cards`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }
  updateWalletCard(data: { id: number; cardholder: string; cardNumber: string; expiry: string; cvv: string; primary?: boolean }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/wallet/cards/${data.id}`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }
  deleteWalletCard(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/wallet/cards/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }
  getWalletTransactions(page: number, pageSize: number): Observable<{ transactions: any[]; pages: number }> {
    return this.http.get<{ transactions: any[]; pages: number }>(
      `${this.baseUrl}/wallet/transactions?page=${page}&page_size=${pageSize}`,
      { headers: this.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }
  makeDeposit(data: { amount: number; card_id: number }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/wallet/deposit`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  paystackInitializeDeposit(amount: number): Observable<{ authorization_url: string; reference: string; amount: number; currency: string }> {
    return this.http.post<{ authorization_url: string; reference: string; amount: number; currency: string }>(
      `${this.baseUrl}/wallet/deposit/paystack`,
      { amount },
      { headers: this.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }
  makeTransfer(data: { amount: number; recipient_account_number: string; description?: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/wallet/transfer`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }
  withdraw(data: { amount: number; bank_account_number: string; note?: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/wallet/withdraw`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Stokvel endpoints
  getAvailableGroups(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/groups/available`)
      .pipe(catchError(this.handleError));
  }

  getUserJoinRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user/join-requests`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  joinGroup(data: { category: string; tier: string; amount: number }): Observable<any> {
    return this.http.post(`${this.baseUrl}/stokvel/join-group`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getMyGroups(): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/my-groups`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Delete account
  deleteAccount(data: { password: string }): Observable<any> {
    return this.http.request('DELETE', `${this.baseUrl}/user/account`, {
      headers: this.getAuthHeaders(),
      body: data
    }).pipe(catchError(this.handleError));
  }

  // KYC
  getKycStatus(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/kyc/status`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }
  updateKycSection(data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/kyc/update`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }
  updateKycFormData(formData: FormData): Observable<any> {
    const headers = this.getAuthHeaders().delete('Content-Type'); // let browser set multipart boundary
    return this.http.patch<any>(`${this.baseUrl}/kyc/update`, formData, { headers })
      .pipe(catchError(this.handleError));
  }
  submitKyc(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/kyc/submit`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Beneficiaries
  getBeneficiaries(): Observable<Beneficiary[]> {
    return this.http.get<Beneficiary[]>(`${this.baseUrl}/beneficiaries`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }
  addBeneficiary(data: BeneficiaryForm): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.baseUrl}/beneficiaries`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }
  updateBeneficiary(id: string, data: BeneficiaryForm): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/beneficiaries/${id}`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }
  deleteBeneficiary(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/beneficiaries/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }
  uploadBeneficiaryDocument(beneficiaryId: string, formData: FormData): Observable<any> {
    const headers = this.getAuthHeaders().delete('Content-Type'); // let browser set multipart boundary
    return this.http.post<any>(`${this.baseUrl}/beneficiaries/${beneficiaryId}/documents`, formData, { headers })
      .pipe(catchError(this.handleError));
  }

  // Referral endpoints
  getUserReferralDetails(): Observable<any> {
    return this.http.get(`${this.baseUrl}/user/referral-details`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getUserReferrals(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user/referrals`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getRewardsCatalog(): Observable<any> {
    return this.http.get(`${this.baseUrl}/user/points/rewards`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  redeemPoints(reward: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/user/points/redeem`, { reward_key: reward.key }, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // --- i-Deals (My Offers)
  getMyOffers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/market/my-offers`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }
  saveMyOffer(data: { offer_id: number }): Observable<any> {
    return this.http.post(`${this.baseUrl}/market/my-offers`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }
  removeMyOffer(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/market/my-offers/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // --- Partner Portal (manage listings)
  listPartnerOffers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/partner/offers`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }
  createPartnerOffer(data: {
    title: string; description: string; provider?: string; tags?: string[];
    verified?: boolean; buttonText?: string; buttonLink?: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/partner/offers`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }
  updatePartnerOffer(id: number, data: {
    title: string; description: string; provider?: string; tags?: string[];
    verified?: boolean; buttonText?: string; buttonLink?: string;
  }): Observable<any> {
    return this.http.put(`${this.baseUrl}/partner/offers/${id}`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }
  deletePartnerOffer(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/partner/offers/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Marketplace
  getMarketplaceOffers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/market/offers`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getMarketTransactions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/market/transactions`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  marketPurchase(data: {
    item_type: 'airtime'|'data'|'electricity'|'voucher';
    provider: string;
    amount: number;
    payment_method: 'wallet'|'card';
    card_id?: string;
    phone_number?: string;
    meter_number?: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/market/purchase`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Add these methods to your ApiService class
  getGroup(groupId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/admin/groups/${groupId}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getGroupMembers(groupId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/admin/groups/${groupId}/members`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  contributeToGroup(groupId: number, payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/groups/${groupId}/contribute`, payload, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Add this method to your ApiService class
  getCards(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user/cards`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Profile picture upload
  uploadProfilePicture(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${localStorage.getItem('access_token')}` });
    return this.http.post(`${this.baseUrl}/user/profile-picture`, formData, { headers })
      .pipe(catchError(this.handleError));
  }

  // Admin API methods
  getAdminStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/stats`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getAdminTodo(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/todo`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getAdminActivity(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/activity`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getAdminAnnouncements(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/announcements`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Admin user management methods
  getAdminUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/users`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateUserStatus(userId: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/admin/users/${userId}/status`, { status }, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/admin/users/${userId}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Admin transaction management methods
  getAdminContributions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/contributions`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getAdminGroupNames(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/admin/group-names`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Admin stokvel management methods
  getAdminGroups(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/groups`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getAdminJoinRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/join-requests`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  approveJoinRequest(requestId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/join-requests/${requestId}/approve`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  rejectJoinRequest(requestId: number, data: { reason: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/join-requests/${requestId}/reject`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  createGroup(groupData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/groups`, groupData, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Admin analytics methods
  getAnalyticsOverview(filters: any = {}): Observable<any> {
    const params = new HttpParams().appendAll(filters);
    return this.http.get<any>(`${this.baseUrl}/admin/analytics/overview`, { 
      headers: this.getAuthHeaders(),
      params: params
    })
      .pipe(catchError(this.handleError));
  }

  // Admin KYC management methods
  getKYCSubmissions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/kyc/submissions`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  approveKYCSubmission(submissionId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/kyc/${submissionId}/approve`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  rejectKYCSubmission(submissionId: number, reason: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/kyc/${submissionId}/reject`, 
      { rejection_reason: reason }, 
      { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Admin beneficiary management methods
  getAdminBeneficiaries(): Observable<Beneficiary[]> {
    return this.http.get<Beneficiary[]>(`${this.baseUrl}/admin/beneficiaries`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  approveBeneficiary(beneficiaryId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/beneficiaries/${beneficiaryId}/approve`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  rejectBeneficiary(beneficiaryId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/beneficiaries/${beneficiaryId}/reject`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Admin FAQ management methods
  getAdminFAQs(search?: string, category?: string): Observable<FAQ[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (category) params = params.set('category', category);
    
    return this.http.get<FAQ[]>(`${this.baseUrl}/admin/faqs`, { 
      headers: this.getAuthHeaders(),
      params: params
    }).pipe(catchError(this.handleError));
  }

  createFAQ(faq: FAQForm): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/faqs`, faq, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateFAQ(id: number, faq: FAQForm): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/admin/faqs/${id}`, faq, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteFAQ(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/admin/faqs/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Admin notifications methods
  getAdminNotifications(): Observable<AdminNotification[]> {
    return this.http.get<AdminNotification[]>(`${this.baseUrl}/admin/notifications`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  markAllNotificationsAsRead(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/notifications/mark-all-read`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Admin concerns management methods
  getAdminConcerns(page: number = 1, limit: number = 20, status?: string, search?: string): Observable<ConcernsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (status) params = params.set('status', status);
    if (search) params = params.set('search', search);
    
    return this.http.get<ConcernsResponse>(`${this.baseUrl}/admin/concerns`, { 
      headers: this.getAuthHeaders(),
      params: params
    }).pipe(catchError(this.handleError));
  }

  updateConcernStatus(id: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/admin/concerns/${id}/status`, 
      { status }, 
      { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteConcern(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/admin/concerns/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Admin team management methods
  getAdminTeam(page: number = 1, limit: number = 20, search?: string, role?: string): Observable<{total: number; page: number; limit: number; admins: Admin[]}> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (search) params = params.set('search', search);
    if (role) params = params.set('role', role);
    
    return this.http.get<{total: number; page: number; limit: number; admins: Admin[]}>(`${this.baseUrl}/admin/team`, { 
      headers: this.getAuthHeaders(),
      params
    }).pipe(catchError(this.handleError));
  }

  createAdmin(adminData: AdminForm): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/team`, adminData, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateAdminRoleAssignment(adminId: number, adminData: EditAdminForm): Observable<any> {
    return this.http.put(`${this.baseUrl}/admin/team/${adminId}/role`, adminData, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getAdminRoles(): Observable<AdminRole[]> {
    return this.http.get<AdminRole[]>(`${this.baseUrl}/admin/roles`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  createAdminRole(roleData: RoleForm): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/roles`, roleData, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateRole(roleId: number, roleData: RoleForm): Observable<any> {
    return this.http.put(`${this.baseUrl}/admin/roles/${roleId}`, roleData, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteAdminRole(roleId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/admin/roles/${roleId}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getAuditLogs(page: number = 1, limit: number = 50, adminId?: number): Observable<{total: number; page: number; limit: number; logs: AuditLog[]}> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (adminId) params = params.set('admin_id', adminId.toString());
    
    return this.http.get<{total: number; page: number; limit: number; logs: AuditLog[]}>(`${this.baseUrl}/admin/audit-logs`, { 
      headers: this.getAuthHeaders(),
      params
    }).pipe(catchError(this.handleError));
  }

  setupMfa(): Observable<{data: MfaSetupData}> {
    return this.http.post<{data: MfaSetupData}>(`${this.baseUrl}/admin/mfa/setup`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  verifyMfa(tokenData: {token: string}): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/mfa/verify`, tokenData, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Admin payout management methods
  getPayoutRequests(): Observable<PayoutRequest[]> {
    return this.http.get<PayoutRequest[]>(`${this.baseUrl}/admin/withdrawals`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  approvePayoutRequest(id: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/withdrawals/${id}/approve`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  rejectPayoutRequest(id: number, reason: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/withdrawals/${id}/reject`, 
      { reason }, 
      { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  initializeDefaultRoles(): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/initialize-roles`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }
}

