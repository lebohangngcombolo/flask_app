import { Component, OnInit, OnDestroy, ElementRef, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

@Component({
  selector: 'app-admin-navbar',
  templateUrl: './admin-navbar.html',
  styleUrls: ['./admin-navbar.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class AdminNavbarComponent implements OnInit, OnDestroy {
  @Output() onToggleSidebar = new EventEmitter<void>();
  
  isProfileOpen = false;
  isNotificationsOpen = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  
  private notificationsInterval: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.fetchNotifications();
    
    // Refresh notifications every 30 seconds
    this.notificationsInterval = setInterval(() => {
      this.fetchNotifications();
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.notificationsInterval) {
      clearInterval(this.notificationsInterval);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isProfileOpen = false;
      this.isNotificationsOpen = false;
    }
  }

  async fetchNotifications(): Promise<void> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/admin/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.notifications = data;
        this.unreadCount = data.filter((n: any) => !n.is_read).length;
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }

  handleLogout(): void {
    this.authService.logout();
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

  navigateToDashboard(): void {
    this.router.navigate(['/admin']);
  }

  // Fix: Add the missing method
  toggleSidebar(): void {
    this.onToggleSidebar.emit();
  }
}
