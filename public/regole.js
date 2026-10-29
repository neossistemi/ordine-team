// Regole delle ruote gratis: usate sia dalla pagina (browser) sia dalla funzione Netlify.
// - Ogni atleta ha `gratis` ruote gratis per la stagione (conteggio cumulativo, ordine dopo ordine).
// - Chi ha anche `gratisManao` (Falcioni, Illuminati): se nella stagione sceglie anche una sola ruota Manao,
//   il limite scende a `gratisManao` (12) per tutte le ruote. Le Manao, più costose, restano gratis per prime.
(function (g) {
  const isManao = r => /^MANAO/i.test(String(r?.codice || '')) || /manao/i.test(String(r?.nome || ''));

  // Situazione della stagione, dati gli ordini già fatti
  function stagione(atleta, ordini) {
    const usate = ordini.reduce((n, o) => n + (o.totaleGratis || 0), 0);
    const manao = ordini.some(o => (o.righe || []).some(isManao));
    const limiteManao = !!atleta.gratisManao && manao;
    const limite = limiteManao ? atleta.gratisManao : atleta.gratis;
    return { usate, limite, limiteManao, restanti: Math.max(limite - usate, 0) };
  }

  // Ripartisce gratis / a pagamento le righe di un nuovo ordine, dati gli ordini precedenti
  function calcola(atleta, righe, precedenti) {
    const prima = stagione(atleta, precedenti);
    const limiteManao = !!atleta.gratisManao && (prima.limiteManao || righe.some(isManao));
    const limite = limiteManao ? atleta.gratisManao : atleta.gratis;
    let resto = Math.max(limite - prima.usate, 0);
    const disponibili = resto;
    const ordine = righe.map((_, i) => i);
    if (atleta.gratisManao) ordine.sort((a, b) => (isManao(righe[b]) - isManao(righe[a])) || a - b);
    const out = righe.map(r => ({ codice: r.codice, nome: r.nome, qta: r.qta, gratis: 0, pagamento: r.qta }));
    for (const i of ordine) {
      const gr = Math.min(out[i].qta, resto);
      out[i].gratis = gr; out[i].pagamento = out[i].qta - gr; resto -= gr;
    }
    return { righe: out, limite, limiteManao, usatePrima: prima.usate, disponibili };
  }

  g.REGOLE = { isManao, stagione, calcola };
})(typeof window !== 'undefined' ? window : globalThis);
