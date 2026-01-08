import { Entity, Column, PrimaryColumn, Index } from "typeorm";
import { IInvoice } from "../../domain/types";

@Entity({ name: "invoices" })
@Index(["stripeInvoiceId"], { unique: true })
export class InvoiceModel implements IInvoice {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ name: "organization_id", type: "uuid" })
  organizationId: string;

  @Column({ name: "subscription_id", type: "uuid", nullable: true })
  subscriptionId: string | null;

  @Column({
    name: "stripe_invoice_id",
    type: "varchar",
    length: 255,
    unique: true,
  })
  stripeInvoiceId: string;

  @Column({ name: "stripe_customer_id", type: "varchar", length: 255 })
  stripeCustomerId: string;

  @Column({
    name: "invoice_number",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  invoiceNumber: string | null;

  @Column({ name: "amount_cents", type: "integer" })
  amountCents: number;

  @Column({ name: "tax_cents", type: "integer", default: 0 })
  taxCents: number;

  @Column({ type: "varchar", length: 3, default: "EUR" })
  currency: string;

  @Column({
    type: "enum",
    enum: ["draft", "open", "paid", "void", "uncollectible"],
  })
  status: "draft" | "open" | "paid" | "void" | "uncollectible";

  @Column({ name: "pdf_url", type: "varchar", length: 500, nullable: true })
  pdfUrl: string | null;

  @Column({
    name: "hosted_invoice_url",
    type: "varchar",
    length: 500,
    nullable: true,
  })
  hostedInvoiceUrl: string | null;

  @Column({ name: "issued_at", type: "timestamp", nullable: true })
  issuedAt: Date | null;

  @Column({ name: "paid_at", type: "timestamp", nullable: true })
  paidAt: Date | null;

  @Column({ name: "created_at", type: "timestamp" })
  createdAt: Date;
}
