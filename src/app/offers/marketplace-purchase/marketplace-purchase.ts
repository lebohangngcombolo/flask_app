import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../api';

type ItemType = 'airtime'|'data'|'electricity'|'voucher';

const ITEM_TYPES: Array<{ key: ItemType; label: string; icon: string }> = [
	{ key: 'airtime', label: 'Airtime', icon: '📱' },
	{ key: 'data', label: 'Data', icon: '📶' },
	{ key: 'electricity', label: 'Electricity', icon: '⚡' },
	{ key: 'voucher', label: 'Vouchers', icon: '🎟️' },
];

const PROVIDERS: Record<ItemType, string[]> = {
	airtime: ['MTN', 'Vodacom', 'Cell C', 'Telkom'],
	data: ['MTN', 'Vodacom', 'Cell C', 'Telkom'],
	electricity: ['Eskom', 'City Power'],
	voucher: ['Netflix', 'Google Play', 'Takealot'],
};

@Component({
	selector: 'app-marketplace-purchase',
	templateUrl: './marketplace-purchase.html',
	styleUrls: ['./marketplace-purchase.scss'],
	standalone: true,
	imports: [CommonModule, FormsModule]
})
export class MarketplacePurchaseComponent implements OnInit {
	itemTypes = ITEM_TYPES;
	providersMap = PROVIDERS;

	itemType: ItemType = 'airtime';
	provider = '';
	amount = '';
	phoneNumber = '';
	meterNumber = '';
	paymentMethod: 'wallet'|'card' = 'wallet';
	selectedCardId = '';

	transactions: any[] = [];
	loading = false;

	showReceipt = false;
	purchaseData: any = null;

	constructor(private api: ApiService) {}

	ngOnInit() {
		this.fetchTransactions();
	}

	async fetchTransactions() {
		try {
			const res = await this.api.getMarketTransactions().toPromise();
			this.transactions = Array.isArray(res) ? res : [];
		} catch {
			this.transactions = [];
		}
	}

	onItemTypeChange() {
		this.provider = '';
		this.phoneNumber = '';
		this.meterNumber = '';
	}

	async handlePurchase(e: Event) {
		e.preventDefault();

		if (!this.provider || !this.amount || Number(this.amount) <= 0) return;
		if ((this.itemType === 'airtime' || this.itemType === 'data') && !this.phoneNumber.trim()) return;
		if (this.itemType === 'electricity' && !this.meterNumber.trim()) return;

		this.loading = true;
		try {
			const payload: any = {
				item_type: this.itemType,
				provider: this.provider,
				amount: Number(this.amount),
				payment_method: this.paymentMethod,
				card_id: this.paymentMethod === 'card' ? this.selectedCardId : undefined,
				phone_number: (this.itemType === 'airtime' || this.itemType === 'data') ? this.phoneNumber : undefined,
				meter_number: this.itemType === 'electricity' ? this.meterNumber : undefined,
			};
			const res = await this.api.marketPurchase(payload).toPromise();

			const token = this.itemType !== 'airtime' ? this.generateToken() : undefined;
			this.purchaseData = {
				id: res?.id || Date.now().toString(),
				itemType: this.itemType,
				provider: this.provider,
				amount: Number(this.amount),
				phoneNumber: (this.itemType === 'airtime' || this.itemType === 'data') ? this.phoneNumber : undefined,
				token,
				reference: res?.reference || this.generateReference(),
				status: 'successful',
				timestamp: new Date().toISOString(),
				paymentMethod: this.paymentMethod,
			};

			this.showReceipt = true;
			await this.fetchTransactions();

			this.amount = '';
			this.provider = '';
			this.phoneNumber = '';
			this.meterNumber = '';
			this.selectedCardId = '';
			this.paymentMethod = 'wallet';
		} finally {
			this.loading = false;
		}
	}

	private generateToken() {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let result = '';
		for (let i = 0; i < 16; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
		return result;
	}

	private generateReference() {
		return 'TXN' + Date.now().toString().slice(-8);
	}
}
