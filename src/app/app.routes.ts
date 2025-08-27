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
      { path: 'my-groups', component: StokvelGroupsComponent }, // This would show your groups
      { path: 'groups', component: StokvelGroupsComponent }, // This shows available groups to join
      { path: 'groups/:groupId', component: GroupDetailsComponent }, // This shows specific group details
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
];