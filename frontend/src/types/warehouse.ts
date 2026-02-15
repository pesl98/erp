export interface Location {
  id: string;
  zone_id: string;
  code: string;
  label: string | null;
  max_capacity: number | null;
  is_active: boolean;
  created_at: string;
}

export interface Zone {
  id: string;
  warehouse_id: string;
  code: string;
  name: string;
  zone_type: string | null;
  created_at: string;
  locations: Location[];
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  zones?: Zone[];
}

export interface WarehouseCreate {
  code: string;
  name: string;
  address?: string;
}
