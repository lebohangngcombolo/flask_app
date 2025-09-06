import { Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page';
import { AboutUs } from './about-us/about-us';
import { Programs } from './programs/programs';
import { News } from './news/news';
import { Contact } from './contact/contact';
import { LoginComponent } from './login/login';
import { SignupComponent } from './signup/signup';
import { DashboardComponent } from './dashboard/dashboard';
import { DashboardLayoutComponent } from './dashboard/dashboard-layout';
import { UserProfile } from './user-profile/user-profile';
import { DigitalWallet } from './digital-wallet/digital-wallet';
import { Kyc } from './kyc/kyc';
import { Beneficiaries } from './beneficiaries/beneficiaries';
import { ReferralComponent } from './referral/referral';
import { StokvelGroupsComponent } from './stokvel-groups/stokvel-groups';
import { PayoutRequestComponent } from './payout-request/payout-request';
import { LearningComponent } from './learning/learning';
import { OffersComponent } from './offers/offers';
import { ForgotPasswordComponent } from './forgot-password/forgot-password';
import { GroupDetailsComponent } from './stokvel-groups/group-details/group-details';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard';
import { AdminGuard } from './admin-guard';
import { AdminSidebarComponent } from './admin-sidebar/admin-sidebar';
import { UserManagementComponent } from './user-management/user-management';
import { StokvelManagementComponent } from './stokvel-management/stokvel-management';
import { AdminAnalyticsComponent } from './admin-analytics/admin-analytics';
import { KYCManagementComponent } from './kyc-management/kyc-management';
import { BeneficiaryApprovals } from './beneficiary-approvals/beneficiary-approvals';
import { FAQManagement } from './faq-management/faq-management';
import { ConcernsManagement } from './concerns-management/concerns-management';
import { AdminTeamComponent } from './admin-team/admin-team';
import { AdminPayoutsComponent } from './admin-payouts/admin-payouts';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'about', component: AboutUs },
  { path: 'offers', component: OffersComponent },
  { path: 'programs', component: Programs },
  { path: 'news', component: News },
  { path: 'contact', component: Contact },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'learning', component: LearningComponent },
  {
    path: 'dashboard',
    component: DashboardLayoutComponent,
    children: [
      { path: '', component: DashboardComponent },
      { path: 'my-groups', component: StokvelGroupsComponent },
      { path: 'groups', component: StokvelGroupsComponent },
      { path: 'groups/:groupId', component: GroupDetailsComponent },
      { path: 'profile', component: UserProfile },
      { path: 'wallet', component: DigitalWallet },
      { path: 'kyc', component: Kyc },
      { path: 'beneficiaries', component: Beneficiaries },
      { path: 'referrals', component: ReferralComponent },
      { path: 'payout', component: PayoutRequestComponent },
      { path: 'claims', component: Contact },
      { path: 'marketplace', component: OffersComponent }
    ]
  },
  { path: 'referral', component: ReferralComponent },

  // Admin routes with children
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'users', component: UserManagementComponent },
      { path: 'groups', component: StokvelManagementComponent },
      { path: 'analytics', component: AdminAnalyticsComponent },
      { path: 'analytics/reports', component: AdminAnalyticsComponent },
      { path: 'kyc-management', component: KYCManagementComponent },
      { path: 'beneficiary-approvals', component: BeneficiaryApprovals },
      { path: 'faqs', component: FAQManagement },
      { path: 'support/concerns', component: ConcernsManagement },
      { path: 'team', component: AdminTeamComponent },
      { path: 'payouts', component: AdminPayoutsComponent },
    ]
  },
];