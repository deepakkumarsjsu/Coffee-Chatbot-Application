// Stripe configuration
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string;

// Backend API endpoint for creating payment intents
// Use relative path to go through Vite proxy, or full URL if backend is on different domain
const PAYMENT_API_URL = import.meta.env.VITE_PAYMENT_API_URL || '/api/payments';

// Validate Stripe config
if (!STRIPE_PUBLISHABLE_KEY) {
  // Stripe publishable key is missing - payment features will not work
}

export { STRIPE_PUBLISHABLE_KEY, PAYMENT_API_URL };

