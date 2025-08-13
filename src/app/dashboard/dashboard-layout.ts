import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { ApiService } from '../api';

@Component({
  standalone: true,
  selector: 'app-dashboard-layout',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './dashboard-layout.html'
})
export class DashboardLayoutComponent {
  sidebarOpen = signal(true);
  isNotificationsOpen = signal(false);
  tab = signal<'unread' | 'read'>('unread');
  notifications: any[] = [];
  unread() { return this.notifications.filter(n => !n.read); }
  read() { return this.notifications.filter(n => n.read); }

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.fetchNotifications();
    setInterval(() => this.fetchNotifications(), 30000);
  }

  async fetchNotifications() {
    try {
      const data = await this.api.getNotifications().toPromise();
      this.notifications = Array.isArray(data) ? data : [];
    } catch {}
  }
  async markAllAsRead() {
    const ids = this.unread().map(n => n.id);
    if (!ids.length) return;
    await Promise.all(ids.map((id: string) => this.api.markNotificationAsRead(id).toPromise()));
    this.fetchNotifications();
  }
  navTo(path: string) { this.router.navigateByUrl(path); }
}
