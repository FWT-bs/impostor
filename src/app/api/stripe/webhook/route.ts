import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import type Stripe from "stripe";

// Disable body parsing — we need the raw body for signature verification
export const dynamic = "force-dynamic";

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
      if (userId) {
        await admin
          .from("profiles")
          .update({
            is_premium: true,
            stripe_customer_id: session.customer as string,
          })
          .eq("id", userId);
        console.log(`[stripe/webhook] Premium activated for user ${userId}`);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const isActive =
        subscription.status === "active" ||
        subscription.status === "trialing";

      // current_period_end may be on the subscription object or items
      const rawEnd = (subscription as unknown as Record<string, unknown>)
        .current_period_end as number | undefined;
      const periodEnd = rawEnd
        ? new Date(rawEnd * 1000).toISOString()
        : null;

      await admin
        .from("profiles")
        .update({
          is_premium: isActive,
          premium_until: periodEnd,
        })
        .eq("stripe_customer_id", customerId);

      console.log(
        `[stripe/webhook] Subscription ${subscription.id} updated: active=${isActive}`,
      );
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      await admin
        .from("profiles")
        .update({ is_premium: false, premium_until: null })
        .eq("stripe_customer_id", customerId);

      console.log(
        `[stripe/webhook] Subscription ${subscription.id} canceled — premium revoked`,
      );
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;

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
