export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Money {
  amount: number;
  currencyCode: string;
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
  netTotal: Money;
  taxTotal: Money;
  grossTotal: Money;
  createdAt: string;
  updatedAt: string;
}
