(() => {'use strict';
const KEY='bodytrack_v1'; const today=()=>new Date().toLocaleDateString('sv-SE'); let state=load(); let tab='home'; let editing=null; let pending=null; let draft=null; let notice=''; let metric='fat'; let period='all';
function load(){try{const p=JSON.parse(localStorage.getItem(KEY));if(p&&Array.isArray(p.entries))return {profile:p.profile||{},entries:p.entries}}catch(e){}return {profile:{},entries:[]}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function h(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function num(x){return Number(String(x??'').replace(',','.'))}
function fmt(x,d=1){return Number.isFinite(x)?x.toLocaleString('it-IT',{minimumFractionDigits:d,maximumFractionDigits:d}):'—'}
function calc(e){
  const sex=e.sex||state.profile.sex;
  const weight=num(e.weight),height=num(e.height??state.profile.height),neck=num(e.neck),hip=num(e.hip);
  const hasAbdomen=Object.prototype.hasOwnProperty.call(e,'abdomen');
  const abdomen=sex==='male'?num(hasAbdomen?e.abdomen:e.waist):NaN;
  const waist=sex==='male'&&!hasAbdomen?NaN:num(e.waist);
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
function nav(){return '<nav class="bottom"><button data-tab="home" class="'+(tab==='home'?'active':'')+'"><b>⌂</b>Home</button><button data-tab="stats" class="'+(tab==='stats'?'active':'')+'"><b>▥</b>Statistiche</button><button data-tab="archive" class="'+(tab==='archive'?'active':'')+'"><b>▤</b>Archivio</button></nav>'}
function shell(inner){el().innerHTML='<header class="top"><div class="brand"><span class="logo">♡</span>BodyTrack <span class="app-version">v1.4</span></div><button class="gear" data-tab="guide" aria-label="Guida alle misure" title="Guida alle misure">ⓘ</button></header>'+inner+nav()}
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
  return '';
}
function fieldInputs(x,sex,mode,key,label,required,description){
  const isAccurate=mode==='accurate';
  const v=(i)=>h(valueFor(x,key,sex,i));
  const attributes='type="number" step=".1" min="'+(key==='neck'?'15':'20')+'" max="'+(key==='neck'?'100':'250')+'" inputmode="decimal"';
  const req=required?'required':'';
  const fields=isAccurate?
    '<div class="repeat-grid">'+[1,2,3].map(i=>'<label><span>Misura '+i+'</span><input name="'+key+i+'" '+attributes+' '+req+' value="'+v(i)+'" placeholder="cm"></label>').join('')+'</div>':
    '<input name="'+key+'" '+attributes+' '+req+' value="'+v()+'" placeholder="cm">';
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
  const flash=notice?'<div class="flash" role="status">'+h(notice)+'</div>':'';
  notice='';
  shell(flash+'<div class="small">CALCOLATORE CORPOREO</div><h1>'+title+'</h1><p class="muted">'+msg+'</p>'+
    '<form id="measurement"><section class="panel"><h3>Informazioni personali</h3><div class="two">'+
    '<label>Altezza (cm)<input name="height" type="number" step=".1" min="100" max="250" inputmode="decimal" required placeholder="180" value="'+h(height)+'"></label>'+
    '<label>Età (anni)<input name="age" type="number" step="1" min="18" max="120" inputmode="numeric" required placeholder="22" value="'+h(age)+'"></label></div>'+
    '<label>Sesso per la formula<select name="sex" required><option value="" '+(!sex?'selected':'')+'>Seleziona</option><option value="male" '+(male?'selected':'')+'>Uomo</option><option value="female" '+(female?'selected':'')+'>Donna</option></select></label>'+
    '<p class="help">L’età serve a contestualizzare i risultati; non cambia le formule BMI e US Navy. Le categorie BMI qui sono per adulti.</p></section>'+
    '<section class="panel"><h3>Misurazione attuale</h3><div class="two">'+
    '<label>Data<input name="date" type="date" required value="'+h(x.date||today())+'"></label>'+
    '<label>Peso (kg)<input name="weight" type="number" step=".1" min="10" max="500" inputmode="decimal" required placeholder="85,5" value="'+h(x.weight??'')+'"></label></div>'+
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
    '<details class="guide-details"><summary>📏 Dove devo posizionare il metro?</summary><img src="guida-misure.svg" alt="Quattro illustrazioni: collo sotto la laringe, addome all’ombelico, vita nel punto più stretto, fianchi nel punto più ampio" loading="lazy"><p class="help">Mantieni il metro orizzontale, aderente senza stringere. <button class="text-link" type="button" data-tab="guide">Apri la guida completa</button></p></details></section>'+
    '<button type="submit" class="primary">Calcola i risultati</button></form>');
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
  shell('<div class="small">RISULTATO · '+(editing?'MODIFICHE NON CONFERMATE':'NON ARCHIVIATO')+'</div><h1>Il tuo risultato</h1><p class="muted">'+h(e.date)+' · '+(male?'Uomo':'Donna')+' · '+fmt(e.age,0)+' anni · '+fmt(e.height,0)+' cm</p>'+
    '<div class="weight">'+fmt(e.weight)+' kg</div>'+
    '<div class="grid">'+card('BMI',fmt(c.bmi,2),bmiLabel(c.bmi))+
    card('Massa grassa',v?fmt(c.fat)+'%':'—',v?fmt(c.fatKg)+' kg stimati':'Stima non disponibile')+
    card('Massa magra',v?fmt(c.lean)+' kg':'—','Massa non grassa stimata')+
    card('Vita / altezza',Number.isFinite(c.ratio)?fmt(c.ratio,3):'—',Number.isFinite(c.ratio)?'Rapporto orientativo':'Aggiungi la vita per calcolarlo')+'</div>'+
    '<section class="panel"><h3>Composizione corporea</h3>'+
    (v?'<div class="bar"><span class="lean" style="width:'+(100-c.fat)+'%"></span><span class="fat" style="width:'+c.fat+'%"></span></div><div class="legend"><span>'+fmt(100-c.fat)+'% massa magra</span><span>'+fmt(c.fat)+'% grassa</span></div>':'<p class="help">Stima non disponibile.</p>')+
    '<p class="note">Massa grassa stimata con formula US Navy; il rapporto vita/altezza utilizza la vita, non la misura dell’addome all’ombelico.</p></section>'+
    '<div class="decision-panel"><h3>Vuoi conservare questa misurazione?</h3><p class="help">Solo scegliendo Archivia comparirà nello storico e nelle statistiche.</p><div class="decision-actions">'+
    '<button type="button" class="secondary" data-action="discard">'+(editing?'Annulla modifiche':'Non archiviare')+'</button>'+
    '<button type="button" class="primary" data-action="archive">'+(editing?'Aggiorna archivio':'Archivia')+'</button></div>'+
    '<button type="button" class="text-link revise" data-action="revise">Modifica i dati inseriti</button></div>'+
    '<section class="panel"><h3>Dettaglio delle misure</h3><div class="measurement-detail-grid">'+measured+'</div>'+precision+
    '<p class="note">L’età non modifica le formule. Le percentuali non sono misure cliniche; anche con tre letture resta un margine d’errore del metodo.</p></section>'+
    bmiPanel(e,c)+'<p class="note">La massa magra comprende anche acqua, ossa e organi. Il BMI non distingue muscoli e grasso: i range di peso non sono prescrizioni individuali.</p>');
}
function guide(){
  shell('<div class="small">GUIDA VISIVA</div><h1>Dove prendere le misure</h1><p class="muted">Usa un metro morbido e tienilo parallelo al pavimento, aderente ma senza comprimere la pelle.</p>'+
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
  shell('<h1>Archivio</h1><p class="muted">'+a.length+' misurazion'+(a.length===1?'e':'i')+' archiviate</p>'+
    '<div class="row"><button class="secondary" data-action="export">Esporta JSON</button><button class="secondary" data-action="import">Importa backup</button></div><input hidden id="import-file" type="file" accept="application/json">'+
    '<section class="panel">'+(a.length?a.map(e=>{
      const c=calc(e),sex=e.sex||state.profile.sex;
      return '<div class="entry"><div class="entryhead"><strong>'+h(e.date)+'</strong><span class="pill">'+fmt(num(e.weight))+' kg</span></div>'+
        '<p class="help">BMI '+fmt(c.bmi,2)+' · Grasso '+fmt(c.fat)+'% · Massa magra '+fmt(c.lean)+' kg</p>'+
        '<p class="entry-meta">'+(sex==='female'?'Donna':'Uomo')+' · '+(e.mode==='accurate'?'3 misure / media':'Standard')+
        (Number.isFinite(num(e.age))&&num(e.age)>0?' · '+fmt(num(e.age),0)+' anni':'')+'</p>'+
        '<div class="actions"><button class="secondary" data-edit="'+h(e.id)+'">Modifica</button><button class="danger" data-delete="'+h(e.id)+'">Elimina</button></div></div>';
    }).join(''):'<div class="empty">Nessuna misurazione archiviata.</div>')+
    '</section><button class="primary" data-action="new">＋ Nuova misurazione</button>');
}
function graph(data,key){if(data.length<2)return '<div class="empty">Servono almeno due misurazioni per visualizzare il grafico.</div>';const w=320,H=150,p=20,vals=data.map(x=>x[key]),lo=Math.min(...vals),hi=Math.max(...vals),pad=Math.max((hi-lo)*.18,key==='fat'?1:.5),min=lo-pad,max=hi+pad;const pts=data.map((x,i)=>[p+i*(w-2*p)/(data.length-1),H-p-(x[key]-min)/(max-min)*(H-2*p)]);return '<svg class="chart" viewBox="0 0 320 175" role="img" aria-label="Grafico storico '+h(key)+'"><path d="M20 20 V130 H300" fill="none" stroke="#e6d0d9" stroke-width="1"/><polyline points="'+pts.map(p=>p.join(',')).join(' ')+'" fill="none" stroke="#b3456e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'+pts.map(p=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3.5" fill="#b3456e"/>').join('')+'<text x="20" y="166" fill="#786572" font-size="12">'+h(data[0].date)+'</text><text x="300" y="166" text-anchor="end" fill="#786572" font-size="12">'+h(data[data.length-1].date)+'</text></svg>'}
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
  shell('<h1>Statistiche</h1><p class="muted">Segui nel tempo le misurazioni che hai scelto di archiviare.</p>'+
    '<div class="filters">'+filters.map(x=>'<button class="'+(period===x[0]?'selected':'')+'" data-period="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>'+
    '<label>Parametro<select id="metric">'+options.map(x=>'<option value="'+x[0]+'" '+(metric===x[0]?'selected':'')+'>'+x[1]+'</option>').join('')+'</select></label>'+
    '<section class="panel"><h3>Andamento</h3>'+graph(valid,metric)+'</section>'+
    (valid.length>1?'<div class="panel row"><span class="muted">Variazione nel periodo</span><strong>'+fmt(valid[valid.length-1][metric]-valid[0][metric],metric==='ratio'?3:2)+'</strong></div>':'')+
    '<p class="note">Le misurazioni storiche precedenti alla v1.4 possono non avere vita distinta dall’addome. In quel caso il grafico della vita non mostra quei dati, per evitare confronti non omogenei.</p>');
}
function render(){if(tab==='home')home();else if(tab==='archive')archive();else if(tab==='stats')stats();else guide()}
function captureDraft(){
  const form=document.getElementById('measurement');
  if(!form)return;
  const f=new FormData(form);
  draft={date:f.get('date'),sex:f.get('sex'),height:f.get('height'),weight:f.get('weight'),waist:f.get('waist'),neck:f.get('neck'),hip:f.get('hip')};
}
function resetCurrent(message){
  pending=null;draft=null;editing=null;tab='home';notice=message||'';
  render();scrollTo(0,0);
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-tab],[data-edit],[data-delete],[data-period],[data-action]');
  if(!b)return;
  if(b.dataset.tab){
    if(tab==='home')captureDraft();
    tab=b.dataset.tab;render();scrollTo(0,0);
  }else if(b.dataset.edit){
    pending=null;draft=null;editing=b.dataset.edit;tab='home';render();scrollTo(0,0);
  }else if(b.dataset.delete){
    if(confirm('Eliminare definitivamente questa misurazione?')){
      state.entries=state.entries.filter(x=>String(x.id)!==b.dataset.delete);
      save();render();
    }
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
    state.profile={...state.profile,height:entry.height,sex:entry.sex};
    save();resetCurrent(editing?'Misurazione aggiornata nell’archivio.':'Misurazione archiviata con successo.');
  }else if(b.dataset.action==='export'){
    const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='bodytrack-backup-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }else if(b.dataset.action==='import'){
    document.getElementById('import-file')?.click();
  }
});
document.addEventListener('change',e=>{
  if(e.target.id==='metric'){metric=e.target.value;render();
  }else if(e.target.name==='sex'&&e.target.form?.id==='measurement'){
    const female=e.target.value==='female',hip=document.getElementById('hip-field');
    hip.hidden=!female;hip.querySelector('input').required=female;
    document.getElementById('waist-label-text').textContent=female?'Circonferenza vita (cm)':'Circonferenza addome (cm)';
    document.getElementById('measure-help').textContent=female?'Per la formula femminile misura la vita nel punto più stretto, i fianchi nel punto più ampio e il collo appena sotto la laringe.':'Per la formula maschile misura l’addome all’ombelico, rilassato, e il collo appena sotto la laringe.';
  }else if(e.target.id==='import-file'){
    const file=e.target.files[0];if(!file)return;
    file.text().then(t=>{
      const v=JSON.parse(t);
      if(!Array.isArray(v.entries)||!confirm('Sostituire tutti i dati archiviati con questo backup?'))return;
      state={profile:v.profile||{},entries:v.entries};
      save();pending=null;draft=null;editing=null;tab='archive';render();
    }).catch(()=>alert('Backup non valido'));
  }
});
document.addEventListener('submit',e=>{
  if(e.target.id!=='measurement')return;
  e.preventDefault();
  const f=new FormData(e.target);
  const sex=f.get('sex'),height=num(f.get('height')),weight=num(f.get('weight')),waist=num(f.get('waist')),neck=num(f.get('neck'));
  const hip=sex==='female'?num(f.get('hip')):0;
  const old=state.entries.find(z=>z.id===editing);
  const x={id:editing||('m'+Date.now()),created:old?.created||Date.now(),date:f.get('date'),sex,height,weight,waist,neck,hip};
  if(!/^\d{4}-\d{2}-\d{2}$/.test(x.date)||!['male','female'].includes(sex)||!(height>=100&&height<=250)||!(weight>=10&&weight<=500)||!(waist>=20&&waist<=250)||!(neck>=15&&neck<=100)||sex==='male'&&waist<=neck||sex==='female'&&(!(hip>=20&&hip<=250)||waist+hip<=neck)){
    alert('Controlla i dati e le circonferenze inserite.');return;
  }
  const c=calc(x);
  if(!Number.isFinite(c.fat)||c.fat<2||c.fat>70){alert('Le misure producono una stima non plausibile: ricontrolla i valori.');return}
  draft=null;pending=x;tab='home';render();scrollTo(0,0);
});
render();
})();