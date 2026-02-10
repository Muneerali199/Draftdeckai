# Payment Methods Setup Guide

This guide explains how to enable and configure multiple payment methods in your Stripe integration.

## 🌍 Available Payment Methods

Your DraftDeckAI application now supports the following payment methods:

### 1. **Cards** 💳
- **Supported**: Visa, Mastercard, American Express, Discover, Diners Club, JCB, UnionPay
- **Regions**: Worldwide
- **Setup**: No additional configuration needed
- **Status**: ✅ Enabled by default

### 2. **UPI (Unified Payments Interface)** 📱
- **Supported**: Google Pay, PhonePe, Paytm, BHIM, and all UPI apps
- **Regions**: India only
- **Setup**: Requires activation in Stripe Dashboard
- **Status**: ✅ Enabled in code

### 3. **PayPal** 🅿️
- **Regions**: 200+ countries
- **Setup**: Requires PayPal Business account linked to Stripe
- **Status**: ✅ Enabled in code

### 4. **Link** ⚡
- **Description**: Stripe's one-click payment method
- **Regions**: US, UK, and expanding
- **Setup**: No additional configuration needed
- **Status**: ✅ Enabled by default

### 5. **Cash App Pay** 💵
- **Regions**: United States
- **Setup**: No additional configuration needed
- **Status**: ✅ Enabled in code

### 6. **ACH Direct Debit** 🏦
- **Description**: US bank account transfers
- **Regions**: United States
- **Setup**: Requires additional verification
- **Status**: ✅ Enabled in code

---

## 🔧 How to Enable UPI Payments (India)

### Step 1: Activate UPI in Stripe Dashboard

1. **Login to Stripe Dashboard**
   - Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
   - Login with your Stripe account

2. **Navigate to Payment Methods**
   - Click on **Settings** (⚙️ icon in sidebar)
   - Select **Payment methods**

3. **Enable UPI**
   - Scroll down to find **UPI** in the list
   - Click **Turn on** or **Enable**
   - Follow any additional setup instructions

4. **Configure UPI Settings** (Optional)
   - Set minimum/maximum payment amounts
   - Configure success/failure handling
   - Set up notifications

### Step 2: Test UPI in Test Mode

Stripe provides test UPI details for testing:

**Test UPI IDs for Success:**
- `success@razorpay`
- `test@paytm`

**Test UPI IDs for Failure:**
- `failure@razorpay`

**How to Test:**
1. Start a checkout session
2. Select **UPI** as payment method
3. Enter one of the test UPI IDs
4. Complete the test payment

### Step 3: Go Live

1. **Switch to Live Mode** in Stripe Dashboard
2. Complete **India business verification** (required for UPI)
   - Provide business registration documents
   - Tax information (GST number if applicable)
   - Bank account details
3. Enable UPI in live mode
4. Update your `.env` file with live Stripe keys

---

## 🔧 How to Enable PayPal

### Step 1: Connect PayPal to Stripe

1. Go to [Stripe Dashboard → Settings → Payment methods](https://dashboard.stripe.com/settings/payment_methods)
2. Find **PayPal** in the list
3. Click **Turn on**
4. Click **Connect PayPal**
5. Login to your **PayPal Business account**
6. Authorize Stripe to process payments

### Step 2: Configure PayPal Settings

- **Business name**: Ensure it matches your Stripe account
- **Return URLs**: Already configured in code
- **Webhook URLs**: Stripe handles this automatically

---

## 🔧 How to Enable Cash App Pay (US Only)

1. Go to [Stripe Dashboard → Settings → Payment methods](https://dashboard.stripe.com/settings/payment_methods)
2. Find **Cash App Pay**
3. Click **Turn on**
4. Accept Cash App Pay's terms of service
5. No additional setup required

---

## 🔧 How to Enable ACH Direct Debit (US Only)

### Requirements:
- US-based business
- Additional identity verification
- Plaid integration (handled by Stripe)

### Setup:
1. Go to [Stripe Dashboard → Settings → Payment methods](https://dashboard.stripe.com/settings/payment_methods)
2. Find **ACH Direct Debit** or **US Bank Account**
3. Click **Turn on**
4. Complete additional verification steps
5. Accept Stripe's ACH terms

---

## 🌍 Smart Payment Method Detection

The code is configured to **automatically show relevant payment methods** based on:

1. **Customer's Location** (detected by IP address)
   - India → Shows UPI, Cards
   - US → Shows Cards, Cash App, ACH, Link
   - Europe → Shows Cards, SEPA, Link
   - Global → Shows Cards, PayPal, Link

2. **Currency**
   - INR (Indian Rupee) → UPI available
   - USD (US Dollar) → Cash App, ACH available
   - EUR (Euro) → SEPA available

3. **Customer's Browser/Device**
   - Mobile in India → UPI prioritized
   - Desktop anywhere → Cards prioritized

---

## ⚠️ Important Notes

### For UPI (India):

1. **Business Verification Required**
   - Stripe requires Indian business registration
   - GST number (if turnover > ₹20 lakhs)
   - Bank account in India

2. **UPI Limitations**
   - Maximum amount: ₹1,00,000 per transaction
   - Minimum amount: ₹1
   - Real-time payments only (no recurring billing support yet)

3. **UPI for Subscriptions**
   - **Current Limitation**: UPI doesn't support automatic recurring billing
   - **Workaround**: 
     - Use UPI for one-time payments only
     - For subscriptions, recommend cards or mandate-based payments
     - You can collect UPI for first payment, then card for recurring

### For All Payment Methods:

1. **Compliance**
   - Different payment methods have different compliance requirements
   - Ensure your business is registered in the regions you serve
   - Follow local tax and payment regulations

2. **Fees**
   - Each payment method has different processing fees
   - UPI: ~2% + currency conversion (if applicable)
   - Cards: 2.9% + $0.30
   - ACH: 0.8% (capped at $5)
   - Check Stripe's [pricing page](https://stripe.com/pricing)

3. **Settlement Times**
   - Cards: 2-7 business days
   - UPI: 1-3 business days
   - ACH: 5-7 business days
   - PayPal: 1-3 business days

---

## 🧪 Testing Payment Methods

### Test Mode Cards (Worldwide)

```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
```

### Test Mode UPI (India)

```
UPI ID: success@razorpay (for successful payment)
UPI ID: failure@razorpay (for failed payment)
```

### Test Mode PayPal

```
Email: Use Stripe's PayPal sandbox credentials
Follow Stripe's test mode instructions
```

---

## 🔄 Alternative: Dynamic Payment Methods

If you want Stripe to automatically select the best payment methods, you can modify the code:

```typescript
// In lib/stripe.ts, replace payment_method_types with:
payment_method_types: undefined, // Let Stripe decide automatically

// Or use automatic payment methods:
automatic_payment_methods: {
  enabled: true,
  allow_redirects: 'always', // For UPI, PayPal, etc.
},
```

This will enable ALL payment methods available for the customer's location.

---

## 📊 Monitoring Payments

### Stripe Dashboard

1. **Payments** → View all transactions
2. **Filter by payment method** to see UPI vs Card usage
3. **Export reports** for accounting

### Webhook Events

The code already handles these webhook events:
- `checkout.session.completed` → Payment successful
- `customer.subscription.created` → New subscription
- `customer.subscription.updated` → Plan changed
- `customer.subscription.deleted` → Subscription cancelled
- `invoice.payment_succeeded` → Recurring payment successful
- `invoice.payment_failed` → Recurring payment failed

---

## 🎯 Best Practices

1. **Enable Relevant Methods Only**
   - Don't enable all methods if you don't operate in those regions
   - UPI only makes sense for Indian customers
   - Cash App only for US customers

2. **Customer Communication**
   - Update your pricing page to mention accepted payment methods
   - Add payment method icons for clarity
   - Explain region-specific options

3. **Fraud Prevention**
   - Enable Stripe Radar (fraud detection)
   - Set up 3D Secure for cards
   - Monitor unusual UPI patterns

4. **Optimize Checkout**
   - Show most popular method first
   - Use Stripe's automatic detection
   - Minimize form fields

---

## 🔗 Useful Links

- [Stripe Payment Methods Documentation](https://stripe.com/docs/payments/payment-methods)
- [UPI Payments Guide](https://stripe.com/docs/payments/upi)
- [PayPal Integration](https://stripe.com/docs/payments/paypal)
- [Testing Payments](https://stripe.com/docs/testing)
- [Stripe Dashboard](https://dashboard.stripe.com)

---

## ❓ FAQ

**Q: Why don't I see UPI option in checkout?**
- Ensure UPI is enabled in Stripe Dashboard
- Check if customer is in India (Stripe detects location)
- Verify your Stripe account supports India

**Q: Can I accept UPI for recurring subscriptions?**
- Not yet. UPI doesn't support automatic recurring billing
- Use cards for subscriptions, UPI for one-time payments
- Alternatively, collect UPI mandate (advanced setup required)

**Q: How do I know which payment method a customer used?**
- Check Stripe Dashboard → Payments → Click on transaction
- Or use webhook event `payment_intent.succeeded` → `payment_method_types`

**Q: Do I need a separate Indian bank account for UPI?**
- Yes, Stripe requires an Indian bank account for UPI settlements
- Must be registered as an Indian business

**Q: Can I disable certain payment methods for specific plans?**
- Yes! Modify the `createCheckoutSession` function to accept payment method array as parameter
- Pass different arrays based on plan type

---

## 🚀 Next Steps

1. ✅ **Code Updated** - Multiple payment methods enabled
2. ⚠️ **Action Required** - Enable payment methods in Stripe Dashboard
3. 🧪 **Test** - Try each payment method in test mode
4. 📝 **Update UI** - Add payment method icons to pricing page
5. 🌍 **Go Live** - Switch to live mode and complete verification

---

**Need Help?**
- Stripe Support: [https://support.stripe.com](https://support.stripe.com)
- Stripe Discord: [https://discord.gg/stripe](https://discord.gg/stripe)
- Documentation: [https://stripe.com/docs](https://stripe.com/docs)
