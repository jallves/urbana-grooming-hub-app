
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { BannerImage } from '@/types/settings';

interface BannerEditDialogProps {
  editingBanner: BannerImage | null;
  setEditingBanner: React.Dispatch<React.SetStateAction<BannerImage | null>>;
  handleUpdateBanner: () => Promise<void>;
  onEdit: () => void;
}

const BannerEditDialog: React.FC<BannerEditDialogProps> = ({
  editingBanner,
  setEditingBanner,
  handleUpdateBanner,
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
          <DialogTitle>Editar Banner</DialogTitle>
          <DialogDescription>
            Atualize as informações do banner.
          </DialogDescription>
        </DialogHeader>
        {editingBanner && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image_url">URL da Imagem</Label>
              <Input 
                id="image_url" 
                value={editingBanner.image_url}
                onChange={(e) => setEditingBanner({
                  ...editingBanner,
                  image_url: e.target.value
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input 
                id="title" 
                value={editingBanner.title}
                onChange={(e) => setEditingBanner({
                  ...editingBanner,
                  title: e.target.value
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtítulo</Label>
              <Input 
                id="subtitle" 
                value={editingBanner.subtitle}
                onChange={(e) => setEditingBanner({
                  ...editingBanner,
                  subtitle: e.target.value
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea 
                id="description" 
                value={editingBanner.description || ''}
                onChange={(e) => setEditingBanner({
                  ...editingBanner,
                  description: e.target.value
                })}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button onClick={handleUpdateBanner}>Salvar alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BannerEditDialog;
