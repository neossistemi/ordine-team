# Ordine Ruote – Team Neos Sistemi

Web app per far scegliere le ruote ai 12 atleti del team.

- **Atleti** → `https://<tuo-sito>.netlify.app/`
  Scelgono il proprio nome (nessuna password), le ruote e le quantità, poi convalidano l'ordine.
  Le prime 8 ruote sono **GRATIS** (12 per Falcioni e Illuminati), le successive **A PAGAMENTO**.
  Se un atleta rientra, ritrova il suo ordine e può modificarlo: il nuovo invio sostituisce il precedente.
  Link personale (apre direttamente l'atleta): `https://<tuo-sito>.netlify.app/?atleta=falcioni`
- **Amministratore** → `https://<tuo-sito>.netlify.app/admin.html`
  Elenco ordini, chi deve ancora ordinare (con i link personali da copiare), totale per tipo di ruota,
  stampa del singolo ordine, di tutti gli ordini o del totale per ruota, eliminazione di un ordine.

## File

| File | Cosa contiene |
|---|---|
| `public/index.html` | Pagina atleti |
| `public/admin.html` | Pannello amministratore |
| `public/atleti.json` | Elenco atleti e numero di ruote gratis di ciascuno |
| `public/ruote.json` | Elenco ruote (dal file MATERIALE_DA_ORDINARE) |
| `public/app.css`, `public/common.js` | Grafica e funzioni comuni |
| `netlify/functions/ordini.mjs` | Salvataggio ordini (Netlify Blobs) |
| `netlify.toml`, `package.json` | Configurazione Netlify |

## Pubblicazione su Netlify (una volta sola)

1. Crea un nuovo repository privato su GitHub (es. `ordine-ruote`) e carica tutti i file dello zip.
2. Su Netlify: **Add new site → Import an existing project → GitHub** e scegli il repository.
   Lascia vuoto il "Build command"; la cartella da pubblicare (`public`) è già indicata in `netlify.toml`.
   > Non usare il trascinamento della cartella (Netlify Drop): non attiva il salvataggio degli ordini.
3. **Password amministratore**: *Site configuration → Environment variables → Add a variable*
   - Key: `ADMIN_PASSWORD` – Value: la password che vuoi usare.
   Poi *Deploys → Trigger deploy → Deploy site* per applicarla.
4. **Email ad amministrazione@neossistemi.it**:
   - *Forms* → se richiesto, **Enable form detection**, poi rifai il deploy.
   - Dopo il deploy compare il modulo **ordine-ruote**.
   - *Site configuration → Notifications → Emails and webhooks → Form submission notifications → Add notification → Email notification*:
     Form `ordine-ruote`, email `amministrazione@neossistemi.it`.
   Ogni ordine convalidato arriva via email con il riepilogo (ruote, gratis / a pagamento, note).
5. Prova: fai un ordine di test, controlla che arrivi l'email e che compaia in `admin.html`, poi eliminalo dal pannello.

## Modifiche frequenti

- **Ruote gratis per atleta**: cambia il numero `gratis` in `public/atleti.json`.
- **Elenco ruote**: `public/ruote.json` (lo genero io dal file Excel).
