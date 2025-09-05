import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api';
import { TransactionsComponent } from './transactions/transactions';

interface UserData {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  is_verified: boolean;
  created_at: string;
  groups: string[];
  points: number;
  valid_referrals: number;
  // Computed fields
  status: 'active' | 'inactive' | 'suspended';
  engagement: 'high' | 'medium' | 'low';
  joined: string;
  last_activity: string;
}

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TransactionsComponent]
})
export class UserManagementComponent implements OnInit {
  users: UserData[] = [];
  loading = true;
  error: string | null = null;
  searchTerm = '';
  statusFilter = 'all';
  selectedUsers: number[] = [];
  viewMode: 'grid' | 'list' = 'list';
  activeTab: 'users' | 'transactions' = 'users';

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.fetchUsers();
    
    // Check for tab parameter in URL
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'transactions') {
        this.activeTab = 'transactions';
      } else {
        this.activeTab = 'users';
      }
    });
  }

  async fetchUsers(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;
      
      // Fetch real data from your database
      const response = await this.api.getAdminUsers().toPromise();
      
      if (response && Array.isArray(response)) {
        this.users = response.map(user => this.transformUserData(user));
      } else {
        this.users = [];
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      this.error = error.message || 'Failed to fetch users from database';
      this.users = [];
    } finally {
      this.loading = false;
    }
  }

  private transformUserData(user: any): UserData {
    // Transform backend data to match our interface
    return {
      id: user.id,
      full_name: user.full_name || 'Unknown User',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'member',
      is_verified: user.is_verified || false,
      created_at: user.created_at || '',
      groups: user.groups || [],
      points: user.points || 0,
      valid_referrals: user.valid_referrals || 0,
      // Compute derived fields
      status: this.computeUserStatus(user),
      engagement: this.computeEngagementLevel(user),
      joined: this.formatDate(user.created_at),
      last_activity: this.formatDate(user.created_at) // You can add last_activity to backend if needed
    };
  }

  private computeUserStatus(user: any): 'active' | 'inactive' | 'suspended' {
    // You can add more logic here based on your business rules
    if (user.is_verified === false) return 'inactive';
    if (user.role === 'admin') return 'active';
    return 'active'; // Default to active for verified users
  }

  private computeEngagementLevel(user: any): 'high' | 'medium' | 'low' {
    // Calculate engagement based on points, referrals, and group memberships
    const points = user.points || 0;
    const referrals = user.valid_referrals || 0;
    const groups = user.groups?.length || 0;
    
    const score = points + (referrals * 10) + (groups * 20);
    
    if (score >= 100) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  private formatDate(dateString: string): string {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  }

  get filteredUsers(): UserData[] {
    let filtered = this.users;
    
    if (this.searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.phone.includes(this.searchTerm)
      );
    }
    
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === this.statusFilter);
    }
    
    return filtered;
  }

  toggleUserSelection(userId: number): void {
    const index = this.selectedUsers.indexOf(userId);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(userId);
    }
  }

  selectAllUsers(): void {
    if (this.selectedUsers.length === this.filteredUsers.length) {
      this.selectedUsers = [];
    } else {
      this.selectedUsers = this.filteredUsers.map(user => user.id);
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getEngagementClass(engagement: string): string {
    switch (engagement) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-blue-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  }

  async exportUsers(): Promise<void> {
    try {
      // TODO: Implement export functionality
      console.log('Exporting users...');
      // You can implement CSV export or other formats here
    } catch (error) {
      console.error('Export failed:', error);
    }
  }

  addUser(): void {
    // TODO: Navigate to add user form
    console.log('Adding new user...');
  }

  viewUser(user: UserData): void {
    // TODO: Navigate to user detail page
    console.log('Viewing user:', user);
  }

  editUser(user: UserData): void {
    // TODO: Navigate to edit user form
    console.log('Editing user:', user);
  }

  async deleteUser(user: UserData): Promise<void> {
    if (confirm(`Are you sure you want to delete user "${user.full_name}"?`)) {
      try {
        await this.api.deleteUser(user.id).toPromise();
        // Remove user from local array
        this.users = this.users.filter(u => u.id !== user.id);
        console.log('User deleted successfully');
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user. Please try again.');
      }
    }
  }

  async updateUserStatus(userId: number, newStatus: string): Promise<void> {
    try {
      await this.api.updateUserStatus(userId, newStatus).toPromise();
      // Update local user data
      const user = this.users.find(u => u.id === userId);
      if (user) {
        user.status = newStatus as any;
      }
      console.log('User status updated successfully');
    } catch (error) {
      console.error('Failed to update user status:', error);
      alert('Failed to update user status. Please try again.');
    }
  }

  refreshUsers(): void {
    this.fetchUsers();
  }
}

