import { useAuth } from './AuthContext';
import apiFetch from './api';  // Adjust the path as needed
import { useState } from 'react';
import SignInModal from './UtilityModals';  // Import the SignInModal component

const useAuthFetch = () => {
  const { userId } = useAuth();
  const [showSignInModal, setShowSignInModal] = useState(false);  // State to control the modal visibility

  const authFetch = async (url, options = {}) => {
    // Check if user is logged in
    if (!userId) {
      console.log('User not logged in');
      // setShowSignInModal(true);  // Show the sign-in modal
      return;  // Exit the function early
    }

    // Ensure headers object is present in options
    if (!options.headers) {
      options.headers = {};
    }

    // Append the userId to the headers
    options.headers['userId'] = userId;

    const response = await apiFetch(url, options);
    return response;
  };

  return { authFetch, showSignInModal, setShowSignInModal };  // Return the state and state updater as well
};

export default useAuthFetch;
