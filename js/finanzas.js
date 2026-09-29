/*
 * FINANZAS. Una sola pestaña con el resumen arriba (ingresos, gastos y resultado del mes)
 * y tres sub-pestañas: Trabajos entregados (cobros), Gastos de operativa y Flujo de fondos
 * (esta última está en finanzas-flujo.js).
 *
 * Cada movimiento guarda la cotización del día en que se registró (ver moneda.js).
 */
let finTab='cobros', finQ='', finCat='', finMedio='', finMoneda='';

function movsDelMes(tipo){ return Store.all('movimientos').filter(m=>m.tipo===tipo&&esDelMes(m.fecha)); }
/* Filtro por la moneda en que se hizo la operación (no la de visualización) */
function selectMoneda(){
  return '<select class="filt" onchange="finMoneda=this.value;finRes()" title="Moneda de la operación">'
    +'<option value="">Todas las monedas</option>'
    +MONEDAS.map(m=>'<option value="'+m+'"'+(finMoneda===m?' selected':'')+'>Solo '+MON_NOM[m].toLowerCase()+'</option>').join('')+'</select>';
}

function renderFinanzas(){
  const cobros=movsDelMes('cobro'), gastos=movsDelMes('gasto');
  const tCob=sumaMovs(cobros.filter(m=>m.estado==='cobrado')), tGas=sumaMovs(gastos);
  const neto={uyu:tCob.uyu-tGas.uyu, usd:tCob.usd-tGas.usd, brl:tCob.brl-tGas.brl};
  const pend=sumaMovs(Store.all('movimientos').filter(m=>m.tipo==='cobro'&&m.estado!=='cobrado'));

  const tabs=['cobros','gastos','flujo'];
  const nom={cobros:'Trabajos entregados',gastos:'Gastos de operativa',flujo:'Flujo de fondos'};
  const seg='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">'
    +tabs.map(t=>'<button class="btn btn-sm'+(finTab===t?' btn-primary':'')+'" onclick="finTab=\''+t+'\';renderFinanzas()">'+nom[t]+'</button>').join('')+'</div>';

  $('#view-finanzas').innerHTML=
     '<div class="view-head"><div><h2>Finanzas</h2><div class="sub">Importes en '+MON_NOM[MONEDA].toLowerCase()+' · el botón de arriba cambia la moneda</div></div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="openForm(\'movimiento\',null,{tipo:\'gasto\'})">+ Gasto</button>'
    +'<button class="btn btn-primary" onclick="openForm(\'movimiento\',null,{tipo:\'cobro\'})">+ Cobro</button></div></div>'
    +barraMes('<span class="mchip">U$S '+(tcHoy('USD')?nf(tcHoy('USD'),true):'sin cargar')+' · R$ '+(tcHoy('BRL')?nf(tcHoy('BRL'),true):'sin cargar')+'</span>')
    +'<div class="kpis">'
      +kpi('Ingresos de '+MESES_L[MES],fMon(tCob),cobros.filter(m=>m.estado==='cobrado').length+' cobro(s)','k-verde',true)
      +kpi('Gastos de '+MESES_L[MES],fMon(tGas),gastos.length+' gasto(s)','k-rojo',true)
      +kpi('Resultado neto',fMon(neto),neto.uyu>=0?'El mes cierra positivo':'El mes cierra negativo',neto.uyu>=0?'k-verde':'k-rojo',true)
      +kpi('Por cobrar',fMon(pend),'De todos los meses','k-amarillo',true)
    +'</div>'
    +seg
    +(finTab==='cobros'?finCobros():finTab==='gastos'?finGastos():finFlujo());
}

/* ---------- TRABAJOS ENTREGADOS (COBROS) ---------- */
function finCobros(){
  return '<div class="toolbar"><div class="search"><input placeholder="Buscar concepto o cliente…" value="'+esc(finQ)+'" oninput="finQ=this.value;finRes()"></div>'
    +'<select class="filt" onchange="finMedio=this.value;finRes()"><option value="">Todos los medios de pago</option>'+selectOps(Store.cfg().medios,finMedio)+'</select>'
    +selectMoneda()
    +'<div class="spacer"></div>'+botonesExport('cobros')+'</div>'
    +'<div id="fin-res">'+cobrosRes()+'</div>';
}
function cobrosRes(){
  const lista=movsDelMes('cobro').filter(m=>(!finMedio||m.medio===finMedio)&&(!finMoneda||(m.moneda||'UYU')===finMoneda)
    &&(!finQ||[m.concepto,cliNom(m.clienteId)].join(' ').toLowerCase().indexOf(finQ.toLowerCase())>=0));
  const filas=lista.map(m=>{
    return '<tr>'
      +'<td class="muted-cell">'+fDate(m.fecha)+'</td>'
      +'<td class="nom">'+esc(m.concepto||'')+'</td>'
      +'<td>'+(m.clienteId?'<span class="lnk" onclick="verCliente(\''+m.clienteId+'\')">'+esc(cliNom(m.clienteId))+'</span>':'—')+'</td>'
      +'<td class="muted-cell">'+esc(m.medio||'')+'</td>'
      +'<td class="num">'+fPropia(m)+'</td>'
      +'<td class="num muted-cell">'+fMon(valMov(m))+'</td>'
      +'<td>'+pillCambiable(estadoMov(m),estadoMov(m)==='Vencido'?'p-rojo':estadoMov(m)==='Pendiente'?'p-amarillo':'p-verde',['Cobrado','Pendiente'],'movEstado',m.id)+'</td>'
      +'<td class="muted-cell">'+(m.vence?fDate(m.vence):'—')+'</td>'
      +'<td><div class="row-act">'
        +'<button class="btn-ghost" onclick="openForm(\'movimiento\',\''+m.id+'\')">✎</button>'
        +'<button class="btn-ghost" style="color:var(--rojo)" onclick="borrar(\'movimientos\',\''+m.id+'\')">🗑</button></div></td></tr>';
  }).join('');
  const t=sumaMovs(lista);
  /* Resumen por medio de pago */
  const porMedio=Store.cfg().medios.map(me=>{
    const s=sumaMovs(lista.filter(m=>m.medio===me));
    return s.uyu?'<div class="bar-row"><div class="bl">'+esc(me)+'</div><div class="bar-track"><div class="bar-fill" style="width:'+(t.uyu?Math.round(s.uyu/t.uyu*100):0)+'%"></div></div><div class="bn">'+fMon(s)+'</div></div>':'';
  }).join('');

  return '<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Concepto</th><th>Cliente</th><th>Medio</th><th class="num">Importe</th><th class="num">En '+MON_SIM[MONEDA]+'</th><th>Estado</th><th>Vence</th><th></th></tr></thead>'
    +'<tbody>'+(filas||filaVacia(9,'No hay cobros en '+MESES_L[MES]+'.'))+'</tbody>'
    +'<tfoot><tr><td colspan="5">Total del mes</td><td class="num">'+fMon(t)+'</td><td colspan="3"></td></tr></tfoot></table></div>'
    +(porMedio?'<div class="card" style="margin-top:16px"><div class="card-head"><h3>Por medio de pago</h3></div><div class="card-body">'+porMedio+'</div></div>':'');
}
/* Cambia el estado desde la celda (cobros y gastos). 'Vencido' no se elige: sale solo. */
function movEstado(id,estado){
  const m=Store.get('movimientos',id); if(!m)return;
  m.estado = (estado==='Cobrado'?'cobrado':estado==='Pagado'?'pagado':'pendiente');
  if(m.moneda&&m.moneda!=='UYU'&&!m.cotizacion) m.cotizacion=getTipoCambio(m.fecha,m.moneda);
  Store.upsert('movimientos',m); toast(m.tipo==='gasto'?'Gasto: '+estado:'Cobro: '+estado); renderView(CUR);
}

/* ---------- GASTOS DE OPERATIVA ---------- */
function finGastos(){
  return '<div class="toolbar"><div class="search"><input placeholder="Buscar gasto o proveedor…" value="'+esc(finQ)+'" oninput="finQ=this.value;finRes()"></div>'
    +'<select class="filt" onchange="finCat=this.value;finRes()"><option value="">Todas las categorías</option>'+selectOps(Store.cfg().categorias,finCat)+'</select>'
    +selectMoneda()
    +'<button class="btn btn-sm" onclick="abrirCategorias()">⚙ Categorías</button>'
    +'<div class="spacer"></div>'+botonesExport('gastos')+'</div>'
    +'<div id="fin-res">'+gastosRes()+'</div>';
}
function gastosRes(){
  const lista=movsDelMes('gasto').filter(m=>(!finCat||m.categoria===finCat)&&(!finMoneda||(m.moneda||'UYU')===finMoneda)
    &&(!finQ||[m.concepto,cliNom(m.proveedorId)].join(' ').toLowerCase().indexOf(finQ.toLowerCase())>=0));
  const filas=lista.map(m=>'<tr>'
    +'<td class="muted-cell">'+fDate(m.fecha)+'</td>'
    +'<td class="nom">'+esc(m.concepto||'')+'</td>'
    +'<td>'+pill(m.categoria||'Otros','p-gris')+'</td>'
    +'<td>'+(m.proveedorId?'<span class="lnk" onclick="verCliente(\''+m.proveedorId+'\')">'+esc(cliNom(m.proveedorId))+'</span>':'<span class="muted-cell">—</span>')+'</td>'
    +'<td class="muted-cell">'+esc(m.medio||'')+'</td>'
    +'<td class="num">'+fPropia(m)+'</td>'
    +'<td class="num muted-cell">'+fMon(valMov(m))+'</td>'
    +'<td>'+pillCambiable(estadoMov(m),estadoMov(m)==='Vencido'?'p-rojo':estadoMov(m)==='Pendiente'?'p-amarillo':'p-verde',['Pagado','Pendiente'],'movEstado',m.id)+'</td>'
    +'<td class="muted-cell">'+(m.vence?fDate(m.vence):'—')+'</td>'
    +'<td><div class="row-act">'
      +'<button class="btn-ghost" onclick="openForm(\'movimiento\',\''+m.id+'\')">✎</button>'
      +'<button class="btn-ghost" style="color:var(--rojo)" onclick="borrar(\'movimientos\',\''+m.id+'\')">🗑</button></div></td></tr>').join('');
  const t=sumaMovs(lista);
  const porCat=Store.cfg().categorias.map(c=>{
    const s=sumaMovs(lista.filter(m=>m.categoria===c));
    return s.uyu?{c:c,s:s}:null;
  }).filter(Boolean).sort((a,b)=>b.s.uyu-a.s.uyu);
  const barras=porCat.map(x=>'<div class="bar-row"><div class="bl">'+esc(x.c)+'</div>'
    +'<div class="bar-track"><div class="bar-fill" style="width:'+(t.uyu?Math.round(x.s.uyu/t.uyu*100):0)+'%;background:var(--rojo)"></div></div>'
    +'<div class="bn">'+fMon(x.s)+'</div></div>').join('')||'<div class="muted-cell">Sin gastos en el mes.</div>';

  return '<div class="table-wrap"><table style="min-width:760px"><thead><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th>Proveedor</th><th>Medio</th><th class="num">Importe</th><th class="num">En '+MON_SIM[MONEDA]+'</th><th>Estado</th><th>Vence</th><th></th></tr></thead>'
      +'<tbody>'+(filas||filaVacia(10,'No hay gastos en '+MESES_L[MES]+'.'))+'</tbody>'
      +'<tfoot><tr><td colspan="5">Total del mes</td><td colspan="2" class="num">'+fMon(t)+'</td><td colspan="3"></td></tr></tfoot></table></div>'
    +'<div class="card" style="margin-top:16px"><div class="card-head"><h3>En qué se va la plata</h3></div><div class="card-body">'+barras+'</div></div>';
}
/* Redibuja SOLO la tabla (el buscador no se toca, así se escribe de corrido) */
function finRes(){ const c=$('#fin-res'); if(c) c.innerHTML = finTab==='gastos'?gastosRes():cobrosRes(); }
function abrirCategorias(){ listaEditable('Categorías de gasto','categorias','Ej.: Neumáticos'); }
