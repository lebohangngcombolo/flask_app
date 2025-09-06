import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, AdminRole, RoleForm } from '../api';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-admin-team',
  standalone: true,
  templateUrl: './admin-team.html',
  styleUrls: ['./admin-team.scss'],
  imports: [CommonModule, FormsModule]
})
export class AdminTeamComponent implements OnInit {
  roles: AdminRole[] = [];
  loading = true;
  search = '';
  
  // Modal states
  showAddRole = false;
  showEditRole = false;
  selectedRole: AdminRole | null = null;

  // Form states
  roleForm: RoleForm = {
    name: '',
    description: '',
    permissions: {
      users: { read: false, write: false, delete: false },
      groups: { read: false, write: false, delete: false },
      analytics: { read: false, export: false },
      approvals: { read: false, approve: false, reject: false },
      support: { read: false, respond: false },
      team: { read: false, write: false, delete: false },
      payouts: { read: false, approve: false, reject: false },
      audit: { read: false },
      settings: { read: false, write: false },
      financial: { read: false, write: false, approve: false },
      content: { read: false, write: false, delete: false },
      security: { read: false, write: false, configure: false }
    }
  };

  editRoleForm: RoleForm = {
    name: '',
    description: '',
    permissions: {
      users: { read: false, write: false, delete: false },
      groups: { read: false, write: false, delete: false },
      analytics: { read: false, export: false },
      approvals: { read: false, approve: false, reject: false },
      support: { read: false, respond: false },
      team: { read: false, write: false, delete: false },
      payouts: { read: false, approve: false, reject: false },
      audit: { read: false },
      settings: { read: false, write: false },
      financial: { read: false, write: false, approve: false },
      content: { read: false, write: false, delete: false },
      security: { read: false, write: false, configure: false }
    }
  };

  // Loading states
  submitting = false;
  initializing = false;

  constructor(private apiService: ApiService) {}

  async ngOnInit() {
    await this.loadRoles();
  }

  async loadRoles() {
    try {
      this.loading = true;
      const rolesRes = await firstValueFrom(this.apiService.getAdminRoles());
      this.roles = rolesRes || [];
      
      // If no roles exist, initialize default roles
      if (this.roles.length === 0) {
        await this.initializeDefaultRoles();
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      // If there's an error, try to initialize default roles
      await this.initializeDefaultRoles();
    } finally {
      this.loading = false;
    }
  }

  async initializeDefaultRoles() {
    try {
      this.initializing = true;
      await firstValueFrom(this.apiService.initializeDefaultRoles());
      // Reload roles after initialization
      const rolesRes = await firstValueFrom(this.apiService.getAdminRoles());
      this.roles = rolesRes || [];
    } catch (error) {
      console.error('Error initializing default roles:', error);
    } finally {
      this.initializing = false;
    }
  }

  handleAddRoleClick() {
    this.resetRoleForm();
    this.showAddRole = true;
  }

  async handleAddRole() {
    if (!this.roleForm.name.trim()) {
      alert('Role name is required');
      return;
    }
    
    const existingRole = this.roles.find(r => r.name.toLowerCase() === this.roleForm.name.toLowerCase());
    if (existingRole) {
      alert('A role with this name already exists');
      return;
    }
    
    const hasPermissions = Object.values(this.roleForm.permissions).some(resource => 
      Object.values(resource as any).some(Boolean)
    );
    
    if (!hasPermissions) {
      alert('Please select at least one permission for this role');
      return;
    }
    
    try {
      this.submitting = true;
      await firstValueFrom(this.apiService.createAdminRole(this.roleForm));
      this.showAddRole = false;
      this.resetRoleForm();
      alert('Role created successfully!');
      await this.loadRoles();
    } catch (error: any) {
      console.error('Error creating role:', error);
      alert(`Error creating role: ${error.error?.error || error.message || 'Unknown error'}`);
    } finally {
      this.submitting = false;
    }
  }

  openEditRole(role: AdminRole) {
    this.selectedRole = role;
    this.editRoleForm = {
      name: role.name,
      description: role.description,
      permissions: { ...role.permissions }
    };
    this.showEditRole = true;
  }

  async handleEditRole() {
    if (!this.selectedRole) return;
    
    try {
      this.submitting = true;
      await firstValueFrom(this.apiService.updateRole(this.selectedRole.id, this.editRoleForm));
      this.showEditRole = false;
      this.selectedRole = null;
      await this.loadRoles();
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      this.submitting = false;
    }
  }

  async handleDeleteRole(roleId: number) {
    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) return;
    
    try {
      this.submitting = true;
      await firstValueFrom(this.apiService.deleteAdminRole(roleId));
      await this.loadRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
    } finally {
      this.submitting = false;
    }
  }

  updatePermission(permissionKey: string, action: string, value: boolean) {
    if (this.roleForm.permissions[permissionKey as keyof typeof this.roleForm.permissions]) {
      (this.roleForm.permissions[permissionKey as keyof typeof this.roleForm.permissions] as any)[action] = value;
    }
  }

  updateEditPermission(permissionKey: string, action: string, value: boolean) {
    if (this.selectedRole && this.selectedRole.permissions[permissionKey as keyof typeof this.selectedRole.permissions]) {
      (this.selectedRole.permissions[permissionKey as keyof typeof this.selectedRole.permissions] as any)[action] = value;
    }
  }

  resetRoleForm() {
    this.roleForm = {
      name: '',
      description: '',
      permissions: {
        users: { read: false, write: false, delete: false },
        groups: { read: false, write: false, delete: false },
        analytics: { read: false, export: false },
        approvals: { read: false, approve: false, reject: false },
        support: { read: false, respond: false },
        team: { read: false, write: false, delete: false },
        payouts: { read: false, approve: false, reject: false },
        audit: { read: false },
        settings: { read: false, write: false },
        financial: { read: false, write: false, approve: false },
        content: { read: false, write: false, delete: false },
        security: { read: false, write: false, configure: false }
      }
    };
  }

  get filteredRoles() {
    if (!this.search) return this.roles;
    return this.roles.filter(role => 
      role.name.toLowerCase().includes(this.search.toLowerCase()) ||
      role.description.toLowerCase().includes(this.search.toLowerCase())
    );
  }

  getPermissionActions(permissionValue: any): any[] {
    if (!permissionValue || typeof permissionValue !== 'object') {
      return [];
    }
    return Object.keys(permissionValue).map(key => ({
      key: key,
      value: permissionValue[key]
    }));
  }
}
