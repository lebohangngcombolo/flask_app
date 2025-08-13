import { Component } from '@angular/core';
import { LayoutComponent } from '../layout/layout';

@Component({
  selector: 'app-news',
  templateUrl: './news.html',
  styleUrls: ['./news.scss'],
  standalone: true,
  imports: [LayoutComponent]
})
export class News {
}
