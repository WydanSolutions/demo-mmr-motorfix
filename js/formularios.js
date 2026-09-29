/*
 * VENTANA DE ALTA Y EDICIÓN (la misma para todas las secciones).
 * openForm('cliente') abre vacío para crear; openForm('cliente', id) abre para editar.
 */
function openModal(titulo,cuerpo,onSave,txtGuardar,izquierda,ancho){
  $('#modal-title').textContent=titulo;
  $('#modal-body').innerHTML=cuerpo;
  $('#modal-left').innerHTML=izquierda||'';
  $('#modal').classList.toggle('wide',!!ancho);
  const b=$('#modal-save'); b.textContent=txtGuardar||'Guardar'; b.onclick=onSave;
  b.className='btn btn-primary'; b.style.display='';   // vuelve al botón normal (confirmar() lo puede poner rojo)
  $('#modal-bg').classList.add('open');
}
function closeModal(){ $('#modal-bg').classList.remove('open'); }
function campoIn(label,id,valor,tipo,extra){
  return '<div class="field"><label>'+esc(label)+'</label><input id="'+id+'"'+(tipo?' type="'+tipo+'"':'')
    +(tipo==='date'?DR:'')+(extra||'')+' value="'+esc(valor==null?'':valor)+'"></div>';
}
function campoSel(label,id,opciones,sel,vacio){
  return '<div class="field"><label>'+esc(label)+'</label><select id="'+id+'">'
    +(vacio?'<option value="">'+esc(vacio)+'</option>':'')+selectOps(opciones,sel)+'</select></div>';
}
function campoArea(label,id,valor){ return '<div class="field"><label>'+esc(label)+'</label><textarea id="'+id+'">'+esc(valor||'')+'</textarea></div>'; }
const v=id=>{ const e=document.getElementById(id); return e?e.value.trim():''; };
const cliNomOVacio=id=>{ const c=id?Store.get('clientes',id):null; return c?c.nombre:''; };
/* Botones Cliente / Proveedor / Las dos cosas del formulario de contacto */
function elegirTipo(btn,tipo){
  btn.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===btn));
  document.getElementById('f-tipo').value=tipo;
  const t=$('#modal-title');
  if(t.textContent.indexOf('Nuevo')===0) t.textContent=tipo==='Proveedor'?'Nuevo proveedor':tipo==='Ambos'?'Nuevo cliente y proveedor':'Nuevo cliente';
}

/* Acepta el nombre en singular ('orden') o el de la colección ('ordenes'): las dos formas
   se usan en las tablas, y antes el lápiz de Reparaciones no abría nada por esta diferencia. */
const FORM_COL={cliente:'clientes',camion:'camiones',orden:'ordenes',movimiento:'movimientos',funcionario:'funcionarios'};
function openForm(kind,id,preset){
  preset=preset||{};
  if(kind==='presupuesto'||kind==='presupuestos'){ presNuevo(); return; }
  Object.keys(FORM_COL).forEach(k=>{ if(FORM_COL[k]===kind) kind=k; });
  const col=FORM_COL[kind];
  if(!col){ console.warn('openForm: no existe el formulario «'+kind+'»'); return; }
  const o=id?Object.assign({},Store.get(col,id)):Object.assign({},preset);

  if(kind==='cliente') formCliente(o);
  else if(kind==='camion') formCamion(o);
  else if(kind==='orden') formOrden(o);
  else if(kind==='movimiento') formMovimiento(o);
  else if(kind==='funcionario') formFuncionario(o);
}

/* ---------- CLIENTE ---------- */
function formCliente(o){
  const tipo=o.tipo||'Cliente';
  openModal(o.id?'Editar ficha':(tipo==='Proveedor'?'Nuevo proveedor':'Nuevo cliente'),
    /* La clasificación va arriba de todo y bien a la vista: tres botones, uno marcado */
     '<div class="field"><label>¿Qué es?</label>'
      +'<div class="seg-tipo" id="f-tipo-seg">'
        +['Cliente','Proveedor','Ambos'].map(t=>'<button type="button" class="'+(tipo===t?'on':'')+'" onclick="elegirTipo(this,\''+t+'\')">'
          +(t==='Cliente'?'👤 Cliente':t==='Proveedor'?'📦 Proveedor':'🔁 Las dos cosas')+'</button>').join('')
      +'</div><input type="hidden" id="f-tipo" value="'+tipo+'">'
      +'<div class="hint">Los <b>proveedores</b> aparecen al cargar un gasto; los <b>clientes</b>, al cargar un cobro o una orden.</div></div>'
    +campoIn('Nombre o razón social','f-nombre',o.nombre)
    +'<div class="field-2">'+campoIn('N° de cliente','f-nro',o.nro,'number')+campoIn('Contacto','f-contacto',o.contacto)+'</div>'
    +'<div class="field-2">'+campoIn('RUT','f-rut',o.rut)+campoIn('Cédula','f-ci',o.ci)+'</div>'
    +'<div class="field-3">'+campoIn('Teléfono 1','f-tel',o.tel)+campoIn('Teléfono 2','f-tel2',o.tel2)+campoIn('Teléfono 3','f-tel3',o.tel3)+'</div>'
    +campoIn('Correo','f-mail',o.mail,'email')
    +campoIn('Dirección','f-direccion',o.direccion)
    +'<div class="field-2">'+campoIn('Ciudad','f-ciudad',o.ciudad)+campoSel('Departamento','f-depto',DEPTOS,o.depto,'—')+'</div>'
    +campoArea('Notas','f-notas',o.notas),
    function(){
      if(!v('f-nombre')){ toast('Poné el nombre'); return; }
      Store.upsert('clientes',Object.assign(o,{nombre:v('f-nombre'),tipo:v('f-tipo'),nro:+v('f-nro')||'',contacto:v('f-contacto'),
        rut:v('f-rut'),ci:v('f-ci'),tel:v('f-tel'),tel2:v('f-tel2'),tel3:v('f-tel3'),mail:v('f-mail'),direccion:v('f-direccion'),
        ciudad:v('f-ciudad'),depto:v('f-depto'),notas:v('f-notas')}));
      closeModal(); toast('Cliente guardado'); renderView(CUR);
    });
}

/* ---------- CAMIÓN ---------- */
function formCamion(o){
  openModal(o.id?'Editar camión':'Nuevo camión',
     '<div class="field-3">'+campoIn('Matrícula','f-matricula',(o.matricula||'').toUpperCase(),'','style="text-transform:uppercase"')
    +campoSel('País de la matrícula','f-pais',PAISES_MAT,o.pais||'Uruguay')
    +'<div class="field"><label>Cliente</label>'+selectCli(o.clienteId,'id="f-cliente"')+'</div></div>'
    +'<div class="field-2">'+campoSel('Marca','f-marca',Store.cfg().marcas,o.marca,'—')+campoIn('Modelo','f-modelo',o.modelo)+'</div>'
    +'<div class="field-3">'+campoIn('Año','f-anio',o.anio,'number')+campoIn('Color','f-color',o.color)+campoIn('Fecha de venta','f-fventa',o.fventa,'date')+'</div>'
    +'<div class="field-2">'+campoIn('Kilómetros','f-km',o.km,'number')+campoIn('Horímetro (horas de motor)','f-horimetro',o.horimetro,'number')+'</div>'
    +'<div class="field-2">'+campoIn('Chasis (17 dígitos)','f-chasis',o.chasis,'','maxlength="17" style="text-transform:uppercase"')
      +campoIn('Chasis largo','f-chasisLargo',o.chasisLargo,'','style="text-transform:uppercase"')+'</div>'
    +campoIn('N° de motor','f-motor',o.motor)
    +campoArea('Notas','f-notas',o.notas),
    function(){
      const mat=normMat(v('f-matricula'));
      if(!mat){ toast('Poné la matrícula'); return; }
      const otro=camionPorMat(mat);
      if(otro&&otro.id!==o.id){ toast('Ya hay un camión con esa matrícula'); return; }
      if(!modalDatesOk())return;
      Store.upsert('camiones',Object.assign(o,{matricula:mat,pais:v('f-pais')||'Uruguay',clienteId:v('f-cliente'),marca:v('f-marca'),modelo:v('f-modelo'),
        anio:+v('f-anio')||'',color:v('f-color'),fventa:v('f-fventa'),km:+v('f-km')||0,
        horimetro:+v('f-horimetro')||0,chasis:v('f-chasis').toUpperCase(),chasisLargo:v('f-chasisLargo').toUpperCase(),
        motor:v('f-motor'),notas:v('f-notas')}));
      closeModal(); toast('Camión guardado'); renderView(CUR);
    });
}

/* ---------- ORDEN DE REPARACIÓN ---------- */
function formOrden(o){
  const esNueva=!o.id;
  openModal(esNueva?'Nueva orden de reparación':'Editar orden N° '+o.nro,
     '<div class="field-2">'
      +'<div class="field"><label>Matrícula <span class="req">*</span></label><input id="f-matricula" list="dl-matriculas" style="text-transform:uppercase" value="'+esc((o.matricula||'').toUpperCase())+'" oninput="ordenAuto()">'
      +'<div class="hint" id="f-ficha">Escribí la matrícula y se completa el cliente.</div></div>'
      +'<div class="field"><label>Cliente</label>'+selectCli(o.clienteId,'id="f-cliente"')+'</div></div>'
    +'<div class="field-3">'+campoSel('Tipo de trabajo','f-tipo',TIPOS_ORDEN,o.tipo||'Correctivo')
      +campoSel('A cargo de','f-cargo',CARGOS,o.cargo||'Cliente')
      +campoSel('Prioridad','f-prioridad',PRIORIDADES,o.prioridad||'Media')+'</div>'
    +'<div class="field-3">'+campoSel('Etapa','f-etapa',ETAPAS.map(e=>e.n),etapaN(o.etapa||'recibimiento'))
      +'<div class="field"><label>Asesor de servicio</label>'+selectFunc(o.asesorId,'id="f-asesor"')+'</div>'
      +campoSel('Lugar del trabajo','f-lugar',LUGARES,o.lugar||'En el taller')+'</div>'
    +'<div class="field-2">'+campoIn('Fecha de inicio','f-fecha',o.fecha||hoyISO(),'date')
      +campoIn('Fecha de entrega','f-fechaEntrega',o.fechaEntrega,'date')+'</div>'
    +'<div class="subt">Recepción del camión</div>'
    +'<div class="field-3">'+campoIn('Kilómetros al ingresar','f-km',o.km,'number')
      +campoIn('Horímetro al ingresar','f-horimetro',o.horimetro,'number')
      +campoSel('Combustible','f-combustible',COMBUSTIBLE,o.combustible,'')+'</div>'
    +campoArea('Pedido y reclamos del cliente','f-peticiones',o.peticiones)
    +campoArea('Diagnóstico del taller','f-diagnostico',o.diagnostico)
    +'<div class="field"><label>Checklist (una tarea por renglón)</label><textarea id="f-check" placeholder="Escanear motor&#10;Cambiar filtros">'
      +esc((o.checklist||[]).map(c=>c.t).join('\n'))+'</textarea></div>',
    function(){
      const mat=normMat(v('f-matricula'));
      if(!mat){ toast('Poné la matrícula del camión'); return; }
      if(!modalDatesOk())return;
      const etapaId=(ETAPAS.find(e=>e.n===v('f-etapa'))||ETAPAS[0]).id;
      const viejas=(o.checklist||[]);
      const check=v('f-check').split('\n').map(t=>t.trim()).filter(Boolean).map(t=>{
        const ant=viejas.find(c=>c.t===t); return {t:t,ok:ant?ant.ok:false}; });
      const tiempos=o.tiempos||{};
      if(!tiempos[etapaId]) tiempos[etapaId]=(v('f-fecha')||hoyISO())+'T08:00';
      const nueva=Object.assign(o,{matricula:mat,clienteId:v('f-cliente'),tipo:v('f-tipo'),cargo:v('f-cargo'),
        prioridad:v('f-prioridad'),etapa:etapaId,asesorId:v('f-asesor'),lugar:v('f-lugar'),
        fecha:v('f-fecha'),fechaEntrega:v('f-fechaEntrega'),
        km:+v('f-km')||0,horimetro:+v('f-horimetro')||0,combustible:v('f-combustible'),
        peticiones:v('f-peticiones'),diagnostico:v('f-diagnostico'),checklist:check,tiempos:tiempos});
      /* El kilometraje que se anota al recibir el camión actualiza la ficha de la unidad */
      const cam=camionPorMat(mat);
      if(cam&&nueva.km&&nueva.km>(+cam.km||0)){ cam.km=nueva.km; if(nueva.horimetro)cam.horimetro=nueva.horimetro; Store.upsert('camiones',cam); }
      if(esNueva){ nueva.nro=Store.siguienteNro('orden'); nueva.tareas=nueva.tareas||[]; nueva.repuestos=nueva.repuestos||[]; }
      const g=Store.upsert('ordenes',nueva);
      closeModal(); toast('Orden guardada'); repSel=g.id; switchView('reparaciones');
    });
  ordenAuto();
}
/* Al escribir la matrícula trae el cliente y muestra la ficha del camión */
function ordenAuto(){
  const el=document.getElementById('f-matricula'); if(!el)return;
  const f=fichaPorMat(el.value), h=document.getElementById('f-ficha');
  if(f){ if(f.cliente) document.getElementById('f-cliente').value=f.cliente.id;
    h.innerHTML='✓ '+esc(f.camion.marca+' '+f.camion.modelo+(f.camion.anio?' · '+f.camion.anio:''))+' — '+esc(f.cliente?f.cliente.nombre:'sin cliente');
  }else h.textContent=el.value?'Esa matrícula no está cargada: se puede dar de alta en Camiones.':'Escribí la matrícula y se completa el cliente.';
}

/* ---------- MOVIMIENTO DE FINANZAS ---------- */
function formMovimiento(o){
  const esGasto=(o.tipo||'cobro')==='gasto';
  const cfg=Store.cfg();
  /* Si se entró por "+ Gasto" es un gasto y si se entró por "+ Cobro" es un cobro: no se vuelve a preguntar. */
  openModal(o.id?(esGasto?'Editar gasto':'Editar cobro'):(esGasto?'Nuevo gasto':'Nuevo cobro'),
     '<input type="hidden" id="f-tipo" value="'+(esGasto?'gasto':'cobro')+'">'
    +campoIn('Fecha','f-fecha',o.fecha||hoyISO(),'date')
    +campoIn('Concepto','f-concepto',o.concepto)
    +(esGasto
      ?'<div class="field-2">'+campoSel('Categoría','f-categoria',cfg.categorias,o.categoria,'—')
        +'<div class="field"><label>Proveedor</label>'
        +'<input id="f-proveedor" list="dl-proveedores" autocomplete="off" placeholder="Escribí y se va filtrando…" value="'+esc(cliNomOVacio(o.proveedorId))+'">'
        +'<div class="hint">Si no está en la lista, se agrega solo a Clientes y proveedores.</div></div></div>'
      :'<div class="field"><label>Cliente</label>'
        +'<input id="f-cliente" list="dl-clientes" autocomplete="off" placeholder="Escribí y se va filtrando…" value="'+esc(cliNomOVacio(o.clienteId))+'"></div>')
    +'<div class="field-3">'+campoIn('Importe','f-importe',o.importe,'number','step="0.01"')
      +'<div class="field"><label>Moneda</label><select id="f-moneda" onchange="movMoneda()">'
        +MONEDAS.map(m=>'<option value="'+m+'"'+((o.moneda||'UYU')===m?' selected':'')+'>'+MON_SIM[m]+' '+MON_NOM[m]+'</option>').join('')+'</select></div>'
      +'<div class="field"><label id="f-cot-lbl">Cotización del día</label>'
        +'<input id="f-cotizacion" type="number" step="0.01" value="'+(o.cotizacion||'')+'"></div>'+'</div>'
    +'<div class="field-2">'+campoSel('Medio de pago','f-medio',cfg.medios,o.medio,'—')
      +campoSel('Estado','f-estado',esGasto?['pagado','pendiente']:['cobrado','pendiente'],o.estado||(esGasto?'pagado':'cobrado'))+'</div>'
    +'<div class="field-2">'+campoIn(esGasto?'Vence el (si está pendiente)':'Vence el','f-vence',o.vence,'date')+campoIn('Cuotas','f-cuotas',o.cuotas||1,'number')+'</div>'
    +'<div class="hint">Si el importe no está en pesos, se guarda la cotización del día de la fecha: aunque después cambie el dólar o el real, este movimiento se convierte siempre con ese valor. Si queda <b>pendiente</b> y pasa la fecha de vencimiento, aparece como <b>vencido</b>.</div>',
    function(){
      if(!modalDatesOk())return;
      if(!+v('f-importe')){ toast('Poné el importe'); return; }
      const mon=v('f-moneda'), gasto=v('f-tipo')==='gasto';
      Store.upsert('movimientos',Object.assign(o,{tipo:v('f-tipo'),fecha:v('f-fecha'),concepto:v('f-concepto'),
        categoria:v('f-categoria'),
        clienteId:gasto?(o.clienteId||''):buscarOCrear(v('f-cliente'),'Cliente'),
        proveedorId:gasto?buscarOCrear(v('f-proveedor'),'Proveedor'):(o.proveedorId||''),
        importe:+v('f-importe')||0,moneda:mon,
        cotizacion:mon==='UYU'?0:(+v('f-cotizacion')||getTipoCambio(v('f-fecha'),mon)),
        medio:v('f-medio'),estado:v('f-estado'),vence:v('f-vence'),cuotas:+v('f-cuotas')||1}));
      closeModal(); toast('Movimiento guardado'); renderView(CUR);
    });
  movMoneda();
  const fFecha=document.getElementById('f-fecha'); if(fFecha) fFecha.onchange=movMoneda;
}
/* Al elegir la moneda o cambiar la fecha, trae la cotización guardada de ese día */
function movMoneda(){
  const sel=document.getElementById('f-moneda'); if(!sel)return;
  const mon=sel.value, campo=document.getElementById('f-cotizacion'), lbl=document.getElementById('f-cot-lbl');
  const fila=campo.closest('.field');
  if(mon==='UYU'){ fila.style.display='none'; return; }
  fila.style.display='';
  lbl.textContent='Cotización ('+(mon==='USD'?'$ por U$S':'$ por R$')+')';
  const f=document.getElementById('f-fecha').value;
  if(!campo.value||campo.dataset.auto!=='no') campo.value=getTipoCambio(f,mon)||'';
  campo.oninput=()=>{ campo.dataset.auto='no'; };
}

/* ---------- FUNCIONARIO ---------- */
function formFuncionario(o){
  openModal(o.id?'Editar funcionario':'Nuevo funcionario',
     campoIn('Nombre','f-nombre',o.nombre)
    +'<div class="field-2">'+campoSel('Rol','f-rol',Store.cfg().roles,o.rol,'—')+campoIn('Costo por hora ($)','f-costo',o.costoHora,'number','step="0.01"')+'</div>'
    +'<div class="hint">Con el costo por hora se calcula solo el costo de mano de obra de cada orden.</div>',
    function(){
      if(!v('f-nombre')){ toast('Poné el nombre'); return; }
      Store.upsert('funcionarios',Object.assign(o,{nombre:v('f-nombre'),rol:v('f-rol'),costoHora:+v('f-costo')||0,activo:true}));
      closeModal(); toast('Funcionario guardado'); renderView(CUR);
    });
}

