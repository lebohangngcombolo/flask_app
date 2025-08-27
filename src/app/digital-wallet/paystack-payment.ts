import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

@Component({
  selector: 'app-paystack-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <!-- Header with Close Button -->
        <div class="sticky top-0 bg-white rounded-t-2xl p-6 pb-4 border-b">
          <div class="flex justify-between items-start">
            <div class="text-center flex-1">
              <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <h2 class="text-xl font-bold text-gray-900">{{ paymentCompleted ? 'Payment Successful!' : 'Complete Payment' }}</h2>
              <p class="text-sm text-gray-600 mt-1">{{ paymentCompleted ? 'Your wallet will be updated shortly' : 'Secure payment powered by Paystack' }}</p>
            </div>
            <button 
              (click)="onCancel.emit()"
              class="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6 pt-4">
          <!-- Payment Completed State -->
          <div *ngIf="paymentCompleted" class="text-center">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Payment Successful!</h3>
            <p class="text-gray-600 mb-4">R {{ amount | number:'1.2-2' }} has been processed</p>
            <div class="bg-green-50 rounded-lg p-3 mb-4">
              <p class="text-sm text-green-800">Your wallet balance will be updated automatically. You can close this window now.</p>
            </div>
            <button 
              (click)="onSuccess.emit({status: 'completed'})"
              class="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors">
              Close & Refresh Balance
            </button>
          </div>

          <!-- Payment Form (show only if not completed) -->
          <div *ngIf="!paymentCompleted">
            <!-- Amount Display -->
            <div class="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-4 mb-4 text-center">
              <div class="text-sm text-gray-600 mb-1">Amount to Pay</div>
              <div class="text-2xl font-bold text-gray-900">R {{ amount | number:'1.2-2' }}</div>
              <div class="text-xs text-gray-500 mt-1">Secure • Fast • Reliable</div>
            </div>

            <!-- Payment Options -->
            <div class="space-y-3 mb-4">
              <div class="text-sm font-medium text-gray-700">Choose Payment Method:</div>
              
              <!-- Card Payment -->
              <div class="border-2 border-gray-200 rounded-lg p-3 cursor-pointer hover:border-emerald-500 transition-colors" 
                   [class.border-emerald-500]="paymentMethod === 'card'"
                   (click)="paymentMethod = 'card'">
                <div class="flex items-center">
                  <div class="w-8 h-5 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center mr-3">
                    <span class="text-white text-xs font-bold">💳</span>
                  </div>
                  <div class="flex-1">
                    <div class="font-medium text-sm">Credit/Debit Card</div>
                    <div class="text-xs text-gray-500">Visa, Mastercard, Verve</div>
                  </div>
                  <div class="w-4 h-4 rounded-full border-2" 
                       [class.bg-emerald-500]="paymentMethod === 'card'"
                       [class.border-emerald-500]="paymentMethod === 'card'"
                       [class.border-gray-300]="paymentMethod !== 'card'">
                    <div *ngIf="paymentMethod === 'card'" class="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                  </div>
                </div>
              </div>

              <!-- Bank Transfer -->
              <div class="border-2 border-gray-200 rounded-lg p-3 cursor-pointer hover:border-emerald-500 transition-colors"
                   [class.border-emerald-500]="paymentMethod === 'bank'"
                   (click)="paymentMethod = 'bank'">
                <div class="flex items-center">
                  <div class="w-8 h-5 bg-gradient-to-r from-green-500 to-blue-600 rounded flex items-center justify-center mr-3">
                    <span class="text-white text-xs font-bold">🏦</span>
                  </div>
                  <div class="flex-1">
                    <div class="font-medium text-sm">Bank Transfer</div>
                    <div class="text-xs text-gray-500">Direct bank transfer</div>
                  </div>
                  <div class="w-4 h-4 rounded-full border-2"
                       [class.bg-emerald-500]="paymentMethod === 'bank'"
                       [class.border-emerald-500]="paymentMethod === 'bank'"
                       [class.border-gray-300]="paymentMethod !== 'bank'">
                    <div *ngIf="paymentMethod === 'bank'" class="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                  </div>
                </div>
              </div>

              <!-- USSD -->
              <div class="border-2 border-gray-200 rounded-lg p-3 cursor-pointer hover:border-emerald-500 transition-colors"
                   [class.border-emerald-500]="paymentMethod === 'ussd'"
                   (click)="paymentMethod = 'ussd'">
                <div class="flex items-center">
                  <div class="w-8 h-5 bg-gradient-to-r from-orange-500 to-red-600 rounded flex items-center justify-center mr-3">
                    <span class="text-white text-xs font-bold">📱</span>
                  </div>
                  <div class="flex-1">
                    <div class="font-medium text-sm">USSD</div>
                    <div class="text-xs text-gray-500">Mobile banking</div>
                  </div>
                  <div class="w-4 h-4 rounded-full border-2"
                       [class.bg-emerald-500]="paymentMethod === 'ussd'"
                       [class.border-emerald-500]="paymentMethod === 'ussd'"
                       [class.border-gray-300]="paymentMethod !== 'ussd'">
                    <div *ngIf="paymentMethod === 'ussd'" class="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-3">
              <button 
                (click)="processPayment()"
                [disabled]="processing"
                class="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-[1.02]">
                <div class="flex items-center justify-center">
                  <svg *ngIf="processing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ processing ? 'Processing...' : 'Pay R' + (amount | number:'1.2-2') }}
                </div>
              </button>
              
              <button 
                (click)="onCancel.emit()"
                [disabled]="processing"
                class="w-full bg-gray-100 text-gray-700 py-2 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm">
                Cancel
              </button>
            </div>

            <!-- Security Notice -->
            <div class="mt-4 text-center">
              <div class="flex items-center justify-center text-xs text-gray-500">
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path>
                </svg>
                Your payment is secured by Paystack
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class PaystackPaymentComponent implements OnInit, OnDestroy {
  @Input() amount: number = 0;
  @Input() email: string = '';
  @Output() onSuccess = new EventEmitter<any>();
  @Output() onCancel = new EventEmitter<void>();
  @Output() onError = new EventEmitter<string>();

  paymentMethod: 'card' | 'bank' | 'ussd' = 'card';
  processing = false;
  paymentCompleted = false; // Add this new state

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadPaystackScript();
  }

  ngOnDestroy() {
    // Clean up if needed
  }

  private loadPaystackScript() {
    if (typeof window !== 'undefined' && !window.PaystackPop) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => {
        console.log('Paystack script loaded successfully');
      };
      script.onerror = () => {
        console.error('Failed to load Paystack script');
      };
      document.head.appendChild(script);
    }
  }

  async processPayment() {
    if (this.processing) return;
    
    this.processing = true;
    
    try {
      // Initialize payment with backend
      const response = await this.api.paystackInitializeDeposit(this.amount).toPromise();
      
      if (response?.authorization_url) {
        // Open Paystack payment modal
        this.openPaystackModal(response);
      } else {
        throw new Error('Failed to initialize payment');
      }
    } catch (error: any) {
      this.onError.emit(error.message || 'Payment initialization failed');
    } finally {
      this.processing = false;
    }
  }

  private openPaystackModal(paymentData: any) {
    if (typeof window !== 'undefined' && window.PaystackPop) {
      const handler = window.PaystackPop.setup({
        key: 'pk_test_8d6d3f289b5144f0b011cf0d04f8f59c5cb89011',
        email: this.email,
        amount: paymentData.amount * 100, // Convert to kobo
        currency: 'ZAR',
        ref: paymentData.reference,
        callback: (response: any) => {
          console.log('🎉 Paystack payment successful:', response);
          this.paymentCompleted = true; // Set completed state
          // Auto-close after 3 seconds
          setTimeout(() => {
            this.onSuccess.emit(response);
          }, 3000);
        },
        onClose: () => {
          console.log('❌ Paystack modal closed by user');
          this.onCancel.emit();
        }
      });
      
      handler.openIframe();
    } else {
      // Fallback: redirect to Paystack
      window.open(paymentData.authorization_url, '_blank');
      this.onSuccess.emit({ status: 'redirected', url: paymentData.authorization_url });
    }
  }
} 