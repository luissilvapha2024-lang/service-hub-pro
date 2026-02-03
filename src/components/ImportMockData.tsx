"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database, CheckCircle2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const mockServicos = [
  { nome: 'Troca de Tela', valor: 250.00, tempoMinutos: 120, descricao: 'Substituição completa do display' },
  { nome: 'Troca de Bateria', valor: 120.00, tempoMinutos: 60, descricao: 'Substituição da bateria' },
  { nome: 'Reparo de Placa', valor: 350.00, tempoMinutos: 240, descricao: 'Reparo de componentes da placa-mãe' },
  { nome: 'Troca de Conector de Carga', valor: 150.00, tempoMinutos: 120, descricao: 'Substituição do conector USB/Lightning' },
  { nome: 'Limpeza Interna', valor: 80.00, tempoMinutos: 60, descricao: 'Limpeza e manutenção preventiva' },
  { nome: 'Backup de Dados', valor: 50.00, tempoMinutos: 30, descricao: 'Cópia de segurança dos dados' },
  { nome: 'Formatação', valor: 100.00, tempoMinutos: 120, descricao: 'Reset de fábrica e reinstalação' },
];

const mockProdutos = [
  { nome: 'Película de Vidro iPhone', preco: 35.00, custo: 15.00, estoque: 50, sku: 'PEL-IPH-001' },
  { nome: 'Capinha Silicone Universal', preco: 25.00, custo: 10.00, estoque: 80, sku: 'CAP-SIL-001' },
  { nome: 'Carregador USB-C 20W', preco: 65.00, custo: 30.00, estoque: 30, sku: 'CAR-USC-001' },
  { nome: 'Cabo USB-C 1m', preco: 20.00, custo: 8.00, estoque: 100, sku: 'CAB-USC-001' },
  { nome: 'Fone Bluetooth', preco: 89.00, custo: 40.00, estoque: 25, sku: 'FON-BLU-001' },
  { nome: 'Suporte Veicular', preco: 45.00, custo: 20.00, estoque: 40, sku: 'SUP-VEI-001' },
  { nome: 'Power Bank 10000mAh', preco: 120.00, custo: 55.00, estoque: 15, sku: 'PWB-10K-001' },
  { nome: 'Película Privacidade', preco: 55.00, custo: 25.00, estoque: 35, sku: 'PEL-PRI-001' },
];

export function ImportMockData() {
  const { user, companyId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);
  const [importedData, setImportedData] = useState({
    services: false,
    products: false,
  });

  const importServices = async () => {
    if (!user || !companyId) return [];

    const servicesToInsert = mockServicos.map((s) => ({
      user_id: user.id,
      company_id: companyId,
      name: s.nome,
      price: s.valor,
      estimated_time: s.tempoMinutos,
      description: s.descricao,
      is_active: true,
    }));

    const { data, error } = await supabase
      .from('services')
      .insert(servicesToInsert)
      .select();

    if (error) throw error;
    return data;
  };

  const importProducts = async () => {
    if (!user || !companyId) return [];

    const productsToInsert = mockProdutos.map((p) => ({
      user_id: user.id,
      company_id: companyId,
      name: p.nome,
      price: p.preco,
      cost: p.custo,
      stock: p.estoque,
      sku: p.sku,
      is_active: true,
    }));

    const { data, error } = await supabase
      .from('products')
      .insert(productsToInsert)
      .select();

    if (error) throw error;
    return data;
  };

  const handleImportAll = async () => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para importar dados.',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);

    try {
      // Import services
      await importServices();
      setImportedData((prev) => ({ ...prev, services: true }));

      // Import products
      await importProducts();
      setImportedData((prev) => ({ ...prev, products: true }));

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      toast({
        title: 'Dados importados!',
        description: 'Serviços e produtos de exemplo foram importados com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const allImported = Object.values(importedData).every(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Importar Dados de Exemplo
        </CardTitle>
        <CardDescription>
          Importe serviços e produtos de exemplo para testar o sistema rapidamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg border text-center transition-colors ${importedData.services ? 'bg-success/10 border-success' : 'bg-muted'}`}>
            {importedData.services && <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-2" />}
            <span className="text-sm font-medium">Serviços</span>
          </div>
          <div className={`p-4 rounded-lg border text-center transition-colors ${importedData.products ? 'bg-success/10 border-success' : 'bg-muted'}`}>
            {importedData.products && <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-2" />}
            <span className="text-sm font-medium">Produtos</span>
          </div>
        </div>

        <Button
          onClick={handleImportAll}
          disabled={isImporting || allImported}
          className="w-full"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importando...
            </>
          ) : allImported ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Dados Importados
            </>
          ) : (
            'Importar Serviços e Produtos'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}