import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService, User } from '../api';
import { AuthService } from '../auth';
import { ChatbotComponent } from '../chatbot/chatbot';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar';

interface AdminStats {
  totalFunds: number;
  activeGroups: number;
  newMembers: number;
  payoutsDue: number;
  totalUsers: number;
  totalTransactions: number;
  totalContributions: number;
}

interface TodoItem {
  pendingKYC: number;
  overduePayouts: number;
  flaggedGroups: number;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  status: string;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  priority: string;
  created_at: string;
  expires_at: string;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.scss'],
  standalone: true,
  imports: [CommonModule, ChatbotComponent, AdminSidebarComponent]
})
export class AdminDashboardComponent implements OnInit {
  admin: User | null = null;
  stats: AdminStats | null = null;
  todo: TodoItem | null = null;
  activity: ActivityItem[] = [];
  announcements: Announcement[] = [];
  loading = true;
  error: string | null = null;
  
  // Navbar properties
  isProfileOpen = false;
  isNotificationsOpen = false;
  notifications: any[] = [];
  unreadCount = 0;
  
  // Sidebar toggle
  isSidebarCollapsed = false;

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.auth.currentUser$.subscribe(u => {
      this.admin = u;
      if (!u) {
        this.router.navigate(['/login']);
        return;
      }
      
      // Check if user is admin - use optional chaining to avoid errors
      if (u.role !== 'admin') {
        this.router.navigate(['/dashboard']);
        return;
      }
    });

    await this.loadAdminData();
  }

  async loadAdminData() {
    this.loading = true;
    try {
      const [statsRes, todoRes, activityRes, announcementsRes] = await Promise.all([
        this.api.getAdminStats().toPromise(),
        this.api.getAdminTodo().toPromise(),
        this.api.getAdminActivity().toPromise(),
        this.api.getAdminAnnouncements().toPromise()
      ]);

      this.stats = statsRes || {
        totalFunds: 0,
        activeGroups: 0,
        newMembers: 0,
        payoutsDue: 0,
        totalUsers: 0,
        totalTransactions: 0,
        totalContributions: 0
      };

      this.todo = todoRes || {
        pendingKYC: 0,
        overduePayouts: 0,
        flaggedGroups: 0
      };

      this.activity = activityRes || [];
      this.announcements = announcementsRes || [];

    } catch (err: any) {
      console.error('Error loading admin data:', err);
      this.error = err?.error?.message || err?.message || 'Failed to load admin dashboard data';
    } finally {
      this.loading = false;
    }
  }

  // Navigation methods
  navigateToKYC() {
    this.router.navigate(['/admin/kyc']);
  }

  navigateToPayouts() {
    this.router.navigate(['/admin/payouts']);
  }

  navigateToGroups() {
    this.router.navigate(['/admin/groups']);
  }

  navigateToNewGroup() {
    this.router.navigate(['/admin/groups/new']);
  }

  navigateToAddMember() {
    this.router.navigate(['/admin/members/add']);
  }

  navigateToDashboard() {
    this.router.navigate(['/admin']);
  }

  // Navbar methods
  onToggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleProfile(): void {
    this.isProfileOpen = !this.isProfileOpen;
    this.isNotificationsOpen = false;
  }

  toggleNotifications(): void {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    this.isProfileOpen = false;
  }

  navigateToProfile(): void {
    this.router.navigate(['/admin/profile']);
    this.isProfileOpen = false;
  }

  navigateToSettings(): void {
    this.router.navigate(['/admin/settings']);
    this.isProfileOpen = false;
  }

  handleLogout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  async handleNotificationClick(notificationId: number): Promise<void> {
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update local state
      this.notifications = this.notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      );
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  }

  formatNumber(num: number): string {
    return num.toLocaleString();
  }
}
