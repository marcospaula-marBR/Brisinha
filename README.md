# Brisinha - MVP Público

Brisinha é um web app conversacional público com suporte a voz, backend leve e integração com Supabase.

## Tecnologias Utilizadas

- **Frontend/Backend**: Next.js (App Router)
- **Banco de Dados**: Supabase Postgres
- **Voz**: Web Speech API (Speech-to-Text)
- **Estilo**: Vanilla CSS (Mobile-First, Glassmorphism)

## Como Rodar Localmente

1. Clone o repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Copie o arquivo `.env.example` para `.env.local` e preencha as variáveis de ambiente:
   ```bash
   cp .env.example .env.local
   ```
4. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Acesse `http://localhost:3000`.

## Variáveis de Ambiente

- `NEXT_PUBLIC_APP_NAME`: Nome do aplicativo (ex: Brisinha).
- `SUPABASE_URL`: URL do seu projeto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço do Supabase (usada apenas no servidor).
- `RATE_LIMIT_PER_MINUTE`: Limite de requisições por minuto (padrão: 30).

## Estrutura do Projeto

- `app/api/`: Route Handlers (API).
- `components/`: Componentes React (Chat, Onboarding, Voz).
- `lib/`: Utilitários, validadores e cliente Supabase.
- `public/`: Arquivos estáticos (Avatar).
