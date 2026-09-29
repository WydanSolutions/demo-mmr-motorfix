/*
 * ENVÍO DEL PRESUPUESTO: texto para WhatsApp, mail y PDF con el logo y los colores de MMR.
 * En WhatsApp va SOLO texto (así lo pidió el taller): las fotos se descargan con el ícono ⬇
 * de cada imagen y se adjuntan a mano en el chat.
 */

/* Texto del presupuesto en palabras (sirve para WhatsApp y para el cuerpo del mail) */
function presTexto(p){
  const cfg=Store.cfg(), cam=camionPorMat(p.matricula);
  let t=(p.saludoTxt||saludo())+'\n\n';
  t+='*'+cfg.negocio.nombre+'* — Presupuesto N° '+p.nro+'\n';
  t+='Fecha: '+fDate(p.fecha)+' · Válido hasta el '+fDate(presVence(p))+'\n';
  if(p.matricula) t+='Camión: '+(p.matricula||'').toUpperCase()+(cam?' — '+cam.marca+' '+cam.modelo:'')+'\n';
  if(p.asunto) t+='Asunto: '+p.asunto+'\n';
  t+='\n';
  if(p.texto) t+=p.texto+'\n\n';
  const ls=(p.lineas||[]).filter(l=>l.desc);
  if(ls.length){
    t+='Detalle:\n';
    ls.forEach(l=>{ t+='• '+l.desc+(l.cant>1?' (x'+l.cant+')':'');
      if(p.mostrarPrecios) t+=' — '+fPesos((+l.cant||0)*(+l.precio||0));
      t+='\n'; });
    t+='\n';
  }
  if(p.discriminar&&p.mostrarPrecios){
    t+='Repuestos: '+fPesos(presTotalPor(p,'Repuesto'))+'\n';
    t+='Mano de obra: '+fPesos(presTotalPor(p,'Mano de obra'))+'\n';
    t+='Servicios: '+fPesos(presTotalPor(p,'Servicio'))+'\n';
  }
  t+='*TOTAL: '+fPesos(presTotal(p))+'*\n\n';
  if((p.imagenes||[]).length) t+='(Te mando '+p.imagenes.length+' foto(s) aparte.)\n\n';
  t+='Cualquier duda quedamos a las órdenes.\n'+cfg.negocio.nombre+(cfg.negocio.tel?' · '+cfg.negocio.tel:'');
  return t;
}

/* Guarda en el presupuesto que se envió (queda el registro con fecha) */
function presRegistrarEnvio(p,via,destino){
  p.envios=p.envios||[]; p.envios.push({via:via,fecha:hoyISO(),destino:destino||''});
  if(p.estado==='Borrador') p.estado='Enviado';
  Store.upsert('presupuestos',p);
}

/* Busca el teléfono o el mail del cliente. Si no lo tiene cargado lo pide y lo guarda en su ficha.
   Cuando lo consigue llama a alTenerlo(dato). */
function pedirContacto(p,tipo,alTenerlo){
  const cli=Store.get('clientes',p.clienteId);
  const v=cli?(tipo==='tel'?cli.tel:cli.mail):'';
  if(v){ alTenerlo(v); return; }
  preguntar(tipo==='tel'?'¿A qué celular se lo mandamos?':'¿A qué correo se lo mandamos?',
    tipo==='tel'?'Celular (ej.: 099 123 456)':'Correo electrónico','',
    function(nuevo){
      if(cli){ if(tipo==='tel')cli.tel=nuevo; else cli.mail=nuevo; Store.upsert('clientes',cli); toast('Se guardó en la ficha de '+cli.nombre); }
      else Store.upsert('contactos',{nombre:(p.matricula||'Sin nombre'),tel:tipo==='tel'?nuevo:'',mail:tipo==='mail'?nuevo:''});
      alTenerlo(nuevo);
    }, tipo==='tel'?'tel':'email');
}

function presWhatsApp(){
  const p=presObj();
  pedirContacto(p,'tel',function(tel){
    presRegistrarEnvio(p,'WhatsApp',tel);
    window.open(linkWa(tel,presTexto(p)),'_blank');
    if((p.imagenes||[]).length) toast('Acordate de adjuntar las fotos a mano (ícono ⬇ en cada imagen)');
    renderPresup();
  });
}
function presMail(){
  const p=presObj();
  pedirContacto(p,'mail',function(mail){
    presRegistrarEnvio(p,'Mail',mail);
    window.open(linkMail(mail,'Presupuesto N° '+p.nro+' — '+Store.cfg().negocio.nombre,presTexto(p).replace(/\*/g,'')),'_blank');
    if((p.imagenes||[]).length) toast('Descargá las imágenes y adjuntalas al correo (ícono ⬇)');
    renderPresup();
  });
}

/* ---------- PDF (se abre listo para imprimir o guardar como PDF) ---------- */
function presPDF(){
  const p=presObj(), cfg=Store.cfg(), cam=camionPorMat(p.matricula), cli=Store.get('clientes',p.clienteId);
  const ls=(p.lineas||[]).filter(l=>l.desc);
  const filas=ls.map(l=>'<tr><td>'+esc(l.desc)+'</td><td>'+esc(l.tipo||'')+'</td>'
    +(p.mostrarPrecios?'<td class="n">'+nf(l.cant,false)+'</td><td class="n">'+fPesos(l.precio)+'</td><td class="n">'+fPesos((+l.cant||0)*(+l.precio||0))+'</td>':'<td class="n">'+nf(l.cant,false)+'</td>')
    +'</tr>').join('');
  const cols=p.mostrarPrecios?'<th>Descripción</th><th>Tipo</th><th class="n">Cant.</th><th class="n">Precio</th><th class="n">Subtotal</th>':'<th>Descripción</th><th>Tipo</th><th class="n">Cant.</th>';
  const imgs=(p.imagenes||[]).map(im=>'<img src="'+adjUrl(im)+'">').join('');
  const disc=(p.discriminar&&p.mostrarPrecios)?
    '<div class="disc">Repuestos '+fPesos(presTotalPor(p,'Repuesto'))+' · Mano de obra '+fPesos(presTotalPor(p,'Mano de obra'))+' · Servicios '+fPesos(presTotalPor(p,'Servicio'))+'</div>':'';

  abrirPDF('Presupuesto N° '+p.nro,
     '<div class="meta"><div><b>Presupuesto N° '+p.nro+'</b><br>Fecha: '+fDate(p.fecha)+'<br>Válido hasta: '+fDate(presVence(p))+'</div>'
    +'<div><b>Cliente</b><br>'+esc(cli?cli.nombre:'—')+(cli&&cli.contacto?'<br>'+esc(cli.contacto):'')+(cli&&cli.tel?'<br>'+esc(cli.tel):'')+'</div>'
    +'<div><b>Camión</b><br>'+esc((p.matricula||'—').toUpperCase())+(cam?'<br>'+esc(cam.marca+' '+cam.modelo)+(cam.anio?'<br>Año '+cam.anio:''):'')+'</div></div>'
    +(p.asunto?'<h2>'+esc(p.asunto)+'</h2>':'')
    +(p.texto?'<p class="txt">'+esc(p.texto).replace(/\n/g,'<br>')+'</p>':'')
    +(ls.length?'<table><thead><tr>'+cols+'</tr></thead><tbody>'+filas+'</tbody></table>':'')
    +'<div class="total">TOTAL: '+fPesos(presTotal(p))+'</div>'+disc
    +(imgs?'<h3>Imágenes</h3><div class="imgs">'+imgs+'</div>':'')
    +'<p class="pie">Presupuesto válido por '+(p.validezDias||15)+' días. Los precios pueden variar si cambia el costo de los repuestos.</p>');
}

/* Recuadro con los datos para el pago (banco, cuentas y Pix). Va al pie del PDF de la reparación.
   Sale de Configuración → Datos para el pago. Si no hay nada cargado, no se muestra el recuadro. */
function bloquePago(){
  const c=Store.cfg().cobranza||{}, filas=[];
  if(c.cuentaPesos)   filas.push(['Cuenta en pesos',c.cuentaPesos]);
  if(c.cuentaDolares) filas.push(['Cuenta en dólares',c.cuentaDolares]);
  if(c.pix)           filas.push(['Pix',c.pix+(c.pixNombre?' · '+c.pixNombre:'')]);
  if(!filas.length) return '';
  const enc=[c.banco,c.titular].filter(Boolean).join(' · ');
  return '<div class="pago"><div class="pt">Datos para el pago</div>'
    +(enc?'<div class="pe">'+esc(enc)+'</div>':'')
    +'<table class="pl"><tbody>'
    +filas.map(f=>'<tr><td class="pk">'+esc(f[0])+'</td><td class="pv">'+esc(f[1])+'</td></tr>').join('')
    +'</tbody></table>'
    +(c.nota?'<div class="pn">'+esc(c.nota)+'</div>':'')
    +'</div>';
}

/* Documento con el encabezado, el logo y los colores de MMR. Lo usan todas las secciones.
   Primero prueba abrirlo en una pestaña nueva. Si el navegador bloquea las ventanas emergentes,
   lo muestra dentro de la misma página, con un botón para imprimir o guardar como PDF.
   NUNCA se manda a imprimir solo: el cuadro de impresión lo abre siempre la persona. */
function abrirPDF(titulo,cuerpo){
  const html=armarPDF(titulo,cuerpo);
  const w=window.open('','_blank');
  if(w){ w.document.write(html); w.document.close(); setTimeout(()=>{ try{ w.focus(); }catch(e){} },250); return; }
  verDocumento(titulo,html);
}
/* Vista del documento dentro de la página (plan B cuando el navegador bloquea las pestañas nuevas) */
function verDocumento(titulo,html){
  cerrarDocumento();
  const cont=document.createElement('div');
  cont.id='doc-ver';
  cont.innerHTML='<div class="doc-barra"><b>'+esc(titulo)+'</b>'
    +'<span class="spacer"></span>'
    +'<button class="btn btn-sm btn-primary" onclick="imprimirDocumento()">🖨 Imprimir / Guardar como PDF</button>'
    +'<button class="btn btn-sm" onclick="cerrarDocumento()">Cerrar</button></div>'
    +'<iframe id="doc-frame" title="'+esc(titulo)+'"></iframe>';
  document.body.appendChild(cont);
  document.getElementById('doc-frame').srcdoc=html.replace(/<div class="noprint"[\s\S]*?<\/div>/,'');
}
function imprimirDocumento(){ const f=document.getElementById('doc-frame'); if(f){ try{ f.contentWindow.focus(); f.contentWindow.print(); }catch(e){ toast('No se pudo abrir la impresión'); } } }
function cerrarDocumento(){ const v=document.getElementById('doc-ver'); if(v) v.remove(); }
function armarPDF(titulo,cuerpo){
  const cfg=Store.cfg();
  return ('<html><head><meta charset="utf-8"><meta name="color-scheme" content="light"><title>'+esc(titulo)+'</title><style>'
    +'html{background:#fff}'
    +'body{font-family:Arial,Helvetica,sans-serif;color:'+COL.negro+';background:#fff;padding:26px 30px;margin:0;'
      +'-webkit-print-color-adjust:exact;print-color-adjust:exact}'
    +'.hd{display:flex;align-items:center;gap:18px;border-bottom:4px solid '+COL.azul+';padding-bottom:12px;margin-bottom:6px}'
    +'.hd img{height:74px}.hd .t{flex:1}.hd h1{color:'+COL.azul+';font-size:22px;margin:0;text-transform:uppercase;letter-spacing:.5px}'
    +'.hd .s{font-size:11px;letter-spacing:2px;color:'+COL.gris+';text-transform:uppercase;margin-top:3px}'
    +'.hd .d{font-size:11px;color:'+COL.gris+';text-align:right;line-height:1.6}'
    +'.bar{height:5px;background:linear-gradient(90deg,'+COL.rojo+' 0 33%,'+COL.amarillo+' 33% 66%,'+COL.azul+' 66% 100%);margin-bottom:18px}'
    +'h2{color:'+COL.azul+';font-size:17px;margin:14px 0 6px}h3{color:'+COL.azul+';font-size:14px;margin:18px 0 6px}'
    +'.meta{display:flex;gap:26px;flex-wrap:wrap;font-size:12px;line-height:1.7;background:'+COL.azulClaro+';padding:12px 14px;border-radius:8px}'
    +'.meta b{color:'+COL.azul+'}'
    +'.txt{font-size:13px;line-height:1.6;margin:10px 0 16px;white-space:pre-line}'
    +'table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}'
    +'th{background:'+COL.azul+';color:#fff;text-align:left;padding:8px 10px;font-size:11px;text-transform:uppercase}'
    +'td{border-bottom:1px solid '+COL.borde+';padding:7px 10px}tr:nth-child(even) td{background:#f7f8fc}'
    +'.n{text-align:right}'
    +'.total{margin-top:14px;text-align:right;font-size:20px;font-weight:bold;color:'+COL.azul+';border-top:3px solid '+COL.amarillo+';padding-top:10px}'
    +'.disc{text-align:right;font-size:11.5px;color:'+COL.gris+';margin-top:4px}'
    +'.imgs{display:flex;flex-wrap:wrap;gap:10px}.imgs img{width:31%;border-radius:8px;border:1px solid '+COL.borde+'}'
    +'.pie{margin-top:22px;font-size:10.5px;color:'+COL.gris+';border-top:1px solid '+COL.borde+';padding-top:10px}'
    +'.pago{margin-top:22px;background:'+COL.azulClaro+';border:1px solid '+COL.borde+';border-left:5px solid '+COL.amarillo+';'
      +'border-radius:8px;padding:12px 16px;page-break-inside:avoid}'
    +'.pago .pt{color:'+COL.azul+';font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:.6px}'
    +'.pago .pe{font-size:12px;margin-top:2px}'
    +'.pago table.pl{width:auto;margin-top:8px;font-size:12.5px}'
    +'.pago table.pl td,.pago table.pl tr:nth-child(even) td{border:none;background:none;padding:3px 0}'
    +'.pago table.pl td.pk{color:'+COL.gris+';padding-right:22px;white-space:nowrap}'
    +'.pago .pv{font-weight:bold;letter-spacing:.3px}'
    +'.pago .pn{margin-top:7px;font-size:11px;color:'+COL.gris+'}'
    /* Esquema del camión dentro del PDF de la orden */
    +'.esq-pdf{display:flex;gap:20px;align-items:flex-start;margin-top:6px;page-break-inside:avoid}'
    +'.esq-pdf svg{width:150px;height:auto;flex:none}'
    +'.esq-pdf .zona{fill:#f3f4f9;stroke:'+COL.azul+';stroke-width:1.5}'
    +'.esq-pdf .zona.d-golpe{fill:#D9480F;stroke:#D9480F}'
    +'.esq-pdf .zona.d-rayon{fill:#6A4BC0;stroke:#6A4BC0}'
    +'.esq-pdf .zona.d-ambos{fill:#B0124E;stroke:#B0124E}'
    +'.esq-pdf text{fill:'+COL.gris+';font-size:9px;letter-spacing:1.4px;font-weight:600}'
    +'.esq-pdf ul{list-style:none;margin:0;padding:0;font-size:12px}'
    +'.esq-pdf li{display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid '+COL.borde+'}'
    +'.esq-pdf li span{flex:1}.esq-pdf li b{color:'+COL.azul+'}'
    +'.esq-pdf i{width:11px;height:11px;border-radius:3px;display:inline-block;flex:none}'
    +'.esq-pdf i.m-golpe{background:#D9480F}.esq-pdf i.m-rayon{background:#6A4BC0}.esq-pdf i.m-ambos{background:#B0124E}'
    +'.wy{margin-top:26px;padding-top:10px;border-top:1px solid '+COL.borde+';display:flex;align-items:center;justify-content:center;gap:7px;font-size:9px;letter-spacing:1.2px;color:#9aa0b8;opacity:.75}'
    +'.wy img{height:20px;width:auto;opacity:.8}.wy b{letter-spacing:1.8px;color:'+COL.azul+';opacity:.85}'
    +'@media print{.noprint{display:none}}'
    +'</style></head><body>'
    +'<div class="hd"><img src="'+logoPDF()+'"><div class="t"><h1>'+esc(cfg.negocio.nombre)+'</h1>'
      +'<div class="s">'+esc(cfg.negocio.sigla||'MMR')+' · '+esc(cfg.negocio.ciudad||'')+' · '+esc(cfg.negocio.pais||'')+'</div></div>'
      +'<div class="d">'+(cfg.negocio.direccion?esc(cfg.negocio.direccion)+'<br>':'')+(cfg.negocio.tel?esc(cfg.negocio.tel)+'<br>':'')+(cfg.negocio.mail?esc(cfg.negocio.mail):'')+'</div></div>'
    +'<div class="bar"></div>'
    +cuerpo
    +'<div class="wy">'+(WYDAN_DATA?'<img src="'+WYDAN_DATA+'">':'')+'Desarrollado por <b>WYDAN SOLUTIONS</b></div>'
    +'<div class="noprint" style="margin-top:26px;text-align:center"><button onclick="window.print()" style="padding:11px 20px;background:'+COL.azul+';color:#fff;border:none;border-radius:8px;font-weight:bold;font-size:14px;cursor:pointer">🖨 Imprimir / Guardar como PDF</button></div>'
    +'</body></html>');
}
