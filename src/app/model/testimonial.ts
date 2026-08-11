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
