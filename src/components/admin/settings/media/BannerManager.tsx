
import React, { useState, useRef } from 'react';
import { BannerFormProps, ImageUpload } from './types';
import { useBannerOperations } from './useBannerOperations';
import BannerTable from './BannerTable';
import BannerForm from './BannerForm';

const BannerManager: React.FC<BannerFormProps> = ({ bannerImages, setBannerImages }) => {
  const {
    isLoading,
    uploading,
    editingBanner,
    setEditingBanner,
    handleAddBanner: addBanner,
    handleDeleteBanner,
    handleUpdateBanner
  } = useBannerOperations(bannerImages, setBannerImages);
  
  const [bannerUpload, setBannerUpload] = useState<ImageUpload | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  
  const [newBanner, setNewBanner] = useState<Omit<BannerImage, 'id'>>({
    imageUrl: '',
    title: '',
    subtitle: '',
    description: ''
  });

  const handleAddBanner = async () => {
    const success = await addBanner(newBanner, bannerUpload);
    if (success) {
      setNewBanner({
        imageUrl: '',
        title: '',
        subtitle: '',
        description: ''
      });
      
      setBannerUpload(null);
      if (bannerFileInputRef.current) {
        bannerFileInputRef.current.value = '';
      }
    }
  };

  const handleEditBanner = (banner: BannerImage) => {
    setEditingBanner(banner);
  };

  return (
    <div className="space-y-4">
      <BannerTable 
        bannerImages={bannerImages}
        isLoading={isLoading}
        onDelete={handleDeleteBanner}
        onEdit={handleEditBanner}
        editingBanner={editingBanner}
        setEditingBanner={setEditingBanner}
        handleUpdateBanner={handleUpdateBanner}
      />
      
      <BannerForm 
        newBanner={newBanner}
        setNewBanner={setNewBanner}
        bannerUpload={bannerUpload}
        setBannerUpload={setBannerUpload}
        handleAddBanner={handleAddBanner}
        uploading={uploading}
      />
    </div>
  );
};

// Add TypeScript type import
import { BannerImage } from '@/types/settings';

export default BannerManager;
