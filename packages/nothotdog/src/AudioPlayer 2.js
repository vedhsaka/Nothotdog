import React, { useState, useEffect } from 'react';
import { getAudio } from './IndexedDBUtils';

const AudioPlayer = ({ audioId }) => {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let objectURL = null;

    const fetchAudio = async () => {
      if (audioId) {
        const audioBlob = await getAudio(audioId);
        if (audioBlob) {
          objectURL = URL.createObjectURL(audioBlob);
          setUrl(objectURL);
        }
      }
    };

    fetchAudio();

    return () => {
      if (objectURL) {
        URL.revokeObjectURL(objectURL);
      }
    };
  }, [audioId]);

  return (
    <audio
      controls
      src={url}
      onError={(e) => console.error("Audio playback error:", e)}
    />
  );
};

export default AudioPlayer;
