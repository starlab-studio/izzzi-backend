import { IUseCase, ILoggerService, BaseUseCase } from "src/core";
import { ISubscriptionPlanRepository } from "../../domain/repositories/subscription-plan.repository";
import { IPlanFeatureRepository } from "../../domain/repositories/plan-feature.repository";

export interface PricingPlanResponse {
  id: string;
  name: string;
  title: string;
  badge: string;
  price: string;
  priceSubtext: string;
  ctaText: string;
  features: Array<{
    text: string;
    subtext?: string;
  }>;
  additionalSection?: {
    title: string;
    features: Array<{
      text: string;
      subtext?: string;
    }>;
  };
  detailsButtonText: string;
  variant: "default" | "premium";
}

export class GetPricingPlansUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly subscriptionPlanRepository: ISubscriptionPlanRepository,
    private readonly planFeatureRepository: IPlanFeatureRepository,
  ) {
    super(logger);
  }

  async execute(): Promise<PricingPlanResponse[]> {
    try {
      const plans = await this.subscriptionPlanRepository.findAllActive();

      const plansWithFeatures = await Promise.all(
        plans.map(async (plan) => {
          const features = await this.planFeatureRepository.findByPlanId(
            plan.id,
          );

          const mainFeatures = features
            .filter((f) => f.section === "main")
            .map((f) => ({
              text: f.featureText,
              subtext: f.featureSubtext || undefined,
            }));

          const additionalFeatures = features
            .filter((f) => f.section === "additional")
            .sort((a, b) => a.displayOrder - b.displayOrder);

          const displayValues = this.getDisplayValues(plan.name);

          const response: PricingPlanResponse = {
            id: plan.id,
            name: plan.name,
            title: displayValues.title,
            badge: displayValues.badge,
            price: plan.displayPrice,
            priceSubtext: plan.priceSubtext || "",
            ctaText: displayValues.ctaText,
            features: mainFeatures,
            detailsButtonText: "Voir les détails du plan",
            variant: plan.variant,
          };

          if (additionalFeatures.length > 0) {
            const titleFeature = additionalFeatures.find(
              (f) => f.displayOrder === 1,
            );
            const featureItems = additionalFeatures.filter(
              (f) => f.displayOrder > 1,
            );

            if (titleFeature && featureItems.length > 0) {
              response.additionalSection = {
                title: titleFeature.featureText,
                features: featureItems.map((f) => ({
                  text: f.featureText,
                  subtext: f.featureSubtext || undefined,
                })),
              };
            }
          }

          return response;
        }),
      );

      return plansWithFeatures;
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}

  private getDisplayValues(planName: string): {
    title: string;
    badge: string;
    ctaText: string;
  } {
    switch (planName) {
      case "izzzi":
        return {
          title: "Izzzi",
          badge: "👌🏻 Izzzi",
          ctaText: "Démarrer mes 4 mois gratuits",
        };
      case "super-izzzi":
        return {
          title: "Super Izzzi",
          badge: "🙌 Super Izzzi",
          ctaText: "Je passe en mode illimité",
        };
      default:
        return {
          title: planName,
          badge: planName,
          ctaText: "Choisir ce plan",
        };
    }
  }
}
