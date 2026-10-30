# BodyTrack 1.5 — Wellness Redesign

PWA mobile-first, con grafica rosa cipria completamente rinnovata, per calcolare BMI, stima della composizione corporea, rapporto vita/altezza e tenere uno storico **solo delle misurazioni archiviate esplicitamente**.

## Design e navigazione (v1.5)

Restyling completo in stile wellness: palette rosa cipria, superfici bianche, verde salvia, tipografia di sistema, sezioni leggibili e pulsanti con aree touch ampie. La barra inferiore è flottante e utilizza **tre icone SVG vettoriali originali** (Home, Statistiche e Archivio), con stato attivo visibile e etichette accessibili. Anche il marchio e l'icona della PWA sono coordinati.

- Home: due schede con passaggi numerati, selettore Standard/Accurata e guida integrata.
- Risultato: scheda del peso, metriche in quattro card, BMI dettagliato e scelta esplicita di archiviazione.
- Statistiche: grafico con linea morbida, sfumatura, selezione del periodo e riepilogo della variazione.
- Archivio: card per misurazione, indicatori rapidi e backup JSON.
- Layout adattivo per schermi piccoli, safe area di iPhone, focus accessibile e animazioni ridotte per chi lo richiede.

**Le formule e il formato dei dati (`bodytrack_v1`) non cambiano:** nessuna migrazione o cancellazione dei dati esistenti è richiesta.

## Nuova Home

Il calcolatore si apre direttamente in Home. Inserisci:

- Altezza, **età adulta** (18–120 anni) e sesso usato per la formula.
- Data e peso.
- Circonferenza del collo.
- **Uomo:** addome all'ombelico (obbligatorio per US Navy) e vita nel punto più stretto (facoltativa per il rapporto vita/altezza).
- **Donna:** vita nel punto più stretto e fianchi nel punto più ampio (obbligatori per US Navy).

Puoi scegliere la modalità **Standard**, una lettura per circonferenza, oppure **Accurata**, tre letture con **media automatica** e avviso se la differenza tra la più grande e la più piccola supera 1 cm. Le letture originali e le medie vengono conservate quando archivi la misurazione.

Il risultato mostra BMI a due decimali, categoria e fasce di peso per la tua altezza, massa grassa stimata (%) e in kg, massa non grassa stimata (kg), rapporto vita/altezza quando disponibile, dettagli delle misure e spiegazione dei metodi.

**Non viene archiviato nulla automaticamente:** dopo ogni calcolo scegli **Archivia** oppure **Non archiviare**. Puoi modificare i dati prima di decidere.

## Storico e privacy

L'Archivio contiene le sole misurazioni confermate, modificabili ed eliminabili. Le Statistiche mostrano peso, BMI, stima massa grassa e magra, vita, addome, collo, fianchi e rapporto vita/altezza quando disponibili. La guida illustrata mostra dove prendere le misure.

I dati restano nel browser in `localStorage`, non vengono caricati nella repository. Esporta periodicamente un backup JSON dall'Archivio. Le misurazioni non archiviate non vengono salvate e si perdono ricaricando la pagina.

Le misurazioni delle versioni precedenti restano leggibili. Per i vecchi record maschili, il precedente campo `waist` rappresentava l'addome all'ombelico: viene usato per la stima US Navy, **non** confuso con la nuova misura della vita nel grafico o nel rapporto vita/altezza.

## Precisione e limiti

- BMI = peso / altezza², con altezza in metri. Le categorie riportate sono **per adulti**.
- La stima del grasso corporeo usa la formula US Navy con circonferenze convertite in pollici e coefficienti distinti per uomo e donna.
- La massa magra è la massa **non grassa**, non la sola massa muscolare.
- Il rapporto vita/altezza è un indicatore orientativo; il riferimento di 0,50 non costituisce una diagnosi.
- L'età non entra nelle formule BMI o US Navy.
- Ripetere tre volte le circonferenze può ridurre l'errore casuale, ma non elimina l'errore sistematico né rende il risultato clinicamente preciso.

Le stime non sostituiscono misurazioni cliniche o una valutazione professionale.

## Pubblicazione

Repository → Settings → Pages → Deploy from a branch → `main` → `/(root)` → Save.

Apri GitHub Pages con Safari e scegli **Condividi → Aggiungi alla schermata Home**.

## Riferimenti

- [US Coast Guard, Body Composition Standards Program](https://media.defense.gov/2025/Feb/07/2003642977/-1/-1/0/CI_1020_8I.PDF)
- [US Army, Body Fat Calculation](https://api.army.mil/e2/c/downloads/566092.pdf)
