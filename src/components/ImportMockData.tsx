import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database, CheckCircle2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const mockClientes = [
  { nome: 'Maria Santos', telefone: '11999887766', email: 'maria@email.com', cpf: '123.456.789-00', endereco: 'Rua das Flores, 123' },
  { nome: 'Carlos Oliveira', telefone: '11988776655', email: 'carlos@email.com', cpf: '987.654.321-00', endereco: 'Av. Principal, 456' },
  { nome: 'Ana Paula', telefone: '11977665544', email: 'ana@email.com', cpf: '456.789.123-00', endereco: 'Rua Central, 789' },
  { nome: 'Pedro Lima', telefone: '11966554433', email: 'pedro@email.com', cpf: '321.654.987-00', endereco: 'Av. Brasil, 321' },
  { nome: 'Juliana Costa', telefone: '11955443322', email: 'juliana@email.com', cpf: '654.321.987-00', endereco: 'Rua Nova, 654' },
];

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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);
  const [importedData, setImportedData] = useState({
    clients: false,
    services: false,
    products: false,
    orders: false,
    transactions: false,
  });

  const importClients = async () => {
    if (!user) return [];
    
    const clientsToInsert = mockClientes.map((c) => ({
      user_id: user.id,
      name: c.nome,
      phone: c.telefone,
      email: c.email,
      cpf: c.cpf,
      address: c.endereco,
    }));

    const { data, error } = await supabase
      .from('clients')
      .insert(clientsToInsert)
      .select();

    if (error) throw error;
    return data;
  };

  const importServices = async () => {
    if (!user) return [];

    const servicesToInsert = mockServicos.map((s) => ({
      user_id: user.id,
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
    if (!user) return [];

    const productsToInsert = mockProdutos.map((p) => ({
      user_id: user.id,
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

  const importOrders = async (clients: any[], services: any[]) => {
    if (!user || clients.length === 0 || services.length === 0) return [];

    const ordersToInsert = [
      {
        user_id: user.id,
        client_id: clients[0].id,
        device_model: 'iPhone 13 Pro',
        device_imei: '123456789012345',
        reported_issue: 'Tela quebrada após queda',
        observations: 'Cliente solicitou película junto com a troca',
        status: 'em_andamento' as const,
        estimated_value: 330.00,
        final_value: 330.00,
      },
      {
        user_id: user.id,
        client_id: clients[1].id,
        device_model: 'Samsung Galaxy S22',
        device_imei: '987654321098765',
        reported_issue: 'Bateria não segura carga',
        status: 'aguardando_autorizacao' as const,
        estimated_value: 120.00,
      },
      {
        user_id: user.id,
        client_id: clients[2].id,
        device_model: 'Motorola Edge 30',
        device_imei: '456789123456789',
        reported_issue: 'Não carrega',
        observations: 'Verificar se não é problema na placa',
        status: 'concluido' as const,
        estimated_value: 150.00,
        final_value: 150.00,
        completed_at: new Date().toISOString(),
      },
      {
        user_id: user.id,
        client_id: clients[3].id,
        device_model: 'Xiaomi Redmi Note 12',
        device_imei: '789123456789123',
        reported_issue: 'Placa com curto',
        observations: 'Cliente relatou que o aparelho molhou',
        status: 'aguardando_pecas' as const,
        estimated_value: 350.00,
      },
      {
        user_id: user.id,
        client_id: clients[4].id,
        device_model: 'iPhone 12',
        device_imei: '321654987321654',
        reported_issue: 'Formatação solicitada',
        observations: 'Fazer backup antes',
        status: 'entregue' as const,
        estimated_value: 150.00,
        final_value: 150.00,
        completed_at: new Date(Date.now() - 86400000).toISOString(),
        delivered_at: new Date().toISOString(),
      },
    ];

    const { data: orders, error: ordersError } = await supabase
      .from('service_orders')
      .insert(ordersToInsert)
      .select();

    if (ordersError) throw ordersError;

    // Add services to orders
    const orderServicesToInsert = [
      { order_id: orders[0].id, service_id: services[0].id, service_name: services[0].name, price: services[0].price, quantity: 1 },
      { order_id: orders[0].id, service_id: services[4].id, service_name: services[4].name, price: services[4].price, quantity: 1 },
      { order_id: orders[1].id, service_id: services[1].id, service_name: services[1].name, price: services[1].price, quantity: 1 },
      { order_id: orders[2].id, service_id: services[3].id, service_name: services[3].name, price: services[3].price, quantity: 1 },
      { order_id: orders[3].id, service_id: services[2].id, service_name: services[2].name, price: services[2].price, quantity: 1 },
      { order_id: orders[4].id, service_id: services[5].id, service_name: services[5].name, price: services[5].price, quantity: 1 },
      { order_id: orders[4].id, service_id: services[6].id, service_name: services[6].name, price: services[6].price, quantity: 1 },
    ];

    const { error: servicesError } = await supabase
      .from('order_services')
      .insert(orderServicesToInsert);

    if (servicesError) throw servicesError;

    return orders;
  };

  const importTransactions = async () => {
    if (!user) return;

    const today = new Date();
    const transactionsToInsert = [
      { user_id: user.id, type: 'entrada' as const, category: 'Serviço', description: 'OS-003 - Troca de conector', amount: 150.00, payment_method: 'PIX', created_at: today.toISOString() },
      { user_id: user.id, type: 'entrada' as const, category: 'Venda', description: 'Venda PDV #1234', amount: 85.00, payment_method: 'Cartão Crédito', created_at: today.toISOString() },
      { user_id: user.id, type: 'saida' as const, category: 'Peças', description: 'Compra de telas iPhone', amount: 1200.00, payment_method: 'PIX', created_at: new Date(Date.now() - 86400000).toISOString() },
      { user_id: user.id, type: 'entrada' as const, category: 'Serviço', description: 'OS-005 - Formatação', amount: 150.00, payment_method: 'Dinheiro', created_at: new Date(Date.now() - 172800000).toISOString() },
      { user_id: user.id, type: 'entrada' as const, category: 'Venda', description: 'Venda PDV #1230', amount: 210.00, payment_method: 'Cartão Débito', created_at: new Date(Date.now() - 259200000).toISOString() },
      { user_id: user.id, type: 'entrada' as const, category: 'Serviço', description: 'OS-001 - Troca de tela', amount: 200.00, payment_method: 'PIX', created_at: today.toISOString() },
      { user_id: user.id, type: 'entrada' as const, category: 'Venda', description: 'Venda PDV #1235', amount: 320.00, payment_method: 'PIX', created_at: new Date(Date.now() - 345600000).toISOString() },
      { user_id: user.id, type: 'entrada' as const, category: 'Serviço', description: 'OS-002 - Reparo de placa', amount: 450.00, payment_method: 'Cartão Crédito', created_at: new Date(Date.now() - 432000000).toISOString() },
    ];

    const { error } = await supabase
      .from('transactions')
      .insert(transactionsToInsert);

    if (error) throw error;
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
      // Import clients
      const clients = await importClients();
      setImportedData((prev) => ({ ...prev, clients: true }));

      // Import services
      const services = await importServices();
      setImportedData((prev) => ({ ...prev, services: true }));

      // Import products
      await importProducts();
      setImportedData((prev) => ({ ...prev, products: true }));

      // Import orders
      await importOrders(clients, services);
      setImportedData((prev) => ({ ...prev, orders: true }));

      // Import transactions
      await importTransactions();
      setImportedData((prev) => ({ ...prev, transactions: true }));

      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();

      toast({
        title: 'Dados importados!',
        description: 'Todos os dados de exemplo foram importados com sucesso.',
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
          Importe clientes, serviços, produtos e ordens de serviço de exemplo para testar o sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className={`p-3 rounded-lg border text-center ${importedData.clients ? 'bg-success/10 border-success' : 'bg-muted'}`}>
            {importedData.clients && <CheckCircle2 className="h-4 w-4 text-success mx-auto mb-1" />}
            <span className="text-sm">Clientes</span>
          </div>
          <div className={`p-3 rounded-lg border text-center ${importedData.services ? 'bg-success/10 border-success' : 'bg-muted'}`}>
            {importedData.services && <CheckCircle2 className="h-4 w-4 text-success mx-auto mb-1" />}
            <span className="text-sm">Serviços</span>
          </div>
          <div className={`p-3 rounded-lg border text-center ${importedData.products ? 'bg-success/10 border-success' : 'bg-muted'}`}>
            {importedData.products && <CheckCircle2 className="h-4 w-4 text-success mx-auto mb-1" />}
            <span className="text-sm">Produtos</span>
          </div>
          <div className={`p-3 rounded-lg border text-center ${importedData.orders ? 'bg-success/10 border-success' : 'bg-muted'}`}>
            {importedData.orders && <CheckCircle2 className="h-4 w-4 text-success mx-auto mb-1" />}
            <span className="text-sm">Ordens</span>
          </div>
          <div className={`p-3 rounded-lg border text-center ${importedData.transactions ? 'bg-success/10 border-success' : 'bg-muted'}`}>
            {importedData.transactions && <CheckCircle2 className="h-4 w-4 text-success mx-auto mb-1" />}
            <span className="text-sm">Transações</span>
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
            'Importar Todos os Dados'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
