import { describe,it,expect } from 'vitest';
import { detectIntents, analyzePrompt, buildOptimizedPrompt, doctorPrompt } from '../src/modules/intelligence.js';
import { scorePrompt } from '../src/modules/scoring.js';
describe('V4.2.1 intelligence',()=>{
  it('detecta pedido híbrido projeto+aprendizado',()=>{const r=detectIntents('Quero criar um aplicativo para aprender inglês.');expect([r.primary,r.secondary]).toContain('project');expect([r.primary,r.secondary]).toContain('learning');});
  it('detecta melhoria de processo',()=>{const r=detectIntents('Preciso melhorar a adesão ao protocolo e medir indicadores do processo.');expect([r.primary,r.secondary]).toContain('process');});
  it('score é estrutural e limitado',()=>{const t='OBJETIVO\nCriar plano.\nREGRAS\nNão invente dados.\nFORMATO\nChecklist.\nCRITÉRIOS DE SUCESSO\nSer aplicável.';const s=scorePrompt(t,analyzePrompt(t));expect(s.overall).toBeGreaterThanOrEqual(0);expect(s.overall).toBeLessThanOrEqual(100);});
  it('arquiteto inclui revisão final',()=>{const t=buildOptimizedPrompt({objective:'Criar um plano',context:'Projeto inicial',format:'checklist',success:'ser executável'});expect(t).toContain('EXECUÇÃO');expect(t).toContain('CRITÉRIOS DE SUCESSO');});
  it('médico compara antes e depois',()=>{const r=doctorPrompt('Quero melhorar meu projeto.');expect(r.after.score.overall).toBeGreaterThanOrEqual(r.before.score.overall);expect(r.changes.length).toBeGreaterThan(0);});
});
