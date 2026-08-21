export type TestimonialStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface Testimonial {
  id: string;
  tenantId: string;
  partnerId: string;
  projectId?: string;
  partnerName: string;
  partnerRole?: string;
  companyName: string;
  description: string;
  rating: number;
  status: TestimonialStatus;
  visibleOnWebsite: boolean;
  createdAt: string;
}

export interface CreateInvitationRequest {
  partnerId: string;
  projectId?: string;
  expiresInDays?: number;
  sendEmail?: boolean;
  email?: string;
}

export interface InvitationResponse {
  invitationId: string;
  rawToken: string;
  expiresAt: string;
  sent: boolean;
  sentToEmail?: string;
}

export interface InvitationSummary {
  id: string;
  partnerId: string;
  projectId?: string;
  status: 'PENDING' | 'USED' | 'EXPIRED' | 'REVOKED';
  sentToEmail?: string;
  sentAt?: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}
