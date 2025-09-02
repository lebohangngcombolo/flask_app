import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

interface NavItem {
  name: string;
  path: string;
  icon: string;
  tooltip: string;
  subItems?: { label: string; path: string }[];
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
      path: '/admin/users', 
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z', 
      tooltip: 'View, edit, and manage all users', 
      subItems: [
        { label: 'View all', path: '/admin/users' },
        { label: 'Transactions', path: '/admin/users/transactions' }
      ] 
    },
    { 
      name: 'Manage Groups', 
      path: '/admin/groups', 
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z', 
      tooltip: 'Create, edit, and manage all stokvel groups', 
      subItems: [
        { label: 'Group Management', path: '/admin/groups' }
      ] 
    },
    { 
      name: 'Analytics', 
      path: '/admin/analytics', 
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', 
      tooltip: 'View and analyze analytics', 
      subItems: [
        { label: 'Overview', path: '/admin/analytics' },
        { label: 'Reports', path: '/admin/analytics/reports' },
      ] 
    },
    {
      name: 'Approvals',
      path: '/admin/beneficiary-approvals',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      tooltip: 'Approve or reject KYC and beneficiary documents',
      subItems: [
        { label: 'KYC', path: '/admin/kyc-management' },
        { label: 'Beneficiaries', path: '/admin/beneficiary-approvals' },
      ],
    },
    { 
      name: 'Support', 
      path: '/admin/support', 
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', 
      tooltip: 'FAQ, customer concerns, and notifications', 
      subItems: [
        { label: 'FAQ', path: '/admin/faqs' },
        { label: 'Customer Concerns', path: '/admin/support/concerns' }
      ] 
    },
    {
      name: 'Admin Team',
      path: '/admin/team',
      icon: 'M19 9l-7 7-7-7',
      tooltip: 'Manage admin team and roles',
      subItems: [
        { label: 'Roles & Permissions', path: '/admin/team' }
      ]
    },
    {
      name: 'Payout Requests',
      path: '/admin/payouts',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
      tooltip: 'Approve or reject payout requests'
    },
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {}

  toggleMenu(label: string): void {
    this.openMenus[label] = !this.openMenus[label];
  }

  isActive(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  isSubItemActive(item: NavItem): boolean {
    if (!item.subItems) return false;
    return item.subItems.some(sub => this.router.url === sub.path);
  }
}
