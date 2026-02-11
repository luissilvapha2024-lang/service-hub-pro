import { useState, useEffect, useRef } from 'react';
import { Loader2, Instagram, Facebook, Globe, Upload, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function CompanySettings() {
  const { company, companyId } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    phone: '',
    address: '',
    instagram: '',
    facebook: '',
    website: '',
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        cnpj: formatCNPJ(company.cnpj || ''),
        phone: company.phone || '',
        address: company.address || '',
        instagram: (company as any).instagram || '',
        facebook: (company as any).facebook || '',
        website: (company as any).website || '',
      });
      setLogoUrl(company.logo_url || null);
    }
  }, [company]);

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
      .slice(0, 18);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const validateImageDimensions = (file: File): Promise<{ valid: boolean; width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const valid = img.width >= 50 && img.width <= 300 && img.height >= 50 && img.height <= 300;
        resolve({ valid, width: img.width, height: img.height });
      };
      img.onerror = () => resolve({ valid: false, width: 0, height: 0 });
      img.src = URL.createObjectURL(file);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Arquivo inválido', description: 'Selecione uma imagem (PNG, JPG, etc).', variant: 'destructive' });
      return;
    }

    // Validate dimensions
    const { valid, width, height } = await validateImageDimensions(file);
    if (!valid) {
      toast({
        title: 'Dimensões inválidas',
        description: `A imagem tem ${width}x${height}px. O tamanho deve ser entre 50x50 e 300x300 pixels.`,
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${companyId}/logo.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Save URL to company record
      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: publicUrl })
        .eq('id', companyId);

      if (updateError) throw updateError;

      setLogoUrl(publicUrl);
      toast({ title: 'Logo atualizado', description: 'O logo da empresa foi salvo com sucesso.' });
    } catch (error: any) {
      toast({ title: 'Erro ao enviar logo', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!companyId) return;
    setIsUploadingLogo(true);
    try {
      // List and remove files in the company folder
      const { data: files } = await supabase.storage
        .from('company-logos')
        .list(companyId);

      if (files && files.length > 0) {
        await supabase.storage
          .from('company-logos')
          .remove(files.map(f => `${companyId}/${f.name}`));
      }

      // Clear URL from company record
      await supabase
        .from('companies')
        .update({ logo_url: null })
        .eq('id', companyId);

      setLogoUrl(null);
      toast({ title: 'Logo removido', description: 'O logo da empresa foi removido.' });
    } catch (error: any) {
      toast({ title: 'Erro ao remover logo', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!companyId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: formData.name,
          phone: formData.phone.replace(/\D/g, ''),
          address: formData.address,
          instagram: formData.instagram,
          facebook: formData.facebook,
          website: formData.website,
        } as any)
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: 'Configurações salvas',
        description: 'Os dados da empresa foram atualizados.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!company) {
    return (
      <div className="bg-card rounded-xl border p-8 shadow-soft flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="bg-card rounded-xl border p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-foreground mb-4">Logo da Empresa</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Imagem entre 50x50 e 300x300 pixels. Será exibida na impressão de Ordens de Serviço.
        </p>
        <div className="flex items-center gap-6">
          <div className="w-28 h-28 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo da empresa" className="max-w-full max-h-full object-contain" />
            ) : (
              <ImageIcon className="w-10 h-10 text-muted-foreground/50" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingLogo}
            >
              {isUploadingLogo ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {logoUrl ? 'Trocar Logo' : 'Enviar Logo'}
            </Button>
            {logoUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveLogo}
                disabled={isUploadingLogo}
                className="text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4 mr-2" />
                Remover
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-foreground mb-6">Dados da Empresa</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="nomeEmpresa">Nome da Empresa</Label>
            <Input
              id="nomeEmpresa"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={formData.cnpj}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">O CNPJ não pode ser alterado</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefoneEmpresa">Telefone</Label>
            <Input
              id="telefoneEmpresa"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
              maxLength={15}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="enderecoEmpresa">Endereço</Label>
            <Input
              id="enderecoEmpresa"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-foreground mb-6">Redes Sociais e Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-pink-600" /> Instagram
            </Label>
            <Input
              id="instagram"
              placeholder="@suaempresa"
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebook" className="flex items-center gap-2">
              <Facebook className="w-4 h-4 text-blue-600" /> Facebook
            </Label>
            <Input
              id="facebook"
              placeholder="facebook.com/suaempresa"
              value={formData.facebook}
              onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> Website
            </Label>
            <Input
              id="website"
              placeholder="https://www.suaempresa.com.br"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Alterações'
          )}
        </Button>
      </div>
    </div>
  );
}