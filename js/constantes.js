/*
 * Constantes generales de la página: dónde se guarda, logo, meses, etapas y listas iniciales.
 * Si hay que cambiar un texto fijo o agregar una etapa, se hace acá.
 */
const KEY='mmr_taller';            // clave de guardado en el navegador
const LOGO=new URL('img/logo.png', location.href).href;

/* Colores de la marca (los mismos que :root en el CSS). Se usan en los PDF. */
const COL={azul:'#313A82',azulOsc:'#232a61',azulClaro:'#eaecf7',rojo:'#E6002E',amarillo:'#F2A932',negro:'#231F20',gris:'#6f7488',borde:'#e2e4ee'};

const MESES=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'];
const MESES_L=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Setiembre','Octubre','Noviembre','Diciembre'];

/* Etapas de una reparación, en orden. El color es el de la etiqueta. */
const ETAPAS=[
  {id:'recibimiento',n:'Recibimiento',cls:'p-gris'},
  {id:'diagnostico', n:'Diagnóstico', cls:'p-azul'},
  {id:'reparacion',  n:'Reparación',  cls:'p-amarillo'},
  {id:'revision',    n:'Revisión',    cls:'p-azul'},
  {id:'entregada',   n:'Entregada',   cls:'p-verde'},
];
const etapaN=id=>(ETAPAS.find(e=>e.id===id)||ETAPAS[0]).n;
const etapaCls=id=>(ETAPAS.find(e=>e.id===id)||ETAPAS[0]).cls;

/* Estados de un presupuesto */
const PRES_EST=['Borrador','Enviado','Aprobado','Rechazado'];
const PRES_CLS={'Borrador':'p-gris','Enviado':'p-azul','Aprobado':'p-verde','Rechazado':'p-rojo'};

/* Tipo de trabajo y quién lo paga: sale de la hoja CASC y de la HISTORIA CLÍNICA de la planilla */
const TIPOS_ORDEN=['Correctivo','Preventivo','Chapa y pintura'];
const CARGOS=['Cliente','Garantía','Interno'];          // a cargo de quién va el trabajo
const LUGARES=['En el taller','A domicilio'];           // "Passagens Deslocamento" de la planilla
const COMBUSTIBLE=['','1/4','1/2','3/4','Full'];        // nivel de nafta/gasoil al recibir el camión
const PRIORIDADES=['Alta','Media','Baja'];
const TIPOS_LINEA=['Repuesto','Mano de obra','Servicio'];

/* Listas que después se pueden editar desde Configuración */
const MARCAS_DEF=['Volkswagen','MAN','Mercedes-Benz','Scania','Volvo','Iveco','Ford','Otra'];
const MEDIOS_DEF=['Efectivo','Transferencia','Cheque','Débito/Crédito','Redpagos/Abitab','Dólares efectivo','Reales efectivo'];
const CAT_GASTO_DEF=['Sueldos y jornales','Aportes BPS','Repuestos e insumos','Herramientas/equipos','Alquiler','UTE','OSE','Combustible','Seguros (BSE)','Impuestos DGI','Contador','Fletes','EPP/limpieza','Otros'];
/* Roles tal cual los pide el cierre de mes de la planilla (hoja INF.GRAL. TALLER) */
const ROLES_DEF=['Gerente / Propietario','Jefe de taller / Capataz','Asesor de servicio','Administración',
                 'Mecánico','Electricista','Electrónico','Ayudante / Aprendiz','Lavador / Engrasador','Chapista','Pintor'];
/* "Productivo" = el que factura horas de taller. El resto es personal no productivo. */
const ROLES_PROD_DEF=['Mecánico','Electricista','Electrónico','Ayudante / Aprendiz','Lavador / Engrasador','Chapista','Pintor'];
/* País de la matrícula: el taller atiende camiones de los dos lados de la frontera. */
const PAISES_MAT=['Uruguay','Brasil'];

const DEPTOS=['Rivera','Artigas','Tacuarembó','Salto','Cerro Largo','Durazno','Montevideo','Canelones','Paysandú','Maldonado','Otro'];

/* Rango permitido en los campos de fecha (evita años de 5 cifras por un error de tipeo) */
const DR=' min="2000-01-01" max="2099-12-31"';
