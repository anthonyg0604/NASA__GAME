const GAME_DATA = {
    characters: [
        { id: 'pablo', name: 'Pablo', shortName: 'Pablo', species: 'Pingüino Azul', colorCss: '#3b82f6' },
        { id: 'uniqua', name: 'Yonicua (Uniqua)', shortName: 'Yonicua', species: 'Exploradora Rosa', colorCss: '#ec4899' },
        { id: 'tyrone', name: 'Tyrone', shortName: 'Tyrone', species: 'Alce Naranja', colorCss: '#f97316' },
        { id: 'tasha', name: 'Tasha', shortName: 'Tasha', species: 'Hipopótamo Amarilla', colorCss: '#eab308' }
    ],
    missions: [
        {
            id: 'moon',
            name: 'Base Lunar Shackleton',
            orbitLabel: 'ÓRBITA ACTUAL: LA LUNA',
            difficulty: 'Fácil',
            rewardCredits: 550,
            desc: 'Complejo de 36 sectores con largos pasillos presurizados en el polo sur lunar.',
            groundColor: 0x64748b,
            skyColor: 0x050814,
            accentColor: 0x38bdf8,
            asteroidCount: 9
        },
        {
            id: 'mars',
            name: 'Cráter Jezero (Marte)',
            orbitLabel: 'ÓRBITA ACTUAL: PLANETA MARTE',
            difficulty: 'Normal',
            rewardCredits: 850,
            desc: 'Estación interplanetaria de 36 sectores sobre el antiguo delta fluvial de Marte.',
            groundColor: 0xb45309,
            skyColor: 0x261209,
            accentColor: 0x10b981,
            asteroidCount: 14
        },
        {
            id: 'europa',
            name: 'Luna Helada Europa',
            orbitLabel: 'ÓRBITA ACTUAL: LUNA EUROPA',
            difficulty: 'Experto',
            rewardCredits: 1250,
            desc: 'Laboratorio submarino-orbital de 36 sectores bajo la corteza glacial de Europa.',
            groundColor: 0x0e7490,
            skyColor: 0x04121c,
            accentColor: 0xf59e0b,
            asteroidCount: 18
        }
    ],
    suitProtocols: [
        { id: 'proto_balanced', name: 'Protocolo Estándar NASA', desc: 'Equilibrio entre movilidad y soporte vital', o2Bonus: 0, shieldBonus: 0 },
        { id: 'proto_explorer', name: 'Exploración de Largo Alcance', desc: '+40s extra de oxígeno para explorar los 36 sectores', o2Bonus: 40, shieldBonus: 0 },
        { id: 'proto_vanguard', name: 'Blindaje Reforzado EVA', desc: '+15% escudo extra en travesía espacial', o2Bonus: 0, shieldBonus: 15 }
    ],
    shipCustomization: {
        noses: [
            { id: 'nose_standard', name: 'Pico Cónico Clásico', price: 0, desc: 'Punta estándar equilibrada', speedBonus: 0, shieldBonus: 0, o2Bonus: 0 },
            { id: 'nose_needle', name: 'Pico Supersónico Afilado', price: 0, desc: '+10% velocidad de vuelo (Gratis)', speedBonus: 0.10, shieldBonus: 0, o2Bonus: 0 },
            { id: 'nose_shield', name: 'Pico Escudo Redondo', price: 250, desc: '+20% escudo frontal', speedBonus: 0, shieldBonus: 20, o2Bonus: 0 },
            { id: 'nose_drill', name: 'Pico Taladro Meteoritos', price: 450, desc: '+35% escudo anti-impacto', speedBonus: 0, shieldBonus: 35, o2Bonus: 0 },
            { id: 'nose_laser', name: 'Pico Láser Cuántico', price: 700, desc: '+40% escudo y +12% velocidad', speedBonus: 0.12, shieldBonus: 40, o2Bonus: 0 }
        ],
        wings: [
            { id: 'wing_delta', name: 'Aletas Delta Clásicas', price: 0, desc: '4 aletas estabilizadoras', speedBonus: 0, shieldBonus: 0, o2Bonus: 0 },
            { id: 'wing_aero', name: 'Alas de Caza Extendidas', price: 0, desc: '+15s oxígeno extra (Gratis)', speedBonus: 0.05, shieldBonus: 0, o2Bonus: 15 },
            { id: 'wing_interceptor', name: 'Alas Dobles Interceptor', price: 350, desc: '+35s oxígeno y +12% velocidad', speedBonus: 0.12, shieldBonus: 10, o2Bonus: 35 },
            { id: 'wing_ring', name: 'Anillo Orbital Cuántico', price: 650, desc: '+50s oxígeno y +20% escudo', speedBonus: 0.10, shieldBonus: 20, o2Bonus: 50 }
        ],
        boosters: [
            { id: 'boost_standard', name: 'Motor Único (Humo Blanco)', price: 0, flameHex: 0xf59e0b, smokeHex: 0xe2e8f0, desc: '1 tobera central y humo blanco', speedBonus: 1.0, shieldBonus: 0, o2Bonus: 0 },
            { id: 'boost_twin', name: 'Doble Motor (Humo Azul)', price: 0, flameHex: 0x38bdf8, smokeHex: 0xbae6fd, desc: '+12% velocidad y estela azul (Gratis)', speedBonus: 1.12, shieldBonus: 5, o2Bonus: 0 },
            { id: 'boost_heavy', name: 'Triple Núcleo (Humo Verde)', price: 350, flameHex: 0x10b981, smokeHex: 0xa7f3d0, desc: '+25% velocidad y estela esmeralda', speedBonus: 1.25, shieldBonus: 20, o2Bonus: 0 },
            { id: 'boost_plasma', name: 'Reactores Plasma X4 (Violeta)', price: 650, flameHex: 0xa855f7, smokeHex: 0xe9d5ff, desc: '+40% velocidad y estela de plasma', speedBonus: 1.40, shieldBonus: 35, o2Bonus: 0 }
        ],
        hulls: [
            { id: 'hull_standard', name: 'Fuselaje Cilíndrico', price: 0, desc: 'Cuerpo estándar de la nave', speedBonus: 0, shieldBonus: 0, o2Bonus: 0 },
            { id: 'hull_slim', name: 'Fuselaje Estrecho Veloz', price: 250, desc: '+15% velocidad aerodinámica', speedBonus: 0.15, shieldBonus: 0, o2Bonus: 0 },
            { id: 'hull_heavy', name: 'Fuselaje Blindado Hexagonal', price: 450, desc: '+30% escudo estructural', speedBonus: 0, shieldBonus: 30, o2Bonus: 0 },
            { id: 'hull_cryo', name: 'Fuselaje Doble Tanque', price: 700, desc: '+45s oxígeno y +20% escudo', speedBonus: 0.05, shieldBonus: 20, o2Bonus: 45 }
        ],
        primaryColors: [
            { id: 'pcol_white', name: 'Blanco NASA', price: 0, hex: 0xf8fafc, css: '#f8fafc', desc: 'Pintura blanca espacial' },
            { id: 'pcol_cobalt', name: 'Azul Espacial', price: 0, hex: 0x2563eb, css: '#2563eb', desc: 'Pintura azul metálica (Gratis)' },
            { id: 'pcol_crimson', name: 'Rojo Cohete', price: 200, hex: 0xdc2626, css: '#dc2626', desc: 'Pintura roja brillante' },
            { id: 'pcol_orange', name: 'Naranja Solar', price: 350, hex: 0xf97316, css: '#f97316', desc: 'Pintura térmica experimental' },
            { id: 'pcol_stealth', name: 'Negro Sigilo', price: 550, hex: 0x1e293b, css: '#1e293b', desc: 'Blindaje oscuro antirradar' },
            { id: 'pcol_gold', name: 'Oro Orbital VIP', price: 800, hex: 0xeab308, css: '#eab308', desc: 'Baño dorado de lujo' }
        ],
        secondaryColors: [
            { id: 'scol_red', name: 'Franjas Rojas', price: 0, hex: 0xef4444, css: '#ef4444', desc: 'Acentos rojos clásicos' },
            { id: 'scol_cyan', name: 'Franjas Cian Neón', price: 0, hex: 0x06b6d4, css: '#06b6d4', desc: 'Acentos azul neón (Gratis)' },
            { id: 'scol_amber', name: 'Franjas Amarillas', price: 200, hex: 0xf59e0b, css: '#f59e0b', desc: 'Bandas industriales ámbar' },
            { id: 'scol_emerald', name: 'Franjas Verde Láser', price: 350, hex: 0x10b981, css: '#10b981', desc: 'Acentos bio-orbitales' },
            { id: 'scol_purple', name: 'Franjas Púrpura', price: 500, hex: 0x9333ea, css: '#9333ea', desc: 'Acabado violeta' }
        ]
    },
    // Coordenadas de terminales distribuidas en el complejo 6x6 (144x144, sectores en ±60, ±36, ±12)
    roles: [
        {
            id: 'commander',
            name: '1. Comandante / Piloto',
            short: 'Comandante',
            colorHex: 0x38bdf8,
            colorCss: '#38bdf8',
            bonus: 'Puente Norte, Escudos NW, Giroscopios NE, Propulsores SE y Timón Central',
            tasks: [
                { id: 'cmd_1', roomName: 'Puente Principal (Norte)', wallLabel: 'PUENTE: NAVEGACIÓN', x: -12, z: -70.6, rotY: 0 },
                { id: 'cmd_2', roomName: 'Batería de Escudos (Noroeste)', wallLabel: 'ESCUDOS: DEFLECTOR', x: -70.6, z: -60, rotY: Math.PI / 2 },
                { id: 'cmd_3', roomName: 'Sala de Giroscopios (Norte-Este)', wallLabel: 'GIROSCOPIOS: EJE', x: 36, z: -70.6, rotY: 0 },
                { id: 'cmd_4', roomName: 'Propulsores Principales (Sureste)', wallLabel: 'MOTORES: EMPUJE', x: 60, z: 70.6, rotY: Math.PI },
                { id: 'cmd_5', roomName: 'Control de Timón (Corredor Central)', wallLabel: 'TIMÓN: ACOPLAMIENTO', x: -23.0, z: -36, rotY: Math.PI / 2 }
            ]
        },
        {
            id: 'engineer',
            name: '2. Ingeniero de Sistemas',
            short: 'Ingeniero',
            colorHex: 0xf59e0b,
            colorCss: '#f59e0b',
            bonus: 'Reactor Oeste, Subestación SW, Refrigeración, Esclusa Carga y Turbinas',
            tasks: [
                { id: 'eng_1', roomName: 'Reactor Principal (Oeste)', wallLabel: 'REACTOR: NÚCLEO', x: -70.6, z: -12, rotY: Math.PI / 2 },
                { id: 'eng_2', roomName: 'Subestación Eléctrica (Suroeste)', wallLabel: 'ELÉCTRICA: BUS', x: -60, z: 70.6, rotY: Math.PI },
                { id: 'eng_3', roomName: 'Refrigeración Térmica (Oeste-Norte)', wallLabel: 'TÉRMICA: RADIADOR', x: -70.6, z: -36, rotY: Math.PI / 2 },
                { id: 'eng_4', roomName: 'Esclusa de Carga (Sureste)', wallLabel: 'CARGA: COMPUERTA', x: 70.6, z: 60, rotY: -Math.PI / 2 },
                { id: 'eng_5', roomName: 'Turbinas Auxiliares (Pasillo Sur)', wallLabel: 'TURBINAS: FLUJO', x: 23.0, z: 36, rotY: -Math.PI / 2 }
            ]
        },
        {
            id: 'scientist',
            name: '3. Especialista Científico',
            short: 'Científico',
            colorHex: 0x10b981,
            colorCss: '#10b981',
            bonus: 'Lab Este, Criogenia NE, Invernadero LED, Atmósfera Central y Geología',
            tasks: [
                { id: 'sci_1', roomName: 'Laboratorio Astrobiológico (Este)', wallLabel: 'LAB: ISÓTOPOS', x: 70.6, z: -12, rotY: -Math.PI / 2 },
                { id: 'sci_2', roomName: 'Cámara Criogénica (Noreste)', wallLabel: 'O2: CRIOGENIA', x: 60, z: -70.6, rotY: 0 },
                { id: 'sci_3', roomName: 'Invernadero Hidropónico (Este-Norte)', wallLabel: 'BOTÁNICA: LED', x: 70.6, z: -36, rotY: -Math.PI / 2 },
                { id: 'sci_4', roomName: 'Analizador Atmosférico (Núcleo)', wallLabel: 'CENTRAL: ATMÓSFERA', x: 23.0, z: -12, rotY: -Math.PI / 2 },
                { id: 'sci_5', roomName: 'Escáner Geológico (Sur-Oeste)', wallLabel: 'GEOLOGÍA: SISMO', x: -36, z: 70.6, rotY: Math.PI }
            ]
        },
        {
            id: 'comms',
            name: '4. Oficial de Comunicaciones',
            short: 'Comunicaciones',
            colorHex: 0xa855f7,
            colorCss: '#a855f7',
            bonus: 'Antenas Sur, Satélite NW, Radar Este-Sur, Servidor SW y Baliza Central',
            tasks: [
                { id: 'com_1', roomName: 'Torre de Antenas (Sur)', wallLabel: 'COMMS: ANTENA', x: -12, z: 70.6, rotY: Math.PI },
                { id: 'com_2', roomName: 'Enlace Satelital (Norte-Oeste)', wallLabel: 'SATÉLITE: ENLACE', x: -36, z: -70.6, rotY: 0 },
                { id: 'com_3', roomName: 'Radar Espacial (Este-Sur)', wallLabel: 'RADAR: ÓRBITAS', x: 70.6, z: 36, rotY: -Math.PI / 2 },
                { id: 'com_4', roomName: 'Servidor Cuántico (Suroeste)', wallLabel: 'SERVIDOR: DATOS', x: -70.6, z: 60, rotY: Math.PI / 2 },
                { id: 'com_5', roomName: 'Baliza Central (Núcleo Oeste)', wallLabel: 'BALIZA: TELEMETRÍA', x: -23.0, z: 12, rotY: Math.PI / 2 }
            ]
        }
    ],
    // Banco de desafíos de ingeniería espacial específicos por planeta (se mezclan aleatoriamente en cada sala)
    planetChallengePools: {
        moon: [
            {
                title: 'Extraer Agua de Regolito Polar',
                type: 'temp',
                nasaFact: 'En el polo sur lunar (cráter Shackleton), el hielo permanece atrapado en sombra perpetua a temperaturas bajo -160°C.',
                nasaQuestion: '¿Qué proceso de ingeniería espacial permite obtener agua líquida e hidrógeno en la Luna?',
                nasaOptions: ['Calentamiento térmico del regolito helado (ISRU)', 'Perforación de ríos subterráneos lunares', 'Condensación de nubes de lluvia lunar'],
                correctIdx: 0
            },
            {
                title: 'Mitigar Polvo Electrostático Lunar',
                type: 'shields_charge',
                nasaFact: 'El polvo lunar tiene bordes microscópicos afilados como vidrio y carga electrostática por el viento solar.',
                nasaQuestion: '¿Cómo protege la NASA los visores y trajes espaciales contra el polvo lunar abrasivo?',
                nasaOptions: ['Escudos electrodinámicos (EDS) que repelen partículas', 'Lavando los trajes con aire comprimido exterior', 'Aplicando aceite lubricante en el visor'],
                correctIdx: 0
            },
            {
                title: 'Calibrar Relé Óptico Tierra-Luna',
                type: 'dish_align',
                nasaFact: 'La luz tarda apenas 1.28 segundos en viajar entre la Tierra y la Luna, permitiendo teleoperación casi en tiempo real.',
                nasaQuestion: '¿Cuánto tarda aproximadamente una señal de radio o láser en llegar desde la Luna a la Tierra?',
                nasaOptions: ['1.28 segundos', '22 minutos', '4 horas'],
                correctIdx: 0
            },
            {
                title: 'Equilibrar Microrred Solar Polar',
                type: 'power_balance',
                nasaFact: 'Los bordes del cráter Shackleton reciben luz solar casi el 90% del año lunar, ideal para paneles verticales.',
                nasaQuestion: '¿Por qué los paneles solares en el polo sur lunar se instalan verticalmente?',
                nasaOptions: ['Porque el Sol siempre está muy bajo en el horizonte polar', 'Para evitar la lluvia de meteoritos verticales', 'Para enfriar el suelo lunar'],
                correctIdx: 0
            },
            {
                title: 'Sincronizar Órbita Gateway NRHO',
                type: 'orbit_sync',
                nasaFact: 'La estación Lunar Gateway usa una órbita de halo casi rectilínea (NRHO) que mantiene comunicación directa con la Tierra.',
                nasaQuestion: '¿Qué ventaja ofrece la órbita NRHO de la estación Lunar Gateway?',
                nasaOptions: ['Evita eclipses largos y mantiene contacto con la Tierra', 'Aterriza directamente en el mar de la Tranquilidad', 'Gira más rápido que la rotación terrestre'],
                correctIdx: 0
            },
            {
                title: 'Sellar Esclusa de Presión Cero',
                type: 'rivets',
                nasaFact: 'La Luna carece de atmósfera densa; cualquier microfisura en un hábitat provoca despresurización inmediata.',
                nasaQuestion: '¿Cuál es la presión atmosférica aproximada en la superficie de la Luna?',
                nasaOptions: ['Prácticamente vacío (cercana a cero)', 'Igual que en la cima del Everest', 'El doble que en la Tierra'],
                correctIdx: 0
            },
            {
                title: 'Secuenciar Telemetría de Sismómetro',
                type: 'sequence',
                nasaFact: 'Los sismómetros de las misiones Apolo revelaron "lunamotos" que duran más de 10 minutos debido a la corteza seca.',
                nasaQuestion: '¿Por qué los sismos lunares duran mucho más tiempo que los terremotos terrestres?',
                nasaOptions: ['La corteza lunar es seca y rígida sin agua que amortigüe', 'La Luna tiene océanos de magma superficiales', 'Por el viento magnético de Júpiter'],
                correctIdx: 0
            },
            {
                title: 'Sintetizar Oxígeno desde Ilmenita',
                type: 'fuel_mix',
                nasaFact: 'El mineral lunar ilmenita (FeTiO₃) contiene oxígeno químico que puede extraerse mediante electrólisis de regolito fundido.',
                nasaQuestion: '¿Qué elemento vital se extrae al procesar el mineral lunar ilmenita?',
                nasaOptions: ['Oxígeno respirable y oxidante para cohetes', 'Nitrógeno líquido atmosférico', 'Gas metano natural'],
                correctIdx: 0
            }
        ],
        mars: [
            {
                title: 'Operar Reactor MOXIE de CO₂',
                type: 'fuel_mix',
                nasaFact: 'La atmósfera de Marte está compuesta en un 95% por dióxido de carbono (CO₂), ideal para producir oxígeno in situ.',
                nasaQuestion: '¿Cuál es el gas principal que compone el 95% de la atmósfera marciana?',
                nasaOptions: ['Dióxido de carbono (CO₂)', 'Oxígeno molecular (O₂)', 'Hidrógeno gaseoso'],
                correctIdx: 0
            },
            {
                title: 'Compensar Retardo de Señal Marte',
                type: 'slider',
                nasaFact: 'Debido a la distancia orbital, una señal entre Marte y la Tierra tarda entre 4 y 24 minutos según su posición.',
                nasaQuestion: '¿Por qué los rovers en Marte necesitan software de navegación autónoma?',
                nasaOptions: ['Porque el retardo de señal impide conducirlos con joystick', 'Porque Marte bloquea todas las ondas de radio', 'Porque no tienen cámaras a bordo'],
                correctIdx: 0
            },
            {
                title: 'Calibrar Rotor Helicóptero Ingenuity',
                type: 'orbit_sync',
                nasaFact: 'La atmósfera de Marte tiene solo el 1% de la densidad terrestre; las aspas de Ingenuity giran a 2.500 rpm.',
                nasaQuestion: '¿Por qué el helicóptero Ingenuity necesita girar sus aspas a 2.500 revoluciones por minuto?',
                nasaOptions: ['Para generar sustentación en una atmósfera muy tenue', 'Para perforar rocas sedimentarias', 'Para recargar su batería por fricción'],
                correctIdx: 0
            },
            {
                title: 'Proteger Generador Nuclear MMRTG',
                type: 'power_balance',
                nasaFact: 'Las tormentas de polvo globales en Marte pueden durar meses y bloquear la luz solar; el MMRTG usa plutonio-238.',
                nasaQuestion: '¿Qué ventaja tiene un generador MMRTG frente a paneles solares durante tormentas en Marte?',
                nasaOptions: ['Produce electricidad día y noche sin depender del Sol', 'Absorbe energía directamente del viento marciano', 'Congela el dióxido de carbono del aire'],
                correctIdx: 0
            },
            {
                title: 'Alinear Antena de Banda X',
                type: 'dish_align',
                nasaFact: 'Los rovers usan antenas de alta ganancia en Banda X para enviar imágenes HD directamente a la Red del Espacio Profundo.',
                nasaQuestion: '¿Qué frecuencia utiliza la NASA para transmitir datos científicos de alta velocidad desde Marte?',
                nasaOptions: ['Microondas en Banda X y Banda Ka', 'Ondas de radio AM comerciales', 'Ultrasonido atmosférico'],
                correctIdx: 0
            },
            {
                title: 'Analizar Espectrómetro Láser SuperCam',
                type: 'binary_decode',
                nasaFact: 'El láser de SuperCam en Perseverance vaporiza rocas a 7 metros para analizar su composición química por espectroscopía.',
                nasaQuestion: '¿Cómo identifica el instrumento SuperCam los minerales de una roca marciana a distancia?',
                nasaOptions: ['Analizando la luz del plasma generado por un láser', 'Lanzando sondas con cables de cobre', 'Midiendo su peso con un imán'],
                correctIdx: 0
            },
            {
                title: 'Controlar Escudo Térmico de Entrada',
                type: 'timing',
                nasaFact: 'Durante los "7 minutos de terror", la cápsula entra a Marte a 20.000 km/h y soporta más de 1.300°C.',
                nasaQuestion: '¿Qué componente protege a la nave del calor extremo al entrar en la atmósfera de Marte?',
                nasaOptions: ['Escudo térmico ablativo', 'Paracaídas de aluminio', 'Tanques de agua externa'],
                correctIdx: 0
            },
            {
                title: 'Reconectar Bus de Energía del Hábitat',
                type: 'wires',
                nasaFact: 'Los hábitats marcianos requieren redundancia eléctrica triple para mantener el reciclaje de aire y agua.',
                nasaQuestion: '¿Por qué los sistemas críticos de soporte vital de la NASA tienen circuitos redundantes?',
                nasaOptions: ['Para evitar fallos totales si un circuito se daña', 'Para consumir el triple de energía', 'Para aumentar la gravedad artificial'],
                correctIdx: 0
            }
        ],
        europa: [
            {
                title: 'Reforzar Blindaje contra Radiación Joviana',
                type: 'shields_charge',
                nasaFact: 'Júpiter posee un campo magnético gigantesco que atrapa partículas de alta energía que bombardean la superficie de Europa.',
                nasaQuestion: '¿Cuál es el mayor peligro ambiental en la superficie helada de la luna Europa?',
                nasaOptions: ['Intensa radiación atrapada por Júpiter', 'Lluvia ácida volcánica constante', 'Vientos huracanados de 800 km/h'],
                correctIdx: 0
            },
            {
                title: 'Calibrar Radar Penetrador de Hielo REASON',
                type: 'dish_align',
                nasaFact: 'La sonda Europa Clipper usa radar de penetración para medir el espesor de la capa de hielo (de 15 a 25 km).',
                nasaQuestion: '¿Qué espesor estimado tiene la corteza de hielo que cubre el océano de Europa?',
                nasaOptions: ['Entre 15 y 25 kilómetros', 'Apenas 2 metros', 'Más de 500 kilómetros'],
                correctIdx: 0
            },
            {
                title: 'Regular Sonda Criobot de Perforación',
                type: 'temp',
                nasaFact: 'La temperatura superficial en Europa ronda los -160°C, manteniendo el hielo tan duro como el granito terrestre.',
                nasaQuestion: '¿Cómo se comporta el hielo en Europa a -160°C para la ingeniería de aterrizaje?',
                nasaOptions: ['Tan duro como roca de granito', 'Blando como nieve fresca', 'Líquido y viscoso'],
                correctIdx: 0
            },
            {
                title: 'Analizar Plumas de Vapor de Agua',
                type: 'fuel_mix',
                nasaFact: 'El telescopio Hubble detectó géiseres de vapor de agua expulsados desde grietas en el polo sur de Europa.',
                nasaQuestion: '¿Qué permiten estudiar los géiseres de vapor de Europa sin necesidad de perforar kilómetros de hielo?',
                nasaOptions: ['La química del océano subterráneo oculto', 'La temperatura del núcleo de Júpiter', 'La velocidad de los anillos de Saturno'],
                correctIdx: 0
            },
            {
                title: 'Estabilizar Magnetómetro de Océano Salado',
                type: 'orbit_sync',
                nasaFact: 'Europa altera el campo magnético de Júpiter al moverse, lo que demostró que posee un océano global de agua salada.',
                nasaQuestion: '¿Cómo descubrieron los científicos que Europa tiene un océano salado conductor bajo el hielo?',
                nasaOptions: ['Por las perturbaciones magnéticas inducidas por Júpiter', 'Observando peces con telescopios', 'Por el color verde de su atmósfera'],
                correctIdx: 0
            },
            {
                title: 'Decodificar Telemetría de Europa Clipper',
                type: 'binary_decode',
                nasaFact: 'Europa Clipper realiza 49 sobrevuelos rasantes en lugar de orbitar Europa continuamente para sobrevivir a la radiación.',
                nasaQuestion: '¿Por qué Europa Clipper hace sobrevuelos elípticos en vez de quedarse fija en órbita baja?',
                nasaOptions: ['Para salir de los cinturones de radiación y transmitir datos', 'Porque no tiene propulsores de frenado', 'Para ahorrar combustible nuclear'],
                correctIdx: 0
            },
            {
                title: 'Distribuir Potencia de Paneles Gigantes',
                type: 'power_balance',
                nasaFact: 'En Júpiter la luz solar es 25 veces más débil que en la Tierra; Europa Clipper usa paneles solares de 30 metros.',
                nasaQuestion: '¿Por qué los paneles solares de Europa Clipper miden más de 30 metros de envergadura?',
                nasaOptions: ['Porque en Júpiter llega 25 veces menos luz solar', 'Para usarlos como velas atmosféricas', 'Para reflejar luz hacia la Tierra'],
                correctIdx: 0
            },
            {
                title: 'Sellar Compuerta Térmica Criogénica',
                type: 'rivets',
                nasaFact: 'Los sellos metálicos especiales evitan que el frío extremo de -170°C fragilice las juntas de la estación.',
                nasaQuestion: '¿Qué ocurre con los plásticos y gomas comunes a temperaturas criogénicas espaciales?',
                nasaOptions: ['Se vuelven quebradizos y se fracturan', 'Se derriten instantáneamente', 'Se vuelven magnéticos'],
                correctIdx: 0
            }
        ]
    }
};

function getMissionTasksForRole(missionId, roleId, seedNumber) {
    const roleDef = GAME_DATA.roles.find(r => r.id === roleId) || GAME_DATA.roles[0];
    const pool = GAME_DATA.planetChallengePools[missionId] || GAME_DATA.planetChallengePools.moon;
    const roleOffset = GAME_DATA.roles.findIndex(r => r.id === roleId);

    // Mezcla determinista por código de sala + planeta + rol para que cada sala y planeta tengan retos distintos
    const indices = pool.map((_, i) => i);
    let seed = (parseInt(seedNumber, 10) || 1234) + roleOffset * 37 + missionId.length * 19;
    for (let i = indices.length - 1; i > 0; i--) {
        seed = (seed * 9301 + 49297) % 233280;
        const j = seed % (i + 1);
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    return roleDef.tasks.map((slot, idx) => {
        const challenge = pool[indices[idx % indices.length]];
        return {
            ...slot,
            id: `${missionId}_${slot.id}_${idx}`,
            title: challenge.title,
            type: challenge.type,
            nasaFact: challenge.nasaFact,
            nasaQuestion: challenge.nasaQuestion,
            nasaOptions: challenge.nasaOptions,
            correctIdx: challenge.correctIdx
        };
    });
}

const DEFAULT_UNLOCKED_PARTS = [
    'nose_standard',
    'nose_needle',
    'wing_delta',
    'wing_aero',
    'boost_standard',
    'boost_twin',
    'hull_standard',
    'pcol_white',
    'pcol_cobalt',
    'scol_red',
    'scol_cyan'
];

const GAME_STATE = {
    currentOrbitId: 'earth',
    selectedMission: GAME_DATA.missions[0],
    selectedRole: GAME_DATA.roles[0],
    selectedCharacterId: 'pablo',
    selectedSuitProtocol: GAME_DATA.suitProtocols[0],
    credits: 500,
    unlockedParts: [...DEFAULT_UNLOCKED_PARTS],
    shipConfig: {
        nose: GAME_DATA.shipCustomization.noses[0],
        wing: GAME_DATA.shipCustomization.wings[0],
        booster: GAME_DATA.shipCustomization.boosters[0],
        hull: GAME_DATA.shipCustomization.hulls[0],
        primaryColor: GAME_DATA.shipCustomization.primaryColors[0],
        secondaryColor: GAME_DATA.shipCustomization.secondaryColors[0]
    },

    loadProgress() {
        try {
            const raw = localStorage.getItem('cubo_phora_save_v3');
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (typeof saved.credits === 'number') this.credits = saved.credits;
            if (Array.isArray(saved.unlockedParts)) {
                this.unlockedParts = Array.from(new Set([...DEFAULT_UNLOCKED_PARTS, ...saved.unlockedParts]));
            }
            if (saved.selectedCharacterId && GAME_DATA.characters.some(c => c.id === saved.selectedCharacterId)) {
                this.selectedCharacterId = saved.selectedCharacterId;
            }
            if (saved.equipped) {
                const cust = GAME_DATA.shipCustomization;
                this.shipConfig.nose = cust.noses.find(x => x.id === saved.equipped.nose) || cust.noses[0];
                this.shipConfig.wing = cust.wings.find(x => x.id === saved.equipped.wing) || cust.wings[0];
                this.shipConfig.booster = cust.boosters.find(x => x.id === saved.equipped.booster) || cust.boosters[0];
                this.shipConfig.hull = cust.hulls.find(x => x.id === saved.equipped.hull) || cust.hulls[0];
                this.shipConfig.primaryColor = cust.primaryColors.find(x => x.id === saved.equipped.primaryColor) || cust.primaryColors[0];
                this.shipConfig.secondaryColor = cust.secondaryColors.find(x => x.id === saved.equipped.secondaryColor) || cust.secondaryColors[0];
            }
        } catch (_) {}
    },

    saveProgress() {
        try {
            localStorage.setItem('cubo_phora_save_v3', JSON.stringify({
                credits: this.credits,
                unlockedParts: this.unlockedParts,
                selectedCharacterId: this.selectedCharacterId,
                equipped: {
                    nose: this.shipConfig.nose.id,
                    wing: this.shipConfig.wing.id,
                    booster: this.shipConfig.booster.id,
                    hull: this.shipConfig.hull.id,
                    primaryColor: this.shipConfig.primaryColor.id,
                    secondaryColor: this.shipConfig.secondaryColor.id
                }
            }));
        } catch (_) {}
    },

    getShipTotalStats() {
        const c = this.shipConfig;
        const proto = this.selectedSuitProtocol || GAME_DATA.suitProtocols[0];
        const speedMult = c.booster.speedBonus + c.hull.speedBonus + c.nose.speedBonus + c.wing.speedBonus;
        const shieldBonus = c.booster.shieldBonus + c.hull.shieldBonus + c.nose.shieldBonus + c.wing.shieldBonus + proto.shieldBonus;
        const o2Bonus = c.booster.o2Bonus + c.hull.o2Bonus + c.nose.o2Bonus + c.wing.o2Bonus + proto.o2Bonus;
        return { speedMult, shieldBonus, o2Bonus };
    }
};

GAME_STATE.loadProgress();

function buildCustom3DRocket(includeFlame) {
    const rocket = new THREE.Group();
    const cfg = GAME_STATE.shipConfig;

    const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.primaryColor.hex, roughness: 0.28, metalness: 0.3 });
    const accentMat = new THREE.MeshStandardMaterial({ color: cfg.secondaryColor.hex, roughness: 0.35, metalness: 0.25 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.85, roughness: 0.1 });
    const cyanGlowMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.7 });

    let topRadius = 0.58;
    if (cfg.hull.id === 'hull_slim') {
        topRadius = 0.46;
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.56, 3.1, 24), bodyMat);
        rocket.add(body);
    } else if (cfg.hull.id === 'hull_heavy') {
        topRadius = 0.68;
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.76, 2.9, 6), bodyMat);
        rocket.add(body);
    } else if (cfg.hull.id === 'hull_cryo') {
        topRadius = 0.6;
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.68, 2.9, 24), bodyMat);
        rocket.add(body);
        [-0.55, 0.55].forEach(tx => {
            const cryoTank = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.2, 16), accentMat);
            cryoTank.position.set(tx, -0.1, 0.42);
            rocket.add(cryoTank);
        });
    } else {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.68, 2.9, 24), bodyMat);
        rocket.add(body);
    }

    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(topRadius + 0.02, topRadius + 0.04, 0.28, 24), accentMat);
    stripe.position.y = 0.1;
    rocket.add(stripe);

    const cockpitWindow = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), glassMat);
    cockpitWindow.position.set(0, 0.68, topRadius - 0.05);
    rocket.add(cockpitWindow);

    if (cfg.nose.id === 'nose_needle') {
        const needle = new THREE.Mesh(new THREE.ConeGeometry(topRadius, 1.85, 24), accentMat);
        needle.position.y = 2.35;
        rocket.add(needle);
    } else if (cfg.nose.id === 'nose_shield') {
        const dome = new THREE.Mesh(new THREE.SphereGeometry(topRadius + 0.05, 24, 16), accentMat);
        dome.position.y = 1.65;
        dome.scale.set(1, 1.4, 1);
        rocket.add(dome);
    } else if (cfg.nose.id === 'nose_drill') {
        const drill = new THREE.Mesh(new THREE.ConeGeometry(topRadius + 0.06, 1.45, 8), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.7, roughness: 0.25 }));
        drill.position.y = 2.15;
        rocket.add(drill);
    } else if (cfg.nose.id === 'nose_laser') {
        const nose = new THREE.Mesh(new THREE.ConeGeometry(topRadius, 1.0, 24), accentMat);
        nose.position.y = 1.95;
        rocket.add(nose);
        const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.12, 0.9, 12), cyanGlowMat);
        spire.position.y = 2.72;
        rocket.add(spire);
    } else {
        const nose = new THREE.Mesh(new THREE.ConeGeometry(topRadius, 1.15, 24), accentMat);
        nose.position.y = 2.02;
        rocket.add(nose);
    }

    if (cfg.wing.id === 'wing_aero') {
        [-1.22, 1.22].forEach(wx => {
            const wing = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.95), accentMat);
            wing.position.set(wx, -0.6, 0);
            wing.rotation.z = wx > 0 ? -0.25 : 0.25;
            rocket.add(wing);
        });
    } else if (cfg.wing.id === 'wing_ring') {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.08, 12, 32), cyanGlowMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = -0.7;
        rocket.add(ring);
    } else if (cfg.wing.id === 'wing_interceptor') {
        [-1.25, 1.25].forEach(wx => {
            const mainWing = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 1.0), accentMat);
            mainWing.position.set(wx, -0.75, 0);
            rocket.add(mainWing);

            const canard = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.1, 0.55), cyanGlowMat);
            canard.position.set(wx * 0.8, 0.45, 0);
            rocket.add(canard);
        });
    } else {
        for (let i = 0; i < 4; i++) {
            const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.95, 0.75), accentMat);
            const angle = (i * Math.PI) / 2;
            fin.position.set(Math.sin(angle) * 0.68, -1.0, Math.cos(angle) * 0.68);
            fin.rotation.y = angle;
            rocket.add(fin);
        }
    }

    const flames = [];
    const smokePuffs = [];
    const flameMat = new THREE.MeshBasicMaterial({ color: cfg.booster.flameHex });
    const smokeMat = new THREE.MeshBasicMaterial({ color: cfg.booster.smokeHex, transparent: true, opacity: 0.72 });

    const nozzleCoords = [[0, -1.55, 0]];
    if (cfg.booster.id !== 'boost_standard') {
        const sideOffsets = (cfg.booster.id === 'boost_heavy' || cfg.booster.id === 'boost_plasma')
            ? [[-0.98, 0], [0.98, 0], [0, -0.98], [0, 0.98]]
            : [[-0.98, 0], [0.98, 0]];

        sideOffsets.forEach(([bx, bz]) => {
            const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 2.1, 16), bodyMat);
            pod.position.set(bx, -0.35, bz);
            rocket.add(pod);

            const podNose = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.55, 16), accentMat);
            podNose.position.set(bx, 0.97, bz);
            rocket.add(podNose);

            nozzleCoords.push([bx, -1.45, bz]);
        });
    }

    if (includeFlame) {
        nozzleCoords.forEach(([nx, ny, nz], idx) => {
            const isMain = idx === 0;
            const flame = new THREE.Mesh(
                new THREE.ConeGeometry(isMain ? 0.42 : 0.22, isMain ? 1.35 : 0.95, 14),
                flameMat
            );
            flame.position.set(nx, ny - 0.55, nz);
            flame.rotation.x = Math.PI;
            rocket.add(flame);
            flames.push(flame);

            for (let s = 0; s < 3; s++) {
                const puff = new THREE.Mesh(new THREE.SphereGeometry(isMain ? 0.24 : 0.14, 10, 10), smokeMat);
                puff.position.set(nx, ny - 1.2 - s * 0.45, nz);
                puff.userData = { baseX: nx, baseZ: nz, startY: ny - 1.1, phase: s * 0.33 + idx * 0.17 };
                rocket.add(puff);
                smokePuffs.push(puff);
            }
        });
    }

    for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.9, 8), darkMat);
        leg.position.set(Math.sin(angle) * 0.85, -1.35, Math.cos(angle) * 0.85);
        leg.rotation.z = -Math.sin(angle) * 0.35;
        leg.rotation.x = Math.cos(angle) * 0.35;
        rocket.add(leg);
    }

    rocket.userData.flames = flames;
    rocket.userData.smokePuffs = smokePuffs;
    return rocket;
}

function animateRocketExhaust(rocket, dt) {
    if (!rocket || !rocket.userData) return;
    if (rocket.userData.flames) {
        rocket.userData.flames.forEach(f => {
            f.scale.y = 0.8 + Math.random() * 0.55;
        });
    }
    if (rocket.userData.smokePuffs) {
        rocket.userData.smokePuffs.forEach(p => {
            p.userData.phase = (p.userData.phase + dt * 1.8) % 1;
            const t = p.userData.phase;
            p.position.y = p.userData.startY - t * 1.65;
            p.position.x = p.userData.baseX + Math.sin(t * 8) * 0.16;
            p.position.z = p.userData.baseZ + Math.cos(t * 8) * 0.16;
            p.scale.setScalar(0.7 + t * 1.35);
        });
    }
}

function createPlayerNameTag(playerName, charName, roleShort, colorCss) {
    const canvas = document.createElement('canvas');
    canvas.width = 420;
    canvas.height = 104;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(14, 14, 392, 76, 18);
    ctx.fill();

    ctx.strokeStyle = colorCss;
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(playerName, 210, 46);

    ctx.fillStyle = colorCss;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`${charName.toUpperCase()} • ${roleShort.toUpperCase()}`, 210, 74);

    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
    sprite.scale.set(3.0, 0.74, 1);
    sprite.position.y = 3.65;
    return sprite;
}

function createOrganicSkinTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    if (type === 'pablo') {
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 650; i++) {
            ctx.fillStyle = i % 2 === 0 ? 'rgba(30, 58, 138, 0.35)' : 'rgba(96, 165, 250, 0.25)';
            ctx.beginPath();
            ctx.ellipse(Math.random() * 256, Math.random() * 256, 3, 7, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (type === 'uniqua') {
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 26; i++) {
            ctx.fillStyle = '#be185d';
            ctx.beginPath();
            ctx.arc(Math.random() * 256, Math.random() * 256, 10 + Math.random() * 14, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (type === 'tyrone') {
        ctx.fillStyle = '#f97316';
        ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 900; i++) {
            ctx.strokeStyle = i % 2 === 0 ? 'rgba(194, 65, 12, 0.35)' : 'rgba(253, 186, 116, 0.25)';
            ctx.lineWidth = 1.5;
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + (Math.random() - 0.5) * 4, y + 7);
            ctx.stroke();
        }
    } else {
        ctx.fillStyle = '#facc15';
        ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 500; i++) {
            ctx.fillStyle = i % 2 === 0 ? 'rgba(202, 138, 4, 0.2)' : 'rgba(254, 240, 138, 0.25)';
            ctx.beginPath();
            ctx.arc(Math.random() * 256, Math.random() * 256, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    return new THREE.CanvasTexture(canvas);
}

function createRealisticEye(irisColorHex) {
    const eyeGroup = new THREE.Group();
    const sclera = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 20, 20),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 })
    );
    sclera.scale.set(0.9, 1.15, 0.75);
    eyeGroup.add(sclera);

    const iris = new THREE.Mesh(
        new THREE.SphereGeometry(0.065, 16, 16),
        new THREE.MeshStandardMaterial({ color: irisColorHex, roughness: 0.2 })
    );
    iris.position.set(0, 0, 0.055);
    eyeGroup.add(iris);

    const pupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.036, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x090d16 })
    );
    pupil.position.set(0, 0, 0.09);
    eyeGroup.add(pupil);

    const catchlight = new THREE.Mesh(
        new THREE.SphereGeometry(0.016, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    catchlight.position.set(0.022, 0.025, 0.11);
    eyeGroup.add(catchlight);

    return eyeGroup;
}

function createBackyardiganCharacter(charId, labelInfo) {
    const group = new THREE.Group();
    const id = charId || 'pablo';
    const skinTex = createOrganicSkinTexture(id);
    const skinMat = new THREE.MeshStandardMaterial({
        map: skinTex,
        bumpMap: skinTex,
        bumpScale: 0.04,
        roughness: 0.45,
        metalness: 0.05
    });

    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    let propellerMesh = null;

    if (id === 'pablo') {
        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.98, 24), skinMat);
        torso.position.y = 1.32;
        group.add(torso);

        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.44, 24, 20), whiteMat);
        belly.position.set(0, 1.3, 0.15);
        belly.scale.set(0.9, 1.05, 0.78);
        group.add(belly);

        const vest = new THREE.Mesh(new THREE.CylinderGeometry(0.49, 0.52, 0.52, 24), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 }));
        vest.position.y = 1.52;
        group.add(vest);
    } else if (id === 'uniqua') {
        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.46, 0.95, 24), skinMat);
        torso.position.y = 1.32;
        group.add(torso);

        const overalls = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.48, 0.58, 24), new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4 }));
        overalls.position.y = 1.18;
        group.add(overalls);
    } else if (id === 'tyrone') {
        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 1.02, 24), skinMat);
        torso.position.y = 1.34;
        group.add(torso);

        const shirt = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.53, 0.74, 24), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45 }));
        shirt.position.y = 1.36;
        group.add(shirt);

        const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.51, 0.51, 0.16, 24), new THREE.MeshStandardMaterial({ color: 0x1d4ed8 }));
        stripe.position.y = 1.38;
        group.add(stripe);
    } else {
        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.54, 0.98, 24), skinMat);
        torso.position.y = 1.32;
        group.add(torso);

        const dress = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.62, 0.78, 24), new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 }));
        dress.position.y = 1.24;
        group.add(dress);
    }

    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.65, 0.24), whiteMat);
    backpack.position.set(0, 1.45, -0.48);
    group.add(backpack);

    const headGroup = new THREE.Group();
    headGroup.position.y = 2.34;
    group.add(headGroup);

    const headSphere = new THREE.Mesh(new THREE.SphereGeometry(0.52, 32, 32), skinMat);
    headGroup.add(headSphere);

    const irisColors = { pablo: 0x1e3a8a, uniqua: 0x831843, tyrone: 0x7c2d12, tasha: 0x713f12 };
    [-0.18, 0.18].forEach(ex => {
        const eye = createRealisticEye(irisColors[id]);
        eye.position.set(ex, 0.08, 0.46);
        headGroup.add(eye);
    });

    if (id === 'pablo') {
        const beakMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
        const upperBeak = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 20), beakMat);
        upperBeak.rotation.x = Math.PI / 2;
        upperBeak.scale.set(1.2, 1, 0.65);
        upperBeak.position.set(0, -0.05, 0.62);
        headGroup.add(upperBeak);

        const lowerBeak = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.34, 20), beakMat);
        lowerBeak.rotation.x = Math.PI / 2;
        lowerBeak.scale.set(1.1, 1, 0.5);
        lowerBeak.position.set(0, -0.12, 0.58);
        headGroup.add(lowerBeak);

        const cap = new THREE.Mesh(
            new THREE.SphereGeometry(0.36, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2),
            new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 })
        );
        cap.position.y = 0.36;
        headGroup.add(cap);

        const propHub = new THREE.Group();
        propHub.position.y = 0.76;
        const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.03, 0.08), new THREE.MeshStandardMaterial({ color: 0xfacc15 }));
        const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.44), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
        propHub.add(blade1, blade2);
        headGroup.add(propHub);
        propellerMesh = propHub;
    } else if (id === 'uniqua') {
        [-0.22, 0.22].forEach(ax => {
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.36, 12), skinMat);
            stem.position.set(ax, 0.58, 0);
            stem.rotation.z = ax > 0 ? -0.35 : 0.35;
            headGroup.add(stem);

            const tip = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), new THREE.MeshStandardMaterial({ color: 0xbe185d }));
            tip.position.set(ax * 1.45, 0.76, 0);
            headGroup.add(tip);
        });
    } else if (id === 'tyrone') {
        const snout = new THREE.Mesh(
            new THREE.SphereGeometry(0.34, 24, 20),
            new THREE.MeshStandardMaterial({ color: 0xfdba74, roughness: 0.45 })
        );
        snout.position.set(0, -0.1, 0.46);
        snout.scale.set(1.15, 0.85, 1.1);
        headGroup.add(snout);

        const hairTuft = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.32, 12), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
        hairTuft.position.set(0, 0.58, 0.08);
        headGroup.add(hairTuft);

        const antlerMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 });
        [-0.36, 0.36].forEach(side => {
            const mainBranch = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.55, 12), antlerMat);
            mainBranch.position.set(side * 1.2, 0.58, 0);
            mainBranch.rotation.z = side > 0 ? -0.65 : 0.65;
            headGroup.add(mainBranch);

            const palm = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.08), antlerMat);
            palm.position.set(side * 1.85, 0.78, 0);
            palm.rotation.z = side > 0 ? -0.4 : 0.4;
            headGroup.add(palm);
        });
    } else {
        const hippoSnout = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 20), skinMat);
        hippoSnout.position.set(0, -0.12, 0.44);
        hippoSnout.scale.set(1.25, 0.82, 1.05);
        headGroup.add(hippoSnout);

        [-0.14, 0.14].forEach(nx => {
            const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), new THREE.MeshBasicMaterial({ color: 0x713f12 }));
            nostril.position.set(nx, -0.02, 0.78);
            headGroup.add(nostril);
        });

        [-0.34, 0.34].forEach(earX => {
            const ear = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), skinMat);
            ear.position.set(earX, 0.46, 0);
            ear.scale.set(0.8, 1.2, 0.5);
            headGroup.add(ear);
        });
    }

    const glassDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.76, 28, 28),
        new THREE.MeshStandardMaterial({
            color: 0xe0f2fe,
            transparent: true,
            opacity: 0.2,
            roughness: 0.05,
            metalness: 0.1
        })
    );
    glassDome.position.y = 0.14;
    headGroup.add(glassDome);

    function makeArm(side) {
        const armPivot = new THREE.Group();
        armPivot.position.set(side * 0.6, 1.68, 0);

        const armMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, id === 'pablo' ? 0.08 : 0.13, 0.62, 16),
            skinMat
        );
        armMesh.position.y = -0.3;
        if (id === 'pablo') armMesh.scale.set(1.2, 1, 0.55);
        armPivot.add(armMesh);

        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 14), skinMat);
        hand.position.y = -0.64;
        armPivot.add(hand);

        group.add(armPivot);
        return armPivot;
    }

    const leftArm = makeArm(-1);
    const rightArm = makeArm(1);

    function makeLeg(side) {
        const legPivot = new THREE.Group();
        legPivot.position.set(side * 0.24, 0.84, 0);

        const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.56, 16), skinMat);
        legMesh.position.y = -0.3;
        legPivot.add(legMesh);

        const boot = new THREE.Mesh(
            new THREE.BoxGeometry(0.32, 0.22, 0.44),
            id === 'pablo' ? new THREE.MeshStandardMaterial({ color: 0xf59e0b }) : bootMat
        );
        boot.position.set(0, -0.7, 0.06);
        legPivot.add(boot);

        group.add(legPivot);
        return legPivot;
    }

    const leftLeg = makeLeg(-1);
    const rightLeg = makeLeg(1);

    if (labelInfo) {
        const tag = createPlayerNameTag(labelInfo.name, labelInfo.charName, labelInfo.roleShort, labelInfo.colorCss);
        group.add(tag);
    }

    return { group, leftLeg, rightLeg, leftArm, rightArm, propellerMesh };
}

function createHDPlanet(planetId, radius) {
    const planetGroup = new THREE.Group();
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    let atmoColor = 0x38bdf8;
    let atmoOpacity = 0.2;

    if (planetId === 'moon') {
        atmoColor = 0x94a3b8;
        atmoOpacity = 0.08;
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(0, 0, 1024, 512);
        for (let i = 0; i < 18; i++) {
            ctx.fillStyle = 'rgba(71, 85, 105, 0.45)';
            ctx.beginPath();
            ctx.arc(Math.random() * 1024, Math.random() * 512, 40 + Math.random() * 80, 0, Math.PI * 2);
            ctx.fill();
        }
        for (let i = 0; i < 95; i++) {
            const cx = Math.random() * 1024;
            const cy = Math.random() * 512;
            const cr = 5 + Math.random() * 24;
            ctx.strokeStyle = 'rgba(226, 232, 240, 0.55)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, cr, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(51, 65, 85, 0.5)';
            ctx.fill();
        }
    } else if (planetId === 'mars') {
        atmoColor = 0xf97316;
        atmoOpacity = 0.22;
        const grad = ctx.createLinearGradient(0, 0, 0, 512);
        grad.addColorStop(0, '#f8fafc');
        grad.addColorStop(0.08, '#c2410c');
        grad.addColorStop(0.5, '#9a3412');
        grad.addColorStop(0.92, '#c2410c');
        grad.addColorStop(1, '#f8fafc');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 512);
        for (let i = 0; i < 45; i++) {
            ctx.fillStyle = i % 2 === 0 ? 'rgba(67, 20, 7, 0.35)' : 'rgba(234, 88, 12, 0.35)';
            ctx.beginPath();
            ctx.ellipse(Math.random() * 1024, 60 + Math.random() * 390, 30 + Math.random() * 90, 15 + Math.random() * 40, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (planetId === 'europa') {
        atmoColor = 0x22d3ee;
        atmoOpacity = 0.24;
        ctx.fillStyle = '#cffafe';
        ctx.fillRect(0, 0, 1024, 512);
        for (let i = 0; i < 65; i++) {
            ctx.strokeStyle = i % 3 === 0 ? 'rgba(180, 83, 9, 0.45)' : 'rgba(14, 116, 144, 0.4)';
            ctx.lineWidth = 1.5 + Math.random() * 2.5;
            ctx.beginPath();
            ctx.moveTo(Math.random() * 1024, Math.random() * 512);
            ctx.bezierCurveTo(Math.random() * 1024, Math.random() * 512, Math.random() * 1024, Math.random() * 512, Math.random() * 1024, Math.random() * 512);
            ctx.stroke();
        }
    } else {
        atmoColor = 0x38bdf8;
        atmoOpacity = 0.24;
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(0, 0, 1024, 512);
        for (let i = 0; i < 28; i++) {
            ctx.fillStyle = i % 4 === 0 ? '#15803d' : '#22c55e';
            ctx.beginPath();
            ctx.ellipse(Math.random() * 1024, 70 + Math.random() * 370, 35 + Math.random() * 85, 20 + Math.random() * 55, Math.random(), 0, Math.PI * 2);
            ctx.fill();
        }
        for (let i = 0; i < 35; i++) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
            ctx.beginPath();
            ctx.ellipse(Math.random() * 1024, Math.random() * 512, 60 + Math.random() * 120, 8 + Math.random() * 16, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 48, 48),
        new THREE.MeshStandardMaterial({
            map: texture,
            bumpMap: texture,
            bumpScale: 0.15,
            roughness: 0.65,
            metalness: 0.05
        })
    );
    planetGroup.add(sphere);

    const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 1.05, 36, 36),
        new THREE.MeshBasicMaterial({ color: atmoColor, transparent: true, opacity: atmoOpacity, side: THREE.BackSide })
    );
    planetGroup.add(atmosphere);

    return { group: planetGroup, sphere };
}
