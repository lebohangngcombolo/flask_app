# Paystack Integration Setup Guide

## Backend Configuration

### 1. Environment Variables
Add these to your `backend/.env` file:

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here
```

### 2. Get Paystack API Keys
1. Sign up at [Paystack](https://paystack.com)
2. Go to Settings > API Keys & Webhooks
3. Copy your Secret Key and Public Key
4. Use test keys for development, live keys for production

### 3. Configure Webhook URL
In your Paystack dashboard:
1. Go to Settings > API Keys & Webhooks
2. Add webhook URL: `http://localhost:5001/api/webhooks/paystack` (for development)
3. For production: `https://yourdomain.com/api/webhooks/paystack`
4. Select events: `charge.success`

## Frontend Configuration

The frontend is already configured to work with the backend. No additional setup needed.

## Testing the Integration

### 1. Start the Backend
```bash
cd backend
python app.py
```

### 2. Start the Frontend
```bash
npm start
```

### 3. Test Paystack Deposit
1. Go to Digital Wallet
2. Click "Deposit"
3. Enter amount (R1.00 - R50,000.00)
4. Select "Pay with Paystack"
5. Click "Confirm Deposit"
6. Complete payment on Paystack
7. Return to the app and click "I've Completed Payment - Refresh Balance"

## Test Cards

Use these test card numbers:
- **Visa**: 4084 0840 8408 4081
- **Mastercard**: 5105 1051 0510 5100
- **Verve**: 5061 4603 6000 0000

Any future expiry date and any 3-digit CVV will work.

## Troubleshooting

### Webhook Not Working
1. Check if webhook URL is correct in Paystack dashboard
2. Ensure backend is accessible from the internet (use ngrok for local testing)
3. Check backend logs for webhook errors

### Payment Not Credited
1. Verify webhook is receiving `charge.success` events
2. Check if transaction reference already exists in database
3. Ensure user_id and purpose metadata are correct

### Frontend Errors
1. Check browser console for API errors
2. Verify backend is running on port 5001
3. Ensure user is authenticated

## Production Deployment

1. Use live Paystack keys instead of test keys
2. Update webhook URL to your production domain
3. Enable webhook signature verification for security
4. Set up proper SSL certificates
5. Configure proper logging and monitoring 