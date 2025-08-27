import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../api';
import { FormsModule } from '@angular/forms';
import { MarketplacePurchaseComponent } from './marketplace-purchase/marketplace-purchase';
import { IDealsComponent } from './i-deals/i-deals';
import { PartnerPortalComponent } from './partner-portal/partner-portal';

interface Offer {
	id: number;
	title: string;
	description: string;
	provider?: string;
	logo?: string;
	tags?: string[];
	verified?: boolean;
	buttonText?: string;
	buttonLink?: string;
}

@Component({
	selector: 'app-offers',
	templateUrl: './offers.html',
	styleUrls: ['./offers.scss'],
	standalone: true,
	imports: [CommonModule, FormsModule, RouterModule, MarketplacePurchaseComponent, IDealsComponent, PartnerPortalComponent]
})
export class OffersComponent implements OnInit {
	activeTab: 'marketplace'|'my-offers'|'partner-portal' = 'marketplace';
	offers: Offer[] = [];
	loading = true;

	constructor(private api: ApiService, private router: Router) {}

	ngOnInit() {
		this.fetchOffers();
	}

	async fetchOffers() {
		this.loading = true;
		try {
			const data = await this.api.getMarketplaceOffers().toPromise();
			this.offers = Array.isArray(data) ? data : [];
		} catch {
			this.offers = [];
		} finally {
			this.loading = false;
		}
	}

	setTab(tab: 'marketplace'|'my-offers'|'partner-portal') {
		this.activeTab = tab;
	}

	go(link?: string) {
		if (!link) return;
		this.router.navigateByUrl(link).catch(() => {});
	}

	apply(offer: Offer) {
		if (offer.buttonLink) {
			this.go(offer.buttonLink);
		} else {
			this.setTab('marketplace');
		}
	}
}
