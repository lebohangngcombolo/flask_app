import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatbotComponent } from '../chatbot/chatbot';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.html',
  styleUrls: ['./layout.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, ChatbotComponent]
})
export class LayoutComponent {
  isMobileMenuOpen = false;
  currentYear = new Date().getFullYear();

  constructor(private router: Router) {}

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  get hideAuthButtons(): boolean {
    const currentPath = this.router.url;
    return currentPath === '/signup' || currentPath === '/dashboard';
  }
}
