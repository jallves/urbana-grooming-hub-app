// Mapeamento de imagens de produtos
// Importações de imagens locais para uso no Totem

import shampooBarba from '@/assets/products/shampoo-barba.jpg';
import condicionadorBarba from '@/assets/products/condicionador-barba.jpg';
import posBarba from '@/assets/products/pos-barba.jpg';
import pomadaCabelo from '@/assets/products/pomada-cabelo.jpg';
import oleoBarba from '@/assets/products/oleo-barba.jpg';
import ceraCabelo from '@/assets/products/cera-cabelo.jpg';
import balmBarba from '@/assets/products/balm-barba.jpg';
import ceraCapilar from '@/assets/products/cera-capilar.jpg';
import pomadaModeladora from '@/assets/products/pomada-modeladora.jpg';
import shampooCabeloBarba from '@/assets/products/shampoo-cabelo-barba.jpg';

// Mapeamento de caminhos do banco de dados para imagens importadas
const imageMap: Record<string, string> = {
  // Caminhos com /src/assets/
  '/src/assets/products/shampoo-barba.jpg': shampooBarba,
  '/src/assets/products/condicionador-barba.jpg': condicionadorBarba,
  '/src/assets/products/pos-barba.jpg': posBarba,
  '/src/assets/products/pomada-cabelo.jpg': pomadaCabelo,
  '/src/assets/products/oleo-barba.jpg': oleoBarba,
  '/src/assets/products/cera-cabelo.jpg': ceraCabelo,
  '/src/assets/products/balm-barba.jpg': balmBarba,
  '/src/assets/products/cera-capilar.jpg': ceraCapilar,
  '/src/assets/products/pomada-modeladora.jpg': pomadaModeladora,
  '/src/assets/products/shampoo-cabelo-barba.jpg': shampooCabeloBarba,
  
  // Caminhos sem barra inicial
  'src/assets/products/shampoo-barba.jpg': shampooBarba,
  'src/assets/products/condicionador-barba.jpg': condicionadorBarba,
  'src/assets/products/pos-barba.jpg': posBarba,
  'src/assets/products/pomada-cabelo.jpg': pomadaCabelo,
  'src/assets/products/oleo-barba.jpg': oleoBarba,
  'src/assets/products/cera-cabelo.jpg': ceraCabelo,
  'src/assets/products/balm-barba.jpg': balmBarba,
  'src/assets/products/cera-capilar.jpg': ceraCapilar,
  'src/assets/products/pomada-modeladora.jpg': pomadaModeladora,
  'src/assets/products/shampoo-cabelo-barba.jpg': shampooCabeloBarba,
};

/**
 * Resolve a URL da imagem do produto
 * Se for um caminho local (/src/assets/...), retorna a imagem importada
 * Se for uma URL completa (http/https), retorna a URL original
 * Se não encontrar, retorna null
 */
export function resolveProductImageUrl(imagemUrl: string | null | undefined): string | null {
  if (!imagemUrl) return null;
  
  // Try parsing as JSON array (new multi-image format)
  try {
    const parsed = JSON.parse(imagemUrl);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0]; // Return first image as primary
    }
  } catch {}
  
  // Se já é uma URL completa (Supabase Storage ou externa), retorna como está
  if (imagemUrl.startsWith('http://') || imagemUrl.startsWith('https://')) {
    return imagemUrl;
  }
  
  // Verifica se está no mapeamento de imagens locais
  const mappedImage = imageMap[imagemUrl];
  if (mappedImage) {
    return mappedImage;
  }
  
  // Tenta encontrar pelo nome do arquivo
  const fileName = imagemUrl.split('/').pop();
  if (fileName) {
    for (const [path, image] of Object.entries(imageMap)) {
      if (path.endsWith(fileName)) {
        return image;
      }
    }
  }
  
  console.warn(`Imagem de produto não encontrada: ${imagemUrl}`);
  return null;
}

/**
 * Resolve todas as URLs de imagem de um produto (multi-imagem)
 */
export function resolveAllProductImageUrls(imagemUrl: string | null | undefined): string[] {
  if (!imagemUrl) return [];
  
  try {
    const parsed = JSON.parse(imagemUrl);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  
  const resolved = resolveProductImageUrl(imagemUrl);
  return resolved ? [resolved] : [];
}
