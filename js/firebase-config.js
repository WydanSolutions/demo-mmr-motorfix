/*
 * Conexión con Firebase y modo de funcionamiento.
 *
 * - Estos datos NO son secretos: identifican al proyecto. La protección real está en firestore.rules.
 * - MODO_DEMO: links de demostración (wydan-demos) o ?demo=1 → datos inventados en el navegador, sin Firebase.
 * - MODO_LOCAL: en esta computadora se usan los emuladores de Firebase, así nunca se tocan los datos reales.
 */
const FIREBASE_CONFIG={
  apiKey:'AIzaSyA137qhdUWf7m1vdPsPiM_ioG8Z0S0zcmw',
  authDomain:'mecanica-machado.firebaseapp.com',
  projectId:'mecanica-machado',
  storageBucket:'mecanica-machado.firebasestorage.app',
  messagingSenderId:'1036112095977',
  appId:'1:1036112095977:web:2acc1fe771228e1d231e78'
};

/* Quién puede entrar. ⚠ Tiene que coincidir con la lista de firestore.rules. */
const CORREO_TALLER='mecanicamachadorivera1@gmail.com';   // el del taller: va puesto solo, no se escribe
const CORREO_SOPORTE='wydan.solutions@gmail.com';         // soporte de Wydan
const USUARIOS_PERMITIDOS=[CORREO_TALLER,CORREO_SOPORTE];

/* Esta copia es SIEMPRE demostración: datos inventados en el navegador, nunca la base real. */
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
