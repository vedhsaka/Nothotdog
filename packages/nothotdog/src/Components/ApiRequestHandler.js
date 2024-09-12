import axios from 'axios';

export const sendApiRequest = async ({
  method,
  url,
  params,
  headers,
  body
}) => {
    try {
        const urlWithParams = new URL(url);
       const requestConfig = {
        method: method,
        url: urlWithParams.toString(),
        params,
        headers,
      };

      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
          requestConfig.data = JSON.parse(body);
        } catch (e) {
          console.error('Invalid JSON in request body:', e);
          setResponse({ error: 'Invalid JSON in request body' });
          setIsLoading(false);
          return;
        }
      }

      const axiosResponse = await axios(requestConfig);
      return axiosResponse;
    } catch (error) {
        return error;
    }
};