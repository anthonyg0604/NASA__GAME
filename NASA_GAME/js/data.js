const GAME_DATA = {
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
    // Piezas modulares estilo taller GTA con precios para ir desbloqueando
    shipCustomization: {
        colors: [
            { id: 'color_white', name: 'Blanco NASA', price: 0, hex: 0xf8fafc, css: '#f8fafc', accent: 0xef4444, desc: 'Pintura estándar de fábrica' },
            { id: 'color_orange', name: 'Naranja Experimental', price: 250, hex: 0xf97316, css: '#f97316', accent: 0x1e293b, desc: 'Acabado térmico de pruebas' },
            { id: 'color_cobalt', name: 'Azul Cobalto', price: 450, hex: 0x2563eb, css: '#2563eb', accent: 0x38bdf8, desc: 'Aleación azul metalizada' },
            { id: 'color_stealth', name: 'Titanio Sigilo', price: 700, hex: 0x334155, css: '#334155', accent: 0x10b981, desc: 'Blindaje oscuro antirradar' },
            { id: 'color_gold', name: 'Oro Orbital VIP', price: 1000, hex: 0xeab308, css: '#eab308', accent: 0x0f172a, desc: 'Recubrimiento reflejante de lujo' }
        ],
        boosters: [
            { id: 'boost_standard', name: 'Motor Central Único', price: 0, desc: 'Propulsión base', speedBonus: 1.0, shieldBonus: 0, o2Bonus: 0 },
            { id: 'boost_twin', name: 'Propulsores Gemelos', price: 350, desc: '+15% velocidad y +10 escudo', speedBonus: 1.15, shieldBonus: 10, o2Bonus: 0 },
            { id: 'boost_heavy', name: 'Triple Núcleo Pesado', price: 650, desc: '+25% velocidad y +25 escudo', speedBonus: 1.25, shieldBonus: 25, o2Bonus: 0 },
            { id: 'boost_plasma', name: 'Reactores Plasma X4', price: 950, desc: '+40% velocidad y +35 escudo', speedBonus: 1.40, shieldBonus: 35, o2Bonus: 0 }
        ],
        wings: [
            { id: 'wing_delta', name: 'Aletas Delta Clásicas', price: 0, desc: 'Estabilizadores estándar', speedBonus: 0, shieldBonus: 0, o2Bonus: 0 },
            { id: 'wing_aero', name: 'Alas Aeroespaciales', price: 300, desc: '+20s de oxígeno extra', speedBonus: 0.05, shieldBonus: 0, o2Bonus: 20 },
            { id: 'wing_ring', name: 'Anillo Orbital Cuántico', price: 600, desc: '+35s oxígeno y +15 escudo', speedBonus: 0.08, shieldBonus: 15, o2Bonus: 35 },
            { id: 'wing_interceptor', name: 'Alas Interceptor Dobles', price: 900, desc: '+50s oxígeno y +15% velocidad', speedBonus: 0.15, shieldBonus: 10, o2Bonus: 50 }
        ],
        noses: [
            { id: 'nose_standard', name: 'Cono Aerodinámico', price: 0, desc: 'Punta estándar', speedBonus: 0, shieldBonus: 0, o2Bonus: 0 },
            { id: 'nose_shield', name: 'Morro Escudo Reforzado', price: 300, desc: '+20% escudo contra meteoritos', speedBonus: 0, shieldBonus: 20, o2Bonus: 0 },
            { id: 'nose_drill', name: 'Punta Rompe-Asteroides', price: 600, desc: '+35% escudo frontal pesado', speedBonus: 0, shieldBonus: 35, o2Bonus: 0 },
            { id: 'nose_laser', name: 'Cúpula Sensor Cuántico', price: 850, desc: '+40% escudo y +10% velocidad', speedBonus: 0.10, shieldBonus: 40, o2Bonus: 0 }
        ],
        addons: [
            { id: 'addon_none', name: 'Chasis Limpio', price: 0, desc: 'Sin módulos externos', speedBonus: 0, shieldBonus: 0, o2Bonus: 0 },
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
    credits: 500,
    unlockedParts: [
        'color_white',
        'boost_standard',
        'wing_delta',
        'nose_standard',
        'addon_none'
    ],
    shipConfig: {
        color: GAME_DATA.shipCustomization.colors[0],
        booster: GAME_DATA.shipCustomization.boosters[0],
        wing: GAME_DATA.shipCustomization.wings[0],
        nose: GAME_DATA.shipCustomization.noses[0],
        addon: GAME_DATA.shipCustomization.addons[0]
    },

    loadProgress() {
        try {
            const raw = localStorage.getItem('cubo_phora_save_v1');
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (typeof saved.credits === 'number') this.credits = saved.credits;
            if (Array.isArray(saved.unlockedParts)) this.unlockedParts = saved.unlockedParts;
            if (saved.equipped) {
                const cust = GAME_DATA.shipCustomization;
                this.shipConfig.color = cust.colors.find(x => x.id === saved.equipped.color) || cust.colors[0];
                this.shipConfig.booster = cust.boosters.find(x => x.id === saved.equipped.booster) || cust.boosters[0];
                this.shipConfig.wing = cust.wings.find(x => x.id === saved.equipped.wing) || cust.wings[0];
                this.shipConfig.nose = cust.noses.find(x => x.id === saved.equipped.nose) || cust.noses[0];
                this.shipConfig.addon = cust.addons.find(x => x.id === saved.equipped.addon) || cust.addons[0];
            }
        } catch (_) {}
    },

    saveProgress() {
        try {
            localStorage.setItem('cubo_phora_save_v1', JSON.stringify({
                credits: this.credits,
                unlockedParts: this.unlockedParts,
                equipped: {
                    color: this.shipConfig.color.id,
                    booster: this.shipConfig.booster.id,
                    wing: this.shipConfig.wing.id,
                    nose: this.shipConfig.nose.id,
                    addon: this.shipConfig.addon.id
                }
            }));
        } catch (_) {}
    },

    getShipTotalStats() {
        const c = this.shipConfig;
        const speedMult = c.booster.speedBonus + c.wing.speedBonus + c.nose.speedBonus + c.addon.speedBonus;
        const shieldBonus = c.booster.shieldBonus + c.wing.shieldBonus + c.nose.shieldBonus + c.addon.shieldBonus;
        const o2Bonus = c.booster.o2Bonus + c.wing.o2Bonus + c.nose.o2Bonus + c.addon.o2Bonus;
        return { speedMult, shieldBonus, o2Bonus };
    }
};

GAME_STATE.loadProgress();

// Construye la nave 3D reflejando las 5 categorías modificadas en el Taller
function buildCustom3DRocket(includeFlame) {
    const rocket = new THREE.Group();
    const cfg = GAME_STATE.shipConfig;

    const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.color.hex, roughness: 0.28, metalness: 0.28 });
    const accentMat = new THREE.MeshStandardMaterial({ color: cfg.color.accent, roughness: 0.35, metalness: 0.2 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const cyanGlowMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.65 });

    // 1. Fuselaje central
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.68, 2.9, 24), bodyMat);
    rocket.add(body);

    const cockpitWindow = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.85, roughness: 0.1 })
    );
    cockpitWindow.position.set(0, 0.65, 0.52);
    rocket.add(cockpitWindow);

    // 2. Morro / Punta frontal según configuración elegida
    if (cfg.nose.id === 'nose_shield') {
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 16), accentMat);
        dome.position.y = 1.65;
        dome.scale.set(1, 1.4, 1);
        rocket.add(dome);
    } else if (cfg.nose.id === 'nose_drill') {
        const drill = new THREE.Mesh(new THREE.ConeGeometry(0.64, 1.45, 8), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.7, roughness: 0.25 }));
        drill.position.y = 2.15;
        rocket.add(drill);
    } else if (cfg.nose.id === 'nose_laser') {
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.58, 1.0, 24), accentMat);
        nose.position.y = 1.95;
        rocket.add(nose);
        const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.12, 0.8, 12), cyanGlowMat);
        spire.position.y = 2.65;
        rocket.add(spire);
    } else {
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.58, 1.15, 24), accentMat);
        nose.position.y = 2.02;
        rocket.add(nose);
    }

    // 3. Propulsores laterales según configuración elegida
    const flames = [];
    if (cfg.booster.id !== 'boost_standard') {
        const sideOffsets = (cfg.booster.id === 'boost_heavy' || cfg.booster.id === 'boost_plasma')
            ? [[-0.95, 0], [0.95, 0], [0, -0.95], [0, 0.95]]
            : [[-0.95, 0], [0.95, 0]];

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

    // 4. Diseño de alas según configuración elegida
    if (cfg.wing.id === 'wing_aero') {
        [-1.18, 1.18].forEach(wx => {
            const wing = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.12, 0.95), accentMat);
            wing.position.set(wx, -0.6, 0);
            wing.rotation.z = wx > 0 ? -0.25 : 0.25;
            rocket.add(wing);
        });
    } else if (cfg.wing.id === 'wing_ring') {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.08, 12, 32), cyanGlowMat);
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

    // 5. Accesorios externos (Antenas, Torretas Láser o Paneles Solares)
    if (cfg.addon.id === 'addon_antenna') {
        const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.08, 0.25, 16), cyanGlowMat);
        dish.position.set(0.65, 0.85, 0.35);
        dish.rotation.z = -0.6;
        rocket.add(dish);
    } else if (cfg.addon.id === 'addon_cannons') {
        [-0.78, 0.78].forEach(cx => {
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.3, 12), cyanGlowMat);
            barrel.position.set(cx, 0.55, 0.45);
            rocket.add(barrel);
        });
    } else if (cfg.addon.id === 'addon_solar') {
        [-1.65, 1.65].forEach(sx => {
            const solarPanel = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 0.85, 0.06),
                new THREE.MeshStandardMaterial({ color: 0x1d4ed8, emissive: 0x1e3a8a, emissiveIntensity: 0.4, metalness: 0.8 })
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

function createPlayerNameTag(playerName, roleShort, colorCss) {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(15, 23, 42, 0.86)';
    ctx.beginPath();
    ctx.roundRect(16, 14, 352, 68, 18);
    ctx.fill();

    ctx.strokeStyle = colorCss;
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(playerName, 192, 46);

    ctx.fillStyle = colorCss;
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText(roleShort.toUpperCase(), 192, 70);

    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
    sprite.scale.set(2.8, 0.7, 1);
    sprite.position.y = 3.45;
    return sprite;
}

function createDetailedAstronaut(roleColorHexOverride, labelInfo) {
    const group = new THREE.Group();
    const roleColor = roleColorHexOverride || GAME_STATE.selectedRole.colorHex;

    const suitWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.32, metalness: 0.1 });
    const suitRole = new THREE.MeshStandardMaterial({ color: roleColor, roughness: 0.4 });
    const suitGrey = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
    const bootDark = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const goldVisor = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0x78350f,
        emissiveIntensity: 0.35,
        roughness: 0.08,
        metalness: 0.92
    });

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.42, 0.95, 24), suitWhite);
    torso.position.y = 1.35;
    torso.castShadow = true;
    group.add(torso);

    const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.47, 24, 16), suitWhite);
    shoulders.position.y = 1.8;
    shoulders.scale.set(1.12, 0.55, 0.85);
    group.add(shoulders);

    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.14, 24), suitGrey);
    belt.position.y = 0.88;
    group.add(belt);

    const chestBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.14), suitWhite);
    chestBox.position.set(0, 1.48, 0.43);
    group.add(chestBox);

    const ledCyan = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.04), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    ledCyan.position.set(-0.09, 1.54, 0.5);
    group.add(ledCyan);

    const ledGreen = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.04), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    ledGreen.position.set(0.09, 1.54, 0.5);
    group.add(ledGreen);

    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.92, 0.34), suitWhite);
    backpack.position.set(0, 1.45, -0.46);
    group.add(backpack);

    [-0.18, 0.18].forEach(tx => {
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.78, 16), suitRole);
        tank.position.set(tx, 1.44, -0.62);
        group.add(tank);
    });

    const neckRing = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.05, 12, 24), suitGrey);
    neckRing.rotation.x = Math.PI / 2;
    neckRing.position.y = 1.98;
    group.add(neckRing);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.56, 32, 32), suitWhite);
    helmet.position.y = 2.42;
    group.add(helmet);

    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.49, 28, 24), goldVisor);
    visor.position.set(0, 2.41, 0.18);
    visor.scale.set(1.02, 0.84, 0.88);
    group.add(visor);

    [-0.54, 0.54].forEach(ex => {
        const earPod = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 16), suitRole);
        earPod.rotation.z = Math.PI / 2;
        earPod.position.set(ex, 2.42, 0);
        group.add(earPod);
    });

    function makeArm(side) {
        const armPivot = new THREE.Group();
        armPivot.position.set(side * 0.62, 1.72, 0);

        const shoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 16), suitRole);
        armPivot.add(shoulderJoint);

        const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.13, 0.56, 16), suitWhite);
        upperArm.position.y = -0.32;
        armPivot.add(upperArm);

        const glove = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), suitRole);
        glove.position.y = -0.66;
        glove.scale.set(0.95, 1.2, 1.05);
        armPivot.add(glove);

        group.add(armPivot);
        return armPivot;
    }

    const leftArm = makeArm(-1);
    const rightArm = makeArm(1);

    function makeLeg(side) {
        const legPivot = new THREE.Group();
        legPivot.position.set(side * 0.24, 0.84, 0);

        const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.56, 16), suitWhite);
        thigh.position.y = -0.3;
        legPivot.add(thigh);

        const boot = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.44), bootDark);
        boot.position.set(0, -0.7, 0.06);
        legPivot.add(boot);

        group.add(legPivot);
        return legPivot;
    }

    const leftLeg = makeLeg(-1);
    const rightLeg = makeLeg(1);

    if (labelInfo) {
        const tag = createPlayerNameTag(labelInfo.name, labelInfo.roleShort, labelInfo.colorCss);
        group.add(tag);
    }

    return { group, leftLeg, rightLeg, leftArm, rightArm };
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