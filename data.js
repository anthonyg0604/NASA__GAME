const GAME_DATA = {
    // Personajes jugables: Los Backyardigans en 3D
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
            rewardCredits: 450,
            desc: 'Complejo subterráneo en cráteres lunares con reservas de hielo.',
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
            rewardCredits: 750,
            desc: 'Estación de investigación presurizada en la superficie roja marciana.',
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
            rewardCredits: 1100,
            desc: 'Base bajo cúpula térmica sobre la corteza glacial de Europa.',
            groundColor: 0x0e7490,
            skyColor: 0x04121c,
            accentColor: 0xf59e0b,
            asteroidCount: 18
        }
    ],
    // Taller por partes simples: Pico, Alas, Motor y Humo, Fuselaje y Pintura
    // Incluye 2 piezas gratis (0 CR) en las partes principales para poder customizar desde el inicio
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
    roles: [
        {
            id: 'commander',
            name: '1. Comandante / Piloto',
            short: 'Comandante',
            colorHex: 0x38bdf8,
            colorCss: '#38bdf8',
            bonus: 'Control de Puente y Navegación',
            tasks: [
                { id: 'cmd_nav', title: 'Calibrar Ruta de Retorno', wallLabel: 'PUENTE: RUTA', type: 'sequence', x: -3.4, z: -14.8, rotY: 0 },
                { id: 'cmd_shield', title: 'Alinear Escudos de Base', wallLabel: 'PUENTE: ESCUDOS', type: 'timing', x: 3.4, z: -14.8, rotY: 0 },
                { id: 'cmd_thruster', title: 'Verificar Vector Orbital', wallLabel: 'NORTE: VECTOR', type: 'slider', x: 0, z: -14.8, rotY: 0 }
            ]
        },
        {
            id: 'engineer',
            name: '2. Ingeniero de Sistemas',
            short: 'Ingeniero',
            colorHex: 0xf59e0b,
            colorCss: '#f59e0b',
            bonus: 'Reactores, Energía y Casco',
            tasks: [
                { id: 'eng_wires', title: 'Conectar Bus del Reactor', wallLabel: 'REACTOR: CABLES', type: 'wires', x: -14.8, z: -3.4, rotY: Math.PI / 2 },
                { id: 'eng_hull', title: 'Soldar Microfisuras de Casco', wallLabel: 'REACTOR: CASCO', type: 'rivets', x: -14.8, z: 3.4, rotY: Math.PI / 2 },
                { id: 'eng_core', title: 'Estabilizar Núcleo Térmico', wallLabel: 'OESTE: NÚCLEO', type: 'timing', x: -14.8, z: 0, rotY: Math.PI / 2 }
            ]
        },
        {
            id: 'scientist',
            name: '3. Especialista Científico',
            short: 'Científico',
            colorHex: 0x10b981,
            colorCss: '#10b981',
            bonus: 'Laboratorio y Muestras',
            tasks: [
                { id: 'sci_cryo', title: 'Ajustar Cámara Criogénica', wallLabel: 'LAB: CRIOGENIA', type: 'temp', x: 14.8, z: -3.4, rotY: -Math.PI / 2 },
                { id: 'sci_dna', title: 'Secuenciar Muestra Mineral', wallLabel: 'LAB: MUESTRAS', type: 'sequence', x: 14.8, z: 3.4, rotY: -Math.PI / 2 },
                { id: 'sci_drill', title: 'Analizar Escáner MedBay', wallLabel: 'ESTE: ESCÁNER', type: 'timing', x: 14.8, z: 0, rotY: -Math.PI / 2 }
            ]
        },
        {
            id: 'comms',
            name: '4. Oficial de Comunicaciones',
            short: 'Comunicaciones',
            colorHex: 0xa855f7,
            colorCss: '#a855f7',
            bonus: 'Antenas, Datos y Telemetría',
            tasks: [
                { id: 'com_freq', title: 'Sintonizar Antena con Tierra', wallLabel: 'COMMS: ANTENA', type: 'slider', x: -3.4, z: 14.8, rotY: Math.PI },
                { id: 'com_nodes', title: 'Enlazar Nodos Satelitales', wallLabel: 'COMMS: NODOS', type: 'wires', x: 3.4, z: 14.8, rotY: Math.PI },
                { id: 'com_data', title: 'Codificar Paquete Científico', wallLabel: 'SUR: TELEMETRÍA', type: 'sequence', x: 0, z: 14.8, rotY: Math.PI }
            ]
        }
    ]
};

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
        const speedMult = c.booster.speedBonus + c.hull.speedBonus + c.nose.speedBonus + c.wing.speedBonus;
        const shieldBonus = c.booster.shieldBonus + c.hull.shieldBonus + c.nose.shieldBonus + c.wing.shieldBonus;
        const o2Bonus = c.booster.o2Bonus + c.hull.o2Bonus + c.nose.o2Bonus + c.wing.o2Bonus;
        return { speedMult, shieldBonus, o2Bonus };
    }
};

GAME_STATE.loadProgress();

// Construye la nave 3D reflejando Pico, Alas, Motor+Humo, Fuselaje y Pintura
function buildCustom3DRocket(includeFlame) {
    const rocket = new THREE.Group();
    const cfg = GAME_STATE.shipConfig;

    const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.primaryColor.hex, roughness: 0.28, metalness: 0.3 });
    const accentMat = new THREE.MeshStandardMaterial({ color: cfg.secondaryColor.hex, roughness: 0.35, metalness: 0.25 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.85, roughness: 0.1 });
    const cyanGlowMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.7 });

    // 1. Fuselaje
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

    // 2. Pico / Morro frontal
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

    // 3. Alas
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

    // 4. Motores y Humo/Fuego de despegue
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

            // Partículas de humo animado saliendo del motor
            for (let s = 0; s < 3; s++) {
                const puff = new THREE.Mesh(new THREE.SphereGeometry(isMain ? 0.24 : 0.14, 10, 10), smokeMat);
                puff.position.set(nx, ny - 1.2 - s * 0.45, nz);
                puff.userData = { baseX: nx, baseZ: nz, startY: ny - 1.1, phase: s * 0.33 + idx * 0.17 };
                rocket.add(puff);
                smokePuffs.push(puff);
            }
        });
    }

    // Tren de aterrizaje
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
