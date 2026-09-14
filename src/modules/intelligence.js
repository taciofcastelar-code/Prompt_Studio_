const has = (text, words) => words.some(w => text.toLowerCase().includes(w));

export function analyzePrompt(text) {
  const clean = text.trim();
  const issues = [];

  if (clean.length < 60) {
    issues.push({
      code: 'insufficient_context',
      title: 'Contexto insuficiente',
      message: 'A solicitação é curta e pode não fornecer contexto suficiente para uma resposta consistente.'
    });
  }

  if (!has(clean, ['objetivo', 'quero', 'preciso', 'resultado', 'meta', 'crie', 'criar', 'analise', 'analisar'])) {
    issues.push({
      code: 'ambiguous_objective',
      title: 'Objetivo pouco explícito',
      message: 'Declare claramente o resultado que deve ser alcançado.'
    });
  }

  if (!has(clean, ['critério', 'sucesso', 'deve', 'obrigatório', 'considere', 'restrição', 'não'])) {
    issues.push({
      code: 'missing_success_criteria',
      title: 'Critérios de sucesso ausentes',
      message: 'Defina como saberemos se a resposta ficou boa.'
    });
  }

  if (!has(clean, ['formato', 'tabela', 'lista', 'passo', 'json', 'documento', 'resumo', 'relatório'])) {
    issues.push({
      code: 'missing_output_format',
      title: 'Formato de saída indefinido',
      message: 'Especificar o formato esperado reduz respostas inadequadas.'
    });
  }

  const sentences = clean.split(/[.!?]+/).filter(Boolean);
  if (sentences.length > 14 || clean.length > 2200) {
    issues.push({
      code: 'possible_overload',
      title: 'Possível excesso de instruções',
      message: 'O prompt pode conter contexto ou regras demais para o objetivo principal.'
    });
  }

  return { issues };
}
