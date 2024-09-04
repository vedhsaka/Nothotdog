import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import useAuthFetch from './AuthFetch';

const useSaveTest = () => {
  const { projectId, userId } = useAuth();
  const { authFetch } = useAuthFetch();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [description, setDescription] = useState('');
  const [groupOptions, setGroupOptions] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [currentSavingIndex, setCurrentSavingIndex] = useState(null);
  const [isUpdate, setIsUpdate] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      if (!userId) {
        console.error('User ID not found');
        return;
      }
      const response = await authFetch(`api/groups/${projectId}`);
      const groupsData = response;
      const groups = groupsData.data.map(group => ({
        id: group.uuid,
        name: group.name
      }));
      setGroupOptions(groups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  }, [projectId, authFetch, userId]);

  const handleSave = async (index, itemToSave) => {
    if (!userId) {
      setShowSignInModal(true);
      return;
    }
    setCurrentSavingIndex(index);
    await fetchGroups(); // Fetch groups when the modal is about to open
    setShowSaveModal(true);
  };

  return {
    showSaveModal,
    setShowSaveModal,
    showSignInModal,
    setShowSignInModal,
    description,
    setDescription,
    groupOptions,
    selectedGroupId,
    setSelectedGroupId,
    currentSavingIndex,
    isUpdate,
    handleSave
  };
};

export default useSaveTest;