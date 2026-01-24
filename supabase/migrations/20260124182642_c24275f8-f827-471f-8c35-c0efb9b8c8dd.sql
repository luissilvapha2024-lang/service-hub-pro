-- Inserir serviços vinculados às ordens
INSERT INTO public.order_services (order_id, service_id, service_name, price, quantity) VALUES
-- OS 1: iPhone 13 Pro - Troca de Tela + Limpeza
('1cfb8078-7769-4531-bf92-1228d43b89bc', '2b78591d-2922-4629-9ceb-bc85aa00bd5e', 'Troca de Tela', 250.00, 1),
('1cfb8078-7769-4531-bf92-1228d43b89bc', '01f995e8-a902-48a4-b1bc-a59d329533c1', 'Limpeza Interna', 80.00, 1),
-- OS 2: Samsung Galaxy S22 - Troca de Bateria
('760e4de1-987d-4e74-891e-6240bb226039', '7e901096-0e17-4f3b-b0ff-1bb255632a5f', 'Troca de Bateria', 120.00, 1),
-- OS 3: Motorola Edge 30 - Troca de Conector
('fe98b7b2-841b-4f01-baab-f78eabcd97f4', '7b6ed9bf-3d5e-4c46-846d-3f9f5f2f0216', 'Troca de Conector de Carga', 150.00, 1),
-- OS 4: Xiaomi - Reparo de Placa
('2447143d-6ef2-4947-92a6-fce4fea4f384', 'b1bf1405-e76a-43c5-ab57-97178529fc60', 'Reparo de Placa', 350.00, 1),
-- OS 5: iPhone 12 - Backup + Formatação
('b07862de-6a20-49aa-914d-20dc314584af', '8f4ea4b3-5efa-4154-a4f9-d71a3c080bec', 'Backup de Dados', 50.00, 1),
('b07862de-6a20-49aa-914d-20dc314584af', '2c103aad-b399-4ff0-af90-b2a623e223c2', 'Formatação', 100.00, 1),
-- OS 6: iPhone 11 - Troca de Bateria
('ffc9f82b-446d-48ad-850d-f9f87d9279f3', '7e901096-0e17-4f3b-b0ff-1bb255632a5f', 'Troca de Bateria', 120.00, 1),
-- OS 7: Samsung Galaxy A54 - Troca de Tela
('d5483c0c-df99-4e4c-a4d2-5166712aec3a', '2b78591d-2922-4629-9ceb-bc85aa00bd5e', 'Troca de Tela', 250.00, 1),
('d5483c0c-df99-4e4c-a4d2-5166712aec3a', '01f995e8-a902-48a4-b1bc-a59d329533c1', 'Limpeza Interna', 80.00, 1);