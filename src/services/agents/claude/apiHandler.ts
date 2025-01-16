export class ApiHandler {
    static async callEndpoint(
      endpointUrl: string,
      headers: Record<string, string>,
      input: Record<string, any>,
      signal?: AbortSignal
    ): Promise<any> {
      try {
        const response = await fetch(endpointUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(input),
          signal
        });
  
        if (!response.ok) {
          throw new Error(`Endpoint returned ${response.status}`);
        }
  
        return await response.json();
      } catch (error) {
        console.error('Endpoint call failed:', error);
        throw error;
      }
    }
  
    static formatInput(message: string, inputFormat: Record<string, any>): Record<string, any> {
      const formattedInput = JSON.parse(JSON.stringify(inputFormat));
      const [inputKey] = Object.keys(formattedInput);
      
      if (inputKey) {
        formattedInput[inputKey] = message;
      } else {
        console.error('No input key found in API input format');
      }
      
      return formattedInput;
    }
  }