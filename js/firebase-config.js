/*
 * Conexión con Firebase y modo de funcionamiento.
 *
 * - Estos datos NO son secretos: identifican al proyecto. La protección real está en firestore.rules.
 * - MODO_DEMO: links de demostración (wydan-demos) o ?demo=1 → datos inventados en el navegador, sin Firebase.
 * - MODO_LOCAL: en esta computadora se usan los emuladores de Firebase, así nunca se tocan los datos reales.
 */
/* Sin datos del proyecto: esta copia no se conecta a ningún lado. */
const FIREBASE_CONFIG={};

/* Quién puede entrar. ⚠ Tiene que coincidir con la lista de firestore.rules. */
const CORREO_TALLER='taller@ejemplo.com';   // copia de demostración: correo inventado
const CORREO_SOPORTE='soporte@ejemplo.com'; // copia de demostración: correo inventado
const USUARIOS_PERMITIDOS=[CORREO_TALLER,CORREO_SOPORTE];

/* Tres modos, decididos por la dirección desde la que se abre la página:
   · MODO_DEMO  → links de demostración o ?demo=1: datos inventados en el navegador, sin nube.
   · MODO_LOCAL → localhost: trabaja contra los emuladores, nunca contra los datos reales.
   · ninguno de los dos → la página real: Firestore y Firebase Auth. */
/* Copia de demostración: SIEMPRE modo demo. Datos inventados en el navegador, nunca la nube. */
const MODO_DEMO=true;
const MODO_LOCAL=['localhost','127.0.0.1'].indexOf(location.hostname)>=0;

var fbAuth=null, fbDb=null;
function fbInit(){
  if(MODO_DEMO||fbDb) return;
  firebase.initializeApp(FIREBASE_CONFIG);
  fbAuth=firebase.auth(); fbAuth.languageCode='es';
  fbDb=firebase.firestore();
  if(MODO_LOCAL){
    fbAuth.useEmulator('http://127.0.0.1:9099',{disableWarnings:true});
    fbDb.useEmulator('127.0.0.1',8080);
  }
}
