
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { BannerImage } from '@/types/settings';
import BannerEditDialog from './BannerEditDialog';

interface BannerTableProps {
  bannerImages: BannerImage[];
  isLoading: boolean;
  onDelete: (id: number) => Promise<void>;
  onEdit: (banner: BannerImage) => void;
  editingBanner: BannerImage | null;
  setEditingBanner: React.Dispatch<React.SetStateAction<BannerImage | null>>;
  handleUpdateBanner: () => Promise<void>;
}

const BannerTable: React.FC<BannerTableProps> = ({
  bannerImages,
  isLoading,
  onDelete,
  onEdit,
  editingBanner,
  setEditingBanner,
  handleUpdateBanner
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
          <TableHead>Título</TableHead>
          <TableHead>Subtítulo</TableHead>
          <TableHead className="w-[100px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bannerImages.map((banner) => (
          <TableRow key={banner.id}>
            <TableCell>
              <div className="relative h-14 w-24 rounded overflow-hidden">
                <img 
                  src={banner.imageUrl} 
                  alt={banner.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </TableCell>
            <TableCell>{banner.title}</TableCell>
            <TableCell>{banner.subtitle}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <BannerEditDialog 
                  editingBanner={editingBanner} 
                  setEditingBanner={setEditingBanner} 
                  handleUpdateBanner={handleUpdateBanner}
                  onEdit={() => onEdit(banner)}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(banner.id)}
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

export default BannerTable;
