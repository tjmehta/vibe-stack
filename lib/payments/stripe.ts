import { fetchMutation } from "convex/nextjs"
import Stripe from "stripe"

import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
})

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
) {
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  const userId = session.client_reference_id

  if (!userId) {
    console.error("[WEBHOOK] No user ID found in checkout session")
    return
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscriptionId,
    {
      expand: ["items.data.price.product"],
    },
  )

  const plan = stripeSubscription.items.data[0]?.price
  const productId = (plan?.product as Stripe.Product).id
  const planName = (plan?.product as Stripe.Product).name

  try {
    await fetchMutation(api.subscriptions.updateSubscription, {
      userId: userId as Id<"users">,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripeProductId: productId,
      planName,
      subscriptionStatus: stripeSubscription.status,
    })
  } catch (error) {
    console.error("[WEBHOOK] Failed to update subscription:", error)
    throw error
  }
}

export async function handleSubscriptionChange(
  stripeSubscription: Stripe.Subscription,
) {
  const customerId = stripeSubscription.customer as string
  const subscriptionId = stripeSubscription.id
  const status = stripeSubscription.status
  const userId = stripeSubscription.metadata.userId

  if (!userId) {
    console.error("[WEBHOOK] No user ID found in subscription metadata")
    return
  }

  const plan = stripeSubscription.items.data[0]?.price
  const productId = (plan?.product as Stripe.Product)?.id || ""
  const planName = (plan?.product as Stripe.Product)?.name || "Pro Plan"

  try {
    await fetchMutation(api.subscriptions.updateSubscription, {
      userId: userId as Id<"users">,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripeProductId: productId,
      planName,
      subscriptionStatus: status,
    })
  } catch (error) {
    console.error("[WEBHOOK] Failed to update subscription:", error)
    throw error
  }
}

export async function getStripePrices() {
  const prices = await stripe.prices.list({
    expand: ["data.product"],
    active: true,
    type: "recurring",
  })

  return prices.data.map((price) => ({
    id: price.id,
    productId:
      typeof price.product === "string" ? price.product : price.product.id,
    unitAmount: price.unit_amount,
    currency: price.currency,
    interval: price.recurring?.interval,
    trialPeriodDays: price.recurring?.trial_period_days,
  }))
}
