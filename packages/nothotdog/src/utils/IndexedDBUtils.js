export const openDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('audioDB', 1);
  
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.createObjectStore('audios', { keyPath: 'id' });
      };
  
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
  
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  };
  
  export const storeAudio = async (id, audioBlob) => {
    const db = await openDB();
  
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['audios'], 'readwrite');
      const store = transaction.objectStore('audios');
  
      const request = store.put({ id, audioBlob });
  
      request.onsuccess = () => {
        resolve(id);
      };
  
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  };
  
  export const getAudio = async (id) => {
    const db = await openDB();
  
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['audios'], 'readonly');
      const store = transaction.objectStore('audios');
  
      const request = store.get(id);
  
      request.onsuccess = (event) => {
        resolve(event.target.result?.audioBlob);
      };
  
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  };
  
  export const deleteAudio = async (id) => {
    const db = await openDB();
  
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['audios'], 'readwrite');
      const store = transaction.objectStore('audios');
  
      const request = store.delete(id);
  
      request.onsuccess = () => {
        resolve();
      };
  
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  };
  