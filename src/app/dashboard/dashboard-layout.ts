import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ProfileDropdownComponent } from '../shared/profile-dropdown/profile-dropdown';
import { AuthService } from '../auth';
import { ApiService } from '../api';
import { ChatbotComponent } from '../chatbot/chatbot';

interface User {
  name?: string;
  email?: string;
  profilePicture?: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

@Component({
  selector: 'app-dashboard-layout',
  templateUrl: './dashboard-layout.html',
  styleUrls: ['./dashboard-layout.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ProfileDropdownComponent,
    ChatbotComponent
  ]
})
export class DashboardLayoutComponent implements OnInit {
  currentUser: User | null = null;
  
  // Add missing properties
  sidebarOpen = false;
  isNotificationsOpen = false;
  tab = 'unread';
  
  // Enhanced notifications data
  unread: Notification[] = [
    {
      id: 1,
      title: 'Welcome to i-STOKVEL!',
      message: 'Your account has been successfully created. Start exploring our features.',
      created_at: new Date().toISOString(),
      read: false
    },
    {
      id: 2,
      title: 'KYC Verification Required',
      message: 'Please complete your KYC verification to unlock all features.',
      created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      read: false
    }
  ];
  
  read: Notification[] = [
    {
      id: 3,
      title: 'Account Setup Complete',
      message: 'Your basic account setup has been completed successfully.',
      created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      read: true
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
    this.refreshProfile();
  }

  loadCurrentUser() {
    // Try to get user from auth service first
    if (this.authService.getCurrentUser) {
      this.currentUser = this.authService.getCurrentUser();
    } else {
      // Fallback to localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          this.currentUser = JSON.parse(userStr);
        } catch (e) {
          console.error('Failed to parse user from localStorage:', e);
        }
      }
    }
  }

  onProfileUpdated() {
    this.refreshProfile();
  }

  private async refreshProfile() {
    try {
      const data = await this.api.getUserProfile().toPromise();
      const mapped: User = {
        name: data?.name || data?.full_name || this.currentUser?.name,
        email: data?.email || this.currentUser?.email,
        profilePicture: data?.profile_picture || this.currentUser?.profilePicture,
      };
      this.currentUser = mapped;
      localStorage.setItem('currentUser', JSON.stringify({
        ...data,
        name: mapped.name,
        profilePicture: mapped.profilePicture
      }));
    } catch {}
  }

  // Add missing methods
  navTo(path: string) {
    this.router.navigate([path]);
  }

  markAllAsRead() {
    // Move all unread notifications to read
    this.read = [...this.read, ...this.unread.map(n => ({ ...n, read: true }))];
    this.unread = [];
  }

  // Close notifications when clicking outside
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.notifications-container')) {
      this.isNotificationsOpen = false;
    }
  }
}
