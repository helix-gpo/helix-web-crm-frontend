export interface Address {
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  countryCode?: string;
}

export type TenantStatus = 'PROSPECT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface Tenant {
  id: string;
  companyName: string;
  legalName?: string;
  vatId?: string;
  referenceCode?: string;
  address?: Address;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  notes?: string;
  status: TenantStatus;
  visibleOnWebsite: boolean;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantRequest {
  companyName: string;
  legalName?: string;
  vatId?: string;
  referenceCode?: string;
  address?: Address;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateTenantContactDetailsRequest {
  contactEmail?: string;
  contactPhone?: string;
  address?: Address;
  websiteUrl?: string;
}

export interface UpdateTenantNotesRequest {
  notes?: string;
}

export interface UpdateTenantCoreDetailsRequest {
  companyName: string;
  legalName?: string;
  vatId?: string;
  referenceCode?: string;
}

export interface Partner {
  id: string;
  firstName: string;
  lastName: string;
  role?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
}

export interface CreatePartnerRequest {
  firstName: string;
  lastName: string;
  role?: string;
  email?: string;
  phone?: string;
}

export interface UpdatePartnerRequest {
  firstName: string;
  lastName: string;
  role?: string;
  email?: string;
  phone?: string;
}
