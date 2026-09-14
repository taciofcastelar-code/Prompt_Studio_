const has = (text, words) => words.some(w => text.toLowerCase().includes(w));

export function analyzePrompt(text) {
  const clean = text.trim();
  const issues = [];
  const recommendations = [];

  if (clean.length < 60) {
    issues.push({
      code: 'insufficient_context',
      title: 'Contexto insuficiente',
      message: 'A solicitação é curta e pode não fornecer contexto suficiente para uma resposta consistente.'
    });
    recommendations.push('Inclua contexto sobre o problema, cenário atual e informações disponíveis.');
  }

  if (!has(clean, ['objetivo', 'quero', 'preciso', 'resultado', 'meta', 'crie', 'criar', 'analise', 'analisar'])) {
    issues.push({
      code: 'ambiguous_objective',
      title: 'Objetivo pouco explícito',
      message: 'Declare claramente o resultado que deve ser alcançado.'
    });
    recommendations.push('Comece com um verbo de ação e descreva o resultado final esperado.');
  }

  if (!has(clean, ['critério', 'sucesso', 'deve', 'obrigatório', 'considere', 'restrição', 'não'])) {
    issues.push({
      code: 'missing_success_criteria',
      title: 'Critérios de sucesso ausentes',
      message: 'Defina como saberemos se a resposta ficou boa.'
    });
    recommendations.push('Adicione critérios de qualidade, limites ou condições obrigatórias.');
  }

  if (!has(clean, ['formato', 'tabela', 'lista', 'passo', 'json', 'documento', 'resumo', 'relatório'])) {
    issues.push({
      code: 'missing_output_format',
      title: 'Formato de saída indefinido',
      message: 'Especificar o formato esperado reduz respostas inadequadas.'
    });
    recommendations.push('Defina o formato final: tabela, checklist, relatório, plano ou outro.');
  }

  const sentences = clean.split(/[.!?]+/).filter(Boolean);
  if (sentences.length > 18 || clean.length > 3500) {
    issues.push({
      code: 'possible_overload',
      title: 'Possível excesso de instruções',
      message: 'O prompt pode conter regras demais para o objetivo principal.'
    });
    recommendations.push('Separe contexto essencial de instruções secundárias e elimine repetições.');
  }

  if (!has(clean, ['público', 'usuário', 'leitor', 'equipe', 'cliente', 'aluno', 'paciente'])) {
    recommendations.push('Quando relevante, informe para quem a resposta será produzida.');
  }

  return { issues, recommendations };
}

export function buildOptimizedPrompt(data = {}) {
  const blocks = [];

  if (data.objective) blocks.push(`OBJETIVO\n${data.objective.trim()}`);
  if (data.context) blocks.push(`CONTEXTO\n${data.context.trim()}`);
  if (data.audience) blocks.push(`PÚBLICO / USUÁRIO\n${data.audience.trim()}`);
  if (data.constraints) blocks.push(`REGRAS E RESTRIÇÕES\n${data.constraints.trim()}`);
  if (data.format) blocks.push(`FORMATO DE SAÍDA\nEntregue o resultado em: ${data.format.trim()}.`);
  if (data.success) blocks.push(`CRITÉRIOS DE SUCESSO\n${data.success.trim()}`);
  if (data.examples) blocks.push(`EXEMPLOS / REFERÊNCIAS\n${data.examples.trim()}`);

  blocks.push(`EXECUÇÃO\nAnalise o pedido antes de responder. Se faltar uma informação realmente necessária para executar com qualidade, sinalize a lacuna de forma objetiva. Priorize clareza, aplicabilidade e consistência com os critérios definidos.`);

  return blocks.join('\n\n');
}
