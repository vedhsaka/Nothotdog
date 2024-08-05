export const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
  try {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
  
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
  
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
  
    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  } catch (error) {
    console.error("Failed to convert base64 to blob:", error);
    return null; // or throw an error, depending on how you want to handle it
  }
};

  export const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };


  export const evaluationMapping = {
    "begins": "begins_with",
    "begins_with": "begins_with",
    "contains": "contains",
    "ends": "ends_with",
    "ends_with": "ends_with",
    "contextually": "contextually_contains",
    "contextually_contains": "contextually_contains",
    "exact_match": "exact_match",
    "word_count": "word_count"
  };
  