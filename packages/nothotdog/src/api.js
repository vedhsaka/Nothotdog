const apiBaseUrl = process.env.NODE_ENV === 'production'
  ? process.env.REACT_APP_API_BASE_URL_PROD
  : process.env.REACT_APP_API_BASE_URL_DEV;

const apiFetch = (endpoint, options = {}) => {
  return fetch(`${apiBaseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .catch(error => {
      console.error('Error:', error);
      throw error;
    });
};

export default apiFetch;
