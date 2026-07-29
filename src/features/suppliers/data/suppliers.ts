export const TRADES = [
  'Groundworks',
  'Electrical',
  'Plumbing',
  'Roofing',
  'Joinery',
  'Plastering',
  'Other',
] as const;

export type Trade = (typeof TRADES)[number];

export interface Supplier {
  id: string;
  company: string;
  trade: Trade;
  contact: string;
  phone: string;
  email: string;
  note: string;
  projectIds: string[];
  usedBefore: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SupplierDocument {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  dropboxPath: string;
  dropboxLink: string;
  category: string;
  uploadedAt: string;
}

export interface DropboxLink {
  id: string;
  dropboxPath: string;
  dropboxUrl: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  description: string | null;
  uploadedBy: string;
  createdAt: string;
}

export type CisStatus = 'Registered' | 'Verified' | 'Gross' | 'Unregistered';

export interface SupplierDetail extends Supplier {
  ramsUrl: string | null;
  ramsExpiry: string | null;
  insuranceUrl: string | null;
  insuranceExpiry: string | null;
  cisStatus: CisStatus;
  cisExpiry: string | null;
  dropboxAccountId: string | null;
  dropboxFolderPath: string | null;
  documents: SupplierDocument[];
  dropboxLinks: DropboxLink[];
}

export const SEED_SUPPLIERS: Supplier[] = [
  {
    id: 's1',
    company: 'Hartley Groundworks',
    trade: 'Groundworks',
    contact: 'Dave Hartley',
    phone: '07700 900123',
    email: 'dave@hartleygroundworks.co.uk',
    note: 'Used on 12 Burtenshaw, reliable, competitive on muck-away',
    projectIds: ['12-burtenshaw'],
    usedBefore: true,
    isDeleted: false,
    createdAt: '2026-07-20T10:00:00Z',
    updatedAt: '2026-07-20T10:00:00Z',
    deletedAt: null,
  },
  {
    id: 's2',
    company: 'Bright Spark Electrical',
    trade: 'Electrical',
    contact: 'Mike Stevens',
    phone: '07700 900456',
    email: 'mike@brightspark.co.uk',
    note: '',
    projectIds: ['12-burtenshaw'],
    usedBefore: true,
    isDeleted: false,
    createdAt: '2026-07-20T10:00:00Z',
    updatedAt: '2026-07-20T10:00:00Z',
    deletedAt: null,
  },
  {
    id: 's3',
    company: 'FlowTech Plumbing & Heating',
    trade: 'Plumbing',
    contact: 'Sarah Chen',
    phone: '07700 900789',
    email: 'sarah@flowtech.co.uk',
    note: '',
    projectIds: [],
    usedBefore: true,
    isDeleted: false,
    createdAt: '2026-07-20T10:00:00Z',
    updatedAt: '2026-07-20T10:00:00Z',
    deletedAt: null,
  },
  {
    id: 's4',
    company: 'Apex Roofing Contractors',
    trade: 'Roofing',
    contact: 'Tom Wright',
    phone: '07700 900321',
    email: 'tom@apexroofing.co.uk',
    note: 'New — not yet used on a project',
    projectIds: [],
    usedBefore: false,
    isDeleted: false,
    createdAt: '2026-07-20T10:00:00Z',
    updatedAt: '2026-07-20T10:00:00Z',
    deletedAt: null,
  },
];
