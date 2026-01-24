// Clientes
export const mockClientes = [
  { id: '1', nome: 'Maria Santos', telefone: '11999887766', email: 'maria@email.com', cpf: '123.456.789-00', endereco: 'Rua das Flores, 123', totalOS: 5, ultimaVisita: '2024-01-15' },
  { id: '2', nome: 'Carlos Oliveira', telefone: '11988776655', email: 'carlos@email.com', cpf: '987.654.321-00', endereco: 'Av. Principal, 456', totalOS: 3, ultimaVisita: '2024-01-20' },
  { id: '3', nome: 'Ana Paula', telefone: '11977665544', email: 'ana@email.com', cpf: '456.789.123-00', endereco: 'Rua Central, 789', totalOS: 8, ultimaVisita: '2024-01-22' },
  { id: '4', nome: 'Pedro Lima', telefone: '11966554433', email: 'pedro@email.com', cpf: '321.654.987-00', endereco: 'Av. Brasil, 321', totalOS: 2, ultimaVisita: '2024-01-18' },
  { id: '5', nome: 'Juliana Costa', telefone: '11955443322', email: 'juliana@email.com', cpf: '654.321.987-00', endereco: 'Rua Nova, 654', totalOS: 4, ultimaVisita: '2024-01-21' },
];

// Serviços
export const mockServicos = [
  { id: '1', nome: 'Troca de Tela', valor: 250.00, tempoMedio: '2h', ativo: true, categoria: 'Reparo' },
  { id: '2', nome: 'Troca de Bateria', valor: 120.00, tempoMedio: '1h', ativo: true, categoria: 'Reparo' },
  { id: '3', nome: 'Reparo de Placa', valor: 350.00, tempoMedio: '4h', ativo: true, categoria: 'Reparo' },
  { id: '4', nome: 'Troca de Conector de Carga', valor: 150.00, tempoMedio: '2h', ativo: true, categoria: 'Reparo' },
  { id: '5', nome: 'Limpeza Interna', valor: 80.00, tempoMedio: '1h', ativo: true, categoria: 'Manutenção' },
  { id: '6', nome: 'Backup de Dados', valor: 50.00, tempoMedio: '30min', ativo: true, categoria: 'Software' },
  { id: '7', nome: 'Formatação', valor: 100.00, tempoMedio: '2h', ativo: true, categoria: 'Software' },
  { id: '8', nome: 'Troca de Alto-falante', valor: 130.00, tempoMedio: '1h30', ativo: false, categoria: 'Reparo' },
];

// Status das OS
export type StatusOS = 'em_analise' | 'aguardando_autorizacao' | 'aguardando_pecas' | 'em_andamento' | 'concluido' | 'entregue' | 'pago';

export const statusConfig: Record<StatusOS, { label: string; color: string; bgClass: string }> = {
  em_analise: { label: 'Em Análise', color: 'info', bgClass: 'bg-info/10 text-info' },
  aguardando_autorizacao: { label: 'Aguardando Autorização', color: 'warning', bgClass: 'bg-warning/10 text-warning' },
  aguardando_pecas: { label: 'Aguardando Peças', color: 'warning', bgClass: 'bg-warning/10 text-warning' },
  em_andamento: { label: 'Em Andamento', color: 'primary', bgClass: 'bg-primary/10 text-primary' },
  concluido: { label: 'Concluído', color: 'success', bgClass: 'bg-success/10 text-success' },
  entregue: { label: 'Entregue', color: 'success', bgClass: 'bg-success/10 text-success' },
  pago: { label: 'Pago', color: 'success', bgClass: 'bg-success/10 text-success' },
};

// Ordens de Serviço
export const mockOrdensServico = [
  {
    id: 'OS-001',
    cliente: mockClientes[0],
    aparelho: 'iPhone 13 Pro',
    imei: '123456789012345',
    defeitoRelatado: 'Tela quebrada após queda',
    observacoes: 'Cliente solicitou película junto com a troca',
    servicos: [mockServicos[0], mockServicos[4]],
    valorEstimado: 330.00,
    valorFinal: 330.00,
    status: 'em_andamento' as StatusOS,
    tecnico: 'Carlos Técnico',
    dataCriacao: '2024-01-20',
    dataAtualizacao: '2024-01-22',
    historico: [
      { data: '2024-01-20 09:00', usuario: 'João', acao: 'OS criada', status: 'em_analise' },
      { data: '2024-01-20 14:00', usuario: 'Carlos', acao: 'Iniciou análise', status: 'em_andamento' },
    ],
  },
  {
    id: 'OS-002',
    cliente: mockClientes[1],
    aparelho: 'Samsung Galaxy S22',
    imei: '987654321098765',
    defeitoRelatado: 'Bateria não segura carga',
    observacoes: '',
    servicos: [mockServicos[1]],
    valorEstimado: 120.00,
    valorFinal: 120.00,
    status: 'aguardando_autorizacao' as StatusOS,
    tecnico: 'Carlos Técnico',
    dataCriacao: '2024-01-21',
    dataAtualizacao: '2024-01-21',
    historico: [
      { data: '2024-01-21 10:00', usuario: 'João', acao: 'OS criada', status: 'em_analise' },
      { data: '2024-01-21 11:30', usuario: 'Carlos', acao: 'Orçamento enviado', status: 'aguardando_autorizacao' },
    ],
  },
  {
    id: 'OS-003',
    cliente: mockClientes[2],
    aparelho: 'Motorola Edge 30',
    imei: '456789123456789',
    defeitoRelatado: 'Não carrega',
    observacoes: 'Verificar se não é problema na placa',
    servicos: [mockServicos[3]],
    valorEstimado: 150.00,
    valorFinal: 150.00,
    status: 'concluido' as StatusOS,
    tecnico: 'Maria Técnica',
    dataCriacao: '2024-01-18',
    dataAtualizacao: '2024-01-22',
    historico: [
      { data: '2024-01-18 08:00', usuario: 'João', acao: 'OS criada', status: 'em_analise' },
      { data: '2024-01-19 09:00', usuario: 'Maria', acao: 'Serviço concluído', status: 'concluido' },
    ],
  },
  {
    id: 'OS-004',
    cliente: mockClientes[3],
    aparelho: 'Xiaomi Redmi Note 12',
    imei: '789123456789123',
    defeitoRelatado: 'Placa com curto',
    observacoes: 'Cliente relatou que o aparelho molhou',
    servicos: [mockServicos[2]],
    valorEstimado: 350.00,
    valorFinal: 350.00,
    status: 'aguardando_pecas' as StatusOS,
    tecnico: 'Carlos Técnico',
    dataCriacao: '2024-01-19',
    dataAtualizacao: '2024-01-22',
    historico: [
      { data: '2024-01-19 14:00', usuario: 'João', acao: 'OS criada', status: 'em_analise' },
      { data: '2024-01-20 10:00', usuario: 'Carlos', acao: 'Peças encomendadas', status: 'aguardando_pecas' },
    ],
  },
  {
    id: 'OS-005',
    cliente: mockClientes[4],
    aparelho: 'iPhone 12',
    imei: '321654987321654',
    defeitoRelatado: 'Formatação solicitada',
    observacoes: 'Fazer backup antes',
    servicos: [mockServicos[5], mockServicos[6]],
    valorEstimado: 150.00,
    valorFinal: 150.00,
    status: 'entregue' as StatusOS,
    tecnico: 'Maria Técnica',
    dataCriacao: '2024-01-15',
    dataAtualizacao: '2024-01-17',
    historico: [
      { data: '2024-01-15 11:00', usuario: 'João', acao: 'OS criada', status: 'em_analise' },
      { data: '2024-01-16 16:00', usuario: 'Maria', acao: 'Serviço concluído', status: 'concluido' },
      { data: '2024-01-17 10:00', usuario: 'João', acao: 'Aparelho entregue', status: 'entregue' },
    ],
  },
];

// Produtos para PDV
export const mockProdutos = [
  { id: '1', nome: 'Película de Vidro iPhone', preco: 35.00, estoque: 50, categoria: 'Acessórios' },
  { id: '2', nome: 'Capinha Silicone Universal', preco: 25.00, estoque: 80, categoria: 'Acessórios' },
  { id: '3', nome: 'Carregador USB-C 20W', preco: 65.00, estoque: 30, categoria: 'Carregadores' },
  { id: '4', nome: 'Cabo USB-C 1m', preco: 20.00, estoque: 100, categoria: 'Cabos' },
  { id: '5', nome: 'Fone Bluetooth', preco: 89.00, estoque: 25, categoria: 'Áudio' },
  { id: '6', nome: 'Suporte Veicular', preco: 45.00, estoque: 40, categoria: 'Acessórios' },
  { id: '7', nome: 'Power Bank 10000mAh', preco: 120.00, estoque: 15, categoria: 'Energia' },
  { id: '8', nome: 'Película Privacidade', preco: 55.00, estoque: 35, categoria: 'Acessórios' },
];

// Transações financeiras
export const mockTransacoes = [
  { id: '1', tipo: 'entrada', categoria: 'Serviço', descricao: 'OS-003 - Troca de conector', valor: 150.00, data: '2024-01-22', formaPagamento: 'PIX' },
  { id: '2', tipo: 'entrada', categoria: 'Venda', descricao: 'Venda PDV #1234', valor: 85.00, data: '2024-01-22', formaPagamento: 'Cartão Crédito' },
  { id: '3', tipo: 'saida', categoria: 'Peças', descricao: 'Compra de telas iPhone', valor: 1200.00, data: '2024-01-21', formaPagamento: 'PIX' },
  { id: '4', tipo: 'entrada', categoria: 'Serviço', descricao: 'OS-005 - Formatação', valor: 150.00, data: '2024-01-17', formaPagamento: 'Dinheiro' },
  { id: '5', tipo: 'saida', categoria: 'Aluguel', descricao: 'Aluguel do mês', valor: 2500.00, data: '2024-01-10', formaPagamento: 'Boleto' },
  { id: '6', tipo: 'entrada', categoria: 'Venda', descricao: 'Venda PDV #1230', valor: 210.00, data: '2024-01-20', formaPagamento: 'Cartão Débito' },
  { id: '7', tipo: 'saida', categoria: 'Luz', descricao: 'Conta de luz', valor: 380.00, data: '2024-01-15', formaPagamento: 'Débito Automático' },
  { id: '8', tipo: 'entrada', categoria: 'Serviço', descricao: 'OS-001 - Troca de tela (parcial)', valor: 200.00, data: '2024-01-22', formaPagamento: 'PIX' },
];

// Usuários do sistema
export const mockUsuarios = [
  { id: '1', nome: 'João Silva', email: 'joao@techfix.com', role: 'admin', ativo: true },
  { id: '2', nome: 'Carlos Técnico', email: 'carlos@techfix.com', role: 'tecnico', ativo: true },
  { id: '3', nome: 'Maria Técnica', email: 'maria@techfix.com', role: 'tecnico', ativo: true },
  { id: '4', nome: 'Ana Caixa', email: 'ana@techfix.com', role: 'caixa', ativo: true },
];

// Dados do dashboard
export const mockDashboardData = {
  osEmAndamento: 2,
  osAguardandoAutorizacao: 1,
  osConcluidasHoje: 1,
  faturamentoDia: 435.00,
  faturamentoMes: 8750.00,
  lucroEstimado: 4200.00,
  vendasPorDia: [
    { dia: 'Seg', valor: 850 },
    { dia: 'Ter', valor: 1200 },
    { dia: 'Qua', valor: 980 },
    { dia: 'Qui', valor: 1450 },
    { dia: 'Sex', valor: 1890 },
    { dia: 'Sáb', valor: 2100 },
    { dia: 'Dom', valor: 280 },
  ],
  servicosMaisRealizados: [
    { nome: 'Troca de Tela', quantidade: 45 },
    { nome: 'Troca de Bateria', quantidade: 38 },
    { nome: 'Reparo de Placa', quantidade: 22 },
    { nome: 'Troca de Conector', quantidade: 18 },
    { nome: 'Formatação', quantidade: 15 },
  ],
  statusOS: [
    { status: 'Em Análise', quantidade: 3, cor: '#3B82F6' },
    { status: 'Aguardando', quantidade: 5, cor: '#F59E0B' },
    { status: 'Em Andamento', quantidade: 8, cor: '#0891B2' },
    { status: 'Concluído', quantidade: 12, cor: '#10B981' },
  ],
};

// Empresa
export const mockEmpresa = {
  nome: 'TechFix Assistência',
  cnpj: '12.345.678/0001-90',
  endereco: 'Av. Tecnologia, 1000 - Centro',
  telefone: '(11) 3456-7890',
  email: 'contato@techfix.com',
  logo: null,
};
