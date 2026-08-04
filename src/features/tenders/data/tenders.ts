export const TENDER_STATUSES = [
  'Pricing',
  'Tendering',
  'Issued',
  'Won',
  'Lost',
  'Withdrawn',
] as const;

export type TenderStatus = (typeof TENDER_STATUSES)[number];

export interface AssignedEstimator {
  id: string;
  email: string;
  fullName: string | null;
}

export interface Tender {
  id: string;
  client: string;
  job: string;
  email: string;
  received: string;
  due: string;
  status: TenderStatus;
  contractSum: number | null;
  isSigned: boolean;
  deleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignedEstimator?: AssignedEstimator | null;
}

export const STATUS_TONE: Record<TenderStatus, 'red' | 'orange' | 'green' | 'blue'> = {
  Pricing: 'blue',
  Tendering: 'orange',
  Issued: 'blue',
  Won: 'green',
  Lost: 'red',
  Withdrawn: 'orange',
};
