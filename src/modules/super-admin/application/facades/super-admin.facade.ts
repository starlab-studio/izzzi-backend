import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OrganizationModel } from "src/modules/organization/infrastructure/models/organization.model";
import { UserModel } from "src/modules/organization/infrastructure/models/user.model";
import { MembershipModel } from "src/modules/organization/infrastructure/models/membership.model";
import { SubscriptionPlanModel } from "src/modules/subscription/infrastructure/models/subscription-plan.model";
import { UserSubscriptionModel } from "src/modules/subscription/infrastructure/models/user-subscription.model";
import { PlanFeatureModel } from "src/modules/subscription/infrastructure/models/plan-feature.model";
import { PricingTierModel } from "src/modules/subscription/infrastructure/models/pricing-tier.model";
import { ClassModel } from "src/modules/class/infrastructure/models/class.model";
import type { IContactRequestRepository } from "src/modules/contact/domain/repositories/contact-request.repository";
import { ContactRequestStatus } from "src/modules/contact/domain/types";

@Injectable()
export class SuperAdminFacade {
  constructor(
    @InjectRepository(OrganizationModel)
    private readonly organizationRepository: Repository<OrganizationModel>,
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
    @InjectRepository(MembershipModel)
    private readonly membershipRepository: Repository<MembershipModel>,
    @InjectRepository(SubscriptionPlanModel)
    private readonly planRepository: Repository<SubscriptionPlanModel>,
    @InjectRepository(UserSubscriptionModel)
    private readonly subscriptionRepository: Repository<UserSubscriptionModel>,
    @InjectRepository(PlanFeatureModel)
    private readonly featureRepository: Repository<PlanFeatureModel>,
    @InjectRepository(PricingTierModel)
    private readonly tierRepository: Repository<PricingTierModel>,
    @InjectRepository(ClassModel)
    private readonly classRepository: Repository<ClassModel>,
    @Inject("IContactRequestRepository")
    private readonly contactRequestRepository: IContactRequestRepository
  ) {}

  async getDashboardStats() {
    const [
      totalOrganizations,
      totalUsers,
      totalClasses,
      activeSubscriptions,
      pendingContacts,
    ] = await Promise.all([
      this.organizationRepository.count(),
      this.userRepository.count(),
      this.classRepository.count(),
      this.subscriptionRepository.count({ where: { status: "active" } }),
      this.contactRequestRepository.findAll({ status: ContactRequestStatus.PENDING }),
    ]);

    const subscriptions = await this.subscriptionRepository.find({
      where: { status: "active" },
    });

    let mrr = 0;

    if (subscriptions.length > 0) {
      const planIds = [...new Set(subscriptions.map((s) => s.planId))];
      const plans = await this.planRepository.find({
        where: planIds.map((id) => ({ id })),
        select: ["id", "isFree"],
      });
      const plansMap = new Map<string, boolean>();
      plans.forEach((p) => plansMap.set(p.id, p.isFree));

      const subscriptionPlanPeriods = subscriptions.map((s) => ({
        planId: s.planId,
        billingPeriod: s.billingPeriod,
      }));
      const uniquePlanPeriods = Array.from(
        new Map(
          subscriptionPlanPeriods.map((sp) => [
            `${sp.planId}-${sp.billingPeriod}`,
            sp,
          ])
        ).values()
      );

      const tiersMap = new Map<string, PricingTierModel[]>();
      for (const { planId, billingPeriod } of uniquePlanPeriods) {
        const isFree = plansMap.get(planId);
        if (!isFree) {
          const tiers = await this.tierRepository.find({
            where: { planId, billingPeriod },
          });
          tiersMap.set(`${planId}-${billingPeriod}`, tiers);
        }
      }

      for (const subscription of subscriptions) {
        const isFree = plansMap.get(subscription.planId);
        if (isFree) continue;

        const tiers = tiersMap.get(
          `${subscription.planId}-${subscription.billingPeriod}`
        );
        if (!tiers || tiers.length === 0) continue;

        const tier = tiers.find(
          (t) =>
            subscription.quantity >= t.minClasses &&
            subscription.quantity <= t.maxClasses
        );

        if (tier) {
          const monthlyRevenue = tier.pricePerClassCents * subscription.quantity;
          mrr += monthlyRevenue;
        }
      }
    }

    const arr = mrr * 12;

    return {
      totalOrganizations,
      totalUsers,
      totalClasses,
      activeSubscriptions,
      pendingContactRequests: pendingContacts.total,
      mrr: Math.round(mrr),
      arr: Math.round(arr),
    };
  }

  async getOrganizations(input: {
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    const limit = input.limit || 20;
    const offset = input.offset || 0;

    const queryBuilder = this.organizationRepository
      .createQueryBuilder("org")
      .leftJoinAndSelect("org.memberships", "membership")
      .leftJoinAndSelect("membership.user", "user");

    if (input.search) {
      queryBuilder.where("org.name ILIKE :search", {
        search: `%${input.search}%`,
      });
    }

    queryBuilder
      .orderBy("org.createdAt", "DESC")
      .take(limit)
      .skip(offset);

    const [organizations, total] = await queryBuilder.getManyAndCount();

    const data = organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      membersCount: org.memberships?.length || 0,
      createdAt: org.createdAt,
    }));

    return { data, total, limit, offset };
  }

  async getOrganizationDetails(id: string) {
    const organization = await this.organizationRepository.findOne({
      where: { id },
      relations: ["memberships", "memberships.user"],
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { organizationId: id },
      order: { createdAt: "DESC" },
    });

    let planName: string | null = null;
    let totalPriceCents = 0;

    if (subscription) {
      const plan = await this.planRepository.findOne({
        where: { id: subscription.planId },
        select: ["id", "name", "isFree"],
      });
      planName = plan?.name || null;

      if (plan && !plan.isFree) {
        const tiers = await this.tierRepository.find({
          where: {
            planId: subscription.planId,
            billingPeriod: subscription.billingPeriod,
          },
        });

        if (tiers.length > 0) {
          const tier = tiers.find(
            (t) =>
              subscription.quantity >= t.minClasses &&
              subscription.quantity <= t.maxClasses
          );

          if (tier) {
            totalPriceCents = tier.pricePerClassCents * subscription.quantity;
            if (subscription.billingPeriod === "annual") {
              totalPriceCents = totalPriceCents * 12;
            }
          }
        }
      }
    }

    const classesCount = await this.classRepository.count({
      where: { organizationId: id },
    });

    const members = organization.memberships?.map((m) => ({
      id: m.id,
      userId: m.userId,
      firstName: m.user?.firstName,
      lastName: m.user?.lastName,
      email: m.user?.email,
      role: m.role,
      status: m.status,
      createdAt: m.createdAt,
    })) || [];

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      siren: organization.siren,
      siret: organization.siret,
      vatNumber: organization.vatNumber,
      createdAt: organization.createdAt,
      members,
      membersCount: members.length,
      classesCount,
      subscription: subscription
        ? {
            id: subscription.id,
            planName,
            status: subscription.status,
            quantity: subscription.quantity,
            billingPeriod: subscription.billingPeriod,
            totalPriceCents,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
          }
        : null,
    };
  }

  async getPlans() {
    const plans = await this.planRepository.find({
      order: { displayOrder: "ASC" },
    });

    const planIds = plans.map((p) => p.id);
    
    const featuresCountMap = new Map<string, number>();
    const tiersCountMap = new Map<string, number>();
    
    if (planIds.length > 0) {
      const featuresCounts = await this.featureRepository
        .createQueryBuilder("f")
        .select("f.planId", "planId")
        .addSelect("COUNT(*)", "count")
        .where("f.planId IN (:...planIds)", { planIds })
        .groupBy("f.planId")
        .getRawMany();
      
      featuresCounts.forEach((fc) => {
        featuresCountMap.set(fc.planId, parseInt(fc.count, 10));
      });

      const tiersCounts = await this.tierRepository
        .createQueryBuilder("t")
        .select("t.planId", "planId")
        .addSelect("COUNT(*)", "count")
        .where("t.planId IN (:...planIds)", { planIds })
        .groupBy("t.planId")
        .getRawMany();
      
      tiersCounts.forEach((tc) => {
        tiersCountMap.set(tc.planId, parseInt(tc.count, 10));
      });
    }

    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      displayPrice: plan.displayPrice,
      priceSubtext: plan.priceSubtext,
      basePriceCents: plan.basePriceCents,
      trialPeriodDays: plan.trialPeriodDays,
      isFree: plan.isFree,
      variant: plan.variant,
      isActive: plan.isActive,
      displayOrder: plan.displayOrder,
      featuresCount: featuresCountMap.get(plan.id) || 0,
      pricingTiersCount: tiersCountMap.get(plan.id) || 0,
      createdAt: plan.createdAt,
    }));
  }

  async getSubscriptions(input: {
    limit?: number;
    offset?: number;
    status?: string;
  }) {
    const limit = input.limit || 20;
    const offset = input.offset || 0;

    const queryBuilder = this.subscriptionRepository
      .createQueryBuilder("sub");

    if (input.status) {
      queryBuilder.where("sub.status = :status", { status: input.status });
    }

    queryBuilder
      .orderBy("sub.createdAt", "DESC")
      .take(limit)
      .skip(offset);

    const [subscriptions, total] = await queryBuilder.getManyAndCount();

    const orgIds = [...new Set(subscriptions.map((s) => s.organizationId))];
    const planIds = [...new Set(subscriptions.map((s) => s.planId))];

    const orgsMap = new Map<string, string>();
    const plansMap = new Map<string, { name: string; isFree: boolean }>();

    if (orgIds.length > 0) {
      const orgs = await this.organizationRepository.find({
        where: orgIds.map((id) => ({ id })),
        select: ["id", "name"],
      });
      orgs.forEach((o) => orgsMap.set(o.id, o.name));
    }

    if (planIds.length > 0) {
      const plans = await this.planRepository.find({
        where: planIds.map((id) => ({ id })),
        select: ["id", "name", "isFree"],
      });
      plans.forEach((p) => plansMap.set(p.id, { name: p.name, isFree: p.isFree }));
    }

    const subscriptionPlanIds = subscriptions.map((s) => ({
      planId: s.planId,
      billingPeriod: s.billingPeriod,
    }));
    const uniquePlanPeriods = Array.from(
      new Map(
        subscriptionPlanIds.map((sp) => [
          `${sp.planId}-${sp.billingPeriod}`,
          sp,
        ])
      ).values()
    );

    const tiersMap = new Map<string, PricingTierModel[]>();
    for (const { planId, billingPeriod } of uniquePlanPeriods) {
      const tiers = await this.tierRepository.find({
        where: { planId, billingPeriod },
      });
      tiersMap.set(`${planId}-${billingPeriod}`, tiers);
    }

    const data = subscriptions.map((sub) => {
      let totalPriceCents = 0;
      const plan = plansMap.get(sub.planId);

      if (plan && !plan.isFree) {
        const tiers = tiersMap.get(`${sub.planId}-${sub.billingPeriod}`) || [];
        const tier = tiers.find(
          (t) => sub.quantity >= t.minClasses && sub.quantity <= t.maxClasses
        );

        if (tier) {
          totalPriceCents = tier.pricePerClassCents * sub.quantity;
          if (sub.billingPeriod === "annual") {
            totalPriceCents = totalPriceCents * 12;
          }
        }
      }

      return {
        id: sub.id,
        organizationId: sub.organizationId,
        organizationName: orgsMap.get(sub.organizationId) || "N/A",
        planName: plan?.name || "N/A",
        status: sub.status,
        quantity: sub.quantity,
        billingPeriod: sub.billingPeriod,
        totalPriceCents,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        createdAt: sub.createdAt,
      };
    });

    return { data, total, limit, offset };
  }
}

