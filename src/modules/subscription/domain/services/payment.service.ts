export interface IPaymentService {
  getOrCreateCustomer(
    organizationId: string,
    email: string,
    name: string,
  ): Promise<string>;

  createSubscription(params: {
    customerId: string;
    priceId: string;
    quantity: number;
    trialDays?: number;
    metadata?: Record<string, string>;
  }): Promise<{
    subscriptionId: string;
    clientSecret: string | null;
    status: string;
  }>;
}

export const PAYMENT_SERVICE = Symbol("PAYMENT_SERVICE");
