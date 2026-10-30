# BodyTrack 1.3

PWA mobile-first per calcolare BMI, massa grassa stimata e massa magra, con archivio e statistiche.

## Come funziona

1. Nella **Home**, inserisci direttamente altezza, sesso usato per la formula, peso e circonferenze. Non serve aprire impostazioni.
2. Tocca **Calcola i risultati** per visualizzare BMI, massa grassa, massa magra e intervalli di peso per il BMI.
3. Decidi **Archivia** oppure **Non archiviare**. Nessun risultato viene archiviato automaticamente.
4. Solo le misurazioni archiviate compaiono nelle sezioni **Statistiche** e **Archivio**.
5. Nella Home puoi aprire la guida illustrata alle misure; la guida completa è disponibile dall'icona in alto a destra.

## Dati e backup

I dati archiviati vengono conservati nel browser con `localStorage`. Le misurazioni non archiviate restano solo nella sessione corrente e si perdono ricaricando la pagina. Esporta periodicamente un backup JSON dall'Archivio; cancellare i dati del browser può eliminare lo storico. Il repository pubblico non contiene dati personali.

Per misurazioni salvate nelle versioni precedenti, il calcolatore continua a usare il profilo storico quando mancano altezza e sesso nella singola registrazione. Le nuove registrazioni salvano altezza e sesso insieme alla misura.

## Pubblicazione

Repository → Settings → Pages → Deploy from a branch → `main` → `/(root)` → Save.

## Metodo

Formula tradizionale US Navy (circonferenze convertite da cm a pollici), con formule separate per uomo e donna. Per l'uomo si misura l'addome all'ombelico; per la donna la vita nel punto più stretto e i fianchi nel punto più ampio. Le percentuali di massa grassa e magra sono **stime**, non esami diagnostici. La massa magra non indica soltanto muscoli.

Riferimenti: [US Coast Guard, Body Composition Standards Program](https://media.defense.gov/2025/Feb/07/2003642977/-1/-1/0/CI_1020_8I.PDF); [US Army, Body Fat Calculation](https://api.army.mil/e2/c/downloads/566092.pdf).
