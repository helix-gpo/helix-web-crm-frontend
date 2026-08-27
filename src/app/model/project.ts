export type ProjectStatus = 'LEAD' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type MilestoneStatus = 'PLANNED' | 'IN_PROGRESS' | 'DONE';

export interface Money {
  amount: number;
  currencyCode: string;
}

export interface ProjectTag {
  value: string;
  colorHex: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: MilestoneStatus;
  price?: Money;
}

export interface Project {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  fullDescription?: string;
  highlights: string[];
  tags: ProjectTag[];
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  visibleOnWebsite: boolean;
  imageUrl?: string;
  notes?: string;
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  tenantId: string;
  title: string;
  description?: string;
  fullDescription?: string;
  highlights: string[];
  tags: ProjectTag[];
  startDate?: string;
  endDate?: string;
  status?: ProjectStatus;
}

export interface UpdateProjectRequest {
  title: string;
  description?: string;
  fullDescription?: string;
  highlights: string[];
  tags: ProjectTag[];
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectNotesRequest {
  notes?: string;
}

export interface AddMilestoneRequest {
  title: string;
  description?: string;
  dueDate?: string;
  price?: Money;
}

// Eigenständiges Interface statt Type-Alias auf AddMilestoneRequest -
// braucht das zusätzliche status-Feld, das AddMilestoneRequest nicht hat
export interface UpdateMilestoneRequest extends AddMilestoneRequest {
  status: MilestoneStatus;
}
