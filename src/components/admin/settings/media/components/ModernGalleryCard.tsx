
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  ArrowUp, 
  ArrowDown,
  Eye,
  Check
} from "lucide-react";
import { GalleryImage } from '@/types/settings';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ModernGalleryCardProps {
  image: GalleryImage;
  index: number;
  totalImages: number;
  onUpdate: (image: GalleryImage) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  onReorder: (id: number, direction: 'up' | 'down') => Promise<boolean>;
}

const ModernGalleryCard: React.FC<ModernGalleryCardProps> = ({
  image,
  index,
  totalImages,
  onUpdate,
  onDelete,
  onReorder
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editAlt, setEditAlt] = useState(image.alt);
  const [isSaving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editAlt.trim()) return;
    
    setSaving(true);
    const success = await onUpdate({
      ...image,
      alt: editAlt.trim()
    });
    
    if (success) {
      setIsEditing(false);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setEditAlt(image.alt);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await onDelete(image.id);
  };

  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300">
      <CardContent className="p-0">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden">
          <img 
            src={image.src} 
            alt={image.alt}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsEditing(true)}
                className="bg-white/90 hover:bg-white"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="bg-red-500/90 hover:bg-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir esta imagem? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Status Badge */}
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2 bg-green-500/90 text-white"
          >
            <Eye className="h-3 w-3 mr-1" />
            Ativa
          </Badge>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title/Alt Text */}
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={editAlt}
                onChange={(e) => setEditAlt(e.target.value)}
                placeholder="Descrição da imagem"
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !editAlt.trim()}
                  className="flex-1"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-medium text-sm line-clamp-2">{image.alt}</h3>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReorder(image.id, 'up')}
                disabled={index === 0}
                className="h-8 w-8 p-0"
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReorder(image.id, 'down')}
                disabled={index === totalImages - 1}
                className="h-8 w-8 p-0"
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            </div>
            
            <Badge variant="outline" className="text-xs">
              #{index + 1}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModernGalleryCard;
