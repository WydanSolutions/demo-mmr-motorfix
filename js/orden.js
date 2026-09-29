/*
 * FICHA DE LA ORDEN DE REPARACIÓN: todo lo de un camión que está en el taller.
 * Etapas, tareas de cada funcionario con sus horas, repuestos con la factura de compra,
 * checklist de trabajos y los tiempos que llevó cada etapa.
 */
function renderOrden(){
  const o=Store.get('ordenes',repSel); if(!o){ repSel=null; renderRep(); return; }
  const cam=camionPorMat(o.matricula), cli=Store.get('clientes',o.clienteId);

  const pasos=ETAPAS.map(e=>{
    const hecho=ETAPAS.findIndex(x=>x.id===e.id)<=ETAPAS.findIndex(x=>x.id===o.etapa);
    const t=(o.tiempos||{})[e.id];
    return '<button class="btn btn-sm'+(o.etapa===e.id?' btn-primary':'')+'" style="'+(hecho?'':'opacity:.55')+'" onclick="cambiarEtapa(\''+o.id+'\',\''+e.id+'\')">'
      +esc(e.n)+(t?'<span class="muted-cell" style="margin-left:6px;color:inherit;opacity:.75">'+fDateHora(t)+'</span>':'')+'</button>';
  }).join(' ');

  const check=(o.checklist||[]).map((c,i)=>'<div style="display:flex;align-items:center;gap:9px;padding:5px 0">'
    +'<span class="chk'+(c.ok?' on':'')+'" onclick="ordChk('+i+')">'+(c.ok?'✓':'')+'</span>'
    +'<input class="cell-in" value="'+esc(c.t)+'" onchange="ordChkTxt('+i+',this.value)">'
    +'<button class="btn-ghost" style="color:var(--rojo)" onclick="ordChkDel('+i+')">🗑</button></div>').join('');

  const tareas=(o.tareas||[]).map((t,i)=>'<tr>'
    +'<td>'+selectFunc(t.funcionarioId,'onchange="ordTarea('+i+',\'funcionarioId\',this.value)" style="width:100%;padding:6px;border:1px solid var(--border);border-radius:6px"')+'</td>'
    +'<td><input class="cell-in" value="'+esc(t.desc||'')+'" placeholder="Qué hizo" onchange="ordTarea('+i+',\'desc\',this.value)"></td>'
    +'<td style="width:90px"><input class="cell-in num" type="number" step="0.5" value="'+(t.horas||0)+'" onchange="ordTarea('+i+',\'horas\',this.value)"></td>'
    +'<td class="num">'+fPesos((+t.horas||0)*precioHoraTarea(o,t))+'</td>'
    +'<td class="num muted-cell">'+fPesos((+t.horas||0)*((Store.get('funcionarios',t.funcionarioId)||{}).costoHora||0))+'</td>'
    +'<td><button class="btn-ghost" style="color:var(--rojo)" onclick="ordTareaDel('+i+')">🗑</button></td></tr>').join('');

  const reps=(o.repuestos||[]).map((r,i)=>'<tr>'
    +'<td><input class="cell-in" value="'+esc(r.desc||'')+'" placeholder="Repuesto" onchange="ordRep('+i+',\'desc\',this.value)"></td>'
    +'<td style="width:80px"><input class="cell-in num" type="number" step="1" value="'+(r.cant||1)+'" onchange="ordRep('+i+',\'cant\',this.value)"></td>'
    +'<td style="width:120px"><input class="cell-in num" type="number" step="0.01" value="'+(r.precio||0)+'" onchange="ordRep('+i+',\'precio\',this.value)"></td>'
    +'<td class="num">'+fPesos((+r.cant||0)*(+r.precio||0))+'</td>'
    +'<td><input class="cell-in" value="'+esc(r.factura||'')+'" placeholder="N° factura" onchange="ordRep('+i+',\'factura\',this.value)"></td>'
    +'<td>'+(r.adjunto?'<a class="lnk" href="'+adjUrl(r.adjunto)+'" download="'+esc(r.adjunto.nombre)+'">⬇ '+esc(r.adjunto.nombre.slice(0,14))+'</a>'
        :'<label class="btn-ghost" style="cursor:pointer">📎 Adjuntar<input type="file" accept="image/*,application/pdf" style="display:none" onchange="ordRepFile('+i+',this)"></label>')+'</td>'
    +'<td><button class="btn-ghost" style="color:var(--rojo)" onclick="ordRepDel('+i+')">🗑</button></td></tr>').join('');

  const tiempos=ordenTiempos(o).map(t=>'<div class="bar-row"><div class="bl">'+esc(t.etapa)+'</div>'
    +'<div class="bar-track"><div class="bar-fill" style="width:'+Math.min(100,t.horas/Math.max(1,Math.max.apply(null,ordenTiempos(o).map(x=>x.horas)))*100)+'%"></div></div>'
    +'<div class="bn">'+(t.horas<24?t.horas.toFixed(1)+' h':(t.horas/24).toFixed(1)+' d')+'</div></div>').join('')
    ||'<div class="muted-cell">Todavía no hay cambios de etapa registrados.</div>';

  $('#view-reparaciones').innerHTML=
     '<div class="view-head"><div><button class="btn btn-sm" onclick="repSel=null;renderRep()">‹ Volver</button>'
    +'<h2 style="margin-top:8px">Orden N° '+o.nro+' · '+esc((o.matricula||'').toUpperCase())+'</h2>'
    +'<div class="sub">'+esc(cliNom(o.clienteId))+' · '+(cam?esc(cam.marca+' '+cam.modelo):'camión no cargado')+' · abierta el '+fDate(o.fecha)
      +' · '+esc(o.tipo||'')+' '+pillCargo(o.cargo)+'</div></div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="openForm(\'orden\',\''+o.id+'\')">✎ Editar datos</button>'
    +'<button class="btn btn-primary" onclick="ordenPDF(\''+o.id+'\')">📄 PDF</button></div></div>'


    +'<div class="card"><div class="card-head"><h3>Etapa</h3><span class="csub">Tocá la etapa nueva: queda guardada la fecha y la hora</span></div>'
      +'<div class="card-body" style="display:flex;gap:7px;flex-wrap:wrap">'+pasos+'</div></div>'

    +'<div class="kpis">'
      +kpi('Mano de obra',fPesos(ordenMO(o)),nf(ordenHoras(o),true)+' h · '+(ordenHoras(o)?fPesos(ordenMO(o)/ordenHoras(o))+' la hora en promedio':'sin horas'),'',true)
      +kpi('Repuestos',fPesos(ordenRepuestos(o)),(o.repuestos||[]).length+' ítem(s)','k-amarillo',true)
      +kpi('Total de la orden',fPesos(ordenTotal(o)),o.cargo==='Interno'?'Trabajo interno: no se cobra':'Mano de obra + repuestos','k-verde',true)
      +kpi('Deja de mano de obra',fPesos(ordenGanancia(o)),'Le cuesta al taller '+fPesos(ordenMOCosto(o)),ordenGanancia(o)>=0?'':'k-rojo',true)
    +'</div>'

    +'<div class="grid2">'
      +'<div>'
        +'<div class="card"><div class="card-head"><h3>Pedido y reclamos del cliente</h3></div><div class="card-body">'
          +'<textarea style="width:100%;min-height:70px;padding:9px;border:1px solid var(--border);border-radius:8px" onchange="ordSet(\'peticiones\',this.value)">'+esc(o.peticiones||'')+'</textarea></div></div>'
        +'<div class="card"><div class="card-head"><h3>Diagnóstico del taller</h3><span class="csub">Lo que encontró el mecánico</span></div><div class="card-body">'
          +'<textarea style="width:100%;min-height:70px;padding:9px;border:1px solid var(--border);border-radius:8px" placeholder="Qué se revisó y qué se encontró…" onchange="ordSet(\'diagnostico\',this.value)">'+esc(o.diagnostico||'')+'</textarea></div></div>'
        +'<div class="card"><div class="card-head"><h3>Tareas y horas</h3><span class="csub">El precio de la hora sale del cargo de cada funcionario</span></div>'
          +'<div class="table-wrap" style="border:none;box-shadow:none"><table style="min-width:600px"><thead><tr><th>Funcionario</th><th>Tarea</th><th class="num">Horas</th><th class="num">Se cobra</th><th class="num">Costo</th><th></th></tr></thead>'
          +'<tbody>'+(tareas||filaVacia(6,'Sin tareas cargadas.'))+'</tbody></table></div>'
          +'<div class="card-body"><button class="btn btn-sm" onclick="ordTareaAdd()">+ Agregar tarea</button></div></div>'
        +'<div class="card"><div class="card-head"><h3>Repuestos</h3><span class="csub">Se suman a los gastos del taller</span></div>'
          +'<div class="table-wrap" style="border:none;box-shadow:none"><table style="min-width:640px"><thead><tr><th>Repuesto</th><th class="num">Cant.</th><th class="num">Precio</th><th class="num">Subtotal</th><th>Factura</th><th>Adjunto</th><th></th></tr></thead>'
          +'<tbody>'+(reps||filaVacia(7,'Sin repuestos cargados.'))+'</tbody></table></div>'
          +'<div class="card-body"><button class="btn btn-sm" onclick="ordRepAdd()">+ Agregar repuesto</button></div></div>'
      +'</div>'
      +'<div>'
        +tarjetaEsquema(o)
        +'<div class="card"><div class="card-head"><h3>Checklist de trabajos</h3></div><div class="card-body">'
          +(check||'<div class="muted-cell">Sin tareas en el checklist.</div>')
          +'<button class="btn btn-sm" style="margin-top:8px" onclick="ordChkAdd()">+ Agregar</button></div></div>'
        +'<div class="card"><div class="card-head"><h3>Tiempo por etapa</h3></div><div class="card-body">'+tiempos+'</div></div>'
        +'<div class="card"><div class="card-head"><h3>Servicios a ejecutar</h3></div><div class="card-body">'
          +'<textarea style="width:100%;min-height:60px;padding:9px;border:1px solid var(--border);border-radius:8px" placeholder="Ej.: rectificado en taller externo" onchange="ordSet(\'servicios\',this.value)">'+esc(o.servicios||'')+'</textarea></div></div>'
        +'<div class="card"><div class="card-head"><h3>Ficha de recepción</h3><span class="csub">Cómo entró el camión</span></div><div class="card-body">'
          +'<div class="det-grid">'
            +campo('Matrícula',(o.matricula||'').toUpperCase())+campo('Cliente',cliNom(o.clienteId))
            +campo('Marca y modelo',cam?cam.marca+' '+cam.modelo:'—')
            +campo('Chasis',cam?cam.chasis:'—')+campo('Contacto',cli?(cli.contacto||'')+' '+(cli.tel||''):'—')
            +campo('Km al ingresar',o.km?nf(o.km)+' km':'—')+campo('Horímetro',o.horimetro?nf(o.horimetro)+' h':'—')
            +campo('Combustible',o.combustible)+campo('Asesor de servicio',o.asesorId?funcNom(o.asesorId):'—')
            +campo('Tipo de trabajo',o.tipo)+campo('A cargo de',o.cargo||'Cliente')
            +campo('Lugar',o.lugar||'En el taller')
            +campo('Fecha de inicio',fDate(o.fecha))+campo('Fecha de entrega',fDate(o.fechaEntrega))
          +'</div></div></div>'
      +'</div>'
    +'</div>';
}
function campo(l,v){ return '<div class="det-f"><div class="fl">'+esc(l)+'</div><div class="fv">'+esc(v||'—')+'</div></div>'; }

/* ---------- CAMBIOS EN LA ORDEN ---------- */
function ordObj(){ return Store.get('ordenes',repSel); }
function ordGuardar(o){ Store.upsert('ordenes',o); renderRep(); }
function ordSet(campo,valor){ const o=ordObj(); o[campo]=valor; ordGuardar(o); }
function ordChkAdd(){ const o=ordObj(); (o.checklist=o.checklist||[]).push({t:'',ok:false}); ordGuardar(o); }
function ordChk(i){ const o=ordObj(); o.checklist[i].ok=!o.checklist[i].ok; ordGuardar(o); }
function ordChkTxt(i,v){ const o=ordObj(); o.checklist[i].t=v; Store.upsert('ordenes',o); }
function ordChkDel(i){ const o=ordObj(); o.checklist.splice(i,1); ordGuardar(o); }
function ordTareaAdd(){ const o=ordObj(); (o.tareas=o.tareas||[]).push({funcionarioId:'',horas:0,desc:''}); ordGuardar(o); }
function ordTarea(i,campo,v){ const o=ordObj(); o.tareas[i][campo]=campo==='horas'?(+v||0):v; ordGuardar(o); }
function ordTareaDel(i){ const o=ordObj(); o.tareas.splice(i,1); ordGuardar(o); }
function ordRepAdd(){ const o=ordObj(); (o.repuestos=o.repuestos||[]).push({desc:'',cant:1,precio:0,factura:''}); ordGuardar(o); }
function ordRep(i,campo,v){ const o=ordObj(); o.repuestos[i][campo]=(campo==='cant'||campo==='precio')?(+v||0):v; ordGuardar(o); }
function ordRepDel(i){ const o=ordObj(); o.repuestos.splice(i,1); ordGuardar(o); }
async function ordRepFile(i,input){
  const f=input.files[0]; if(!f)return;
  const a=await adjSubir(f); input.value=''; if(!a) return;
  const o=ordObj(); adjBorrar(o.repuestos[i].adjunto); o.repuestos[i].adjunto=a;
  ordGuardar(o); toast('Factura adjuntada');
}

/* ---------- PDF DE LA ORDEN ---------- */
function ordenPDF(id){
  const o=Store.get('ordenes',id), cam=camionPorMat(o.matricula), cli=Store.get('clientes',o.clienteId);
  const tar=(o.tareas||[]).map(t=>'<tr><td>'+esc(funcNom(t.funcionarioId))+'</td><td>'+esc(t.desc||'')+'</td><td class="n">'+nf(t.horas)+'</td></tr>').join('');
  const rep=(o.repuestos||[]).map(r=>'<tr><td>'+esc(r.desc)+'</td><td class="n">'+nf(r.cant)+'</td><td class="n">'+fPesos(r.precio)+'</td><td class="n">'+fPesos((+r.cant||0)*(+r.precio||0))+'</td></tr>').join('');
  const chk=(o.checklist||[]).map(c=>'<li>'+(c.ok?'☑':'☐')+' '+esc(c.t)+'</li>').join('');
  abrirPDF('Orden N° '+o.nro,
     '<div class="meta"><div><b>Orden N° '+o.nro+'</b><br>Inicio: '+fDate(o.fecha)+'<br>Entrega: '+fDate(o.fechaEntrega)+'<br>Etapa: '+etapaN(o.etapa)+'</div>'
    +'<div><b>Cliente</b><br>'+esc(cli?cli.nombre:'—')+(cli&&cli.tel?'<br>'+esc(cli.tel):'')+'</div>'
    +'<div><b>Camión</b><br>'+esc((o.matricula||'').toUpperCase())+(cam?'<br>'+esc(cam.marca+' '+cam.modelo)+'<br>Chasis '+esc(cam.chasis||'—'):'')+'</div>'
    +'<div><b>Recepción</b><br>Km '+(o.km?nf(o.km):'—')+'<br>Horímetro '+(o.horimetro?nf(o.horimetro):'—')+'<br>Combustible '+esc(o.combustible||'—')+'</div>'
    +'<div><b>Trabajo</b><br>'+esc(o.tipo||'—')+'<br>A cargo de: '+esc(o.cargo||'Cliente')+'<br>Asesor: '+esc(o.asesorId?funcNom(o.asesorId):'—')+'</div></div>'
    +(o.peticiones?'<h3>Pedido y reclamos del cliente</h3><p class="txt">'+esc(o.peticiones)+'</p>':'')
    +(o.diagnostico?'<h3>Diagnóstico del taller</h3><p class="txt">'+esc(o.diagnostico)+'</p>':'')
    +(chk?'<h3>Trabajos</h3><ul style="font-size:12.5px">'+chk+'</ul>':'')
    +(tar?'<h3>Mano de obra</h3><table><thead><tr><th>Funcionario</th><th>Tarea</th><th class="n">Horas</th></tr></thead><tbody>'+tar+'</tbody></table>':'')
    +(rep?'<h3>Repuestos</h3><table><thead><tr><th>Repuesto</th><th class="n">Cant.</th><th class="n">Precio</th><th class="n">Subtotal</th></tr></thead><tbody>'+rep+'</tbody></table>':'')
    +(o.servicios?'<h3>Servicios</h3><p class="txt">'+esc(o.servicios)+'</p>':'')
    +'<div class="total">TOTAL: '+fPesos(ordenTotal(o))+'</div>'
    +((o.danios&&Object.keys(o.danios).length)?'<h3>Estado del camión al ingresar</h3><div class="esq-pdf">'+esquemaCamion(o.danios,false)+listaDanios(o.danios)+'</div>':'')
    +bloquePago());
}
