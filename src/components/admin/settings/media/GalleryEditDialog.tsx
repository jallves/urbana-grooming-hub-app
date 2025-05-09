
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { GalleryImage } from '@/types/settings';

interface GalleryEditDialogProps {
  editingImage: GalleryImage | null;
  setEditingImage: React.Dispatch<React.SetStateAction<GalleryImage | null>>;
  handleUpdateGalleryImage: () => Promise<void>;
  onEdit: () => void;
}

const GalleryEditDialog: React.FC<GalleryEditDialogProps> = ({
  editingImage,
  setEditingImage,
  handleUpdateGalleryImage,
  onEdit
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onEdit}
        >
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Imagem</DialogTitle>
          <DialogDescription>
            Atualize as informações da imagem.
          </DialogDescription>
        </DialogHeader>
        {editingImage && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="imageSrc">URL da Imagem</Label>
              <Input 
                id="imageSrc" 
                value={editingImage.src}
                onChange={(e) => setEditingImage({
                  ...editingImage,
                  src: e.target.value
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageAlt">Descrição</Label>
              <Input 
                id="imageAlt" 
                value={editingImage.alt}
                onChange={(e) => setEditingImage({
                  ...editingImage,
                  alt: e.target.value
                })}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button onClick={handleUpdateGalleryImage}>
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GalleryEditDialog;
