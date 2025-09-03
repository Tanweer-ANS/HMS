# Payment Gateway Setup Guide

## Overview
This guide explains how to set up both Stripe and Razorpay payment gateways for doctor appointment bookings in the HMS system.

## Prerequisites
- Stripe account (https://stripe.com)
- Razorpay account (https://razorpay.com)
- Node.js and npm installed
- Existing HMS system running

## Step 1: Install Dependencies
```bash
npm install stripe @stripe/stripe-js razorpay
```

## Step 2: Account Setup

### 2.1 Stripe Account Setup
1. Go to https://stripe.com and sign up
2. Complete account verification
3. Get your API keys from the Stripe Dashboard

### 2.2 Razorpay Account Setup
1. Go to https://razorpay.com and sign up
2. Complete account verification
3. Get your API keys from the Razorpay Dashboard

### 2.3 Get API Keys
**Stripe:**
- In Stripe Dashboard, go to Developers → API Keys
- Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)
- Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)

**Razorpay:**
- In Razorpay Dashboard, go to Settings → API Keys
- Copy your **Key ID** (starts with `rzp_test_` or `rzp_live_`)
- Copy your **Key Secret** (starts with `test_` or `live_`)

## Step 3: Environment Variables

Create a `.env.local` file in your project root:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=test_your_razorpay_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_here

# Database Configuration
MONGODB_URI=your_mongodb_connection_string_here

# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
```

## Step 4: Webhook Setup

### 4.1 Stripe Webhook
1. In Stripe Dashboard, go to Developers → Webhooks
2. Click "Add endpoint"
3. Set endpoint URL: `https://yourdomain.com/api/payments/webhook`
4. Select events: `payment_intent.succeeded`
5. Copy the webhook signing secret

### 4.2 Razorpay Webhook
1. In Razorpay Dashboard, go to Settings → Webhooks
2. Click "Add New Webhook"
3. Set endpoint URL: `https://yourdomain.com/api/payments/razorpay-webhook`
4. Select events: `payment.captured`
5. Copy the webhook signing secret

### 4.3 Update Environment Variables
Replace the webhook secrets in `.env.local` with the copied values.

## Step 5: Test the Integration

### 5.1 Test Mode
**Stripe:**
- Use Stripe test cards for testing
- Test card number: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC

**Razorpay:**
- Use Razorpay test cards for testing
- Test card number: `4111 1111 1111 1111`
- Any future expiry date
- Any 3-digit CVC

### 5.2 Test Flow
1. Select a doctor
2. Fill appointment details
3. Click "Proceed to Payment"
4. Choose payment method (Stripe or Razorpay)
5. Use test card details
6. Complete payment
7. Verify appointment creation

## Step 6: Production Deployment

### 6.1 Switch to Live Keys
1. In both dashboards, switch to "Live" mode
2. Get live API keys
3. Update environment variables with live keys
4. Update webhook URLs to production domain

### 6.2 Security Considerations
- Never commit `.env.local` to version control
- Use environment variables in production
- Enable webhook signature verification
- Monitor webhook failures

## File Structure

```
app/
├── api/
│   └── payments/
│       ├── create-payment-intent/
│       │   └── route.ts              # Creates Stripe payment intent
│       ├── create-razorpay-order/
│       │   └── route.ts              # Creates Razorpay order
│       ├── webhook/
│       │   └── route.ts              # Handles Stripe payment success
│       └── razorpay-webhook/
│           └── route.ts              # Handles Razorpay payment success
components/
├── PaymentForm.tsx                   # Stripe payment form
├── RazorpayPaymentForm.tsx           # Razorpay payment form
├── PaymentMethodSelector.tsx          # Payment method selection
└── dashboard/
    └── PatientDashboard.tsx          # Updated with payment flow
lib/
├── stripe.ts                         # Stripe configuration
└── razorpay.ts                      # Razorpay configuration
models/
└── Appointment.ts                    # Updated with payment fields
```

## How It Works

### 1. Appointment Booking Flow
1. Patient selects doctor and appointment details
2. Clicks "Proceed to Payment"
3. Chooses payment method (Stripe or Razorpay)
4. System creates payment intent/order
5. Patient enters payment details
6. Payment processed through selected gateway
7. Webhook creates appointment automatically

### 2. Payment Processing
- **Stripe**: International payments in USD with global coverage
- **Razorpay**: Indian payments in INR with UPI, cards, net banking
- **Frontend**: Secure payment forms for each gateway
- **Backend**: Payment intent/order creation and webhook handling
- **Database**: Appointment creation after successful payment
- **Security**: Webhook signature verification for both gateways

### 3. Error Handling
- Payment failures show user-friendly messages
- Network errors allow retry
- Invalid data prevents payment creation
- Webhook failures are logged
- Fallback options for failed payments

## Payment Method Comparison

| Feature | Stripe | Razorpay |
|---------|--------|----------|
| **Currency** | USD | INR |
| **Coverage** | Global | India-focused |
| **Payment Methods** | Cards, Digital Wallets | UPI, Cards, Net Banking |
| **Fees** | 2.9% + 30¢ | 2% + ₹3 |
| **Best For** | International patients | Indian patients |

## Troubleshooting

### Common Issues

1. **Payment Intent/Order Creation Fails**
   - Check API keys
   - Verify required fields in request
   - Check console for error details

2. **Webhook Not Working**
   - Verify webhook secrets
   - Check webhook endpoint URLs
   - Monitor dashboard for failures

3. **Payment Form Not Loading**
   - Check publishable keys
   - Verify script loading
   - Check browser console for errors

### Debug Mode
Enable debug mode in development for both gateways.

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Razorpay Documentation: https://razorpay.com/docs
- Razorpay Support: https://razorpay.com/support
- HMS System Issues: Check project repository

## Security Notes

- All payments are processed through secure gateways
- No credit card data is stored in your database
- Webhook signatures prevent unauthorized requests
- Use HTTPS in production for webhook endpoints
- Both gateways are PCI DSS compliant
