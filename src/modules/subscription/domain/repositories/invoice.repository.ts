import { IRepository } from "src/core";
import { InvoiceEntity } from "../entities/invoice.entity";

export interface IInvoiceRepository extends IRepository<InvoiceEntity> {
  findByStripeInvoiceId(stripeInvoiceId: string): Promise<InvoiceEntity | null>;
  findBySubscriptionId(subscriptionId: string): Promise<InvoiceEntity[]>;
  findLatestByOrganizationId(
    organizationId: string
  ): Promise<InvoiceEntity | null>;
}

export const INVOICE_REPOSITORY = Symbol("IInvoiceRepository");
