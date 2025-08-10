// Database types based on the Supabase schema

export interface Dataset {
  id: string;
  name: string;
  full_name: string;
  description: string;
  website_url: string;
  total_cases: number;
  year_range: string;
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  doi: string;
  title: string;
  year: number;
  date_added: string;
  clinical_vignette: string;
  dataset: string;
  short_title: string;
  created_at: string;
  updated_at: string;
}

// API response types
export interface DatasetsResponse {
  datasets: Dataset[];
  error?: string;
}

export interface CasesResponse {
  cases: Case[];
  error?: string;
}

// UI types
export interface GroupedCases {
  [year: number]: Case[];
}
