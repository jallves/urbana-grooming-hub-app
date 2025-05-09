
import React, { useState, useRef } from 'react';
import { GalleryFormProps } from './types';
import { useGalleryOperations } from './useGalleryOperations';
import GalleryTable from './GalleryTable';
import GalleryForm from './GalleryForm';

const GalleryManager: React.FC<GalleryFormProps> = ({ galleryImages, setGalleryImages }) => {
  const {
    isLoading,
    uploading,
    editingImage,
    setEditingImage,
    handleAddGalleryImage: addGalleryImage,
    handleDeleteGalleryImage,
    handleUpdateGalleryImage,
    updateDisplayOrder
  } = useGalleryOperations(galleryImages, setGalleryImages);
  
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const [galleryUpload, setGalleryUpload] = useState<{ file: File; previewUrl: string } | null>(null);
  
  const [newImage, setNewImage] = useState<Omit<{ src: string; alt: string }, 'id'>>({
    src: '',
    alt: ''
  });

  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setGalleryUpload({ file, previewUrl });
      
      // Update the src in newImage (but don't actually set it to the previewUrl)
      setNewImage({
        ...newImage,
        src: '' // We'll leave this empty as the actual URL will come from Supabase
      });
    }
  };

  const handleAddGalleryImage = async () => {
    const success = await addGalleryImage(newImage, galleryUpload);
    if (success) {
      setNewImage({
        src: '',
        alt: ''
      });
      
      setGalleryUpload(null);
      if (galleryFileInputRef.current) {
        galleryFileInputRef.current.value = '';
      }
    }
  };

  const handleEditGallery = (image: { id: number; src: string; alt: string }) => {
    setEditingImage(image);
  };

  return (
    <div className="space-y-4">
      <GalleryTable
        galleryImages={galleryImages}
        isLoading={isLoading}
        onDelete={handleDeleteGalleryImage}
        onEdit={handleEditGallery}
        editingImage={editingImage}
        setEditingImage={setEditingImage}
        handleUpdateGalleryImage={handleUpdateGalleryImage}
        updateDisplayOrder={updateDisplayOrder}
      />
      
      <GalleryForm
        newImage={newImage}
        setNewImage={setNewImage}
        galleryUpload={galleryUpload}
        setGalleryUpload={setGalleryUpload}
        galleryFileInputRef={galleryFileInputRef}
        handleGalleryFileChange={handleGalleryFileChange}
        handleAddGalleryImage={handleAddGalleryImage}
        uploading={uploading}
      />
    </div>
  );
};

export default GalleryManager;
