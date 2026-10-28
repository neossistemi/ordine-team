// Funzioni condivise tra pagina atleti e pannello amministratore.
window.NEOS = {
  // Le prime `gratis` ruote (nell'ordine del carrello) sono gratuite, le altre a pagamento.
  alloca(righe, gratis) {
    let resto = gratis;
    return righe.map(r => {
      const g = Math.min(r.qta, Math.max(resto, 0));
      resto -= g;
      return { ...r, gratis: g, pagamento: r.qta - g };
    });
  },
  totali(righe) {
    return righe.reduce((t, r) => ({ tot: t.tot + r.qta, gratis: t.gratis + r.gratis, pagamento: t.pagamento + r.pagamento }), { tot: 0, gratis: 0, pagamento: 0 });
  },
  data(iso) {
    try { return new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return iso; }
  },
  esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  async json(url, opts) {
    const r = await fetch(url, { cache: 'no-store', ...opts });
    let d = {};
    try { d = await r.json(); } catch {}
    if (!r.ok) throw new Error(d.errore || `Errore ${r.status}`);
    return d;
  }
};
