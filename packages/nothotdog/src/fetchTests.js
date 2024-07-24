import { b64toBlob } from './utils'; // You can create a utility function for b64toBlob if needed

const fetchTests = async (authFetch, setTests, setError) => {
  try {
    const response = await authFetch('api/voices/');
    const data = response;

    const allVoices = data.data.flatMap(project => {
      const projectVoices = project.voices.flatMap(voice => voice.voices.map(v => ({
        ...v,
        audioBlob: b64toBlob(v.audioBase64, 'audio/webm'),
      })));

      const groupVoices = project.voices.flatMap(voice => voice.groups.flatMap(group => group.voices.map(v => ({
        ...v,
        audioBlob: b64toBlob(v.audioBase64, 'audio/webm'),
      }))));

      return [...projectVoices, ...groupVoices];
    });

    setTests(allVoices);
  } catch (err) {
    setError('Failed to fetch recorded tests');
    console.error('Fetch error:', err);
  }
};

export default fetchTests;
