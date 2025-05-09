
import { BannerImage, GalleryImage } from '@/types/settings';

export interface ImageUpload {
  file: File;
  previewUrl: string;
}

export interface BannerFormProps {
  bannerImages: BannerImage[];
  setBannerImages: React.Dispatch<React.SetStateAction<BannerImage[]>>;
}

export interface GalleryFormProps {
  galleryImages: GalleryImage[];
  setGalleryImages: React.Dispatch<React.SetStateAction<GalleryImage[]>>;
}
