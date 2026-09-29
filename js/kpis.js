/*
 * KPIs Y CIERRE DE TALLER. Reemplaza los reportes que antes se le mandaban al importador VW,
 * pero con los números que le sirven al taller: órdenes del mes, tiempos por etapa,
 * horas de cada funcionario, camiones y marcas atendidas.
 */
function ordenesDelMes(){ return Store.all('ordenes').filter(o=>esDelMes(o.fecha)); }
function entregadasDelMes(){ return Store.all('ordenes').filter(o=>o.etapa==='entregada'&&esDelMes((o.tiempos||{}).entregada||o.fecha)); }

/* Promedio de horas que lleva cada etapa, mirando las órdenes del mes */
function promedioEtapas(){
  const acc={}, cnt={};
  ordenesDelMes().forEach(o=>ordenTiempos(o).forEach(t=>{ acc[t.etapa]=(acc[t.etapa]||0)+t.horas; cnt[t.etapa]=(cnt[t.etapa]||0)+1; }));
  return ETAPAS.map(e=>({etapa:e.n, horas:cnt[e.n]?acc[e.n]/cnt[e.n]:0}));
}
/* Horas trabajadas por funcionario: lo que se le cobra al cliente y lo que le cuesta al taller */
function porFuncionario(){
  const p=Store.cfg().precioHora||{};
  return Store.all('funcionarios').map(f=>{
    let horas=0, venta=0;
    ordenesDelMes().forEach(o=>(o.tareas||[]).forEach(t=>{
      if(t.funcionarioId!==f.id)return;
      horas+=+t.horas||0; venta+=(+t.horas||0)*precioHoraTarea(o,t);
    }));
    return {f:f, horas:horas, costo:horas*(+f.costoHora||0), venta:venta};
  }).sort((a,b)=>b.horas-a.horas);
}
/* ¿Este funcionario factura horas de taller? (lo define la lista de roles productivos) */
function esProductivo(f){ return (Store.cfg().rolesProd||[]).indexOf(f.rol)>=0; }
/* Disponibilidad del mes: cuántas horas puede vender el taller y cuántas vendió de verdad.
   Es lo que la planilla calculaba en la hoja INF.GRAL. TALLER. */
function disponibilidad(){
  const j=Store.cfg().jornada||{}, prod=Store.all('funcionarios').filter(esProductivo).length;
  const disp=Math.max(0,(+j.dias||0)*(+j.horas||0)*prod-(+j.faltas||0));
  const vendidas=ordenesDelMes().reduce((s,o)=>s+ordenHoras(o),0);
  return {productivos:prod, disponibles:disp, vendidas:vendidas, pct:disp?Math.round(vendidas/disp*100):0};
}

function renderKpis(){
  const ords=ordenesDelMes(), entreg=entregadasDelMes(), abiertas=ords.filter(o=>o.etapa!=='entregada');
  const mats={}, marcas={};
  ords.forEach(o=>{ mats[normMat(o.matricula)]=1; const c=camionPorMat(o.matricula); if(c&&c.marca)marcas[c.marca]=(marcas[c.marca]||0)+1; });
  const func=porFuncionario();
  const moTotal=ords.reduce((s,o)=>s+ordenMO(o),0);
  const moCosto=func.reduce((s,x)=>s+x.costo,0);
  const horasTotal=func.reduce((s,x)=>s+x.horas,0);
  const disp=disponibilidad();
  const porCargo={}; CARGOS.forEach(c=>porCargo[c]=ords.filter(o=>(o.cargo||'Cliente')===c).length);
  const repTotal=ords.reduce((s,o)=>s+ordenRepuestos(o),0);
  const etapas=promedioEtapas();
  const maxEt=Math.max(1,...etapas.map(e=>e.horas));

  const tEtapas=etapas.map(e=>'<div class="bar-row"><div class="bl">'+esc(e.etapa)+'</div>'
    +'<div class="bar-track"><div class="bar-fill" style="width:'+Math.round(e.horas/maxEt*100)+'%"></div></div>'
    +'<div class="bn">'+(e.horas?(e.horas<24?e.horas.toFixed(1)+' h':(e.horas/24).toFixed(1)+' d'):'—')+'</div></div>').join('');

  const tFunc=func.map(x=>'<tr><td class="nom">'+esc(x.f.nombre)+'</td>'
    +'<td class="muted-cell">'+esc(x.f.rol||'')+(esProductivo(x.f)?'':' <span class="pill p-gris">no productivo</span>')+'</td>'
    +'<td class="num">'+nf(x.horas,true)+'</td>'
    +'<td class="num">'+fPesos(x.venta)+'</td>'
    +'<td class="num muted-cell">'+fPesos(x.costo)+'</td>'
    +'<td class="num" style="color:'+(x.venta-x.costo>=0?'var(--verde)':'var(--rojo)')+'">'+fPesos(x.venta-x.costo)+'</td></tr>').join('')
    ||filaVacia(6,'Sin horas cargadas este mes.');

  const tMarcas=Object.keys(marcas).sort((a,b)=>marcas[b]-marcas[a]).map(m=>{
    const max=Math.max(...Object.values(marcas));
    return '<div class="bar-row"><div class="bl">'+esc(m)+'</div><div class="bar-track"><div class="bar-fill" style="width:'+Math.round(marcas[m]/max*100)+'%;background:var(--amarillo)"></div></div><div class="bn">'+marcas[m]+'</div></div>';
  }).join('')||'<div class="muted-cell">Sin camiones atendidos este mes.</div>';

  const porRol={};
  Store.all('funcionarios').forEach(f=>{ porRol[f.rol||'Sin rol']=(porRol[f.rol||'Sin rol']||0)+1; });

  $('#view-kpis').innerHTML=
     '<div class="view-head"><div><h2>KPIs y cierre de taller</h2><div class="sub">Los números del mes, sin códigos ni planillas del importador</div></div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="cierreExcel()">⬇ Excel</button>'
    +'<button class="btn btn-primary" onclick="cierrePDF()">📄 Cierre de mes en PDF</button></div></div>'
    +barraMes()
    +'<div class="kpis">'
      +kpi('Órdenes abiertas',abiertas.length,'Del mes, sin entregar',abiertas.length?'k-amarillo':'')
      +kpi('Órdenes entregadas',entreg.length,'Trabajos cerrados en el mes','k-verde')
      +kpi('Camiones atendidos',Object.keys(mats).length,Object.keys(marcas).length+' marca(s) distintas','')
      +kpi('Mano de obra del mes',fPesos(moTotal),nf(horasTotal,true)+' hora(s) trabajadas','k-verde',true)
    +'</div>'
    +'<div class="card"><div class="card-head"><h3>Aprovechamiento del taller</h3>'
      +'<span class="csub">'+disp.productivos+' funcionario(s) productivo(s) · '+nf(Store.cfg().jornada.dias)+' días × '+nf(Store.cfg().jornada.horas,true)+' h de jornada</span></div>'
      +'<div class="card-body">'
      +'<div class="bar-row"><div class="bl">Horas vendidas</div><div class="bar-track" style="height:18px">'
        +'<div class="bar-fill" style="width:'+Math.min(100,disp.pct)+'%;background:'+(disp.pct>=75?'var(--verde)':disp.pct>=45?'var(--amarillo)':'var(--rojo)')+'"></div></div>'
        +'<div class="bn">'+disp.pct+'%</div></div>'
      +'<div class="muted-cell" style="margin-top:8px">Se vendieron <b>'+nf(disp.vendidas,true)+' horas</b> de las <b>'+nf(disp.disponibles,true)+'</b> que tiene disponibles el taller este mes. '
      +'Los días, la jornada y las faltas se cargan en Configuración.</div></div></div>'
    +'<div class="grid2">'
      +'<div class="card"><div class="card-head"><h3>Horas por funcionario</h3><span class="csub">Lo que se cobró y lo que costó</span></div>'
        +'<div class="table-wrap" style="border:none;box-shadow:none"><table style="min-width:560px"><thead><tr><th>Funcionario</th><th>Rol</th><th class="num">Horas</th><th class="num">Se cobró</th><th class="num">Costó</th><th class="num">Deja</th></tr></thead>'
        +'<tbody>'+tFunc+'</tbody></table></div></div>'
      +'<div><div class="card"><div class="card-head"><h3>Tiempo promedio por etapa</h3></div><div class="card-body">'+(tEtapas||'<div class="muted-cell">Sin datos todavía.</div>')+'</div></div>'
      +'<div class="card"><div class="card-head"><h3>Marcas atendidas</h3></div><div class="card-body">'+tMarcas+'</div></div></div>'
    +'</div>'
    +'<div class="card"><div class="card-head"><h3>Cierre de '+MESES_L[MES]+' '+ANIO+'</h3><span class="csub">Resumen operativo del mes</span></div><div class="card-body">'
      +'<div class="det-grid">'
        +campo('Camiones atendidos',Object.keys(mats).length)
        +campo('Órdenes abiertas en el mes',ords.length)
        +campo('Órdenes entregadas',entreg.length)
        +campo('Cliente / garantía / internas',porCargo['Cliente']+' / '+porCargo['Garantía']+' / '+porCargo['Interno'])
        +campo('Horas trabajadas',nf(horasTotal,true)+' de '+nf(disp.disponibles,true)+' disponibles ('+disp.pct+'%)')
        +campo('Mano de obra facturada',fPesos(moTotal))
        +campo('Costo de la mano de obra',fPesos(moCosto))
        +campo('Repuestos usados',fPesos(repTotal))
        +campo('Total del trabajo del mes',fPesos(moTotal+repTotal))
        +campo('Personal productivo / no productivo',Store.all('funcionarios').filter(esProductivo).length+' / '+Store.all('funcionarios').filter(f=>!esProductivo(f)).length)
        +campo('Personal por rol',Object.keys(porRol).map(r=>r+': '+porRol[r]).join(' · '))
      +'</div></div></div>';
}

/* ---------- CIERRE DE MES EN PDF / EXCEL ---------- */
function cierreDatos(){
  const ords=ordenesDelMes(), entreg=entregadasDelMes(), func=porFuncionario();
  const mats={}; ords.forEach(o=>mats[normMat(o.matricula)]=1);
  const mo=ords.reduce((s,o)=>s+ordenMO(o),0), rep=ords.reduce((s,o)=>s+ordenRepuestos(o),0);
  return {ords:ords,entreg:entreg,func:func,camiones:Object.keys(mats).length,mo:mo,rep:rep,disp:disponibilidad()};
}
function cierrePDF(){
  const d=cierreDatos();
  const filasF=d.func.filter(x=>x.horas).map(x=>'<tr><td>'+esc(x.f.nombre)+'</td><td>'+esc(x.f.rol||'')+'</td><td class="n">'+nf(x.horas,true)+'</td><td class="n">'+fPesos(x.venta)+'</td><td class="n">'+fPesos(x.costo)+'</td></tr>').join('');
  const filasO=d.ords.map(o=>'<tr><td>'+o.nro+'</td><td>'+fDate(o.fecha)+'</td><td>'+esc((o.matricula||'').toUpperCase())+'</td><td>'+esc(cliNom(o.clienteId))+'</td><td>'+esc(o.tipo||'')+'</td><td>'+esc(o.cargo||'Cliente')+'</td><td>'+etapaN(o.etapa)+'</td><td class="n">'+fPesos(ordenTotal(o))+'</td></tr>').join('');
  const etapas=promedioEtapas().filter(e=>e.horas).map(e=>'<tr><td>'+esc(e.etapa)+'</td><td class="n">'+(e.horas<24?e.horas.toFixed(1)+' h':(e.horas/24).toFixed(1)+' días')+'</td></tr>').join('');
  abrirPDF('Cierre de '+MESES_L[MES]+' '+ANIO,
     '<h2>Cierre de '+MESES_L[MES]+' '+ANIO+'</h2>'
    +'<div class="meta"><div><b>Camiones atendidos</b><br>'+d.camiones+'</div>'
    +'<div><b>Órdenes del mes</b><br>'+d.ords.length+'</div>'
    +'<div><b>Órdenes entregadas</b><br>'+d.entreg.length+'</div>'
    +'<div><b>Mano de obra</b><br>'+fPesos(d.mo)+'</div>'
    +'<div><b>Repuestos</b><br>'+fPesos(d.rep)+'</div>'
    +'<div><b>Horas vendidas</b><br>'+nf(d.disp.vendidas,true)+' de '+nf(d.disp.disponibles,true)+' ('+d.disp.pct+'%)</div></div>'
    +(filasF?'<h3>Horas por funcionario</h3><table><thead><tr><th>Funcionario</th><th>Rol</th><th class="n">Horas</th><th class="n">Se cobró</th><th class="n">Costó</th></tr></thead><tbody>'+filasF+'</tbody></table>':'')
    +(etapas?'<h3>Tiempo promedio por etapa</h3><table><thead><tr><th>Etapa</th><th class="n">Promedio</th></tr></thead><tbody>'+etapas+'</tbody></table>':'')
    +(filasO?'<h3>Órdenes del mes</h3><table><thead><tr><th>N°</th><th>Fecha</th><th>Matrícula</th><th>Cliente</th><th>Tipo</th><th>A cargo de</th><th>Etapa</th><th class="n">Total</th></tr></thead><tbody>'+filasO+'</tbody></table>':''));
}
function cierreExcel(){
  const d=cierreDatos();
  exportExcel('Cierre '+MESES_L[MES]+' '+ANIO,
    ['N° O.R.','Fecha de ingreso','Fecha de entrega','Matrícula','Chasis','Cliente','Marca','Tipo','A cargo de','Etapa','Km','Horímetro','Horas','Mano de obra','Costo M.O.','Repuestos','Total'],
    d.ords.map(o=>{ const c=camionPorMat(o.matricula);
      return [o.nro,fDate(o.fecha),o.fechaEntrega?fDate(o.fechaEntrega):'',(o.matricula||'').toUpperCase(),c?c.chasis:'',cliNom(o.clienteId),
        c?c.marca:'',o.tipo||'',o.cargo||'Cliente',etapaN(o.etapa),o.km||'',o.horimetro||'',
        nf(ordenHoras(o),true),nf(ordenMO(o)),nf(ordenMOCosto(o)),nf(ordenRepuestos(o)),nf(ordenTotal(o))]; }));
}
