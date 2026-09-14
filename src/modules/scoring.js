const clamp = n => Math.max(0, Math.min(100, Math.round(n)));

export function scorePrompt(text, analysis) {
  const len = text.trim().length;
  const issueCodes = new Set(analysis.issues.map(x => x.code));

  const dimensions = {
    Clareza: clamp(45 + Math.min(len / 5, 40) - (issueCodes.has('ambiguous_objective') ? 25 : 0)),
    Contexto: clamp(35 + Math.min(len / 4, 55) - (issueCodes.has('insufficient_context') ? 30 : 0)),
    Especificidade: clamp(55 + Math.min(len / 12, 25) - analysis.issues.length * 4),
    Assertividade: clamp(65 - (issueCodes.has('ambiguous_objective') ? 20 : 0) + Math.min(len / 20, 15)),
    Eficiência: clamp(88 - (issueCodes.has('possible_overload') ? 30 : 0)),
    Autenticidade: clamp(70 + Math.min(len / 30, 15)),
    Criatividade: clamp(68 + Math.min(len / 35, 17)),
    'Critérios de sucesso': clamp(issueCodes.has('missing_success_criteria') ? 40 : 88)
  };

  const weights = {
    Clareza: 0.15,
    Contexto: 0.15,
    Especificidade: 0.15,
    Assertividade: 0.15,
    Eficiência: 0.10,
    Autenticidade: 0.10,
    Criatividade: 0.10,
    'Critérios de sucesso': 0.10
  };

  const overall = clamp(Object.entries(dimensions)
    .reduce((sum, [k, v]) => sum + v * weights[k], 0));

  return { overall, dimensions };
}
