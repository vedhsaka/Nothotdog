import { API_METHODS, ApiError } from './config';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

async function handleResponse(response: Response) {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  
  const data = isJson ? await response.json() : await response.text();
  
  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.message || 'An error occurred',
      data
    );
  }
  
  return data;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...init } = options;
  
  // Add query parameters if they exist
  const url = new URL(endpoint, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  // Default headers
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }
  
  try {
    const response = await fetch(url.toString(), {
      ...init,
      headers
    });
    
    return handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      error instanceof Error ? error.message : 'Network error occurred'
    );
  }
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) => 
    apiRequest<T>(endpoint, { ...options, method: API_METHODS.GET }),
    
  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: API_METHODS.POST,
      body: data ? JSON.stringify(data) : undefined
    }),
    
  put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: API_METHODS.PUT,
      body: data ? JSON.stringify(data) : undefined
    }),
    
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: API_METHODS.DELETE })
}; 