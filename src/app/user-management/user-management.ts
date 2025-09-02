import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api';

interface UserData {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'member';
  is_verified: boolean;
  is_suspended: boolean;
  created_at: string;
  last_activity?: string;
  total_contributions?: number;
  engagement_level?: 'high' | 'medium' | 'low';
}

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule]
})
export class UserManagementComponent implements OnInit {
  users: UserData[] = [];
  loading = true;
  error: string | null = null;
  searchTerm = '';
  statusFilter = 'all';
  selectedUsers: number[] = [];
  viewMode: 'grid' | 'list' = 'list';

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  async fetchUsers(): Promise<void> {
    try {
      this.loading = true;
      // TODO: Add getUsers method to ApiService
      // const response = await this.api.getUsers().toPromise();
      // this.users = response.data;
      
      // Temporary mock data for development
      this.users = [
        {
          id: 1,
          full_name: 'John Doe',
          email: 'john@example.com',
          phone: '+27123456789',
          role: 'member',
          is_verified: true,
          is_suspended: false,
          created_at: '2024-01-15T10:00:00Z',
          last_activity: '2024-01-20T15:30:00Z',
          total_contributions: 5000,
          engagement_level: 'high'
        },
        {
          id: 2,
          full_name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+27123456788',
          role: 'member',
          is_verified: false,
          is_suspended: false,
          created_at: '2024-01-10T09:00:00Z',
          last_activity: '2024-01-18T12:00:00Z',
          total_contributions: 0,
          engagement_level: 'low'
        },
        {
          id: 3,
          full_name: 'Admin User',
          email: 'admin@example.com',
          phone: '+27123456787',
          role: 'admin',
          is_verified: true,
          is_suspended: false,
          created_at: '2024-01-05T08:00:00Z',
          last_activity: '2024-01-21T10:00:00Z',
          total_contributions: 0,
          engagement_level: 'high'
        },
        {
          id: 4,
          full_name: 'Suspended User',
          email: 'suspended@example.com',
          phone: '+27123456786',
          role: 'member',
          is_verified: true,
          is_suspended: true,
          created_at: '2024-01-01T07:00:00Z',
          last_activity: '2024-01-10T14:00:00Z',
          total_contributions: 2500,
          engagement_level: 'medium'
        }
      ];
      this.error = null;
    } catch (err) {
      console.error('Error fetching users:', err);
      this.error = 'Failed to load users. Please try again later.';
      this.users = [];
    } finally {
      this.loading = false;
    }
  }

  // Filter users
  get filteredUsers(): UserData[] {
    return this.users.filter(user => {
      const matchesSearch = user.full_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesFilter = this.statusFilter === 'all' || 
                           (this.statusFilter === 'active' && !user.is_suspended) ||
                           (this.statusFilter === 'suspended' && user.is_suspended) ||
                           (this.statusFilter === 'verified' && user.is_verified) ||
                           (this.statusFilter === 'unverified' && !user.is_verified);
      
      return matchesSearch && matchesFilter;
    });
  }

  handleSelectAll(event: any): void {
    const checked = event.target.checked;
    if (checked) {
      this.selectedUsers = this.filteredUsers.map(u => u.id);
    } else {
      this.selectedUsers = [];
    }
  }

  handleSelectUser(userId: number, event: any): void {
    const checked = event.target.checked;
    if (checked) {
      this.selectedUsers = [...this.selectedUsers, userId];
    } else {
      this.selectedUsers = this.selectedUsers.filter(id => id !== userId);
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  getStatusBadge(user: UserData): { text: string; class: string } {
    if (user.is_suspended) {
      return { text: 'Suspended', class: 'bg-red-100 text-red-800' };
    }
    if (!user.is_verified) {
      return { text: 'Pending KYC', class: 'bg-yellow-100 text-yellow-800' };
    }
    return { text: 'Active', class: 'bg-green-100 text-green-800' };
  }

  getEngagementBadge(level?: string): { text: string; class: string } {
    switch (level) {
      case 'high':
        return { text: 'High', class: 'bg-emerald-100 text-emerald-700' };
      case 'medium':
        return { text: 'Medium', class: 'bg-blue-100 text-blue-700' };
      case 'low':
        return { text: 'Low', class: 'bg-gray-100 text-gray-700' };
      default:
        return { text: 'Unknown', class: 'bg-gray-100 text-gray-700' };
    }
  }

  get allSelected(): boolean {
    return this.selectedUsers.length === this.filteredUsers.length && this.filteredUsers.length > 0;
  }

  // Action methods
  verifySelected(): void {
    console.log('Verifying selected users:', this.selectedUsers);
    // TODO: Implement API call
  }

  suspendSelected(): void {
    console.log('Suspending selected users:', this.selectedUsers);
    // TODO: Implement API call
  }

  messageSelected(): void {
    console.log('Messaging selected users:', this.selectedUsers);
    // TODO: Implement API call
  }

  viewUser(userId: number): void {
    console.log('Viewing user:', userId);
    // TODO: Navigate to user detail page
  }

  editUser(userId: number): void {
    console.log('Editing user:', userId);
    // TODO: Navigate to user edit page
  }

  messageUser(userId: number): void {
    console.log('Messaging user:', userId);
    // TODO: Open message modal
  }

  exportUsers(): void {
    console.log('Exporting users');
    // TODO: Implement export functionality
  }

  addUser(): void {
    console.log('Adding new user');
    // TODO: Navigate to add user page
  }
}

