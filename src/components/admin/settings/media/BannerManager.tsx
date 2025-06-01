
import React, { useState, useRef } from 'react';
import { BannerFormProps, ImageUpload } from './types';
import { useBannerOperations } from './useBannerOperations';
import BannerTable from './BannerTable';
import BannerForm from './BannerForm';
import { BannerImage } from '@/types/settings';

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
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const [newBanner, setNewBanner] = useState<Omit<BannerImage, 'id'>>({
    image_url: '',
    title: '',
    subtitle: '',
    description: '',
    button_text: 'Agendar Agora',
    button_link: '/cliente/login',
    is_active: true,
    display_order: 0
  });

  const handleAddBanner = async () => {
    setUploadError(null);
    
    try {
      const success = await addBanner(newBanner, bannerUpload);
      
      if (success) {
        setNewBanner({
          image_url: '',
          title: '',
          subtitle: '',
          description: '',
          button_text: 'Agendar Agora',
          button_link: '/cliente/login',
          is_active: true,
          display_order: 0
        });
        
        setBannerUpload(null);
        if (bannerFileInputRef.current) {
          bannerFileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Error adding banner:', error);
      setUploadError((error as Error).message);
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
        uploadError={uploadError}
      />
    </div>
  );
};

export default BannerManager;
