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

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'about', component: AboutUs },
  { path: 'programs', component: Programs },
  { path: 'news', component: News },
  { path: 'contact', component: Contact },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  {
    path: 'dashboard',
    component: DashboardLayoutComponent,
    children: [
      { path: '', component: DashboardComponent },
      { path: 'groups', component: StokvelGroupsComponent },
      { path: 'profile', component: UserProfile },
      { path: 'wallet', component: DigitalWallet },
      { path: 'kyc', component: Kyc },
      { path: 'beneficiaries', component: Beneficiaries },
      { path: 'referrals', component: ReferralComponent },
      { path: 'claims', component: Contact },
    ]
  },
  // Keep the standalone route for direct access
  { path: 'referral', component: ReferralComponent },
];
