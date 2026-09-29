/*
 * CLIENTES: ficha de cada uno, sus camiones, el estado de cuenta (lo que debe) y
 * el historial de trabajos. El semáforo se calcula solo con lo que hay en Finanzas:
 * verde = sin deuda · amarillo = tiene saldo pendiente · rojo = tiene saldo vencido.
 */
let cliSel=null, cliQ='', cliTipo='';

function renderClientes(){
  $('#view-clientes').innerHTML=
     '<div class="view-head"><div><h2>Clientes y proveedores</h2><div class="sub">'
      +soloClientes().length+' cliente(s) · '+soloProveedores().length+' proveedor(es) · el semáforo avisa quién tiene deuda</div></div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
      +'<button class="btn" onclick="nuevoContacto(\'Proveedor\')">+ Nuevo proveedor</button>'
      +'<button class="btn btn-primary" onclick="nuevoContacto(\'Cliente\')">+ Nuevo cliente</button></div></div>'
    /* El buscador queda FUERA de lo que se redibuja: al escribir solo cambia la lista. */
    +'<div class="toolbar"><div class="search"><input placeholder="Buscar por nombre, RUT, teléfono…" value="'+esc(cliQ)+'" oninput="cliQ=this.value;cliLista()"></div>'
    +'<select class="filt" onchange="cliTipo=this.value;cliLista()"><option value="">Clientes y proveedores</option>'
      +'<option value="Cliente"'+(cliTipo==='Cliente'?' selected':'')+'>Solo clientes</option>'
      +'<option value="Proveedor"'+(cliTipo==='Proveedor'?' selected':'')+'>Solo proveedores</option></select>'
    +'<div class="spacer"></div>'+botonesExport('clientes')+'</div>'
    +'<div class="det-wrap"><div class="det-list" id="cli-lista"></div><div id="cli-detalle"></div></div>';
  cliLista();
  cliDetalle();
}
/* Solo la lista de la izquierda (la usa el buscador) */
function cliLista(){
  const cont=$('#cli-lista'); if(!cont)return;
  const lista=Store.all('clientes').filter(c=>{
    if(cliTipo==='Cliente'&&!esCliente(c))return false;
    if(cliTipo==='Proveedor'&&!esProveedor(c))return false;
    if(!cliQ)return true; const q=cliQ.toLowerCase();
    return [c.nombre,c.rut,c.ci,c.contacto,c.tel,c.mail,c.ciudad].join(' ').toLowerCase().indexOf(q)>=0;
  }).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  if(!cliSel&&lista.length){ cliSel=lista[0].id; cliDetalle(); }

  cont.innerHTML=lista.map(c=>{
    const s=semaforoCli(c.id);
    return '<div class="det-item'+(c.id===cliSel?' active':'')+'" onclick="cliSel=\''+c.id+'\';renderClientes()">'
      +'<div class="det-av">'+esc((c.nombre||'?').slice(0,2).toUpperCase())+'</div>'
      +'<div style="flex:1;min-width:0"><div class="det-n">'+esc(c.nombre)+'</div>'
      +'<div class="det-s">'+((c.tipo||'Cliente')!=='Cliente'?'<b style="color:#a97413">'+esc(c.tipo)+'</b> · ':'')
        +esc(c.ciudad||'')+' · '+Store.all('camiones').filter(v=>v.clienteId===c.id).length+' camión(es)</div></div>'
      +(esCliente(c)?semaforo(s,s==='mal'?'Tiene saldo vencido':s==='med'?'Tiene saldo pendiente':'Sin deuda'):'')+'</div>';
  }).join('')||'<div class="empty"><p>'+(cliQ?'No hay nombres que coincidan con «'+esc(cliQ)+'».':'No hay contactos cargados.')+'</p></div>';
}
function nuevoContacto(tipo){ openForm('cliente',null,{tipo:tipo}); }

function cliDetalle(){
  const c=Store.get('clientes',cliSel), cont=$('#cli-detalle'); if(!cont)return;
  if(!c){ cont.innerHTML='<div class="det-card"><div class="empty"><div class="e-ico">👤</div><p>Elegí un nombre de la lista.</p></div></div>'; return; }
  const cams=Store.all('camiones').filter(v=>v.clienteId===c.id);
  const sem=semaforoCli(c.id);
  const cta=estadoCuenta(c.id);

  const filasCam=cams.map(v=>'<tr onclick="verCamion(\''+v.id+'\')" style="cursor:pointer"><td>'+matTag(v.matricula)+'</td>'
    +'<td class="nom">'+esc(v.marca||'')+'</td><td class="muted-cell">'+esc(v.modelo||'')+'</td>'
    +'<td class="muted-cell">'+(v.anio||'—')+'</td><td class="num muted-cell">'+(v.km?nf(v.km)+' km':'—')+'</td></tr>').join('')
    ||filaVacia(5,'Este cliente todavía no tiene camiones cargados.');

  const filasCta=cta.visibles.map(r=>'<tr'+(r.ordenId?' onclick="verOrden(\''+r.ordenId+'\')" style="cursor:pointer"':'')+'>'
    +'<td class="muted-cell">'+fDate(r.fecha)+'</td>'
    +'<td class="nom">'+(r.nro?'N° '+r.nro:'—')+'</td>'
    +'<td>'+(r.matricula?matTag(r.matricula):'')+'</td>'
    +'<td>'+esc(r.concepto)+'</td>'
    +'<td class="muted-cell">'+esc(r.medio||'')+'</td>'
    +'<td class="num">'+esc(r.original)+'</td>'
    +'<td class="num">'+esc(r.convertido)+'</td>'
    +'<td>'+pill(r.estado,r.estado==='Vencido'?'p-rojo':r.estado==='Cobrado'?'p-verde':'p-amarillo')+'</td>'
    +'<td class="muted-cell">'+(r.vence?fDate(r.vence):'—')+'</td></tr>').join('')
    ||filaVacia(9,ctaVer==='debe'?'Este cliente no debe nada en ese período. 🎉':'No hay movimientos en ese período.');

  cont.innerHTML='<div class="det-card">'
    +'<div class="det-head"><div class="det-av" style="width:52px;height:52px;font-size:17px">'+esc((c.nombre||'?').slice(0,2).toUpperCase())+'</div>'
      +'<div style="flex:1"><div class="det-title">'+esc(c.nombre)+'</div>'
      +'<div class="muted-cell">'+esc(c.contacto||'')+(c.rut?' · RUT '+esc(c.rut):'')+(c.ci?' · CI '+esc(c.ci):'')+'</div></div>'
      +'<div style="display:flex;gap:7px;flex-wrap:wrap">'
        +(c.tel?'<a class="btn btn-sm wa-btn" href="'+linkWa(c.tel,saludo()+', '+(c.contacto||c.nombre)+'. ')+'" target="_blank">WhatsApp</a>':'')
        +'<button class="btn btn-sm" onclick="openForm(\'cliente\',\''+c.id+'\')">✎ Editar</button>'
        +'<button class="btn btn-sm" onclick="cuentaPDF(\''+c.id+'\')">📄 Estado de cuenta</button>'
        +'<button class="btn btn-sm" onclick="cuentaExcel(\''+c.id+'\')">⬇ Excel</button>'
      +'</div></div>'

    +'<div class="det-sec"><div class="det-st">Datos</div><div class="det-grid">'
      +campo('Teléfono',c.tel)+campo('Otro teléfono',c.tel2)+campo('Correo',c.mail)
      +campo('Dirección',c.direccion)+campo('Ciudad',c.ciudad)+campo('Departamento',c.depto)
      +campo('N° de cliente',c.nro)+campo('Notas',c.notas)
    +'</div></div>'

    +'<div class="det-sec"><div class="det-st">Estado de cuenta '+semaforo(sem)+'</div>'
      +'<div class="toolbar">'
        +'<label class="chkline">Desde</label><input class="date-f" type="date"'+DR+' value="'+ctaDesde+'" onchange="ctaDesde=this.value;renderClientes()">'
        +'<label class="chkline">Hasta</label><input class="date-f" type="date"'+DR+' value="'+ctaHasta+'" onchange="ctaHasta=this.value;renderClientes()">'
        +'<select class="filt" onchange="ctaMoneda=this.value;renderClientes()" title="Moneda del estado de cuenta">'
          +MONEDAS.map(m=>'<option value="'+m+'"'+(ctaMoneda===m?' selected':'')+'>Ver en '+MON_NOM[m].toLowerCase()+'</option>').join('')+'</select>'
        +'<select class="filt" onchange="ctaVer=this.value;renderView(CUR)" title="Qué se muestra en la tabla">'
          +'<option value="debe"'+(ctaVer==='debe'?' selected':'')+'>Solo lo que debe</option>'
          +'<option value="todo"'+(ctaVer==='todo'?' selected':'')+'>Todo el movimiento</option></select>'
        +'<button class="btn btn-sm" onclick="ctaRango(12)">Último año</button>'
        +'<div class="spacer"></div>'
        +'<button class="btn btn-sm" onclick="cuentaExcel(\''+c.id+'\')">⬇ Excel</button>'
        +'<button class="btn btn-sm btn-primary" onclick="cuentaPDF(\''+c.id+'\')">📄 PDF</button>'
      +'</div>'
      +'<div class="kpis" style="margin-bottom:12px">'
        +kpi('DEBE',cta.fDebe,cta.debe?'Pendiente + vencido':'No debe nada',cta.debe?(cta.vencido?'k-rojo':'k-amarillo'):'k-verde',true)
        +kpi('Pendiente de cobro',cta.fPendiente,'Todavía dentro de fecha','k-amarillo',true)
        +kpi('Vencido sin cobrar',cta.fVencido,cta.vencido?'Pasó la fecha de pago':'Al día',cta.vencido?'k-rojo':'k-verde',true)
        +kpi('Total trabajado',cta.fTrabajado,'Ya cobrado: '+cta.fCobrado,'',true)
      +'</div>'
      +'<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px">'
        +'<button class="btn btn-sm" onclick="avisoCliente(event,\''+c.id+'\',\'pendiente\')">✉ Avisar saldo pendiente</button>'
        +'<button class="btn btn-sm" onclick="avisoCliente(event,\''+c.id+'\',\'vencido\')">⚠ Avisar saldo vencido</button>'
        +'<button class="btn btn-sm" onclick="avisoCliente(event,\''+c.id+'\',\'pago\')">✓ Confirmar un pago</button>'
        +'<button class="btn btn-sm" onclick="avisoCliente(event,\''+c.id+'\',\'cuota\')">📅 Avisar cuota por vencer</button>'
      +'</div>'
      +'<div class="table-wrap"><table style="min-width:900px"><thead><tr><th>Fecha</th><th>O.R.</th><th>Camión</th><th>Concepto</th><th>Medio</th>'
      +'<th class="num">Importe</th><th class="num">En '+MON_NOM[ctaMoneda].toLowerCase()+'</th><th>Estado</th><th>Vence</th></tr></thead>'
      +'<tbody>'+filasCta+'</tbody>'
      +'<tfoot><tr><td colspan="6">'+(ctaVer==='debe'?'Total que debe':'Total del período')+'</td><td class="num">'+cta.fTotalVisible+'</td><td colspan="2"></td></tr></tfoot></table></div>'
      +'<div class="muted-cell" style="margin-top:8px">'
      +(ctaVer==='debe'?'Se muestra <b>solo lo que el cliente debe</b>: lo ya cobrado no aparece. Para ver todo el movimiento, cambiá el selector de arriba. ':'')
      +'Cada importe se convierte con la cotización de <b>su fecha</b>, no con la de hoy.</div>'
    +'</div>'

    +(cams.length?'<div class="det-sec"><div class="det-st">Camiones</div>'
      +'<div class="table-wrap"><table><thead><tr><th>Matrícula</th><th>Marca</th><th>Modelo</th><th>Año</th><th class="num">Km</th></tr></thead><tbody>'+filasCam+'</tbody></table></div></div>':'')
    +(esProveedor(c)?bloqueProveedor(c):'')
  +'</div>';
}

/* ---------- LO QUE LE COMPRAMOS A UN PROVEEDOR ---------- */
function gastosDeProveedor(id){ return Store.all('movimientos').filter(m=>m.tipo==='gasto'&&m.proveedorId===id).reverse(); }
function bloqueProveedor(c){
  const gs=gastosDeProveedor(c.id), t=sumaMovs(gs), pend=sumaMovs(gs.filter(m=>estadoMov(m)!=='Pagado'));
  const filas=gs.map(m=>'<tr>'
    +'<td class="muted-cell">'+fDate(m.fecha)+'</td>'
    +'<td class="nom">'+esc(m.concepto||'')+'</td>'
    +'<td>'+pill(m.categoria||'Otros','p-gris')+'</td>'
    +'<td class="num">'+fPropia(m)+'</td>'
    +'<td class="num muted-cell">'+fMon(valMov(m))+'</td>'
    +'<td>'+pillEstadoMov(m)+'</td>'
    +'<td class="muted-cell">'+(m.vence?fDate(m.vence):'—')+'</td></tr>').join('')
    ||filaVacia(7,'Todavía no hay gastos cargados con este proveedor.');
  return '<div class="det-sec"><div class="det-st">Compras a este proveedor</div>'
    +'<div class="kpis" style="margin-bottom:12px">'
      +kpi('Total comprado',fMon(t),gs.length+' gasto(s)','',true)
      +kpi('Pendiente de pago',fMon(pend),pend.uyu?'Facturas sin pagar':'Al día',pend.uyu?'k-amarillo':'k-verde',true)
    +'</div>'
    +'<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th class="num">Importe</th>'
    +'<th class="num">En '+MON_SIM[MONEDA]+'</th><th>Estado</th><th>Vence</th></tr></thead><tbody>'+filas+'</tbody></table></div></div>';
}

/* ---------- AVISOS AL CLIENTE (WhatsApp o mail, con texto ya escrito) ---------- */
let _avisoTxt='', _avisoCli=null;
function avisoCliente(ev,id,tipo){
  const c=Store.get('clientes',id), cfg=Store.cfg(), s=saldoCliente(id);
  const nom=c.contacto||c.nombre;
  let t=saludo()+', '+nom+'.\n\n';
  if(tipo==='pendiente') t+='Te escribimos de '+cfg.negocio.nombre+' para recordarte que tenés un saldo pendiente de '+fMon(parUYU(s.pendiente))+' por los trabajos realizados.\n\nCuando puedas nos confirmás el pago. ¡Gracias!';
  else if(tipo==='vencido') t+='Te escribimos de '+cfg.negocio.nombre+'. Nos figura un saldo vencido de '+fMon(parUYU(s.vencido))+'.\n\nSi ya lo abonaste, avisanos y lo damos de baja. Si no, quedamos a la orden para coordinar el pago.';
  else if(tipo==='pago') t+='Te confirmamos que recibimos tu pago. ¡Muchas gracias por confiar en '+cfg.negocio.nombre+'!\n\nQuedamos a las órdenes para lo que necesites.';
  else t+='Te recordamos que se aproxima el vencimiento de la próxima cuota de tu cuenta con '+cfg.negocio.nombre+'.\n\nCualquier cosa, escribinos.';
  t+='\n\n'+cfg.negocio.nombre+(cfg.negocio.tel?' · '+cfg.negocio.tel:'');

  _avisoTxt=t; _avisoCli=c;
  if(!c.tel&&!c.mail){ avisar('Falta el contacto','Este cliente no tiene teléfono ni correo cargado. Agregalo con el botón ✎ Editar.'); return; }
  if(c.tel&&!c.mail) return avisoEnviar('wa');
  if(c.mail&&!c.tel) return avisoEnviar('mail');
  ddMenu(ev,[{t:'📱 Mandar por WhatsApp',fn:'avisoEnviar(\'wa\')'},{t:'✉ Mandar por mail',fn:'avisoEnviar(\'mail\')'}]);
}
/* Abre WhatsApp o el correo con el texto ya escrito */
function avisoEnviar(via){
  const c=_avisoCli; if(!c)return;
  window.open(via==='wa'?linkWa(c.tel,_avisoTxt):linkMail(c.mail,'Aviso de '+Store.cfg().negocio.nombre,_avisoTxt),'_blank');
}

/* ---------- ESTADO DE CUENTA ----------
   Junta TODO lo trabajado para el cliente en el período elegido:
   - los cobros registrados (cobrados, pendientes y vencidos), y
   - los trabajos ya entregados que todavía no se facturaron.
   Cada línea se convierte con la cotización de SU fecha, no con la de hoy. */
let ctaDesde='', ctaHasta='', ctaMoneda='UYU', ctaVer='debe';
ctaRango(12);
function ctaRango(meses){
  const h=new Date(), d=new Date(h.getFullYear(),h.getMonth()-(meses-1),1);
  ctaDesde=d.getFullYear()+'-'+p2(d.getMonth()+1)+'-01';
  ctaHasta=h.getFullYear()+'-'+p2(h.getMonth()+1)+'-'+p2(h.getDate());
  if(typeof CUR!=='undefined'&&CUR==='clientes') renderClientes();
}

function estadoCuenta(id){
  const desde=ctaDesde||'0000-01-01', hasta=ctaHasta||'9999-12-31', mon=ctaMoneda;
  const filas=[];

  /* 1) Cobros registrados en Finanzas */
  Store.all('movimientos').filter(m=>m.tipo==='cobro'&&m.clienteId===id).forEach(m=>{
    const f=String(m.fecha||'').slice(0,10); if(f<desde||f>hasta)return;
    const o=m.ordenId?Store.get('ordenes',m.ordenId):null, v=valMov(m);
    filas.push({fecha:f, nro:o?o.nro:'', ordenId:o?o.id:'', matricula:o?(o.matricula||'').toUpperCase():'',
      concepto:m.concepto||'', medio:m.medio||'', original:fPropia(m),
      conv:(mon==='USD'?v.usd:mon==='BRL'?v.brl:v.uyu), convertido:fMon(v,mon),
      estado:estadoMov(m), vence:m.vence||'', cobrado:m.estado==='cobrado'});
  });

  /* 2) Trabajos entregados que todavía no tienen un cobro cargado */
  ordenesDeCli(id).filter(o=>o.etapa==='entregada'&&(o.cargo||'Cliente')==='Cliente').forEach(o=>{
    if(Store.all('movimientos').some(m=>m.ordenId===o.id))return;
    const f=String(o.fechaEntrega||(o.tiempos||{}).entregada||o.fecha||'').slice(0,10);
    if(!f||f<desde||f>hasta)return;
    const uyu=ordenTotal(o);
    filas.push({fecha:f, nro:o.nro, ordenId:o.id, matricula:(o.matricula||'').toUpperCase(),
      concepto:(o.diagnostico||o.peticiones||'Trabajo realizado'), medio:'—',
      original:'$ '+nf(uyu), conv:enMoneda(uyu,f,mon), convertido:fImporte(enMoneda(uyu,f,mon),mon),
      estado:'Pendiente', vence:'', cobrado:false});
  });

  filas.sort((a,b)=>a.fecha<b.fecha?1:a.fecha>b.fecha?-1:0);
  const suma=fn=>filas.filter(fn).reduce((s,r)=>s+r.conv,0);
  const trabajado=suma(()=>true), cobrado=suma(r=>r.cobrado),
        vencido=suma(r=>r.estado==='Vencido'), pendiente=suma(r=>r.estado==='Pendiente');
  /* En pantalla, por defecto se muestra SOLO lo que el cliente debe: lo ya cobrado no es deuda.
     Con el selector se puede ver todo el movimiento del período. */
  const visibles = ctaVer==='debe' ? filas.filter(r=>!r.cobrado) : filas;
  const totalVisible = visibles.reduce((s,r)=>s+r.conv,0);
  return {filas:filas, visibles:visibles, moneda:mon, trabajado:trabajado, cobrado:cobrado,
    pendiente:pendiente, vencido:vencido, debe:pendiente+vencido, totalVisible:totalVisible,
    fTrabajado:fImporte(trabajado,mon), fCobrado:fImporte(cobrado,mon),
    fPendiente:fImporte(pendiente,mon), fVencido:fImporte(vencido,mon),
    fDebe:fImporte(pendiente+vencido,mon), fTotalVisible:fImporte(totalVisible,mon)};
}

/* ---------- ESTADO DE CUENTA EN PDF / EXCEL ---------- */
const CTA_COLS=['Fecha','N° O.R.','Camión','Concepto','Medio de pago','Importe','Convertido','Estado','Vence'];
function cuentaFilas(id){
  return estadoCuenta(id).filas.map(r=>[fDate(r.fecha),r.nro||'',r.matricula||'',r.concepto,r.medio,r.original,r.convertido,r.estado,r.vence?fDate(r.vence):'']);
}
function cuentaPDF(id){
  const c=Store.get('clientes',id), cta=estadoCuenta(id);
  abrirPDF('Estado de cuenta · '+c.nombre,
     '<h2>Estado de cuenta</h2>'
    +'<div class="meta"><div><b>'+esc(c.nombre)+'</b><br>'+esc(c.contacto||'')+'<br>'+esc(c.tel||'')+(c.rut?'<br>RUT '+esc(c.rut):'')+'</div>'
    +'<div><b>Período</b><br>'+fDate(ctaDesde)+' al '+fDate(ctaHasta)+'<br>En '+MON_NOM[cta.moneda].toLowerCase()+'</div>'
    +'<div><b>Total trabajado</b><br>'+cta.fTrabajado+'<br>Cobrado: '+cta.fCobrado+'</div>'
    +'<div><b>Pendiente</b><br>'+cta.fPendiente+'<br>Vencido: '+cta.fVencido+'</div></div>'
    +'<table><thead><tr>'+CTA_COLS.map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>'
    +cuentaFilas(id).map(f=>'<tr>'+f.map((v,i)=>'<td'+(i===5||i===6?' class="n"':'')+'>'+esc(String(v))+'</td>').join('')+'</tr>').join('')
    +'</tbody></table>'
    +'<div class="total">SALDO PENDIENTE: '+fImporte(cta.pendiente+cta.vencido,cta.moneda)+'</div>'
    +'<p class="pie">Cada importe se convirtió con la cotización de su fecha.</p>');
}
function cuentaExcel(id){
  const c=Store.get('clientes',id);
  exportExcel('Estado de cuenta - '+c.nombre+' ('+fDate(ctaDesde)+' al '+fDate(ctaHasta)+')',CTA_COLS,cuentaFilas(id));
}
function verCliente(id){ cliSel=id; switchView('clientes'); }
