import { describe, it, expect } from 'vitest';
import { analyzePrompt } from '../src/modules/intelligence.js';
import { scorePrompt } from '../src/modules/scoring.js';

describe('Intelligence Engine V1', () => {
  it('detecta prompt curto como contexto insuficiente', () => {
    const result = analyzePrompt('Quero aprender inglês.');
    expect(result.issues.some(i => i.code === 'insufficient_context')).toBe(true);
  });

  it('gera score numérico de 0 a 100', () => {
    const text = 'Quero criar um plano de estudos detalhado. Considere meu nível atual, apresente em tabela e use critérios de sucesso mensuráveis.';
    const analysis = analyzePrompt(text);
    const score = scorePrompt(text, analysis);
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
  });
});
