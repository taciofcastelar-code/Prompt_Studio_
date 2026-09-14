const clamp=n=>Math.max(0,Math.min(100,Math.round(n)));
export function scorePrompt(text,analysis){
  const len=(text||'').trim().length, codes=new Set(analysis.issues.map(x=>x.code));
  const dimensions={
    Clareza:clamp(52+Math.min(len/10,30)-(codes.has('ambiguous_objective')?25:0)),
    Contexto:clamp(42+Math.min(len/8,42)-(codes.has('insufficient_context')?30:0)),
    Especificidade:clamp(55+Math.min(len/22,24)-analysis.issues.length*4),
    Assertividade:clamp(66-(codes.has('ambiguous_objective')?20:0)+Math.min(len/35,14)),
    Eficiência:clamp(92-(codes.has('possible_overload')?35:0)),
    Aplicabilidade:clamp(63+Math.min(len/38,20)),
    Estrutura:clamp(codes.has('missing_output_format')?48:90),
    'Critérios de sucesso':clamp(codes.has('missing_success_criteria')?42:92)
  };
  const w={Clareza:.16,Contexto:.14,Especificidade:.14,Assertividade:.12,Eficiência:.10,Aplicabilidade:.12,Estrutura:.10,'Critérios de sucesso':.12};
  const overall=clamp(Object.entries(dimensions).reduce((s,[k,v])=>s+v*w[k],0));
  return {overall,dimensions};
}
