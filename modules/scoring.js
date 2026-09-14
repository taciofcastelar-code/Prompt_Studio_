const clamp = n => Math.max(0, Math.min(100, Math.round(n)));

export function scorePrompt(text, analysis) {
  const len = text.trim().length;
  const issueCodes = new Set(analysis.issues.map(x => x.code));

  const dimensions = {
    Clareza: clamp(50 + Math.min(len / 8, 35) - (issueCodes.has('ambiguous_objective') ? 25 : 0)),
    Contexto: clamp(40 + Math.min(len / 6, 45) - (issueCodes.has('insufficient_context') ? 30 : 0)),
    Especificidade: clamp(55 + Math.min(len / 18, 25) - analysis.issues.length * 4),
    Assertividade: clamp(65 - (issueCodes.has('ambiguous_objective') ? 20 : 0) + Math.min(len / 28, 15)),
    Eficiência: clamp(90 - (issueCodes.has('possible_overload') ? 35 : 0)),
    Aplicabilidade: clamp(62 + Math.min(len / 30, 20)),
    Estrutura: clamp(issueCodes.has('missing_output_format') ? 48 : 88),
    'Critérios de sucesso': clamp(issueCodes.has('missing_success_criteria') ? 42 : 90)
  };

  const weights = {
    Clareza: 0.16,
    Contexto: 0.14,
    Especificidade: 0.14,
    Assertividade: 0.12,
    Eficiência: 0.10,
    Aplicabilidade: 0.12,
    Estrutura: 0.10,
    'Critérios de sucesso': 0.12
  };

  const overall = clamp(Object.entries(dimensions)
    .reduce((sum, [k, v]) => sum + v * weights[k], 0));

  return { overall, dimensions };
}
