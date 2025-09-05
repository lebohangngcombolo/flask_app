import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

interface NavItem {
  name: string;
  path?: string;
  icon: string;
  tooltip: string;
  subItems?: { label: string; path: string; action?: string }[];
}

@Component({
  selector: 'app-admin-sidebar',
  templateUrl: './admin-sidebar.html',
  styleUrls: ['./admin-sidebar.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class AdminSidebarComponent implements OnInit {
  @Input() isCollapsed: boolean = false;
  
  openMenus: { [key: string]: boolean } = {};
  
  navItems: NavItem[] = [
    { 
      name: 'Dashboard', 
      path: '/admin', 
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z', 
      tooltip: 'Overview and platform stats' 
    },
    { 
      name: 'Manage Users', 
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z', 
      tooltip: 'View, edit, and manage all users',
      subItems: [
        { label: 'View all', path: '/admin/users' },
        { label: 'Transactions', path: '/admin/users', action: 'transactions' }
      ]
    },
    { 
      name: 'Manage Groups', 
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z', 
      tooltip: 'Create, edit, and manage all stokvel groups',
      subItems: [
        { label: 'Group Management', path: '/admin/groups' }
      ]
    },
    { 
      name: 'Analytics', 
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', 
      tooltip: 'Platform analytics and insights',
      subItems: [
        { label: 'Overview', path: '/admin/analytics' },
        { label: 'Reports', path: '/admin/analytics/reports' }
      ]
    },
    { 
      name: 'Approvals', 
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', 
      tooltip: 'Manage approvals and verifications',
      subItems: [
        { label: 'KYC', path: '/admin/kyc-management' },
        { label: 'Beneficiaries', path: '/admin/beneficiary-approvals' }
      ]
    },
    { 
      name: 'Support', 
      icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', 
      tooltip: 'Support and help resources',
      subItems: [
        { label: 'FAQ', path: '/admin/faqs' },
        { label: 'Customer Concerns', path: '/admin/support/concerns' }
      ]
    },
    { 
      name: 'Admin Team', 
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z', 
      tooltip: 'Manage admin team members',
      subItems: [
        { label: 'Roles & Permissions', path: '/admin/team/roles' }
      ]
    },
    { 
      name: 'Payout Requests', 
      path: '/admin/payouts', 
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1', 
      tooltip: 'Manage and process payouts' 
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Initialize open menus based on current route
    this.updateOpenMenus();
  }

  toggleMenu(menuName: string): void {
    this.openMenus[menuName] = !this.openMenus[menuName];
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }

  isSubItemActive(item: NavItem): boolean {
    if (!item.subItems) return false;
    return item.subItems.some(sub => this.router.url === sub.path);
  }

  onSubItemClick(subItem: any): void {
    if (subItem.action === 'transactions') {
      // Navigate to users page with transactions tab
      this.router.navigate(['/admin/users'], { queryParams: { tab: 'transactions' } });
    } else {
      this.router.navigate([subItem.path]);
    }
  }

  private updateOpenMenus(): void {
    // Auto-open menu if current route matches a sub-item
    this.navItems.forEach(item => {
      if (item.subItems) {
        item.subItems.forEach(sub => {
          if (this.router.url === sub.path) {
            this.openMenus[item.name] = true;
          }
        });
      }
    });
  }
}
