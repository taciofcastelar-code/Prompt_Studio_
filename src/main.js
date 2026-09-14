import './styles.css';
import { analyzePrompt, buildOptimizedPrompt, detectIntent, suggestStrategy } from './modules/intelligence.js';
import { scorePrompt } from './modules/scoring.js';
import {
  saveProject, listProjects, deleteProject,
  savePrompt, listPrompts, deletePrompt,
  saveTest, listTests, deleteTest,
  saveTemplate, listTemplates, deleteTemplate,
  saveWorkflow, listWorkflows, deleteWorkflow,
  saveIssue, listIssues, deleteIssue,
  exportAllData, importAllData, clearAllData
} from './services/local-db.js';

const app = document.querySelector('#app');

const state = {
  view: 'painel',
  projects: [],
  prompts: [],
  tests: [],
  templates: [],
  workflows: [],
  issues: [],
  currentAnalysis: null,
  selectedPromptId: null,
  compareA: null,
  compareB: null
};

const views = {
  painel: 'Painel',
  projetos: 'Projetos',
  arquiteto: 'Arquiteto de Prompts',
  medico: 'Médico de Prompts',
  biblioteca: 'Biblioteca',
  modelos: 'Modelos',
  laboratorio: 'Laboratório de Testes',
  comparador: 'Comparador A/B',
  fluxos: 'Fluxos e Cadeias',
  analises: 'Análises',
  problemas: 'Registro de Problemas',
  configuracoes: 'Configurações'
};

const intentLabels = {
  general: 'Geral',
  business: 'Empreendedorismo',
  decision: 'Tomada de decisão',
  productivity: 'Produtividade',
  learning: 'Aprendizado',
  project: 'Projeto',
  analysis: 'Análise',
  writing: 'Escrita'
};

function esc(value='') {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function fmtDate(ts){ return ts ? new Date(ts).toLocaleString('pt-BR') : '—'; }
function scoreLabel(v){ if(v>=90)return'Excelente'; if(v>=75)return'Bom'; if(v>=60)return'Utilizável'; return'Precisa de refinamento'; }
function byId(id){ return document.querySelector(id); }

function nav() {
  return `<aside class="sidebar">
    <div class="brand"><strong>Prompt Studio V4.2</strong><span>Intelligence • Local-first</span></div>
    <div class="nav-scroll">
      ${Object.entries(views).map(([k,l])=>`<button class="nav ${state.view===k?'active':''}" data-view="${k}">${l}</button>`).join('')}
    </div>
    <div class="sidebar-footer"><span class="status-dot"></span><span>Dados locais protegidos no navegador</span></div>
  </aside>`;
}
function layout(content, subtitle=''){
  app.innerHTML = `<div class="app-shell">${nav()}<main class="main">
    <header class="topbar"><div><span class="eyebrow">PROMPT STUDIO V4.2</span><h1>${views[state.view]}</h1>${subtitle?`<p>${subtitle}</p>`:''}</div>
      <div class="top-actions"><button class="ghost" data-view="arquiteto">Novo prompt</button></div>
    </header>
    <section class="page">${content}</section>
  </main></div>`;
  bindGlobal();
}
function bindGlobal(){
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;render();});
}
function statCard(label,value,detail=''){return `<article class="stat-card"><span>${label}</span><strong>${value}</strong><small>${detail}</small></article>`;}
function projectName(id){ return state.projects.find(p=>p.id===Number(id))?.name || 'Sem projeto'; }
function promptById(id){ return state.prompts.find(p=>p.id===Number(id)); }

function renderPainel(){
  const avg=state.prompts.length?Math.round(state.prompts.reduce((s,p)=>s+(p.score||0),0)/state.prompts.length):0;
  const best=[...state.prompts].sort((a,b)=>(b.score||0)-(a.score||0))[0];
  layout(`
    <section class="hero">
      <div><p class="eyebrow">OBJETIVO → DIAGNÓSTICO → ESTRATÉGIA → EXECUÇÃO → TESTE → MELHORIA</p>
      <h2>Transforme uma ideia em uma solução executável.</h2>
      <p>Construa, diagnostique, teste, compare, versione e reutilize prompts e fluxos de trabalho.</p></div>
      <button class="primary" id="startNow">Começar agora</button>
    </section>
    <section class="stats">
      ${statCard('Projetos',state.projects.length,'organizados')}
      ${statCard('Prompts',state.prompts.length,'na biblioteca')}
      ${statCard('Testes',state.tests.length,'registrados')}
      ${statCard('Score médio',avg||'—',avg?scoreLabel(avg):'sem dados')}
    </section>
    <section class="grid-3">
      <article class="card"><h3>Melhor prompt</h3>${best?`<strong class="big">${esc(best.title)}</strong><p>Score ${best.score}</p>`:'<div class="empty">Sem dados ainda.</div>'}</article>
      <article class="card"><h3>Fluxos</h3><strong class="big">${state.workflows.length}</strong><p>Cadeias reutilizáveis</p></article>
      <article class="card"><h3>Problemas registrados</h3><strong class="big">${state.issues.length}</strong><p>Base para melhorar o produto</p></article>
    </section>
    <section class="grid-2">
      <article class="card"><div class="section-title"><h3>Prompts recentes</h3><button class="link" data-view="biblioteca">Abrir biblioteca</button></div>
        ${state.prompts.slice(0,5).map(p=>`<div class="row-item"><div><strong>${esc(p.title)}</strong><small>${projectName(p.projectId)} • ${fmtDate(p.updatedAt)}</small></div><span class="score-badge">${p.score||0}</span></div>`).join('')||'<div class="empty">Nenhum prompt salvo.</div>'}
      </article>
      <article class="card"><h3>Modos inteligentes</h3><div class="chip-wrap">
        ${Object.values(intentLabels).map(x=>`<span class="chip">${x}</span>`).join('')}
      </div><p class="muted">O sistema identifica o tipo de tarefa e recomenda uma estratégia de construção.</p></article>
    </section>`);
  byId('#startNow').onclick=()=>{state.view='arquiteto';render();};
}

function renderProjetos(){
  layout(`<section class="toolbar"><div><h2>Projetos</h2><p>Organize prompts, testes e fluxos por objetivo.</p></div><button class="primary" id="newProject">Novo projeto</button></section>
  <article class="card"><div id="projectForm" class="hidden"></div>
  ${state.projects.map(p=>`<div class="project-card"><div><strong>${esc(p.name)}</strong><p>${esc(p.objective||'Sem objetivo descrito.')}</p><small>${esc(p.status||'Em andamento')} • ${fmtDate(p.updatedAt)}</small></div><div class="item-actions"><button class="ghost use-project" data-id="${p.id}">Usar no arquiteto</button><button class="danger del-project" data-id="${p.id}">Excluir</button></div></div>`).join('')||'<div class="empty">Nenhum projeto criado.</div>'}
  </article>`);
  byId('#newProject').onclick=()=>showProjectForm();
  document.querySelectorAll('.use-project').forEach(b=>b.onclick=()=>{sessionStorage.setItem('ps_project',b.dataset.id);state.view='arquiteto';render();});
  document.querySelectorAll('.del-project').forEach(b=>b.onclick=async()=>{if(confirm('Excluir projeto? Os prompts serão mantidos.')){await deleteProject(b.dataset.id);await loadData();render();}});
}
function showProjectForm(){
  const box=byId('#projectForm'); box.classList.remove('hidden');
  box.innerHTML=`<form id="pf" class="form-grid"><label>Nome<input name="name" required></label><label>Status<select name="status"><option>Planejamento</option><option selected>Em andamento</option><option>Concluído</option><option>Arquivado</option></select></label><label class="full">Objetivo<textarea name="objective"></textarea></label><div class="full actions"><button class="primary">Salvar</button><button type="button" class="ghost" id="cancelPf">Cancelar</button></div></form>`;
  byId('#cancelPf').onclick=()=>box.classList.add('hidden');
  byId('#pf').onsubmit=async e=>{e.preventDefault();await saveProject(Object.fromEntries(new FormData(e.currentTarget).entries()));await loadData();render();};
}

function renderArquiteto(){
  const selectedProject=sessionStorage.getItem('ps_project')||'';
  layout(`<section class="toolbar"><div><h2>Arquiteto de Prompts</h2><p>Construa prompts por blocos, com estratégia adaptada ao tipo de tarefa.</p></div><button class="ghost" id="clearArch">Limpar</button></section>
  <section class="architect-grid">
    <article class="card"><form id="af" class="form-grid">
      <label class="full">Título<input name="title" required placeholder="Ex.: Diagnóstico de ideia de negócio"></label>
      <label>Projeto<select name="projectId"><option value="">Sem projeto</option>${state.projects.map(p=>`<option value="${p.id}" ${String(p.id)===String(selectedProject)?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label>
      <label>Modo<select name="mode"><option value="auto">Automático</option>${Object.entries(intentLabels).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label>
      <label class="full">Objetivo<textarea name="objective" required placeholder="O que precisa acontecer?"></textarea></label>
      <label class="full">Contexto<textarea name="context" placeholder="Cenário, dados disponíveis, histórico, limitações..."></textarea></label>
      <label>Público / usuário<input name="audience"></label>
      <label>Formato de saída<input name="format" placeholder="Tabela, plano, relatório, checklist..."></label>
      <label class="full">Regras e restrições<textarea name="constraints"></textarea></label>
      <label class="full">Critérios de sucesso<textarea name="success"></textarea></label>
      <label class="full">Exemplos / referências<textarea name="examples"></textarea></label>
      <label class="full">Tom / estilo<textarea name="style" placeholder="Ex.: direto, técnico, didático, executivo..."></textarea></label>
      <div class="full actions"><button type="button" class="primary" id="buildPrompt">Construir e analisar</button></div>
    </form></article>
    <article class="card sticky-card"><div class="section-title"><h3>Resultado</h3><span id="archScore" class="score-badge">—</span></div>
      <div id="intentBox" class="notice">Aguardando análise.</div>
      <textarea id="builtPrompt" class="result-area" placeholder="O prompt aparecerá aqui."></textarea>
      <div id="archDiag" class="analysis-box empty">Preencha os campos e clique em “Construir e analisar”.</div>
      <div class="actions"><button class="primary" id="saveBuilt" disabled>Salvar na biblioteca</button><button class="ghost" id="copyBuilt" disabled>Copiar</button><button class="ghost" id="toDoctor" disabled>Enviar ao Médico</button></div>
    </article>
  </section>`);
  byId('#buildPrompt').onclick=()=>{
    const data=Object.fromEntries(new FormData(byId('#af')).entries());
    const intent=data.mode==='auto'?detectIntent(`${data.objective} ${data.context}`):data.mode;
    const strategy=suggestStrategy(intent);
    const built=buildOptimizedPrompt({...data,intent,strategy});
    const analysis=analyzePrompt(built); const score=scorePrompt(built,analysis);
    state.currentAnalysis={data:{...data,intent},built,analysis,score};
    byId('#builtPrompt').value=built; byId('#archScore').textContent=score.overall;
    byId('#intentBox').innerHTML=`<b>Modo identificado:</b> ${intentLabels[intent]||intent} • <b>Estratégia:</b> ${esc(strategy.name)}`;
    byId('#archDiag').classList.remove('empty');
    byId('#archDiag').innerHTML=`<strong>${scoreLabel(score.overall)}</strong>${analysis.issues.length?`<ul>${analysis.issues.map(i=>`<li><b>${esc(i.title)}:</b> ${esc(i.message)}</li>`).join('')}</ul>`:'<p>Nenhuma fragilidade estrutural relevante.</p>'}${analysis.recommendations.length?`<h4>Recomendações</h4><ul>${analysis.recommendations.map(r=>`<li>${esc(r)}</li>`).join('')}</ul>`:''}`;
    ['#saveBuilt','#copyBuilt','#toDoctor'].forEach(id=>byId(id).disabled=false);
  };
  byId('#copyBuilt').onclick=async()=>{await navigator.clipboard.writeText(byId('#builtPrompt').value);byId('#copyBuilt').textContent='Copiado';};
  byId('#saveBuilt').onclick=async()=>{if(!state.currentAnalysis)return;const {data,built,score}=state.currentAnalysis;await savePrompt({title:data.title||'Prompt sem título',projectId:data.projectId?Number(data.projectId):null,text:built,score:score.overall,dimensions:score.dimensions,intent:data.intent,tags:[],favorite:false,version:1,history:[],source:'arquiteto'});await loadData();state.view='biblioteca';render();};
  byId('#toDoctor').onclick=()=>{sessionStorage.setItem('ps_doctor_text',byId('#builtPrompt').value);state.view='medico';render();};
  byId('#clearArch').onclick=()=>{sessionStorage.removeItem('ps_project');state.currentAnalysis=null;render();};
}

function renderMedico(){
  const initial=sessionStorage.getItem('ps_doctor_text')||'';
  layout(`<section class="toolbar"><div><h2>Médico de Prompts</h2><p>Diagnostique um prompt existente, veja fragilidades e gere uma versão melhorada.</p></div></section>
  <section class="grid-2">
    <article class="card"><label>Prompt original<textarea id="doctorInput" class="result-area">${esc(initial)}</textarea></label><div class="actions"><button class="primary" id="doctorAnalyze">Diagnosticar</button><button class="ghost" id="doctorClear">Limpar</button></div></article>
    <article class="card"><div class="section-title"><h3>Diagnóstico</h3><span id="doctorScore" class="score-badge">—</span></div><div id="doctorDiag" class="analysis-box empty">Aguardando.</div></article>
  </section>
  <article class="card"><h3>Versão otimizada</h3><textarea id="doctorOutput" class="result-area"></textarea><div class="actions"><button class="primary" id="saveDoctor" disabled>Salvar versão otimizada</button><button class="ghost" id="copyDoctor" disabled>Copiar</button></div></article>`);
  byId('#doctorAnalyze').onclick=()=>{
    const text=byId('#doctorInput').value.trim(); if(!text)return;
    const analysis=analyzePrompt(text), score=scorePrompt(text,analysis);
    const improved=`OBJETIVO\n${text}\n\nCRITÉRIOS DE QUALIDADE\n- Preserve a intenção principal.\n- Elimine ambiguidades e repetições.\n- Explique premissas importantes.\n- Organize a resposta em formato executável.\n- Se faltar informação crítica, sinalize antes de assumir.\n\nEXECUÇÃO\nResponda de forma clara, aplicável e consistente com o objetivo.`;
    state.currentAnalysis={built:improved,analysis,score,data:{title:'Prompt otimizado pelo Médico',intent:detectIntent(text)}};
    byId('#doctorScore').textContent=score.overall;
    byId('#doctorDiag').classList.remove('empty');
    byId('#doctorDiag').innerHTML=`<strong>${scoreLabel(score.overall)}</strong><ul>${analysis.issues.map(i=>`<li><b>${esc(i.title)}:</b> ${esc(i.message)}</li>`).join('')||'<li>Nenhuma fragilidade estrutural evidente.</li>'}</ul><h4>Recomendações</h4><ul>${analysis.recommendations.map(r=>`<li>${esc(r)}</li>`).join('')}</ul>`;
    byId('#doctorOutput').value=improved; byId('#saveDoctor').disabled=false;byId('#copyDoctor').disabled=false;
  };
  byId('#saveDoctor').onclick=async()=>{const x=state.currentAnalysis;if(!x)return;await savePrompt({title:x.data.title,text:x.built,score:scorePrompt(x.built,analyzePrompt(x.built)).overall,dimensions:scorePrompt(x.built,analyzePrompt(x.built)).dimensions,intent:x.data.intent,tags:['medico'],favorite:false,version:1,history:[],source:'medico'});await loadData();state.view='biblioteca';render();};
  byId('#copyDoctor').onclick=async()=>navigator.clipboard.writeText(byId('#doctorOutput').value);
  byId('#doctorClear').onclick=()=>{sessionStorage.removeItem('ps_doctor_text');render();};
}

function renderBiblioteca(){
  layout(`<section class="toolbar"><div><h2>Biblioteca</h2><p>Pesquise, favorite, versione, reutilize e teste seus prompts.</p></div><button class="primary" data-view="arquiteto">Novo prompt</button></section>
  <article class="card"><div class="filterbar"><input id="libSearch" class="search" placeholder="Pesquisar..."><select id="libIntent"><option value="">Todos os modos</option>${Object.entries(intentLabels).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select><select id="libFav"><option value="">Todos</option><option value="fav">Favoritos</option></select></div><div id="libList"></div></article>`);
  const draw=()=>{
    const q=byId('#libSearch').value.toLowerCase(), intent=byId('#libIntent').value, fav=byId('#libFav').value;
    const list=state.prompts.filter(p=>(`${p.title} ${p.text} ${(p.tags||[]).join(' ')}`.toLowerCase().includes(q))&&(!intent||p.intent===intent)&&(!fav||p.favorite));
    byId('#libList').innerHTML=list.map(p=>`<div class="prompt-card">
      <div class="prompt-head"><div><strong>${p.favorite?'★ ':''}${esc(p.title)}</strong><small>${projectName(p.projectId)} • ${intentLabels[p.intent]||'Geral'} • v${p.version||1} • ${fmtDate(p.updatedAt)}</small></div><span class="score-badge">${p.score||0}</span></div>
      <p>${esc(p.text.slice(0,360))}${p.text.length>360?'…':''}</p>
      <div class="chip-wrap">${(p.tags||[]).map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</div>
      <div class="item-actions"><button class="ghost copy-p" data-id="${p.id}">Copiar</button><button class="ghost fav-p" data-id="${p.id}">${p.favorite?'Desfavoritar':'Favoritar'}</button><button class="ghost edit-p" data-id="${p.id}">Nova versão</button><button class="ghost test-p" data-id="${p.id}">Testar</button><button class="ghost compare-p" data-id="${p.id}">Comparar</button><button class="danger del-p" data-id="${p.id}">Excluir</button></div>
    </div>`).join('')||'<div class="empty">Nenhum prompt encontrado.</div>';
    document.querySelectorAll('.copy-p').forEach(b=>b.onclick=async()=>navigator.clipboard.writeText(promptById(b.dataset.id).text));
    document.querySelectorAll('.fav-p').forEach(b=>b.onclick=async()=>{const p=promptById(b.dataset.id);await savePrompt({...p,favorite:!p.favorite});await loadData();draw();});
    document.querySelectorAll('.edit-p').forEach(b=>b.onclick=()=>openVersionEditor(promptById(b.dataset.id)));
    document.querySelectorAll('.test-p').forEach(b=>b.onclick=()=>{sessionStorage.setItem('ps_test_prompt',b.dataset.id);state.view='laboratorio';render();});
    document.querySelectorAll('.compare-p').forEach(b=>b.onclick=()=>{state.compareA=Number(b.dataset.id);state.view='comparador';render();});
    document.querySelectorAll('.del-p').forEach(b=>b.onclick=async()=>{if(confirm('Excluir prompt?')){await deletePrompt(b.dataset.id);await loadData();draw();}});
  };
  ['#libSearch','#libIntent','#libFav'].forEach(id=>byId(id).oninput=draw); draw();
}
function openVersionEditor(p){
  const old=byId('#libList').innerHTML;
  byId('#libList').innerHTML=`<div class="version-editor"><h3>Nova versão: ${esc(p.title)}</h3><label>Título<input id="vTitle" value="${esc(p.title)}"></label><label>Tags (separadas por vírgula)<input id="vTags" value="${esc((p.tags||[]).join(', '))}"></label><label>Prompt<textarea id="vText" class="result-area">${esc(p.text)}</textarea></label><div class="actions"><button class="primary" id="saveVersion">Salvar nova versão</button><button class="ghost" id="cancelVersion">Cancelar</button></div></div>`;
  byId('#cancelVersion').onclick=()=>renderBiblioteca();
  byId('#saveVersion').onclick=async()=>{
    const text=byId('#vText').value.trim(), a=analyzePrompt(text), s=scorePrompt(text,a);
    const hist=[...(p.history||[]),{version:p.version||1,text:p.text,score:p.score,updatedAt:p.updatedAt}].slice(-10);
    await savePrompt({...p,title:byId('#vTitle').value.trim(),text,score:s.overall,dimensions:s.dimensions,tags:byId('#vTags').value.split(',').map(x=>x.trim()).filter(Boolean),version:(p.version||1)+1,history:hist});
    await loadData();renderBiblioteca();
  };
}

function renderModelos(){
  const builtIns=[
    {title:'Diagnóstico de problema',category:'Análise',text:'Analise o problema descrito. Identifique sintomas, causas prováveis, evidências, lacunas de informação, riscos, opções de solução, prioridade e próximos passos. Diferencie fatos de hipóteses.'},
    {title:'Validação de ideia de negócio',category:'Empreendedorismo',text:'Avalie a ideia de negócio com foco em dor, usuário, comprador, frequência do problema, alternativas atuais, proposta de valor, facilidade de implementação, preço potencial, riscos, teste mais barato e critérios de validação.'},
    {title:'Tomada de decisão',category:'Decisão',text:'Estruture a decisão. Liste alternativas, critérios, pesos, benefícios, custos, riscos, reversibilidade, informações faltantes e recomende a opção com justificativa.'},
    {title:'Plano de execução',category:'Produtividade',text:'Transforme o objetivo em um plano executável com entregáveis, etapas, dependências, prioridade, esforço, prazo, critérios de conclusão, riscos e próxima ação concreta.'}
  ];
  layout(`<section class="toolbar"><div><h2>Modelos</h2><p>Templates reutilizáveis para começar mais rápido.</p></div><button class="primary" id="newTemplate">Novo modelo</button></section>
  <section class="grid-2">${[...builtIns,...state.templates].map((t,i)=>`<article class="card"><span class="eyebrow">${esc(t.category||'PERSONALIZADO')}</span><h3>${esc(t.title)}</h3><p class="pre">${esc(t.text)}</p><div class="actions"><button class="ghost use-template" data-index="${i}">Usar</button>${i>=builtIns.length?`<button class="danger del-template" data-id="${t.id}">Excluir</button>`:''}</div></article>`).join('')}</section><div id="templateForm"></div>`);
  document.querySelectorAll('.use-template').forEach(b=>b.onclick=()=>{const all=[...builtIns,...state.templates];sessionStorage.setItem('ps_doctor_text',all[Number(b.dataset.index)].text);state.view='medico';render();});
  document.querySelectorAll('.del-template').forEach(b=>b.onclick=async()=>{await deleteTemplate(b.dataset.id);await loadData();render();});
  byId('#newTemplate').onclick=()=>{byId('#templateForm').innerHTML=`<article class="card"><form id="tf" class="form-grid"><label>Título<input name="title" required></label><label>Categoria<input name="category"></label><label class="full">Conteúdo<textarea name="text" required></textarea></label><div class="full"><button class="primary">Salvar modelo</button></div></form></article>`;byId('#tf').onsubmit=async e=>{e.preventDefault();await saveTemplate(Object.fromEntries(new FormData(e.currentTarget).entries()));await loadData();render();};};
}

function renderLaboratorio(){
  const selected=Number(sessionStorage.getItem('ps_test_prompt')||0), p=promptById(selected);
  layout(`<section class="toolbar"><div><h2>Laboratório de Testes</h2><p>Confronte o score interno com o resultado real.</p></div></section>
  <section class="grid-2"><article class="card"><form id="testForm" class="form-grid">
    <label class="full">Prompt<select id="testSelect" name="promptId"><option value="">Selecione</option>${state.prompts.map(x=>`<option value="${x.id}" ${x.id===selected?'selected':''}>${esc(x.title)}</option>`).join('')}</select></label>
    <label class="full">Prompt testado<textarea id="testText" name="promptText" required>${esc(p?.text||'')}</textarea></label>
    <label>Ferramenta / modelo<input name="model" placeholder="Ex.: ChatGPT"></label><label>Qualidade percebida 0–10<input name="quality" type="number" min="0" max="10" value="8"></label>
    <label>Precisão 0–10<input name="accuracy" type="number" min="0" max="10" value="8"></label><label>Utilidade 0–10<input name="usefulness" type="number" min="0" max="10" value="8"></label>
    <label class="full">Resultado obtido<textarea name="result"></textarea></label><label class="full">Problemas observados<textarea name="problems"></textarea></label><label class="full">Próxima melhoria<textarea name="nextImprovement"></textarea></label>
    <div class="full"><button class="primary">Registrar teste</button></div>
  </form></article><article class="card"><h3>Histórico recente</h3>${state.tests.slice(0,10).map(t=>`<div class="test-row"><div><strong>${esc(t.title||'Teste')}</strong><small>${fmtDate(t.createdAt)} • qualidade ${t.quality}/10</small></div><button class="danger del-test" data-id="${t.id}">Excluir</button></div>`).join('')||'<div class="empty">Nenhum teste.</div>'}</article></section>`);
  byId('#testSelect').onchange=e=>{byId('#testText').value=promptById(e.target.value)?.text||'';};
  byId('#testForm').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget).entries()), pp=promptById(d.promptId);await saveTest({...d,promptId:d.promptId?Number(d.promptId):null,title:pp?.title||'Teste avulso',quality:Number(d.quality||0),accuracy:Number(d.accuracy||0),usefulness:Number(d.usefulness||0)});await loadData();render();};
  document.querySelectorAll('.del-test').forEach(b=>b.onclick=async()=>{await deleteTest(b.dataset.id);await loadData();render();});
}

function renderComparador(){
  layout(`<section class="toolbar"><div><h2>Comparador A/B</h2><p>Compare duas versões lado a lado.</p></div></section>
  <section class="compare-selects"><select id="cmpA"><option value="">Versão A</option>${state.prompts.map(p=>`<option value="${p.id}" ${p.id===state.compareA?'selected':''}>${esc(p.title)} — v${p.version||1}</option>`).join('')}</select><select id="cmpB"><option value="">Versão B</option>${state.prompts.map(p=>`<option value="${p.id}" ${p.id===state.compareB?'selected':''}>${esc(p.title)} — v${p.version||1}</option>`).join('')}</select></section><section id="compareArea" class="grid-2"></section>`);
  const draw=()=>{state.compareA=Number(byId('#cmpA').value)||null;state.compareB=Number(byId('#cmpB').value)||null;const a=promptById(state.compareA),b=promptById(state.compareB);byId('#compareArea').innerHTML=[a,b].map((p,i)=>p?`<article class="card"><div class="section-title"><h3>${i?'B':'A'} — ${esc(p.title)}</h3><span class="score-badge">${p.score}</span></div><p class="pre">${esc(p.text)}</p><h4>Dimensões</h4>${Object.entries(p.dimensions||{}).map(([k,v])=>`<div class="metric-line"><span>${esc(k)}</span><progress max="100" value="${v}"></progress><b>${v}</b></div>`).join('')}</article>`:`<article class="card empty">Selecione a versão ${i?'B':'A'}.</article>`).join('');};
  byId('#cmpA').onchange=draw;byId('#cmpB').onchange=draw;draw();
}

function renderFluxos(){
  layout(`<section class="toolbar"><div><h2>Fluxos e Cadeias</h2><p>Monte sequências de prompts para processos repetitivos.</p></div><button class="primary" id="newWorkflow">Novo fluxo</button></section>
  <article class="card"><div id="wfForm" class="hidden"></div>${state.workflows.map(w=>`<div class="workflow-card"><div><strong>${esc(w.name)}</strong><p>${esc(w.description||'')}</p><small>${(w.steps||[]).length} etapas • ${fmtDate(w.updatedAt)}</small></div><div class="item-actions"><button class="ghost run-wf" data-id="${w.id}">Visualizar</button><button class="danger del-wf" data-id="${w.id}">Excluir</button></div></div>`).join('')||'<div class="empty">Nenhum fluxo criado.</div>'}</article><div id="wfPreview"></div>`);
  byId('#newWorkflow').onclick=()=>showWorkflowForm();
  document.querySelectorAll('.del-wf').forEach(b=>b.onclick=async()=>{await deleteWorkflow(b.dataset.id);await loadData();render();});
  document.querySelectorAll('.run-wf').forEach(b=>b.onclick=()=>{const w=state.workflows.find(x=>x.id===Number(b.dataset.id));byId('#wfPreview').innerHTML=`<article class="card"><h3>${esc(w.name)}</h3>${(w.steps||[]).map((s,i)=>`<div class="step-card"><span>${i+1}</span><div><strong>${esc(s.title)}</strong><p>${esc(s.instruction)}</p></div></div>`).join('')}</article>`;});
}
function showWorkflowForm(){
  const box=byId('#wfForm');box.classList.remove('hidden');box.innerHTML=`<form id="wff" class="form-grid"><label class="full">Nome<input name="name" required></label><label class="full">Descrição<textarea name="description"></textarea></label><label class="full">Etapas (uma por linha no formato Título | Instrução)<textarea name="stepsText" required placeholder="Diagnóstico | Identifique o problema principal\nEstratégia | Proponha opções\nExecução | Gere o plano final"></textarea></label><div class="full"><button class="primary">Salvar fluxo</button></div></form>`;
  byId('#wff').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget).entries());const steps=d.stepsText.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{const [title,...rest]=l.split('|');return{title:title.trim(),instruction:rest.join('|').trim()||title.trim()};});await saveWorkflow({name:d.name,description:d.description,steps});await loadData();render();};
}

function renderAnalises(){
  const avg=state.prompts.length?Math.round(state.prompts.reduce((s,p)=>s+(p.score||0),0)/state.prompts.length):0;
  const q=state.tests.length?(state.tests.reduce((s,t)=>s+Number(t.quality||0),0)/state.tests.length).toFixed(1):'—';
  const acc=state.tests.length?(state.tests.reduce((s,t)=>s+Number(t.accuracy||0),0)/state.tests.length).toFixed(1):'—';
  const use=state.tests.length?(state.tests.reduce((s,t)=>s+Number(t.usefulness||0),0)/state.tests.length).toFixed(1):'—';
  layout(`<section class="stats">${statCard('Score médio',avg||'—',scoreLabel(avg))}${statCard('Qualidade real',q,q==='—'?'sem testes':'de 10')}${statCard('Precisão real',acc,acc==='—'?'sem testes':'de 10')}${statCard('Utilidade real',use,use==='—'?'sem testes':'de 10')}</section>
  <section class="grid-2"><article class="card"><h3>Melhores prompts</h3>${[...state.prompts].sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,8).map(p=>`<div class="row-item"><div><strong>${esc(p.title)}</strong><small>${intentLabels[p.intent]||'Geral'}</small></div><span class="score-badge">${p.score}</span></div>`).join('')||'<div class="empty">Sem dados.</div>'}</article>
  <article class="card"><h3>Desempenho real dos testes</h3>${state.tests.slice(0,10).map(t=>`<div class="metric-line"><span>${esc(t.title)}</span><progress max="10" value="${Number(t.quality||0)}"></progress><b>${Number(t.quality||0)}</b></div>`).join('')||'<div class="empty">Sem testes.</div>'}</article></section>`);
}

function renderProblemas(){
  layout(`<section class="toolbar"><div><h2>Registro de Problemas</h2><p>Registre falhas encontradas no uso real do aplicativo.</p></div><button class="primary" id="newIssue">Registrar problema</button></section>
  <article class="card"><div id="issueForm" class="hidden"></div>${state.issues.map(i=>`<div class="issue-card"><div><span class="chip">${esc(i.area||'Geral')}</span><strong>${esc(i.title)}</strong><p>${esc(i.description||'')}</p><small>Severidade: ${esc(i.severity||'Média')} • ${fmtDate(i.createdAt)}</small></div><button class="danger del-issue" data-id="${i.id}">Excluir</button></div>`).join('')||'<div class="empty">Nenhum problema registrado. Use esta área durante os testes reais.</div>'}</article>`);
  byId('#newIssue').onclick=()=>{const box=byId('#issueForm');box.classList.remove('hidden');box.innerHTML=`<form id="if" class="form-grid"><label>Título<input name="title" required></label><label>Área<select name="area">${Object.values(views).map(v=>`<option>${v}</option>`).join('')}</select></label><label>Severidade<select name="severity"><option>Baixa</option><option selected>Média</option><option>Alta</option><option>Crítica</option></select></label><label>Como reproduzir<input name="steps"></label><label class="full">Descrição<textarea name="description" required></textarea></label><label class="full">Resultado esperado<textarea name="expected"></textarea></label><div class="full"><button class="primary">Salvar</button></div></form>`;byId('#if').onsubmit=async e=>{e.preventDefault();await saveIssue(Object.fromEntries(new FormData(e.currentTarget).entries()));await loadData();render();};};
  document.querySelectorAll('.del-issue').forEach(b=>b.onclick=async()=>{await deleteIssue(b.dataset.id);await loadData();render();});
}

function renderConfiguracoes(){
  layout(`<section class="grid-2"><article class="card"><h3>Backup</h3><p>Exporte todos os projetos, prompts, testes, modelos, fluxos e problemas em JSON.</p><div class="actions"><button class="primary" id="exportBtn">Exportar backup</button><label class="file-btn">Importar backup<input type="file" id="importFile" accept=".json"></label></div></article>
  <article class="card"><h3>Dados locais</h3><p>Todos os dados desta versão ficam no IndexedDB do navegador. Limpar os dados é irreversível se você não tiver um backup.</p><button class="danger" id="clearData">Apagar todos os dados</button></article></section>
  <article class="card"><h3>Limitações atuais</h3><ul><li>Sem geração por IA externa dentro do próprio app.</li><li>Sem sincronização entre dispositivos nesta build local-first.</li><li>Sem autenticação multiusuário.</li><li>Os scores são heurísticos e precisam ser calibrados com seus testes reais.</li></ul><p>Essas limitações são deliberadas para manter a versão gratuita, privada e testável.</p></article>`);
  byId('#exportBtn').onclick=async()=>{const data=await exportAllData();const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`prompt-studio-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);};
  byId('#importFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;const data=JSON.parse(await f.text());await importAllData(data);await loadData();alert('Backup importado.');render();};
  byId('#clearData').onclick=async()=>{if(confirm('Apagar TODOS os dados locais do Prompt Studio?')){await clearAllData();await loadData();render();}};
}

async function loadData(){
  [state.projects,state.prompts,state.tests,state.templates,state.workflows,state.issues]=await Promise.all([listProjects(),listPrompts(),listTests(),listTemplates(),listWorkflows(),listIssues()]);
}
function render(){
  const m={painel:renderPainel,projetos:renderProjetos,arquiteto:renderArquiteto,medico:renderMedico,biblioteca:renderBiblioteca,modelos:renderModelos,laboratorio:renderLaboratorio,comparador:renderComparador,fluxos:renderFluxos,analises:renderAnalises,problemas:renderProblemas,configuracoes:renderConfiguracoes};(m[state.view]||renderPainel)();
}
loadData().then(render).catch(err=>{console.error(err);app.innerHTML='<main class="fatal"><h1>Prompt Studio</h1><p>Não foi possível iniciar o banco local.</p></main>';});
if('serviceWorker'in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
