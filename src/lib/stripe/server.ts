import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Missing STRIPE_SECRET_KEY. Add it to your environment variables.",
    );
  }

  stripeInstance = new Stripe(key, { apiVersion: "2025-03-31.basil" });
  return stripeInstance;
}

export function getStripePriceId(): string {
  const id = process.env.STRIPE_PREMIUM_PRICE_ID;
  if (!id) {
    throw new Error(
      "Missing STRIPE_PREMIUM_PRICE_ID. Create a price in Stripe and add it to env.",
    );
  }
  return id;
}
