
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
    <>
      {/* Layout em Cards para Mobile/Tablet */}
      <div className="block lg:hidden space-y-3">
        {galleryImages.map((image, index) => (
          <div key={image.id} className="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
            {/* Imagem da Galeria */}
            <div className="relative w-full h-40 rounded-lg overflow-hidden">
              <img 
                src={image.src} 
                alt={image.alt}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <p className="text-sm text-gray-700 font-medium line-clamp-2">{image.alt}</p>
            </div>

            {/* Controles de Ordem */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-600">Posição na galeria</span>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => updateDisplayOrder(image.id, 'up')}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => updateDisplayOrder(image.id, 'down')}
                  disabled={index === galleryImages.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <div className="flex-1">
                <GalleryEditDialog 
                  editingImage={editingImage}
                  setEditingImage={setEditingImage}
                  handleUpdateGalleryImage={handleUpdateGalleryImage}
                  onEdit={() => onEdit(image)}
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(image.id)}
                className="flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Layout em Tabela para Desktop */}
      <div className="hidden lg:block">
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
      </div>
    </>
  );
};

export default GalleryTable;
