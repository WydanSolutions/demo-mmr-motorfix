/*
 * ESQUEMA DEL CAMIÓN: el dibujo del camión visto desde arriba, para marcar cómo entró.
 *
 * Se toca una zona y queda marcada como golpe o rayón (si se marcan las dos, queda «golpe y rayón»).
 * Sirve de constancia: va en el PDF de la orden, así después no hay discusión por un golpe que ya venía.
 * Lo marcado se guarda en la propia orden, en `o.danios`.
 */

/* Zonas del camión (cabina, caja y las seis cubiertas) */
const ZONAS_CAMION={
  pdel:'Paragolpes delantero', parab:'Parabrisas', techo:'Techo de cabina',
  pi:'Puerta izquierda', pd:'Puerta derecha', ei:'Espejo izquierdo', ed:'Espejo derecho',
  esti:'Estribo izquierdo', estd:'Estribo derecho', chasis:'Chasis', tanque:'Tanque de combustible',
  caja:'Caja / carrocería', lati:'Lateral izq. de la caja', latd:'Lateral der. de la caja',
  porton:'Portón trasero', ptras:'Paragolpes trasero',
  cdi:'Cubierta del. izq.', cdd:'Cubierta del. der.',
  c1i:'Cubierta tras. izq. (1.er eje)', c1d:'Cubierta tras. der. (1.er eje)',
  c2i:'Cubierta tras. izq. (2.º eje)', c2d:'Cubierta tras. der. (2.º eje)',
};
const FORMAS_CAMION={
  pdel:'<path d="M44 26Q110 12 176 26V38H44Z"/>',
  parab:'<path d="M56 42H164L156 72H64Z"/>',
  techo:'<rect x="64" y="76" width="92" height="56" rx="8"/>',
  ei:'<rect x="8" y="74" width="18" height="13" rx="4"/>', ed:'<rect x="194" y="74" width="18" height="13" rx="4"/>',
  pi:'<rect x="30" y="76" width="28" height="52" rx="4"/>', pd:'<rect x="162" y="76" width="28" height="52" rx="4"/>',
  esti:'<rect x="32" y="132" width="24" height="13" rx="3"/>', estd:'<rect x="164" y="132" width="24" height="13" rx="3"/>',
  chasis:'<rect x="78" y="136" width="64" height="26" rx="4"/>',
  tanque:'<rect x="30" y="150" width="26" height="42" rx="6"/>',
  caja:'<rect x="58" y="166" width="104" height="210" rx="6"/>',
  lati:'<rect x="30" y="200" width="24" height="148" rx="4"/>', latd:'<rect x="166" y="200" width="24" height="148" rx="4"/>',
  porton:'<rect x="58" y="380" width="104" height="30" rx="5"/>',
  ptras:'<path d="M44 414H176V428Q110 442 44 428Z"/>',
  cdi:'<rect x="12" y="100" width="15" height="44" rx="5"/>', cdd:'<rect x="193" y="100" width="15" height="44" rx="5"/>',
  c1i:'<rect x="12" y="248" width="15" height="44" rx="5"/>', c1d:'<rect x="193" y="248" width="15" height="44" rx="5"/>',
  c2i:'<rect x="12" y="298" width="15" height="44" rx="5"/>', c2d:'<rect x="193" y="298" width="15" height="44" rx="5"/>',
};
const MARCA_TXT={golpe:'Golpe', rayon:'Rayón', ambos:'Golpe y rayón'};
let MODO_DANIO='golpe';

/* Dibujo. `editable` false = solo para mirar (se usa en el PDF). */
function esquemaCamion(danios,editable){
  danios=danios||{};
  return '<svg class="esq-camion'+(editable?' editable':'')+'" viewBox="0 0 220 462" '
    +'role="'+(editable?'group':'img')+'" aria-label="Esquema del camión, visto desde arriba">'
    +'<text x="110" y="10" text-anchor="middle">FRENTE</text>'
    +Object.keys(FORMAS_CAMION).map(function(z){
      const d=danios[z];
      return '<g class="zona'+(d?' d-'+d:'')+'" data-z="'+z+'"'
        +(editable?' tabindex="0" role="button" aria-label="'+esc(ZONAS_CAMION[z])+(d?': '+MARCA_TXT[d]:'')+'"'
          +' onclick="tocarZonaCamion(\''+z+'\')"'
          +' onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();tocarZonaCamion(\''+z+'\')}"':'')
        +'><title>'+esc(ZONAS_CAMION[z])+'</title>'+FORMAS_CAMION[z]+'</g>';
    }).join('')
    +'<text x="110" y="458" text-anchor="middle">ATRÁS</text></svg>';
}

/* Lista de lo marcado, al lado del dibujo */
function listaDanios(danios){
  const l=Object.keys(danios||{});
  if(!l.length) return '<div class="muted-cell">Sin marcas. Tocá una zona del camión para marcarla.</div>';
  return '<ul class="lista-danios">'+l.map(function(z){
    return '<li><i class="m-'+danios[z]+'"></i><span>'+esc(ZONAS_CAMION[z])+'</span><b>'+MARCA_TXT[danios[z]]+'</b></li>';
  }).join('')+'</ul>';
}

/* Tarjeta completa (dibujo + botones + lista). Va en la ficha de la orden. */
function tarjetaEsquema(o){
  return '<div class="card"><div class="card-head"><h3>Estado del camión al ingresar</h3>'
    +'<span class="csub">Tocá la zona para marcarla · va en el PDF de la orden</span></div>'
    +'<div class="card-body"><div class="esq-caja">'
      +'<div>'+esquemaCamion(o.danios,true)+'</div>'
      +'<div>'
        +'<div class="esq-modos">'
          +'<button class="modo-d'+(MODO_DANIO==='golpe'?' on':'')+'" onclick="setModoDanio(\'golpe\')"><i class="m-golpe"></i>Marcar golpes</button>'
          +'<button class="modo-d'+(MODO_DANIO==='rayon'?' on':'')+'" onclick="setModoDanio(\'rayon\')"><i class="m-rayon"></i>Marcar rayones</button>'
        +'</div>'
        +'<div id="danios-lista">'+listaDanios(o.danios)+'</div>'
        +((o.danios&&Object.keys(o.danios).length)?'<button class="btn btn-sm" style="margin-top:10px" onclick="limpiarDanios()">Borrar todas las marcas</button>':'')
      +'</div>'
    +'</div></div></div>';
}

function setModoDanio(m){
  MODO_DANIO=m;
  document.querySelectorAll('.modo-d').forEach(function(b){ b.classList.remove('on'); });
  const i=document.querySelector('.modo-d i.m-'+m); if(i) i.parentElement.classList.add('on');
}
function tocarZonaCamion(z){
  const o=ordObj(); if(!o) return;
  o.danios=o.danios||{};
  const act=o.danios[z], otro=MODO_DANIO==='golpe'?'rayon':'golpe';
  let nuevo;
  if(!act) nuevo=MODO_DANIO; else if(act===MODO_DANIO) nuevo=''; else if(act===otro) nuevo='ambos'; else nuevo=otro;
  if(nuevo) o.danios[z]=nuevo; else delete o.danios[z];
  Store.upsert('ordenes',o);
  // se repinta solo la zona y la lista, para no perder el lugar de la pantalla
  const g=document.querySelector('.esq-camion g[data-z="'+z+'"]');
  if(g) g.setAttribute('class','zona'+(nuevo?' d-'+nuevo:''));
  const lista=$('#danios-lista'); if(lista) lista.innerHTML=listaDanios(o.danios);
}
function limpiarDanios(){
  confirmar('Borrar las marcas','Se borran todos los golpes y rayones marcados en este camión.',function(){
    const o=ordObj(); if(!o)return; o.danios={}; Store.upsert('ordenes',o); renderRep();
  },'Sí, borrar');
}
