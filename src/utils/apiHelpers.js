/**
 * Utility functions for handling API responses
 */

/**
 * Safely parses JSON from an API response, handling HTML error pages
 * @param {Response} response - The fetch API response
 * @param {string} errorPrefix - Prefix for error messages
 * @returns {Promise<Object|null>} The parsed JSON or null if there was an error
 */
export async function safelyParseJson(response, errorPrefix = 'API Error:') {
  try {
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      // Handle non-JSON response (likely HTML error page)
      const text = await response.text();
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        console.error(`${errorPrefix} Received HTML response instead of JSON. Server might be returning an error page.`);
        console.error('Response text (first 200 chars):', text.substring(0, 200) + '...');
      } else {
        console.error(`${errorPrefix} Unexpected response format:`, text);
      }
      return null;
    }
  } catch (error) {
    console.error(`${errorPrefix} Failed to parse response:`, error);
    return null;
  }
}

/**
 * Handles API responses with proper error handling
 * @param {Response} response - The fetch API response
 * @param {string} errorMessage - Error message to log
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>} Result object
 */
export async function handleApiResponse(response, errorMessage = 'API Error') {
  try {
    if (!response.ok) {
      const responseText = await response.text();
      // Check if the response is HTML (likely an error page)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error('Received HTML response instead of JSON. Server might be returning an error page.');
        console.error('Response text (first 200 chars):', responseText.substring(0, 200) + '...');
        return { 
          success: false, 
          data: null, 
          error: 'Server returned an HTML error page instead of JSON' 
        };
      } else {
        console.error(errorMessage, responseText);
        return { 
          success: false, 
          data: null, 
          error: responseText || 'Unknown error' 
        };
      }
    }
    
    // Parse JSON safely
    const data = await safelyParseJson(response, errorMessage);
    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    return {
      success: false,
      data: null,
      error: error.message || 'Unknown error'
    };
  }
}