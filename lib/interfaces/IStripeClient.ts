import type Stripe from "stripe"

export interface IStripeClient {
  constructEvent(payload: string, sig: string, secret: string): Stripe.Event
  retrieveSubscription(id: string): Promise<Stripe.Subscription>
  retrieveCharge(id: string): Promise<Stripe.Charge>
  cancelSubscription(id: string): Promise<Stripe.Subscription>
  updateSubscription(id: string, params: Stripe.SubscriptionUpdateParams): Promise<Stripe.Subscription>
  createCheckoutSession(params: Stripe.Checkout.SessionCreateParams): Promise<Stripe.Checkout.Session>
  createPortalSession(params: Stripe.BillingPortal.SessionCreateParams): Promise<Stripe.BillingPortal.Session>
  listCustomers(params: Stripe.CustomerListParams): Promise<Stripe.ApiList<Stripe.Customer>>
  createCustomer(params: Stripe.CustomerCreateParams): Promise<Stripe.Customer>
  createRefund(params: Stripe.RefundCreateParams): Promise<Stripe.Refund>
}
