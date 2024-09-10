import { getAudio } from '../utils/IndexedDBUtils';

export const evaluateTest = async (input, checks, inputType = 'text', authFetch) => {
  try {
    let content;
    if (inputType === 'voice') {
      const audioBlob = await getAudio(input);
      const base64Audio = await blobToBase64(audioBlob);
      content = base64Audio;
    } else {
      content = input;
    }

    const response = await authFetch('api/test-inputs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputType,
        content,
        checks,
      }),
    });

    if (!response) {
      throw new Error('Failed to evaluate the test');
    }

    return response;
  } catch (error) {
    console.error('Error during evaluation:', error);
    throw error;
  }
};

const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};