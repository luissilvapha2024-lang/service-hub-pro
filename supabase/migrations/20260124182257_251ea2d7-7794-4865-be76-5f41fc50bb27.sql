-- Inserir clientes para o usuário joaovictor.ofi@gmail.com
INSERT INTO public.clients (user_id, name, phone, email, cpf, address) VALUES
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'Maria Santos', '11999887766', 'maria@email.com', '123.456.789-00', 'Rua das Flores, 123'),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'Carlos Oliveira', '11988776655', 'carlos@email.com', '987.654.321-00', 'Av. Principal, 456'),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'Ana Paula Silva', '11977665544', 'ana@email.com', '456.789.123-00', 'Rua Central, 789'),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'Pedro Lima', '11966554433', 'pedro@email.com', '321.654.987-00', 'Av. Brasil, 321'),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'Juliana Costa', '11955443322', 'juliana@email.com', '654.321.987-00', 'Rua Nova, 654');

-- Inserir serviços
INSERT INTO public.services (user_id, name, price, estimated_time, description, is_active) VALUES
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'Troca de Tela', 250.00, 120, 'Substituição completa do display', true),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'Troca de Bateria', 120.00, 60, 'Substituição da bateria', true),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'Reparo de Placa', 350.00, 240, 'Reparo de componentes da placa-mãe', true),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'Troca de Conector de Carga', 150.00, 120, 'Substituição do conector USB/Lightning', true),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'Limpeza Interna', 80.00, 60, 'Limpeza e manutenção preventiva', true),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'Backup de Dados', 50.00, 30, 'Cópia de segurança dos dados', true),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'Formatação', 100.00, 120, 'Reset de fábrica e reinstalação', true);

-- Inserir produtos
INSERT INTO public.products (user_id, name, price, cost, stock, sku, is_active, min_stock) VALUES
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'Película de Vidro iPhone', 35.00, 15.00, 50, 'PEL-IPH-001', true, 10),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'Capinha Silicone Universal', 25.00, 10.00, 80, 'CAP-SIL-001', true, 15),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'Carregador USB-C 20W', 65.00, 30.00, 30, 'CAR-USC-001', true, 5),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'Cabo USB-C 1m', 20.00, 8.00, 100, 'CAB-USC-001', true, 20),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'Fone Bluetooth', 89.00, 40.00, 25, 'FON-BLU-001', true, 5),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'Suporte Veicular', 45.00, 20.00, 40, 'SUP-VEI-001', true, 8),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'Power Bank 10000mAh', 120.00, 55.00, 15, 'PWB-10K-001', true, 3),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'Película Privacidade', 55.00, 25.00, 35, 'PEL-PRI-001', true, 10);

-- Inserir transações financeiras (últimos dias)
INSERT INTO public.transactions (user_id, type, category, description, amount, payment_method, created_at) VALUES
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'entrada', 'Serviço', 'OS-001 - Troca de tela iPhone 13', 250.00, 'PIX', NOW()),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'entrada', 'Venda', 'Venda PDV - Capinhas e películas', 185.00, 'Cartão Crédito', NOW()),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'entrada', 'Serviço', 'OS-002 - Troca de bateria Samsung', 120.00, 'Dinheiro', NOW() - INTERVAL '1 day'),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'saida', 'Peças', 'Compra de telas iPhone - Fornecedor XYZ', 1200.00, 'PIX', NOW() - INTERVAL '1 day'),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'entrada', 'Venda', 'Venda PDV - Carregadores', 210.00, 'Cartão Débito', NOW() - INTERVAL '2 days'),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'entrada', 'Serviço', 'OS-003 - Reparo de placa Motorola', 350.00, 'PIX', NOW() - INTERVAL '2 days'),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'entrada', 'Serviço', 'OS-004 - Troca conector de carga', 150.00, 'Cartão Crédito', NOW() - INTERVAL '3 days'),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'entrada', 'Venda', 'Venda PDV - Fones Bluetooth', 267.00, 'PIX', NOW() - INTERVAL '3 days'),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'saida', 'Despesas', 'Conta de energia elétrica', 380.00, 'Débito Automático', NOW() - INTERVAL '4 days'),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'entrada', 'Serviço', 'OS-005 - Formatação iPhone 12', 100.00, 'Dinheiro', NOW() - INTERVAL '4 days'),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'entrada', 'Venda', 'Venda PDV - Acessórios diversos', 320.00, 'Cartão Crédito', NOW() - INTERVAL '5 days'),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'entrada', 'Serviço', 'OS-006 - Limpeza e manutenção', 80.00, 'PIX', NOW() - INTERVAL '5 days'),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'entrada', 'Serviço', 'OS-007 - Troca de tela Samsung S22', 280.00, 'Cartão Débito', NOW() - INTERVAL '6 days'),
('a0deff3e-f8d3-46df-95a1-9ad74beb107b', 'saida', 'Peças', 'Compra de baterias - Fornecedor ABC', 650.00, 'Boleto', NOW() - INTERVAL '6 days');