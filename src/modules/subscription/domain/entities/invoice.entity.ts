import { randomUUID } from "crypto";
import { IInvoice } from "../types";
import Stripe from "stripe";

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

  public static syncFromStripe(
    stripeInvoice: Stripe.Invoice,
    userId: string,
    organizationId: string,
    subscriptionId: string | null
  ): InvoiceEntity {
    const invoiceNumber = stripeInvoice.number || stripeInvoice.id || null;
    const amountCents = stripeInvoice.amount_due;
    const taxCents = stripeInvoice.tax || 0;
    const currency = stripeInvoice.currency.toUpperCase();
    const status = stripeInvoice.status as
      | "draft"
      | "open"
      | "paid"
      | "void"
      | "uncollectible";
    const pdfUrl = stripeInvoice.invoice_pdf || null;
    const hostedInvoiceUrl = stripeInvoice.hosted_invoice_url || null;
    const issuedAt = stripeInvoice.created
      ? new Date(stripeInvoice.created * 1000)
      : null;
    const paidAt =
      stripeInvoice.status === "paid" &&
      stripeInvoice.status_transitions?.paid_at
        ? new Date(stripeInvoice.status_transitions.paid_at * 1000)
        : null;

    return InvoiceEntity.create({
      userId,
      organizationId,
      subscriptionId,
      stripeInvoiceId: stripeInvoice.id,
      stripeCustomerId:
        typeof stripeInvoice.customer === "string"
          ? stripeInvoice.customer
          : stripeInvoice.customer?.id || "",
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

  updateFromStripe(stripeInvoice: Stripe.Invoice): void {
    this.props.amountCents = stripeInvoice.amount_due;
    this.props.taxCents = stripeInvoice.tax || 0;
    this.props.status = stripeInvoice.status as
      | "draft"
      | "open"
      | "paid"
      | "void"
      | "uncollectible";
    this.props.pdfUrl = stripeInvoice.invoice_pdf || null;
    this.props.hostedInvoiceUrl = stripeInvoice.hosted_invoice_url || null;
    if (
      stripeInvoice.status === "paid" &&
      stripeInvoice.status_transitions?.paid_at
    ) {
      this.props.paidAt = new Date(
        stripeInvoice.status_transitions.paid_at * 1000
      );
    }
  }

  toPersistence(): IInvoice {
    return { ...this.props };
  }
}
