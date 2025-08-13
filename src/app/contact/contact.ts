import { Component } from '@angular/core';
import { LayoutComponent } from '../layout/layout';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.html',
  styleUrls: ['./contact.scss'],
  standalone: true,
  imports: [LayoutComponent]
})
export class Contact {
}
