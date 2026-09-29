/*
 * FLUJO DE FONDOS (pasado, presente y futuro).
 *
 * Lo pasado sale de los movimientos ya registrados.
 * Lo futuro se proyecta con:
 *   - los presupuestos APROBADOS que todavía no se entregaron (es la base más realista),
 *   - los camiones que están en el taller sin entregar,
 *   - y, para los meses más lejanos, el promedio de los últimos meses.
 * Los gastos futuros se proyectan con el promedio de los últimos 3 meses.
 */
const MESES_ATRAS=6, MESES_ADELANTE=3;

function mesSuma(clave,tipo,soloConfirmado){
  return sumaMovs(Store.all('movimientos').filter(m=>m.tipo===tipo&&mesDe(m.fecha)===clave
    &&(!soloConfirmado||m.estado==='cobrado'||m.estado==='pagado')));
}
/* Trabajo pendiente de facturar: presupuestos aprobados sin entregar + camiones en el taller */
function trabajoPendiente(){
  let aprob=0, taller=0;
  Store.all('presupuestos').filter(p=>p.estado==='Aprobado').forEach(p=>{
    const o=Store.all('ordenes').find(x=>x.presupuestoId===p.id);
    if(!o||o.etapa!=='entregada') aprob+=presTotal(p);
  });
  enTaller().forEach(o=>{ if(!o.presupuestoId) taller+=ordenTotal(o); });
  return {aprobados:aprob, enTaller:taller, total:aprob+taller};
}
/* Promedio mensual de los últimos 3 meses cerrados */
function promedio(tipo){
  let s=0,n=0;
  for(let i=1;i<=3;i++){ const d=new Date(ANIO,MES-i,1); s+=mesSuma(claveMes(d.getFullYear(),d.getMonth()),tipo,true).uyu; n++; }
  return n?s/n:0;
}

function serieFlujo(){
  const out=[], pend=trabajoPendiente(), promIng=promedio('cobro'), promGas=promedio('gasto');
  let saldo=0;
  for(let i=-MESES_ATRAS;i<=MESES_ADELANTE;i++){
    const d=new Date(ANIO,MES+i,1), clave=claveMes(d.getFullYear(),d.getMonth()), futuro=i>0;
    let ing,gas;
    if(futuro){
      ing = (i===1? pend.total : promIng);
      gas = promGas;
    }else{
      ing = mesSuma(clave,'cobro',true).uyu;
      gas = mesSuma(clave,'gasto',true).uyu;
    }
    saldo+=ing-gas;
    out.push({clave:clave, etiqueta:MESES[d.getMonth()]+' '+String(d.getFullYear()).slice(2), ingresos:ing, gastos:gas, neto:ing-gas, saldo:saldo, futuro:futuro, actual:i===0});
  }
  return out;
}

function finFlujo(){
  const s=serieFlujo(), pend=trabajoPendiente();
  const max=Math.max(1,...s.map(x=>Math.max(x.ingresos,x.gastos)));
  const barras=s.map(x=>'<div class="cg" title="'+x.etiqueta+'">'
    +'<div class="cbars">'
      +'<div class="cb'+(x.futuro?' proy':'')+'" style="height:'+Math.round(x.ingresos/max*150)+'px" title="Ingresos '+fPesos(x.ingresos)+'"></div>'
      +'<div class="cb gasto'+(x.futuro?' proy':'')+'" style="height:'+Math.round(x.gastos/max*150)+'px" title="Gastos '+fPesos(x.gastos)+'"></div>'
    +'</div><div class="cl'+(x.futuro?' proy':'')+'">'+x.etiqueta+'</div></div>').join('');

  const filas=s.map(x=>'<tr'+(x.actual?' style="background:var(--azul-claro);font-weight:700"':'')+'>'
    +'<td class="nom">'+x.etiqueta+(x.futuro?' <span class="pill p-amarillo">proyectado</span>':'')+'</td>'
    +'<td class="num">'+fPesos(x.ingresos)+'</td>'
    +'<td class="num">'+fPesos(x.gastos)+'</td>'
    +'<td class="num" style="color:'+(x.neto>=0?'var(--verde)':'var(--rojo)')+'">'+fPesos(x.neto)+'</td>'
    +'<td class="num">'+fPesos(x.saldo)+'</td></tr>').join('');

  return '<div class="card"><div class="card-head"><h3>Ingresos y gastos por mes</h3>'
      +'<span class="csub">Los meses claros son la proyección</span></div>'
    +'<div class="card-body"><div class="chart">'+barras+'</div>'
    +'<div class="leyenda"><span><i style="background:var(--azul)"></i>Ingresos</span><span><i style="background:var(--rojo)"></i>Gastos</span>'
    +'<span><i style="background:var(--azul);opacity:.42"></i>Proyectado</span></div></div></div>'

    +'<div class="aviso azul"><span>🔮</span><div><b>Base de la proyección del mes que viene: '+fPesos(pend.total)+'</b>'
      +'Presupuestos aprobados sin entregar: '+fPesos(pend.aprobados)+' · Camiones en el taller: '+fPesos(pend.enTaller)
      +'. Los meses siguientes usan el promedio de los últimos 3 meses.</div></div>'

    +'<div class="table-wrap"><table><thead><tr><th>Mes</th><th class="num">Ingresos</th><th class="num">Gastos</th><th class="num">Resultado</th><th class="num">Saldo acumulado</th></tr></thead>'
    +'<tbody>'+filas+'</tbody></table></div>';
}
