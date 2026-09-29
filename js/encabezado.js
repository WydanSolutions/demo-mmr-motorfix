/*
 * ENCABEZADO de la página (lo de arriba, fijo): fecha, buscador general,
 * campanita de avisos y el botón de nueva orden.
 * Es lo que Motorfix tiene arriba de cada sección; acá busca camiones, clientes y órdenes.
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

/* ---------- Campanita: lo que hay que mirar hoy ---------- */
function avisosDelDia(){
  const hoy=hoyISO(), av=[];
  const vencidos=Store.all('movimientos').filter(m=>m.tipo==='cobro'&&m.estado!=='cobrado'&&m.vence&&m.vence<hoy);
  if(vencidos.length) av.push({t:'rojo',ico:'⚠',
    txt:vencidos.length+' cobro(s) vencido(s) por '+fPesos(vencidos.reduce((s,m)=>s+aPesos(m),0)),
    sub:'Mirá Finanzas para avisarle al cliente', a:"switchView('finanzas')"});

  const esperando=Store.all('presupuestos').filter(p=>p.estado==='Enviado');
  if(esperando.length) av.push({t:'ama',ico:'📝',
    txt:esperando.length+' presupuesto(s) esperando respuesta',
    sub:'Cuando el cliente aprueba, la orden se crea sola', a:"switchView('presup')"});

  const atrasadas=enTaller().filter(o=>diasEnTaller(o)>15);
  if(atrasadas.length) av.push({t:'rojo',ico:'🕐',
    txt:atrasadas.length+' camión(es) hace más de 15 días en el taller',
    sub:atrasadas.map(o=>(o.matricula||'').toUpperCase()).join(' · '), a:"switchView('reparaciones')"});

  const gastosVenc=Store.all('movimientos').filter(m=>m.tipo==='gasto'&&estadoMov(m)==='Vencido');
  if(gastosVenc.length) av.push({t:'ama',ico:'💸',
    txt:gastosVenc.length+' gasto(s) vencido(s) sin pagar',
    sub:'Están en Finanzas → Gastos de operativa', a:"switchView('finanzas')"});
  return av;
}
function diasEnTaller(o){
  if(!o.fecha) return 0;
  return Math.floor((Date.now()-new Date(o.fecha+'T00:00:00').getTime())/86400000);
}
function actualizarCampana(){
  const n=$('#campana-n'); if(!n) return;
  const c=avisosDelDia().length;
  n.textContent=c; n.classList.toggle('hidden',!c);
}
function verAvisos(ev){
  ev.stopPropagation();
  const av=avisosDelDia();
  abrirModalSimple('Avisos de hoy', av.length
    ? '<div class="avisos-lista">'+av.map(a=>'<button class="aviso '+a.t+'" onclick="closeModal();'+a.a+'">'
        +'<span class="av-ico">'+a.ico+'</span><span><b>'+esc(a.txt)+'</b><small>'+esc(a.sub)+'</small></span></button>').join('')+'</div>'
    : '<div class="empty"><div class="e-ico">✓</div><p>Todo al día. No hay nada urgente para mirar.</p></div>');
}

/* Ventana simple de solo lectura (usa el mismo modal de los formularios) */
function abrirModalSimple(titulo,html){
  $('#modal-title').textContent=titulo;
  $('#modal-body').innerHTML=html;
  $('#modal-left').innerHTML='';
  $('#modal-save').style.display='none';
  $('#modal-bg').classList.add('open');
}
