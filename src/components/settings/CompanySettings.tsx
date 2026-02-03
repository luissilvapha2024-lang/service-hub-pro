import { useState, useEffect } from 'react';
import { Loader2, Instagram, Facebook, Globe } from 'lucide-react';
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