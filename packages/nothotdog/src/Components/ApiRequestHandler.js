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
    params.forEach((param) => {
      if (param.key && param.value) {
        urlWithParams.searchParams.append(param.key, param.value);
      }
    });

    const processedHeaders = {};
    if (Array.isArray(headers)) {
        headers.forEach((header) => {
          if (header) {
            Object.keys(header).forEach((key) => {
              processedHeaders[key] = header[key];
            });
          }
        });
      }

    const requestConfig = {
      method: method,
      url: urlWithParams.toString(),
      headers: processedHeaders
    };

    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        requestConfig.data = JSON.parse(body);
      } catch (e) {
        console.error('Invalid JSON in request body:', e);
        throw new Error('Invalid JSON in request body');
      }
    }
    const axiosResponse = await axios(requestConfig);
    return {
      status: axiosResponse.status,
      statusText: axiosResponse.statusText,
      headers: axiosResponse.headers,
      body: axiosResponse.data,
    };
  } catch (error) {
    return {
      error: error.message,
      ...(error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        body: error.response.data
      } : {})
    };
  }
};