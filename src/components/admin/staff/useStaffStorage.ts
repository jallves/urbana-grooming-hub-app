
import { useEffect } from 'react';
import { setupStaffPhotosBucket } from '../settings/media/utils/setupStorageBucket';

export const useStaffStorage = () => {
  useEffect(() => {
    setupStaffPhotosBucket();
  }, []);
};
