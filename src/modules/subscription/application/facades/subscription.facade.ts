import {
  GetPricingPlansUseCase,
  PricingPlanResponse,
} from "../use-cases/GetPricingPlans.use-case";
import {
  GetPricingTiersUseCase,
  PricingTierResponse,
} from "../use-cases/GetPricingTiers.use-case";
import {
  CalculateSubscriptionPriceUseCase,
  CalculatePriceInput,
  CalculatePriceOutput,
} from "../use-cases/CalculateSubscriptionPrice.use-case";
import {
  CreateSubscriptionUseCase,
  CreateSubscriptionInput,
  CreateSubscriptionOutput,
} from "../use-cases/CreateSubscription.use-case";
import {
  UpdateSubscriptionQuantityUseCase,
  UpdateQuantityInput,
  UpdateQuantityOutput,
} from "../use-cases/UpdateSubscriptionQuantity.use-case";
import {
  CancelSubscriptionUseCase,
  CancelSubscriptionInput,
  CancelSubscriptionOutput,
} from "../use-cases/CancelSubscription.use-case";
import {
  GetSubscriptionUseCase,
  GetSubscriptionInput,
  SubscriptionDetailOutput,
} from "../use-cases/GetSubscription.use-case";
import {
  SyncPlansWithStripeUseCase,
  SyncPlansWithStripeOutput,
} from "../use-cases/SyncPlansWithStripe.use-case";
import {
  GetPaymentConfirmationUseCase,
  GetPaymentConfirmationInput,
  GetPaymentConfirmationOutput,
} from "../use-cases/GetPaymentConfirmation.use-case";
import {
  GetBillingPortalLinkUseCase,
  GetBillingPortalLinkInput,
  GetBillingPortalLinkOutput,
} from "../use-cases/GetBillingPortalLink.use-case";
import {
  CheckBillingAccessUseCase,
  CheckBillingAccessInput,
  CheckBillingAccessOutput,
} from "../use-cases/CheckBillingAccess.use-case";

export class SubscriptionFacade {
  constructor(
    private readonly getPricingPlansUseCase: GetPricingPlansUseCase,
    private readonly getPricingTiersUseCase: GetPricingTiersUseCase,
    private readonly calculateSubscriptionPriceUseCase: CalculateSubscriptionPriceUseCase,
    private readonly createSubscriptionUseCase: CreateSubscriptionUseCase,
    private readonly updateSubscriptionQuantityUseCase: UpdateSubscriptionQuantityUseCase,
    private readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase,
    private readonly getSubscriptionUseCase: GetSubscriptionUseCase,
    private readonly syncPlansWithStripeUseCase: SyncPlansWithStripeUseCase,
    private readonly getPaymentConfirmationUseCase: GetPaymentConfirmationUseCase,
    private readonly getBillingPortalLinkUseCase: GetBillingPortalLinkUseCase,
    private readonly checkBillingAccessUseCase: CheckBillingAccessUseCase,
  ) {}

  async getPricingPlans(): Promise<PricingPlanResponse[]> {
    try {
      return await this.getPricingPlansUseCase.execute();
    } catch (error) {
      throw error;
    }
  }

  async getPricingTiers(
    planId: string,
    billingPeriod: "monthly" | "annual",
  ): Promise<PricingTierResponse[]> {
    try {
      return await this.getPricingTiersUseCase.execute({
        planId,
        billingPeriod,
      });
    } catch (error) {
      throw error;
    }
  }

  async calculatePrice(
    input: CalculatePriceInput,
  ): Promise<CalculatePriceOutput> {
    try {
      return await this.calculateSubscriptionPriceUseCase.execute(input);
    } catch (error) {
      throw error;
    }
  }

  async createSubscription(
    input: CreateSubscriptionInput,
  ): Promise<CreateSubscriptionOutput> {
    try {
      return await this.createSubscriptionUseCase.execute(input);
    } catch (error) {
      throw error;
    }
  }

  async updateQuantity(
    input: UpdateQuantityInput,
  ): Promise<UpdateQuantityOutput> {
    try {
      return await this.updateSubscriptionQuantityUseCase.execute(input);
    } catch (error) {
      throw error;
    }
  }

  async cancelSubscription(
    input: CancelSubscriptionInput,
  ): Promise<CancelSubscriptionOutput> {
    try {
      return await this.cancelSubscriptionUseCase.execute(input);
    } catch (error) {
      throw error;
    }
  }

  async getSubscription(
    input: GetSubscriptionInput,
  ): Promise<SubscriptionDetailOutput | null> {
    try {
      return await this.getSubscriptionUseCase.execute(input);
    } catch (error) {
      throw error;
    }
  }

  async syncPlansWithStripe(): Promise<SyncPlansWithStripeOutput> {
    try {
      return await this.syncPlansWithStripeUseCase.execute();
    } catch (error) {
      throw error;
    }
  }

  async getPaymentConfirmation(
    input: GetPaymentConfirmationInput,
  ): Promise<GetPaymentConfirmationOutput> {
    try {
      return await this.getPaymentConfirmationUseCase.execute(input);
    } catch (error) {
      throw error;
    }
  }

  async getBillingPortalLink(
    input: GetBillingPortalLinkInput,
  ): Promise<GetBillingPortalLinkOutput> {
    try {
      return await this.getBillingPortalLinkUseCase.execute(input);
    } catch (error) {
      throw error;
    }
  }

  async checkBillingAccess(
    input: CheckBillingAccessInput,
  ): Promise<CheckBillingAccessOutput> {
    try {
      return await this.checkBillingAccessUseCase.execute(input);
    } catch (error) {
      throw error;
    }
  }
}
