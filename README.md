# Prompt Studio V4.1 Intelligence

Base robusta para teste do Prompt Studio V4.1 Intelligence.

## Objetivo
Transformar intenções vagas em objetivos executáveis, diagnosticar lacunas, gerar e otimizar prompts, medir qualidade e aprender com resultados reais.

## Arquitetura
- PWA responsiva
- Vite + JavaScript modular
- IndexedDB para cache/offline
- Supabase para Auth, PostgreSQL, RLS, histórico e analytics
- Vitest para testes unitários
- GitHub Actions para testes e deploy no GitHub Pages

## Módulos iniciais
1. Dashboard
2. Projects
3. Prompt Architect
4. Intelligence Engine
5. Prompt Score
6. Optimizer
7. Comparator
8. Prompt Library
9. Test Lab
10. Learning Loop
11. Analytics
12. Settings

## Segurança
- Nunca colocar `service_role` no frontend.
- Usar somente chave publishable/anon no cliente.
- RLS obrigatória nas tabelas expostas.
- Dados pertencem ao usuário por `auth.uid()`.

## Inicialização
```bash
npm install
cp .env.example .env
npm run dev
```

## Testes
```bash
npm test
```

## Build
```bash
npm run build
```

## Supabase
A migration inicial está em `supabase/migrations/001_initial_schema.sql`.

Antes de produção:
1. criar um projeto Supabase separado para o Prompt Studio;
2. aplicar a migration;
3. executar Security e Performance Advisors;
4. preencher `.env`;
5. validar login, RLS e isolamento entre usuários.

## Status
V4.1 Intelligence Test Build — scaffold inicial.
