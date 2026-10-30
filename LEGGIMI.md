# Ordine Ruote – Team Neos Sistemi

Web app per far scegliere le ruote ai 12 atleti del team.

- **Atleti** → `https://<tuo-sito>.netlify.app/`
  Scelgono il proprio nome (nessuna password), le ruote e le quantità, poi convalidano l'ordine.
  Le ruote gratis valgono per tutta la stagione: le prime sono **GRATIS**, le successive **A PAGAMENTO**.
  - Tutti: **8** ruote gratis.
  - Falcioni e Illuminati: **16** con Piper, Black Magic e Hydrogen; se scelgono anche una sola ruota **Manao** (Niu o Kao) il limite scende a **12** per tutte le ruote (le Manao sono gratis per prime). Regole in `public/regole.js`.
  Un ordine convalidato non si modifica: per altre ruote si fa un nuovo ordine. In "I miei ordini" l'atleta vede lo storico e lo stato (In attesa / Ordinato).
  Link personale: `https://<tuo-sito>.netlify.app/?atleta=falcioni`
- **Amministratore** → `https://<tuo-sito>.netlify.app/admin.html`
  - **Da ordinare**: ordini ricevuti; con **✓ Ordine evaso** passano in "Ordinati" (anche tutti insieme).
  - **Ordinati**: archivio per atleta; un ordine si può riportare in "Da ordinare".
  - **Totale per ruota**: la scheda per fare l'ordine al fornitore. Somma tutte le ruote
    degli ordini **non evasi** e le raggruppa **per marca** (Hydrogen Pro, Black Magic,
    Piper Torch Pro, Piper Time Pro, Manao Niu, Manao Kao), con diametro, durezza, codice
    e quantita', il totale di ogni marca e il totale generale. Ogni riga ha una casella da
    spuntare mentre si compila l'ordine.
    - **Per marca** / **Elenco unico**: due modi di vedere le stesse ruote. L'elenco unico
      e' una tabella sola e mostra anche gratis e a pagamento.
    - **Da ordinare** / **Tutti gli ordini**: solo i non evasi, oppure tutta la stagione.
    - **"Stampa anche chi ha ordinato cosa"**: se la spunti, alla stampa si aggiunge una
      seconda pagina con quale atleta ha chiesto cosa. Serve a controllare e a distribuire
      le ruote quando arrivano; al fornitore non serve, per questo e' separata.
    - **Stampa l'ordine** stampa solo questa scheda, senza menu ne' pulsanti.
    Le marche escono nell'ordine in cui stanno in `public/ruote.json`.
  - **Atleti e link**: link personali, ordini fatti e ruote gratis rimaste.
  - Filtro per atleta, stampa di un ordine, di un atleta o della scheda intera; eliminazione con ricalcolo delle ruote gratis.

## File

| File | Cosa contiene |
|---|---|
| `public/index.html` | Pagina atleti |
| `public/admin.html` | Pannello amministratore |
| `public/atleti.json` | Elenco atleti e numero di ruote gratis di ciascuno |
| `public/ruote.json` | Elenco ruote (dal file MATERIALE_DA_ORDINARE) |
| `public/app.css`, `public/common.js` | Grafica e funzioni comuni |
| `public/regole.js` | Regole delle ruote gratis (limite Manao) |
| `netlify/functions/ordini.mjs` | Salvataggio ordini (Netlify Blobs) |
| `netlify.toml`, `package.json` | Configurazione Netlify |

## Pubblicazione su Netlify (una volta sola)

1. Crea un nuovo repository su GitHub (es. `ordine-ruote`) e carica tutti i file dello zip.
2. Su Netlify: **Add new site → Import an existing project → GitHub** e scegli il repository.
   Lascia vuoto il "Build command"; la cartella da pubblicare (`public`) è già indicata in `netlify.toml`.
   > Non usare il trascinamento della cartella (Netlify Drop): non attiva il salvataggio degli ordini.
3. **Password amministratore**: *Site configuration → Environment variables → Add a variable*
   - Key: `ADMIN_PASSWORD` – Value: la password che vuoi usare.
   Poi *Deploys → Trigger deploy → Deploy site* per applicarla.
4. **Email ad amministrazione@neossistemi.it**
   - *Forms* → se richiesto, **Enable form detection**, poi rifai il deploy.
   - *Forms → Submission notifications → Add notification → Email notification*:
     form `ordine-ruote`, email `amministrazione@neossistemi.it`.
   - Se usi Outlook e le righe dell'email risultano unite: *File → Opzioni → Posta → Formato messaggio* →
     togli la spunta a "Rimuovi interruzioni di riga in eccesso nei messaggi di testo normale".
5. Prova: fai un ordine di test, controlla che arrivi l'email e che compaia in `admin.html`, poi eliminalo dal pannello.

## Modifiche frequenti

- **Ruote gratis per atleta**: cambia `gratis` (e `gratisManao` per il limite con le Manao) in `public/atleti.json`.
- **Elenco ruote**: `public/ruote.json` (lo genero io dal file Excel). Il campo `img` è il link alla foto sul sito Bimar Skates: se una foto non si carica, la scheda resta senza immagine.
