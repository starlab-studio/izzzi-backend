export interface ISubscriptionPlan {
  readonly id: string;
  name: string;
  displayPrice: string;
  priceSubtext: string | null;
  basePriceCents: number;
  trialPeriodDays: number;
  isFree: boolean;
  variant: "default" | "premium";
  isActive: boolean;
  displayOrder: number;
  stripeProductId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlanFeature {
  readonly id: string;
  planId: string;
  featureText: string;
  featureSubtext: string | null;
  section: "main" | "additional";
  displayOrder: number;
  isComingSoon: boolean;
  createdAt: Date;
}

export interface IPricingTier {
  readonly id: string;
  planId: string;
  billingPeriod: "monthly" | "annual";
  minClasses: number;
  maxClasses: number;
  pricePerClassCents: number;
  stripePriceId: string | null;
  createdAt: Date;
}

export interface IUserSubscription {
  readonly id: string;
  userId: string;
  organizationId: string;
  planId: string;
  billingPeriod: "monthly" | "annual";
  quantity: number;
  pendingQuantity: number | null;
  status:
    | "trial"
    | "active"
    | "past_due"
    | "cancelled"
    | "expired"
    | "pending"
    | "failed";
  trialStartDate: Date | null;
  trialEndDate: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelledAt: Date | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInvoice {
  readonly id: string;
  userId: string;
  organizationId: string;
  subscriptionId: string | null;
  stripeInvoiceId: string;
  stripeCustomerId: string;
  invoiceNumber: string | null;
  amountCents: number;
  taxCents: number;
  currency: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  pdfUrl: string | null;
  hostedInvoiceUrl: string | null;
  issuedAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
}

export interface SubscriptionActivatedPayload {
  subscriptionId: string;
  organizationId: string;
  planId: string;
  planName: string;
}

export type ISubscriptionActivatedEvent =
  import("src/core").IDomainEvent<SubscriptionActivatedPayload>;

export interface SubscriptionUpgradedPayload {
  userId: string;
  userEmail: string;
  organizationId: string;
  planName: string;
  previousQuantity: number;
  newQuantity: number;
  previousPriceCents: number;
  newPriceCents: number;
}

export type ISubscriptionUpgradedEvent =
  import("src/core").IDomainEvent<SubscriptionUpgradedPayload>;

export interface TrialEndingSoonPayload {
  organizationId: string;
  trialEndDate: Date;
  planName: string;
  adminEmails: string[];
}

export type ITrialEndingSoonEvent =
  import("src/core").IDomainEvent<TrialEndingSoonPayload>;
