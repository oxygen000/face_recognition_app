import axios from "axios";
import {
  Client,
  ClientListResponse,
  ClientDetailResponse,
  ClientFilters,
  ClientSortOptions,
} from "../types/client";

// API configuration
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Client API service
 * Provides functions for interacting with client data
 */
const clientApi = {
  /**
   * Get a list of clients with optional filtering and sorting
   *
   * @param filters - Optional filter parameters
   * @param sort - Optional sort parameters
   * @param page - Optional page number for pagination (1-based)
   * @param limit - Optional limit of items per page
   * @returns Promise resolving to client list response
   */
  getClients: async (
    filters?: ClientFilters,
    sort?: ClientSortOptions,
    page: number = 1,
    limit: number = 20
  ): Promise<ClientListResponse> => {
    try {
      // Construct query parameters
      const params = new URLSearchParams();

      // Add pagination
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      // Add filters if provided
      if (filters) {
        if (filters.search) params.append("search", filters.search);
        if (filters.status) params.append("status", filters.status);
        if (filters.type) params.append("type", filters.type);
        if (filters.tags?.length) params.append("tags", filters.tags.join(","));
        if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
          params.append(
            "date_from",
            filters.dateRange[0].toISOString().split("T")[0]
          );
          params.append(
            "date_to",
            filters.dateRange[1].toISOString().split("T")[0]
          );
        }
      }

      // Add sorting if provided
      if (sort) {
        params.append("sort_by", sort.field);
        params.append("sort_direction", sort.direction);
      }

      // Make the API request
      const response = await axios.get(`${API_URL}/clients`, { params });

      // For demonstration, if the API doesn't exist yet, return mock data
      if (
        response.data.status === "error" &&
        response.data.message?.includes("endpoint not found")
      ) {
        return generateMockClientList(page, limit, filters, sort);
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching clients:", error);

      // For demonstration, return mock data
      return generateMockClientList(page, limit, filters, sort);
    }
  },

  /**
   * Get a single client by ID
   *
   * @param id - Client ID
   * @returns Promise resolving to client detail response
   */
  getClient: async (id: string): Promise<ClientDetailResponse> => {
    try {
      const response = await axios.get(`${API_URL}/clients/${id}`);

      // For demonstration, if the API doesn't exist yet, return mock data
      if (
        response.data.status === "error" &&
        response.data.message?.includes("endpoint not found")
      ) {
        return {
          status: "success",
          client: generateMockClient(id),
        };
      }

      return response.data;
    } catch (error) {
      console.error(`Error fetching client with ID ${id}:`, error);

      // For demonstration, return mock data
      return {
        status: "success",
        client: generateMockClient(id),
      };
    }
  },

  /**
   * Create a new client
   *
   * @param clientData - Client data to create
   * @returns Promise resolving to client detail response
   */
  createClient: async (
    clientData: Partial<Client>
  ): Promise<ClientDetailResponse> => {
    try {
      const response = await axios.post(`${API_URL}/clients`, clientData);
      return response.data;
    } catch (error) {
      console.error("Error creating client:", error);
      throw error;
    }
  },

  /**
   * Update an existing client
   *
   * @param id - Client ID
   * @param clientData - Updated client data
   * @returns Promise resolving to client detail response
   */
  updateClient: async (
    id: string,
    clientData: Partial<Client>
  ): Promise<ClientDetailResponse> => {
    try {
      const response = await axios.put(`${API_URL}/clients/${id}`, clientData);
      return response.data;
    } catch (error) {
      console.error(`Error updating client with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a client
   *
   * @param id - Client ID to delete
   * @returns Promise resolving to success/error response
   */
  deleteClient: async (
    id: string
  ): Promise<{ status: "success" | "error"; message?: string }> => {
    try {
      const response = await axios.delete(`${API_URL}/clients/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting client with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get client image URL
   *
   * @param client - Client object
   * @returns Full URL to client's image
   */
  getClientImageUrl: (client: Client): string => {
    if (!client) return "";

    if (client.image_url?.startsWith("http")) {
      return client.image_url;
    }

    if (client.image_path) {
      return `${SERVER_URL}/${client.image_path.replace(/^\//, "")}`;
    }

    if (client.face_id) {
      return `${SERVER_URL}/api/clients/${client.id}/image`;
    }

    return "";
  },
};

// Helper functions for generating mock data
function generateMockClient(id: string): Client {
  const names = [
    "John Smith",
    "Alice Johnson",
    "Michael Brown",
    "Emma Davis",
    "James Wilson",
  ];
  const companies = [
    "Acme Inc.",
    "Tech Solutions",
    "Global Services",
    "Innovative Corp",
    "Enterprise LLC",
  ];
  const statuses = ["active", "inactive", "pending", "blocked"];
  const types = ["corporate", "individual", "government", "non-profit"];
  const tags = ["vip", "regular", "new", "premium", "partner"];

  // Use the id to create deterministic but different mock data
  const idNum = parseInt(id.replace(/\D/g, "").substring(0, 4) || "1234");
  const nameIndex = idNum % names.length;
  const companyIndex = (idNum + 1) % companies.length;
  const statusIndex = (idNum + 2) % statuses.length;
  const typeIndex = (idNum + 3) % types.length;

  // Create a date in the past based on the ID
  const daysAgo = idNum % 365;
  const createdDate = new Date();
  createdDate.setDate(createdDate.getDate() - daysAgo);

  // Select 1-3 random tags
  const selectedTags = [];
  const numTags = 1 + (idNum % 3);
  for (let i = 0; i < numTags; i++) {
    selectedTags.push(tags[(idNum + i) % tags.length]);
  }

  return {
    id,
    name: names[nameIndex],
    company: companies[companyIndex],
    email: `${names[nameIndex].toLowerCase().replace(" ", ".")}@example.com`,
    phone: `+1 (555) ${100 + (idNum % 900)}-${1000 + (idNum % 9000)}`,
    created_at: createdDate.toISOString(),
    updated_at: new Date().toISOString(),
    status: statuses[statusIndex] as "active" | "inactive" | "pending" | "blocked",
    type: types[typeIndex],
    address: {
      street1: `${1000 + (idNum % 9000)} Main St`,
      city: "Springfield",
      state: "IL",
      postal_code: `6${1000 + (idNum % 9000)}`,
      country: "USA",
    },
    face_id: `face_${id}`,
    tags: selectedTags,
    last_recognition: idNum % 10 === 0 ? new Date().toISOString() : undefined,
  };
}

function generateMockClientList(
  page: number = 1,
  limit: number = 20,
  filters?: ClientFilters,
  sort?: ClientSortOptions
): ClientListResponse {
  // Generate mock clients
  const clients: Client[] = [];
  const totalCount = 237; // Mock total count

  for (let i = 0; i < limit; i++) {
    const index = (page - 1) * limit + i;
    if (index < totalCount) {
      clients.push(generateMockClient(`client_${index + 1000}`));
    }
  }

  // Apply filtering if needed
  let filteredClients = [...clients];
  if (filters) {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filteredClients = filteredClients.filter(
        (client) =>
          client.name.toLowerCase().includes(search) ||
          client.company?.toLowerCase().includes(search) ||
          client.email?.toLowerCase().includes(search)
      );
    }

    if (filters.status) {
      filteredClients = filteredClients.filter(
        (client) => client.status === filters.status
      );
    }

    if (filters.type) {
      filteredClients = filteredClients.filter(
        (client) => client.type === filters.type
      );
    }

    if (filters.tags?.length) {
      filteredClients = filteredClients.filter((client) =>
        client.tags?.some((tag) => filters.tags?.includes(tag))
      );
    }
  }

  // Apply sorting if needed
  if (sort) {
    filteredClients.sort((a, b) => {
      const aVal = a[sort.field];
      const bVal = b[sort.field];

      if (!aVal && !bVal) return 0;
      if (!aVal) return 1;
      if (!bVal) return -1;

      const comparison = String(aVal).localeCompare(String(bVal));
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }

  return {
    status: "success",
    clients: filteredClients,
    total: totalCount,
    page,
    limit,
  };
}

export default clientApi;
