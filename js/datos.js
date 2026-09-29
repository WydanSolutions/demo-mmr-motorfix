/*
 * CAPA DE DATOS. Es el único archivo que sabe DÓNDE se guardan los datos.
 * El resto de la página solo usa Store.all / Store.get / Store.upsert / Store.del.
 *
 * - Página real: cada registro (cliente, camión, presupuesto, orden, cobro…) es un
 *   DOCUMENTO PROPIO en Firestore. Al guardar se suben solo los documentos que cambiaron,
 *   y lo que se carga desde otro dispositivo llega solo, sin recargar la página.
 * - MODO_DEMO (links de demostración o ?demo=1): todo queda en el navegador, con datos inventados.
 *
 * Las fotos y las facturas adjuntas NO van dentro del documento del presupuesto ni de la orden:
 * van en la colección «adjuntos», una por documento, y se bajan solo cuando se abren (ver adjuntos.js).
 */

/* Colecciones: cada elemento es un registro propio (un documento en la nube). */
const COLS=['clientes','camiones','presupuestos','ordenes','movimientos','funcionarios','contactos'];
/* Lo que se escucha en vivo. «adjuntos» queda afuera a propósito: pesa y se baja a pedido. */
const COLS_NUBE=COLS.concat(['config']);

/* Configuración del taller (listas editables + datos del negocio) */
function cfgDef(){
  return {
    negocio:{nombre:'Mecánica Machado',sigla:'MMR',ciudad:'Rivera',pais:'Uruguay',tel:'',mail:'',direccion:'',rut:''},
    /* Datos para el pago: salen al pie del PDF de la reparación. Se cargan desde Configuración;
       NO van escritos en el código (son datos reales del taller). */
    cobranza:{banco:'',titular:'',cuentaPesos:'',cuentaDolares:'',pixNombre:'',pix:'',nota:''},
    marcas:MARCAS_DEF.slice(),
    medios:MEDIOS_DEF.slice(),
    categorias:CAT_GASTO_DEF.slice(),
    roles:ROLES_DEF.slice(),
    rolesProd:ROLES_PROD_DEF.slice(),   // qué roles cuentan como personal productivo
    /* Precio de la hora de taller que se le cobra al cliente (lo que en la planilla era
       "PRECIO POR HORA AL CLIENTE"). El costo por hora de cada funcionario es otra cosa:
       la diferencia entre los dos es la ganancia del taller. */
    /* Arrancan en cero a propósito: el precio de la hora lo pone el taller en Configuración.
       Un precio inventado en el código podría terminar cobrándose de verdad. */
    precioHora:{cliente:0, garantia:0},
    /* Precio de la hora POR CARGO. Si un cargo no tiene precio propio, se usa el general de arriba. */
    precioHoraRol:{},
    /* Disponibilidad del mes (hoja INF.GRAL. TALLER): con esto se calcula cuántas horas
       puede vender el taller y qué porcentaje se aprovechó. */
    jornada:{dias:22, horas:8.4, faltas:0},
    plantillas:[],            // plantillas de diagnóstico reutilizables
    /* Avisos de la campanita. Qué tipos están prendidos, con cuántos días de anticipación
       avisa, y cuáles ya se marcaron como leídos. Los valores de fábrica y la lista de
       tipos están en encabezado.js (AVISOS_DEF / TIPOS_AVISO). */
    avisos:{},
    avisosDias:{cobros:7, gastos:7, taller:15},
    avisosLeidos:{},
    validezDias:15,           // validez por defecto de un presupuesto
    tc:{},                    // cotizaciones por fecha: {'2026-03-14':{usd:41.2, brl:7.6}}
    tcHoy:{usd:0,brl:0},      // cotización del día (se puede escribir a mano)
    numPres:0, numOrden:0,    // numeración correlativa
  };
}


/* ---------- AYUDAS PARA COMPARAR DOCUMENTOS ---------- */
/* Texto estable de un objeto (claves ordenadas): sirve para saber si un documento cambió de verdad. */
function canon(v){
  if(Array.isArray(v)) return '['+v.map(canon).join(',')+']';
  if(v&&typeof v==='object') return '{'+Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}';
  return JSON.stringify(v===undefined?null:v);
}
const limpio=o=>JSON.parse(JSON.stringify(o));
const porOrden=(a,b)=>((a._t||0)-(b._t||0))||String(a.id).localeCompare(String(b.id));
/* De un adjunto solo se guarda la referencia: los bytes viven en la colección «adjuntos». */
function adjLimpio(a){ return {nombre:(a&&a.nombre)||'', tipo:(a&&a.tipo)||'', ref:(a&&a.ref)||''}; }

/* ---------- STORE ---------- */
const Store={
  data:null,
  _synced:new Map(), _timer:null, _saving:false, _again:false, _unsubs:[],

  /* ----- MODO_DEMO: el navegador ----- */
  load(){
    let g=null; try{ const r=localStorage.getItem(KEY); if(r) g=JSON.parse(r); }catch(e){}
    this.data = g || datosDeEjemplo();
    this._ordenar();
    if(!g) this.save();
  },

  /* ----- Página real: conectar con Firestore y escuchar los cambios ----- */
  connect(){
    this.disconnect();
    this.data={cfg:cfgDef()}; COLS.forEach(c=>this.data[c]=[]);
    return new Promise((resolve,reject)=>{
      const pendientes=new Set(COLS_NUBE);
      COLS_NUBE.forEach(col=>{
        const un=fbDb.collection(col).onSnapshot(snap=>{
          let cambio=false;
          snap.docChanges().forEach(ch=>{
            if(ch.doc.metadata.hasPendingWrites) return;      // es un cambio propio todavía sin confirmar
            const p=col+'/'+ch.doc.id;
            if(ch.type==='removed'){ this._synced.delete(p); cambio=this._quitar(col,ch.doc.id)||cambio; return; }
            const o=ch.doc.data(), s=canon(o);
            this._synced.set(p,s);
            if(canon(this._docOf(p))===s) return;             // ya lo teníamos igual
            this._poner(col,ch.doc.id,o); cambio=true;
          });
          if(pendientes.has(col)){ pendientes.delete(col); if(!pendientes.size){ this._ordenar(); resolve(); } }
          else if(cambio) cambioRemoto();
        }, err=>{ console.error('Firestore',col,err); if(pendientes.size) reject(err); else avisoGuardado('error'); });
        this._unsubs.push(un);
      });
    });
  },
  disconnect(){
    this._unsubs.forEach(u=>{ try{ u(); }catch(e){} });
    this._unsubs=[]; this._synced.clear(); clearTimeout(this._timer); this._timer=null;
    if(!MODO_DEMO) this.data=null;
  },

  /* Coloca en memoria un documento que llegó de la nube */
  _poner(col,id,o){
    if(col==='config'){ if(id==='general') this.data.cfg=Object.assign(cfgDef(),o); return; }
    const arr=this.data[col]||(this.data[col]=[]);
    const x=Object.assign({},o,{id:id});
    const i=arr.findIndex(e=>e.id===id);
    if(i>=0) arr[i]=x; else arr.push(x);
    arr.sort(porOrden);
  },
  _quitar(col,id){
    if(col==='config') return false;
    const arr=this.data[col]||[], n=arr.length;
    this.data[col]=arr.filter(e=>e.id!==id);
    return this.data[col].length!==n;
  },
  /* Cómo se vería en la nube lo que hoy hay en memoria (null si no existe) */
  _docOf(p){
    const i=p.indexOf('/'), col=p.slice(0,i), id=p.slice(i+1);
    if(col==='config') return id==='general'? this._config() : null;
    const o=(this.data[col]||[]).find(e=>e.id===id);
    return o? this._aNube(col,o) : null;
  },
  _config(){ return limpio(this.data.cfg||{}); },
  _aNube(col,o){
    const x={}; Object.keys(o).forEach(k=>{ if(k!=='id') x[k]=o[k]; });
    if(Array.isArray(x.imagenes)) x.imagenes=x.imagenes.map(adjLimpio);
    if(Array.isArray(x.repuestos)) x.repuestos=x.repuestos.map(function(r){
      const y=Object.assign({},r); if(y.adjunto) y.adjunto=adjLimpio(y.adjunto); return y;
    });
    return limpio(x);
  },
  /* Todos los documentos que representan el estado actual */
  _docs(){
    const m=new Map(), ahora=Date.now();
    COLS.forEach(c=>(this.data[c]||[]).forEach(o=>{
      if(!o||!o.id) return; if(!o._t) o._t=ahora;
      m.set(c+'/'+o.id, this._aNube(c,o));
    }));
    m.set('config/general', this._config());
    return m;
  },

  save(){
    if(MODO_DEMO){ try{ localStorage.setItem(KEY,JSON.stringify(this.data)); }catch(e){} return; }
    clearTimeout(this._timer);
    this._timer=setTimeout(()=>{ this._timer=null; this._flush(); },300);
  },
  async _flush(){
    if(!fbDb||!this.data) return;
    if(this._saving){ this._again=true; return; }
    this._saving=true;
    try{
      const docs=this._docs(), cambios=[];
      docs.forEach((o,p)=>{ const s=canon(o); if(this._synced.get(p)!==s) cambios.push({p:p,o:o,s:s}); });
      this._synced.forEach((s,p)=>{ if(!docs.has(p)) cambios.push({p:p,borrar:true}); });
      for(let i=0;i<cambios.length;i+=400){
        const lote=cambios.slice(i,i+400), b=fbDb.batch();
        lote.forEach(c=>{ const ref=fbDb.doc(c.p); if(c.borrar) b.delete(ref); else b.set(ref,c.o); });
        await b.commit();
        lote.forEach(c=>{ if(c.borrar) this._synced.delete(c.p); else this._synced.set(c.p,c.s); });
      }
      avisoGuardado('ok');
    }catch(e){
      console.error('Guardar',e); avisoGuardado('error');
      setTimeout(()=>this.save(),5000);          // se reintenta solo
    }
    finally{ this._saving=false; if(this._again){ this._again=false; this.save(); } }
  },
  /* true si hay cambios que todavía no llegaron a la nube */
  pendiente(){ return !MODO_DEMO && (!!this._timer||this._saving); },

  _ordenar(){
    COLS.forEach(c=>{ if(!Array.isArray(this.data[c])) this.data[c]=[]; });
    if(!this.data.cfg) this.data.cfg=cfgDef();
    // completa lo que falte si se agregó una opción nueva después de la primera carga
    const d=cfgDef(); Object.keys(d).forEach(k=>{ if(this.data.cfg[k]===undefined) this.data.cfg[k]=d[k]; });
    // cotizaciones viejas (solo dólar, guardadas como número) → forma nueva {usd, brl}
    const c=this.data.cfg;
    if(typeof c.tcHoy==='number') c.tcHoy={usd:c.tcHoy,brl:0};
    Object.keys(c.tc||{}).forEach(f=>{ if(typeof c.tc[f]==='number') c.tc[f]={usd:c.tc[f],brl:0}; });
  },

  all(col){ return (this.data[col]||[]).slice().sort((a,b)=>(a._t||0)-(b._t||0)); },
  get(col,id){ return (this.data[col]||[]).find(x=>x.id===id)||null; },

  upsert(col,obj){
    const arr=this.data[col]||(this.data[col]=[]);
    if(obj.id){
      const i=arr.findIndex(x=>x.id===obj.id);
      if(i>=0){ arr[i]=Object.assign(arr[i],obj); this.save(); return arr[i]; }
    }
    obj.id=obj.id||nuevoId();
    obj._t=obj._t||Date.now();
    arr.push(obj); this.save(); return obj;
  },

  del(col,id){
    const arr=this.data[col]||[];
    const i=arr.findIndex(x=>x.id===id);
    if(i>=0){ adjBorrarDe(arr[i]); arr.splice(i,1); this.save(); }
  },

  cfg(){ return this.data.cfg; },
  guardarCfg(){ this.save(); },

  /* Número correlativo para presupuestos y órdenes.
     Se toma el mayor entre el contador y el número más alto ya usado, así nunca se repite. */
  siguienteNro(tipo){
    const k=tipo==='pres'?'numPres':'numOrden', col=tipo==='pres'?'presupuestos':'ordenes';
    let max=0; (this.data[col]||[]).forEach(x=>{ if(+x.nro>max) max=+x.nro; });
    const n=Math.max(+this.data.cfg[k]||0, max)+1;
    this.data.cfg[k]=n; this.save();
    return n;
  },

  /* Respaldo manual: descargar / restaurar todo en un archivo */
  exportarTodo(){ return JSON.stringify(this.data,null,1); },
  importarTodo(txt){
    const o=JSON.parse(txt);
    if(!o||typeof o!=='object') throw new Error('Archivo inválido');
    this.data=o; this._ordenar(); this.save();
  },
};

/* ---------- AVISOS ---------- */
/* Llegó un cambio desde otro dispositivo: se redibuja, salvo que se esté escribiendo. */
var _remotoTimer=null;
function cambioRemoto(espera){
  clearTimeout(_remotoTimer);
  _remotoTimer=setTimeout(function(){
    const a=document.activeElement, escribiendo=a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
    if(escribiendo||$('#modal-bg').classList.contains('open')){ cambioRemoto(1500); return; }
    if(!Store.data||$('#app').classList.contains('hidden')) return;
    renderView(CUR);
  }, espera||150);
}
function avisoGuardado(estado){
  if(estado==='error'){
    if(!avisoGuardado._err) toast('⚠ No se pudo guardar. Revisá la conexión a internet: se reintenta solo.');
    avisoGuardado._err=true;
  } else if(avisoGuardado._err){ avisoGuardado._err=false; toast('✓ Cambios guardados'); }
}
/* Avisar si se cierra la página con cambios sin subir */
window.addEventListener('beforeunload',function(e){ if(Store.pendiente()){ e.preventDefault(); e.returnValue=''; } });

function nuevoId(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

/* ---------- BÚSQUEDAS QUE USAN VARIAS SECCIONES ---------- */

/* Camión por matrícula (la matrícula es la clave del camión) */
function camionPorMat(mat){
  mat=normMat(mat); if(!mat)return null;
  return Store.all('camiones').find(c=>normMat(c.matricula)===mat)||null;
}
function normMat(m){ return (m||'').toUpperCase().replace(/[\s\-.]/g,''); }

/* Ficha completa a partir de una matrícula: camión + cliente + marca */
function fichaPorMat(mat){
  const cam=camionPorMat(mat); if(!cam)return null;
  return {camion:cam, cliente:Store.get('clientes',cam.clienteId), marca:cam.marca||''};
}
function cliNom(id){ const c=Store.get('clientes',id); return c?c.nombre:'—'; }
/* La agenda tiene clientes y proveedores. 'Ambos' es el que a veces compra y a veces vende. */
function esCliente(c){ return (c.tipo||'Cliente')!=='Proveedor'; }
function esProveedor(c){ return (c.tipo||'Cliente')!=='Cliente'; }
function soloClientes(){ return Store.all('clientes').filter(esCliente); }
function soloProveedores(){ return Store.all('clientes').filter(esProveedor); }
/* Busca por nombre (sin distinguir mayúsculas). Si no existe, lo crea con ese tipo. */
function buscarOCrear(nombre,tipo){
  nombre=(nombre||'').trim(); if(!nombre)return '';
  const n=nombre.toLowerCase();
  const y=Store.all('clientes').find(c=>(c.nombre||'').trim().toLowerCase()===n);
  if(y){ if(tipo&&(y.tipo||'Cliente')!==tipo&&(y.tipo||'Cliente')!=='Ambos'){ y.tipo='Ambos'; Store.upsert('clientes',y); } return y.id; }
  const nuevo=Store.upsert('clientes',{nombre:nombre,tipo:tipo||'Cliente'});
  toast('Se agregó «'+nombre+'» a Clientes y proveedores'); return nuevo.id;
}
function cliDe(mat){ const f=fichaPorMat(mat); return f&&f.cliente?f.cliente:null; }

/* Órdenes de un camión / de un cliente */
function ordenesDeMat(mat){ const m=normMat(mat); return Store.all('ordenes').filter(o=>normMat(o.matricula)===m); }
function ordenesDeCli(id){ return Store.all('ordenes').filter(o=>o.clienteId===id); }

/* Saldo de un cliente: lo que se le facturó y todavía no pagó (viene de Finanzas) */
function saldoCliente(id){
  let pend=0, vencido=0; const hoy=hoyISO();
  Store.all('movimientos').filter(m=>m.tipo==='cobro'&&m.clienteId===id&&m.estado!=='cobrado').forEach(m=>{
    const v=aPesos(m); pend+=v; if(m.vence&&m.vence<hoy) vencido+=v;
  });
  return {pendiente:pend, vencido:vencido};
}
/* Semáforo de deuda: verde sin deuda, amarillo con saldo pendiente, rojo con saldo vencido */
function semaforoCli(id){ const s=saldoCliente(id); return s.vencido>0?'mal':s.pendiente>0?'med':'ok'; }
