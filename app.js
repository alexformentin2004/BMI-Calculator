(() => {'use strict';
const KEY='bodytrack_v1'; const today=()=>new Date().toLocaleDateString('sv-SE'); let state=load(); let tab='home'; let editing=null; let pending=null; let draft=null; let metric='fat'; let period='all';
function load(){try{const p=JSON.parse(localStorage.getItem(KEY));if(p&&Array.isArray(p.entries))return {profile:p.profile||{},entries:p.entries}}catch(e){}return {profile:{},entries:[]}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function h(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function num(x){return Number(String(x??'').replace(',','.'))}
function fmt(x,d=1){return Number.isFinite(x)?x.toLocaleString('it-IT',{minimumFractionDigits:d,maximumFractionDigits:d}):'—'}
function calc(e){
  const sex=e.sex||state.profile.sex;
  const measured=v=>v===null||v===undefined||v===''?NaN:num(v);
  const weight=num(e.weight),height=num(e.height??state.profile.height),neck=measured(e.neck),hip=sex==='female'?measured(e.hip):NaN;
  const hasAbdomen=Object.prototype.hasOwnProperty.call(e,'abdomen');
  const abdomen=sex==='male'?measured(hasAbdomen?e.abdomen:e.waist):NaN;
  const waist=sex==='male'&&!hasAbdomen?NaN:measured(e.waist);
  const bmi=weight/(height/100)**2;
  let fat=NaN;
  if(height>0&&neck>0){
    const inch=1/2.54,H=height*inch;
    if(sex==='male'&&abdomen>neck){
      fat=86.010*Math.log10((abdomen-neck)*inch)-70.041*Math.log10(H)+36.76;
    }else if(sex==='female'&&waist>0&&hip>0&&waist+hip>neck){
      fat=163.205*Math.log10((waist+hip-neck)*inch)-97.684*Math.log10(H)-78.387;
    }
  }
  return {bmi,fat,lean:weight*(1-fat/100),fatKg:weight*fat/100,ratio:waist>0?waist/height:NaN,waist,abdomen,neck,hip};
}
function bmiLabel(b){return b<18.5?'Sottopeso':b<25?'Normopeso':b<30?'Sovrappeso':'Obesità'}
function ordered(){return [...state.entries].sort((a,b)=>b.date.localeCompare(a.date)||b.created-a.created)}
function el(){return document.getElementById('app')}
function icon(name,size=22){
  const paths={
    home:'<path d="m3.5 10 8.5-7 8.5 7v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="M9 21v-7h6v7"/>',
    chart:'<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-7"/><path d="M17 7h3v3"/>',
    archive:'<rect x="3" y="4" width="18" height="4" rx="1.5"/><path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
    heart:'<path d="M20.8 5.6a5.4 5.4 0 0 0-7.6 0L12 6.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 22l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"/><path d="M4.5 12h4l1.5-2.5 3 5 1.5-2.5h5"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.7 2.7 0 1 1 4.3 2.2c-1.1.8-1.8 1.2-1.8 2.8"/><path d="M12 17.4h.01"/>',
    user:'<circle cx="12" cy="8" r="3.5"/><path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2"/>',
    ruler:'<path d="M3 16 16 3l5 5L8 21z"/><path d="m13 6 2 2M10 9l2 2M7 12l2 2"/>',
    calculator:'<rect x="4" y="2.5" width="16" height="19" rx="3"/><path d="M8 7h8M8 12h2m4 0h2m-8 4h2m4 0h2"/>',
    check:'<path d="m4.5 12.5 5 5L20 7"/>',
    download:'<path d="M12 3v12m-4-4 4 4 4-4"/><path d="M4 17v3h16v-3"/>',
    upload:'<path d="M12 16V4m-4 4 4-4 4 4"/><path d="M4 17v3h16v-3"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>'
  };
  return '<svg class="ui-icon" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.help)+'</svg>';
}
function nav(){
  const tabs=[['home','Home','home'],['stats','Statistiche','chart'],['archive','Archivio','archive']];
  return '<nav class="bottom" aria-label="Navigazione principale">'+tabs.map(([id,label,symbol])=>
    '<button type="button" data-tab="'+id+'" class="nav-item'+(tab===id?' active':'')+'" aria-label="'+label+'"'+(tab===id?' aria-current="page"':'')+'><span class="nav-icon">'+icon(symbol,23)+'</span><span class="nav-label">'+label+'</span></button>'
  ).join('')+'</nav>';
}
function shell(inner){
  focusedInput=null;document.body?.classList?.remove('keyboard-active');
  el().innerHTML='<header class="top"><div class="brand"><span class="logo">'+icon('heart',25)+'</span><span class="brand-name">BodyTrack<small>WELLNESS STUDIO</small></span><span class="app-version">v1.6</span></div><button type="button" class="gear" data-tab="guide" aria-label="Guida alle misure" title="Guida alle misure">'+icon('help',21)+'</button></header><main id="content">'+inner+'</main>'+nav()+'<div id="toast-host" class="toast-host" role="status" aria-live="polite" aria-atomic="true"></div><div id="dialog-host"></div><div id="keyboard-tools" class="keyboard-tools" role="toolbar" aria-label="Navigazione campi di misura" hidden><button type="button" data-keyboard="previous" aria-label="Campo precedente"><span class="arrow-back">'+icon('arrow',16)+'</span> Precedente</button><button type="button" data-keyboard="next">Successivo '+icon('arrow',16)+'</button><button type="button" class="keyboard-done" data-keyboard="done">Fine</button></div>';
}
function bmiWeightFloor(bmi,h2){return Math.ceil((bmi*h2-1e-9)*10)/10}
function bmiWeightCeiling(bmi,h2){return (Math.ceil((bmi*h2-1e-9)*10)-1)/10}
function bmiPanel(entry,calculated){
  const height=num(entry.height??state.profile.height);
  if(!(height>=100&&height<=250))return '';
  const sq=(height/100)**2;
  const normalMin=bmiWeightFloor(18.5,sq),normalMax=bmiWeightCeiling(25,sq);
  const overMin=bmiWeightFloor(25,sq),overMax=bmiWeightCeiling(30,sq),obeseMin=bmiWeightFloor(30,sq);
  const current=calculated.bmi;
  const group=current<18.5?'under':current<25?'normal':current<30?'over':'obese';
  const categories=[
    {id:'under',label:'Sottopeso',bmi:'< 18,5',weight:'< '+fmt(normalMin)+' kg'},
    {id:'normal',label:'Normopeso',bmi:'18,5 – < 25',weight:fmt(normalMin)+'–'+fmt(normalMax)+' kg'},
    {id:'over',label:'Sovrappeso',bmi:'25 – < 30',weight:fmt(overMin)+'–'+fmt(overMax)+' kg'},
    {id:'obese',label:'Obesità',bmi:'≥ 30',weight:'≥ '+fmt(obeseMin)+' kg'}
  ];
  const difference=current<18.5?Math.max(0,normalMin-num(entry.weight)):current>=25?Math.max(0,num(entry.weight)-normalMax):0;
  const direction=group==='under'?'per raggiungere il limite inferiore':group==='normal'?'Sei già nella fascia normopeso':'per rientrare sotto il limite superiore';
  const percent=Math.min(99,Math.max(1,(current-15)/25*100));
  const rows=categories.map(c=>'<div class="bmi-row'+(group===c.id?' is-current':'')+'"><div><strong>'+c.label+'</strong>'+(group===c.id?'<span class="bmi-current">Il tuo valore</span>':'')+'</div><span class="bmi-range">'+c.bmi+'</span><span class="bmi-weight-range">'+c.weight+'</span></div>').join('');
  return '<section class="panel bmi-panel"><div class="bmi-heading"><h3>Il BMI nel dettaglio</h3><span class="bmi-status '+group+'">'+bmiLabel(current)+'</span></div>'+
    '<div class="bmi-score">'+fmt(current,2)+'<small>Indice di massa corporea</small></div><div class="bmi-scale" role="img" aria-label="Scala BMI: il tuo valore è '+fmt(current,2)+'"><span></span><span></span><span></span><span></span><i class="bmi-marker" style="left:'+percent+'%"></i></div><div class="bmi-scale-labels"><span>15</span><span>18,5</span><span>25</span><span>30</span><span>40+</span></div>'+
    '<div class="bmi-highlights"><div class="bmi-highlight"><span>Normopeso per '+fmt(height,0)+' cm</span><strong>'+fmt(normalMin)+'–'+fmt(normalMax)+' kg</strong></div>'+
    '<div class="bmi-highlight"><span>'+(group==='normal'?'La tua fascia':'Differenza dalla fascia')+'</span><strong>'+(group==='normal'?'Normopeso':fmt(difference)+' kg')+'</strong><small>'+direction+'</small></div></div>'+
    '<h4>Intervalli BMI e peso per la tua altezza</h4><div class="bmi-table"><div class="bmi-row bmi-table-head"><span>Categoria</span><span>BMI</span><span>Peso</span></div>'+rows+'</div>'+
    '<p class="note">Classificazione BMI per adulti. I pesi sono calcolati per la tua altezza e arrotondati a 0,1 kg. Il BMI non distingue grasso e muscoli: non rappresenta un obiettivo di peso personalizzato.</p></section>';
}
function home(){
  if(pending){result();return}
  measure();
}
function valueFor(x,key,sex,index){
  const sample=x.samples?.[key];
  if(index!==undefined){
    if(x[key+index]!==undefined&&x[key+index]!==null)return x[key+index];
    if(Array.isArray(sample)&&sample[index-1]!==undefined)return sample[index-1];
    if(index===1)return valueFor(x,key,sex);
    return '';
  }
  if(x[key]!==undefined&&x[key]!==null){
    if(key==='waist'&&sex==='male'&&!Object.prototype.hasOwnProperty.call(x,'abdomen')&&!x.samples)return '';
    return x[key];
  }
  if(key==='abdomen'&&sex==='male'&&x.waist!==undefined&&!x.samples)return x.waist;
  if(Array.isArray(sample)&&sample.length)return sample[0];
  if(x[key+'1']!==undefined&&x[key+'1']!==null)return x[key+'1'];
  return '';
}
function fieldInputs(x,sex,mode,key,label,required,description){
  const isAccurate=mode==='accurate';
  const v=(i)=>h(valueFor(x,key,sex,i));
  const attributes='type="number" step=".1" min="'+(key==='neck'?'15':'20')+'" max="'+(key==='neck'?'100':'250')+'" inputmode="decimal" enterkeyhint="next" autocomplete="off"';
  const req=required?'required':'';
  const fields=isAccurate?
    '<div class="repeat-grid">'+[1,2,3].map(i=>'<label><span>Misura '+i+'</span><input name="'+key+i+'" aria-label="'+label+', misura '+i+' (cm)" '+attributes+' '+req+' value="'+v(i)+'" placeholder="cm"></label>').join('')+'</div>':
    '<input name="'+key+'" aria-label="'+label+' (cm)" '+attributes+' '+req+' value="'+v()+'" placeholder="cm">';
  return '<div class="measure-field"><div class="field-title"><strong>'+label+' (cm)</strong>'+(required?'':'<span class="optional">Facoltativa</span>')+'</div>'+fields+
    '<p class="help">'+description+'</p></div>';
}
function measure(){
  const last=ordered()[0]||state.profile||{};
  const saved=state.entries.find(e=>String(e.id)===String(editing))||{};
  const x=draft||(editing?saved:{});
  const sex=x.sex||last.sex||state.profile.sex||'';
  const height=x.height??last.height??state.profile.height??'';
  const age=x.age??last.age??state.profile.age??'';
  const mode=x.mode||'standard';
  const female=sex==='female',male=sex==='male';
  const title=editing?'Modifica misurazione':'Nuova misurazione';
  const msg=editing?'Le modifiche saranno salvate solo dopo la conferma.':'Inserisci i dati, calcola i risultati e decidi se archiviarli.';
  shell('<div class="page-heading"><div class="small">IL TUO PERCORSO BENESSERE</div><h1>'+title+'</h1><p class="muted">'+msg+'</p></div>'+
    '<form id="measurement" novalidate autocomplete="off"><section class="panel form-panel"><div class="section-heading"><span class="section-icon section-icon-rose">'+icon('user',20)+'</span><div><span class="section-step">PASSAGGIO 01</span><h3>Informazioni personali</h3></div></div><div class="two">'+
    '<label>Altezza (cm)<input name="height" type="number" step=".1" min="100" max="250" inputmode="decimal" enterkeyhint="next" required placeholder="180" value="'+h(height)+'"></label>'+
    '<label>Età (anni)<input name="age" type="number" step="1" min="18" max="120" inputmode="numeric" enterkeyhint="next" required placeholder="22" value="'+h(age)+'"></label></div>'+
    '<label>Sesso per la formula<select name="sex" required><option value="" '+(!sex?'selected':'')+'>Seleziona</option><option value="male" '+(male?'selected':'')+'>Uomo</option><option value="female" '+(female?'selected':'')+'>Donna</option></select></label>'+
    '<p class="help">L’età serve a contestualizzare i risultati; non cambia le formule BMI e US Navy. Le categorie BMI qui sono per adulti.</p></section>'+
    '<section class="panel form-panel"><div class="section-heading"><span class="section-icon section-icon-sage">'+icon('ruler',20)+'</span><div><span class="section-step">PASSAGGIO 02</span><h3>Misurazione attuale</h3></div></div><div class="two">'+
    '<label>Data<input name="date" type="date" enterkeyhint="next" required value="'+h(x.date||today())+'"></label>'+
    '<label>Peso (kg)<input name="weight" type="number" step=".1" min="10" max="500" inputmode="decimal" enterkeyhint="next" required placeholder="85,5" value="'+h(x.weight??'')+'"></label></div>'+
    '<div class="mode-heading"><strong>Modalità di misurazione</strong><span>Per le circonferenze</span></div>'+
    '<div class="mode-switch" role="group" aria-label="Modalità di misurazione">'+
    '<label><input type="radio" name="mode" value="standard" '+(mode==='standard'?'checked':'')+'><span>Standard<small>1 misura</small></span></label>'+
    '<label><input type="radio" name="mode" value="accurate" '+(mode==='accurate'?'checked':'')+'><span>Accurata<small>3 misure e media</small></span></label></div>'+
    '<p class="help">'+(mode==='accurate'?'Inserisci tre letture per ogni circonferenza richiesta: useremo la media e segnaleremo differenze oltre 1 cm.':'Una lettura per circonferenza. Puoi scegliere la modalità accurata per ridurre gli errori casuali.')+'</p>'+
    fieldInputs(x,sex,mode,'neck','Collo',true,'Appena sotto la laringe, senza stringere il metro.')+
    (male?fieldInputs(x,sex,mode,'abdomen','Addome',true,'All’altezza dell’ombelico, a fine espirazione normale.'):'')+
    fieldInputs(x,sex,mode,'waist','Vita',female,'Nel punto più stretto. Serve al rapporto vita/altezza; per l’uomo non cambia la stima US Navy.')+
    (female?fieldInputs(x,sex,mode,'hip','Fianchi',true,'Nel punto di maggiore circonferenza dei glutei.'):'')+
    (!sex?'<p class="help">Seleziona uomo o donna per vedere le circonferenze richieste dalla formula.</p>':'')+
    '<details class="guide-details"><summary><span class="summary-icon">'+icon('ruler',18)+'</span><span>Dove devo posizionare il metro?</span><span class="summary-arrow">⌄</span></summary><img src="guida-misure.svg" alt="Quattro illustrazioni: collo sotto la laringe, addome all’ombelico, vita nel punto più stretto, fianchi nel punto più ampio" loading="lazy"><p class="help">Mantieni il metro orizzontale, aderente senza stringere. <button class="text-link" type="button" data-tab="guide">Apri la guida completa</button></p></details></section>'+
    '<button type="submit" class="primary submit-calc"><span>'+icon('calculator',20)+' Calcola i risultati</span>'+icon('arrow',19)+'</button></form>');
}
function result(){
  const e=pending,c=calc(e),v=Number.isFinite(c.fat)&&c.fat>=0&&c.fat<=70;
  const male=e.sex==='male';
  const card=(title,value,sub)=>'<div class="card"><div class="small">'+title+'</div><div class="value">'+value+'</div><div class="caption">'+sub+'</div></div>';
  const labels={neck:'Collo',abdomen:'Addome',waist:'Vita',hip:'Fianchi'};
  const fields=male?['neck','abdomen','waist']:['neck','waist','hip'];
  const measured=fields.filter(k=>Number.isFinite(c[k])&&c[k]>0).map(k=>'<div class="measurement-detail"><span>'+labels[k]+'</span><strong>'+fmt(c[k])+' cm</strong></div>').join('');
  const ranges=e.mode==='accurate'?fields.filter(k=>Array.isArray(e.samples?.[k])&&e.samples[k].length===3).map(k=>{
    const values=e.samples[k],spread=Math.max(...values)-Math.min(...values);
    return {label:labels[k],spread};
  }):[];
  const warnings=ranges.filter(r=>r.spread>1);
  const precision=e.mode==='accurate'?'<p class="help">Le circonferenze sono medie di tre letture; questo riduce gli errori casuali ma non elimina quelli sistematici.</p>'+
    (warnings.length?'<div class="quality-warning">Controlla le letture di '+warnings.map(r=>r.label.toLowerCase()).join(', ')+': differiscono di oltre 1 cm. Puoi modificarle prima di archiviare.</div>':
    '<div class="quality-good">Le tre letture di ogni circonferenza richiesta differiscono al massimo di 1 cm.</div>'):'<p class="help">Misurazione standard: una lettura per circonferenza.</p>';
  shell('<div class="page-heading"><div class="small">ANALISI CORPOREA</div><h1>Il tuo risultato</h1><p class="muted">'+h(e.date)+' · '+(male?'Uomo':'Donna')+' · '+fmt(e.age,0)+' anni · '+fmt(e.height,0)+' cm</p></div>'+
    '<section class="result-hero"><div class="hero-top"><span class="hero-eyebrow">'+icon('ruler',16)+' PESO REGISTRATO</span><span class="hero-state">'+(editing?'Da confermare':'Non archiviato')+'</span></div><div class="weight">'+fmt(e.weight)+' <small>kg</small></div><div class="hero-bottom">'+icon('heart',16)+' Il tuo punto di partenza, oggi.</div></section>'+
    '<div class="grid results-grid">'+card('BMI',fmt(c.bmi,2),bmiLabel(c.bmi))+
    card('Massa grassa',v?fmt(c.fat)+'%':'—',v?fmt(c.fatKg)+' kg stimati':'Stima non disponibile')+
    card('Massa magra',v?fmt(c.lean)+' kg':'—','Massa non grassa stimata')+
    card('Vita / altezza',Number.isFinite(c.ratio)?fmt(c.ratio,3):'—',Number.isFinite(c.ratio)?'Rapporto orientativo':'Aggiungi la vita per calcolarlo')+'</div>'+
    '<section class="panel"><h3>Composizione corporea</h3>'+
    (v?'<div class="bar"><span class="lean" style="width:'+(100-c.fat)+'%"></span><span class="fat" style="width:'+c.fat+'%"></span></div><div class="legend"><span>'+fmt(100-c.fat)+'% massa magra</span><span>'+fmt(c.fat)+'% grassa</span></div>':'<p class="help">Stima non disponibile.</p>')+
    '<p class="note">Massa grassa stimata con formula US Navy; il rapporto vita/altezza utilizza la vita, non la misura dell’addome all’ombelico.</p></section>'+
    '<div class="decision-panel"><div class="decision-icon">'+icon('archive',22)+'</div><h3>Vuoi conservare questa misurazione?</h3><p class="help">Solo scegliendo Archivia comparirà nello storico e nelle statistiche.</p><div class="decision-actions">'+
    '<button type="button" class="secondary" data-action="discard">'+(editing?'Annulla modifiche':'Non archiviare')+'</button>'+
    '<button type="button" class="primary" data-action="archive">'+icon('check',17)+' '+(editing?'Aggiorna archivio':'Archivia')+'</button></div>'+
    '<button type="button" class="text-link revise" data-action="revise">Modifica i dati inseriti</button></div>'+
    '<section class="panel"><h3>Dettaglio delle misure</h3><div class="measurement-detail-grid">'+measured+'</div>'+precision+
    '<p class="note">L’età non modifica le formule. Le percentuali non sono misure cliniche; anche con tre letture resta un margine d’errore del metodo.</p></section>'+
    bmiPanel(e,c)+
    '<details class="calc-details"><summary>Come vengono calcolati i risultati?</summary>'+
    '<p><strong>BMI:</strong> peso in kg diviso altezza in metri al quadrato.</p>'+
    '<p><strong>Massa grassa:</strong> stima US Navy da altezza, collo e '+(male?'addome all’ombelico.':'vita e fianchi.')+'</p>'+
    '<p><strong>Massa magra:</strong> peso meno massa grassa stimata; non è la sola massa muscolare.</p>'+
    '<p><strong>Vita/altezza:</strong> circonferenza vita divisa per altezza, nelle stesse unità. Un rapporto inferiore a 0,50 è un riferimento generale, non una diagnosi.</p>'+
    '<p><strong>Età:</strong> registrata per il contesto, senza influenzare i calcoli BMI o US Navy.</p></details>'+
    '<p class="note">La massa magra comprende anche acqua, ossa e organi. Il BMI non distingue muscoli e grasso: i range di peso non sono prescrizioni individuali.</p>');
}
function guide(){
  shell('<div class="page-heading"><div class="small">GUIDA VISIVA</div><h1>Dove prendere le misure</h1><p class="muted">Usa un metro morbido e tienilo parallelo al pavimento, aderente ma senza comprimere la pelle.</p></div>'+
    '<section class="panel guide-panel"><img src="guida-misure.svg" alt="Posizioni illustrate delle circonferenze di collo, addome, vita e fianchi" width="730" height="760">'+
    '<div class="guide-copy"><h3>Collo</h3><p>Misura appena sotto la laringe (pomo d’Adamo), mantenendo il metro orizzontale.</p>'+
    '<h3>Addome · formula uomo</h3><p>Misura all’altezza dell’ombelico, con l’addome rilassato, al termine di un’espirazione normale.</p>'+
    '<h3>Vita · formula donna</h3><p>Misura nel punto più stretto del busto, senza tirare in dentro la pancia.</p>'+
    '<h3>Fianchi · formula donna</h3><p>Misura nel punto di maggiore circonferenza dei glutei, con i piedi vicini.</p>'+
    '<p class="note">Ripeti sempre le misurazioni nello stesso modo per confrontare i risultati nel tempo. Il metodo US Navy fornisce una stima.</p></div></section>'+
    '<button type="button" class="primary" data-tab="home">Torna alla misurazione</button>');
}
function archive(){
  const a=ordered();
  shell('<div class="page-heading"><div class="small">IL TUO PERCORSO</div><h1>Archivio</h1><p class="muted">Tutte le misurazioni che hai scelto di conservare.</p></div>'+
    '<section class="archive-summary"><span class="archive-summary-icon">'+icon('archive',24)+'</span><div><span>Misurazioni salvate</span><strong>'+a.length+'</strong></div><span class="archive-summary-caption">IL TUO STORICO</span></section>'+
    '<div class="archive-toolbar"><button type="button" class="secondary" data-action="export">'+icon('download',17)+' Esporta</button><button type="button" class="secondary" data-action="import">'+icon('upload',17)+' Importa</button></div><input hidden id="import-file" type="file" accept="application/json">'+
    '<section class="archive-list">'+(a.length?a.map(e=>{
      const c=calc(e),sex=e.sex||state.profile.sex;
      return '<article class="entry"><div class="entryhead"><div class="entry-date"><span class="entry-date-icon">'+icon('calendar',17)+'</span><strong>'+h(e.date)+'</strong></div><span class="pill">'+fmt(num(e.weight))+' kg</span></div>'+
        '<div class="entry-metrics"><span><small>BMI</small><strong>'+fmt(c.bmi,2)+'</strong></span><span><small>Grasso stimato</small><strong>'+fmt(c.fat)+'%</strong></span><span><small>Massa magra</small><strong>'+fmt(c.lean)+' kg</strong></span></div>'+
        '<p class="entry-meta">'+(sex==='female'?'Donna':'Uomo')+' · '+(e.mode==='accurate'?'Modalità accurata':'Standard')+
        (Number.isFinite(num(e.age))&&num(e.age)>0?' · '+fmt(num(e.age),0)+' anni':'')+'</p>'+
        '<div class="actions"><button type="button" class="secondary" data-edit="'+h(e.id)+'">Modifica</button><button type="button" class="danger" data-delete="'+h(e.id)+'">Elimina</button></div></article>';
    }).join(''):'<div class="empty archive-empty"><span class="empty-icon">'+icon('archive',30)+'</span><strong>Il tuo percorso inizia qui</strong><p>Le misurazioni compariranno quando sceglierai di archiviarle.</p></div>')+
    '</section><button type="button" class="primary submit-calc" data-action="new"><span>'+icon('plus',19)+' Nuova misurazione</span>'+icon('arrow',19)+'</button>');
}
function graph(data,key){
  if(data.length<2)return '<div class="empty chart-empty"><span class="empty-icon">'+icon('chart',28)+'</span><strong>Servono almeno due misurazioni</strong><p>Archivia una seconda misurazione per vedere il tuo andamento.</p></div>';
  const w=340,H=186,left=12,right=328,top=16,bottom=146;
  const vals=data.map(x=>x[key]),lo=Math.min(...vals),hi=Math.max(...vals);
  const padding=Math.max((hi-lo)*.18,key==='ratio'?.02:key==='fat'?1:.5),min=lo-padding,max=hi+padding;
  const pts=data.map((x,i)=>[left+i*(right-left)/(data.length-1),bottom-(x[key]-min)/(max-min)*(bottom-top)]);
  const path=pts.reduce((d,p,i)=>{
    if(i===0)return 'M'+p[0].toFixed(1)+' '+p[1].toFixed(1);
    const prev=pts[i-1],mid=(prev[0]+p[0])/2;
    return d+' C'+mid.toFixed(1)+' '+prev[1].toFixed(1)+' '+mid.toFixed(1)+' '+p[1].toFixed(1)+' '+p[0].toFixed(1)+' '+p[1].toFixed(1);
  },'');
  const area=path+' L'+right+' '+bottom+' L'+left+' '+bottom+' Z';
  const dates=pts.map((p,i)=>'<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="'+(i===pts.length-1?'5':'3.2')+'" fill="'+(i===pts.length-1?'#ac466b':'#ffffff')+'" stroke="#ac466b" stroke-width="2"/>').join('');
  return '<svg class="chart" viewBox="0 0 340 186" role="img" aria-label="Grafico storico '+h(key)+'"><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#c66e8e" stop-opacity=".26"/><stop offset="100%" stop-color="#c66e8e" stop-opacity="0"/></linearGradient></defs>'+
    [top,(top+bottom)/2,bottom].map(y=>'<path d="M'+left+' '+y+' H'+right+'" fill="none" stroke="#f0e6ea" stroke-dasharray="4 6"/>').join('')+
    '<path d="'+area+'" fill="url(#chartFill)"/><path d="'+path+'" fill="none" stroke="#ac466b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'+dates+
    '<text x="'+left+'" y="177" fill="#8d7d88" font-size="11">'+h(data[0].date)+'</text><text x="'+right+'" y="177" text-anchor="end" fill="#8d7d88" font-size="11">'+h(data[data.length-1].date)+'</text></svg>';
}
function stats(){
  const now=new Date(),months={m1:30,m3:90,m6:180,y1:365,all:Infinity};
  const data=ordered().filter(e=>{
    const days=(now-new Date(e.date+'T12:00:00'))/86400000;
    return days<=months[period]&&days>=-1;
  }).reverse().map(e=>({...e,...calc(e),weight:num(e.weight)}));
  const valid=data.filter(x=>Number.isFinite(x[metric])&&(metric!=='fat'||x.fat>=0&&x.fat<=70));
  const filters=[['m1','30g'],['m3','3 mesi'],['m6','6 mesi'],['y1','1 anno'],['all','Tutto']];
  const options=[
    ['weight','Peso (kg)'],['bmi','BMI'],['fat','Massa grassa (%)'],['lean','Massa magra (kg)'],
    ['waist','Vita (cm)'],['abdomen','Addome (cm)'],['hip','Fianchi (cm)'],['neck','Collo (cm)'],['ratio','Vita / altezza']
  ];
  const selectedLabel=options.find(x=>x[0]===metric)?.[1]||'Parametro';
  const latest=valid.length?valid[valid.length-1][metric]:NaN;
  const delta=valid.length>1?latest-valid[0][metric]:NaN;
  const digits=metric==='ratio'?3:metric==='bmi'?2:1;
  shell('<div class="page-heading"><div class="small">I TUOI PROGRESSI</div><h1>Statistiche</h1><p class="muted">Uno sguardo chiaro all’evoluzione delle tue misurazioni.</p></div>'+
    '<div class="filters" aria-label="Periodo">'+filters.map(x=>'<button type="button" class="'+(period===x[0]?'selected':'')+'" data-period="'+x[0]+'" aria-pressed="'+(period===x[0])+'">'+x[1]+'</button>').join('')+'</div>'+
    '<section class="panel stats-panel"><label class="metric-select">Parametro da visualizzare<select id="metric">'+options.map(x=>'<option value="'+x[0]+'" '+(metric===x[0]?'selected':'')+'>'+x[1]+'</option>').join('')+'</select></label>'+
    '<div class="stat-summary"><div><span class="stat-summary-label">ULTIMO VALORE · '+h(selectedLabel)+'</span><strong>'+fmt(latest,digits)+'</strong></div>'+
    '<span class="stat-delta'+(Number.isFinite(delta)&&delta<0?' is-negative':'')+'">'+(Number.isFinite(delta)?(delta>0?'+':'')+fmt(delta,digits):'—')+' <small>nel periodo</small></span></div>'+
    '<div class="chart-wrap">'+graph(valid,metric)+'</div></section>'+
    '<p class="note">Le misurazioni precedenti alla v1.4 potrebbero non avere la vita distinta dall’addome. I dati mancanti non vengono interpretati come zero.</p>');
}
function render(){if(tab==='home')home();else if(tab==='archive')archive();else if(tab==='stats')stats();else guide()}
function captureDraft(){
  const form=document.getElementById('measurement');
  if(!form)return;
  const f=new FormData(form);
  draft={date:f.get('date'),sex:f.get('sex'),height:f.get('height'),age:f.get('age'),weight:f.get('weight'),mode:f.get('mode')||'standard'};
  for(const key of ['neck','abdomen','waist','hip']){
    draft[key]=f.get(key);
    for(let i=1;i<=3;i++)draft[key+i]=f.get(key+i);
  }
}
function readCircumference(form,key,mode,required){
  const label={neck:'collo',abdomen:'addome',waist:'vita',hip:'fianchi'}[key]||key;
  const raw=mode==='accurate'?[1,2,3].map(i=>form.get(key+i)):[form.get(key)];
  const present=raw.filter(v=>v!==null&&String(v).trim()!=='');
  if(!present.length&&!required)return {average:null,readings:[]};
  if(present.length!==raw.length){
    const err=new Error('Completa '+(mode==='accurate'?'tutte e tre le letture di ':'la misura di ')+label+'.');
    err.field=mode==='accurate'?key+(raw.findIndex(v=>v===null||String(v).trim()==='')+1):key;
    throw err;
  }
  const values=raw.map(num);
  const min=key==='neck'?15:20,max=key==='neck'?100:250;
  const invalid=values.findIndex(v=>!Number.isFinite(v)||v<min||v>max);
  if(invalid>=0){
    const err=new Error('Controlla le misure di '+label+'.');
    err.field=mode==='accurate'?key+(invalid+1):key;throw err;
  }
  return {average:Math.round(values.reduce((a,b)=>a+b,0)/values.length*10)/10,readings:values};
}
let dialogAction=null, dialogReturnFocus=null, toastSequence=0, focusedInput=null;
function toast(message,kind='success'){
  const host=document.getElementById('toast-host');if(!host)return;
  const serial=++toastSequence;
  host.innerHTML='<div class="app-toast '+(kind==='error'?'toast-error':'toast-success')+'">'+
    '<span class="toast-symbol">'+icon(kind==='error'?'help':'check',19)+'</span><span class="toast-message">'+h(message)+'</span>'+
    '<button type="button" data-toast-close aria-label="Chiudi notifica">×</button></div>';
  setTimeout(()=>{if(serial===toastSequence&&document.getElementById('toast-host')===host)host.innerHTML='';},4200);
}
function askConfirmation({title,message,confirmText,danger=false},action){
  const host=document.getElementById('dialog-host');if(!host)return;
  dialogAction=action;dialogReturnFocus=document.activeElement;
  host.innerHTML='<div class="dialog-backdrop"><section class="app-dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-description">'+
    '<div class="dialog-symbol '+(danger?'dialog-danger':'')+'">'+icon(danger?'archive':'upload',25)+'</div>'+
    '<h2 id="dialog-title">'+h(title)+'</h2><p id="dialog-description">'+h(message)+'</p>'+
    '<div class="dialog-actions"><button type="button" class="secondary" data-modal="cancel">Annulla</button>'+
    '<button type="button" class="'+(danger?'danger':'primary')+'" data-modal="confirm">'+h(confirmText)+'</button></div></section></div>';
  document.body?.classList?.add('modal-open');
  host.querySelector('[data-modal="cancel"]')?.focus();
}
function closeConfirmation(){
  const host=document.getElementById('dialog-host');
  if(host)host.innerHTML='';
  dialogAction=null;
  document.body?.classList?.remove('modal-open');
  const previous=dialogReturnFocus;dialogReturnFocus=null;
  if(previous?.isConnected)previous.focus();
}
function numberFields(){
  return Array.from(document.querySelectorAll('#measurement input[type="number"]'));
}
function keyboardState(show){
  const tools=document.getElementById('keyboard-tools');
  if(!tools)return;
  const touch=typeof window!=='undefined'&&window.matchMedia?.('(pointer: coarse)')?.matches;
  const visible=!!(show&&touch);
  tools.hidden=!visible;
  document.body?.classList?.toggle('keyboard-active',visible);
  if(!visible)return;
  const fields=numberFields(),index=fields.indexOf(focusedInput);
  const prev=tools.querySelector('[data-keyboard="previous"]'),next=tools.querySelector('[data-keyboard="next"]');
  if(prev)prev.disabled=index<=0;
  if(next)next.disabled=index<0||index===fields.length-1;
  updateKeyboardOffset();
}
function updateKeyboardOffset(){
  if(typeof window==='undefined'||!window.visualViewport)return;
  const vv=window.visualViewport;
  const overlap=Math.max(0,window.innerHeight-vv.height-vv.offsetTop);
  document.documentElement?.style?.setProperty('--keyboard-overlap',overlap+'px');
}
function navigateNumber(direction){
  const fields=numberFields(),index=fields.indexOf(focusedInput);
  if(index<0)return;
  const next=fields[index+direction];
  if(next){next.focus();setTimeout(()=>next.scrollIntoView?.({block:'center',behavior:'smooth'}),150);}
  else if(direction>0){focusedInput.blur();keyboardState(false);}
}
function formError(message,field){
  toast(message,'error');
  if(field){
    const target=document.querySelector('#measurement [name="'+field+'"]');
    if(target){target.focus();setTimeout(()=>target.scrollIntoView?.({block:'center',behavior:'smooth'}),180);}
  }
}
document.addEventListener('focusin',e=>{
  if(e.target.matches?.('#measurement input[type="number"]')){
    focusedInput=e.target;
    const fields=numberFields();
    e.target.setAttribute('enterkeyhint',fields.indexOf(e.target)===fields.length-1?'done':'next');
    keyboardState(true);
    setTimeout(()=>{if(document.activeElement===e.target)e.target.scrollIntoView?.({block:'center',behavior:'smooth'});},240);
  }else if(!e.target.closest?.('#keyboard-tools')){
    keyboardState(false);
  }
});
document.addEventListener('focusout',()=>{
  setTimeout(()=>{
    const current=document.activeElement;
    if(!current?.matches?.('#measurement input[type="number"]'))keyboardState(false);
  },160);
});
document.addEventListener('keydown',e=>{
  if(dialogAction){
    if(e.key==='Escape'){e.preventDefault();closeConfirmation();return;}
    if(e.key==='Tab'){
      const buttons=Array.from(document.querySelectorAll('#dialog-host [data-modal]'));
      if(!buttons.length)return;
      const index=buttons.indexOf(document.activeElement);
      if(e.shiftKey&&index<=0){e.preventDefault();buttons[buttons.length-1].focus();}
      else if(!e.shiftKey&&index===buttons.length-1){e.preventDefault();buttons[0].focus();}
    }
    return;
  }
  if(e.key==='Enter'&&e.target.matches?.('#measurement input[type="number"]')){
    e.preventDefault();focusedInput=e.target;navigateNumber(1);
  }
});
if(typeof window!=='undefined'&&window.visualViewport){
  window.visualViewport.addEventListener('resize',updateKeyboardOffset);
  window.visualViewport.addEventListener('scroll',updateKeyboardOffset);
}
function resetCurrent(message){
  pending=null;draft=null;editing=null;tab='home';
  render();scrollTo(0,0);if(message)toast(message);
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-tab],[data-edit],[data-delete],[data-period],[data-action],[data-keyboard],[data-modal],[data-toast-close]');
  if(!b)return;
  if(b.dataset.modal){
    const action=b.dataset.modal==='confirm'?dialogAction:null;
    closeConfirmation();if(action)action();return;
  }
  if(b.hasAttribute('data-toast-close')){
    const host=document.getElementById('toast-host');if(host)host.innerHTML='';
    toastSequence++;return;
  }
  if(b.dataset.keyboard){
    if(b.dataset.keyboard==='done'){focusedInput?.blur();keyboardState(false);}
    else navigateNumber(b.dataset.keyboard==='previous'?-1:1);
    return;
  }
  if(b.dataset.tab){
    if(tab==='home')captureDraft();
    tab=b.dataset.tab;render();scrollTo(0,0);
  }else if(b.dataset.edit){
    pending=null;draft=null;editing=b.dataset.edit;tab='home';render();scrollTo(0,0);
  }else if(b.dataset.delete){
    const id=b.dataset.delete;
    askConfirmation({
      title:'Eliminare questa misurazione?',
      message:'La misurazione verrà eliminata definitivamente dall’archivio e dalle statistiche. Questa operazione non può essere annullata.',
      confirmText:'Elimina',danger:true
    },()=>{
      state.entries=state.entries.filter(x=>String(x.id)!==id);
      save();render();toast('Misurazione eliminata dall’archivio.');
    });
  }else if(b.dataset.period){period=b.dataset.period;render();
  }else if(b.dataset.action==='new'){resetCurrent('');
  }else if(b.dataset.action==='revise'){
    draft={...pending};pending=null;tab='home';render();scrollTo(0,0);
  }else if(b.dataset.action==='discard'){resetCurrent(editing?'Modifiche annullate: la misurazione archiviata non è stata cambiata.':'Risultato non archiviato.');
  }else if(b.dataset.action==='archive'){
    if(!pending)return;
    const entry={...pending};
    state.entries=state.entries.filter(x=>String(x.id)!==String(entry.id));
    state.entries.push(entry);
    state.profile={...state.profile,height:entry.height,sex:entry.sex,age:entry.age};
    save();resetCurrent(editing?'Misurazione aggiornata nell’archivio.':'Misurazione archiviata con successo.');
  }else if(b.dataset.action==='export'){
    const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='bodytrack-backup-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('Backup JSON preparato. Conservalo in un luogo sicuro.');
  }else if(b.dataset.action==='import'){
    document.getElementById('import-file')?.click();
  }
});
document.addEventListener('change',e=>{
  if(e.target.id==='metric'){
    metric=e.target.value;render();
  }else if((e.target.name==='sex'||e.target.name==='mode')&&e.target.form?.id==='measurement'){
    captureDraft();render();
  }else if(e.target.id==='import-file'){
    const file=e.target.files[0];if(!file)return;
    file.text().then(t=>{
      const v=JSON.parse(t);
      if(!v||!Array.isArray(v.entries)||!v.entries.every(e=>e&&typeof e==='object'&&
        typeof e.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(e.date)&&
        (typeof e.id==='string'||typeof e.id==='number')&&Number.isFinite(num(e.weight)))||
        (v.profile!==undefined&&(!v.profile||typeof v.profile!=='object'||Array.isArray(v.profile)))){
        throw new Error('Il file non contiene un archivio BodyTrack valido.');
      }
      askConfirmation({
        title:'Importare questo backup?',
        message:'Il backup contiene '+v.entries.length+' misurazioni. Sostituirà tutte le '+state.entries.length+' misurazioni attualmente archiviate su questo dispositivo.',
        confirmText:'Sostituisci archivio',danger:true
      },()=>{
        state={profile:v.profile||{},entries:v.entries};
        save();pending=null;draft=null;editing=null;tab='archive';render();
        toast('Backup importato: '+v.entries.length+' misurazioni disponibili.');
      });
    }).catch(err=>toast(err.message==='Il file non contiene un archivio BodyTrack valido.'?err.message:'Impossibile leggere il backup JSON.','error'))
      .finally(()=>{e.target.value='';});
  }
});
document.addEventListener('submit',e=>{
  if(e.target.id!=='measurement')return;
  e.preventDefault();
  const f=new FormData(e.target);
  const sex=f.get('sex'),height=num(f.get('height')),age=num(f.get('age')),weight=num(f.get('weight')),mode=f.get('mode')||'standard';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(f.get('date')||''))return formError('Inserisci una data valida.','date');
  if(!(height>=100&&height<=250))return formError('Inserisci un’altezza tra 100 e 250 cm.','height');
  if(!Number.isInteger(age)||age<18||age>120)return formError('Inserisci un’età adulta tra 18 e 120 anni.','age');
  if(!['male','female'].includes(sex))return formError('Seleziona il sesso usato per la formula.','sex');
  if(!(weight>=10&&weight<=500))return formError('Inserisci un peso tra 10 e 500 kg.','weight');
  if(!['standard','accurate'].includes(mode))return formError('Seleziona una modalità di misurazione.');
  let neck,abdomen,waist,hip;
  try{
    neck=readCircumference(f,'neck',mode,true);
    abdomen=readCircumference(f,'abdomen',mode,sex==='male');
    waist=readCircumference(f,'waist',mode,sex==='female');
    hip=readCircumference(f,'hip',mode,sex==='female');
  }catch(err){formError(err.message,err.field);return}
  const old=state.entries.find(z=>String(z.id)===String(editing));
  const x={
    id:editing||('m'+Date.now()),created:old?.created||Date.now(),
    date:f.get('date'),sex,height,age,weight,mode,
    neck:neck.average,abdomen:sex==='male'?abdomen.average:null,
    waist:waist.average,hip:sex==='female'?hip.average:null,
    samples:{neck:neck.readings,abdomen:sex==='male'?abdomen.readings:[],
      waist:waist.readings,hip:sex==='female'?hip.readings:[]}
  };
  if(sex==='male'&&!(x.abdomen>x.neck)||sex==='female'&&!(x.waist+x.hip>x.neck)){
    formError('Controlla le circonferenze: la combinazione inserita non è valida per la formula.',sex==='male'?'abdomen'+(mode==='accurate'?'1':''):'waist'+(mode==='accurate'?'1':''));return;
  }
  const c=calc(x);
  if(!Number.isFinite(c.fat)||c.fat<2||c.fat>70){
    formError('La stima non è plausibile: ricontrolla le misure e la posizione del metro.','neck'+(mode==='accurate'?'1':''));return;
  }
  draft=null;pending=x;tab='home';render();scrollTo(0,0);
});
render();
})();