const lower = s => (s || '').toLowerCase();
const has = (text, words) => words.some(w => lower(text).includes(w));

export function detectIntent(text) {
  const t = lower(text);
  const scores = {
    business: ['negócio','cliente','comprador','mercado','produto','serviço','preço','empresa','empreender','saas'].filter(w=>t.includes(w)).length,
    decision: ['decidir','decisão','escolher','alternativa','opção','trade-off','risco'].filter(w=>t.includes(w)).length,
    productivity: ['produtividade','planejar','executar','priorizar','prazo','tarefa','cronograma','organizar'].filter(w=>t.includes(w)).length,
    learning: ['aprender','estudar','curso','estudo','ensinar','praticar','treinar'].filter(w=>t.includes(w)).length,
    project: ['projeto','aplicativo','app','sistema','implementar','desenvolver','mvp'].filter(w=>t.includes(w)).length,
    analysis: ['analisar','auditar','diagnóstico','avaliar','investigar','causa'].filter(w=>t.includes(w)).length,
    writing: ['escrever','texto','email','relatório','documento','post','currículo'].filter(w=>t.includes(w)).length
  };
  const [best, value] = Object.entries(scores).sort((a,b)=>b[1]-a[1])[0];
  return value > 0 ? best : 'general';
}

export function suggestStrategy(intent) {
  const map = {
    business: {name:'Dor → usuário → comprador → solução → viabilidade → teste', blocks:['dor','usuario','comprador','solucao','viabilidade','teste']},
    decision: {name:'Alternativas → critérios → pesos → riscos → reversibilidade → decisão', blocks:['alternativas','criterios','riscos','decisao']},
    productivity: {name:'Objetivo → entregáveis → etapas → prioridade → prazo → próxima ação', blocks:['objetivo','entregaveis','etapas','prioridade']},
    learning: {name:'Nível → objetivo → lacunas → prática → revisão → medição', blocks:['nivel','objetivo','lacunas','pratica']},
    project: {name:'Problema → usuário → requisitos → MVP → riscos → métricas → execução', blocks:['problema','usuario','requisitos','mvp']},
    analysis: {name:'Problema → evidências → causas → hipóteses → opções → recomendação', blocks:['problema','evidencias','causas','opcoes']},
    writing: {name:'Objetivo → público → mensagem → tom → estrutura → revisão', blocks:['objetivo','publico','mensagem','tom']},
    general: {name:'Objetivo → contexto → regras → formato → critérios → execução', blocks:['objetivo','contexto','regras','formato']}
  };
  return map[intent] || map.general;
}

export function analyzePrompt(text) {
  const clean=(text||'').trim(), issues=[], recommendations=[];
  if(clean.length<80){issues.push({code:'insufficient_context',title:'Contexto insuficiente',message:'O prompt pode não conter contexto suficiente para uma resposta consistente.'});recommendations.push('Inclua cenário, informações disponíveis e limitações relevantes.');}
  if(!has(clean,['objetivo','quero','preciso','resultado','meta','crie','criar','analise','analisar'])){issues.push({code:'ambiguous_objective',title:'Objetivo pouco explícito',message:'Declare claramente o resultado que deve ser alcançado.'});recommendations.push('Use um verbo de ação e descreva o resultado final esperado.');}
  if(!has(clean,['critério','sucesso','deve','obrigatório','considere','restrição','não'])){issues.push({code:'missing_success_criteria',title:'Critérios de sucesso ausentes',message:'Defina como avaliar se a resposta ficou boa.'});recommendations.push('Adicione condições de qualidade, limites ou critérios mensuráveis.');}
  if(!has(clean,['formato','tabela','lista','passo','json','documento','resumo','relatório','checklist','plano'])){issues.push({code:'missing_output_format',title:'Formato de saída indefinido',message:'Definir o formato reduz respostas inadequadas.'});recommendations.push('Informe o formato final esperado.');}
  const sentences=clean.split(/[.!?]+/).filter(Boolean);
  if(sentences.length>20||clean.length>4500){issues.push({code:'possible_overload',title:'Possível excesso de instruções',message:'O prompt pode conter contexto ou regras demais.'});recommendations.push('Remova repetições e separe contexto essencial de detalhes secundários.');}
  if(!has(clean,['público','usuário','leitor','equipe','cliente','aluno','paciente'])) recommendations.push('Quando relevante, informe quem usará ou receberá o resultado.');
  if(!has(clean,['exemplo','referência','modelo'])) recommendations.push('Para tarefas sensíveis a estilo ou formato, inclua um exemplo.');
  return {issues,recommendations};
}

export function buildOptimizedPrompt(data={}) {
  const blocks=[], intent=data.intent||detectIntent(`${data.objective||''} ${data.context||''}`), strategy=data.strategy||suggestStrategy(intent);
  if(data.objective) blocks.push(`OBJETIVO\n${data.objective.trim()}`);
  if(data.context) blocks.push(`CONTEXTO\n${data.context.trim()}`);
  if(data.audience) blocks.push(`PÚBLICO / USUÁRIO\n${data.audience.trim()}`);
  blocks.push(`ESTRATÉGIA DE RACIOCÍNIO\nUse a estrutura: ${strategy.name}.`);
  if(data.constraints) blocks.push(`REGRAS E RESTRIÇÕES\n${data.constraints.trim()}`);
  if(data.format) blocks.push(`FORMATO DE SAÍDA\nEntregue o resultado em: ${data.format.trim()}.`);
  if(data.success) blocks.push(`CRITÉRIOS DE SUCESSO\n${data.success.trim()}`);
  if(data.examples) blocks.push(`EXEMPLOS / REFERÊNCIAS\n${data.examples.trim()}`);
  if(data.style) blocks.push(`TOM E ESTILO\n${data.style.trim()}`);
  blocks.push(`EXECUÇÃO\nAntes de responder, verifique se as informações são suficientes. Diferencie fatos, hipóteses e recomendações. Se faltar uma informação realmente crítica, sinalize a lacuna. Priorize clareza, aplicabilidade e consistência com o objetivo.`);
  return blocks.join('\n\n');
}
