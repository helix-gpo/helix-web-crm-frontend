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
}

export interface InvitationResponse {
  invitationId: string;
  rawToken: string;
  expiresAt: string;
}
