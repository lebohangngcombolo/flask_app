import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LayoutComponent } from '../layout/layout';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.html',
  styleUrls: ['./landing-page.scss'],
  standalone: true,
  imports: [LayoutComponent]
})
export class LandingPageComponent {
  constructor(private router: Router) {}

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}
