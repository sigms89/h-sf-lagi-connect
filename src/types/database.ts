// ============================================================
// Húsfélagið.is — Application-Level Type Definitions
// These extend the auto-generated Supabase types
// ============================================================

export type MemberRole = 'admin' | 'board' | 'member';

export interface Association {
  id: string;
  name: string;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  num_units: number;
  type: string;
  building_year: number | null;
  has_elevator: boolean;
  has_parking: boolean;
  num_floors: number;
  square_meters_total: number | null;
  subscription_status: string | null;
  subscription_tier: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type AssociationInsert = Omit<Association, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type AssociationUpdate = Partial<Omit<Association, 'id'>>;

export interface AssociationMember {
  id: string;
  user_id: string;
  association_id: string;
  role: MemberRole;
  is_active: boolean;
  joined_at: string | null;
  invited_by: string | null;
  profile?: {
    id: string;
    full_name: string | null;
  } | null;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  housing_association: string | null;
  role_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name_is: string;
  name_en: string | null;
  icon: string | null;
  color: string | null;
  is_system: boolean;
  parent_category_id: string | null;
  created_at: string | null;
}

export interface VendorRule {
  id: string;
  keyword_pattern: string;
  category_id: string;
  vendor_id: string | null;
  association_id: string | null;
  is_global: boolean;
  priority: number;
  created_by: string | null;
  created_at: string | null;
  category?: Category | null;
  vendor?: Vendor | null;
}

export interface Vendor {
  id: string;
  name: string;
  kennitala: string | null;
  type: string | null;
  is_verified: boolean;
  default_category_id: string | null;
  created_at: string | null;
}

export interface Transaction {
  id: string;
  association_id: string;
  date: string;
  description: string;
  amount: number;
  balance: number | null;
  category_id: string | null;
  vendor_id: string | null;
  is_income: boolean;
  is_individual_payment: boolean;
  original_description: string | null;
  manually_categorized: boolean;
  categorized_by_user_id: string | null;
  notes: string | null;
  uploaded_batch_id: string | null;
  created_at: string | null;
  category?: Category | null;
  vendor?: Vendor | null;
}

export type TransactionInsert = {
  association_id: string;
  date: string;
  description: string;
  amount: number;
  balance?: number | null;
  category_id?: string | null;
  vendor_id?: string | null;
  is_income?: boolean;
  is_individual_payment?: boolean;
  original_description?: string | null;
  manually_categorized?: boolean;
  categorized_by_user_id?: string | null;
  notes?: string | null;
  uploaded_batch_id?: string | null;
};

export interface TransactionFilters {
  page?: number;
  page_size?: number;
  search?: string;
  category_id?: string;
  is_income?: boolean;
  is_uncategorized?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface MonthlyData {
  month: string;
  month_label: string;
  income: number;
  expenses: number;
  net: number;
}

export interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  category_color: string;
  total: number;
  percentage: number;
  transaction_count: number;
}

export interface TransactionStats {
  total_income: number;
  total_expenses: number;
  net_balance: number;
  uncategorized_count: number;
  monthly_data: MonthlyData[];
  category_breakdown: CategoryBreakdown[];
  current_balance: number | null;
}

// ============================================================
// Service Provider Types
// ============================================================

export interface ServiceProvider {
  id: string;
  user_id: string;
  company_name: string;
  kennitala: string | null;
  description_is: string | null;
  description_en: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  service_area: string[];
  is_approved: boolean;
  subscription_status: string | null;
  created_at: string | null;
  updated_at: string | null;
  categories?: Array<{ id: string; name_is: string; color: string; icon?: string }>;
}

// ============================================================
// Bid / Marketplace Types
// ============================================================

export type BidRequestStatus = 'open' | 'closed' | 'awarded' | 'cancelled';
export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface BidRequest {
  id: string;
  association_id: string;
  created_by: string;
  category_id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  status: BidRequestStatus;
  created_at: string | null;
  updated_at: string | null;
  category?: Category | null;
  bids?: Bid[];
  bid_count?: number;
  association?: Partial<Association> | null;
}

export interface Bid {
  id: string;
  bid_request_id: string;
  provider_id: string;
  amount: number;
  description: string | null;
  status: BidStatus;
  valid_until: string | null;
  created_at: string | null;
  updated_at: string | null;
  provider?: ServiceProvider | null;
}
