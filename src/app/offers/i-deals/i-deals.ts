import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Deal {
  id: number;
  category: string;
  title: string;
  image: string;
  description: string;
  price: string;
  partner: string;
  link: string;
}

const IDEALS: Deal[] = [
  {
    id: 1,
    category: "Travel",
    title: "Durban Beach Holiday",
    image: "/ideals/durban.jpg",
    description: "Save R500 per member on group bookings for 5+ people.",
    price: "From R2,999 pp",
    partner: "UCount Travel",
    link: "/i-deals/1"
  },
  {
    id: 2,
    category: "Groceries",
    title: "Bulk Grocery Combo",
    image: "/ideals/groceries.png",
    description: "R200 OFF when your stokvel buys in bulk at Makro.",
    price: "Save R200",
    partner: "Makro",
    link: "/i-deals/2"
  },
  {
    id: 3,
    category: "Education",
    title: "Back-to-School Supplies",
    image: "/ideals/school.jpg",
    description: "Get 15% off on all school supply bundles for stokvels.",
    price: "Save 15%",
    partner: "Shoprite",
    link: "/i-deals/3"
  },
  {
    id: 4,
    category: "Insurance",
    title: "Family Funeral Plan",
    image: "/ideals/funeral.jpg",
    description: "Affordable family funeral cover for stokvel members.",
    price: "From R99/month",
    partner: "AVBOB",
    link: "/i-deals/4"
  }
];

@Component({
  selector: 'app-i-deals',
  templateUrl: './i-deals.html',
  styleUrls: ['./i-deals.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class IDealsComponent {
  deals = IDEALS;
  selectedCategory = 'All';
  selectedDeal: Deal | null = null;

  get categories() {
    return ["All", ...Array.from(new Set(this.deals.map(d => d.category)))];
  }

  get filteredDeals() {
    return this.selectedCategory === "All"
      ? this.deals
      : this.deals.filter(d => d.category === this.selectedCategory);
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
  }

  viewDeal(deal: Deal) {
    this.selectedDeal = deal;
  }

  closeDeal() {
    this.selectedDeal = null;
  }

  onImageError(event: any) {
    event.target.src = "/ideals/default.jpg";
  }
}
