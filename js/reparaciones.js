/*
 * REPARACIONES: el registro central del taller.
 * Dos formas de verlo: Lista (tabla con filtros) y Kanban (tarjetas que se arrastran de una
 * etapa a la otra). Cada cambio de etapa guarda la fecha y la hora, y con eso se mide
 * cuánto estuvo el camión en cada etapa.
 * La ficha completa de una orden está en orden.js.
 */
let repVista='lista', repSel=null, repSoloMes=false;
let repQ='', repEtapa='', repCli='', repFunc='', repMarca='', repTipo='', repCargo='';

/* MANO DE OBRA. Hay dos números distintos y conviene no mezclarlos:
   - lo que se le COBRA al cliente = horas × precio de la hora de taller (Configuración)
   - lo que le CUESTA al taller     = horas × costo/hora de cada funcionario
   La diferencia es la ganancia. Los trabajos por garantía usan el precio de garantía y
   los internos no se cobran. */
function ordenHoras(o){ return (o.tareas||[]).reduce((s,t)=>s+(+t.horas||0),0); }
function precioHoraDe(o){
  const p=Store.cfg().precioHora||{};
  if(o.cargo==='Garantía') return +p.garantia||0;
  if(o.cargo==='Interno') return 0;
  return +p.cliente||0;
}
/* Precio de la hora de UNA tarea: manda el del cargo del funcionario que la hizo. */
function precioHoraTarea(o,t){
  if(o.cargo==='Interno') return 0;
  if(o.cargo==='Garantía') return +(Store.cfg().precioHora||{}).garantia||0;
  const f=Store.get('funcionarios',t.funcionarioId);
  const porRol=f?+(Store.cfg().precioHoraRol||{})[f.rol]:0;
  return porRol||+(Store.cfg().precioHora||{}).cliente||0;
}
function ordenMO(o){ return (o.tareas||[]).reduce((s,t)=>s+(+t.horas||0)*precioHoraTarea(o,t),0); }  // lo que se cobra
function ordenMOCosto(o){ return (o.tareas||[]).reduce((s,t)=>{ const f=Store.get('funcionarios',t.funcionarioId); return s+(+t.horas||0)*(f?+f.costoHora||0:0); },0); }
function ordenRepuestos(o){ return (o.repuestos||[]).reduce((s,r)=>s+(+r.cant||0)*(+r.precio||0),0); }
function ordenTotal(o){ return ordenMO(o)+ordenRepuestos(o); }
function ordenGanancia(o){ return ordenMO(o)-ordenMOCosto(o); }         // la mano de obra deja esto
function ordenAvance(o){ const i=ETAPAS.findIndex(e=>e.id===o.etapa); return Math.round((i+1)/ETAPAS.length*100); }
/* Cuánto duró cada etapa, en horas, mirando las marcas de tiempo guardadas */
function ordenTiempos(o){
  const t=o.tiempos||{}, out=[];
  ETAPAS.forEach((e,i)=>{
    const ini=t[e.id]; if(!ini)return;
    const sig=ETAPAS.slice(i+1).map(x=>t[x.id]).find(Boolean);
    const fin=sig||(o.etapa===e.id?new Date().toISOString():null);
    if(!fin)return;
    out.push({etapa:e.n, horas:Math.max(0,(new Date(fin)-new Date(ini))/3600000)});
  });
  return out;
}

function ordenesFiltradas(){
  return Store.all('ordenes').filter(o=>{
    if(repSoloMes){ if(!esDelMes(o.fecha))return false; }
    else if(!esDelMes(o.fecha) && o.etapa==='entregada') return false;   // las cerradas de otros meses no se muestran
    if(repEtapa&&o.etapa!==repEtapa)return false;
    if(repCli&&o.clienteId!==repCli)return false;
    if(repTipo&&o.tipo!==repTipo)return false;
    if(repCargo&&(o.cargo||'Cliente')!==repCargo)return false;
    if(repFunc&&!(o.tareas||[]).some(t=>t.funcionarioId===repFunc))return false;
    if(repMarca){ const c=camionPorMat(o.matricula); if(!c||c.marca!==repMarca)return false; }
    if(repQ){ const q=repQ.toLowerCase();
      const c=camionPorMat(o.matricula);
      const txt=[o.matricula,o.nro,cliNom(o.clienteId),o.peticiones,c&&c.marca,c&&c.modelo].join(' ').toLowerCase();
      if(txt.indexOf(q)<0)return false; }
    return true;
  }).reverse();
}

function renderRep(){
  if(repSel){ renderOrden(); return; }
  const lista=ordenesFiltradas();
  const barra=
     '<div class="toolbar">'
    +'<div class="search"><input placeholder="Buscar por matrícula, cliente, N°…" value="'+esc(repQ)+'" oninput="repQ=this.value;repRes()"></div>'
    +'<select class="filt" onchange="repEtapa=this.value;renderRep()"><option value="">Todas las etapas</option>'
      +ETAPAS.map(e=>'<option value="'+e.id+'"'+(repEtapa===e.id?' selected':'')+'>'+e.n+'</option>').join('')+'</select>'
    +'<select class="filt" onchange="repCli=this.value;renderRep()"><option value="">Todos los clientes</option>'
      +Store.all('clientes').map(c=>'<option value="'+c.id+'"'+(repCli===c.id?' selected':'')+'>'+esc(c.nombre)+'</option>').join('')+'</select>'
    +'<select class="filt" onchange="repFunc=this.value;renderRep()"><option value="">Todos los funcionarios</option>'
      +Store.all('funcionarios').map(f=>'<option value="'+f.id+'"'+(repFunc===f.id?' selected':'')+'>'+esc(f.nombre)+'</option>').join('')+'</select>'
    +'<select class="filt" onchange="repMarca=this.value;renderRep()"><option value="">Todas las marcas</option>'+selectOps(Store.cfg().marcas,repMarca)+'</select>'
    +'<select class="filt" onchange="repTipo=this.value;renderRep()"><option value="">Todos los tipos</option>'+selectOps(TIPOS_ORDEN,repTipo)+'</select>'
    +'<select class="filt" onchange="repCargo=this.value;renderRep()"><option value="">Cliente, garantía e interno</option>'+selectOps(CARGOS,repCargo)+'</select>'
    +'<div class="spacer"></div>'+botonesExport('ordenes')+'</div>';

  const segm='<div style="display:flex;gap:6px">'
    +'<button class="btn btn-sm'+(repVista==='lista'?' btn-primary':'')+'" onclick="repVista=\'lista\';renderRep()">☰ Lista</button>'
    +'<button class="btn btn-sm'+(repVista==='kanban'?' btn-primary':'')+'" onclick="repVista=\'kanban\';renderRep()">▤ Kanban</button>'
    +'<label class="btn btn-sm" style="font-weight:600"><input type="checkbox" style="margin-right:6px"'+(repSoloMes?' checked':'')+' onchange="repSoloMes=this.checked;renderRep()">Solo '+MESES_L[MES]+'</label></div>';

  $('#view-reparaciones').innerHTML=
     '<div class="view-head"><div><h2>Reparaciones</h2><div class="sub">'+lista.length+' orden(es) · '+enTaller().length+' camión(es) en el taller</div></div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
      +'<button class="btn" onclick="abrirPantallaTaller()" title="Para poner en un televisor en el taller">📺 Pantalla de taller</button></div></div>'
    +barraMes(segm)+barra
    +'<div id="rep-res">'+(repVista==='lista'?repTabla(lista):repKanban(lista))+'</div>';
}
/* Solo la tabla o el kanban (el buscador no se toca, así se escribe de corrido) */
function repRes(){
  const c=$('#rep-res'); if(!c)return;
  const lista=ordenesFiltradas();
  c.innerHTML=repVista==='lista'?repTabla(lista):repKanban(lista);
}

function repTabla(lista){
  const filas=lista.map(o=>{
    const cam=camionPorMat(o.matricula);
    return '<tr onclick="verOrden(\''+o.id+'\')" style="cursor:pointer">'
      +'<td class="nom">'+o.nro+'</td>'
      +'<td class="muted-cell">'+fDate(o.fecha)+'</td>'
      +'<td>'+matTag(o.matricula)+'</td>'
      +'<td class="nom">'+esc(cliNom(o.clienteId))+'</td>'
      +'<td class="muted-cell">'+esc(cam?cam.marca:'—')+'</td>'
      +'<td>'+pill(o.tipo||'—',o.tipo==='Preventivo'?'p-azul':'p-amarillo')+'</td>'
      +'<td>'+pillCargo(o.cargo)+'</td>'
      +'<td>'+pillEtapa(o.etapa)+'</td>'
      +'<td>'+pillPrio(o.prioridad)+'</td>'
      +'<td class="num">'+fPesos(ordenTotal(o))+'</td>'
      +'<td>'+acciones('ordenes',o.id)+'</td></tr>';
  }).join('');
  return '<div class="table-wrap"><table><thead><tr><th>O.R.</th><th>Fecha</th><th>Matrícula</th><th>Cliente</th><th>Marca</th><th>Tipo</th><th>A cargo de</th><th>Etapa</th><th>Prioridad</th><th class="num">Total</th><th></th></tr></thead>'
    +'<tbody>'+(filas||filaVacia(11,'No hay órdenes con esos filtros.'))+'</tbody></table></div>';
}

function repKanban(lista){
  return '<div class="kan">'+ETAPAS.map(e=>{
    const ord=lista.filter(o=>o.etapa===e.id);
    return '<div class="kcol" ondragover="kanOver(event,this)" ondragleave="this.classList.remove(\'over\')" ondrop="kanDrop(event,\''+e.id+'\',this)">'
      +'<div class="kcol-h">'+esc(e.n)+'<span class="kn">'+ord.length+'</span></div>'
      +ord.map(o=>{
        const cam=camionPorMat(o.matricula);
        return '<div class="kcard" draggable="true" ondragstart="kanDrag(event,\''+o.id+'\')" ondragend="this.classList.remove(\'drag\')" onclick="verOrden(\''+o.id+'\')">'
          +'<div class="kmat-fila">'+matTag(o.matricula)+'<span class="muted-cell">N° '+o.nro+'</span></div>'
          +'<div class="kcli">'+esc(cliNom(o.clienteId))+'</div>'
          +'<div class="kmeta">'+esc(cam?cam.marca:'')+' · '+pillPrio(o.prioridad)+'</div>'
          +'<div class="kbar"><i style="width:'+ordenAvance(o)+'%"></i></div></div>';
      }).join('')
      +'</div>';
  }).join('')+'</div>'
  +'<div class="muted-cell" style="margin-top:10px">Arrastrá una tarjeta a otra columna para cambiarle la etapa. En el celular se cambia desde la ficha de la orden.</div>';
}

/* Arrastrar y soltar en el Kanban */
let kanId=null;
function kanDrag(ev,id){ kanId=id; ev.currentTarget.classList.add('drag'); try{ ev.dataTransfer.setData('text/plain',id); }catch(e){} }
function kanOver(ev,el){ ev.preventDefault(); el.classList.add('over'); }
function kanDrop(ev,etapa,el){ ev.preventDefault(); el.classList.remove('over'); const id=kanId||ev.dataTransfer.getData('text/plain'); if(id) cambiarEtapa(id,etapa); kanId=null; }

/* Cambio de etapa: guarda la fecha y la hora del cambio */
function cambiarEtapa(id,etapa){
  const o=Store.get('ordenes',id); if(!o||o.etapa===etapa)return;
  o.etapa=etapa; o.tiempos=o.tiempos||{};
  const d=new Date(); o.tiempos[etapa]=d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())+'T'+p2(d.getHours())+':'+p2(d.getMinutes());
  if(etapa==='entregada'&&!o.fechaEntrega) o.fechaEntrega=hoyISO();   // queda la fecha real de entrega
  Store.upsert('ordenes',o);
  toast('Orden N° '+o.nro+' → '+etapaN(etapa));
  if(etapa==='entregada'&&(o.cargo||'Cliente')==='Cliente') avisarCobro(o);
  renderRep();
}
/* Al entregar, ofrece registrar el cobro en Finanzas */
function avisarCobro(o){
  if(Store.all('movimientos').some(m=>m.ordenId===o.id))return;
  confirmar('Camión entregado',
    'Se entregó el camión '+(o.matricula||'').toUpperCase()+' por '+fPesos(ordenTotal(o))+'.\n¿Querés registrar el cobro en Finanzas?',
    function(){ openForm('movimiento',null,{tipo:'cobro',clienteId:o.clienteId,ordenId:o.id,importe:ordenTotal(o),
      concepto:'O.R. '+o.nro+' · '+(o.matricula||'').toUpperCase()}); },'Sí, registrar el cobro');
}
function verOrden(id){
  repSel=id; switchView('reparaciones');
  // Las facturas adjuntas se bajan recién ahora (ver adjuntos.js) y se redibuja cuando llegan.
  adjCargarDe(Store.get('ordenes',id)).then(function(){ if(repSel===id) renderRep(); });
}
