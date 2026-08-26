import { MilestoneStatus } from './project';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type LineItemSource = 'MILESTONE' | 'CUSTOM';

export interface Money {
  amount: number;
  currencyCode: string;
}

export interface Address {
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  countryCode?: string;
}

export interface BillingParty {
  name: string;
  vatId?: string;
  address?: Address;
  email?: string;
  iban?: string;
  bic?: string;
}

export interface InvoiceLineItem {
  id: string;
  positionNumber: number;
  source: LineItemSource;
  milestoneId?: string;
  description: string;
  quantity: number;
  unitCode: string;
  unitPrice: Money;
  taxRatePercentage: number;
  netAmount: Money;
  taxAmount: Money;
  grossAmount: Money;
}

export interface Invoice {
  id: string;
  invoiceNumber?: string;
  tenantId: string;
  projectId?: string;
  status: InvoiceStatus;
  currencyCode: string;
  issueDate?: string;
  dueDate?: string;
  paymentTermsDays?: number;
  buyerReference?: string;
  seller?: BillingParty;
  buyer?: BillingParty;
  lineItems: InvoiceLineItem[];
  netTotal: Money;
  taxTotal: Money;
  grossTotal: Money;
  documentKey?: string;
  sentToEmail?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Requests ----

export interface LineItemRequest {
  source: LineItemSource;
  milestoneId?: string;
  description?: string;
  quantity?: number;
  unitCode?: string;
  unitPrice?: Money;
  taxRatePercentage?: number;
}

export interface CreateInvoiceRequest {
  tenantId: string;
  projectId?: string;
  buyerReference?: string;
  paymentTermsDays?: number;
  lineItems: LineItemRequest[];
}

export interface IssueInvoiceRequest {
  issueDate?: string;
  sendEmailDirectly?: boolean;
  invoiceEmail?: string;
}

export interface SendInvoiceRequest {
  email?: string;
}

// ---- Prefill ----

export interface MilestoneOption {
  id: string;
  title: string;
  dueDate?: string;
  price?: Money;
  alreadyInvoiced: boolean;
  inDraftInvoice: boolean;
  milestoneStatus: MilestoneStatus;
}

export interface InvoicePrefill {
  suggestedSeller: BillingParty;
  suggestedBuyer: BillingParty;
  buyerDataComplete: boolean;
  suggestedBuyerReference?: string;
  availableMilestones: MilestoneOption[];
}

export interface UpdateInvoiceHeaderRequest {
  buyerReference?: string;
  paymentTermsDays?: number;
}

export interface UpdateLineItemRequest {
  description: string;
  quantity: number;
  unitCode: string;
  unitPrice: Money;
  taxRatePercentage: number;
}
