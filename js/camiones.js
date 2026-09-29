/*
 * CAMIONES (unidades). La MATRÍCULA es la clave: escribiéndola en cualquier pantalla
 * aparece sola la información del camión y de su cliente.
 * Acá también está el historial de cada camión (la "historia clínica") y el listado de marcas.
 */
let camSel=null, camQ='', camMarca='';

function renderCamiones(){
  $('#view-camiones').innerHTML=
     '<div class="view-head"><div><h2>Camiones</h2><div class="sub">'+Store.all('camiones').length+' unidad(es) · la matrícula es la clave de todo</div></div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="abrirMarcas()">🏷 Marcas</button>'
    +'<button class="btn btn-primary" onclick="openForm(\'camion\')">+ Nuevo camión</button></div></div>'
    /* El buscador queda FUERA de lo que se redibuja: al escribir solo cambia la tabla de abajo,
       así se puede tipear de corrido sin que se corte. */
    +'<div class="toolbar"><div class="search"><input placeholder="Buscar matrícula, chasis, cliente…" value="'+esc(camQ)+'" oninput="camQ=this.value;camResultados()"></div>'
    +'<select class="filt" onchange="camMarca=this.value;camResultados()"><option value="">Todas las marcas</option>'+selectOps(Store.cfg().marcas,camMarca)+'</select>'
    +'<div class="spacer"></div>'+botonesExport('camiones')+'</div>'
    +'<div id="cam-res"></div>'
    +(camSel?camFicha():'');
  camResultados();
}
function camResultados(){
  const cont=$('#cam-res'); if(!cont)return;
  const lista=Store.all('camiones').filter(v=>{
    if(camMarca&&v.marca!==camMarca)return false;
    if(!camQ)return true; const q=camQ.toLowerCase();
    return [v.matricula,v.marca,v.modelo,v.chasis,v.motor,cliNom(v.clienteId)].join(' ').toLowerCase().indexOf(q)>=0;
  }).sort((a,b)=>normMat(a.matricula).localeCompare(normMat(b.matricula)));

  const filas=lista.map(v=>{
    const abierta=ordenesDeMat(v.matricula).some(o=>o.etapa!=='entregada');
    return '<tr onclick="verCamion(\''+v.id+'\')" style="cursor:pointer">'
      +'<td>'+matTag(v.matricula)+'</td>'
      +'<td class="nom">'+esc(v.marca||'—')+'</td>'
      +'<td class="muted-cell">'+esc(v.modelo||'')+'</td>'
      +'<td class="muted-cell">'+(v.anio||'—')+'</td>'
      +'<td class="nom">'+esc(cliNom(v.clienteId))+'</td>'
      +'<td class="num muted-cell">'+(v.km?nf(v.km):'—')+'</td>'
      +'<td class="muted-cell">'+ordenesDeMat(v.matricula).length+'</td>'
      +'<td>'+(abierta?pill('En el taller','p-amarillo'):'')+'</td>'
      +'<td>'+acciones('camiones',v.id)+'</td></tr>';
  }).join('');

  cont.innerHTML=
     '<div class="table-wrap"><table><thead><tr><th>Matrícula</th><th>Marca</th><th>Modelo</th><th>Año</th><th>Cliente</th><th class="num">Km</th><th>Trabajos</th><th></th><th></th></tr></thead>'
    +'<tbody>'+(filas||filaVacia(9,camQ?'No hay camiones que coincidan con «'+esc(camQ)+'».':'No hay camiones cargados.'))+'</tbody></table></div>';
}

/* Historia clínica del camión */
function camFicha(){
  const v=Store.get('camiones',camSel); if(!v)return '';
  const ords=ordenesDeMat(v.matricula).reverse();
  const filas=ords.map(o=>'<tr onclick="verOrden(\''+o.id+'\')" style="cursor:pointer">'
    +'<td class="muted-cell">'+fDate(o.fecha)+'</td><td class="nom">N° '+o.nro+'</td>'
    +'<td>'+pill(o.tipo||'—',o.tipo==='Preventivo'?'p-azul':'p-amarillo')+'</td>'
    +'<td>'+pillCargo(o.cargo)+'</td>'
    +'<td class="muted-cell">'+esc(o.diagnostico||o.peticiones||'')+'</td>'
    +'<td class="num muted-cell">'+(o.km?nf(o.km):'—')+'</td>'
    +'<td class="num muted-cell">'+(o.horimetro?nf(o.horimetro):'—')+'</td>'
    +'<td class="muted-cell">'+(o.fechaEntrega?fDate(o.fechaEntrega):'—')+'</td>'
    +'<td>'+pillEtapa(o.etapa)+'</td><td class="num">'+fPesos(ordenTotal(o))+'</td></tr>').join('')
    ||filaVacia(10,'Este camión todavía no tuvo trabajos.');

  return '<div class="det-card" style="margin-top:16px">'
    +'<div class="det-head"><div class="det-title">'+esc((v.matricula||'').toUpperCase())+'</div>'
      +'<div style="flex:1" class="muted-cell">'+esc(v.marca+' '+v.modelo)+' · '+esc(cliNom(v.clienteId))+'</div>'
      +'<div style="display:flex;gap:7px;flex-wrap:wrap"><button class="btn btn-sm" onclick="openForm(\'camion\',\''+v.id+'\')">✎ Editar</button>'
      +'<button class="btn btn-sm" onclick="verCliente(\''+v.clienteId+'\')">👤 Ver cliente</button>'
      +'<button class="btn btn-sm" onclick="camSel=null;renderCamiones()">Cerrar</button></div></div>'
    +'<div class="det-sec"><div class="det-st">Ficha</div><div class="det-grid">'
      +campo('Marca',v.marca)+campo('Modelo',v.modelo)+campo('Año',v.anio)
      +campo('Chasis (17 dígitos)',v.chasis)+campo('Chasis largo',v.chasisLargo)
      +campo('N° de motor',v.motor)+campo('Color',v.color)
      +campo('Kilómetros',v.km?nf(v.km)+' km':'—')+campo('Horímetro',v.horimetro?nf(v.horimetro)+' h':'—')
      +campo('Fecha de venta',v.fventa?fDate(v.fventa):'—')+campo('Notas',v.notas)
    +'</div></div>'
    +'<div class="det-sec"><div class="det-st">Historia clínica del camión</div>'
      +'<div class="table-wrap"><table style="min-width:840px"><thead><tr><th>Ingreso</th><th>O.R.</th><th>Tipo</th><th>A cargo de</th><th>Trabajo</th>'
      +'<th class="num">Km</th><th class="num">Horímetro</th><th>Entrega</th><th>Etapa</th><th class="num">Total</th></tr></thead><tbody>'+filas+'</tbody></table></div>'
      +'<div style="margin-top:10px;display:flex;gap:7px"><button class="btn btn-sm" onclick="historiaExcel(\''+v.id+'\')">⬇ Excel</button>'
      +'<button class="btn btn-sm" onclick="historiaPDF(\''+v.id+'\')">📄 PDF</button></div></div>'
  +'</div>';
}
function verCamion(id){ camSel=id; switchView('camiones'); setTimeout(()=>{ const e=document.querySelector('#view-camiones .det-card'); if(e)e.scrollIntoView({behavior:'smooth',block:'start'}); },80); }

/* ---------- HISTORIA CLÍNICA EN EXCEL Y PDF ---------- */
function historiaFilas(id){
  const v=Store.get('camiones',id);
  return ordenesDeMat(v.matricula).reverse().map(o=>[fDate(o.fecha),o.nro,o.tipo||'',o.cargo||'Cliente',
    (o.diagnostico||o.peticiones||''),o.km||'',o.horimetro||'',o.fechaEntrega?fDate(o.fechaEntrega):'',etapaN(o.etapa),nf(ordenTotal(o))]);
}
const HIST_COLS=['Fecha de ingreso','N° orden','Tipo','A cargo de','Trabajo','Km','Horímetro','Fecha de entrega','Etapa','Total'];
function historiaExcel(id){
  const v=Store.get('camiones',id);
  exportExcel('Historia clinica - '+(v.matricula||'').toUpperCase(),HIST_COLS,historiaFilas(id));
}
function historiaPDF(id){
  const v=Store.get('camiones',id), f=historiaFilas(id);
  abrirPDF('Historia clínica · '+(v.matricula||'').toUpperCase(),
     '<h2>Historia clínica</h2>'
    +'<div class="meta"><div><b>Matrícula</b><br>'+esc((v.matricula||'').toUpperCase())+'</div>'
    +'<div><b>Camión</b><br>'+esc((v.marca||'')+' '+(v.modelo||''))+(v.anio?'<br>Año '+v.anio:'')+'</div>'
    +'<div><b>Chasis</b><br>'+esc(v.chasis||'—')+'</div>'
    +'<div><b>Cliente</b><br>'+esc(cliNom(v.clienteId))+'</div></div>'
    +'<table><thead><tr>'+HIST_COLS.map(c=>'<th>'+c+'</th>').join('')+'</tr></thead><tbody>'
    +f.map(r=>'<tr>'+r.map((x,i)=>'<td'+(i>=5&&i<=6||i===9?' class="n"':'')+'>'+esc(String(x))+'</td>').join('')+'</tr>').join('')
    +'</tbody></table>');
}

/* ---------- MARCAS (agregar / editar / borrar) ---------- */
function abrirMarcas(){ listaEditable('Marcas','marcas','Ej.: Volkswagen'); }
