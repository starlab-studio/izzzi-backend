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
  createdAt: Date;
}

export interface IPricingTier {
  readonly id: string;
  planId: string;
  billingPeriod: "monthly" | "annual";
  minClasses: number;
  maxClasses: number;
  pricePerClassCents: number;
  createdAt: Date;
}

export interface IUserSubscription {
  readonly id: string;
  userId: string;
  organizationId: string;
  planId: string;
  billingPeriod: "monthly" | "annual";
  status: "trial" | "active" | "past_due" | "cancelled" | "expired";
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

