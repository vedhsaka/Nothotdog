import { useAuth } from './AuthContext';
import apiFetch from './api';  // Adjust the path as needed


const useAuthFetch = () => {
  const { userId } = useAuth();

  const authFetch = async (url, options = {}) => {
    // Ensure headers object is present in options
    if (!options.headers) {
      options.headers = {};
    }

    // Append the userId to the headers
    if (userId) {
      options.headers['userId'] = userId;
    }

    const response = await apiFetch(url, options);
    return response;
  };

  return authFetch;
};

export default useAuthFetch;
