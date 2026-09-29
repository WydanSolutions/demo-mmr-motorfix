/*
 * Menú de secciones. Al tocar una pestaña se dibuja esa sección (renderView).
 */
const NAV=[
  {id:'panel',       ico:'▦', label:'Panel'},
  {id:'presup',      ico:'📝', label:'Presupuestos'},
  {id:'reparaciones',ico:'🔧', label:'Reparaciones', badge:true},
  {id:'clientes',    ico:'👥', label:'Clientes'},
  {id:'camiones',    ico:'🚚', label:'Camiones'},
  {id:'finanzas',    ico:'💲', label:'Finanzas'},
  {id:'kpis',        ico:'📊', label:'KPIs / Cierre'},
  {id:'config',      ico:'⚙', label:'Configuración'},
];
let CUR='panel';

function buildNav(){
  $('#nav').innerHTML=NAV.map(n=>'<button class="nav-btn'+(n.id===CUR?' active':'')+'" data-v="'+n.id+'" onclick="switchView(\''+n.id+'\')">'
    +'<span class="ic">'+n.ico+'</span><span class="tx">'+n.label+'</span>'
    +(n.badge?'<span class="badge" id="badge-'+n.id+'" style="display:none"></span>':'')+'</button>').join('');
}
function switchView(id){
  CUR=id;
  $$('.view').forEach(v=>v.classList.remove('active'));
  $('#view-'+id).classList.add('active');
  $$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.v===id));
  window.scrollTo({top:0,behavior:'smooth'});
  renderView(id);
}
function renderView(id){
  const foco=recordarFoco();          // para que no se corte lo que se está escribiendo
  syncListas();
  ({panel:renderPanel, presup:renderPresup, reparaciones:renderRep, clientes:renderClientes,
    camiones:renderCamiones, finanzas:renderFinanzas, kpis:renderKpis,
    config:renderConfig}[id]||function(){})();
  actualizarBadges();
  if(typeof actualizarCampana==='function') actualizarCampana();
  devolverFoco(foco);
}
/* Al redibujar una sección se rearma el HTML y el cursor se pierde: esto lo devuelve
   al mismo casillero, en la misma letra. Sin esto, los buscadores se cortaban al tipear. */
function recordarFoco(){
  const e=document.activeElement;
  if(!e||!/^(INPUT|TEXTAREA)$/.test(e.tagName))return null;
  const cont=e.closest('.view'); if(!cont)return null;
  const campos=Array.from(cont.querySelectorAll('input,textarea'));
  return {vista:cont.id, pos:campos.indexOf(e), sel:e.selectionStart, sel2:e.selectionEnd};
}
function devolverFoco(f){
  if(!f||f.pos<0)return;
  const cont=document.getElementById(f.vista); if(!cont)return;
  const campo=cont.querySelectorAll('input,textarea')[f.pos]; if(!campo)return;
  campo.focus();
  try{ campo.setSelectionRange(f.sel,f.sel2); }catch(e){}
}
/* Cantidad de camiones en el taller (todo lo que no está entregado) */
function enTaller(){ return Store.all('ordenes').filter(o=>o.etapa!=='entregada'); }
/* Del Panel al tablero, ya filtrado por esa etapa (lo usa la tira de estados). */
function irAEtapa(id){ repEtapa=id; repVista='kanban'; repSel=null; switchView('reparaciones'); }
function actualizarBadges(){
  const b=$('#badge-reparaciones'); if(!b)return;
  const n=enTaller().length;
  if(n>0){ b.textContent=n; b.style.display=''; } else b.style.display='none';
}
