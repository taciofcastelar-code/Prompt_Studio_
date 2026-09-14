# Architecture — V4.1 Intelligence

## Camadas
1. UI/PWA
2. Intelligence Engine
3. Prompt Scoring
4. Local persistence (IndexedDB)
5. Cloud persistence (Supabase)
6. Analytics / Learning Loop

## Fluxo principal
Idea → Project Context → Architect → Intelligence Engine → Score → Optimizer → Comparator → Execution → Feedback → Learning Loop → Analytics

## Princípio de sincronização
- Rascunhos e sessão atual: local-first
- Projetos, prompts aprovados, versões, scores e feedback: Supabase
- Em conflito: não sobrescrever silenciosamente; gerar reconciliação

## Próximas implementações
- Auth
- Router/views
- Projects CRUD
- Optimizer
- Comparator
- Library
- Test Lab
- Analytics
- Sync engine
