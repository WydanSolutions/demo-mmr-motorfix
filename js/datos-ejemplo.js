/*
 * DATOS DE EJEMPLO — TODOS INVENTADOS.
 * Sirven para ver cómo queda la página antes de cargar la información real del taller.
 * Ningún nombre, matrícula, RUT ni teléfono de acá es real.
 * Cuando se cargan los datos verdaderos, este archivo deja de usarse (solo se usa la primera vez).
 */
function datosDeEjemplo(){
  const hoy=new Date(), A=hoy.getFullYear(), M=hoy.getMonth();
  const d=(mesesAtras,dia)=>{ const x=new Date(A,M-mesesAtras,dia); return x.getFullYear()+'-'+p2(x.getMonth()+1)+'-'+p2(x.getDate()); };
  const p2=n=>String(n).padStart(2,'0');
  let t=Date.now()-1000000;
  const n=()=>(t+=1000);

  const cfg=cfgDef();
  cfg.negocio={nombre:'Mecánica Machado',sigla:'MMR',ciudad:'Rivera',pais:'Uruguay',tel:'099 000 000',mail:'taller@ejemplo.com',direccion:'Ruta 5 km 500, Rivera',rut:'000000000000'};
  /* Datos para el pago: TODO inventado (ceros). Los reales se cargan en Configuración. */
  cfg.cobranza={banco:'BROU',titular:'Mecánica Machado',
    cuentaPesos:'000000000-00001 CA $',cuentaDolares:'000000000-00002 CA U$S',
    pixNombre:'Mecánica Machado',pix:'000 000 000 00',
    nota:'Mandanos el comprobante por WhatsApp así cerramos la orden.'};
  cfg.tcHoy={usd:41.50,brl:7.60};
  /* La numeración sigue a partir del último ejemplo (el próximo presupuesto es el 104 y la próxima orden la 505) */
  cfg.numPres=103; cfg.numOrden=504;
  cfg.precioHora={cliente:1500, garantia:1500};   // inventado, solo para la demostración
  cfg.precioHoraRol={'Mecánico':1800,'Electricista':2000,'Electrónico':2200,'Ayudante / Aprendiz':900,'Chapista':1600,'Pintor':1600,'Lavador / Engrasador':700};
  cfg.tc={}; cfg.tc[d(0,1)]={usd:41.20,brl:7.55}; cfg.tc[d(1,10)]={usd:40.80,brl:7.40}; cfg.tc[d(2,5)]={usd:40.30,brl:7.28};

  const funcionarios=[
    {id:'f1',_t:n(),nombre:'Luis Pereira',rol:'Mecánico',costoHora:520,activo:true},
    {id:'f2',_t:n(),nombre:'Andrés Silva',rol:'Mecánico',costoHora:480,activo:true},
    {id:'f3',_t:n(),nombre:'Matías Rodríguez',rol:'Ayudante / Aprendiz',costoHora:320,activo:true},
    {id:'f4',_t:n(),nombre:'Diego Olivera',rol:'Electricista',costoHora:540,activo:true},
    {id:'f5',_t:n(),nombre:'Carla Núñez',rol:'Administración',costoHora:400,activo:true},
    {id:'f6',_t:n(),nombre:'Bruno Méndez',rol:'Asesor de servicio',costoHora:450,activo:true},
  ];

  const clientes=[
    {id:'c1',_t:n(),nro:1,nombre:'Transportes del Norte S.A.',rut:'210000000011',ci:'',contacto:'Jorge Méndez',tel:'099 111 111',tel2:'',tel3:'',mail:'jorge@ejemplo.com',direccion:'Av. Sarandí 1200',depto:'Rivera',ciudad:'Rivera',notas:'Flota de 4 camiones. Trabaja con cuenta corriente a 30 días.'},
    {id:'c2',_t:n(),nro:2,nombre:'Forestal Cuchilla Ltda.',rut:'210000000022',ci:'',contacto:'Silvana Píriz',tel:'099 222 222',tel2:'',tel3:'',mail:'silvana@ejemplo.com',direccion:'Ruta 27 km 12',depto:'Rivera',ciudad:'Tranqueras',notas:''},
    {id:'c3',_t:n(),nro:3,nombre:'Hugo Barrios',rut:'',ci:'1.234.567-8',contacto:'Hugo Barrios',tel:'099 333 333',tel2:'',tel3:'',mail:'',direccion:'Bv. Artigas 455',depto:'Rivera',ciudad:'Rivera',notas:'Camión propio, paga al contado.'},
    {id:'c4',_t:n(),nro:4,nombre:'Ganadera La Blanqueada',rut:'210000000044',ci:'',contacto:'Raúl Ferreira',tel:'099 444 444',tel2:'',tel3:'',mail:'raul@ejemplo.com',direccion:'Ruta 5 km 480',depto:'Tacuarembó',ciudad:'Tacuarembó',notas:''},
    {id:'c5',_t:n(),nro:5,nombre:'Distribuidora Frontera S.R.L.',rut:'210000000055',ci:'',contacto:'Ana Pintos',tel:'099 555 555',tel2:'',tel3:'',mail:'ana@ejemplo.com',direccion:'Zorrilla 900',depto:'Rivera',ciudad:'Rivera',notas:'Pide siempre presupuesto antes de la reparación.'},
    {id:'pr1',_t:n(),nro:0,nombre:'Repuestos del Norte S.R.L.',tipo:'Proveedor',rut:'210000000066',ci:'',contacto:'Marcelo Duarte',tel:'099 666 666',tel2:'',tel3:'',mail:'ventas@ejemplo.com',direccion:'Ruta 5 km 498',depto:'Rivera',ciudad:'Rivera',notas:'Repuestos VW y MAN. Cuenta a 30 dias.'},
    {id:'pr2',_t:n(),nro:0,nombre:'Lubricantes Frontera',tipo:'Proveedor',rut:'210000000077',ci:'',contacto:'Sofia Cabrera',tel:'099 777 777',tel2:'',tel3:'',mail:'',direccion:'Av. Italia 300',depto:'Rivera',ciudad:'Rivera',notas:''},
    {id:'pr3',_t:n(),nro:0,nombre:'Rectificaciones Tacuarembo',tipo:'Ambos',rut:'210000000088',ci:'',contacto:'Julio Sosa',tel:'099 888 888',tel2:'',tel3:'',mail:'',direccion:'Ruta 26 s/n',depto:'Tacuarembo',ciudad:'Tacuarembo',notas:'Tambien nos manda camiones a reparar.'},
  ];

  const camiones=[
    {id:'v1',_t:n(),matricula:'RIA1234',clienteId:'c1',marca:'Volkswagen',modelo:'Constellation 24.280',anio:2019,chasis:'9BWZZZ377VT004251',motor:'MWM 6.12 TCE',color:'Blanco',km:412000,segmento:'Constellation',horimetro:0,fventa:'',chasisLargo:'',notas:''},
    {id:'v2',_t:n(),matricula:'RIB5678',clienteId:'c1',marca:'Mercedes-Benz',modelo:'Atego 1719',anio:2017,chasis:'9BM958424HB012345',motor:'OM 924 LA',color:'Blanco',km:530000,segmento:'Otro',horimetro:0,fventa:'',chasisLargo:'',notas:''},
    {id:'v3',_t:n(),matricula:'RIC9012',clienteId:'c2',marca:'Scania',modelo:'R 440',anio:2015,chasis:'9BSR4X200F3901122',motor:'DC13',color:'Azul',km:780000,segmento:'Otro',horimetro:14200,fventa:'',chasisLargo:'',notas:'Trabaja en monte, entra con mucho barro.'},
        {id:'v4',_t:n(),matricula:'RID3456',clienteId:'c3',marca:'Volvo',modelo:'FH 440',anio:2014,chasis:'YV2AS02A9EB730991',motor:'D13A',color:'Rojo',km:915000,segmento:'Otro',horimetro:0,fventa:'',chasisLargo:'',notas:''},
    {id:'v5',_t:n(),matricula:'RIE7890',clienteId:'c4',marca:'Iveco',modelo:'Tector 240E25',anio:2020,chasis:'93ZM1TMH1L8451200',motor:'Tector 6',color:'Gris',km:230000,segmento:'Otro',horimetro:0,fventa:'',chasisLargo:'',notas:''},
    {id:'v6',_t:n(),matricula:'RIF2468',clienteId:'c5',marca:'MAN',modelo:'TGX 28.440',anio:2018,chasis:'WMA06XZZ8JM654321',motor:'D2066',color:'Blanco',km:495000,segmento:'MAN',horimetro:0,fventa:'',chasisLargo:'',notas:''},
    {id:'v7',_t:n(),matricula:'RIG1357',clienteId:'c1',marca:'Volkswagen',modelo:'Delivery 9.170',anio:2021,chasis:'9BWZZZ377MT112233',motor:'Cummins ISF',color:'Blanco',km:118000,segmento:'Delivery',horimetro:0,fventa:'',chasisLargo:'',notas:''},
  ];

  const presupuestos=[
    {id:'p1',_t:n(),nro:101,fecha:d(0,3),validezDias:15,matricula:'RIF2468',clienteId:'c5',asunto:'Reparación de caja de cambios',
     lineas:[{desc:'Juego de sincronizados',cant:1,precio:38500,tipo:'Repuesto'},{desc:'Retén de salida',cant:2,precio:1450,tipo:'Repuesto'},{desc:'Mano de obra desarme y armado (14 h)',cant:14,precio:1200,tipo:'Mano de obra'}],
     mostrarPrecios:true,texto:'Se revisó la caja y presenta dificultad para entrar 3ª y 4ª. Se propone desarme completo y cambio del juego de sincronizados.',
     imagenes:[],estado:'Enviado',envios:[{via:'WhatsApp',fecha:d(0,3),destino:'099 555 555'}]},
    {id:'p2',_t:n(),nro:102,fecha:d(0,8),validezDias:15,matricula:'RIC9012',clienteId:'c2',asunto:'Service de 10.000 km + frenos',
     lineas:[{desc:'Aceite motor 15W40 (balde 20 L)',cant:1,precio:9800,tipo:'Repuesto'},{desc:'Filtro de aceite',cant:1,precio:1750,tipo:'Repuesto'},{desc:'Filtro de combustible',cant:2,precio:1300,tipo:'Repuesto'},{desc:'Cintas de freno delanteras',cant:1,precio:12400,tipo:'Repuesto'},{desc:'Mano de obra service completo (6 h)',cant:6,precio:1200,tipo:'Mano de obra'}],
     mostrarPrecios:true,texto:'Service completo más revisión de frenos delanteros.',
     imagenes:[],estado:'Aprobado',envios:[{via:'Mail',fecha:d(0,8),destino:'silvana@ejemplo.com'}]},
    {id:'p3',_t:n(),nro:103,fecha:d(0,12),validezDias:15,matricula:'RIE7890',clienteId:'c4',asunto:'Pérdida de aceite en motor',
     lineas:[{desc:'Diagnóstico y reparación de pérdida (estimado)',cant:1,precio:26000,tipo:'Servicio'}],
     mostrarPrecios:false,texto:'A confirmar el origen de la pérdida una vez desarmado. El monto es estimado.',
     imagenes:[],estado:'Borrador',envios:[]},
  ];

  const ordenes=[
    {id:'o1',_t:n(),cargo:'Cliente',asesorId:'f6',lugar:'En el taller',km:412350,combustible:'1/4',diagnostico:'Turbo con juego en el eje y pérdida de aceite. Se saca para reacondicionar.',nro:501,matricula:'RIA1234',clienteId:'c1',tipo:'Correctivo',prioridad:'Alta',
     fecha:d(0,5),fechaEst:d(0,20),etapa:'reparacion',presupuestoId:'',
     peticiones:'Pierde fuerza en subida y hace humo negro.',
     checklist:[{t:'Escanear motor',ok:true},{t:'Revisar turbo',ok:true},{t:'Cambiar inyectores',ok:false},{t:'Prueba en ruta',ok:false}],
     tareas:[{funcionarioId:'f1',horas:6,desc:'Diagnóstico y desarme de turbo'},{funcionarioId:'f3',horas:4,desc:'Apoyo y limpieza de piezas'}],
     repuestos:[{desc:'Turbo reacondicionado',cant:1,precio:47000,factura:'F-A 2201'},{desc:'Juego de juntas',cant:1,precio:3200,factura:'F-A 2201'}],
     servicios:'Rectificado de tapa en taller externo.',
     tiempos:{recibimiento:d(0,5)+'T08:30',diagnostico:d(0,5)+'T11:00',reparacion:d(0,9)+'T09:00'},notas:''},
    {id:'o2',_t:n(),cargo:'Cliente',asesorId:'f6',lugar:'En el taller',km:780500,horimetro:14260,combustible:'1/2',diagnostico:'Cintas delanteras al límite. Se cambian y se ajusta el freno de mano.',nro:502,matricula:'RIC9012',clienteId:'c2',tipo:'Preventivo',prioridad:'Media',
     fecha:d(0,9),fechaEst:d(0,19),etapa:'revision',presupuestoId:'p2',
     peticiones:'Service completo y frenos delanteros.',
     checklist:[{t:'Cambio de aceite y filtros',ok:true},{t:'Cintas de freno',ok:true},{t:'Ajuste general',ok:true},{t:'Prueba de frenado',ok:false}],
     tareas:[{funcionarioId:'f2',horas:6,desc:'Service completo'}],
     repuestos:[{desc:'Aceite 15W40 20 L',cant:1,precio:9800,factura:'F-A 2210'},{desc:'Filtros',cant:3,precio:1450,factura:'F-A 2210'},{desc:'Cintas de freno',cant:1,precio:12400,factura:'F-A 2211'}],
     servicios:'',tiempos:{recibimiento:d(0,9)+'T07:45',diagnostico:d(0,9)+'T09:30',reparacion:d(0,10)+'T08:00',revision:d(0,15)+'T14:00'},notas:''},
    {id:'o3',_t:n(),cargo:'Cliente',asesorId:'f6',lugar:'En el taller',km:915800,combustible:'3/4',diagnostico:'Juego en el diferencial. Falta revisar el cardán.',nro:503,matricula:'RID3456',clienteId:'c3',tipo:'Correctivo',prioridad:'Alta',
     fecha:d(0,14),fechaEst:d(0,24),etapa:'diagnostico',presupuestoId:'',
     peticiones:'Ruido en el diferencial y vibración a más de 80 km/h.',
     checklist:[{t:'Revisar diferencial',ok:true},{t:'Revisar cardan',ok:false}],
     tareas:[{funcionarioId:'f1',horas:3,desc:'Revisión de tren trasero'}],
     repuestos:[],servicios:'',tiempos:{recibimiento:d(0,14)+'T10:00',diagnostico:d(0,15)+'T08:30'},notas:''},
    {id:'o4',_t:n(),cargo:'Cliente',asesorId:'f6',lugar:'En el taller',km:118600,combustible:'Full',diagnostico:'',nro:504,matricula:'RIG1357',clienteId:'c1',tipo:'Preventivo',prioridad:'Baja',
     fecha:d(0,16),fechaEst:d(0,26),etapa:'recibimiento',presupuestoId:'',
     peticiones:'Service de 10.000 km.',checklist:[],tareas:[],repuestos:[],servicios:'',
     tiempos:{recibimiento:d(0,16)+'T09:00'},notas:''},
    {id:'o5',_t:n(),cargo:'Cliente',asesorId:'f6',lugar:'En el taller',km:529100,combustible:'1/2',diagnostico:'Kit de embrague gastado.',nro:498,matricula:'RIB5678',clienteId:'c1',tipo:'Correctivo',prioridad:'Media',
     fecha:d(1,6),fechaEst:d(1,14),etapa:'entregada',presupuestoId:'',
     peticiones:'Cambio de embrague.',
     checklist:[{t:'Desarme de caja',ok:true},{t:'Cambio de kit de embrague',ok:true},{t:'Prueba en ruta',ok:true}],
     tareas:[{funcionarioId:'f1',horas:10,desc:'Cambio de embrague'},{funcionarioId:'f3',horas:5,desc:'Apoyo'}],
     repuestos:[{desc:'Kit de embrague',cant:1,precio:52000,factura:'F-A 2150'}],
     servicios:'',fechaEntrega:d(1,13),tiempos:{recibimiento:d(1,6)+'T08:00',diagnostico:d(1,6)+'T10:00',reparacion:d(1,7)+'T08:00',revision:d(1,12)+'T15:00',entregada:d(1,13)+'T11:00'},notas:''},
    {id:'o6',_t:n(),cargo:'Garantía',asesorId:'f6',lugar:'En el taller',km:229400,combustible:'1/4',diagnostico:'Service dentro del período de garantía.',nro:499,matricula:'RIE7890',clienteId:'c4',tipo:'Preventivo',prioridad:'Baja',
     fecha:d(1,18),fechaEst:d(1,22),etapa:'entregada',presupuestoId:'',
     peticiones:'Service y alineación.',checklist:[{t:'Service',ok:true}],
     tareas:[{funcionarioId:'f2',horas:5,desc:'Service'}],
     repuestos:[{desc:'Aceite y filtros',cant:1,precio:14300,factura:'F-A 2160'}],
     servicios:'',fechaEntrega:d(1,21),tiempos:{recibimiento:d(1,18)+'T08:15',diagnostico:d(1,18)+'T09:00',reparacion:d(1,18)+'T10:00',revision:d(1,20)+'T16:00',entregada:d(1,21)+'T10:30'},notas:''},
  ];

  /* Movimientos: cobros (trabajos entregados) y gastos de operativa */
  const movimientos=[
    {id:'m1',_t:n(),tipo:'cobro',fecha:d(1,13),concepto:'O.R. 498 · Cambio de embrague',clienteId:'c1',ordenId:'o5',importe:96000,moneda:'UYU',cotizacion:40.80,medio:'Transferencia',estado:'cobrado',vence:'',cuotas:1},
    {id:'m2',_t:n(),tipo:'cobro',fecha:d(1,21),concepto:'O.R. 499 · Service y alineación',clienteId:'c4',ordenId:'o6',importe:31500,moneda:'UYU',cotizacion:40.80,medio:'Efectivo',estado:'cobrado',vence:'',cuotas:1},
    {id:'m3',_t:n(),tipo:'cobro',fecha:d(0,15),concepto:'O.R. 502 · Service + frenos',clienteId:'c2',ordenId:'o2',importe:48900,moneda:'UYU',cotizacion:41.20,medio:'Transferencia',estado:'pendiente',vence:d(0,30),cuotas:1},
    {id:'m4',_t:n(),tipo:'cobro',fecha:d(2,8),concepto:'Reparación de suspensión',clienteId:'c5',ordenId:'',importe:1200,moneda:'USD',cotizacion:40.30,medio:'Dólares efectivo',estado:'pendiente',vence:d(0,5),cuotas:1},
    {id:'m5',_t:n(),tipo:'gasto',fecha:d(0,2),concepto:'Sueldos del mes',categoria:'Sueldos y jornales',importe:186000,moneda:'UYU',cotizacion:41.20,medio:'Transferencia',estado:'pagado',vence:''},
    {id:'m6',_t:n(),tipo:'gasto',fecha:d(0,4),concepto:'Compra de repuestos · F-A 2201',categoria:'Repuestos e insumos',proveedorId:'pr1',importe:50200,moneda:'UYU',cotizacion:41.20,medio:'Transferencia',estado:'pagado',vence:''},
    {id:'m7',_t:n(),tipo:'gasto',fecha:d(0,6),concepto:'UTE',categoria:'UTE',importe:14800,moneda:'UYU',cotizacion:41.20,medio:'Débito/Crédito',estado:'pagado',vence:''},
    {id:'m8',_t:n(),tipo:'gasto',fecha:d(0,10),concepto:'Aportes BPS',categoria:'Aportes BPS',importe:42300,moneda:'UYU',cotizacion:41.20,medio:'Redpagos/Abitab',estado:'pagado',vence:''},
    {id:'m9',_t:n(),tipo:'gasto',fecha:d(1,3),concepto:'Sueldos del mes',categoria:'Sueldos y jornales',importe:182000,moneda:'UYU',cotizacion:40.80,medio:'Transferencia',estado:'pagado',vence:''},
    {id:'m10',_t:n(),tipo:'gasto',fecha:d(1,9),concepto:'Alquiler del galpón',categoria:'Alquiler',importe:38000,moneda:'UYU',cotizacion:40.80,medio:'Transferencia',estado:'pagado',vence:''},
    {id:'m11',_t:n(),tipo:'gasto',fecha:d(1,15),concepto:'Compra de repuestos · F-A 2150',categoria:'Repuestos e insumos',proveedorId:'pr1',importe:52000,moneda:'UYU',cotizacion:40.80,medio:'Transferencia',estado:'pagado',vence:''},
    {id:'m12',_t:n(),tipo:'gasto',fecha:d(2,4),concepto:'Sueldos del mes',categoria:'Sueldos y jornales',importe:178000,moneda:'UYU',cotizacion:40.30,medio:'Transferencia',estado:'pagado',vence:''},
    {id:'m13',_t:n(),tipo:'gasto',fecha:d(2,12),concepto:'Seguro de la flota',categoria:'Seguros (BSE)',importe:26500,moneda:'UYU',cotizacion:40.30,medio:'Débito/Crédito',estado:'pagado',vence:''},
    {id:'m14',_t:n(),tipo:'cobro',fecha:d(2,20),concepto:'Reparación de motor',clienteId:'c1',ordenId:'',importe:154000,moneda:'UYU',cotizacion:40.30,medio:'Transferencia',estado:'cobrado',vence:'',cuotas:1},
    {id:'m15',_t:n(),tipo:'cobro',fecha:d(1,28),concepto:'Reparación eléctrica',clienteId:'c3',ordenId:'',importe:27800,moneda:'UYU',cotizacion:40.80,medio:'Efectivo',estado:'cobrado',vence:'',cuotas:1},
    {id:'m16',_t:n(),tipo:'gasto',fecha:d(0,12),concepto:'Combustible del camión de auxilio',categoria:'Combustible',importe:11200,moneda:'UYU',cotizacion:41.20,medio:'Efectivo',estado:'pagado',vence:''},
    {id:'m17',_t:n(),tipo:'cobro',fecha:d(0,6),concepto:'O.R. 495 · Reparación de frenos',clienteId:'c2',ordenId:'',importe:78500,moneda:'UYU',cotizacion:41.20,medio:'Transferencia',estado:'cobrado',vence:'',cuotas:1},
    {id:'m18',_t:n(),tipo:'cobro',fecha:d(0,11),concepto:'O.R. 496 · Cambio de cubiertas',clienteId:'c4',ordenId:'',importe:112000,moneda:'UYU',cotizacion:41.20,medio:'Efectivo',estado:'cobrado',vence:'',cuotas:1},
    {id:'m19',_t:n(),tipo:'cobro',fecha:d(0,13),concepto:'O.R. 497 · Service y eléctrica',clienteId:'c3',ordenId:'',importe:64200,moneda:'UYU',cotizacion:41.20,medio:'Redpagos/Abitab',estado:'cobrado',vence:'',cuotas:1},
    {id:'m20',_t:n(),tipo:'cobro',fecha:d(0,16),concepto:'Venta de repuestos por mostrador',clienteId:'c5',ordenId:'',importe:38400,moneda:'UYU',cotizacion:41.20,medio:'Débito/Crédito',estado:'cobrado',vence:'',cuotas:1},
    {id:'m21',_t:n(),tipo:'cobro',fecha:d(0,16),concepto:'O.R. 500 · Alineación y balanceo',clienteId:'c1',ordenId:'',importe:55000,moneda:'UYU',cotizacion:41.20,medio:'Transferencia',estado:'cobrado',vence:'',cuotas:1},
    {id:'m22',_t:n(),tipo:'cobro',fecha:d(1,10),concepto:'O.R. 494 · Reparación de caja',clienteId:'c5',ordenId:'',importe:98000,moneda:'UYU',cotizacion:40.80,medio:'Transferencia',estado:'cobrado',vence:'',cuotas:1},
    {id:'m23',_t:n(),tipo:'cobro',fecha:d(1,24),concepto:'O.R. 497 · Suspensión trasera',clienteId:'c2',ordenId:'',importe:62000,moneda:'UYU',cotizacion:40.80,medio:'Efectivo',estado:'cobrado',vence:'',cuotas:1},
    {id:'m24',_t:n(),tipo:'cobro',fecha:d(2,16),concepto:'Service de flota',clienteId:'c1',ordenId:'',importe:88000,moneda:'UYU',cotizacion:40.30,medio:'Transferencia',estado:'cobrado',vence:'',cuotas:1},
    {id:'m27',_t:n(),tipo:'gasto',fecha:d(0,8),concepto:'Factura de repuestos a 30 días',categoria:'Repuestos e insumos',proveedorId:'pr1',importe:1250,moneda:'USD',cotizacion:41.20,medio:'Transferencia',estado:'pendiente',vence:d(0,28)},
    {id:'m28',_t:n(),tipo:'gasto',fecha:d(1,20),concepto:'Herramienta neumática',categoria:'Herramientas/equipos',proveedorId:'pr1',importe:18400,moneda:'UYU',cotizacion:0,medio:'Cheque',estado:'pendiente',vence:d(0,5)},
    {id:'m26',_t:n(),tipo:'cobro',fecha:d(0,9),concepto:'Reparación a transportista brasileño',clienteId:'c4',ordenId:'',importe:4200,moneda:'BRL',cotizacion:7.55,medio:'Reales efectivo',estado:'cobrado',vence:'',cuotas:1},
    {id:'m25',_t:n(),tipo:'gasto',fecha:d(2,22),concepto:'Compra de repuestos · F-A 2120',categoria:'Repuestos e insumos',proveedorId:'pr2',importe:41800,moneda:'UYU',cotizacion:40.30,medio:'Transferencia',estado:'pagado',vence:''},
  ];

  /* Trabajos ya entregados en el mes: son los que hacen que los números del taller
     (horas vendidas, cierre de mes, facturación) se vean como en un mes normal. */
  const cerrados=[
    ['RIA1234','c1','Correctivo','Cambio de kit de embrague',        34,'f1',46000],
    ['RIB5678','c1','Preventivo','Service de 20.000 km',             12,'f2',16800],
    ['RIC9012','c2','Correctivo','Reparación de suspensión trasera', 40,'f1',38500],
    ['RID3456','c3','Correctivo','Bomba de agua y termostato',       22,'f2',19400],
    ['RIE7890','c4','Preventivo','Service y alineación',             10,'f2',13900],
    ['RIF2468','c5','Correctivo','Reparación de sistema eléctrico',  26,'f4',21700],
    ['RIG1357','c1','Preventivo','Service de 10.000 km',              9,'f3', 9800],
    ['RIA1234','c1','Correctivo','Cambio de cubiertas y balanceo',   16,'f3',54000],
    ['RIC9012','c2','Correctivo','Pérdida de aire en el circuito',   30,'f1',12300],
    ['RIE7890','c4','Correctivo','Cambio de amortiguadores',         24,'f2',33600],
    ['RIB5678','c1','Correctivo','Rectificado de tapa de cilindros', 38,'f1',61000],
    ['RID3456','c3','Correctivo','Reparación de caja de cambios',    45,'f1',72500],
    ['RIF2468','c5','Preventivo','Service de 40.000 km',             14,'f2',24800],
    ['RIG1357','c1','Correctivo','Cambio de embrague y volante',     28,'f2',43900],
  ];
  cerrados.forEach((x,i)=>{
    const ini=Math.min(26,2+i*2), fin=Math.min(27,ini+2);
    ordenes.push({id:'oc'+i,_t:n(),nro:480+i,matricula:x[0],clienteId:x[1],tipo:x[2],cargo:'Cliente',
      asesorId:'f6',lugar:'En el taller',prioridad:'Media',fecha:d(0,ini),fechaEst:d(0,fin),fechaEntrega:d(0,fin),
      etapa:'entregada',presupuestoId:'',peticiones:x[3],diagnostico:x[3],combustible:'1/2',km:0,
      checklist:[{t:x[3],ok:true}],tareas:[{funcionarioId:x[5],horas:x[4],desc:x[3]}],
      repuestos:[{desc:'Repuestos del trabajo',cant:1,precio:x[6],factura:''}],servicios:'',
      tiempos:{recibimiento:d(0,ini)+'T08:00',diagnostico:d(0,ini)+'T10:00',reparacion:d(0,ini)+'T13:00',
               revision:d(0,fin)+'T09:00',entregada:d(0,fin)+'T16:00'},notas:''});
  });

  const campanas=[
    {id:'k1',_t:n(),chasis:'9BWZZZ377VT004251',codigo:'VW-2023-14',descripcion:'Revisión de mangueras de combustible',realizado:false},
    {id:'k2',_t:n(),chasis:'9BM958424HB012345',codigo:'MB-2022-07',descripcion:'Actualización de software de la central',realizado:true},
  ];

  // Camiones con matrícula de Brasil: el taller está en la frontera y atiende de los dos lados.
  camionesBrasilEjemplo().forEach(c=>camiones.push(c));

  return {cfg:cfg,clientes:clientes,camiones:camiones,presupuestos:presupuestos,ordenes:ordenes,movimientos:movimientos,funcionarios:funcionarios,campanas:campanas,contactos:[]};
}

/* Camiones brasileños de ejemplo. Están aparte porque también se agregan a quien ya tenía
   el demo abierto antes de que existiera el país de la matrícula. */
function camionesBrasilEjemplo(){
  const t=Date.now();
  return [
    {id:'vbr1',_t:t+1,matricula:'RTA2H45',pais:'Brasil',clienteId:'c4',marca:'Volvo',modelo:'FH 540',anio:2021,
      chasis:'9BVR4X200M1122334',motor:'D13K',color:'Blanco',km:340000,horimetro:0,fventa:'',chasisLargo:'',
      notas:'Viene de Santana do Livramento.'},
    {id:'vbr2',_t:t+2,matricula:'QPB7C31',pais:'Brasil',clienteId:'c5',marca:'Mercedes-Benz',modelo:'Actros 2646',anio:2020,
      chasis:'9BM9584247B778899',motor:'OM 471',color:'Rojo',km:410000,horimetro:0,fventa:'',chasisLargo:'',notas:''},
  ];
}
