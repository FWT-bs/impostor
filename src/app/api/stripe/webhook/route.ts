import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import type Stripe from "stripe";

// Disable body parsing — we need the raw body for signature verification
export const dynamic = "force-dynamic";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

type AdminClient = ReturnType<typeof createAdminClient>;
type StripeReference = string | { id: string } | null | undefined;

function getStripeId(value: StripeReference): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function unixToIso(value: unknown): string | null {
  return typeof value === "number" ? new Date(value * 1000).toISOString() : null;
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription): string | null {
  const directEnd = (subscription as unknown as { current_period_end?: unknown })
    .current_period_end;
  const itemEnd = (
    subscription.items.data[0] as unknown as { current_period_end?: unknown } | undefined
  )?.current_period_end;

  return unixToIso(directEnd) ?? unixToIso(itemEnd);
}

async function syncSubscriptionToProfile(
  admin: AdminClient,
  subscription: Stripe.Subscription,
) {
  const customerId = getStripeId(subscription.customer);
  if (!customerId) {
    throw new Error(`Subscription ${subscription.id} is missing a customer`);
  }

  const userId = subscription.metadata?.supabase_user_id;
  const isActive = ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status);
  const values = {
    stripe_customer_id: customerId,
    is_premium: isActive,
    premium_until: isActive ? getCurrentPeriodEnd(subscription) : null,
  };

  const query = admin.from("profiles").update(values);
  const { error } = userId
    ? await query.eq("id", userId)
    : await query.eq("stripe_customer_id", customerId);

  if (error) {
    throw new Error(
      `Failed to sync subscription ${subscription.id}: ${error.message}`,
    );
  }

  console.log(
    `[stripe/webhook] Subscription ${subscription.id} synced: active=${isActive}`,
  );
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const parentSubscription = invoice.parent?.subscription_details?.subscription;
  const legacySubscription = (invoice as unknown as { subscription?: StripeReference })
    .subscription;

  return getStripeId(parentSubscription) ?? getStripeId(legacySubscription);
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[stripe/webhook] Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe/webhook] Signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const customerId = getStripeId(session.customer);
      const subscriptionId = getStripeId(session.subscription);

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncSubscriptionToProfile(admin, subscription);
      } else if (userId && customerId) {
        const { error } = await admin
          .from("profiles")
          .update({
            is_premium: true,
            stripe_customer_id: customerId,
          })
          .eq("id", userId);
        if (error) {
          throw new Error(
            `Failed to activate premium for ${userId}: ${error.message}`,
          );
        }
        console.log(`[stripe/webhook] Premium activated for user ${userId}`);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscriptionToProfile(admin, subscription);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscriptionToProfile(admin, subscription);
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = getInvoiceSubscriptionId(invoice);

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncSubscriptionToProfile(admin, subscription);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = getStripeId(invoice.customer);

      if (customerId) {
        console.warn(
          `[stripe/webhook] Payment failed for customer ${customerId}`,
        );
        // Don't revoke immediately — Stripe retries. Revoke on subscription.deleted.
      }
      break;
    }

    default:
      // Unhandled event type — ignore
      break;
  }

  return NextResponse.json({ received: true });
}
