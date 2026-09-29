/*
 * PANEL (lo primero que se ve al entrar).
 * Camiones en reparación, camiones en espera, cobros del mes y cobros por vencer,
 * más la lista de lo que está en el taller y los avisos importantes.
 */
function renderPanel(){
  const ords=Store.all('ordenes');
  const enRep=ords.filter(o=>o.etapa==='reparacion'||o.etapa==='revision');
  const enEsp=ords.filter(o=>o.etapa==='recibimiento'||o.etapa==='diagnostico');
  const movs=Store.all('movimientos');
  const cobrosMes=movs.filter(m=>m.tipo==='cobro'&&m.estado==='cobrado'&&esDelMes(m.fecha));
  const porVencer=movs.filter(m=>m.tipo==='cobro'&&m.estado!=='cobrado');
  const vencidos=porVencer.filter(m=>m.vence&&m.vence<hoyISO());
  const tCobros=sumaMovs(cobrosMes), tPorVencer=sumaMovs(porVencer), tVencido=sumaMovs(vencidos);

  const kpis='<div class="kpis">'
    +kpi('Camiones en reparación',enRep.length,'En reparación o revisión','')
    +kpi('Camiones en espera',enEsp.length,'Recibidos o en diagnóstico','k-amarillo')
    +kpi('Cobros de '+MESES_L[MES],fMon(tCobros),cobrosMes.length+' cobro(s) registrado(s)','k-verde',true)
    +kpi('Cobros por vencer',fMon(tPorVencer),(vencidos.length?vencidos.length+' vencido(s) · '+fMon(tVencido):'Sin vencidos'),vencidos.length?'k-rojo':'',true)
    +'</div>';

  /* Tira de estados: cuántos camiones hay en cada etapa. Tocando una, se abre el tablero filtrado. */
  const dentro=enTaller();
  const tira='<div class="tira-etapas">'+ETAPAS.filter(e=>e.id!=='entregada').map(e=>{
      const n=dentro.filter(o=>o.etapa===e.id).length;
      return '<button class="tira-et '+e.cls+(n?'':' vacia')+'" onclick="irAEtapa(\''+e.id+'\')">'
        +'<b>'+n+'</b><span>'+esc(e.n)+'</span></button>';
    }).join('')+'</div>';

  /* Avisos: los mismos de la campanita (encabezado.js). Se ven solo los que no se marcaron
     como leídos y los tipos que estén prendidos en Configuración → Avisos. */
  const avisos=avisosDelDia().pend.map(a=>
      '<div class="aviso '+(a.t==='ama'?'':'rojo')+'"><span>'+a.ico+'</span>'
      +'<div class="av-txt" onclick="'+a.a+'"><b>'+esc(a.txt)+'</b>'+esc(a.sub)+'</div>'
      +'<button class="av-ok" onclick="avisoLeer(\''+a.id+'\')" title="Marcar como leído">✓</button></div>').join('');

  /* En el taller ahora */
  const filas=enTaller().sort((a,b)=>ETAPAS.findIndex(e=>e.id===b.etapa)-ETAPAS.findIndex(e=>e.id===a.etapa)).map(o=>{
    const cam=camionPorMat(o.matricula), dias=diasEntre(o.fecha,hoyISO());
    return '<tr onclick="verOrden(\''+o.id+'\')" style="cursor:pointer">'
      +'<td>'+matTag(o.matricula)+'</td>'
      +'<td class="nom">'+esc(cliNom(o.clienteId))+'</td>'
      +'<td class="muted-cell">'+esc(cam?cam.marca+' '+cam.modelo:'—')+'</td>'
      +'<td>'+esc(o.tipo||'')+'</td>'
      +'<td>'+pillEtapa(o.etapa)+'</td>'
      +'<td>'+pillPrio(o.prioridad)+'</td>'
      +'<td class="muted-cell">'+(dias!=null?dias+' día(s) en el taller':'—')+'</td></tr>';
  }).join('');


  $('#view-panel').innerHTML=
     '<div class="view-head"><div><h2>Panel</h2><div class="sub">'+saludo()+'. Hoy es '+fDate(hoyISO())+'.</div></div>'
    +'<div><button class="btn" onclick="openForm(\'presupuesto\')">+ Presupuesto</button></div></div>'
    +barraMes()
    +kpis+tira+avisos
    +'<div class="card"><div class="card-head"><h3>En el taller ahora</h3><span class="csub">'+enTaller().length+' camión(es)</span></div>'
      +'<div class="table-wrap" style="border:none;box-shadow:none"><table><thead><tr><th>Matrícula</th><th>Cliente</th><th>Camión</th><th>Tipo</th><th>Etapa</th><th>Prioridad</th><th>Tiempo</th></tr></thead>'
      +'<tbody>'+(filas||filaVacia(7,'No hay camiones en el taller.'))+'</tbody></table></div></div>';
}

function kpi(label,valor,pie,cls,money){
  return '<div class="kpi '+(cls||'')+'"><div class="k-label">'+esc(label)+'</div>'
    +'<div class="k-num'+(money?' money':'')+'">'+valor+'</div><div class="k-foot">'+esc(pie||'')+'</div></div>';
}
