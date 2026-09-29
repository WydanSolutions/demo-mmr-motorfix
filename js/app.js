/*
 * ARRANQUE de la página. Tiene que ser el ÚLTIMO script de index.html.
 *
 * - Página real: espera a que el taller ingrese, se conecta a la base y recién ahí dibuja todo.
 * - MODO_DEMO: carga los datos de ejemplo y listo, sin nube.
 */
function prepararApp(){ buildNav(); pintarEncabezado(); switchView('panel'); }

(function(){
  document.body.classList.add(MODO_DEMO?'demo':'real');
  precargarImagenes();

  if(MODO_DEMO){
    Store.load();
    prepararApp();
    $('#login-sub').textContent='Escribí tu contraseña para entrar al sistema.';
    $('#login-hint').textContent='Versión de demostración: la contraseña es '+PASS_DEMO+'. Los datos son inventados.';
    if(haySesionDemo()) mostrarApp();
    return;
  }

  // El correo del taller va puesto solo: en la pantalla solo se pide la contraseña.
  let correo=CORREO_TALLER;
  try{ const c=localStorage.getItem(RECUERDO); if(c) correo=c; }catch(e){}
  $('#login-email').value=correo;
  $('#login-sub').textContent='Escribí tu contraseña para entrar al sistema.';
  if(correo!==CORREO_TALLER) otroCorreo();   // la última vez entró otro (soporte): se muestra cuál
  fbInit();
  fbAuth.onAuthStateChanged(async function(user){
    if(!user){ Store.disconnect(); closeModal(); cerrarDocumento(); mostrarLogin(); return; }
    if(USUARIOS_PERMITIDOS.indexOf((user.email||'').toLowerCase())<0){
      loginMsg('Correo o contraseña incorrectos'); fbAuth.signOut(); return;
    }
    loginMsg('Cargando los datos del taller…',true);
    try{
      await Store.connect();
      prepararApp();
      mostrarApp();
      loginMsg('');
    }catch(e){
      console.error(e);
      loginMsg('No se pudieron cargar los datos ('+(e.code||'error')+'). Probá de nuevo.');
      fbAuth.signOut();
    }
  });
})();
