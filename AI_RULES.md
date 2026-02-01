# Regras para Desenvolvimento com IA

Este documento descreve a stack tecnológica do projeto e as diretrizes para o uso de bibliotecas e ferramentas, garantindo consistência e boas práticas.

## Stack Tecnológica

*   **Vite**: Ferramenta de build e desenvolvimento rápido.
*   **TypeScript**: Linguagem de programação para tipagem estática e melhor manutenibilidade.
*   **React**: Biblioteca para construção de interfaces de usuário.
*   **shadcn/ui**: Coleção de componentes de UI reutilizáveis e acessíveis, construídos com Radix UI e estilizados com Tailwind CSS.
*   **Tailwind CSS**: Framework CSS utilitário para estilização rápida e responsiva.
*   **React Router DOM**: Biblioteca para roteamento declarativo no lado do cliente.
*   **Supabase**: Backend-as-a-Service para autenticação, banco de dados (PostgreSQL), armazenamento de arquivos e funções serverless.
*   **TanStack Query (React Query)**: Biblioteca para gerenciamento de estado do servidor, caching e sincronização de dados.
*   **Lucide React**: Biblioteca de ícones leves e personalizáveis.
*   **date-fns**: Biblioteca para manipulação e formatação de datas.
*   **Recharts**: Biblioteca para criação de gráficos e visualização de dados.
*   **Sonner**: Biblioteca para notificações toast.
*   **jspdf & jspdf-autotable**: Bibliotecas para geração de documentos PDF.
*   **react-hook-form & Zod**: Bibliotecas para gerenciamento e validação de formulários.

## Regras de Uso de Bibliotecas e Ferramentas

Para manter a consistência e a qualidade do código, siga estas diretrizes:

1.  **Componentes de UI**:
    *   Sempre utilize os componentes do **shadcn/ui** para elementos de interface.
    *   Se um componente específico não estiver disponível no shadcn/ui ou precisar de personalização significativa, crie um novo componente em `src/components/` utilizando **Tailwind CSS** para estilização. **Nunca modifique os arquivos originais do shadcn/ui.**

2.  **Estilização**:
    *   Utilize exclusivamente **Tailwind CSS** para toda a estilização. Evite estilos inline ou arquivos CSS separados, exceto para estilos globais definidos em `src/index.css`.
    *   Priorize classes utilitárias do Tailwind para layout, espaçamento, cores e outros aspectos de design.

3.  **Roteamento**:
    *   Utilize **React Router DOM** para todas as rotas do lado do cliente.
    *   Mantenha a definição das rotas centralizada em `src/App.tsx`.

4.  **Interação com o Backend**:
    *   Todas as operações de backend (autenticação, consultas ao banco de dados, upload de arquivos, funções serverless) devem ser realizadas através do **Supabase**.
    *   Utilize o cliente Supabase configurado em `src/integrations/supabase/client.ts` e crie hooks personalizados em `src/hooks/` para encapsular a lógica de dados.

5.  **Gerenciamento de Dados (Server State)**:
    *   Para fetching, caching, sincronização e atualização de dados do servidor, utilize **TanStack Query (React Query)**.

6.  **Ícones**:
    *   Utilize a biblioteca **Lucide React** para todos os ícones na aplicação.

7.  **Manipulação de Datas**:
    *   Para qualquer operação com datas (formatação, cálculo, comparação), utilize a biblioteca **date-fns**.

8.  **Gráficos**:
    *   Para todas as visualizações de dados e gráficos, utilize a biblioteca **Recharts**.

9.  **Notificações**:
    *   Para exibir notificações toast ao usuário, utilize a biblioteca **Sonner**.

10. **Formulários**:
    *   Para gerenciamento de formulários e validação, utilize **react-hook-form** em conjunto com **Zod** para definição de schemas.

11. **Exportação de Documentos**:
    *   Para gerar relatórios em formato PDF, utilize **jspdf** e **jspdf-autotable**.
    *   Para exportar dados em formato CSV, utilize a função utilitária `exportToCSV` disponível em `src/utils/exportCSV.ts`.

12. **Estrutura de Arquivos**:
    *   `src/pages/`: Para componentes de visualização de nível superior (páginas).
    *   `src/components/`: Para componentes de UI reutilizáveis.
    *   `src/hooks/`: Para hooks React personalizados que encapsulam lógica.
    *   `src/contexts/`: Para provedores de contexto React.
    *   `src/integrations/`: Para integrações com serviços de terceiros (ex: Supabase).
    *   `src/utils/`: Para funções utilitárias gerais.