/**
 * Client types for the face recognition application
 */

/**
 * Client interface representing a customer in the system
 */
export interface Client {
  /** Unique identifier for the client */
  id: string;
  
  /** Client's full name */
  name: string;
  
  /** Client's business or organization name */
  company?: string;
  
  /** Client's email address */
  email?: string;
  
  /** Client's phone number */
  phone?: string;
  
  /** Client's profile image URL */
  image_url?: string;
  
  /** Client's profile image path on the server */
  image_path?: string;
  
  /** Date when the client was created/registered */
  created_at: string;
  
  /** Date when the client was last updated */
  updated_at?: string;
  
  /** Client's status in the system */
  status?: ClientStatus;
  
  /** Client type or category */
  type?: string;
  
  /** Address information */
  address?: ClientAddress;
  
  /** Arbitrary additional client metadata */
  metadata?: Record<string, any>;
  
  /** Face recognition ID associated with this client */
  face_id?: string;
  
  /** Last recognition timestamp */
  last_recognition?: string;
  
  /** Client tags or labels */
  tags?: string[];
}

/**
 * Client status options
 */
export type ClientStatus = 'active' | 'inactive' | 'pending' | 'blocked';

/**
 * Client address information
 */
export interface ClientAddress {
  /** Street address (line 1) */
  street1?: string;
  
  /** Street address (line 2) */
  street2?: string;
  
  /** City name */
  city?: string;
  
  /** State or province */
  state?: string;
  
  /** Postal/ZIP code */
  postal_code?: string;
  
  /** Country */
  country?: string;
}

/**
 * API response for client list
 */
export interface ClientListResponse {
  status: 'success' | 'error';
  message?: string;
  clients?: Client[];
  total?: number;
  page?: number;
  limit?: number;
}

/**
 * API response for client detail
 */
export interface ClientDetailResponse {
  status: 'success' | 'error';
  message?: string;
  client?: Client;
}

/**
 * Filter options for client list
 */
export interface ClientFilters {
  search?: string;
  status?: ClientStatus;
  type?: string;
  tags?: string[];
  dateRange?: [Date | null, Date | null];
}

/**
 * Sort options for client list
 */
export interface ClientSortOptions {
  field: 'name' | 'company' | 'created_at' | 'updated_at' | 'last_recognition';
  direction: 'asc' | 'desc';
} 