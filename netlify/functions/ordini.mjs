// API ordini ruote (Netlify Blobs). Ogni ordine convalidato resta nello storico.
// Le ruote gratis valgono per tutta la stagione e si consumano ordine dopo ordine (regole in public/regole.js:
// 8 per atleta; Falcioni e Illuminati 16, ma 12 se scelgono anche ruote Manao, con le Manao gratis per prime).
//   GET    /api/ordini?atleta=<id>        -> storico dell'atleta + ruote gratis rimaste
//   POST   /api/ordini {atleta,righe,note} -> nuovo ordine
//   GET    /api/ordini?tutti=1            -> tutti gli ordini          (header x-admin-password)
//   PATCH  /api/ordini?ordine=<chiave> {stato} -> "da_ordinare" | "ordinato" (header x-admin-password)
//   DELETE /api/ordini?ordine=<chiave>    -> elimina un ordine         (header x-admin-password)
import { getStore } from "@netlify/blobs";
import atleti from "../../public/atleti.json";
import "../../public/regole.js";
const { calcola, stagione } = globalThis.REGOLE;

const ATL = Object.fromEntries(atleti.map(a => [a.id, a]));
const store = () => getStore({ name: "ordini-ruote", consistency: "strong" });

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const somma = righe => righe.reduce((s, r) => ({ tot: s.tot + r.qta, g: s.g + r.gratis, p: s.p + r.pagamento }), { tot: 0, g: 0, p: 0 });

function controllaAdmin(req) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return json({ errore: "Password amministratore non impostata su Netlify (variabile ADMIN_PASSWORD)." }, 500);
  if (req.headers.get("x-admin-password") !== pw) return json({ errore: "Password errata." }, 401);
  return null;
}

// Tutti gli ordini di un atleta, dal più vecchio (compatibile con la prima versione: chiave "ordine-<id>")
async function ordiniAtleta(s, id) {
  const { blobs } = await s.list({ prefix: "ordine-" + id });
  const keys = blobs.map(b => b.key).filter(k => k === "ordine-" + id || k.startsWith("ordine-" + id + "-"));
  const list = (await Promise.all(keys.map(async k => {
    const o = await s.get(k, { type: "json" });
    return o ? { stato: "da_ordinare", ...o, chiave: k } : null;
  }))).filter(Boolean);
  return list.sort((a, b) => a.inviatoIl.localeCompare(b.inviatoIl));
}

// Ricalcola gratis/a pagamento in ordine cronologico (serve dopo l'eliminazione di un ordine)
async function ricalcola(s, id) {
  const a = ATL[id]; const out = [];
  const lista = await ordiniAtleta(s, id);
  for (const [i, o] of lista.entries()) {
    const c = calcola(a, o.righe, out), t = somma(c.righe);
    const nuovo = { ...o, numero: i + 1, gratisStagione: c.limite, limiteManao: c.limiteManao, gratisUsatePrima: c.usatePrima, righe: c.righe, totale: t.tot, totaleGratis: t.g, totalePagamento: t.p };
    if (JSON.stringify(nuovo) !== JSON.stringify(o)) { const { chiave, ...dati } = nuovo; await s.setJSON(o.chiave, dati); }
    out.push(nuovo);
  }
  return out;
}

const riepilogoAtleta = (a, ordini) => {
  const st = stagione(a, ordini);
  return { gratisStagione: st.limite, limiteManao: st.limiteManao, gratisUsate: st.usate, gratisRestanti: st.restanti };
};

export default async (req) => {
  const url = new URL(req.url);
  const s = store();

  if (req.method === "GET" && url.searchParams.has("tutti")) {
    const no = controllaAdmin(req); if (no) return no;
    const ordini = (await Promise.all(atleti.map(a => ordiniAtleta(s, a.id)))).flat();
    return json({ ordini, atleti });
  }

  if (req.method === "GET") {
    const a = ATL[url.searchParams.get("atleta")];
    if (!a) return json({ errore: "Atleta non trovato." }, 404);
    const ordini = await ordiniAtleta(s, a.id);
    return json({ ordini, ...riepilogoAtleta(a, ordini) });
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return json({ errore: "Richiesta non valida." }, 400); }
    const a = ATL[body?.atleta];
    if (!a) return json({ errore: "Atleta non trovato." }, 404);
    const viste = new Set();
    const righe = (Array.isArray(body.righe) ? body.righe : [])
      .map(r => ({ codice: String(r?.codice ?? "").slice(0, 60), nome: String(r?.nome ?? "").slice(0, 200), qta: Math.floor(Number(r?.qta)) }))
      .filter(r => r.codice && r.qta >= 1 && r.qta <= 99 && !viste.has(r.codice) && viste.add(r.codice))
      .slice(0, 60);
    if (!righe.length) return json({ errore: "Il carrello è vuoto." }, 400);

    const prima = await ordiniAtleta(s, a.id);
    const c = calcola(a, righe, prima), t = somma(c.righe);
    const ora = new Date().toISOString();
    const chiave = `ordine-${a.id}-${Date.now()}`;
    const ordine = {
      atleta: a.id, nome: `${a.nome} ${a.cognome}`, numero: prima.length + 1,
      gratisStagione: c.limite, limiteManao: c.limiteManao, gratisUsatePrima: c.usatePrima,
      righe: c.righe, totale: t.tot, totaleGratis: t.g, totalePagamento: t.p,
      note: String(body.note ?? "").slice(0, 1000).trim(),
      inviatoIl: ora,
      stato: "da_ordinare",
    };
    await s.setJSON(chiave, ordine);
    const ordini = [...prima, { ...ordine, chiave }];
    return json({ ordine: { ...ordine, chiave }, ordini, ...riepilogoAtleta(a, ordini) });
  }

  if (req.method === "PATCH") {
    const no = controllaAdmin(req); if (no) return no;
    const chiave = url.searchParams.get("ordine") || "";
    let body; try { body = await req.json(); } catch { body = {}; }
    if (!["da_ordinare", "ordinato"].includes(body.stato)) return json({ errore: "Stato non valido." }, 400);
    const o = chiave.startsWith("ordine-") ? await s.get(chiave, { type: "json" }) : null;
    if (!o) return json({ errore: "Ordine non trovato." }, 404);
    const nuovo = { ...o, stato: body.stato, evasoIl: body.stato === "ordinato" ? new Date().toISOString() : null };
    await s.setJSON(chiave, nuovo);
    return json({ ordine: { ...nuovo, chiave } });
  }

  if (req.method === "DELETE") {
    const no = controllaAdmin(req); if (no) return no;
    const chiave = url.searchParams.get("ordine") || "";
    const id = atleti.find(a => chiave === "ordine-" + a.id || chiave.startsWith("ordine-" + a.id + "-"))?.id;
    if (!id) return json({ errore: "Ordine non trovato." }, 404);
    await s.delete(chiave);
    await ricalcola(s, id);
    return json({ ok: true });
  }

  return json({ errore: "Metodo non consentito." }, 405);
};

export const config = { path: "/api/ordini" };
