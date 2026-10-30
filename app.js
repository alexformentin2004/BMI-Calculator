(() => {'use strict';
const KEY='bodytrack_v1'; const today=()=>new Date().toLocaleDateString('sv-SE'); let state=load(); let tab='home'; let editing=null; let pending=null; let draft=null; let notice=''; let metric='fat'; let period='all';
function load(){try{const p=JSON.parse(localStorage.getItem(KEY));if(p&&Array.isArray(p.entries))return {profile:p.profile||{},entries:p.entries}}catch(e){}return {profile:{},entries:[]}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function h(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function num(x){return Number(String(x??'').replace(',','.'))}
function fmt(x,d=1){return Number.isFinite(x)?x.toLocaleString('it-IT',{minimumFractionDigits:d,maximumFractionDigits:d}):'—'}
function calc(e){const sex=e.sex||state.profile.sex;const weight=num(e.weight),height=num(e.height??state.profile.height),waist=num(e.waist),neck=num(e.neck),hip=num(e.hip);const bmi=weight/(height/100)**2;let fat=NaN;if(height>0&&neck>0){const inch=1/2.54,H=height*inch;if(sex==='male'&&waist>neck){fat=86.010*Math.log10((waist-neck)*inch)-70.041*Math.log10(H)+36.76}else if(sex==='female'&&waist+hip>neck&&hip>0){fat=163.205*Math.log10((waist+hip-neck)*inch)-97.684*Math.log10(H)-104.912}}return {bmi,fat,lean:weight*(1-fat/100),fatKg:weight*fat/100,ratio:waist/height}}
function bmiLabel(b){return b<18.5?'Sottopeso':b<25?'Normopeso':b<30?'Sovrappeso':'Obesità'}
function ordered(){return [...state.entries].sort((a,b)=>b.date.localeCompare(a.date)||b.created-a.created)}
function el(){return document.getElementById('app')}
function nav(){return '<nav class="bottom"><button data-tab="home" class="'+(tab==='home'?'active':'')+'"><b>⌂</b>Home</button><button data-tab="stats" class="'+(tab==='stats'?'active':'')+'"><b>▥</b>Statistiche</button><button data-tab="archive" class="'+(tab==='archive'?'active':'')+'"><b>▤</b>Archivio</button></nav>'}
function shell(inner){el().innerHTML='<header class="top"><div class="brand"><span class="logo">♡</span>BodyTrack <span class="app-version">v1.3</span></div><button class="gear" data-tab="guide" aria-label="Guida alle misure" title="Guida alle misure">ⓘ</button></header>'+inner+nav()}
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
function measure(){
  const last=ordered()[0]||state.profile||{};
  const saved=state.entries.find(e=>e.id===editing)||{};
  const x=draft|| (editing?saved:{});
  const sex=x.sex||last.sex||'';
  const height=x.height??last.height??'';
  const female=sex==='female';
  const title=editing?'Modifica misurazione':'Nuova misurazione';
  const msg=editing?'Modifica i dati: l’archivio verrà aggiornato solo dopo la tua conferma.':'Inserisci i dati, visualizza il risultato e scegli se archiviarlo.';
  const flash=notice?'<div class="flash" role="status">'+h(notice)+'</div>':'';
  notice='';
  shell(flash+'<div class="small">IL TUO CORPO IN NUMERI</div><h1>'+title+'</h1><p class="muted">'+msg+'</p>'+
    '<form id="measurement"><section class="panel"><h3>Informazioni per il calcolo</h3><div class="two">'+
    '<label>Altezza (cm)<input name="height" type="number" step=".1" min="100" max="250" inputmode="decimal" required placeholder="180" value="'+h(height)+'"></label>'+
    '<label>Sesso per la formula<select name="sex" required><option value="" '+(!sex?'selected':'')+'>Seleziona</option><option value="male" '+(sex==='male'?'selected':'')+'>Uomo</option><option value="female" '+(sex==='female'?'selected':'')+'>Donna</option></select></label></div></section>'+
    '<section class="panel"><h3>Le tue misure</h3><label>Data<input name="date" type="date" required value="'+h(x.date||today())+'"></label>'+
    '<label>Peso (kg)<input name="weight" type="number" step=".1" min="10" max="500" inputmode="decimal" required placeholder="85,5" value="'+h(x.weight??'')+'"></label>'+
    '<div class="two"><label><span id="waist-label-text">'+(female?'Circonferenza vita (cm)':'Circonferenza addome (cm)')+'</span><input name="waist" type="number" step=".1" min="20" max="250" inputmode="decimal" required placeholder="'+(female?'75':'93')+'" value="'+h(x.waist??'')+'"></label>'+
    '<label>Collo (cm)<input name="neck" type="number" step=".1" min="15" max="100" inputmode="decimal" required placeholder="42" value="'+h(x.neck??'')+'"></label></div>'+
    '<label id="hip-field" '+(!female?'hidden':'')+'>Fianchi (cm)<input name="hip" type="number" step=".1" min="20" max="250" inputmode="decimal" '+(female?'required':'')+' placeholder="95" value="'+h(x.hip??'')+'"></label>'+
    '<p class="help" id="measure-help">'+(female?'Per la formula femminile misura la vita nel punto più stretto, i fianchi nel punto più ampio e il collo appena sotto la laringe.':'Per la formula maschile misura l’addome all’ombelico, rilassato, e il collo appena sotto la laringe.')+'</p>'+
    '<details class="guide-details"><summary>📏 Dove devo posizionare il metro?</summary><img src="guida-misure.svg" alt="Quattro illustrazioni: collo sotto la laringe, addome all’ombelico, vita nel punto più stretto, fianchi nel punto più ampio" loading="lazy"><p class="help">Mantieni il metro orizzontale, aderente senza stringere. <button class="text-link" type="button" data-tab="guide">Apri la guida completa</button></p></details></section>'+
    '<button type="submit" class="primary">Calcola i risultati</button></form>');
}
function result(){
  const e=pending,c=calc(e),v=Number.isFinite(c.fat)&&c.fat>=0&&c.fat<=70;
  const card=(title,value,sub)=>'<div class="card"><div class="small">'+title+'</div><div class="value">'+value+'</div><div class="caption">'+sub+'</div></div>';
  shell('<div class="small">MISURAZIONE ATTUALE · NON ANCORA ARCHIVIATA</div><h1>Il tuo risultato</h1><p class="muted">'+h(e.date)+' · '+(e.sex==='female'?'Donna':'Uomo')+' · '+fmt(num(e.height),0)+' cm</p>'+
    '<div class="weight">'+fmt(num(e.weight))+' kg</div>'+
    '<div class="grid">'+card('BMI',fmt(c.bmi,2),bmiLabel(c.bmi))+card('Massa grassa',v?fmt(c.fat)+'%':'—',v?fmt(c.fatKg)+' kg stimati':'Stima non disponibile')+
    card('Massa magra',v?fmt(c.lean)+' kg':'—','Massa non grassa stimata')+card('Vita / altezza',fmt(c.ratio,3),'Rapporto')+'</div>'+
    '<section class="panel"><h3>Composizione corporea</h3>'+(v?'<div class="bar"><span class="lean" style="width:'+(100-c.fat)+'%"></span><span class="fat" style="width:'+c.fat+'%"></span></div><div class="legend"><span>'+fmt(100-c.fat)+'% massa magra</span><span>'+fmt(c.fat)+'% grassa</span></div>':'<p class="help">Stima non disponibile.</p>')+'</section>'+
    '<div class="decision-panel"><h3>Vuoi conservare questa misurazione?</h3><p class="help">Solo scegliendo Archivia comparirà nello storico e nelle statistiche.</p><div class="decision-actions">'+
    '<button type="button" class="secondary" data-action="discard">'+(editing?'Annulla modifiche':'Non archiviare')+'</button>'+
    '<button type="button" class="primary" data-action="archive">'+(editing?'Aggiorna archivio':'Archivia')+'</button></div>'+
    '<button type="button" class="text-link revise" data-action="revise">Modifica i dati inseriti</button></div>'+
    bmiPanel(e,c)+'<p class="note">Massa grassa e massa magra sono stime antropometriche, non misurazioni cliniche. La massa magra comprende anche acqua, ossa e organi.</p>');
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
    '<section class="panel">'+(a.length?a.map(e=>{const c=calc(e);return '<div class="entry"><div class="entryhead"><strong>'+h(e.date)+'</strong><span class="pill">'+fmt(num(e.weight))+' kg</span></div>'+
    '<p class="help">BMI '+fmt(c.bmi,2)+' · Grasso '+fmt(c.fat)+'% · Massa magra '+fmt(c.lean)+' kg</p>'+
    '<div class="actions"><button class="secondary" data-edit="'+h(e.id)+'">Modifica</button><button class="danger" data-delete="'+h(e.id)+'">Elimina</button></div></div>'}).join(''):'<div class="empty">Nessuna misurazione archiviata.</div>')+
    '</section><button class="primary" data-action="new">＋ Nuova misurazione</button>');
}
function graph(data,key){if(data.length<2)return '<div class="empty">Servono almeno due misurazioni per visualizzare il grafico.</div>';const w=320,H=150,p=20,vals=data.map(x=>x[key]),lo=Math.min(...vals),hi=Math.max(...vals),pad=Math.max((hi-lo)*.18,key==='fat'?1:.5),min=lo-pad,max=hi+pad;const pts=data.map((x,i)=>[p+i*(w-2*p)/(data.length-1),H-p-(x[key]-min)/(max-min)*(H-2*p)]);return '<svg class="chart" viewBox="0 0 320 175" role="img" aria-label="Grafico storico '+h(key)+'"><path d="M20 20 V130 H300" fill="none" stroke="#e6d0d9" stroke-width="1"/><polyline points="'+pts.map(p=>p.join(',')).join(' ')+'" fill="none" stroke="#b3456e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'+pts.map(p=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3.5" fill="#b3456e"/>').join('')+'<text x="20" y="166" fill="#786572" font-size="12">'+h(data[0].date)+'</text><text x="300" y="166" text-anchor="end" fill="#786572" font-size="12">'+h(data[data.length-1].date)+'</text></svg>'}
function stats(){const now=new Date(),months={m1:30,m3:90,m6:180,y1:365,all:Infinity};const data=ordered().filter(e=>{const days=(now-new Date(e.date+'T12:00:00'))/86400000;return days<=months[period]&&days>=-1}).reverse().map(e=>({...e,...calc(e),weight:num(e.weight)}));const valid=data.filter(x=>Number.isFinite(x[metric])&&(metric!=='fat'||x.fat>=0&&x.fat<=70));const filters=[['m1','30g'],['m3','3 mesi'],['m6','6 mesi'],['y1','1 anno'],['all','Tutto']];shell('<h1>Statistiche</h1><p class="muted">Segui nel tempo il tuo percorso.</p><div class="filters">'+filters.map(x=>'<button class="'+(period===x[0]?'selected':'')+'" data-period="'+x[0]+'">'+x[1]+'</button>').join('')+'</div><label>Parametro<select id="metric"><option value="weight" '+(metric==='weight'?'selected':'')+'>Peso (kg)</option><option value="bmi" '+(metric==='bmi'?'selected':'')+'>BMI</option><option value="fat" '+(metric==='fat'?'selected':'')+'>Massa grassa (%)</option><option value="lean" '+(metric==='lean'?'selected':'')+'>Massa magra (kg)</option><option value="waist" '+(metric==='waist'?'selected':'')+'>Vita / addome (cm)</option></select></label><section class="panel"><h3>Andamento</h3>'+graph(valid,metric)+'</section>'+(valid.length>1?'<div class="panel row"><span class="muted">Variazione nel periodo</span><strong>'+fmt(valid[valid.length-1][metric]-valid[0][metric],2)+'</strong></div>':'')+'<p class="note">Le stime dipendono anche dalla precisione e dalla coerenza delle misurazioni.</p>')}
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