import './styles.css';
import { analyzePrompt, buildOptimizedPrompt } from './modules/intelligence.js';
import { scorePrompt } from './modules/scoring.js';
import {
  saveProject, listProjects, deleteProject,
  savePrompt, listPrompts, deletePrompt,
  saveTest, listTests, deleteTest
} from './services/local-db.js';

const app = document.querySelector('#app');

const state = {
  view: 'painel',
  projects: [],
  prompts: [],
  tests: [],
  currentAnalysis: null
};

const views = {
  painel: 'Painel',
  projetos: 'Projetos',
  arquiteto: 'Arquiteto de Prompts',
  biblioteca: 'Biblioteca',
  laboratorio: 'Laboratório de Testes',
  analises: 'Análises'
};

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
  }[c]));
}

function fmtDate(ts) {
  return ts ? new Date(ts).toLocaleString('pt-BR') : '—';
}

function scoreLabel(value) {
  if (value >= 90) return 'Excelente';
  if (value >= 75) return 'Bom';
  if (value >= 60) return 'Utilizável';
  return 'Precisa de refinamento';
}

function nav() {
  return `
    <aside class="sidebar">
      <div class="brand">
        <strong>Prompt Studio V4.1</strong>
        <span>Inteligência aplicada</span>
      </div>
      ${Object.entries(views).map(([key, label]) =>
        `<button class="nav ${state.view === key ? 'active' : ''}" data-view="${key}">${label}</button>`
      ).join('')}
      <div class="sidebar-footer">
        <span class="status-dot"></span>
        <span>Modo local ativo</span>
      </div>
    </aside>`;
}

function layout(content) {
  app.innerHTML = `
    <div class="app-shell">
      ${nav()}
      <main class="main">
        <header class="topbar">
          <div>
            <span class="eyebrow">PROMPT STUDIO</span>
            <h1>${views[state.view]}</h1>
          </div>
          <div class="top-actions">
            <button class="ghost" data-view="arquiteto">Novo prompt</button>
          </div>
        </header>
        <section class="page">${content}</section>
      </main>
    </div>`;
  bindGlobal();
}

function bindGlobal() {
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.view = btn.dataset.view;
      render();
    });
  });
}

function statCard(label, value, detail='') {
  return `<article class="stat-card"><span>${label}</span><strong>${value}</strong><small>${detail}</small></article>`;
}

function renderPainel() {
  const avg = state.prompts.length
    ? Math.round(state.prompts.reduce((s, p) => s + (p.score || 0), 0) / state.prompts.length)
    : 0;

  const recent = [...state.prompts].slice(0, 5);

  layout(`
    <section class="hero">
      <div>
        <p class="eyebrow">INTELIGÊNCIA → ESTRATÉGIA → EXECUÇÃO → MELHORIA</p>
        <h2>Transforme uma ideia em uma instrução executável.</h2>
        <p>Organize projetos, construa prompts, compare versões, registre testes e acompanhe a qualidade ao longo do tempo.</p>
      </div>
      <button class="primary" id="quickNew">Criar prompt</button>
    </section>

    <section class="stats">
      ${statCard('Projetos', state.projects.length, 'organizados')}
      ${statCard('Prompts', state.prompts.length, 'na biblioteca')}
      ${statCard('Testes', state.tests.length, 'registrados')}
      ${statCard('Score médio', avg || '—', avg ? scoreLabel(avg) : 'sem dados')}
    </section>

    <section class="grid-2">
      <article class="card">
        <div class="section-title"><h3>Prompts recentes</h3><button class="link" data-view="biblioteca">Ver biblioteca</button></div>
        ${recent.length ? recent.map(p => `
          <div class="row-item">
            <div><strong>${esc(p.title)}</strong><small>${fmtDate(p.updatedAt)}</small></div>
            <span class="score-badge">${p.score || 0}</span>
          </div>`).join('') : '<div class="empty">Nenhum prompt salvo ainda.</div>'}
      </article>

      <article class="card">
        <div class="section-title"><h3>Fluxo recomendado</h3></div>
        <ol class="flow-list">
          <li><b>Defina o objetivo</b><span>O que precisa acontecer?</span></li>
          <li><b>Construa o prompt</b><span>Contexto, critérios, limites e formato.</span></li>
          <li><b>Analise</b><span>Score, fragilidades e recomendações.</span></li>
          <li><b>Teste</b><span>Registre resultado real e compare versões.</span></li>
          <li><b>Melhore</b><span>Use as análises para iterar.</span></li>
        </ol>
      </article>
    </section>
  `);

  document.querySelector('#quickNew').onclick = () => {
    state.view = 'arquiteto';
    render();
  };
}

function renderProjetos() {
  layout(`
    <section class="toolbar">
      <div><h2>Projetos</h2><p>Agrupe prompts por objetivo, problema ou produto.</p></div>
      <button class="primary" id="newProject">Novo projeto</button>
    </section>

    <article class="card ${state.projects.length ? '' : 'empty-card'}">
      <div id="projectForm" class="hidden"></div>
      <div id="projectsList">
        ${state.projects.length ? state.projects.map(p => `
          <div class="project-card">
            <div>
              <strong>${esc(p.name)}</strong>
              <p>${esc(p.objective || 'Sem objetivo descrito.')}</p>
              <small>${esc(p.status || 'Em andamento')} • atualizado ${fmtDate(p.updatedAt)}</small>
            </div>
            <div class="item-actions">
              <button class="ghost open-project" data-id="${p.id}">Usar no arquiteto</button>
              <button class="danger delete-project" data-id="${p.id}">Excluir</button>
            </div>
          </div>`).join('') : '<div class="empty">Crie seu primeiro projeto para organizar o trabalho.</div>'}
      </div>
    </article>
  `);

  document.querySelector('#newProject').onclick = () => showProjectForm();
  document.querySelectorAll('.delete-project').forEach(b => b.onclick = async () => {
    if (!confirm('Excluir este projeto? Os prompts salvos serão mantidos.')) return;
    await deleteProject(b.dataset.id);
    await loadData();
    render();
  });
  document.querySelectorAll('.open-project').forEach(b => b.onclick = () => {
    sessionStorage.setItem('promptStudioProject', b.dataset.id);
    state.view = 'arquiteto';
    render();
  });
}

function showProjectForm() {
  const box = document.querySelector('#projectForm');
  box.classList.remove('hidden');
  box.innerHTML = `
    <form id="createProjectForm" class="form-grid">
      <label>Nome<input name="name" required placeholder="Ex.: English Training Hub"></label>
      <label>Status<select name="status"><option>Em andamento</option><option>Planejamento</option><option>Concluído</option><option>Arquivado</option></select></label>
      <label class="full">Objetivo<textarea name="objective" placeholder="Descreva a finalidade do projeto."></textarea></label>
      <div class="full actions"><button class="primary">Salvar projeto</button><button type="button" class="ghost" id="cancelProject">Cancelar</button></div>
    </form>`;
  document.querySelector('#cancelProject').onclick = () => box.classList.add('hidden');
  document.querySelector('#createProjectForm').onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await saveProject(Object.fromEntries(fd.entries()));
    await loadData();
    render();
  };
}

function renderArquiteto() {
  const selectedProject = sessionStorage.getItem('promptStudioProject') || '';
  layout(`
    <section class="toolbar">
      <div><h2>Arquiteto de Prompts</h2><p>Construa o prompt por blocos e reduza ambiguidades.</p></div>
      <button class="ghost" id="clearArchitect">Limpar</button>
    </section>

    <section class="architect-grid">
      <article class="card">
        <form id="architectForm" class="form-grid">
          <label class="full">Título<input name="title" placeholder="Nome deste prompt" required></label>
          <label>Projeto
            <select name="projectId">
              <option value="">Sem projeto</option>
              ${state.projects.map(p => `<option value="${p.id}" ${String(p.id)===String(selectedProject)?'selected':''}>${esc(p.name)}</option>`).join('')}
            </select>
          </label>
          <label>Público / usuário<input name="audience" placeholder="Quem receberá o resultado?"></label>
          <label class="full">Objetivo<textarea name="objective" required placeholder="Qual resultado você quer alcançar?"></textarea></label>
          <label class="full">Contexto<textarea name="context" placeholder="Informações que a IA precisa conhecer."></textarea></label>
          <label class="full">Restrições e regras<textarea name="constraints" placeholder="O que deve ou não deve ser feito?"></textarea></label>
          <label>Formato de saída<input name="format" placeholder="Ex.: tabela, relatório, passo a passo"></label>
          <label>Critérios de sucesso<input name="success" placeholder="Como avaliar se a resposta ficou boa?"></label>
          <label class="full">Exemplos / referências<textarea name="examples" placeholder="Opcional"></textarea></label>
          <div class="full actions">
            <button type="button" class="primary" id="generatePrompt">Construir e analisar</button>
          </div>
        </form>
      </article>

      <article class="card sticky-card">
        <div class="section-title"><h3>Prompt construído</h3><span id="architectScore" class="score-badge">—</span></div>
        <textarea id="generatedPrompt" class="result-area" placeholder="O prompt estruturado aparecerá aqui."></textarea>
        <div id="architectDiagnosis" class="analysis-box empty">Preencha os campos e clique em “Construir e analisar”.</div>
        <div class="actions">
          <button class="primary" id="savePromptBtn" disabled>Salvar na biblioteca</button>
          <button class="ghost" id="copyPromptBtn" disabled>Copiar</button>
        </div>
      </article>
    </section>
  `);

  document.querySelector('#generatePrompt').onclick = () => {
    const fd = new FormData(document.querySelector('#architectForm'));
    const data = Object.fromEntries(fd.entries());
    const built = buildOptimizedPrompt(data);
    document.querySelector('#generatedPrompt').value = built;
    const analysis = analyzePrompt(built);
    const score = scorePrompt(built, analysis);
    state.currentAnalysis = { data, built, analysis, score };
    renderArchitectAnalysis(analysis, score);
    document.querySelector('#savePromptBtn').disabled = false;
    document.querySelector('#copyPromptBtn').disabled = false;
  };

  document.querySelector('#copyPromptBtn').onclick = async () => {
    await navigator.clipboard.writeText(document.querySelector('#generatedPrompt').value);
    document.querySelector('#copyPromptBtn').textContent = 'Copiado';
  };

  document.querySelector('#savePromptBtn').onclick = async () => {
    if (!state.currentAnalysis) return;
    const { data, built, score } = state.currentAnalysis;
    await savePrompt({
      title: data.title || 'Prompt sem título',
      projectId: data.projectId ? Number(data.projectId) : null,
      text: built,
      score: score.overall,
      dimensions: score.dimensions,
      source: 'arquiteto'
    });
    await loadData();
    state.view = 'biblioteca';
    render();
  };

  document.querySelector('#clearArchitect').onclick = () => {
    sessionStorage.removeItem('promptStudioProject');
    state.currentAnalysis = null;
    render();
  };
}

function renderArchitectAnalysis(analysis, score) {
  document.querySelector('#architectScore').textContent = score.overall;
  document.querySelector('#architectDiagnosis').classList.remove('empty');
  document.querySelector('#architectDiagnosis').innerHTML = `
    <strong>${scoreLabel(score.overall)}</strong>
    ${analysis.issues.length
      ? `<ul>${analysis.issues.map(i => `<li><b>${esc(i.title)}:</b> ${esc(i.message)}</li>`).join('')}</ul>`
      : '<p>Nenhuma fragilidade estrutural relevante detectada.</p>'}
    ${analysis.recommendations?.length
      ? `<h4>Recomendações</h4><ul>${analysis.recommendations.map(r => `<li>${esc(r)}</li>`).join('')}</ul>`
      : ''}
  `;
}

function renderBiblioteca() {
  layout(`
    <section class="toolbar">
      <div><h2>Biblioteca</h2><p>Prompts salvos, reutilizáveis e pesquisáveis.</p></div>
      <button class="primary" data-view="arquiteto">Novo prompt</button>
    </section>
    <article class="card">
      <input id="librarySearch" class="search" placeholder="Pesquisar por título ou conteúdo...">
      <div id="libraryList" class="library-list"></div>
    </article>
  `);

  const draw = (term='') => {
    const list = state.prompts.filter(p =>
      `${p.title} ${p.text}`.toLowerCase().includes(term.toLowerCase())
    );
    document.querySelector('#libraryList').innerHTML = list.length ? list.map(p => `
      <div class="prompt-card">
        <div class="prompt-head">
          <div><strong>${esc(p.title)}</strong><small>${fmtDate(p.updatedAt)}</small></div>
          <span class="score-badge">${p.score || 0}</span>
        </div>
        <p>${esc(p.text.slice(0, 320))}${p.text.length>320?'…':''}</p>
        <div class="item-actions">
          <button class="ghost copy-library" data-id="${p.id}">Copiar</button>
          <button class="ghost test-library" data-id="${p.id}">Testar</button>
          <button class="danger delete-prompt" data-id="${p.id}">Excluir</button>
        </div>
      </div>`).join('') : '<div class="empty">Nenhum prompt encontrado.</div>';

    document.querySelectorAll('.copy-library').forEach(b => b.onclick = async () => {
      const p = state.prompts.find(x => x.id === Number(b.dataset.id));
      await navigator.clipboard.writeText(p.text);
      b.textContent = 'Copiado';
    });
    document.querySelectorAll('.test-library').forEach(b => b.onclick = () => {
      sessionStorage.setItem('promptStudioTestPrompt', b.dataset.id);
      state.view = 'laboratorio';
      render();
    });
    document.querySelectorAll('.delete-prompt').forEach(b => b.onclick = async () => {
      if (!confirm('Excluir este prompt?')) return;
      await deletePrompt(b.dataset.id);
      await loadData();
      render();
    });
  };

  draw();
  document.querySelector('#librarySearch').oninput = e => draw(e.target.value);
}

function renderLaboratorio() {
  const selected = Number(sessionStorage.getItem('promptStudioTestPrompt') || 0);
  const p = state.prompts.find(x => x.id === selected);
  layout(`
    <section class="toolbar">
      <div><h2>Laboratório de Testes</h2><p>Registre testes reais e compare o comportamento dos prompts.</p></div>
    </section>

    <section class="grid-2">
      <article class="card">
        <form id="testForm" class="form-grid">
          <label class="full">Prompt da biblioteca
            <select id="testPromptSelect" name="promptId">
              <option value="">Selecione</option>
              ${state.prompts.map(x => `<option value="${x.id}" ${x.id===selected?'selected':''}>${esc(x.title)}</option>`).join('')}
            </select>
          </label>
          <label class="full">Prompt testado<textarea name="promptText" id="testPromptText" required>${esc(p?.text || '')}</textarea></label>
          <label>Ferramenta / modelo<input name="model" placeholder="Ex.: ChatGPT"></label>
          <label>Qualidade percebida (0–10)<input name="quality" type="number" min="0" max="10" value="8"></label>
          <label class="full">Resultado obtido<textarea name="result" placeholder="Cole ou resuma a resposta recebida."></textarea></label>
          <label class="full">Problemas observados<textarea name="problems" placeholder="O que falhou, ficou vago, excessivo ou incorreto?"></textarea></label>
          <label class="full">Próxima melhoria<textarea name="nextImprovement" placeholder="O que você mudaria na próxima versão?"></textarea></label>
          <div class="full actions"><button class="primary">Registrar teste</button></div>
        </form>
      </article>

      <article class="card">
        <div class="section-title"><h3>Histórico recente</h3><span>${state.tests.length} testes</span></div>
        ${state.tests.slice(0,8).map(t => `
          <div class="test-row">
            <div><strong>${esc(t.title || 'Teste de prompt')}</strong><small>${fmtDate(t.createdAt)} • qualidade ${esc(t.quality || '—')}/10</small></div>
            <button class="danger delete-test" data-id="${t.id}">Excluir</button>
          </div>`).join('') || '<div class="empty">Nenhum teste registrado.</div>'}
      </article>
    </section>
  `);

  document.querySelector('#testPromptSelect').onchange = e => {
    const prompt = state.prompts.find(x => x.id === Number(e.target.value));
    document.querySelector('#testPromptText').value = prompt?.text || '';
  };

  document.querySelector('#testForm').onsubmit = async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const prompt = state.prompts.find(x => x.id === Number(data.promptId));
    await saveTest({
      ...data,
      promptId: data.promptId ? Number(data.promptId) : null,
      title: prompt?.title || 'Teste avulso',
      quality: Number(data.quality || 0)
    });
    await loadData();
    render();
  };

  document.querySelectorAll('.delete-test').forEach(b => b.onclick = async () => {
    await deleteTest(b.dataset.id);
    await loadData();
    render();
  });
}

function renderAnalises() {
  const scores = state.prompts.map(p => p.score || 0);
  const avg = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
  const best = [...state.prompts].sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,5);
  const quality = state.tests.length
    ? (state.tests.reduce((s,t)=>s+Number(t.quality||0),0)/state.tests.length).toFixed(1)
    : '—';

  layout(`
    <section class="toolbar">
      <div><h2>Análises</h2><p>Indicadores do uso real do Prompt Studio.</p></div>
    </section>

    <section class="stats">
      ${statCard('Score médio', avg || '—', scoreLabel(avg))}
      ${statCard('Melhor score', scores.length ? Math.max(...scores) : '—', 'biblioteca')}
      ${statCard('Qualidade média', quality, quality==='—'?'sem testes':'de 10')}
      ${statCard('Testes realizados', state.tests.length, 'evidência prática')}
    </section>

    <section class="grid-2">
      <article class="card">
        <h3>Prompts com melhor desempenho</h3>
        ${best.map(p => `<div class="row-item"><div><strong>${esc(p.title)}</strong><small>${fmtDate(p.updatedAt)}</small></div><span class="score-badge">${p.score}</span></div>`).join('') || '<div class="empty">Sem dados ainda.</div>'}
      </article>
      <article class="card">
        <h3>Qualidade dos testes</h3>
        ${state.tests.slice(0,10).map(t => `
          <div class="metric-line">
            <span>${esc(t.title || 'Teste')}</span>
            <progress max="10" value="${Number(t.quality||0)}"></progress>
            <b>${Number(t.quality||0)}</b>
          </div>`).join('') || '<div class="empty">Registre testes no laboratório para alimentar este painel.</div>'}
      </article>
    </section>

    <article class="card">
      <h3>Objetivo da fase de validação</h3>
      <p>Use o aplicativo normalmente durante alguns dias. Registre problemas de interface, prompts que recebem score inadequado, campos que faltam, etapas que dão trabalho e diferenças entre o score interno e a qualidade real da resposta. Isso permitirá corrigir a arquitetura com dados de uso, não apenas por hipótese.</p>
    </article>
  `);
}

async function loadData() {
  [state.projects, state.prompts, state.tests] = await Promise.all([
    listProjects(), listPrompts(), listTests()
  ]);
}

function render() {
  if (state.view === 'painel') renderPainel();
  else if (state.view === 'projetos') renderProjetos();
  else if (state.view === 'arquiteto') renderArquiteto();
  else if (state.view === 'biblioteca') renderBiblioteca();
  else if (state.view === 'laboratorio') renderLaboratorio();
  else if (state.view === 'analises') renderAnalises();
}

loadData().then(render).catch(err => {
  console.error(err);
  app.innerHTML = '<main class="fatal"><h1>Prompt Studio</h1><p>Não foi possível iniciar o banco local. Recarregue a página ou limpe os dados do site.</p></main>';
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
