import { randomUUID } from "crypto";
import { IInvoice } from "../types";
import type { StripeInvoice } from "src/modules/payment/domain/types/stripe.types";

export class InvoiceEntity {
  private props: IInvoice;

  private constructor(props: IInvoice) {
    this.props = props;
  }

  public static create(data: {
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
  }): InvoiceEntity {
    const now = new Date();
    return new InvoiceEntity({
      id: randomUUID(),
      ...data,
      createdAt: now,
    });
  }

  public static reconstitute(data: IInvoice): InvoiceEntity {
    return new InvoiceEntity(data);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get subscriptionId(): string | null {
    return this.props.subscriptionId;
  }

  get stripeInvoiceId(): string {
    return this.props.stripeInvoiceId;
  }

  get stripeCustomerId(): string {
    return this.props.stripeCustomerId;
  }

  get invoiceNumber(): string | null {
    return this.props.invoiceNumber;
  }

  get amountCents(): number {
    return this.props.amountCents;
  }

  get taxCents(): number {
    return this.props.taxCents;
  }

  get currency(): string {
    return this.props.currency;
  }

  get status(): "draft" | "open" | "paid" | "void" | "uncollectible" {
    return this.props.status;
  }

  get pdfUrl(): string | null {
    return this.props.pdfUrl;
  }

  get hostedInvoiceUrl(): string | null {
    return this.props.hostedInvoiceUrl;
  }

  get issuedAt(): Date | null {
    return this.props.issuedAt;
  }

  get paidAt(): Date | null {
    return this.props.paidAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  public static syncFromDomainInvoice(
    stripeInvoice: StripeInvoice,
    userId: string,
    organizationId: string,
    subscriptionId: string | null
  ): InvoiceEntity {
    const invoiceNumber = stripeInvoice.id || null;
    const amountCents = stripeInvoice.amount_due;
    const taxCents = 0;
    const currency = stripeInvoice.currency.toUpperCase();
    const status = stripeInvoice.status;
    const pdfUrl = stripeInvoice.invoice_pdf || null;
    const hostedInvoiceUrl = stripeInvoice.hosted_invoice_url || null;
    const issuedAt = stripeInvoice.created
      ? new Date(stripeInvoice.created * 1000)
      : null;
    const paidAt = stripeInvoice.paid ? new Date(stripeInvoice.paid) : null;

    return InvoiceEntity.create({
      userId,
      organizationId,
      subscriptionId,
      stripeInvoiceId: stripeInvoice.id,
      stripeCustomerId:
        typeof stripeInvoice.customer === "string"
          ? stripeInvoice.customer
          : stripeInvoice.customer.id,
      invoiceNumber,
      amountCents,
      taxCents,
      currency,
      status,
      pdfUrl,
      hostedInvoiceUrl,
      issuedAt,
      paidAt,
    });
  }

  updateFromDomainInvoice(stripeInvoice: StripeInvoice): void {
    this.props.amountCents = stripeInvoice.amount_due;
    this.props.taxCents = 0;
    this.props.status = stripeInvoice.status;
    this.props.pdfUrl = stripeInvoice.invoice_pdf || null;
    this.props.hostedInvoiceUrl = stripeInvoice.hosted_invoice_url || null;
    if (stripeInvoice.paid) {
      this.props.paidAt = new Date(stripeInvoice.paid);
    }
  }

  toPersistence(): IInvoice {
    return { ...this.props };
  }
}
