import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api';

type Tab = 'overview' | 'your-details' | 'account-security' | 'communication' | 'privacy';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.scss'],
  imports: [CommonModule, FormsModule]
})
export class UserProfile implements OnInit {
  activeTab = signal<Tab>('overview');

  // Profile state
  userEmail = '';
  currentRegistrationDate = new Date().toISOString().slice(0, 10);
  userDetails = {
    name: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    employmentStatus: '',
  };

  // Security
  securitySettings = {
    twoFactorEnabled: false,
    currentPassword: '',
    newPassword: '',
  };

  // Communication
  communicationSettings = {
    emailAnnouncements: true,
    emailStokvelUpdates: true,
    emailMarketplaceOffers: false,
    pushAnnouncements: true,
    pushStokvelUpdates: true,
    pushMarketplaceOffers: false,
  };

  // Privacy (local-only for now)
  privacySettings = {
    dataForPersonalization: true,
    dataForAnalytics: true,
    dataForThirdParties: false,
  };

  // 2FA modal
  show2FAModal = false;
  twoFAMethod: 'email' | 'sms' = 'email';
  otp = '';
  otpSentMessage = '';
  isSendingOtp = false;
  isVerifying = false;

  // Disable 2FA modal
  showDisable2FAModal = false;
  disable2FAPassword = '';
  isDisabling2FA = false;

  // Delete account modal
  showDeleteModal = false;
  deletePassword = '';
  isDeleting = false;

  // Sessions
  sessions: any[] = [];

  // Simple message area
  infoMsg = '';
  errorMsg = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.fetchProfile();
    this.fetchSessions();
  }

  setTab(tab: Tab) {
    this.activeTab.set(tab);
    if (tab === 'communication') this.fetchCommunicationSettings();
  }

  // Data loaders
  async fetchProfile(preserveMessages = false) {
    if (!preserveMessages) this.clearMessages();
    try {
      const prof = await this.api.getUserProfile().toPromise();
      this.userEmail = prof?.email || '';
      this.userDetails = {
        name: prof?.full_name || prof?.name || '',
        phone: prof?.phone_number || prof?.phone || '',
        dateOfBirth: prof?.date_of_birth ? new Date(prof.date_of_birth).toISOString().slice(0, 10) : '',
        gender: prof?.gender || '',
        employmentStatus: prof?.employment_status || '',
      };
      this.securitySettings.twoFactorEnabled = !!prof?.two_factor_enabled;
    } catch (e: any) {
      this.errorMsg = e?.message || 'Could not load your profile.';
    }
  }

  async fetchSessions() {
    this.clearMessages();
    try {
      const data = await this.api.getSessions?.().toPromise();
      this.sessions = Array.isArray(data) ? data : [];
    } catch {
      // ignore silently if backend not ready
    }
  }

  getUniqueSessions(list: any[]) {
    const seen = new Set<string>();
    return list.filter((s: any) => {
      const key = `${s.user_agent}-${s.ip_address}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  topActiveUniqueSessions() {
    return this.getUniqueSessions(this.sessions).filter((s: any) => s.is_active).slice(0, 2);
  }

  // Details save
  async saveDetails() {
    this.clearMessages();
    try {
      await this.api.updateUserProfile?.({
        name: this.userDetails.name,
        phone: this.userDetails.phone,
        date_of_birth: this.userDetails.dateOfBirth || null,
        gender: this.userDetails.gender || null,
        employment_status: this.userDetails.employmentStatus || null,
      }).toPromise();
      await new Promise(res => setTimeout(res, 1000));
      this.infoMsg = 'Profile updated successfully!';
      await this.fetchProfile(true);
    } catch (e: any) {
      this.errorMsg = e?.message || 'Failed to update profile.';
    }
  }

  // Password change
  async changePassword() {
    this.clearMessages();
    const { currentPassword, newPassword } = this.securitySettings;
    if (!currentPassword || !newPassword) {
      this.errorMsg = 'Please enter both current and new password.';
      return;
    }
    try {
      await this.api.changePassword?.({
        current_password: currentPassword,
        new_password: newPassword
      }).toPromise();
      await new Promise(res => setTimeout(res, 1000));
      this.infoMsg = 'Password changed successfully!';
      this.securitySettings.currentPassword = '';
      this.securitySettings.newPassword = '';
    } catch (e: any) {
      this.errorMsg = e?.message || 'Failed to change password.';
    }
  }

  // Communication
  async fetchCommunicationSettings() {
    this.clearMessages();
    try {
      const data = await this.api.getCommunicationSettings?.().toPromise();
      if (data) {
        this.communicationSettings = {
          emailAnnouncements: !!data.email_announcements,
          emailStokvelUpdates: !!data.email_stokvel_updates,
          emailMarketplaceOffers: !!data.email_marketplace_offers,
          pushAnnouncements: !!data.push_announcements,
          pushStokvelUpdates: !!data.push_stokvel_updates,
          pushMarketplaceOffers: !!data.push_marketplace_offers,
        };
      }
    } catch {
      // ignore silently if backend not ready
    }
  }

  async toggleCommunication(setting: keyof typeof this.communicationSettings) {
    const newSettings = { ...this.communicationSettings, [setting]: !this.communicationSettings[setting] };
    this.communicationSettings = newSettings;
    const payload = {
      email_announcements: newSettings.emailAnnouncements,
      email_stokvel_updates: newSettings.emailStokvelUpdates,
      email_marketplace_offers: newSettings.emailMarketplaceOffers,
      push_announcements: newSettings.pushAnnouncements,
      push_stokvel_updates: newSettings.pushStokvelUpdates,
      push_marketplace_offers: newSettings.pushMarketplaceOffers,
    };
    try {
      await this.api.updateCommunicationSettings?.(payload).toPromise();
    } catch {
      // revert on failure
      this.communicationSettings = { ...this.communicationSettings, [setting]: !newSettings[setting] };
    }
  }

  // 2FA
  async sendOtp(method: 'email' | 'sms') {
    this.isSendingOtp = true;
    this.otpSentMessage = '';
    try {
      await this.api.start2FA?.({ method }).toPromise();
      await new Promise(res => setTimeout(res, 1000));
      this.otpSentMessage = `OTP has been sent to your ${method === 'email' ? 'email' : 'phone'}`;
    } catch (e: any) {
      this.otpSentMessage = 'Failed to send OTP. Please try again.';
      this.errorMsg = e?.message || 'Failed to send OTP.';
    } finally {
      this.isSendingOtp = false;
    }
  }

  async verify2FA() {
    this.isVerifying = true;
    this.clearMessages();
    try {
      await this.api.verify2FA?.({ otp_code: this.otp }).toPromise();
      await new Promise(res => setTimeout(res, 1000));
      this.securitySettings.twoFactorEnabled = true;
      this.show2FAModal = false;
      this.otp = '';
      this.infoMsg = 'Two-factor authentication enabled!';
    } catch (e: any) {
      this.errorMsg = e?.message || 'Invalid or expired OTP.';
    } finally {
      this.isVerifying = false;
    }
  }

  async disable2FA() {
    this.isDisabling2FA = true;
    this.clearMessages();
    try {
      await this.api.disable2FA?.({ password: this.disable2FAPassword }).toPromise();
      await new Promise(res => setTimeout(res, 1000));
      this.securitySettings.twoFactorEnabled = false;
      this.showDisable2FAModal = false;
      this.disable2FAPassword = '';
      this.infoMsg = 'Two-factor authentication disabled!';
    } catch (e: any) {
      this.errorMsg = e?.message || 'Failed to disable 2FA.';
    } finally {
      this.isDisabling2FA = false;
    }
  }

  // Sessions
  async logoutAllSessions() {
    this.clearMessages();
    try {
      await this.api.logoutAllSessions?.().toPromise();
      await new Promise(res => setTimeout(res, 1000));
      this.infoMsg = 'Logged out from all other sessions!';
      this.fetchSessions();
    } catch (e: any) {
      this.errorMsg = e?.message || 'Failed to log out all sessions';
    }
  }

  // Delete account
  async deleteAccount() {
    if (!this.deletePassword) return;
    this.isDeleting = true;
    this.clearMessages();
    try {
      await this.api.deleteAccount?.({ password: this.deletePassword }).toPromise();
      await new Promise(res => setTimeout(res, 1000));
      this.infoMsg = 'Account deleted successfully!';
      localStorage.removeItem('access_token');
      window.location.href = '/';
    } catch (e: any) {
      this.errorMsg = e?.message || 'Failed to delete account';
    } finally {
      this.isDeleting = false;
      this.showDeleteModal = false;
      this.deletePassword = '';
    }
  }

  private clearMessages() {
    this.infoMsg = '';
    this.errorMsg = '';
  }
}
