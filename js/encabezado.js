/*
 * ENCABEZADO de la página (lo de arriba, fijo): fecha, buscador general,
 * campanita de avisos y el botón de nueva orden.
 *
 * Los AVISOS están todos definidos en TIPOS_AVISO (más abajo):
 *   · cada tipo se prende o se apaga desde Configuración → Avisos (cfg.avisos)
 *   · cada aviso se puede marcar como leído (cfg.avisosLeidos, por registro)
 *   · la campanita cuenta SOLO lo que no se leyó todavía
 * Para agregar un aviso nuevo alcanza con sumarlo a TIPOS_AVISO: aparece solo
 * en la campanita y en Configuración.
 */

/* ---------- Dibujo ---------- */
function pintarEncabezado(){
  const e=$('#enc'); if(!e) return;
  e.innerHTML=
     '<div class="enc-txt"><div class="enc-fecha">'+esc(saludoHora())+' · '+esc(fLargaHoy())+'</div></div>'
    +'<div class="enc-herr">'
      +'<div class="buscador">'
        +'<span aria-hidden="true">🔍</span>'
        +'<input id="busq" type="search" placeholder="Buscar matrícula, cliente u orden…" autocomplete="off"'
        +' oninput="buscarTodo(this.value)" onfocus="buscarTodo(this.value)" aria-label="Buscar en todo el taller">'
        +'<div class="busq-res hidden" id="busq-res"></div>'
      +'</div>'
      +'<button class="campana" onclick="verAvisos(event)" aria-label="Avisos">🔔<i id="campana-n" class="hidden">0</i></button>'
      +'<button class="btn btn-rojo" onclick="openForm(\'orden\')">+ Nueva orden</button>'
    +'</div>';
  actualizarCampana();
}
function saludoHora(){ const h=new Date().getHours(); return h<12?'Buen día':(h<20?'Buenas tardes':'Buenas noches'); }
function fLargaHoy(){
  const d=new Date(), dias=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  return dias[d.getDay()]+' '+d.getDate()+' de '+MESES_L[d.getMonth()].toLowerCase();
}

/* ---------- Buscador general ---------- */
function buscarTodo(q){
  const caja=$('#busq-res'); if(!caja) return;
  q=(q||'').trim().toLowerCase();
  if(q.length<2){ caja.classList.add('hidden'); return; }
  const norm=s=>(s||'').toLowerCase();
  const res=[];
  Store.all('camiones').filter(c=>normMat(c.matricula).includes(normMat(q))||norm(c.marca+' '+c.modelo).includes(q))
    .slice(0,5).forEach(c=>res.push({ico:'🚚',t:(c.matricula||'').toUpperCase(),s:c.marca+' '+c.modelo+' · '+cliNom(c.clienteId),a:"verCamion('"+c.id+"')"}));
  Store.all('clientes').filter(c=>norm(c.nombre).includes(q)||norm(c.rut).includes(q)||norm(c.tel).includes(q))
    .slice(0,5).forEach(c=>res.push({ico:'👤',t:c.nombre,s:(c.tipo||'Cliente')+(c.ciudad?' · '+c.ciudad:''),a:"verCliente('"+c.id+"')"}));
  Store.all('ordenes').filter(o=>String(o.nro).includes(q)||normMat(o.matricula).includes(normMat(q)))
    .slice(0,5).forEach(o=>res.push({ico:'🔧',t:'Orden N° '+o.nro,s:(o.matricula||'').toUpperCase()+' · '+etapaN(o.etapa),a:"verOrden('"+o.id+"')"}));

  caja.innerHTML = res.length
    ? res.map(r=>'<button onclick="cerrarBusq();'+r.a+'"><span class="bico">'+r.ico+'</span>'
        +'<span><b>'+esc(r.t)+'</b><small>'+esc(r.s)+'</small></span></button>').join('')
    : '<div class="busq-nada">No se encontró nada con «'+esc(q)+'».</div>';
  caja.classList.remove('hidden');
}
function cerrarBusq(){ const c=$('#busq-res'); if(c) c.classList.add('hidden'); const i=$('#busq'); if(i) i.value=''; }
document.addEventListener('click',e=>{ if(!e.target.closest('.buscador')) cerrarBusq(); });


/* ======================================================================
   AVISOS
   ====================================================================== */

/* Qué viene prendido de fábrica y con cuántos días de anticipación */
const AVISOS_DEF={
  cobrosVencidos:true, cobrosPorVencer:true,
  gastosVencidos:true, gastosPorVencer:true,
  presupuestosEsperando:true, presupuestosVencidos:true,
  ordenesAtrasadas:true, entregasSinCobrar:true
};
const AVISOS_DIAS_DEF={cobros:7, gastos:7, taller:15};

/* Fecha de hoy + n días, en formato aaaa-mm-dd */
function enDias(n){ const d=new Date(); d.setDate(d.getDate()+n); return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate()); }
function diasEnTaller(o){
  if(!o.fecha) return 0;
  return Math.floor((Date.now()-new Date(o.fecha+'T00:00:00').getTime())/86400000);
}
/* «Juan, Pedro y 3 más» */
function listaCorta(nombres){
  const u=nombres.filter((v,i,a)=>v&&a.indexOf(v)===i);
  if(u.length<=3) return u.join(' · ');
  return u.slice(0,3).join(' · ')+' y '+(u.length-3)+' más';
}

/* ---------- Los tipos de aviso ---------- */
const TIPOS_AVISO=[
  {id:'cobrosVencidos', nom:'Cobros vencidos', ico:'⚠', t:'rojo', ir:"switchView('finanzas')",
   ayuda:'Trabajos entregados que el cliente todavía no pagó y a los que ya se les pasó la fecha.',
   items(){ return Store.all('movimientos').filter(m=>m.tipo==='cobro'&&estadoMov(m)==='Vencido'); },
   txt(it){ return it.length+' cobro(s) vencido(s) por '+fPesos(it.reduce((s,m)=>s+aPesos(m),0)); },
   sub(it){ return listaCorta(it.map(m=>cliNom(m.clienteId))); }},

  {id:'cobrosPorVencer', nom:'Cobros por vencer', ico:'⏳', t:'ama', ir:"switchView('finanzas')",
   ayuda:'Cobros pendientes que vencen en los próximos días.', dias:'cobros',
   items(){ const h=hoyISO(), l=enDias(avisoDias('cobros'));
     return Store.all('movimientos').filter(m=>m.tipo==='cobro'&&m.estado!=='cobrado'&&m.vence&&m.vence>=h&&m.vence<=l); },
   txt(it){ return it.length+' cobro(s) vencen en los próximos '+avisoDias('cobros')+' días · '+fPesos(it.reduce((s,m)=>s+aPesos(m),0)); },
   sub(it){ return listaCorta(it.map(m=>cliNom(m.clienteId)+' ('+fDate(m.vence)+')')); }},

  {id:'gastosVencidos', nom:'Pagos vencidos', ico:'💸', t:'rojo', ir:"switchView('finanzas')",
   ayuda:'Gastos del taller que había que pagar y quedaron sin pagar.',
   items(){ return Store.all('movimientos').filter(m=>m.tipo==='gasto'&&estadoMov(m)==='Vencido'); },
   txt(it){ return it.length+' pago(s) vencido(s) por '+fPesos(it.reduce((s,m)=>s+aPesos(m),0)); },
   sub(it){ return listaCorta(it.map(m=>m.concepto)); }},

  {id:'gastosPorVencer', nom:'Pagos por vencer', ico:'📆', t:'ama', ir:"switchView('finanzas')",
   ayuda:'Gastos del taller que hay que pagar en los próximos días.', dias:'gastos',
   items(){ const h=hoyISO(), l=enDias(avisoDias('gastos'));
     return Store.all('movimientos').filter(m=>m.tipo==='gasto'&&m.estado!=='pagado'&&m.vence&&m.vence>=h&&m.vence<=l); },
   txt(it){ return it.length+' pago(s) vencen en los próximos '+avisoDias('gastos')+' días · '+fPesos(it.reduce((s,m)=>s+aPesos(m),0)); },
   sub(it){ return listaCorta(it.map(m=>m.concepto+' ('+fDate(m.vence)+')')); }},

  {id:'presupuestosEsperando', nom:'Presupuestos sin respuesta', ico:'📝', t:'ama', ir:"switchView('presup')",
   ayuda:'Presupuestos que se mandaron y el cliente todavía no contestó.',
   items(){ return Store.all('presupuestos').filter(p=>p.estado==='Enviado'); },
   txt(it){ return it.length+' presupuesto(s) esperando respuesta'; },
   sub(){ return 'Cuando el cliente aprueba, la orden se crea sola'; }},

  {id:'presupuestosVencidos', nom:'Presupuestos vencidos', ico:'⌛', t:'ama', ir:"switchView('presup')",
   ayuda:'Presupuestos enviados a los que se les pasó la validez: los precios ya no sirven.',
   items(){ const h=hoyISO();
     return Store.all('presupuestos').filter(p=>p.estado==='Enviado'&&presVence(p)&&presVence(p)<h); },
   txt(it){ return it.length+' presupuesto(s) con la validez vencida'; },
   sub(it){ return listaCorta(it.map(p=>(p.matricula||'').toUpperCase())); }},

  {id:'ordenesAtrasadas', nom:'Camiones demorados', ico:'🕐', t:'rojo', ir:"switchView('reparaciones')",
   ayuda:'Camiones que hace muchos días están en el taller sin entregarse.', dias:'taller',
   items(){ return enTaller().filter(o=>diasEnTaller(o)>avisoDias('taller')); },
   txt(it){ return it.length+' camión(es) hace más de '+avisoDias('taller')+' días en el taller'; },
   sub(it){ return listaCorta(it.map(o=>(o.matricula||'').toUpperCase()+' ('+diasEnTaller(o)+' días)')); }},

  {id:'entregasSinCobrar', nom:'Entregados sin cobrar', ico:'📄', t:'ama', ir:"switchView('finanzas')",
   ayuda:'Camiones entregados en el último mes que todavía no tienen el cobro cargado.',
   items(){ const con=Store.all('movimientos').filter(m=>m.tipo==='cobro'&&m.ordenId).map(m=>m.ordenId), desde=enDias(-30);
     return Store.all('ordenes').filter(o=>o.etapa==='entregada'&&con.indexOf(o.id)<0
       &&(o.fechaEntrega||o.fecha||'')>=desde); },
   txt(it){ return it.length+' trabajo(s) entregado(s) sin el cobro cargado'; },
   sub(it){ return listaCorta(it.map(o=>'O.R. '+o.nro+' · '+(o.matricula||'').toUpperCase())); }}
];
function tipoAviso(id){ return TIPOS_AVISO.filter(t=>t.id===id)[0]; }

/* ---------- Configuración de los avisos (se lee sin tocar nada) ---------- */
function avisoOn(id){ const a=Store.cfg().avisos||{}; return typeof a[id]==='boolean'?a[id]:AVISOS_DEF[id]!==false; }
function avisoDias(k){ const d=Store.cfg().avisosDias||{}; return +d[k]>0?+d[k]:AVISOS_DIAS_DEF[k]; }
function avisoLeidos(id){ return (Store.cfg().avisosLeidos||{})[id]||[]; }

function avisoSet(id,si){
  const c=Store.cfg(); c.avisos=c.avisos||{}; c.avisos[id]=!!si;
  Store.guardarCfg(); actualizarCampana(); renderConfig();
}
function avisoDiasSet(k,v){
  const c=Store.cfg(); c.avisosDias=c.avisosDias||{}; c.avisosDias[k]=Math.max(1,+v||AVISOS_DIAS_DEF[k]);
  Store.guardarCfg(); actualizarCampana(); renderConfig();
}

/* ---------- Marcar como leído ----------
   Se guardan los registros concretos que se leyeron, no el tipo de aviso.
   Así, si mañana aparece OTRO cobro vencido, el aviso vuelve a salir solo. */
function avisoLeer(id){
  const t=tipoAviso(id); if(!t) return;
  const c=Store.cfg(); c.avisosLeidos=c.avisosLeidos||{};
  c.avisosLeidos[id]=t.items().map(x=>x.id);   // solo los de ahora: los viejos se limpian solos
  Store.guardarCfg(); refrescarAvisos();
  toast('Marcado como leído');
}
function avisoDesleer(id){
  const c=Store.cfg(); if(c.avisosLeidos) delete c.avisosLeidos[id];
  Store.guardarCfg(); refrescarAvisos();
}
function avisoLeerTodo(){
  const c=Store.cfg(); c.avisosLeidos=c.avisosLeidos||{};
  TIPOS_AVISO.forEach(t=>{ if(avisoOn(t.id)) c.avisosLeidos[t.id]=t.items().map(x=>x.id); });
  Store.guardarCfg(); refrescarAvisos();
  toast('Todo marcado como leído');
}
function avisoDesleerTodo(){
  Store.cfg().avisosLeidos={};
  Store.guardarCfg(); refrescarAvisos();
  if(CUR==='config') renderConfig();
  toast('Los avisos vuelven a mostrarse');
}

/* Después de leer o de volver a mostrar: la campanita, la ventana si está abierta y el Panel */
function refrescarAvisos(){
  actualizarCampana();
  if($('#modal-bg').classList.contains('open')) verAvisos();
  if(CUR==='panel') renderView('panel');
}

/* ---------- Qué hay para mostrar ----------
   Devuelve { pend: [avisos sin leer], leidos: [tipos ya leídos que siguen vigentes] } */
function avisosDelDia(){
  const pend=[], leidos=[];
  TIPOS_AVISO.forEach(t=>{
    if(!avisoOn(t.id)) return;
    const todos=t.items(); if(!todos.length) return;
    const ya=avisoLeidos(t.id);
    const nuevos=todos.filter(x=>ya.indexOf(x.id)<0);
    if(nuevos.length) pend.push({id:t.id, ico:t.ico, t:t.t, a:t.ir, txt:t.txt(nuevos), sub:t.sub(nuevos)});
    else leidos.push({id:t.id, nom:t.nom, n:todos.length});
  });
  return {pend:pend, leidos:leidos};
}

function actualizarCampana(){
  const n=$('#campana-n'); if(!n) return;
  const c=avisosDelDia().pend.length;
  n.textContent=c; n.classList.toggle('hidden',!c);
}

function verAvisos(ev){
  if(ev) ev.stopPropagation();
  const av=avisosDelDia();
  let h='';
  if(av.pend.length){
    h+='<div class="av-barra"><span>'+av.pend.length+' aviso(s) sin leer</span>'
      +'<button class="btn btn-sm" onclick="avisoLeerTodo()">✓ Marcar todo como leído</button></div>'
      +'<div class="avisos-lista">'+av.pend.map(a=>
        '<div class="aviso '+a.t+'">'
        +'<span class="av-ico">'+a.ico+'</span>'
        +'<span class="av-txt" onclick="closeModal();'+a.a+'"><b>'+esc(a.txt)+'</b><small>'+esc(a.sub)+'</small></span>'
        +'<button class="av-ok" onclick="avisoLeer(\''+a.id+'\')" title="Marcar como leído">✓</button>'
        +'</div>').join('')+'</div>';
  }else{
    h+='<div class="empty"><div class="e-ico">✓</div><p>Todo al día. No hay avisos sin leer.</p></div>';
  }
  if(av.leidos.length){
    h+='<div class="av-leidos"><div class="av-leidos-t">Ya leídos</div>'
      +av.leidos.map(l=>'<div class="av-leido"><span>'+esc(l.nom)+' <i>('+l.n+')</i></span>'
        +'<button class="btn btn-sm" onclick="avisoDesleer(\''+l.id+'\')">Volver a mostrar</button></div>').join('')
      +'</div>';
  }
  h+='<div class="av-pie">Elegí qué avisos querés recibir en <b>Configuración → Avisos</b>.</div>';
  abrirModalSimple('Avisos', h);
}

/* ---------- La tarjeta que se dibuja en Configuración ---------- */
function tarjetaAvisos(){
  const leidos=Object.keys(Store.cfg().avisosLeidos||{}).length;
  return '<div class="card"><div class="card-head"><h3>Avisos</h3>'
    +'<span class="csub">Qué te avisa la campanita de arriba</span></div><div class="card-body">'
    +TIPOS_AVISO.map(t=>
      '<div class="srow"><div><div class="st">'+t.ico+' '+esc(t.nom)+'</div><div class="ss">'+esc(t.ayuda)+'</div></div>'
      +'<label class="switch"><input type="checkbox"'+(avisoOn(t.id)?' checked':'')
      +' onchange="avisoSet(\''+t.id+'\',this.checked)"><span class="sl"></span></label></div>').join('')
    +'<div class="field-2" style="margin-top:10px">'
      +'<div class="field"><label>Avisar los cobros con esta anticipación (días)</label>'
        +'<input type="number" min="1" value="'+avisoDias('cobros')+'" onchange="avisoDiasSet(\'cobros\',this.value)"></div>'
      +'<div class="field"><label>Avisar los pagos con esta anticipación (días)</label>'
        +'<input type="number" min="1" value="'+avisoDias('gastos')+'" onchange="avisoDiasSet(\'gastos\',this.value)"></div>'
    +'</div>'
    +'<div class="field"><label>Avisar si un camión lleva más de estos días en el taller</label>'
      +'<input type="number" min="1" value="'+avisoDias('taller')+'" onchange="avisoDiasSet(\'taller\',this.value)"></div>'
    +'<div class="srow" style="margin-top:10px"><div><div class="st">Avisos marcados como leídos</div>'
      +'<div class="ss">'+(leidos?leidos+' tipo(s) de aviso ocultos porque ya los leíste.':'No hay ninguno marcado como leído.')+'</div></div>'
      +'<button class="btn btn-sm"'+(leidos?'':' disabled')+' onclick="avisoDesleerTodo()">Volver a mostrar todos</button></div>'
    +'</div></div>';
}

/* Ventana simple de solo lectura (usa el mismo modal de los formularios) */
function abrirModalSimple(titulo,html){
  $('#modal-title').textContent=titulo;
  $('#modal-body').innerHTML=html;
  $('#modal-left').innerHTML='';
  $('#modal-save').style.display='none';
  $('#modal-bg').classList.add('open');
}
