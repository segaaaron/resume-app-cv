import { stripe } from "@/lib/stripe"
import type { IStripeClient } from "@/lib/interfaces/IStripeClient"
import type Stripe from "stripe"

export class StripeClientAdapter implements IStripeClient {
  constructEvent(payload: string, sig: string, secret: string): Stripe.Event {
    return stripe!.webhooks.constructEvent(payload, sig, secret)
  }
  async retrieveSubscription(id: string): Promise<Stripe.Subscription> {
    return stripe!.subscriptions.retrieve(id, { expand: ["items"] })
  }
  async retrieveCharge(id: string): Promise<Stripe.Charge> {
    return stripe!.charges.retrieve(id)
  }
  async cancelSubscription(id: string): Promise<Stripe.Subscription> {
    return stripe!.subscriptions.cancel(id)
  }
  async updateSubscription(id: string, params: Stripe.SubscriptionUpdateParams): Promise<Stripe.Subscription> {
    return stripe!.subscriptions.update(id, params)
  }
  async createCheckoutSession(params: Stripe.Checkout.SessionCreateParams): Promise<Stripe.Checkout.Session> {
    return stripe!.checkout.sessions.create(params)
  }
  async createPortalSession(params: Stripe.BillingPortal.SessionCreateParams): Promise<Stripe.BillingPortal.Session> {
    return stripe!.billingPortal.sessions.create(params)
  }
  async listCustomers(params: Stripe.CustomerListParams): Promise<Stripe.ApiList<Stripe.Customer>> {
    return stripe!.customers.list(params)
  }
  async createCustomer(params: Stripe.CustomerCreateParams): Promise<Stripe.Customer> {
    return stripe!.customers.create(params)
  }
  async createRefund(params: Stripe.RefundCreateParams): Promise<Stripe.Refund> {
    return stripe!.refunds.create(params)
  }
  async retrieveBalance(): Promise<Stripe.Balance> {
    return stripe!.balance.retrieve()
  }
  async listCharges(params: Stripe.ChargeListParams): Promise<Stripe.ApiList<Stripe.Charge>> {
    return stripe!.charges.list(params)
  }
  async listDisputes(params: Stripe.DisputeListParams): Promise<Stripe.ApiList<Stripe.Dispute>> {
    return stripe!.disputes.list(params)
  }
  async listSubscriptions(params: Stripe.SubscriptionListParams): Promise<Stripe.ApiList<Stripe.Subscription>> {
    return stripe!.subscriptions.list(params)
  }
}
