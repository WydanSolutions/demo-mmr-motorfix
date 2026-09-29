/*
 * PRESUPUESTOS. Se arma el diagnóstico antes de recibir el camión y se manda por
 * WhatsApp, mail o PDF. Cuando el cliente lo aprueba, la orden de reparación se crea sola.
 * El envío y el PDF están en presupuesto-envio.js.
 */
let presSel=null;   // id del presupuesto que se está editando (null = lista)

/* Total de un presupuesto (siempre en pesos; se muestra en la moneda elegida) */
function presTotal(p){ return (p.lineas||[]).reduce((s,l)=>s+(+l.cant||0)*(+l.precio||0),0); }
function presTotalPor(p,tipo){ return (p.lineas||[]).filter(l=>l.tipo===tipo).reduce((s,l)=>s+(+l.cant||0)*(+l.precio||0),0); }
function presVence(p){ if(!p.fecha)return ''; const d=new Date(p.fecha); d.setDate(d.getDate()+(+p.validezDias||15)); return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate()); }

function renderPresup(){ presSel?presEditor():presLista(); }

/* ---------- LISTA ---------- */
let presFiltroEst='';
function presLista(){
  const todos=Store.all('presupuestos').filter(p=>esDelMes(p.fecha)).reverse();
  const lista=todos.filter(p=>!presFiltroEst||p.estado===presFiltroEst);
  const filas=lista.map(p=>{
    const vence=presVence(p), vencido=p.estado==='Enviado'&&vence&&vence<hoyISO();
    return '<tr>'
      +'<td class="nom">#'+p.nro+'</td>'
      +'<td class="muted-cell">'+fDate(p.fecha)+'</td>'
      +'<td>'+matTag(p.matricula)+'</td>'
      +'<td class="nom">'+esc(cliNom(p.clienteId))+'</td>'
      +'<td class="muted-cell">'+esc(p.asunto||'—')+'</td>'
      +'<td class="num">'+fPesos(presTotal(p))+'</td>'
      +'<td>'+pillCambiable(p.estado,PRES_CLS[p.estado]||'p-gris',PRES_EST,'presFijarEstado',p.id)
        +(vencido?' <span class="pill p-rojo">Vencido</span>':'')+'</td>'
      +'<td><div class="row-act">'
        +'<button class="btn-ghost" title="Abrir" onclick="presAbrir(\''+p.id+'\')">✎</button>'
        +'<button class="btn-ghost" title="Eliminar" style="color:var(--rojo)" onclick="borrar(\'presupuestos\',\''+p.id+'\')">🗑</button>'
      +'</div></td></tr>';
  }).join('');

  const tot=lista.reduce((s,p)=>s+presTotal(p),0);
  const aprob=lista.filter(p=>p.estado==='Aprobado').reduce((s,p)=>s+presTotal(p),0);

  $('#view-presup').innerHTML=
     '<div class="view-head"><div><h2>Presupuestos</h2><div class="sub">Armá el diagnóstico y mandáselo al cliente por WhatsApp, mail o PDF.</div></div>'
    +'<button class="btn btn-primary" onclick="presNuevo()">+ Nuevo presupuesto</button></div>'
    +barraMes()
    +'<div class="kpis">'
      +kpi('Presupuestos del mes',lista.length,'Total '+fPesos(tot),'')
      +kpi('Aprobados',lista.filter(p=>p.estado==='Aprobado').length,fPesos(aprob),'k-verde')
      +kpi('Esperando respuesta',lista.filter(p=>p.estado==='Enviado').length,'Enviados al cliente','k-amarillo')
      +kpi('Rechazados',lista.filter(p=>p.estado==='Rechazado').length,'','k-rojo')
    +'</div>'
    +'<div class="toolbar"><select class="filt" onchange="presFiltroEst=this.value;renderPresup()">'
      +'<option value="">Todos los estados</option>'+selectOps(PRES_EST,presFiltroEst)+'</select>'
      +'<div class="spacer"></div>'+botonesExport('presupuestos')+'</div>'
    +'<div class="table-wrap"><table><thead><tr><th>N°</th><th>Fecha</th><th>Matrícula</th><th>Cliente</th><th>Asunto</th><th class="num">Total</th><th>Estado</th><th></th></tr></thead>'
    +'<tbody>'+(filas||filaVacia(8,'No hay presupuestos en '+MESES_L[MES]+' '+ANIO+'.'))+'</tbody></table></div>';
}

function presNuevo(){
  const p=Store.upsert('presupuestos',{nro:Store.siguienteNro('pres'),fecha:hoyISO(),validezDias:Store.cfg().validezDias||15,
    matricula:'',clienteId:'',asunto:'',lineas:[{desc:'',cant:1,precio:0,tipo:'Repuesto'}],mostrarPrecios:true,texto:'',
    imagenes:[],estado:'Borrador',envios:[]});
  presAbrir(p.id);
}
function presAbrir(id){ presSel=id; renderPresup(); adjCargarDe(Store.get('presupuestos',id)).then(function(){ if(presSel===id) renderPresup(); }); }
function presVolver(){ presSel=null; renderPresup(); }

/* ---------- EDITOR ---------- */
function presEditor(){
  const p=Store.get('presupuestos',presSel); if(!p){ presVolver(); return; }
  const cli=Store.get('clientes',p.clienteId), cam=camionPorMat(p.matricula);
  const total=presTotal(p);

  const lineas=(p.lineas||[]).map((l,i)=>
     '<div class="lin-row">'
    +'<input class="desc" value="'+esc(l.desc)+'" placeholder="Descripción del trabajo o repuesto" onchange="presLin('+i+',\'desc\',this.value)">'
    +'<select onchange="presLin('+i+',\'tipo\',this.value)">'+selectOps(TIPOS_LINEA,l.tipo)+'</select>'
    +'<input type="number" step="0.01" value="'+(l.cant||0)+'" placeholder="Cant." onchange="presLin('+i+',\'cant\',this.value)">'
    +'<input type="number" step="0.01" value="'+(l.precio||0)+'" placeholder="Precio unit." onchange="presLin('+i+',\'precio\',this.value)">'
    +'<div class="sub">'+fPesos((+l.cant||0)*(+l.precio||0))+'</div>'
    +'<button class="lin-x" title="Quitar" onclick="presLinDel('+i+')">×</button></div>').join('');

  const imgs=(p.imagenes||[]).map((im,i)=>'<div class="imgbox"><img src="'+adjUrl(im)+'" alt="'+esc(im.nombre)+'">'
    +'<button class="ix" title="Quitar" onclick="presImgDel('+i+')">×</button>'
    +'<a class="idl" title="Descargar (para adjuntar en WhatsApp)" href="'+adjUrl(im)+'" download="'+esc(im.nombre)+'">⬇</a></div>').join('');

  const plantillas=(Store.cfg().plantillas||[]);

  $('#view-presup').innerHTML=
     '<div class="view-head"><div><button class="btn btn-sm" onclick="presVolver()">‹ Volver a la lista</button>'
    +'<h2 style="margin-top:8px">Presupuesto N° '+p.nro+'</h2>'
    +'<div class="sub">'+fDate(p.fecha)+' · Válido hasta el '+fDate(presVence(p))+' · '+pillEstPres(p.estado)+'</div></div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
      +'<button class="btn wa-btn" onclick="presWhatsApp()">WhatsApp</button>'
      +'<button class="btn" onclick="presMail()">✉ Mail</button>'
      +'<button class="btn btn-primary" onclick="presPDF()">📄 PDF</button>'
    +'</div></div>'

    +'<div class="card"><div class="card-head"><h3>Datos</h3><span class="csub">Escribí la matrícula y se completa solo el resto</span></div><div class="card-body">'
      +'<div class="field-3">'
        +'<div class="field"><label>Matrícula</label><input list="dl-matriculas" value="'+esc((p.matricula||'').toUpperCase())+'" placeholder="Ej.: RIA1234" onchange="presMat(this.value)">'
          +'<div class="hint">'+(cam?esc(cam.marca+' '+cam.modelo+(cam.anio?' · '+cam.anio:'')):'Sin camión cargado con esa matrícula')+'</div></div>'
        +'<div class="field"><label>Cliente</label>'+selectCli(p.clienteId,'onchange="presSet(\'clienteId\',this.value)"')+'</div>'
        +'<div class="field"><label>Fecha</label><input type="date"'+DR+' value="'+(p.fecha||'')+'" onchange="if(dateOk(this))presSet(\'fecha\',this.value)"></div>'
      +'</div>'
      +'<div class="field-3">'
        +'<div class="field"><label>Asunto</label><input value="'+esc(p.asunto||'')+'" placeholder="Ej.: Reparación de caja de cambios" onchange="presSet(\'asunto\',this.value)"></div>'
        +'<div class="field"><label>Validez (días)</label><input type="number" min="1" max="365" value="'+(p.validezDias||15)+'" onchange="presSet(\'validezDias\',+this.value)"></div>'
        +'<div class="field"><label>Estado</label><select onchange="presEstado(this.value)">'+selectOps(PRES_EST,p.estado)+'</select>'
          +'<div class="hint">Al pasar a <b>Aprobado</b> se crea la orden de reparación.</div></div>'
      +'</div>'
      +'<div class="field"><label>Saludo (se pone solo según la hora)</label><input value="'+esc(p.saludoTxt||(saludo()+(cli&&cli.contacto?', '+cli.contacto:'')))+'" onchange="presSet(\'saludoTxt\',this.value)"></div>'
    +'</div></div>'

    +'<div class="card"><div class="card-head"><h3>Diagnóstico</h3>'
      +'<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'
        +(plantillas.length?'<select class="filt" onchange="presPlantilla(this.value);this.value=\'\'"><option value="">Usar una plantilla…</option>'+plantillas.map((t,i)=>'<option value="'+i+'">'+esc(t.nombre)+'</option>').join('')+'</select>':'')
        +'<button class="btn btn-sm" onclick="presGuardarPlantilla()">Guardar como plantilla</button></div></div>'
      +'<div class="card-body">'
      +'<div class="field"><label>Texto libre (lo que se explica con palabras)</label><textarea placeholder="Contá qué se revisó y qué se propone hacer…" onchange="presSet(\'texto\',this.value)">'+esc(p.texto||'')+'</textarea></div>'
      +'<div class="subt">Líneas del presupuesto</div>'
      +'<div class="lin-head"><div>Descripción</div><div>Tipo</div><div>Cantidad</div><div>Precio unit.</div><div style="text-align:right">Subtotal</div><div></div></div>'
      +lineas
      +'<button class="btn btn-sm" onclick="presLinAdd()">+ Agregar línea</button>'
      +'<div class="pres-tot"><div>TOTAL</div><div>'+fPesos(total)+'</div></div>'
      +(p.mostrarPrecios?'<div class="muted-cell" style="text-align:right;margin-top:4px">Repuestos '+fPesos(presTotalPor(p,'Repuesto'))+' · Mano de obra '+fPesos(presTotalPor(p,'Mano de obra'))+' · Servicios '+fPesos(presTotalPor(p,'Servicio'))+'</div>':'')
      +'<div class="sepline"></div>'
      +'<div class="srow"><div><div class="st">Mostrar los precios de cada línea</div><div class="ss">Si está apagado, el cliente ve solo el total.</div></div>'
        +'<label class="switch"><input type="checkbox"'+(p.mostrarPrecios?' checked':'')+' onchange="presSet(\'mostrarPrecios\',this.checked)"><span class="sl"></span></label></div>'
      +'<div class="srow"><div><div class="st">Mostrar el detalle por tipo</div><div class="ss">Repuestos, mano de obra y servicios discriminados.</div></div>'
        +'<label class="switch"><input type="checkbox"'+(p.discriminar?' checked':'')+' onchange="presSet(\'discriminar\',this.checked)"><span class="sl"></span></label></div>'
    +'</div></div>'

    +'<div class="card"><div class="card-head"><h3>Imágenes</h3><span class="csub">Van en el PDF y en el mail. Para WhatsApp se descargan y se adjuntan a mano.</span></div>'
      +'<div class="card-body"><div class="imgs">'+imgs+'</div>'
      +'<label class="upl" style="margin-top:10px">📷 Agregar imágenes<input type="file" accept="image/*" multiple onchange="presImgAdd(this)"></label></div></div>'

    +'<div class="card"><div class="card-head"><h3>Envíos</h3><span class="csub">Queda registrado todo lo que se mandó</span></div><div class="card-body">'
      +((p.envios||[]).length?(p.envios||[]).map(e=>'<div class="srow"><div><div class="st">'+esc(e.via)+'</div><div class="ss">'+esc(e.destino||'')+'</div></div><div class="muted-cell">'+fDate(e.fecha)+'</div></div>').join(''):'<div class="empty"><p>Todavía no se envió.</p></div>')
    +'</div></div>';
}

/* ---------- CAMBIOS EN EL PRESUPUESTO ---------- */
function presObj(){ return Store.get('presupuestos',presSel); }
function presSet(campo,valor){ const p=presObj(); p[campo]=valor; Store.upsert('presupuestos',p); renderPresup(); }
function presMat(v){
  const p=presObj(); p.matricula=normMat(v);
  const f=fichaPorMat(p.matricula);
  if(f&&f.cliente) p.clienteId=f.cliente.id;
  Store.upsert('presupuestos',p);
  if(!f&&p.matricula) toast('Esa matrícula no está cargada. Podés darla de alta en Camiones.');
  renderPresup();
}
function presLin(i,campo,valor){ const p=presObj(); p.lineas[i][campo]=(campo==='cant'||campo==='precio')?(+valor||0):valor; Store.upsert('presupuestos',p); renderPresup(); }
function presLinAdd(){ const p=presObj(); (p.lineas=p.lineas||[]).push({desc:'',cant:1,precio:0,tipo:'Repuesto'}); Store.upsert('presupuestos',p); renderPresup(); }
function presLinDel(i){ const p=presObj(); p.lineas.splice(i,1); Store.upsert('presupuestos',p); renderPresup(); }
async function presImgAdd(input){
  const p=presObj(); p.imagenes=p.imagenes||[];
  let n=0;
  for(const f of Array.from(input.files)){
    const a=await adjSubir(f); if(!a) continue;
    p.imagenes.push(a); n++;
  }
  input.value='';
  Store.upsert('presupuestos',p); renderPresup();
  if(n) toast(n===1?'Imagen agregada':n+' imágenes agregadas');
}
function presImgDel(i){ const p=presObj(); adjBorrar(p.imagenes[i]); p.imagenes.splice(i,1); Store.upsert('presupuestos',p); renderPresup(); }

/* Al aprobar un presupuesto se crea la orden de reparación automáticamente.
   Se puede cambiar desde el editor o desde la etiqueta de la lista. */
function presEstado(est){ presFijarEstado(presSel,est); }
function presFijarEstado(id,est){
  const p=Store.get('presupuestos',id); if(!p)return;
  const antes=p.estado; p.estado=est; Store.upsert('presupuestos',p);
  if(est==='Aprobado'&&antes!=='Aprobado'&&!Store.all('ordenes').some(o=>o.presupuestoId===p.id)){
    const o=Store.upsert('ordenes',{nro:Store.siguienteNro('orden'),matricula:p.matricula,clienteId:p.clienteId,
      tipo:'Correctivo',cargo:'Cliente',prioridad:'Media',fecha:hoyISO(),etapa:'recibimiento',presupuestoId:p.id,
      peticiones:(p.asunto||'')+(p.texto?'\n'+p.texto:''),checklist:[],tareas:[],
      repuestos:(p.lineas||[]).filter(l=>l.tipo==='Repuesto'&&l.desc).map(l=>({desc:l.desc,cant:+l.cant||1,precio:+l.precio||0,factura:''})),
      servicios:(p.lineas||[]).filter(l=>l.tipo==='Servicio').map(l=>l.desc).join(', '),
      tiempos:{recibimiento:hoyISO()+'T00:00'},notas:'Creada desde el presupuesto N° '+p.nro});
    toast('✓ Se creó la orden de reparación N° '+o.nro);
  }else toast('Presupuesto N° '+p.nro+': '+est);
  renderView(CUR);
}

/* ---------- PLANTILLAS DE DIAGNÓSTICO ---------- */
function presGuardarPlantilla(){
  const p=presObj();
  preguntar('Guardar como plantilla','Nombre de la plantilla',p.asunto||'',function(n){
    const cfg=Store.cfg();
    cfg.plantillas.push({nombre:n,asunto:p.asunto||'',texto:p.texto||'',lineas:JSON.parse(JSON.stringify(p.lineas||[]))});
    Store.guardarCfg(); toast('Plantilla guardada'); renderPresup();
  });
}
function presPlantilla(i){
  const t=Store.cfg().plantillas[+i]; if(!t)return;
  const p=presObj(); p.asunto=p.asunto||t.asunto; p.texto=t.texto;
  p.lineas=JSON.parse(JSON.stringify(t.lineas||[]));
  Store.upsert('presupuestos',p); renderPresup(); toast('Plantilla aplicada');
}
