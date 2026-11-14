const GAME_DATA = {
    // Personajes jugables: Los Backyardigans en 3D realista
    characters: [
        { id: 'pablo', name: 'Pablo', species: 'Pingüino Azul', colorCss: '#3b82f6', defaultRole: 'commander' },
        { id: 'uniqua', name: 'Uniqua (Yonicua)', species: 'Exploradora Rosa', colorCss: '#ec4899', defaultRole: 'engineer' },
        { id: 'tyrone', name: 'Tyrone', species: 'Alce Naranja', colorCss: '#f97316', defaultRole: 'scientist' },
        { id: 'tasha', name: 'Tasha', species: 'Hipopótamo Amarilla', colorCss: '#eab308', defaultRole: 'comms' }
    ],
    missions: [
        {
            id: 'moon',
            name: 'Base Lunar Shackleton',
            orbitLabel: 'ÓRBITA ACTUAL: LA LUNA',
            difficulty: 'Fácil',
            rewardCredits: 450,
            desc: 'Estación polar en cráteres lunares con reservas de hielo.',
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
            desc: 'Complejo de investigación en la superficie roja marciana.',
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
    // Taller modular completo: 8 categorías individuales de piezas con precios
    shipCustomization: {
        primaryColors: [
            { id: 'pcol_white', name: 'Blanco NASA', price: 0, hex: 0xf8fafc, css: '#f8fafc', desc: 'Acabado cerámico base' },
            { id: 'pcol_orange', name: 'Naranja Experimental', price: 200, hex: 0xf97316, css: '#f97316', desc: 'Pintura térmica de pruebas' },
            { id: 'pcol_cobalt', name: 'Azul Cobalto', price: 350, hex: 0x2563eb, css: '#2563eb', desc: 'Aleación azul metalizada' },
            { id: 'pcol_crimson', name: 'Rojo Carmesí', price: 500, hex: 0xdc2626, css: '#dc2626', desc: 'Esmalte de alto contraste' },
            { id: 'pcol_stealth', name: 'Titanio Sigilo', price: 700, hex: 0x1e293b, css: '#1e293b', desc: 'Recubrimiento oscuro antirradar' },
            { id: 'pcol_gold', name: 'Oro Orbital VIP', price: 1000, hex: 0xeab308, css: '#eab308', desc: 'Baño metálico dorado de lujo' }
        ],
        secondaryColors: [
            { id: 'scol_red', name: 'Franjas Rojo Cohete', price: 0, hex: 0xef4444, css: '#ef4444', desc: 'Detalles rojos clásicos' },
            { id: 'scol_cyan', name: 'Neón Cian', price: 150, hex: 0x06b6d4, css: '#06b6d4', desc: 'Acentos azul eléctrico' },
            { id: 'scol_emerald', name: 'Verde Esmeralda', price: 250, hex: 0x10b981, css: '#10b981', desc: 'Acentos bio-orbitales' },
            { id: 'scol_amber', name: 'Amarillo Seguridad', price: 400, hex: 0xf59e0b, css: '#f59e0b', desc: 'Bandas industriales ámbar' },
            { id: 'scol_purple', name: 'Púrpura Cuántico', price: 600, hex: 0x9333ea, css: '#9333ea', desc: 'Acabado violeta de plasma' }
        ],
        hulls: [
            { id: 'hull_standard', name: 'Fuselaje Cilíndrico', price: 0, desc: 'Estructura estándar equilibrada', speedBonus: 0, shieldBonus: 0, o2Bonus: 0 },
            { id: 'hull_slim', name: 'Casco Estrecho Velocidad', price: 300, desc: '+15% velocidad aerodinámica', speedBonus: 0.15, shieldBonus: 0, o2Bonus: 0 },
            { id: 'hull_heavy', name: 'Blindaje Hexagonal Pesado', price: 550, desc: '+35% escudo estructural', speedBonus: 0, shieldBonus: 35, o2Bonus: 0 },
            { id: 'hull_cryo', name: 'Doble Tanque Criogénico', price: 850, desc: '+45s oxígeno y +20% escudo', speedBonus: 0.05, shieldBonus: 20, o2Bonus: 45 }
        ],
        cockpits: [
            { id: 'cockpit_round', name: 'Ojo de Buey Clásico', price: 0, desc: 'Ventanilla circular estándar', speedBonus: 0, shieldBonus: 0, o2Bonus: 0 },
            { id: 'cockpit_fighter', name: 'Cúpula Panorámica Caza', price: 250, desc: '+10% velocidad de respuesta', speedBonus: 0.10, shieldBonus: 5, o2Bonus: 0 },
            { id: 'cockpit_armored', name: 'Visor Blindado Táctico', price: 500, desc: '+25% escudo de cabina', speedBonus: 0, shieldBonus: 25, o2Bonus: 10 },
            { id: 'cockpit_bridge', name: 'Puente Cristal Orbital', price: 800, desc: '+30s oxígeno y +20% escudo', speedBonus: 0.08, shieldBonus: 20, o2Bonus: 30 }
        ],
        noses: [
            { id: 'nose_standard', name: 'Cono Aerodinámico', price: 0, desc: 'Punta cónica estándar', speedBonus: 0, shieldBonus: 0, o2Bonus: 0 },
            { id: 'nose_shield', name: 'Morro Escudo Reforzado', price: 300, desc: '+20% escudo frontal', speedBonus: 0, shieldBonus: 20, o2Bonus: 0 },
            { id: 'nose_drill', name: 'Taladro Rompe-Asteroides', price: 600, desc: '+35% escudo anti-impacto', speedBonus: 0, shieldBonus: 35, o2Bonus: 0 },
            { id: 'nose_laser', name: 'Aguja Sensor Cuántico', price: 850, desc: '+40% escudo y +10% velocidad', speedBonus: 0.10, shieldBonus: 40, o2Bonus: 0 }
        ],
        wings: [
            { id: 'wing_delta', name: 'Aletas Delta Clásicas', price: 0, desc: '4 aletas estabilizadoras', speedBonus: 0, shieldBonus: 0, o2Bonus: 0 },
            { id: 'wing_aero', name: 'Alas Aeroespaciales', price: 300, desc: '+20s de oxígeno extra', speedBonus: 0.05, shieldBonus: 0, o2Bonus: 20 },
            { id: 'wing_ring', name: 'Anillo Orbital Cuántico', price: 600, desc: '+35s oxígeno y +15% escudo', speedBonus: 0.08, shieldBonus: 15, o2Bonus: 35 },
            { id: 'wing_interceptor', name: 'Alas Interceptor Dobles', price: 900, desc: '+50s oxígeno y +15% velocidad', speedBonus: 0.15, shieldBonus: 10, o2Bonus: 50 }
        ],
        boosters: [
            { id: 'boost_standard', name: 'Tobera Central Única', price: 0, desc: 'Propulsión base', speedBonus: 1.0, shieldBonus: 0, o2Bonus: 0 },
            { id: 'boost_twin', name: 'Propulsores Gemelos', price: 350, desc: '+15% velocidad y +10% escudo', speedBonus: 1.15, shieldBonus: 10, o2Bonus: 0 },
            { id: 'boost_heavy', name: 'Cuádruple Núcleo Pesado', price: 650, desc: '+25% velocidad y +25% escudo', speedBonus: 1.25, shieldBonus: 25, o2Bonus: 0 },
            { id: 'boost_plasma', name: 'Reactores Plasma X4', price: 950, desc: '+40% velocidad y +35% escudo', speedBonus: 1.40, shieldBonus: 35, o2Bonus: 0 }
        ],
        addons: [
            { id: 'addon_none', name: 'Chasis Limpio', price: 0, desc: 'Sin accesorios externos', speedBonus: 0, shieldBonus: 0, o2Bonus: 0 },
            { id: 'addon_antenna', name: 'Antena Telemetría HD', price: 250, desc: '+15s reserva de oxígeno', speedBonus: 0, shieldBonus: 5, o2Bonus: 15 },
            { id: 'addon_cannons', name: 'Torretas Láser Gemelas', price: 550, desc: '+25% escudo táctico', speedBonus: 0.05, shieldBonus: 25, o2Bonus: 10 },
            { id: 'addon_solar', name: 'Paneles Solares Orbitales', price: 850, desc: '+45s oxígeno y +20% escudo', speedBonus: 0.05, shieldBonus: 20, o2Bonus: 45 }
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
                { id: 'cmd_nav', title: 'Calibrar Ruta de Retorno', wallLabel: 'PUENTE: RUTA', type: 'sequence', x: -3.2, z: -13.9, rotY: 0 },
                { id: 'cmd_shield', title: 'Alinear Escudos de Base', wallLabel: 'PUENTE: ESCUDOS', type: 'timing', x: 3.2, z: -13.9, rotY: 0 },
                { id: 'cmd_thruster', title: 'Verificar Vector Orbital', wallLabel: 'ALA NORTE: VECTOR', type: 'slider', x: 0, z: -13.9, rotY: 0 }
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
                { id: 'eng_wires', title: 'Conectar Bus del Reactor', wallLabel: 'REACTOR: CABLES', type: 'wires', x: -13.9, z: -3.2, rotY: Math.PI / 2 },
                { id: 'eng_hull', title: 'Soldar Microfisuras de Casco', wallLabel: 'REACTOR: CASCO', type: 'rivets', x: -13.9, z: 3.2, rotY: Math.PI / 2 },
                { id: 'eng_core', title: 'Estabilizar Turbina Térmica', wallLabel: 'ALA OESTE: TURBINA', type: 'timing', x: -13.9, z: 0, rotY: Math.PI / 2 }
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
                { id: 'sci_cryo', title: 'Ajustar Cámara Criogénica', wallLabel: 'LAB: CRIOGENIA', type: 'temp', x: 13.9, z: -3.2, rotY: -Math.PI / 2 },
                { id: 'sci_dna', title: 'Secuenciar Muestra Mineral', wallLabel: 'LAB: MUESTRAS', type: 'sequence', x: 13.9, z: 3.2, rotY: -Math.PI / 2 },
                { id: 'sci_drill', title: 'Analizar Núcleo Planetario', wallLabel: 'ALA ESTE: NÚCLEO', type: 'timing', x: 13.9, z: 0, rotY: -Math.PI / 2 }
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
                { id: 'com_freq', title: 'Sintonizar Antena con Tierra', wallLabel: 'COMMS: ANTENA', type: 'slider', x: -3.2, z: 13.9, rotY: Math.PI },
                { id: 'com_nodes', title: 'Enlazar Nodos Satelitales', wallLabel: 'COMMS: NODOS', type: 'wires', x: 3.2, z: 13.9, rotY: Math.PI },
                { id: 'com_data', title: 'Codificar Paquete Científico', wallLabel: 'ALA SUR: DATOS', type: 'sequence', x: 0, z: 13.9, rotY: Math.PI }
            ]
        }
    ]
};

const GAME_STATE = {
    currentOrbitId: 'earth',
    selectedMission: GAME_DATA.missions[0],
    selectedRole: GAME_DATA.roles[0],
    selectedCharacterId: 'pablo',
    credits: 500,
    unlockedParts: [
        'pcol_white',
        'scol_red',
        'hull_standard',
        'cockpit_round',
        'nose_standard',
        'wing_delta',
        'boost_standard',
        'addon_none'
    ],
    shipConfig: {
        primaryColor: GAME_DATA.shipCustomization.primaryColors[0],
        secondaryColor: GAME_DATA.shipCustomization.secondaryColors[0],
        hull: GAME_DATA.shipCustomization.hulls[0],
        cockpit: GAME_DATA.shipCustomization.cockpits[0],
        nose: GAME_DATA.shipCustomization.noses[0],
        wing: GAME_DATA.shipCustomization.wings[0],
        booster: GAME_DATA.shipCustomization.boosters[0],
        addon: GAME_DATA.shipCustomization.addons[0]
    },

    loadProgress() {
        try {
            const raw = localStorage.getItem('cubo_phora_save_v2');
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (typeof saved.credits === 'number') this.credits = saved.credits;
            if (Array.isArray(saved.unlockedParts)) this.unlockedParts = saved.unlockedParts;
            if (saved.selectedCharacterId) this.selectedCharacterId = saved.selectedCharacterId;
            if (saved.equipped) {
                const cust = GAME_DATA.shipCustomization;
                this.shipConfig.primaryColor = cust.primaryColors.find(x => x.id === saved.equipped.primaryColor) || cust.primaryColors[0];
                this.shipConfig.secondaryColor = cust.secondaryColors.find(x => x.id === saved.equipped.secondaryColor) || cust.secondaryColors[0];
                this.shipConfig.hull = cust.hulls.find(x => x.id === saved.equipped.hull) || cust.hulls[0];
                this.shipConfig.cockpit = cust.cockpits.find(x => x.id === saved.equipped.cockpit) || cust.cockpits[0];
                this.shipConfig.nose = cust.noses.find(x => x.id === saved.equipped.nose) || cust.noses[0];
                this.shipConfig.wing = cust.wings.find(x => x.id === saved.equipped.wing) || cust.wings[0];
                this.shipConfig.booster = cust.boosters.find(x => x.id === saved.equipped.booster) || cust.boosters[0];
                this.shipConfig.addon = cust.addons.find(x => x.id === saved.equipped.addon) || cust.addons[0];
            }
        } catch (_) {}
    },

    saveProgress() {
        try {
            localStorage.setItem('cubo_phora_save_v2', JSON.stringify({
                credits: this.credits,
                unlockedParts: this.unlockedParts,
                selectedCharacterId: this.selectedCharacterId,
                equipped: {
                    primaryColor: this.shipConfig.primaryColor.id,
                    secondaryColor: this.shipConfig.secondaryColor.id,
                    hull: this.shipConfig.hull.id,
                    cockpit: this.shipConfig.cockpit.id,
                    nose: this.shipConfig.nose.id,
                    wing: this.shipConfig.wing.id,
                    booster: this.shipConfig.booster.id,
                    addon: this.shipConfig.addon.id
                }
            }));
        } catch (_) {}
    },

    getShipTotalStats() {
        const c = this.shipConfig;
        const speedMult = c.booster.speedBonus + c.hull.speedBonus + c.cockpit.speedBonus + c.nose.speedBonus + c.wing.speedBonus + c.addon.speedBonus;
        const shieldBonus = c.booster.shieldBonus + c.hull.shieldBonus + c.cockpit.shieldBonus + c.nose.shieldBonus + c.wing.shieldBonus + c.addon.shieldBonus;
        const o2Bonus = c.booster.o2Bonus + c.hull.o2Bonus + c.cockpit.o2Bonus + c.nose.o2Bonus + c.wing.o2Bonus + c.addon.o2Bonus;
        return { speedMult, shieldBonus, o2Bonus };
    }
};

GAME_STATE.loadProgress();

// Construye la nave 3D modular reflejando las 8 categorías del Taller
function buildCustom3DRocket(includeFlame) {
    const rocket = new THREE.Group();
    const cfg = GAME_STATE.shipConfig;

    const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.primaryColor.hex, roughness: 0.28, metalness: 0.3 });
    const accentMat = new THREE.MeshStandardMaterial({ color: cfg.secondaryColor.hex, roughness: 0.35, metalness: 0.25 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.85, roughness: 0.1 });
    const cyanGlowMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.7 });

    // 1. Fuselaje / Casco según configuración
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

    // Franja decorativa del color secundario en el fuselaje
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(topRadius + 0.02, topRadius + 0.04, 0.28, 24), accentMat);
    stripe.position.y = 0.1;
    rocket.add(stripe);

    // 2. Cabina / Cúpula según configuración
    if (cfg.cockpit.id === 'cockpit_fighter') {
        const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 16), glassMat);
        canopy.position.set(0, 0.72, 0.45);
        canopy.scale.set(0.95, 1.55, 0.85);
        rocket.add(canopy);
    } else if (cfg.cockpit.id === 'cockpit_armored') {
        const visorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.34, 0.28), accentMat);
        visorFrame.position.set(0, 0.72, 0.48);
        rocket.add(visorFrame);
        const slit = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.3), cyanGlowMat);
        slit.position.set(0, 0.72, 0.5);
        rocket.add(slit);
    } else if (cfg.cockpit.id === 'cockpit_bridge') {
        const ringGlass = new THREE.Mesh(new THREE.CylinderGeometry(topRadius + 0.03, topRadius + 0.03, 0.42, 24), glassMat);
        ringGlass.position.y = 0.75;
        rocket.add(ringGlass);
    } else {
        const cockpitWindow = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), glassMat);
        cockpitWindow.position.set(0, 0.68, topRadius - 0.05);
        rocket.add(cockpitWindow);
    }

    // 3. Morro / Punta frontal según configuración
    if (cfg.nose.id === 'nose_shield') {
        const dome = new THREE.Mesh(new THREE.SphereGeometry(topRadius + 0.04, 24, 16), accentMat);
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
        const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.12, 0.85, 12), cyanGlowMat);
        spire.position.y = 2.68;
        rocket.add(spire);
    } else {
        const nose = new THREE.Mesh(new THREE.ConeGeometry(topRadius, 1.15, 24), accentMat);
        nose.position.y = 2.02;
        rocket.add(nose);
    }

    // 4. Propulsores laterales según configuración
    const flames = [];
    if (cfg.booster.id !== 'boost_standard') {
        const sideOffsets = (cfg.booster.id === 'boost_heavy' || cfg.booster.id === 'boost_plasma')
            ? [[-0.98, 0], [0.98, 0], [0, -0.98], [0, 0.98]]
            : [[-0.98, 0], [0.98, 0]];

        const podMat = cfg.booster.id === 'boost_plasma' ? cyanGlowMat : bodyMat;

        sideOffsets.forEach(([bx, bz]) => {
            const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 2.1, 16), podMat);
            pod.position.set(bx, -0.35, bz);
            rocket.add(pod);

            const podNose = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.55, 16), accentMat);
            podNose.position.set(bx, 0.97, bz);
            rocket.add(podNose);

            if (includeFlame) {
                const subFlame = new THREE.Mesh(
                    new THREE.ConeGeometry(0.2, 0.95, 12),
                    new THREE.MeshBasicMaterial({ color: cfg.booster.id === 'boost_plasma' ? 0xa855f7 : 0x38bdf8 })
                );
                subFlame.position.set(bx, -1.8, bz);
                subFlame.rotation.x = Math.PI;
                rocket.add(subFlame);
                flames.push(subFlame);
            }
        });
    }

    // 5. Alas / Estabilizadores según configuración
    if (cfg.wing.id === 'wing_aero') {
        [-1.18, 1.18].forEach(wx => {
            const wing = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.12, 0.95), accentMat);
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

    // 6. Accesorios externos
    if (cfg.addon.id === 'addon_antenna') {
        const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.08, 0.25, 16), cyanGlowMat);
        dish.position.set(0.68, 0.95, 0.35);
        dish.rotation.z = -0.6;
        rocket.add(dish);
    } else if (cfg.addon.id === 'addon_cannons') {
        [-0.8, 0.8].forEach(cx => {
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.35, 12), cyanGlowMat);
            barrel.position.set(cx, 0.55, 0.45);
            rocket.add(barrel);
        });
    } else if (cfg.addon.id === 'addon_solar') {
        [-1.68, 1.68].forEach(sx => {
            const solarPanel = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 0.85, 0.06),
                new THREE.MeshStandardMaterial({ color: 0x1d4ed8, emissive: 0x1e3a8a, emissiveIntensity: 0.45, metalness: 0.8 })
            );
            solarPanel.position.set(sx, 0.25, 0);
            rocket.add(solarPanel);
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

    if (includeFlame) {
        const mainFlame = new THREE.Mesh(
            new THREE.ConeGeometry(0.45, 1.4, 16),
            new THREE.MeshBasicMaterial({ color: 0xf59e0b })
        );
        mainFlame.position.y = -2.1;
        mainFlame.rotation.x = Math.PI;
        rocket.add(mainFlame);
        flames.unshift(mainFlame);
    }

    rocket.userData.flames = flames;
    return rocket;
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

// Genera textura orgánica procedural (plumas, piel con manchas o pelaje realista)
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
        for (let i = 0; i < 400; i++) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
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

// Crea un ojo realista con esclerótica, iris, pupila y brillo especular
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

// Construye en 3D realista a Pablo, Uniqua (Yonicua), Tyrone o Tasha
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

    // 1. Torso y vestimenta según personaje
    if (id === 'pablo') {
        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.98, 24), skinMat);
        torso.position.y = 1.32;
        group.add(torso);

        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.44, 24, 20), whiteMat);
        belly.position.set(0, 1.3, 0.15);
        belly.scale.set(0.9, 1.05, 0.78);
        group.add(belly);

        // Chaleco azul/amarillo de explorador espacial
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
        // Tasha
        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.54, 0.98, 24), skinMat);
        torso.position.y = 1.32;
        group.add(torso);

        const dress = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.62, 0.78, 24), new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 }));
        dress.position.y = 1.24;
        group.add(dress);
    }

    // Mochila de oxígeno compacta en la espalda
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.65, 0.24), whiteMat);
    backpack.position.set(0, 1.45, -0.48);
    group.add(backpack);

    // 2. Cabeza y rasgos faciales detallados
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
        // Pico naranja-amarillo de pingüino
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

        // Gorra azul y amarilla con hélice giratoria
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
        // Antenas curvas características de Uniqua
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
        // Hocico grande de alce + mechón pelirrojo + astas ramificadas
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
        // Tasha: hocico ancho de hipopótamo y orejas redondeadas
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

    // Cúpula espacial de cristal transparente para que se vea el personaje completo
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

    // 3. Brazos articulados
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

    // 4. Piernas articuladas
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
