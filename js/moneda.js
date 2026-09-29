/*
 * MONEDAS: pesos uruguayos ($), dólares (U$S) y reales (R$).
 *
 * Reglas:
 *  - Cada movimiento GUARDA la cotización del día en que se registró. Ese movimiento se convierte
 *    SIEMPRE con esa cotización guardada, aunque el dólar o el real cambien después.
 *  - Los montos pendientes o proyectados (todavía sin cobrar/pagar) usan la cotización del día.
 *  - Si falta una cotización, se carga a mano (Configuración o al registrar el movimiento).
 *
 * getTipoCambio(fecha, moneda) está aislada a propósito: hoy devuelve la cotización guardada o la
 * cargada a mano. Cuando la página tenga un servidor propio, acá adentro se traen los valores del
 * BROU (pizarra de cambios) y NO hay que tocar ninguna otra parte. Desde el navegador solo no se
 * puede: los bancos no permiten que otra página les pida los datos directo (CORS).
 */

const MONEDAS=['UYU','USD','BRL'];
const MON_NOM={UYU:'Pesos',USD:'Dólares',BRL:'Reales'};
const MON_SIM={UYU:'$',USD:'U$S',BRL:'R$'};
let MONEDA='UYU';   // moneda en la que se muestran los importes

/* ---------- COTIZACIONES ---------- */
/* Deja las cotizaciones viejas (cuando solo existía el dólar y se guardaba un número suelto)
   con la forma nueva {usd:…, brl:…}. */
function tcNormalizar(v){
  if(v==null) return {usd:0,brl:0};
  if(typeof v==='number') return {usd:v,brl:0};
  return {usd:+v.usd||0, brl:+v.brl||0};
}
function tcDelDia(fecha){ return tcNormalizar((Store.cfg().tc||{})[String(fecha||'').slice(0,10)]); }

/* Cotización de una moneda para una fecha: cuántos pesos vale 1 dólar o 1 real. */
function getTipoCambio(fecha,moneda){
  moneda=moneda||'USD';
  if(moneda==='UYU') return 1;
  const clave=moneda==='BRL'?'brl':'usd';
  const cfg=Store.cfg(), f=String(fecha||hoyISO()).slice(0,10);
  const propia=tcNormalizar((cfg.tc||{})[f]);
  if(propia[clave]) return propia[clave];
  // si ese día no está cargado, usa la última cotización anterior (feriados, fines de semana)
  const claves=Object.keys(cfg.tc||{}).filter(k=>k<=f).sort();
  for(let i=claves.length-1;i>=0;i--){ const v=tcNormalizar(cfg.tc[claves[i]]); if(v[clave]) return v[clave]; }
  return tcNormalizar(cfg.tcHoy)[clave]||0;
}
function tcHoy(moneda){ return getTipoCambio(hoyISO(),moneda||'USD'); }
function guardarTC(fecha,usd,brl){
  const cfg=Store.cfg(), f=String(fecha).slice(0,10), ant=tcNormalizar(cfg.tc[f]);
  cfg.tc[f]={usd:+usd||ant.usd||0, brl:+brl||ant.brl||0};
  Store.guardarCfg();
}

/* ---------- VALOR DE UN MOVIMIENTO ---------- */
/* Devuelve el importe en las tres monedas, usando SU cotización guardada. */
function valMov(m){
  const imp=+m.importe||0, mon=m.moneda||'UYU';
  let uyu;
  if(mon==='UYU') uyu=imp;
  else uyu=imp*(+m.cotizacion || getTipoCambio(m.fecha,mon) || 1);
  const tcU=getTipoCambio(m.fecha,'USD'), tcB=getTipoCambio(m.fecha,'BRL');
  return {uyu:uyu, usd:tcU?uyu/tcU:0, brl:tcB?uyu/tcB:0};
}
function aPesos(m){ return valMov(m).uyu; }

/* Un importe en pesos convertido con la cotización del día (proyecciones y totales calculados) */
function parUYU(n){
  n=+n||0; const tcU=tcHoy('USD'), tcB=tcHoy('BRL');
  return {uyu:n, usd:tcU?n/tcU:0, brl:tcB?n/tcB:0};
}
function sumaPar(a,b){ return {uyu:(a.uyu||0)+(b.uyu||0), usd:(a.usd||0)+(b.usd||0), brl:(a.brl||0)+(b.brl||0)}; }
function sumaMovs(lista){ return (lista||[]).reduce((ac,m)=>sumaPar(ac,valMov(m)),{uyu:0,usd:0,brl:0}); }

/* ---------- MOSTRAR IMPORTES ---------- */
function nf(n,dec){ return (Math.round((+n||0)*(dec?100:1))/(dec?100:1)).toLocaleString('es-UY',{minimumFractionDigits:dec?2:0,maximumFractionDigits:dec?2:0}); }
/* Un par {uyu,usd,brl} mostrado en la moneda elegida (o en la que se le pida) */
function fMon(par,moneda){
  if(par==null)return '—';
  if(typeof par==='number')par=parUYU(par);
  const m=moneda||MONEDA;
  if(m==='USD') return MON_SIM.USD+' '+nf(par.usd,true);
  if(m==='BRL') return MON_SIM.BRL+' '+nf(par.brl,true);
  return MON_SIM.UYU+' '+nf(par.uyu,false);
}
/* Un número suelto en pesos, mostrado en la moneda elegida */
function fPesos(n,moneda){ return fMon(parUYU(n),moneda); }
/* Un importe en pesos convertido con la cotización de UNA FECHA (no la de hoy).
   Es lo que usa el estado de cuenta: cada línea vale lo que valía el día de la transacción. */
function enMoneda(pesos,fecha,moneda){
  pesos=+pesos||0; moneda=moneda||MONEDA;
  if(moneda==='UYU') return pesos;
  const tc=getTipoCambio(fecha,moneda);
  return tc?pesos/tc:0;
}
function fImporte(n,moneda){ moneda=moneda||MONEDA; return MON_SIM[moneda]+' '+nf(n,moneda!=='UYU'); }
/* Importe con su propia moneda, tal cual se registró */
function fPropia(m){ return (MON_SIM[m.moneda]||'$')+' '+nf(m.importe,m.moneda!=='UYU'); }

/* Botón de la barra de arriba: va pasando de pesos → dólares → reales */
function toggleMoneda(){
  MONEDA=MONEDAS[(MONEDAS.indexOf(MONEDA)+1)%MONEDAS.length];
  const b=$('#btn-moneda');
  b.textContent=MON_SIM[MONEDA]+' '+MON_NOM[MONEDA];
  b.classList.toggle('on',MONEDA!=='UYU');
  if(MONEDA!=='UYU'&&!tcHoy(MONEDA)) toast('Cargá la cotización del '+(MONEDA==='USD'?'dólar':'real')+' en Configuración');
  renderView(CUR);
}
