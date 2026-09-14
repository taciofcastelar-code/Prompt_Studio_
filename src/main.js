import './styles.css';
import { analyzePrompt } from './modules/intelligence.js';
import { scorePrompt } from './modules/scoring.js';
import { saveDraft, listDrafts } from './services/local-db.js';

const app = document.querySelector('#app');

app.innerHTML = `
  <header class="topbar">
    <div>
      <strong>Prompt Studio V4.1</strong>
      <span>Intelligence Test Build</span>
    </div>
    <button id="statusBtn" class="ghost">Local mode</button>
  </header>

  <main class="shell">
    <aside class="sidebar">
      <button class="nav active">Dashboard</button>
      <button class="nav">Projects</button>
      <button class="nav">Prompt Architect</button>
      <button class="nav">Library</button>
      <button class="nav">Test Lab</button>
      <button class="nav">Analytics</button>
    </aside>

    <section class="content">
      <section class="hero">
        <p class="eyebrow">INTELLIGENCE ENGINE V1</p>
        <h1>Transforme intenção em instrução executável.</h1>
        <p>Digite um objetivo ou prompt. A versão de teste fará diagnóstico, score e recomendações.</p>
      </section>

      <section class="grid">
        <article class="card composer">
          <label for="promptInput">Prompt / objetivo</label>
          <textarea id="promptInput" placeholder="Ex.: Quero criar um aplicativo para aprender inglês."></textarea>
          <div class="actions">
            <button id="analyzeBtn">Analisar</button>
            <button id="saveBtn" class="secondary">Salvar rascunho</button>
          </div>
        </article>

        <article class="card score-card">
          <span>Prompt Intelligence Score</span>
          <strong id="overallScore">—</strong>
          <small id="scoreLabel">Aguardando análise</small>
        </article>
      </section>

      <section class="grid lower">
        <article class="card">
          <h2>Diagnóstico</h2>
          <div id="diagnosis" class="empty">Nenhuma análise executada.</div>
        </article>
        <article class="card">
          <h2>Dimensões</h2>
          <div id="dimensions" class="empty">Os indicadores aparecerão aqui.</div>
        </article>
      </section>

      <section class="card">
        <h2>Rascunhos locais</h2>
        <div id="drafts" class="empty">Carregando...</div>
      </section>
    </section>
  </main>
`;

const input = document.querySelector('#promptInput');
const diagnosis = document.querySelector('#diagnosis');
const dimensions = document.querySelector('#dimensions');
const overallScore = document.querySelector('#overallScore');
const scoreLabel = document.querySelector('#scoreLabel');
const draftsEl = document.querySelector('#drafts');

function scoreClass(value) {
  if (value >= 90) return 'Excelente';
  if (value >= 75) return 'Bom';
  if (value >= 60) return 'Utilizável, mas incompleto';
  return 'Precisa de refinamento';
}

function renderAnalysis(text) {
  const analysis = analyzePrompt(text);
  const score = scorePrompt(text, analysis);

  overallScore.textContent = score.overall;
  scoreLabel.textContent = scoreClass(score.overall);

  diagnosis.innerHTML = analysis.issues.length
    ? `<ul>${analysis.issues.map(x => `<li><strong>${x.title}:</strong> ${x.message}</li>`).join('')}</ul>`
    : `<p>Nenhuma fragilidade estrutural evidente foi detectada.</p>`;

  dimensions.innerHTML = Object.entries(score.dimensions)
    .map(([key, value]) => `<div class="metric"><span>${key}</span><progress max="100" value="${value}"></progress><b>${value}</b></div>`)
    .join('');
}

function createDraftElement(draft) {
  const wrapper = document.createElement('div');
  wrapper.className = 'draft';

  const date = document.createElement('span');
  date.textContent = new Date(draft.createdAt).toLocaleString('pt-BR');

  const text = document.createElement('p');
  text.textContent = draft.text;

  wrapper.append(date, text);
  return wrapper;
}

async function refreshDrafts() {
  try {
    const drafts = await listDrafts();
    draftsEl.replaceChildren();

    if (!drafts.length) {
      draftsEl.textContent = 'Nenhum rascunho salvo.';
      return;
    }

    drafts.forEach(draft => draftsEl.append(createDraftElement(draft)));
  } catch {
    draftsEl.textContent = 'Não foi possível carregar os rascunhos locais.';
  }
}

document.querySelector('#analyzeBtn').addEventListener('click', () => {
  const text = input.value.trim();
  if (!text) return;
  renderAnalysis(text);
});

document.querySelector('#saveBtn').addEventListener('click', async () => {
  const text = input.value.trim();
  if (!text) return;
  try {
    await saveDraft(text);
    await refreshDrafts();
  } catch {
    draftsEl.textContent = 'Não foi possível salvar o rascunho neste navegador.';
  }
});

refreshDrafts();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      document.querySelector('#statusBtn').textContent = 'Online, sem modo offline';
    });
  });
}
