# Upload manual — Prompt Studio V4.1

## Arquivos do pacote

Este pacote contém o código-fonte corrigido. Não envie as pastas `node_modules`,
`dist` ou `.git` ao GitHub.

## Como atualizar o repositório

1. Extraia o ZIP no computador.
2. Abra o repositório `taciofcastelar-code/Prompt_Studio_` no GitHub.
3. Clique em **Add file → Upload files**.
4. Abra a pasta extraída e arraste **os arquivos e pastas que estão dentro dela**.
5. Confirme que `.github`, `public`, `src`, `supabase` e `tests` aparecem no upload.
6. No repositório, apague os arquivos antigos `sw.js` e `manifest.webmanifest` da raiz;
   as versões válidas agora ficam dentro de `public`.
7. Use a mensagem `Aplicar Pacote Crítico 1` e confirme o commit.
8. Em **Settings → Pages → Build and deployment → Source**, escolha **GitHub Actions**.
9. Abra a aba **Actions** e aguarde o fluxo `Test and deploy GitHub Pages` concluir.
10. Atualize o site com `Ctrl + F5`. No celular, feche e abra novamente; se necessário,
   remova a instalação anterior e instale outra vez.

## Validação esperada

- O workflow executa `npm ci`, testes e build antes do deploy.
- O site abre sem erro de importação dos pacotes.
- Rascunhos continuam armazenados localmente.
- Conteúdo digitado não é interpretado como HTML.
- Manifesto, ícone e Service Worker são incluídos no build.

## Observação

O Supabase permanece preparado, mas ainda não conectado ao Prompt Studio. Essa é
a próxima etapa depois da validação deste pacote crítico.
