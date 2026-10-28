// API ordini ruote: salva un ordine per atleta in Netlify Blobs.
//   GET  /api/ordini?atleta=<id>        -> ordine dell'atleta (o null)
//   POST /api/ordini {atleta,righe,note} -> salva/sostituisce l'ordine
//   GET  /api/ordini?tutti=1            -> tutti gli ordini      (header x-admin-password)
//   DELETE /api/ordini?atleta=<id>      -> elimina un ordine     (header x-admin-password)
import { getStore } from "@netlify/blobs";
import atleti from "../../public/atleti.json";

const ATL = Object.fromEntries(atleti.map(a => [a.id, a]));

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

export function alloca(righe, gratis) {
  let resto = gratis;
  return righe.map(r => {
    const g = Math.min(r.qta, Math.max(resto, 0));
    resto -= g;
    return { ...r, gratis: g, pagamento: r.qta - g };
  });
}

function controllaAdmin(req) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return json({ errore: "Password amministratore non impostata su Netlify (variabile ADMIN_PASSWORD)." }, 500);
  if (req.headers.get("x-admin-password") !== pw) return json({ errore: "Password errata." }, 401);
  return null;
}

export default async (req) => {
  const url = new URL(req.url);
  const store = getStore({ name: "ordini-ruote", consistency: "strong" });

  if (req.method === "GET" && url.searchParams.has("tutti")) {
    const no = controllaAdmin(req); if (no) return no;
    const { blobs } = await store.list({ prefix: "ordine-" });
    const ordini = (await Promise.all(blobs.map(b => store.get(b.key, { type: "json" })))).filter(Boolean);
    return json({ ordini, atleti });
  }

  if (req.method === "GET") {
    const id = url.searchParams.get("atleta");
    if (!ATL[id]) return json({ errore: "Atleta non trovato." }, 404);
    return json({ ordine: (await store.get("ordine-" + id, { type: "json" })) || null });
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

    const key = "ordine-" + a.id;
    const prima = await store.get(key, { type: "json" });
    const allocate = alloca(righe, a.gratis);
    const t = allocate.reduce((s, r) => ({ tot: s.tot + r.qta, g: s.g + r.gratis, p: s.p + r.pagamento }), { tot: 0, g: 0, p: 0 });
    const ordine = {
      atleta: a.id,
      nome: `${a.nome} ${a.cognome}`,
      gratisPreviste: a.gratis,
      righe: allocate,
      totale: t.tot, totaleGratis: t.g, totalePagamento: t.p,
      note: String(body.note ?? "").slice(0, 1000).trim(),
      inviatoIl: new Date().toISOString(),
      primoInvio: prima?.primoInvio || prima?.inviatoIl || new Date().toISOString(),
      modifiche: prima ? (prima.modifiche || 0) + 1 : 0,
    };
    await store.setJSON(key, ordine);
    return json({ ordine });
  }

  if (req.method === "DELETE") {
    const no = controllaAdmin(req); if (no) return no;
    const id = url.searchParams.get("atleta");
    if (!ATL[id]) return json({ errore: "Atleta non trovato." }, 404);
    await store.delete("ordine-" + id);
    return json({ ok: true });
  }

  return json({ errore: "Metodo non consentito." }, 405);
};

export const config = { path: "/api/ordini" };
