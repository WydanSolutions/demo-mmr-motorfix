/*
 * ADJUNTOS: las fotos de los presupuestos y las facturas de los repuestos.
 *
 * Por qué están aparte: en la nube cada registro es un documento y un documento no puede pasar
 * de 1 MB. Una foto sacada con el celular pesa mucho más que eso. Entonces:
 *   1. al agregarla, la foto se ACHICA en la computadora antes de subirla (nadie necesita 12 megapíxeles
 *      para ver una junta rota);
 *   2. cada foto se guarda en su propio documento de la colección «adjuntos»;
 *   3. en el presupuesto o en la orden queda solo la referencia (un nombre y un código), así abrir
 *      la lista de presupuestos no se lleva puesta la conexión;
 *   4. las fotos se bajan recién cuando se abre ese presupuesto o esa orden, y quedan en memoria.
 *
 * En MODO_DEMO (los links de demostración) no hay nube: la foto queda dentro del registro, como antes.
 */

const ADJ_MAX_LADO=1400;        // lado más largo de la foto, en puntos
const ADJ_CALIDAD=0.72;         // calidad del JPEG (0 a 1)
const ADJ_MAX_BYTES=700*1024;   // lo máximo que puede pesar un adjunto ya achicado
const ADJ_MAX_ARCHIVO=8*1024*1024;  // lo máximo que se acepta elegir (antes de achicar)

/* Lo que ya se bajó, para no pedirlo dos veces: código → contenido del archivo */
const ADJ_CACHE=new Map();

/* Dirección para mostrar o descargar un adjunto (sirva o no haya llegado todavía) */
function adjUrl(a){
  if(!a) return '';
  return a.datos || (a.ref? (ADJ_CACHE.get(a.ref)||'') : '');
}

/* ---------- SUBIR ---------- */
/* Devuelve el adjunto listo para guardar en el registro, o null si no se pudo. */
async function adjSubir(file){
  if(!file) return null;
  if(file.size>ADJ_MAX_ARCHIVO){ toast('«'+file.name+'» pesa demasiado (máximo 8 MB)'); return null; }
  let datos, tipo=file.type||'';
  if(/^image\//i.test(tipo)){
    datos=await adjAchicar(file);
    tipo='image/jpeg';
  }else{
    datos=await adjLeer(file);
    if(datos.length>ADJ_MAX_BYTES*1.37){ toast('«'+file.name+'» pesa demasiado. Si es un PDF, mandá una foto.'); return null; }
  }
  const nombre=file.name||'archivo';
  if(MODO_DEMO) return {nombre:nombre,tipo:tipo,datos:datos};
  const ref='adj'+nuevoId();
  try{
    await fbDb.collection('adjuntos').doc(ref).set({nombre:nombre,tipo:tipo,datos:datos,_t:Date.now()});
  }catch(e){ console.error('Adjunto',e); toast('No se pudo subir «'+nombre+'». Revisá la conexión.'); return null; }
  ADJ_CACHE.set(ref,datos);
  return {nombre:nombre,tipo:tipo,ref:ref};
}

/* Achica la foto con el lienzo del navegador hasta que entre en el límite */
function adjAchicar(file){
  return new Promise(function(resolve,reject){
    const url=URL.createObjectURL(file), img=new Image();
    img.onload=function(){
      const escala=Math.min(1, ADJ_MAX_LADO/Math.max(img.width,img.height));
      const c=document.createElement('canvas');
      c.width=Math.max(1,Math.round(img.width*escala));
      c.height=Math.max(1,Math.round(img.height*escala));
      const x=c.getContext('2d');
      x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height);   // por si la imagen es transparente
      x.drawImage(img,0,0,c.width,c.height);
      URL.revokeObjectURL(url);
      let q=ADJ_CALIDAD, out=c.toDataURL('image/jpeg',q);
      while(out.length>ADJ_MAX_BYTES*1.37 && q>0.35){ q-=0.12; out=c.toDataURL('image/jpeg',q); }
      resolve(out);
    };
    img.onerror=function(){ URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen')); };
    img.src=url;
  });
}
function adjLeer(file){
  return new Promise(function(resolve,reject){
    const r=new FileReader();
    r.onload=()=>resolve(r.result);
    r.onerror=()=>reject(r.error);
    r.readAsDataURL(file);
  });
}

/* ---------- BAJAR ---------- */
/* Trae de la nube los adjuntos de un presupuesto o de una orden. Se llama al abrirlo. */
async function adjCargarDe(registro){
  if(MODO_DEMO||!fbDb||!registro) return;
  const faltan=adjRefsDe(registro).filter(r=>!ADJ_CACHE.has(r));
  if(!faltan.length) return;
  for(const ref of faltan){
    try{
      const d=await fbDb.collection('adjuntos').doc(ref).get();
      ADJ_CACHE.set(ref, d.exists? (d.data().datos||'') : '');
    }catch(e){ console.error('Adjunto',ref,e); }
  }
}
/* Códigos de todos los adjuntos que cuelgan de un registro */
function adjRefsDe(registro){
  const refs=[];
  if(!registro) return refs;
  (registro.imagenes||[]).forEach(a=>{ if(a&&a.ref) refs.push(a.ref); });
  (registro.repuestos||[]).forEach(r=>{ if(r&&r.adjunto&&r.adjunto.ref) refs.push(r.adjunto.ref); });
  return refs;
}

/* ---------- BORRAR ---------- */
function adjBorrar(a){
  if(!a||!a.ref||MODO_DEMO||!fbDb) return;
  ADJ_CACHE.delete(a.ref);
  fbDb.collection('adjuntos').doc(a.ref).delete().catch(e=>console.error('Adjunto',e));
}
/* Al borrar un presupuesto o una orden se llevan también sus adjuntos (lo llama Store.del) */
function adjBorrarDe(registro){
  if(MODO_DEMO||!fbDb) return;
  adjRefsDe(registro).forEach(ref=>adjBorrar({ref:ref}));
}
