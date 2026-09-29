/*
 * PANTALLA DE TALLER: la vista para poner en un televisor en el taller.
 * Una columna por etapa, letra grande y se refresca sola. Los mecánicos ven de un vistazo
 * qué camión está en cada etapa sin tener que preguntar en administración.
 * Se abre desde Reparaciones y se sale con Escape o con el botón.
 */
let tvTimer=null;

function abrirPantallaTaller(){
  let tv=$('#tv');
  if(!tv){ tv=document.createElement('div'); tv.id='tv'; document.body.appendChild(tv); }
  tv.classList.remove('hidden');
  document.body.classList.add('con-tv');
  pintarPantallaTaller();
  clearInterval(tvTimer);
  tvTimer=setInterval(pintarPantallaTaller,30000);   // se actualiza sola cada 30 segundos
}
function cerrarPantallaTaller(){
  const tv=$('#tv'); if(tv) tv.classList.add('hidden');
  document.body.classList.remove('con-tv');
  clearInterval(tvTimer); tvTimer=null;
}
function pintarPantallaTaller(){
  const tv=$('#tv'); if(!tv||tv.classList.contains('hidden')) return;
  const ahora=new Date();
  const hora=String(ahora.getHours()).padStart(2,'0')+':'+String(ahora.getMinutes()).padStart(2,'0');
  const abiertas=enTaller();

  const cols=ETAPAS.filter(e=>e.id!=='entregada').map(e=>{
    const os=abiertas.filter(o=>o.etapa===e.id);
    return '<div class="tv-col">'
      +'<div class="tv-col-h '+e.cls+'"><span>'+esc(e.n)+'</span><i>'+os.length+'</i></div>'
      +'<div class="tv-col-b">'+(os.length?os.map(o=>{
          const cam=camionPorMat(o.matricula), d=diasEnTaller(o);
          return '<div class="tv-tarj'+(d>15?' tv-atras':'')+'">'
            +matTag(o.matricula)
            +'<div class="tv-cli">'+esc(cliNom(o.clienteId))+'</div>'
            +'<div class="tv-cam">'+esc(cam?cam.marca+' '+cam.modelo:'—')+'</div>'
            +'<div class="tv-pie">N° '+o.nro+'<span>'+d+' día(s)</span></div>'
          +'</div>';
        }).join(''):'<div class="tv-vacio">—</div>')+'</div></div>';
  }).join('');

  tv.innerHTML='<div class="tv-cab">'
      +'<img src="img/logo.png" alt="">'
      +'<h1>'+esc(Store.cfg().negocio.nombre)+' · Taller en vivo</h1>'
      +'<div class="tv-hora">'+hora+'</div>'
      +'<button class="tv-salir" onclick="cerrarPantallaTaller()">Salir ✕</button>'
    +'</div>'
    +'<div class="tv-cols">'+cols+'</div>'
    +'<div class="tv-pie-gral">'+abiertas.length+' camión(es) en el taller · se actualiza sola</div>';
}
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&$('#tv')&&!$('#tv').classList.contains('hidden')) cerrarPantallaTaller();
});
