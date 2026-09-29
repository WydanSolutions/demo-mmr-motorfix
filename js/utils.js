/*
 * Funciones de ayuda que usan todas las secciones: fechas, textos, avisos,
 * la barra para elegir el mes y las etiquetas de estado.
 */
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
function esc(s){return (s==null?'':String(s)).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function p2(n){return String(n).padStart(2,'0');}

/* ---------- FECHAS (siempre dd/mm/aaaa) ---------- */
function hoyISO(){ const d=new Date(); return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate()); }
function fDate(iso){ if(!iso)return '—'; const p=String(iso).slice(0,10).split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }
function fHora(iso){ if(!iso||iso.indexOf('T')<0)return ''; return iso.split('T')[1].slice(0,5); }
function fDateHora(iso){ if(!iso)return '—'; return fDate(iso)+(fHora(iso)?' '+fHora(iso):''); }
function diasEntre(a,b){ if(!a||!b)return null; const x=new Date(String(a).slice(0,10)), y=new Date(String(b).slice(0,10)); return Math.round((y-x)/86400000); }
function diasHasta(iso){ return iso?diasEntre(hoyISO(),iso):null; }
function mesDe(iso){ return iso?String(iso).slice(0,7):''; }          // '2026-09'
function claveMes(a,m){ return a+'-'+p2(m+1); }
function dateOk(el){ if(!el.value)return true; const min=el.min||'2000-01-01',max=el.max||'2099-12-31'; if(el.value<min||el.value>max){ toast('Revisá la fecha: tiene que estar entre '+fDate(min)+' y '+fDate(max)); return false; } return true; }
function modalDatesOk(){ return !$$('#modal-body input[type="date"]').some(i=>!dateOk(i)); }
/* Saludo automático según la hora de Uruguay */
function saludo(){ const h=new Date().getHours(); return h<12?'Buenos días':h<19?'Buenas tardes':'Buenas noches'; }

/* ---------- MES ELEGIDO (lo comparten todas las secciones) ---------- */
let MES=new Date().getMonth(), ANIO=new Date().getFullYear();
function mesActual(){ return claveMes(ANIO,MES); }
function esDelMes(iso){ return mesDe(iso)===mesActual(); }
function cambiarMes(delta){ let m=MES+delta,a=ANIO; if(m<0){m=11;a--;} if(m>11){m=0;a++;} MES=m;ANIO=a; renderView(CUR); }
function irAMes(m,a){ MES=+m; if(a)ANIO=+a; renderView(CUR); }
/* Barra "‹ Setiembre 2026 ›" que se muestra arriba de cada sección */
function barraMes(extra){
  let ops=''; for(let y=ANIO+1;y>=2024;y--) ops+='<option value="'+y+'"'+(y===ANIO?' selected':'')+'>'+y+'</option>';
  let ms=''; MESES.forEach((m,i)=>{ ms+='<option value="'+i+'"'+(i===MES?' selected':'')+'>'+MESES_L[i]+'</option>'; });
  /* ‹ [Mes] [Año] ›  ·  Hoy — el mes aparece una sola vez (antes estaba el título y además los selectores) */
  return '<div class="mesbar">'
    +'<button class="mnav" onclick="cambiarMes(-1)" title="Mes anterior">‹</button>'
    +'<select onchange="irAMes(this.value)" title="Mes">'+ms+'</select>'
    +'<select onchange="ANIO=+this.value;renderView(CUR)" title="Año">'+ops+'</select>'
    +'<button class="mnav" onclick="cambiarMes(1)" title="Mes siguiente">›</button>'
    +'<button class="btn btn-sm" onclick="MES=new Date().getMonth();ANIO=new Date().getFullYear();renderView(CUR)">Mes actual</button>'
    +'<div class="spacer"></div>'+(extra||'')+'</div>';
}

/* ---------- AVISOS Y VENTANITAS ---------- */
function toast(m){ const t=$('#toast'); t.textContent=m; t.classList.add('show'); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),2600); }
function ddMenu(ev,items){ // items: [{t:'texto',fn:'codigo()'}]
  ev.stopPropagation(); const dd=$('#dd');
  dd.innerHTML=items.map(i=>'<button onclick="cerrarDD();'+i.fn+'">'+i.t+'</button>').join('');
  const r=ev.currentTarget.getBoundingClientRect(); dd.classList.add('open');
  dd.style.left=Math.min(r.left,window.innerWidth-dd.offsetWidth-10)+'px';
  dd.style.top=(r.bottom+4+dd.offsetHeight>window.innerHeight?r.top-dd.offsetHeight-4:r.bottom+4)+'px';
}
function cerrarDD(){ $('#dd').classList.remove('open'); }
document.addEventListener('click',cerrarDD);
function toggleMenu(ev){ ev.stopPropagation(); $('#hdr-menu').classList.toggle('open'); }
function cerrarMenu(){ $('#hdr-menu').classList.remove('open'); }
document.addEventListener('click',e=>{ if(!e.target.closest('.hdr-wrap')) cerrarMenu(); });

/* ---------- ETIQUETAS ---------- */
function pill(txt,cls){ return '<span class="pill '+(cls||'p-gris')+'">'+esc(txt)+'</span>'; }
function pillEtapa(id){ return pill(etapaN(id),etapaCls(id)); }
function pillPrio(p){ return pill(p||'—',p==='Alta'?'p-rojo':p==='Media'?'p-amarillo':'p-gris'); }
/* Quién paga el trabajo: cliente (se cobra), garantía (lo paga la marca) o interno (del taller) */
function pillCargo(c){ c=c||'Cliente'; return pill(c,c==='Garantía'?'p-amarillo':c==='Interno'?'p-gris':'p-verde'); }
/* Estado de un cobro o de un gasto. "Vencido" no se carga: sale solo cuando queda
   pendiente y ya pasó la fecha de vencimiento. */
function estadoMov(m){
  if(m.estado==='cobrado'||m.estado==='pagado') return m.tipo==='gasto'?'Pagado':'Cobrado';
  if(m.vence&&m.vence<hoyISO()) return 'Vencido';
  return 'Pendiente';
}
function pillEstadoMov(m){
  const e=estadoMov(m);
  return pill(e,e==='Vencido'?'p-rojo':e==='Pendiente'?'p-amarillo':'p-verde');
}
function pillEstPres(e){ return pill(e,PRES_CLS[e]||'p-gris'); }
/* Etiqueta de estado que se puede cambiar desde la misma celda: se toca y se despliegan
   las opciones, sin tener que abrir el formulario con el lápiz. */
function pillCambiable(texto,cls,opciones,fnNombre,id){
  const items=opciones.map(o=>({t:o, fn:fnNombre+"('"+id+"','"+o+"')"}));
  /* Las comillas simples del código van escapadas (&#39;): si no, cortan el atributo onclick. */
  const datos=JSON.stringify(items).replace(/'/g,'&#39;').replace(/"/g,'&quot;');
  return '<span class="pill clk '+(cls||'p-gris')+'" title="Tocá para cambiar el estado" '
    +'onclick="event.stopPropagation();ddMenu(event,'+datos+')">'+esc(texto)+' ▾</span>';
}
/* Matrícula dibujada como la chapa del Mercosur (la banda azul arriba se pinta con CSS). */
/* Dibuja la matrícula como la chapa del Mercosur. El país sale de la ficha del camión.
   Las dos chapas son del Mercosur, así que el fondo es blanco y la banda azul en las dos:
   lo que las diferencia de verdad es el nombre del país y la banderita de la derecha. */
function matTag(m,pais){
  if(!pais){ const c=camionPorMat(m); pais=(c&&c.pais)||'Uruguay'; }
  return '<span class="placa'+(pais==='Brasil'?' br':' uy')+'">'
    +'<i><span>'+esc(pais.toUpperCase())+'</span>'+banderita(pais)+'</i>'
    +'<b>'+esc((m||'').toUpperCase())+'</b></span>';
}
/* Banderita chica para la banda de la chapa (se dibuja, no es una imagen) */
function banderita(pais){
  if(pais==='Brasil')
    return '<svg class="pl-bandera" viewBox="0 0 20 14" aria-hidden="true">'
      +'<rect width="20" height="14" fill="#009B3A"/>'
      +'<path d="M10 1.6 18.2 7 10 12.4 1.8 7Z" fill="#FEDF00"/>'
      +'<circle cx="10" cy="7" r="3" fill="#002776"/></svg>';
  return '<svg class="pl-bandera" viewBox="0 0 20 14" aria-hidden="true">'
    +'<rect width="20" height="14" fill="#fff"/>'
    +'<g fill="#0038A8"><rect y="3.1" width="20" height="1.6"/><rect y="6.2" width="20" height="1.6"/>'
    +'<rect y="9.3" width="20" height="1.6"/><rect y="12.4" width="20" height="1.6"/></g>'
    +'<rect width="8.4" height="7.8" fill="#fff"/>'
    +'<circle cx="4.2" cy="3.9" r="2.1" fill="#FCD116"/></svg>';
}
function semaforo(estado,titulo){ return '<span class="sem sem-'+estado+'" title="'+esc(titulo||'')+'"></span>'; }
function acciones(kind,id){ return '<div class="row-act"><button class="btn-ghost" title="Editar" onclick="event.stopPropagation();openForm(\''+kind+'\',\''+id+'\')">✎</button><button class="btn-ghost" title="Eliminar" style="color:var(--rojo)" onclick="event.stopPropagation();borrar(\''+kind+'\',\''+id+'\')">🗑</button></div>'; }
function filaVacia(cols,msg){ return '<tr><td colspan="'+cols+'"><div class="empty"><div class="e-ico">🧰</div><p>'+msg+'</p></div></td></tr>'; }

/* ---------- VENTANAS DE AVISO Y CONFIRMACIÓN (propias, no las del navegador) ----------
   Los cuadros que trae el navegador (confirm / alert / prompt) frenan toda la página
   mientras están abiertos y en algunos navegadores ni se ven. Estas hacen lo mismo
   pero con el diseño de la página y sin trabar nada. */
function avisar(titulo,texto,alCerrar){
  openModal(titulo,'<p style="font-size:14px;line-height:1.6">'+esc(texto).replace(/\n/g,'<br>')+'</p>',
    function(){ closeModal(); if(alCerrar)alCerrar(); },'Entendido');
}
function confirmar(titulo,texto,alConfirmar,txtBoton,peligro){
  openModal(titulo,'<p style="font-size:14px;line-height:1.6">'+esc(texto).replace(/\n/g,'<br>')+'</p>',
    function(){ closeModal(); alConfirmar(); },txtBoton||'Sí, continuar');
  if(peligro) $('#modal-save').classList.add('btn-rojo');
}
function preguntar(titulo,etiqueta,valor,alResponder,tipo){
  openModal(titulo,'<div class="field"><label>'+esc(etiqueta)+'</label>'
    +'<input id="preg-valor" type="'+(tipo||'text')+'" value="'+esc(valor||'')+'" autocomplete="off"></div>',
    function(){ const v=$('#preg-valor').value.trim(); closeModal(); if(v)alResponder(v); },'Aceptar');
  setTimeout(()=>{ const i=$('#preg-valor'); if(i){ i.focus(); i.select();
    i.onkeydown=e=>{ if(e.key==='Enter')$('#modal-save').click(); }; } },60);
}

function borrar(col,id){
  confirmar('Eliminar registro','¿Seguro que querés eliminarlo? No se puede deshacer.',
    function(){ Store.del(col,id); toast('Registro eliminado'); renderView(CUR); },'Sí, eliminar',true);
}

/* ---------- EDICIÓN DIRECTA EN TABLAS ---------- */
function cellSet(col,id,campo,valor,redibujar){ const o=Store.get(col,id); if(!o)return; o[campo]=valor; Store.upsert(col,o); if(redibujar)renderView(CUR); }
function cellIn(col,id,campo,valor,opt){
  opt=opt||{}; const d=opt.type==='date';
  return '<input class="cell-in'+(opt.cls?' '+opt.cls:'')+'"'+(opt.type?' type="'+opt.type+'"':'')+(d?DR:'')
    +' value="'+esc(valor==null?'':valor)+'" placeholder="'+(opt.ph||'—')+'" onchange="'+(d?'if(dateOk(this))':'')
    +'cellSet(\''+col+'\',\''+id+'\',\''+campo+'\',this.value,'+(opt.re?'true':'false')+')">';
}

/* ---------- LISTAS PARA AUTOCOMPLETAR ---------- */
function syncListas(){
  const dm=$('#dl-matriculas'); if(dm) dm.innerHTML=Store.all('camiones').map(c=>'<option value="'+esc((c.matricula||'').toUpperCase())+'">'+esc(cliNom(c.clienteId))+'</option>').join('');
  const dc=$('#dl-clientes'); if(dc) dc.innerHTML=soloClientes().map(c=>'<option value="'+esc(c.nombre)+'">').join('');
  const dp=$('#dl-proveedores'); if(dp) dp.innerHTML=soloProveedores().map(c=>'<option value="'+esc(c.nombre)+'">').join('');
}
function selectOps(lista,sel){ return (lista||[]).map(o=>'<option'+(String(o)===String(sel)?' selected':'')+'>'+esc(o)+'</option>').join(''); }
function selectCli(sel,extra){ return '<select '+(extra||'')+'><option value="">— Sin cliente —</option>'+Store.all('clientes').map(c=>'<option value="'+c.id+'"'+(c.id===sel?' selected':'')+'>'+esc(c.nombre)+'</option>').join('')+'</select>'; }
function selectFunc(sel,extra){ return '<select '+(extra||'')+'><option value="">— Funcionario —</option>'+Store.all('funcionarios').map(f=>'<option value="'+f.id+'"'+(f.id===sel?' selected':'')+'>'+esc(f.nombre)+'</option>').join('')+'</select>'; }
function funcNom(id){ const f=Store.get('funcionarios',id); return f?f.nombre:'—'; }

/* ---------- WHATSAPP Y MAIL ---------- */
function soloNumeros(t){ return (t||'').replace(/\D/g,''); }
/* Arma el link de WhatsApp. Uruguay = 598. El mensaje va solo con texto (las fotos se adjuntan a mano). */
function linkWa(tel,texto){
  let n=soloNumeros(tel); if(!n)return '';
  if(n.length<=9) n='598'+n.replace(/^0+/,'');
  return 'https://wa.me/'+n+'?text='+encodeURIComponent(texto||'');
}
function linkMail(mail,asunto,cuerpo){ return 'mailto:'+encodeURIComponent(mail||'')+'?subject='+encodeURIComponent(asunto||'')+'&body='+encodeURIComponent(cuerpo||''); }

/* ---------- RESPALDO MANUAL ---------- */
function respaldar(){
  const blob=new Blob([Store.exportarTodo()],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download='MMR-respaldo-'+hoyISO()+'.json'; a.click(); toast('Respaldo descargado');
}
function restaurar(){
  const i=document.createElement('input'); i.type='file'; i.accept='.json';
  i.onchange=()=>{ const f=i.files[0]; if(!f)return; const r=new FileReader();
    r.onload=()=>{
      confirmar('Restaurar un respaldo','Esto reemplaza TODOS los datos actuales por los del archivo «'+f.name+'». ¿Seguimos?',
        function(){ try{ Store.importarTodo(r.result); renderView(CUR); toast('Datos restaurados'); }
                    catch(e){ avisar('No se pudo leer el archivo',e.message); } },'Sí, restaurar',true);
    };
    r.readAsText(f); };
  i.click();
}

/* ---------- IMÁGENES PARA LOS PDF ----------
   El logo y la marca de Wydan se cargan una vez al abrir la página y quedan guardados como
   dato. Así aparecen siempre en los PDF y en la impresión: si se ponen como enlace, a veces
   la ventana de impresión sale antes de que la imagen termine de bajar y el logo no se ve. */
let LOGO_DATA='', WYDAN_DATA='';
function precargarImagenes(){
  const cargar=(archivo,guardar)=>fetch(new URL(archivo,location.href).href)
    .then(r=>r.blob())
    .then(b=>new Promise(ok=>{ const fr=new FileReader(); fr.onload=()=>{ guardar(fr.result); ok(); }; fr.readAsDataURL(b); }))
    .catch(()=>{});
  cargar('img/logo.png',v=>LOGO_DATA=v);
  cargar('img/wydan.png',v=>WYDAN_DATA=v);
}
const logoPDF=()=>LOGO_DATA||LOGO;

/* ---------- ARCHIVOS ---------- */
/* Las fotos y las facturas adjuntas se manejan en adjuntos.js (se achican y se guardan aparte). */
function descargarDato(nombre,dataUrl){ const a=document.createElement('a'); a.href=dataUrl; a.download=nombre; a.click(); }
