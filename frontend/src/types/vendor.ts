export interface Vendor {
  id: string;
  code: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  payment_terms_days: number;
  lead_time_days: number;
  rating: number | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VendorCreate {
  code: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  payment_terms_days?: number;
  lead_time_days?: number;
  rating?: number;
  notes?: string;
}
