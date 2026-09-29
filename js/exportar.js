/*
 * EXPORTAR A EXCEL Y PDF. Se exporta lo que se está viendo (con los filtros puestos).
 * El Excel se abre con Excel o con Google Sheets; el PDF sale con el logo y los colores de MMR.
 */
function botonesExport(kind){
  return '<button class="btn btn-sm" onclick="doExport(\''+kind+'\',\'xls\')">⬇ Excel</button>'
    +'<button class="btn btn-sm" onclick="doExport(\''+kind+'\',\'pdf\')">⬇ PDF</button>';
}

function datosExport(kind){
  if(kind==='clientes'){
    return {titulo:'Clientes y proveedores',cols:['N° de cliente','Tipo','Cédula','Razón social','RUT','Persona de contacto','Teléfono 1','Teléfono 2','Teléfono 3','Dirección','Departamento','Ciudad','Correo','Camiones','Saldo pendiente','Saldo vencido'],
      filas:Store.all('clientes').map(c=>[c.nro||'',c.tipo||'Cliente',c.ci||'',c.nombre,c.rut||'',c.contacto||'',c.tel||'',c.tel2||'',c.tel3||'',c.direccion||'',c.depto||'',c.ciudad||'',c.mail||'',
        Store.all('camiones').filter(v=>v.clienteId===c.id).length, nf(saldoCliente(c.id).pendiente), nf(saldoCliente(c.id).vencido)])};
  }
  if(kind==='camiones'){
    return {titulo:'Camiones',cols:['Matrícula','Marca','Modelo','Chasis','Chasis largo','N° motor','Color','Año','Fecha de venta','Km','Horímetro','Cliente','Trabajos'],
      filas:Store.all('camiones').map(v=>[(v.matricula||'').toUpperCase(),v.marca||'',v.modelo||'',v.chasis||'',v.chasisLargo||'',v.motor||'',v.color||'',v.anio||'',
        v.fventa?fDate(v.fventa):'',v.km||'',v.horimetro||'',cliNom(v.clienteId),ordenesDeMat(v.matricula).length])};
  }
  if(kind==='ordenes'){
    return {titulo:'Reparaciones · '+MESES_L[MES]+' '+ANIO,cols:['O.R.','Fecha','Matrícula','Cliente','Marca','Tipo','A cargo de','Prioridad','Etapa','Fecha de entrega','Km','Horas','Mano de obra','Repuestos','Total'],
      filas:ordenesFiltradas().map(o=>{ const c=camionPorMat(o.matricula);
        return [o.nro,fDate(o.fecha),(o.matricula||'').toUpperCase(),cliNom(o.clienteId),c?c.marca:'',o.tipo||'',o.cargo||'Cliente',o.prioridad||'',etapaN(o.etapa),
          o.fechaEntrega?fDate(o.fechaEntrega):'',o.km||'',nf(ordenHoras(o),true),nf(ordenMO(o)),nf(ordenRepuestos(o)),nf(ordenTotal(o))]; })};
  }
  if(kind==='presupuestos'){
    return {titulo:'Presupuestos · '+MESES_L[MES]+' '+ANIO,cols:['N°','Fecha','Válido hasta','Matrícula','Cliente','Asunto','Estado','Total'],
      filas:Store.all('presupuestos').filter(p=>esDelMes(p.fecha)).map(p=>[p.nro,fDate(p.fecha),fDate(presVence(p)),(p.matricula||'').toUpperCase(),cliNom(p.clienteId),p.asunto||'',p.estado,nf(presTotal(p))])};
  }
  if(kind==='cobros'||kind==='gastos'){
    const tipo=kind==='cobros'?'cobro':'gasto';
    return {titulo:(kind==='cobros'?'Cobros':'Gastos')+' · '+MESES_L[MES]+' '+ANIO,
      cols:['Fecha','Concepto',kind==='cobros'?'Cliente':'Categoría',kind==='cobros'?'Medio':'Proveedor','Medio','Moneda','Importe','Cotización','En pesos','Estado','Vence'],
      filas:movsDelMes(tipo).map(m=>[fDate(m.fecha),m.concepto||'',kind==='cobros'?cliNom(m.clienteId):(m.categoria||''),
        kind==='cobros'?(m.medio||''):(m.proveedorId?cliNom(m.proveedorId):''),m.medio||'',m.moneda||'UYU',
        nf(m.importe,m.moneda!=='UYU'),m.cotizacion||'',nf(valMov(m).uyu),estadoMov(m),m.vence?fDate(m.vence):''])};
  }
  return {titulo:'',cols:[],filas:[]};
}

function doExport(kind,fmt){
  const d=datosExport(kind);
  if(!d.filas.length){ toast('No hay nada para exportar'); return; }
  if(fmt==='xls') exportExcel(d.titulo,d.cols,d.filas);
  else exportPDFTabla(d.titulo,d.cols,d.filas);
}

/* Excel: se genera una tabla que Excel abre directo (no hace falta instalar nada). */
function exportExcel(titulo,cols,filas){
  const cab='<tr style="background:'+COL.azul+';color:#fff">'+cols.map(c=>'<th style="padding:6px 10px;border:1px solid '+COL.azulOsc+';text-align:left">'+esc(c)+'</th>').join('')+'</tr>';
  const cuerpo=filas.map((f,i)=>'<tr style="background:'+(i%2?'#f2f4fb':'#ffffff')+'">'
    +f.map(x=>'<td style="padding:5px 10px;border:1px solid '+COL.borde+';mso-number-format:\'\@\'">'+(x==null?'':esc(String(x)))+'</td>').join('')+'</tr>').join('');
  const html='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body>'
    +'<table><tr><td style="font-family:Arial;font-size:18px;color:'+COL.azul+'"><b>'+esc(Store.cfg().negocio.nombre)+'</b></td></tr>'
    +'<tr><td style="font-size:12px;color:'+COL.gris+'">'+esc(titulo)+' — '+fDate(hoyISO())+'</td></tr></table><br>'
    +'<table style="border-collapse:collapse;font-family:Arial;font-size:12px">'+cab+cuerpo+'</table>'
    +'<br><table><tr><td style="font-family:Arial;font-size:9px;color:#9aa0b8;letter-spacing:1px">Desarrollado por WYDAN SOLUTIONS</td></tr></table>'
    +'</body></html>';
  const blob=new Blob(['﻿'+html],{type:'application/vnd.ms-excel'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=titulo.replace(/[^\wáéíóúñÁÉÍÓÚÑ]+/g,'_')+'.xls'; a.click(); toast('Excel generado');
}

function exportPDFTabla(titulo,cols,filas){
  abrirPDF(titulo,'<h2>'+esc(titulo)+'</h2><table><thead><tr>'+cols.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'
    +filas.map(f=>'<tr>'+f.map(x=>'<td>'+(x==null?'':esc(String(x)))+'</td>').join('')+'</tr>').join('')
    +'</tbody></table><p class="pie">Generado desde el sistema de gestión · '+fDate(hoyISO())+'</p>');
}
