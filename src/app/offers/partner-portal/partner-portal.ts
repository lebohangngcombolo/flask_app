import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Partner {
  id: number;
  name: string;
  logo: string;
  category: string;
  reward: string;
  link: string;
}

const PARTNERS: Partner[] = [
  {
    id: 1,
    name: "Checkers",
    logo: "/logos/checkers.jpg",
    category: "Grocery",
    reward: "Get up to 30% back in rewards points on all purchases.",
    link: "https://www.checkers.co.za/",
  },
  {
    id: 2,
    name: "Makro",
    logo: "/logos/makro.jpg",
    category: "Grocery",
    reward: "R200 OFF Bulk Grocery Combo for stokvels.",
    link: "https://www.makro.co.za/",
  },
  {
    id: 3,
    name: "AVBOB",
    logo: "/logos/avbob.png",
    category: "Burial",
    reward: "Affordable family funeral cover for members.",
    link: "https://www.avbob.co.za/",
  }
];

@Component({
  selector: 'app-partner-portal',
  templateUrl: './partner-portal.html',
  styleUrls: ['./partner-portal.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class PartnerPortalComponent {
  partners = PARTNERS;
  selectedCategory = 'All';

  get categories() {
    return ["All", ...Array.from(new Set(this.partners.map(p => p.category)))];
  }

  get filteredPartners() {
    return this.selectedCategory === "All"
      ? this.partners
      : this.partners.filter(p => p.category === this.selectedCategory);
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
  }

  onImageError(event: any) {
    event.target.src = "/logos/default.png";
  }
}
