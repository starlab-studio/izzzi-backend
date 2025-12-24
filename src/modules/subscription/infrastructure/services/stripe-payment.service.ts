import { Injectable } from "@nestjs/common";
import { IPaymentService } from "../../domain/services/payment.service";
import { StripeSyncService } from "src/modules/payment/infrastructure/services/stripe-sync.service";

@Injectable()
export class StripePaymentService implements IPaymentService {
  constructor(private readonly stripeSyncService: StripeSyncService) {}

  async getOrCreateCustomer(
    organizationId: string,
    email: string,
    name: string
  ): Promise<string> {
    return this.stripeSyncService.getOrCreateCustomer(
      organizationId,
      email,
      name
    );
  }

  async createSubscription(params: {
    customerId: string;
    priceId: string;
    quantity: number;
    trialDays?: number;
    metadata?: Record<string, string>;
  }): Promise<{
    subscriptionId: string;
    clientSecret: string | null;
    status: string;
  }> {
    return this.stripeSyncService.createSubscription(params);
  }
}
