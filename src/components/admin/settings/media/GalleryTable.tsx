
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { GalleryImage } from '@/types/settings';
import GalleryEditDialog from './GalleryEditDialog';

interface GalleryTableProps {
  galleryImages: GalleryImage[];
  isLoading: boolean;
  onDelete: (id: number) => Promise<void>;
  onEdit: (image: GalleryImage) => void;
  editingImage: GalleryImage | null;
  setEditingImage: React.Dispatch<React.SetStateAction<GalleryImage | null>>;
  handleUpdateGalleryImage: () => Promise<void>;
  updateDisplayOrder: (id: number, direction: 'up' | 'down') => Promise<void>;
}

const GalleryTable: React.FC<GalleryTableProps> = ({
  galleryImages,
  isLoading,
  onDelete,
  onEdit,
  editingImage,
  setEditingImage,
  handleUpdateGalleryImage,
  updateDisplayOrder
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="w-10 h-10 border-t-4 border-primary border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Imagem</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Ordem</TableHead>
          <TableHead className="w-[100px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {galleryImages.map((image, index) => (
          <TableRow key={image.id}>
            <TableCell>
              <div className="relative h-14 w-24 rounded overflow-hidden">
                <img 
                  src={image.src} 
                  alt={image.alt}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </TableCell>
            <TableCell>{image.alt}</TableCell>
            <TableCell>
              <div className="flex space-x-1">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => updateDisplayOrder(image.id, 'up')}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => updateDisplayOrder(image.id, 'down')}
                  disabled={index === galleryImages.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <GalleryEditDialog 
                  editingImage={editingImage}
                  setEditingImage={setEditingImage}
                  handleUpdateGalleryImage={handleUpdateGalleryImage}
                  onEdit={() => onEdit(image)}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(image.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default GalleryTable;
