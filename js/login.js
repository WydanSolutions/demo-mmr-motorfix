/*
 * INGRESO.
 * - Página real: correo y contraseña de verdad (Firebase Authentication). La contraseña no está
 *   en ningún lado del código: la crea el taller desde el correo de «restablecer contraseña».
 * - MODO_DEMO (links de demostración): sigue el acceso de mentira con la contraseña 1234.
 */
const PASS_DEMO='1234';
const SESION='mmr_sesion';
const RECUERDO='mmr_correo';

function loginMsg(t,ok){ const e=$('#login-err'); if(!e)return; e.style.color=ok?'var(--verde)':''; e.textContent=t||''; }

/* El correo del taller va puesto solo, así que en la pantalla solo se pide la contraseña.
   Si alguien toca «Entrar con otro correo» (el soporte de Wydan), aparece el casillero. */
function correoIngreso(){ return (($('#login-email').value||'').trim()||CORREO_TALLER).toLowerCase(); }
function otroCorreo(){
  document.body.classList.add('otro-correo');
  $('#login-otro').style.display='none';
  $('#login-sub').textContent='Escribí tu correo y tu contraseña para entrar al sistema.';
  $('#login-email').focus(); $('#login-email').select();
}

/* ---------- ENTRAR ---------- */
function entrar(){
  if(MODO_DEMO) return entrarDemo();
  const correo=correoIngreso(), pass=$('#login-pass').value, btn=$('#login-btn');
  if(!correo){ loginMsg('Escribí tu correo'); return; }
  if(!pass){ loginMsg('Escribí tu contraseña'); return; }
  // Si el correo no es de los autorizados no se intenta siquiera: el mensaje es el mismo, para no dar pistas.
  if(USUARIOS_PERMITIDOS.indexOf(correo)<0){ loginMsg('Correo o contraseña incorrectos'); return; }
  loginMsg('Ingresando…',true); if(btn) btn.disabled=true;
  // La sesión dura mientras la pestaña esté abierta: al cerrar el navegador vuelve a pedir la contraseña.
  fbAuth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
    .then(()=>fbAuth.signInWithEmailAndPassword(correo,pass))
    .then(function(){ try{ localStorage.setItem(RECUERDO,correo); }catch(e){} $('#login-pass').value=''; })
    .catch(function(err){ loginMsg(errorAuth(err)); })
    .finally(function(){ if(btn) btn.disabled=false; });
}
function entrarDemo(){
  const p=$('#login-pass').value;
  if(p!==passDemoActual()){ loginMsg('Contraseña incorrecta'); $('#login-pass').select(); return; }
  try{ sessionStorage.setItem(SESION,'1'); }catch(e){}
  loginMsg(''); mostrarApp();
}
function errorAuth(err){
  const c=(err&&err.code)||'';
  if(/wrong-password|invalid-credential|user-not-found|invalid-login/.test(c)) return 'Correo o contraseña incorrectos';
  if(/too-many-requests/.test(c)) return 'Demasiados intentos. Esperá unos minutos o usá «¿Olvidaste tu contraseña?»';
  if(/network/.test(c)) return 'Sin conexión a internet';
  if(/invalid-email/.test(c)) return 'El correo no está bien escrito';
  if(/user-disabled/.test(c)) return 'Este usuario está deshabilitado';
  return 'No se pudo ingresar ('+c+')';
}

/* ---------- CONTRASEÑA ---------- */
/* Ojito del campo: muestra la contraseña mientras está activado */
function verPass(btn){
  const i=$('#login-pass'); const ver=i.type==='password';
  i.type=ver?'text':'password'; btn.style.opacity=ver?1:''; i.focus();
}
/* Página real: Firebase manda un correo con un enlace para crear una contraseña nueva. */
function olvidePass(){
  if(MODO_DEMO){ loginMsg('En la página real te llega un correo para crear una contraseña nueva.',true); return; }
  const correo=correoIngreso();
  if(!correo){ loginMsg('Escribí tu correo arriba y volvé a tocar «¿Olvidaste tu contraseña?»'); otroCorreo(); return; }
  // El mensaje es siempre el mismo, exista o no el correo: así nadie averigua quién tiene acceso.
  const listo=()=>loginMsg('Si ese correo tiene acceso, te llegó un mensaje para crear una contraseña nueva. Mirá también en «Spam».',true);
  if(USUARIOS_PERMITIDOS.indexOf(correo)<0){ listo(); return; }
  fbAuth.sendPasswordResetEmail(correo).then(listo).catch(function(err){
    if(/user-not-found/.test(err.code)) listo(); else loginMsg(errorAuth(err));
  });
}
/* Cambiar la contraseña estando adentro */
function cambiarPass(){
  if(MODO_DEMO) return cambiarPassDemo();
  preguntar('Cambiar la contraseña','Contraseña actual','',function(actual){
    preguntar('Cambiar la contraseña','Contraseña nueva (mínimo 6 caracteres)','',function(nueva){
      if((nueva||'').length<6){ avisar('Muy corta','La contraseña tiene que tener al menos 6 caracteres.'); return; }
      const u=fbAuth.currentUser;
      const cred=firebase.auth.EmailAuthProvider.credential(u.email,actual);
      u.reauthenticateWithCredential(cred)
        .then(()=>u.updatePassword(nueva))
        .then(()=>avisar('Contraseña cambiada','Anotala en un lugar seguro.'))
        .catch(err=>avisar('No se pudo cambiar',errorAuth(err)));
    },'password');
  },'password');
}
function cambiarPassDemo(){
  preguntar('Cambiar la contraseña','Contraseña actual','',function(a){
    if(a!==passDemoActual()){ avisar('No coincide','La contraseña actual no es correcta.'); return; }
    preguntar('Cambiar la contraseña','Contraseña nueva','',function(b){
      try{ localStorage.setItem('mmr_pass',b); }catch(e){}
      avisar('Contraseña cambiada','Es solo para esta demostración: se guarda en esta computadora.');
    },'password');
  },'password');
}
function passDemoActual(){ try{ return localStorage.getItem('mmr_pass')||PASS_DEMO; }catch(e){ return PASS_DEMO; } }

/* ---------- MOSTRAR / OCULTAR ---------- */
function mostrarApp(){ $('#login').classList.add('hidden'); $('#app').classList.remove('hidden'); reiniciarReloj(); }
function mostrarLogin(){
  $('#app').classList.add('hidden'); $('#login').classList.remove('hidden');
  $('#login-pass').value=''; loginMsg('');
}
async function salir(){
  cerrarMenu(); closeModal(); cerrarDocumento(); clearTimeout(_relojInactivo);
  if(MODO_DEMO){ try{ sessionStorage.removeItem(SESION); }catch(e){} mostrarLogin(); return; }
  if(Store.pendiente()){ toast('Guardando los últimos cambios…'); try{ await Store._flush(); }catch(e){} }
  fbAuth.signOut();
}
function haySesionDemo(){ try{ return sessionStorage.getItem(SESION)==='1'; }catch(e){ return false; } }

document.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!$('#login').classList.contains('hidden')) entrar(); });

/* ---------- CIERRE DE SESIÓN POR INACTIVIDAD ----------
   Si pasan 20 minutos sin tocar nada, la página se cierra sola. Es para que no quede
   abierta en la computadora del taller si alguien se va. Lo cargado queda guardado. */
const MINUTOS_INACTIVIDAD=20;
let _relojInactivo=null;
function reiniciarReloj(){
  clearTimeout(_relojInactivo);
  if($('#app').classList.contains('hidden')) return;   // todavía no ingresó
  _relojInactivo=setTimeout(function(){
    salir();
    loginMsg('Se cerró la sesión por '+MINUTOS_INACTIVIDAD+' minutos sin actividad.');
  }, MINUTOS_INACTIVIDAD*60*1000);
}
['click','keydown','mousemove','touchstart','scroll','input'].forEach(ev=>
  document.addEventListener(ev,reiniciarReloj,{passive:true}));
