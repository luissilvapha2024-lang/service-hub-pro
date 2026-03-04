import { useState, useRef } from 'react';
import { Camera, X, Loader2, Trash2, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface OrderPhoto {
  id: string;
  file_path: string;
  file_name: string;
  description: string | null;
  created_at: string;
}

interface OrderPhotoUploadProps {
  orderId: string;
  photos: OrderPhoto[];
  onPhotosChange: () => void;
  disabled?: boolean;
}

export function OrderPhotoUpload({ orderId, photos, onPhotosChange, disabled }: OrderPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getSignedUrl = async (filePath: string): Promise<string> => {
    if (signedUrls[filePath]) return signedUrls[filePath];
    
    const { data, error } = await supabase.storage
      .from('order-photos')
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    
    if (error || !data?.signedUrl) return '';
    
    setSignedUrls(prev => ({ ...prev, [filePath]: data.signedUrl }));
    return data.signedUrl;
  };

  // Load signed URLs for all photos on mount/change
  useState(() => {
    photos.forEach(photo => {
      getSignedUrl(photo.file_path);
    });
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Arquivo inválido',
            description: 'Por favor, selecione apenas imagens.',
            variant: 'destructive',
          });
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: 'Arquivo muito grande',
            description: 'O tamanho máximo é 5MB.',
            variant: 'destructive',
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${orderId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('order-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from('order_photos')
          .insert({
            order_id: orderId,
            file_path: fileName,
            file_name: file.name,
          });

        if (dbError) throw dbError;
      }

      toast({
        title: 'Fotos enviadas',
        description: 'As fotos foram anexadas com sucesso.',
      });

      onPhotosChange();
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar fotos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async (photo: OrderPhoto) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('order-photos')
        .remove([photo.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('order_photos')
        .delete()
        .eq('id', photo.id);

      if (dbError) throw dbError;

      setSignedUrls(prev => {
        const next = { ...prev };
        delete next[photo.file_path];
        return next;
      });

      toast({
        title: 'Foto removida',
        description: 'A foto foi removida com sucesso.',
      });

      onPhotosChange();
    } catch (error: any) {
      toast({
        title: 'Erro ao remover foto',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handlePreview = async (filePath: string) => {
    const url = await getSignedUrl(filePath);
    if (url) setPreviewImage(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Fotos do Serviço
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              Anexar Fotos
            </>
          )}
        </Button>
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
            >
              <img
                src={signedUrls[photo.file_path] || ''}
                alt={photo.file_name}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => handlePreview(photo.file_path)}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:text-white hover:bg-white/20"
                  onClick={() => handlePreview(photo.file_path)}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:text-destructive hover:bg-white/20"
                    onClick={() => handleDeletePhoto(photo)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma foto anexada</p>
          <p className="text-xs mt-1">Clique em "Anexar Fotos" para adicionar</p>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setPreviewImage(null)}
            >
              <X className="w-4 h-4" />
            </Button>
            {previewImage && (
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}