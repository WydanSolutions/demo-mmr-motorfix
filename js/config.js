/*
 * CONFIGURACIÓN: marcas, funcionarios (con su costo por hora), medios de pago,
 * categorías de gasto, cotización del dólar y datos del taller (salen en los PDF).
 */
function renderConfig(){
  const cfg=Store.cfg(), n=cfg.negocio, cob=cfg.cobranza||{};
  const funcs=Store.all('funcionarios').map(f=>'<tr>'
    +'<td>'+cellIn('funcionarios',f.id,'nombre',f.nombre)+'</td>'
    +'<td><select onchange="cellSet(\'funcionarios\',\''+f.id+'\',\'rol\',this.value,true)" style="width:100%;padding:6px;border:1px solid var(--border);border-radius:6px">'
      +'<option value="">—</option>'+selectOps(cfg.roles,f.rol)+'</select></td>'
    +'<td style="width:130px">'+cellIn('funcionarios',f.id,'costoHora',f.costoHora,{type:'number',cls:'num'})+'</td>'
    +'<td>'+(esProductivo(f)?pill('Sí','p-verde'):pill('No','p-gris'))+'</td>'
    +'<td>'+acciones('funcionarios',f.id)+'</td></tr>').join('')||filaVacia(5,'No hay funcionarios cargados.');

  const tcs=Object.keys(cfg.tc||{}).sort().reverse().slice(0,12).map(f=>{
    const v=tcNormalizar(cfg.tc[f]);
    return '<div class="cfg-row"><span>'+fDate(f)+'</span>'
      +'<span style="font-weight:400">U$S <b>'+nf(v.usd,true)+'</b> · R$ <b>'+nf(v.brl,true)+'</b> '
      +'<button class="cfg-x" onclick="borrarTC(\''+f+'\')">×</button></span></div>';
  }).join('')||'<div class="muted-cell">Todavía no hay cotizaciones guardadas.</div>';
  const th=tcNormalizar(cfg.tcHoy);

  $('#view-config').innerHTML=
     '<div class="view-head"><div><h2>Configuración</h2><div class="sub">Las listas de acá aparecen en todos los formularios</div></div></div>'
    +'<div class="gridw">'
      +'<div class="card"><div class="card-head"><h3>Datos del taller</h3><span class="csub">Salen en los PDF</span></div><div class="card-body">'
        +'<div class="field"><label>Nombre</label><input value="'+esc(n.nombre)+'" onchange="negSet(\'nombre\',this.value)"></div>'
        +'<div class="field-2"><div class="field"><label>Sigla</label><input value="'+esc(n.sigla)+'" onchange="negSet(\'sigla\',this.value)"></div>'
        +'<div class="field"><label>RUT</label><input value="'+esc(n.rut)+'" onchange="negSet(\'rut\',this.value)"></div></div>'
        +'<div class="field-2"><div class="field"><label>Ciudad</label><input value="'+esc(n.ciudad)+'" onchange="negSet(\'ciudad\',this.value)"></div>'
        +'<div class="field"><label>País</label><input value="'+esc(n.pais)+'" onchange="negSet(\'pais\',this.value)"></div></div>'
        +'<div class="field"><label>Dirección</label><input value="'+esc(n.direccion)+'" onchange="negSet(\'direccion\',this.value)"></div>'
        +'<div class="field-2"><div class="field"><label>Teléfono</label><input value="'+esc(n.tel)+'" onchange="negSet(\'tel\',this.value)"></div>'
        +'<div class="field"><label>Correo</label><input value="'+esc(n.mail)+'" onchange="negSet(\'mail\',this.value)"></div></div>'
        +'<div class="field"><label>Validez de los presupuestos (días)</label><input type="number" min="1" value="'+(cfg.validezDias||15)+'" onchange="cfgSet(\'validezDias\',+this.value)"></div>'
      +'</div></div>'

      +'<div class="card"><div class="card-head"><h3>Datos para el pago</h3><span class="csub">Salen al pie del PDF de la reparación</span></div><div class="card-body">'
        +'<div class="aviso azul"><span>💡</span><div><b>Para qué sirve</b>Lo que se cargue acá aparece en un recuadro al final del PDF de cada reparación, para que el cliente sepa dónde depositar. Lo que quede vacío no se muestra.</div></div>'
        +'<div class="field-2"><div class="field"><label>Banco</label><input value="'+esc(cob.banco)+'" placeholder="Ej.: BROU" onchange="cobSet(\'banco\',this.value)"></div>'
        +'<div class="field"><label>Titular de la cuenta</label><input value="'+esc(cob.titular)+'" onchange="cobSet(\'titular\',this.value)"></div></div>'
        +'<div class="field-2"><div class="field"><label>Cuenta en pesos</label><input value="'+esc(cob.cuentaPesos)+'" placeholder="N° de caja de ahorro en $" onchange="cobSet(\'cuentaPesos\',this.value)"></div>'
        +'<div class="field"><label>Cuenta en dólares</label><input value="'+esc(cob.cuentaDolares)+'" placeholder="N° de caja de ahorro en U$S" onchange="cobSet(\'cuentaDolares\',this.value)"></div></div>'
        +'<div class="sepline"></div>'
        +'<div class="subt">Pix (pagos desde Brasil)</div>'
        +'<div class="field-2"><div class="field"><label>Nombre del titular</label><input value="'+esc(cob.pixNombre)+'" onchange="cobSet(\'pixNombre\',this.value)"></div>'
        +'<div class="field"><label>Clave Pix</label><input value="'+esc(cob.pix)+'" placeholder="CPF, celular o correo" onchange="cobSet(\'pix\',this.value)"></div></div>'
        +'<div class="field"><label>Aclaración (opcional)</label><input value="'+esc(cob.nota)+'" placeholder="Ej.: enviar el comprobante por WhatsApp" onchange="cobSet(\'nota\',this.value)"></div>'
        +'<div class="hint">Estos datos quedan guardados en la página del taller: no se mandan a ningún lado ni aparecen en los presupuestos.</div>'
      +'</div></div>'

      +'<div class="card"><div class="card-head"><h3>Hora de taller</h3><span class="csub">Con esto se cobra la mano de obra</span></div><div class="card-body">'
        +'<div class="field-2">'
          +'<div class="field"><label>Precio general de la hora ($)</label><input type="number" step="1" value="'+(cfg.precioHora.cliente||0)+'" onchange="precioHoraSet(\'cliente\',this.value)"></div>'
          +'<div class="field"><label>Precio de la hora de garantía ($)</label><input type="number" step="1" value="'+(cfg.precioHora.garantia||0)+'" onchange="precioHoraSet(\'garantia\',this.value)"></div>'
        +'</div>'
        +'<div class="subt">Precio de la hora según el cargo</div>'
        +'<div class="hint" style="margin-bottom:10px">La hora de un mecánico no vale lo mismo que la de un ayudante. Poné el precio de cada cargo; el que quede vacío usa el precio general.</div>'
        +cfg.roles.filter(r=>(cfg.rolesProd||[]).indexOf(r)>=0).map(r=>
          '<div class="cfg-row"><span style="font-weight:600">'+esc(r)+'</span>'
          +'<span>$ <input type="number" step="1" style="width:110px;padding:6px 8px;border:1px solid var(--border);border-radius:7px;text-align:right" '
          +'value="'+((cfg.precioHoraRol||{})[r]||'')+'" placeholder="'+(cfg.precioHora.cliente||0)+'" '
          +'onchange="precioRolSet(\''+esc(r).replace(/'/g,"\\'")+'\',this.value)"></span></div>').join('')
        +'<div class="hint" style="margin-top:10px">Los trabajos <b>internos</b> del taller no se cobran. El costo por hora de cada funcionario se carga más abajo: la diferencia con el precio de venta es lo que deja el trabajo.</div>'
        +'<div class="sepline"></div>'
        +'<div class="subt">Disponibilidad del mes</div>'
        +'<div class="field-3">'
          +'<div class="field"><label>Días trabajados</label><input type="number" step="1" value="'+(cfg.jornada.dias||0)+'" onchange="jornadaSet(\'dias\',this.value)"></div>'
          +'<div class="field"><label>Horas por jornada</label><input type="number" step="0.1" value="'+(cfg.jornada.horas||0)+'" onchange="jornadaSet(\'horas\',this.value)"></div>'
          +'<div class="field"><label>Faltas y licencias (horas)</label><input type="number" step="1" value="'+(cfg.jornada.faltas||0)+'" onchange="jornadaSet(\'faltas\',this.value)"></div>'
        +'</div>'
        +'<div class="hint">Con estos tres números y la cantidad de personal productivo se calcula cuántas horas puede vender el taller en el mes (se ve en KPIs).</div>'
      +'</div></div>'

      +'<div class="card"><div class="card-head"><h3>Cotizaciones</h3><span class="csub">Dólar y real</span></div><div class="card-body">'
        +'<div class="aviso azul"><span>💡</span><div><b>Cómo funciona</b>Cada movimiento guarda la cotización del día en que se registra, así la conversión no cambia después. Los montos pendientes se convierten con la cotización de hoy.</div></div>'
        +'<div class="field-2">'
          +'<div class="field"><label>Dólar de hoy ($ por U$S)</label><input type="number" step="0.01" value="'+(th.usd||'')+'" onchange="tcHoySet(\'usd\',this.value)"></div>'
          +'<div class="field"><label>Real de hoy ($ por R$)</label><input type="number" step="0.01" value="'+(th.brl||'')+'" onchange="tcHoySet(\'brl\',this.value)"></div>'
        +'</div>'
        +'<div class="hint" style="margin-bottom:12px">Son los valores del <b>BROU</b>. Cuando la página tenga servidor propio se van a traer solos de la pizarra del BROU; por ahora se cargan a mano.</div>'
        +'<div class="subt">Cotizaciones guardadas por fecha</div><div class="cfg-list">'+tcs+'</div>'
        +'<div class="cfg-add"><input type="date"'+DR+' id="tc-fecha" value="'+hoyISO()+'">'
        +'<input type="number" step="0.01" id="tc-usd" placeholder="Dólar">'
        +'<input type="number" step="0.01" id="tc-brl" placeholder="Real">'
        +'<button class="btn btn-sm btn-primary" onclick="agregarTC()">Agregar</button></div>'
      +'</div></div>'

      +'<div class="card"><div class="card-head"><h3>Listas</h3></div><div class="card-body">'
        +'<div class="srow"><div><div class="st">Marcas</div><div class="ss">'+cfg.marcas.length+' cargada(s)</div></div><button class="btn btn-sm" onclick="listaEditable(\'Marcas\',\'marcas\',\'Ej.: Volkswagen\')">Editar</button></div>'
        +'<div class="srow"><div><div class="st">Medios de pago</div><div class="ss">'+cfg.medios.length+' cargado(s)</div></div><button class="btn btn-sm" onclick="listaEditable(\'Medios de pago\',\'medios\',\'Ej.: Transferencia\')">Editar</button></div>'
        +'<div class="srow"><div><div class="st">Categorías de gasto</div><div class="ss">'+cfg.categorias.length+' cargada(s)</div></div><button class="btn btn-sm" onclick="listaEditable(\'Categorías de gasto\',\'categorias\',\'Ej.: Neumáticos\')">Editar</button></div>'
        +'<div class="srow"><div><div class="st">Roles del personal</div><div class="ss">'+cfg.roles.length+' cargado(s)</div></div><button class="btn btn-sm" onclick="listaEditable(\'Roles del personal\',\'roles\',\'Ej.: Electricista\')">Editar</button></div>'
        +'<div class="srow"><div><div class="st">Plantillas de diagnóstico</div><div class="ss">'+(cfg.plantillas||[]).length+' guardada(s)</div></div><button class="btn btn-sm" onclick="verPlantillas()">Ver</button></div>'
      +'</div></div>'
    +'</div>'

    +'<div class="card"><div class="card-head"><h3>Funcionarios</h3><span class="csub">El costo por hora es lo que le cuesta al taller cada hora de trabajo</span></div>'
      +'<div class="table-wrap" style="border:none;box-shadow:none"><table><thead><tr><th>Nombre</th><th>Rol</th><th class="num">Costo/hora</th><th>Productivo</th><th></th></tr></thead>'
      +'<tbody>'+funcs+'</tbody></table></div>'
      +'<div class="card-body"><button class="btn btn-sm btn-primary" onclick="openForm(\'funcionario\')">+ Agregar funcionario</button></div></div>'

    +'<div class="card"><div class="card-head"><h3>Roles que facturan horas</h3>'
      +'<span class="csub">Marcá los roles productivos: con ellos se calculan las horas disponibles del taller</span></div><div class="card-body">'
      +'<div style="display:flex;flex-wrap:wrap;gap:8px">'
      +cfg.roles.map(r=>'<label class="chkline" style="border:1px solid var(--border);padding:8px 12px;border-radius:9px;background:#fff">'
        +'<input type="checkbox"'+((cfg.rolesProd||[]).indexOf(r)>=0?' checked':'')+' onchange="rolProd(\''+esc(r).replace(/'/g,"\\'")+'\',this.checked)"> '+esc(r)+'</label>').join('')
      +'</div></div></div>'

    +'<div class="card"><div class="card-head"><h3>Respaldo de los datos</h3></div><div class="card-body">'
      +'<div class="srow"><div><div class="st">Descargar una copia</div><div class="ss">Guarda todo en un archivo en tu computadora.</div></div><button class="btn btn-sm" onclick="respaldar()">⬇ Descargar</button></div>'
      +'<div class="srow"><div><div class="st">Restaurar desde un archivo</div><div class="ss">Reemplaza los datos actuales por los del archivo.</div></div><button class="btn btn-sm" onclick="restaurar()">⬆ Restaurar</button></div>'
      +(MODO_DEMO?'<div class="srow"><div><div class="st">Volver a los datos de ejemplo</div><div class="ss">Borra todo lo cargado y deja la página como recién instalada.</div></div><button class="btn btn-sm btn-rojo" onclick="reiniciarDatos()">Reiniciar</button></div>':'')
    +'</div></div>';
}

function negSet(campo,valor){ Store.cfg().negocio[campo]=valor; Store.guardarCfg(); toast('Guardado'); }
/* Datos para el pago (los que salen al pie del PDF de la reparación) */
function cobSet(campo,valor){
  const cfg=Store.cfg(); cfg.cobranza=cfg.cobranza||{};
  cfg.cobranza[campo]=(valor||'').trim(); Store.guardarCfg(); toast('Guardado');
}
function precioHoraSet(cual,valor){ Store.cfg().precioHora[cual]=+valor||0; Store.guardarCfg(); toast('Guardado'); }
function precioRolSet(rol,valor){
  const cfg=Store.cfg(); cfg.precioHoraRol=cfg.precioHoraRol||{};
  if(+valor) cfg.precioHoraRol[rol]=+valor; else delete cfg.precioHoraRol[rol];
  Store.guardarCfg(); toast('Precio de la hora de «'+rol+'» guardado');
}
function jornadaSet(cual,valor){ Store.cfg().jornada[cual]=+valor||0; Store.guardarCfg(); toast('Guardado'); }
function rolProd(rol,si){
  const lista=Store.cfg().rolesProd||(Store.cfg().rolesProd=[]);
  const i=lista.indexOf(rol);
  if(si&&i<0)lista.push(rol); if(!si&&i>=0)lista.splice(i,1);
  Store.guardarCfg(); renderConfig();
}
function cfgSet(campo,valor){ Store.cfg()[campo]=valor; Store.guardarCfg(); renderConfig(); }
function tcHoySet(cual,valor){
  const c=Store.cfg(); c.tcHoy=tcNormalizar(c.tcHoy); c.tcHoy[cual]=+valor||0;
  Store.guardarCfg(); guardarTC(hoyISO(),c.tcHoy.usd,c.tcHoy.brl); renderConfig();
}
function agregarTC(){
  const f=$('#tc-fecha').value, usd=+$('#tc-usd').value, brl=+$('#tc-brl').value;
  if(!f||(!usd&&!brl)){ toast('Poné la fecha y al menos una cotización'); return; }
  guardarTC(f,usd,brl); toast('Cotización guardada'); renderConfig();
}
function borrarTC(f){ delete Store.cfg().tc[f]; Store.guardarCfg(); renderConfig(); }
function reiniciarDatos(){
  // En la página real NO existe: cargaría datos inventados encima de los del taller.
  if(!MODO_DEMO){ avisar('No disponible','Los datos de ejemplo son solo de la versión de demostración.'); return; }
  confirmar('Volver a los datos de ejemplo',
    'Esto BORRA todo lo que hayas cargado (clientes, camiones, órdenes, presupuestos y finanzas) y deja la página como recién instalada.\n\nSi querés guardar una copia antes, cerrá esta ventana y usá «Descargar respaldo».',
    function(){ localStorage.removeItem(KEY); Store.load(); renderView(CUR); toast('Datos reiniciados'); },
    'Sí, borrar todo',true);
}

/* ---------- LISTAS EDITABLES (marcas, medios, categorías, roles) ---------- */
let _listaClave='';
function listaEditable(titulo,clave,ph){
  _listaClave=clave;
  openModal(titulo,listaHTML(ph),function(){ closeModal(); renderView(CUR); },'Listo');
}
function listaHTML(ph){
  const arr=Store.cfg()[_listaClave]||[];
  return '<div class="cfg-list">'+(arr.map((x,i)=>'<div class="cfg-row">'
      +'<input class="cell-in" value="'+esc(x)+'" onchange="listaSet('+i+',this.value)">'
      +'<button class="cfg-x" onclick="listaDel('+i+')">×</button></div>').join('')||'<div class="muted-cell">Lista vacía.</div>')
    +'</div><div class="cfg-add"><input id="lista-nuevo" placeholder="'+esc(ph||'')+'" onkeydown="if(event.key===\'Enter\')listaAdd()">'
    +'<button class="btn btn-sm btn-primary" onclick="listaAdd()">Agregar</button></div>';
}
function listaRefrescar(){ $('#modal-body').innerHTML=listaHTML(); }
function listaAdd(){ const v=$('#lista-nuevo').value.trim(); if(!v)return; Store.cfg()[_listaClave].push(v); Store.guardarCfg(); listaRefrescar(); }
function listaSet(i,v){ Store.cfg()[_listaClave][i]=v; Store.guardarCfg(); }
function listaDel(i){ Store.cfg()[_listaClave].splice(i,1); Store.guardarCfg(); listaRefrescar(); }

function verPlantillas(){
  const pl=Store.cfg().plantillas||[];
  openModal('Plantillas de diagnóstico',
    (pl.length?pl.map((t,i)=>'<div class="srow"><div><div class="st">'+esc(t.nombre)+'</div><div class="ss">'+(t.lineas||[]).length+' línea(s)</div></div>'
      +'<button class="btn btn-sm btn-rojo" onclick="plantillaDel('+i+')">Borrar</button></div>').join('')
      :'<div class="empty"><p>Todavía no guardaste ninguna plantilla. Se guardan desde un presupuesto, con el botón «Guardar como plantilla».</p></div>'),
    function(){ closeModal(); },'Cerrar');
}
function plantillaDel(i){ Store.cfg().plantillas.splice(i,1); Store.guardarCfg(); verPlantillas(); }
