import { b64toBlob } from './utils';

const fetchTests = async (authFetch, setTests, setError) => {
  try {
    const response = await authFetch('api/inputs/');
    const data = response;

    const allInputs = data.data.flatMap(project => {
      const projectInputs = project.inputs.map(input => ({
        ...input,
        audioBlob: input.input_type === 'voice' ? b64toBlob(input.audioBase64, 'audio/webm') : null,
      }));

      const groupInputs = project.groups.flatMap(group => group.inputs.map(input => ({
        ...input,
        audioBlob: input.input_type === 'voice' ? b64toBlob(input.audioBase64, 'audio/webm') : null,
      })));

      return [...projectInputs, ...groupInputs];
    });

    setTests(allInputs);
  } catch (err) {
    setError('Failed to fetch recorded tests');
    console.error('Fetch error:', err);
  }
};

export default fetchTests;
