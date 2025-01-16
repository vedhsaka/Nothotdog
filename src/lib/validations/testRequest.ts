import { z } from 'zod';

// Schema for validating headers
const HeadersSchema = z.record(z.string(), z.string());

// Schema for validating test request body
const TestRequestBodySchema = z.object({
  input: z.string(),
  headers: HeadersSchema,
});

/**
 * Validates if a string is valid JSON
 */
function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Validates if two objects have the same structure (keys)
 */
function hasSameStructure(obj1: any, obj2: any): boolean {
  const keys1 = Object.keys(obj1).sort();
  const keys2 = Object.keys(obj2).sort();
  
  if (keys1.length !== keys2.length) return false;
  
  return keys1.every((key, index) => {
    if (key !== keys2[index]) return false;
    
    if (typeof obj1[key] === 'object' && obj1[key] !== null &&
        typeof obj2[key] === 'object' && obj2[key] !== null) {
      return hasSameStructure(obj1[key], obj2[key]);
    }
    
    return true;
  });
}

/**
 * Validates test request headers
 * @param headers - Headers to validate
 * @param savedHeaders - Saved headers to compare against
 * @returns boolean indicating if headers are valid
 */
export function validateHeaders(headers: unknown, savedHeaders: unknown): boolean {
  try {
    // Parse and validate headers format
    const parsedHeaders = HeadersSchema.parse(headers);
    const parsedSavedHeaders = HeadersSchema.parse(savedHeaders);

    // Convert string headers to JSON if needed
    const headersObj = typeof parsedHeaders === 'string' ? JSON.parse(parsedHeaders) : parsedHeaders;
    const savedHeadersObj = typeof parsedSavedHeaders === 'string' ? JSON.parse(parsedSavedHeaders) : parsedSavedHeaders;

    // Compare structure
    return hasSameStructure(headersObj, savedHeadersObj);
  } catch (e) {
    return false;
  }
}

/**
 * Validates test request body
 * @param body - Body to validate
 * @param savedBody - Saved body to compare against
 * @returns boolean indicating if body is valid
 */
export function validateBody(body: unknown, savedBody: unknown): boolean {
  try {
    // Parse and validate body format
    const parsedBody = TestRequestBodySchema.parse(body);
    const parsedSavedBody = TestRequestBodySchema.parse(savedBody);

    // Convert string bodies to JSON if needed
    const bodyObj = typeof parsedBody === 'string' ? JSON.parse(parsedBody) : parsedBody;
    const savedBodyObj = typeof parsedSavedBody === 'string' ? JSON.parse(parsedSavedBody) : parsedSavedBody;

    // Compare structure
    return hasSameStructure(bodyObj, savedBodyObj);
  } catch (e) {
    return false;
  }
}

/**
 * Validates entire test request
 * @param request - Request to validate
 * @param savedRequest - Saved request to compare against
 * @returns boolean indicating if request is valid
 */
export function validateTestRequest(request: unknown, savedRequest: unknown): boolean {
  try {
    const parsedRequest = TestRequestBodySchema.parse(request);
    const parsedSavedRequest = TestRequestBodySchema.parse(savedRequest);

    return validateHeaders(parsedRequest.headers, parsedSavedRequest.headers) &&
           validateBody(parsedRequest, parsedSavedRequest);
  } catch (e) {
    return false;
  }
} 