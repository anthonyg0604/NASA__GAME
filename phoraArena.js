let arScene, arCamera, arRenderer, arAnimId;
let arenaStage = 'flight'; // 'flight' | 'planet' | 'return_flight'
let shipMesh, targetPlanetObj;
let asteroids = [];
let baseWallTasks = [];
let baseWallColliders = [];
let activePlanetTask = null;
let isTaskModalOpen = false;
let planetAstroRig, skyCompanionPlanet, reactorRing1, reactorRing2, medbayScanner;
let planetAstroVelY = 0;
let planetAstroGrounded = true;
let remoteBaseAstros = {};
let arKeys = {};
let planetCamYaw = 0;
let planetIsDragging = false;
let planetPrevMouseX = 0;

let shield = 100;
let flightProgress = 0;
let oxygen = 130;
let maxOxygen = 130;
let completedTasksCount = 0;
let lastFrameTime = 0;

function start3DSpaceAndPlanetGame() {
    const container = document.getElementById('arena-webgl-container');
    container.innerHTML = '';
    remoteBaseAstros = {};

    arScene = new THREE.Scene();
    arScene.background = new THREE.Color(0x030712);

    arCamera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 220);
    arRenderer = new THREE.WebGLRenderer({ antialias: true });
    arRenderer.setSize(container.clientWidth, container.clientHeight);
    arRenderer.shadowMap.enabled = true;
    container.appendChild(arRenderer.domElement);

    const stats = GAME_STATE.getShipTotalStats();
    shield = 100 + stats.shieldBonus;
    maxOxygen = 130 + stats.o2Bonus;
    oxygen = maxOxygen;
    flightProgress = 0;
    completedTasksCount = 0;
    arenaStage = 'flight';
    isTaskModalOpen = false;
    activePlanetTask = null;
    planetAstroVelY = 0;
    planetAstroGrounded = true;
    planetCamYaw = 0;

    document.getElementById('arena-role-badge').innerText = `ROL: ${GAME_STATE.selectedRole.short.toUpperCase()}`;
    document.getElementById('samples-counter').innerText = `📋 Tareas: 0 / 3`;
    document.getElementById('arena-phase-title').innerText = `🚀 Rumbo a ${GAME_STATE.selectedMission.name}`;
    document.getElementById('arena-hint').innerHTML = `Usa <b>W A S D</b> o <b>Flechas</b> para pilotar tu nave personalizada y esquivar meteoritos`;
    document.getElementById('arena-interact-prompt').classList.add('hidden');

    setupSpaceFlightStage(GAME_STATE.selectedMission.id);

    window.addEventListener('keydown', handleArenaKeyDown);
    window.addEventListener('keyup', handleArenaKeyUp);

    container.onmousedown = e => {
        if (e.button !== 0 || arenaStage !== 'planet') return;
        planetIsDragging = true;
        planetPrevMouseX = e.clientX;
    };
    window.addEventListener('mouseup', () => { planetIsDragging = false; });
    window.addEventListener('mousemove', e => {
        if (!planetIsDragging || arenaStage !== 'planet') return;
        const deltaX = e.clientX - planetPrevMouseX;
        planetPrevMouseX = e.clientX;
        planetCamYaw -= deltaX * 0.006;
    });

    document.getElementById('abort-mission-btn').onclick = () => returnToHub(false);
    document.getElementById('arena-interact-prompt').onclick = () => {
        if (activePlanetTask && !activePlanetTask.completed) openPlanetTaskModal(activePlanetTask);
    };
    document.getElementById('close-task-modal-btn').onclick = closePlanetTaskModal;

    lastFrameTime = performance.now();
    animateArena();
}

function handleArenaKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return;
    }
    const isArenaHidden = document.getElementById('arena-container').classList.contains('hidden');
    if (isArenaHidden) return;

    const key = e.key.toLowerCase();
    arKeys[key] = true;

    if (e.code === 'Space' && arenaStage === 'planet' && !isTaskModalOpen) {
        e.preventDefault();
        if (planetAstroGrounded) {
            planetAstroVelY = 0.24;
            planetAstroGrounded = false;
        }
    }

    if (key === 'e' && arenaStage === 'planet' && activePlanetTask && !activePlanetTask.completed && !isTaskModalOpen) {
        openPlanetTaskModal(activePlanetTask);
    }
    if (key === 'escape' && isTaskModalOpen) {
        closePlanetTaskModal();
    }
}

function handleArenaKeyUp(e) {
    arKeys[e.key.toLowerCase()] = false;
}

// Configura el viaje espacial tanto de IDA al planeta como de REGRESO A LA TIERRA
function setupSpaceFlightStage(destinationPlanetId) {
    clearArenaScene();
    flightProgress = 0;

    arScene.background = new THREE.Color(0x030712);
    arScene.fog = new THREE.Fog(0x030712, 35, 120);

    arScene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const sun = new THREE.DirectionalLight(0xffffff, 1.25);
    sun.position.set(12, 16, 12);
    arScene.add(sun);

    arCamera.position.set(0, 2.3, 8.2);
    arCamera.lookAt(0, 0, -10);

    shipMesh = buildCustom3DRocket(true);
    shipMesh.rotation.x = -Math.PI / 2;
    arScene.add(shipMesh);

    targetPlanetObj = createHDPlanet(destinationPlanetId, destinationPlanetId === 'earth' ? 14.5 : 13);
    targetPlanetObj.group.position.set(0, 3.5, -105);
    arScene.add(targetPlanetObj.group);

    const starGeo = new THREE.BufferGeometry();
    const verts = [];
    for (let i = 0; i < 650; i++) {
        verts.push((Math.random() - 0.5) * 75, (Math.random() - 0.5) * 55, -Math.random() * 115);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    arScene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.25 })));

    asteroids = [];
    const count = destinationPlanetId === 'earth' ? 8 : GAME_STATE.selectedMission.asteroidCount;
    for (let i = 0; i < count; i++) {
        const rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(Math.random() * 0.75 + 0.65, 1),
            new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 })
        );
        resetAsteroid(rock, -25 - i * 9);
        arScene.add(rock);
        asteroids.push(rock);
    }
}

function resetAsteroid(rock, zPos) {
    rock.position.set((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 10, zPos);
    rock.userData.speed = 0.44 + Math.random() * 0.24;
}

function updateSpaceFlight(dt, isReturnTrip) {
    const stats = GAME_STATE.getShipTotalStats();
    const speed = 0.19 * stats.speedMult;
    if (arKeys['a'] || arKeys['arrowleft']) shipMesh.position.x -= speed;
    if (arKeys['d'] || arKeys['arrowright']) shipMesh.position.x += speed;
    if (arKeys['w'] || arKeys['arrowup']) shipMesh.position.y += speed;
    if (arKeys['s'] || arKeys['arrowdown']) shipMesh.position.y -= speed;

    shipMesh.position.x = Math.max(-8.5, Math.min(8.5, shipMesh.position.x));
    shipMesh.position.y = Math.max(-4.5, Math.min(4.5, shipMesh.position.y));
    shipMesh.rotation.z = -shipMesh.position.x * 0.08;

    animateRocketExhaust(shipMesh, dt);

    flightProgress += isReturnTrip ? 0.22 : 0.18;
    targetPlanetObj.group.position.z = -105 + flightProgress * 0.82;
    targetPlanetObj.sphere.rotation.y += 0.005;

    asteroids.forEach(rock => {
        rock.position.z += rock.userData.speed;
        rock.rotation.x += 0.03;
        rock.rotation.y += 0.02;

        if (rock.position.z > 8) {
            resetAsteroid(rock, -80);
        }

        if (rock.position.distanceTo(shipMesh.position) < 1.55) {
            shield = isReturnTrip ? Math.max(15, shield - 15) : shield - 20;
            resetAsteroid(rock, -85);
            document.getElementById('arena-container').classList.add('shaking');
            setTimeout(() => document.getElementById('arena-container').classList.remove('shaking'), 250);
        }
    });

    const maxShield = 100 + stats.shieldBonus;
    const shieldPct = Math.max(0, Math.round((shield / maxShield) * 100));
    document.getElementById('primary-bar-label').innerText = `🛡️ Escudo Nave: ${Math.max(0, Math.round(shield))}%`;
    document.getElementById('primary-bar-fill').style.width = `${Math.min(100, shieldPct)}%`;
    document.getElementById('primary-bar-fill').className = 'progress-fill cyan';

    const progPct = Math.min(100, Math.round(flightProgress));
    document.getElementById('secondary-bar-label').innerText = isReturnTrip
        ? `🌍 Regreso a la Tierra: ${progPct}%`
        : `🪐 Progreso al Planeta: ${progPct}%`;
    document.getElementById('secondary-bar-fill').style.width = `${progPct}%`;
    document.getElementById('secondary-bar-fill').className = isReturnTrip ? 'progress-fill green' : 'progress-fill amber';

    if (!isReturnTrip && shield <= 0) {
        showMissionReport(false, 'Tu escudo fue destruido por los meteoritos antes de aterrizar.', 0);
    } else if (flightProgress >= 100) {
        if (!isReturnTrip) {
            setupPlanetaryBaseStage();
        } else {
            // Aterrizaje exitoso de regreso en la Tierra
            GAME_STATE.currentOrbitId = 'earth';
            const earned = GAME_STATE.selectedMission.rewardCredits + Math.max(0, Math.round(shield));
            GAME_STATE.credits += earned;
            GAME_STATE.saveProgress();
            updateCreditsHUD();
            showMissionReport(
                true,
                `¡Aterrizaje exitoso en la Tierra, ${GAME_STATE.selectedRole.short}! Completaste las 3 operaciones en ${GAME_STATE.selectedMission.name} y trajiste la nave a salvo.`,
                earned
            );
        }
    }
}

function createWallMonitorTexture(title, subtitle, borderColor, isCompleted) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = isCompleted ? '#064e3b' : '#091526';
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = isCompleted ? '#10b981' : borderColor;
    ctx.lineWidth = 14;
    ctx.strokeRect(10, 10, 492, 236);

    ctx.fillStyle = isCompleted ? '#34d399' : borderColor;
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(isCompleted ? '✓ OPERACIÓN COMPLETADA' : '⚡ TERMINAL ACTIVA [E]', 32, 65);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(title, 32, 138);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '24px sans-serif';
    ctx.fillText(subtitle, 32, 195);

    return new THREE.CanvasTexture(canvas);
}

// Textura metálica industrial con rejillas y remaches para el piso 3D de la base
function createIndustrialFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 504, 504);

    ctx.fillStyle = '#374151';
    for (let x = 32; x < 512; x += 64) {
        for (let y = 32; y < 512; y += 64) {
            ctx.fillRect(x, y, 24, 6);
        }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    return tex;
}

// Base planetaria 3D realista estilo Among Us + iluminación dramática Gamble With Your Friends en 3.ª persona
function setupPlanetaryBaseStage() {
    arenaStage = 'planet';
    clearArenaScene();
    baseWallColliders = [];
    baseWallTasks = [];
    remoteBaseAstros = {};

    const mission = GAME_STATE.selectedMission;
    arScene.background = new THREE.Color(mission.skyColor);
    arScene.fog = new THREE.FogExp2(0x070d1a, 0.022);

    // Iluminación ambiental tenue para resaltar focos cálidos y luces de cada sala
    arScene.add(new THREE.AmbientLight(0x64748b, 0.55));

    // Terreno exterior del planeta visible desde los ventanales
    const outerTerrain = new THREE.Mesh(
        new THREE.PlaneGeometry(130, 130),
        new THREE.MeshStandardMaterial({ color: mission.groundColor, roughness: 0.9 })
    );
    outerTerrain.rotation.x = -Math.PI / 2;
    outerTerrain.position.y = -0.06;
    arScene.add(outerTerrain);

    for (let i = 0; i < 28; i++) {
        const ang = (i / 28) * Math.PI * 2;
        const dist = 36 + Math.random() * 10;
        const mtn = new THREE.Mesh(
            new THREE.ConeGeometry(5 + Math.random() * 3, 7 + Math.random() * 6, 6),
            new THREE.MeshStandardMaterial({ color: mission.groundColor, roughness: 0.95 })
        );
        mtn.position.set(Math.cos(ang) * dist, 3.0, Math.sin(ang) * dist);
        arScene.add(mtn);
    }

    const skyPlanetId = mission.id === 'moon' ? 'earth' : (mission.id === 'europa' ? 'mars' : 'moon');
    skyCompanionPlanet = createHDPlanet(skyPlanetId, 11);
    skyCompanionPlanet.group.position.set(-20, 22, -62);
    arScene.add(skyCompanionPlanet.group);

    // Nave personalizada estacionada afuera de la bahía Sur
    const dockedRocket = buildCustom3DRocket(false);
    dockedRocket.position.set(0, 1.85, 24);
    arScene.add(dockedRocket);

    // Piso metálico industrial con relieve
    const floorTex = createIndustrialFloorTexture();
    const baseFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(31, 31),
        new THREE.MeshStandardMaterial({ map: floorTex, bumpMap: floorTex, bumpScale: 0.06, roughness: 0.45, metalness: 0.35 })
    );
    baseFloor.rotation.x = -Math.PI / 2;
    baseFloor.receiveShadow = true;
    arScene.add(baseFloor);

    // Vigas industriales en el techo para sensación 3D real en tercera persona
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.5 });
    [-11, -4.5, 4.5, 11].forEach(pos => {
        const beamX = new THREE.Mesh(new THREE.BoxGeometry(31, 0.35, 0.45), beamMat);
        beamX.position.set(0, 4.3, pos);
        arScene.add(beamX);

        const beamZ = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 31), beamMat);
        beamZ.position.set(pos, 4.3, 0);
        arScene.add(beamZ);
    });

    // 1. SALA CENTRAL DE REUNIONES (Estilo Cafetería Among Us + Mesa iluminada Gamble With Your Friends)
    const tableSpotlight = new THREE.PointLight(0xfde68a, 1.8, 16);
    tableSpotlight.position.set(0, 3.8, 0);
    arScene.add(tableSpotlight);

    const lampShade = new THREE.Mesh(
        new THREE.ConeGeometry(0.65, 0.45, 20),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, emissive: 0xf59e0b, emissiveIntensity: 0.3 })
    );
    lampShade.position.set(0, 4.1, 0);
    arScene.add(lampShade);

    const meetingTable = new THREE.Mesh(
        new THREE.CylinderGeometry(2.15, 1.95, 0.92, 32),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.4 })
    );
    meetingTable.position.y = 0.46;
    arScene.add(meetingTable);

    const tableTopHolo = new THREE.Mesh(
        new THREE.CylinderGeometry(1.75, 1.75, 0.05, 32),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.65 })
    );
    tableTopHolo.position.y = 0.94;
    arScene.add(tableTopHolo);

    // Aro verde exterior alrededor de la mesa central (zona de recarga de O2 y despegue de regreso)
    const lifeSupportPad = new THREE.Mesh(
        new THREE.RingGeometry(3.0, 3.55, 48),
        new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
    );
    lifeSupportPad.rotation.x = -Math.PI / 2;
    lifeSupportPad.position.y = 0.03;
    arScene.add(lifeSupportPad);

    // 4 asientos alrededor de la mesa central
    for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2 + Math.PI / 4;
        const stool = new THREE.Mesh(
            new THREE.CylinderGeometry(0.38, 0.32, 0.55, 16),
            new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 })
        );
        stool.position.set(Math.cos(ang) * 2.55, 0.28, Math.sin(ang) * 2.55);
        arScene.add(stool);
    }

    baseWallColliders.push({ minX: -2.2, maxX: 2.2, minZ: -2.2, maxZ: 2.2 });

    // 2. ALA OESTE: SALA DEL REACTOR (Núcleo giratorio estilo Reactor Among Us)
    const reactorLight = new THREE.PointLight(0x38bdf8, 1.7, 14);
    reactorLight.position.set(-10.5, 2.8, 0);
    arScene.add(reactorLight);

    const reactorCore = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 0.9, 3.8, 24),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.85 })
    );
    reactorCore.position.set(-10.8, 1.9, 0);
    arScene.add(reactorCore);

    reactorRing1 = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.1, 12, 32), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    reactorRing1.position.set(-10.8, 1.9, 0);
    arScene.add(reactorRing1);

    reactorRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.08, 12, 32), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    reactorRing2.position.set(-10.8, 1.9, 0);
    reactorRing2.rotation.x = Math.PI / 2;
    arScene.add(reactorRing2);

    baseWallColliders.push({ minX: -12.1, maxX: -9.5, minZ: -1.3, maxZ: 1.3 });

    // 3. ALA ESTE: LABORATORIO MEDBAY (Escáner y cilindros de muestras brillantes)
    const labLight = new THREE.PointLight(0x10b981, 1.6, 14);
    labLight.position.set(10.5, 2.8, 0);
    arScene.add(labLight);

    medbayScanner = new THREE.Mesh(
        new THREE.CylinderGeometry(1.3, 1.4, 0.18, 24),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.7 })
    );
    medbayScanner.position.set(10.5, 0.09, 0);
    arScene.add(medbayScanner);

    [-4.2, 4.2].forEach(zTube => {
        const tube = new THREE.Mesh(
            new THREE.CylinderGeometry(0.55, 0.55, 2.8, 20),
            new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x059669, emissiveIntensity: 0.45, transparent: true, opacity: 0.65 })
        );
        tube.position.set(11.5, 1.4, zTube);
        arScene.add(tube);
        baseWallColliders.push({ minX: 10.7, maxX: 12.3, minZ: zTube - 0.8, maxZ: zTube + 0.8 });
    });

    // 4. ALA SUR: COMUNICACIONES Y CAJAS DE CARGA
    const commsLight = new THREE.PointLight(0xa855f7, 1.5, 14);
    commsLight.position.set(0, 2.8, 10.5);
    arScene.add(commsLight);

    [[-5.2, 11.2], [5.2, 11.2]].forEach(([cx, cz]) => {
        const crate = new THREE.Mesh(
            new THREE.BoxGeometry(1.3, 1.3, 1.3),
            new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.4 })
        );
        crate.position.set(cx, 0.65, cz);
        arScene.add(crate);
        baseWallColliders.push({ minX: cx - 0.9, maxX: cx + 0.9, minZ: cz - 0.9, maxZ: cz + 0.9 });
    });

    // Paredes exteriores con ventanales panorámicos reforzados
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.24, roughness: 0.08 });

    const wallSegments = [
        { x: 0, z: -15.4, w: 13, d: 0.7, h: 4.2, glass: false },
        { x: 0, z: 15.4, w: 13, d: 0.7, h: 4.2, glass: false },
        { x: -15.4, z: 0, w: 0.7, d: 13, h: 4.2, glass: false },
        { x: 15.4, z: 0, w: 0.7, d: 13, h: 4.2, glass: false },
        { x: -10.8, z: -15.4, w: 8.6, d: 0.4, h: 3.8, glass: true },
        { x: 10.8, z: -15.4, w: 8.6, d: 0.4, h: 3.8, glass: true },
        { x: -10.8, z: 15.4, w: 8.6, d: 0.4, h: 3.8, glass: true },
        { x: 10.8, z: 15.4, w: 8.6, d: 0.4, h: 3.8, glass: true },
        { x: -15.4, z: -10.8, w: 0.4, d: 8.6, h: 3.8, glass: true },
        { x: -15.4, z: 10.8, w: 0.4, d: 8.6, h: 3.8, glass: true },
        { x: 15.4, z: -10.8, w: 0.4, d: 8.6, h: 3.8, glass: true },
        { x: 15.4, z: 10.8, w: 0.4, d: 8.6, h: 3.8, glass: true }
    ];

    wallSegments.forEach(ws => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(ws.w, ws.h, ws.d), ws.glass ? glassMat : wallMat);
        mesh.position.set(ws.x, ws.h / 2, ws.z);
        arScene.add(mesh);

        if (!ws.glass) {
            const neonTop = new THREE.Mesh(
                new THREE.BoxGeometry(ws.w + 0.1, 0.14, ws.d + 0.1),
                new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
            );
            neonTop.position.set(ws.x, ws.h, ws.z);
            arScene.add(neonTop);
        }
    });

    // Mamparos interiores con puertas estilo nave espacial Among Us
    const interiorDividers = [
        { x: -5.2, z: -6.4, w: 4.2, d: 0.55 },
        { x: 5.2, z: -6.4, w: 4.2, d: 0.55 },
        { x: -5.2, z: 6.4, w: 4.2, d: 0.55 },
        { x: 5.2, z: 6.4, w: 4.2, d: 0.55 },
        { x: -6.4, z: -4.8, w: 0.55, d: 3.4 },
        { x: -6.4, z: 4.8, w: 0.55, d: 3.4 },
        { x: 6.4, z: -4.8, w: 0.55, d: 3.4 },
        { x: 6.4, z: 4.8, w: 0.55, d: 3.4 }
    ];

    interiorDividers.forEach(div => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(div.w, 3.6, div.d), wallMat);
        wall.position.set(div.x, 1.8, div.z);
        arScene.add(wall);

        const trim = new THREE.Mesh(
            new THREE.BoxGeometry(div.w + 0.08, 0.12, div.d + 0.08),
            new THREE.MeshBasicMaterial({ color: 0x0ea5e9 })
        );
        trim.position.set(div.x, 3.62, div.z);
        arScene.add(trim);

        baseWallColliders.push({
            minX: div.x - div.w / 2 - 0.55,
            maxX: div.x + div.w / 2 + 0.55,
            minZ: div.z - div.d / 2 - 0.55,
            maxZ: div.z + div.d / 2 + 0.55
        });
    });

    // Terminales 3D de misión en las paredes de cada sector
    GAME_DATA.roles.forEach(role => {
        const isMyRole = role.id === GAME_STATE.selectedRole.id;

        role.tasks.forEach(taskSpec => {
            const panelGroup = new THREE.Group();
            panelGroup.position.set(taskSpec.x, 1.9, taskSpec.z);
            panelGroup.rotation.y = taskSpec.rotY;

            const consoleBase = new THREE.Mesh(
                new THREE.BoxGeometry(2.6, 1.1, 0.65),
                new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
            );
            consoleBase.position.set(0, -1.35, 0.25);
            panelGroup.add(consoleBase);

            const screenTex = isMyRole
                ? createWallMonitorTexture(taskSpec.wallLabel, 'Presiona [E] para operar', role.colorCss, false)
                : createWallMonitorTexture(taskSpec.wallLabel, `Sector: ${role.short}`, '#475569', false);

            const screenMesh = new THREE.Mesh(
                new THREE.BoxGeometry(2.4, 1.25, 0.16),
                new THREE.MeshBasicMaterial({ map: screenTex })
            );
            panelGroup.add(screenMesh);

            const barMat = new THREE.MeshBasicMaterial({ color: isMyRole ? role.colorHex : 0x334155 });
            const leftTube = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.2, 0.2), barMat);
            leftTube.position.set(-1.38, -0.1, 0.05);
            panelGroup.add(leftTube);

            const rightTube = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.2, 0.2), barMat);
            rightTube.position.set(1.38, -0.1, 0.05);
            panelGroup.add(rightTube);

            arScene.add(panelGroup);

            if (isMyRole) {
                const forward = new THREE.Vector3(0, 0, 1.75).applyAxisAngle(new THREE.Vector3(0, 1, 0), taskSpec.rotY);
                const floorSpot = new THREE.Vector3(taskSpec.x, 0.03, taskSpec.z).add(forward);

                const ring = new THREE.Mesh(
                    new THREE.RingGeometry(0.8, 1.08, 32),
                    new THREE.MeshBasicMaterial({ color: role.colorHex, side: THREE.DoubleSide })
                );
                ring.rotation.x = -Math.PI / 2;
                ring.position.copy(floorSpot);
                arScene.add(ring);

                const wallGlow = new THREE.PointLight(role.colorHex, 1.5, 8);
                wallGlow.position.set(floorSpot.x, 2.3, floorSpot.z);
                arScene.add(wallGlow);

                baseWallTasks.push({
                    ...taskSpec,
                    roleColor: role.colorCss,
                    completed: false,
                    interactPos: floorSpot,
                    screenMesh,
                    leftTube,
                    rightTube,
                    ringMesh: ring,
                    light: wallGlow
                });
            }
        });
    });

    const myRole = GAME_STATE.selectedRole;
    const myChar = GAME_DATA.characters.find(c => c.id === GAME_STATE.selectedCharacterId) || GAME_DATA.characters[0];
    planetAstroRig = createBackyardiganCharacter(myChar.id, {
        name: MP.myName,
        charName: myChar.shortName,
        roleShort: myRole.short,
        colorCss: myRole.colorCss
    });
    planetAstroRig.group.position.set(0, 0, 4.2);
    arScene.add(planetAstroRig.group);

    document.getElementById('arena-phase-title').innerText = `🏢 Base en ${mission.name}`;
    document.getElementById('arena-hint').innerHTML = `Completa las 3 terminales <b style="color:${myRole.colorCss};">${myRole.short}</b> • <b>[E]</b> Operar • <b>[Espacio]</b> Saltar • <b>Clic+Arrastrar</b> Cámara`;
    document.getElementById('primary-bar-fill').className = 'progress-fill green';
    document.getElementById('secondary-bar-fill').className = 'progress-fill cyan';
}

function syncRemoteBaseAstronauts(time, dt) {
    MP.updateBots(dt, 7.5);

    const activeIds = new Set();
    Object.values(MP.players).forEach(p => {
        if (p.id === MP.myId) return;
        activeIds.add(p.id);

        const charId = p.characterId || 'pablo';
        if (!remoteBaseAstros[p.id] || remoteBaseAstros[p.id].charId !== charId || remoteBaseAstros[p.id].name !== p.name) {
            if (remoteBaseAstros[p.id]) {
                arScene.remove(remoteBaseAstros[p.id].rig.group);
            }
            const role = GAME_DATA.roles.find(r => r.id === p.roleId) || GAME_DATA.roles[0];
            const char = GAME_DATA.characters.find(c => c.id === charId) || GAME_DATA.characters[0];
            const rig = createBackyardiganCharacter(charId, {
                name: p.name,
                charName: char.shortName,
                roleShort: role.short,
                colorCss: role.colorCss
            });
            rig.group.position.set(p.x || 0, p.y || 0, p.z || 4.0);
            arScene.add(rig.group);
            remoteBaseAstros[p.id] = { rig, charId, name: p.name };
        }

        const rig = remoteBaseAstros[p.id].rig;
        rig.group.position.x += (p.x - rig.group.position.x) * 0.2;
        rig.group.position.y += ((p.y || 0) - rig.group.position.y) * 0.25;
        rig.group.position.z += (p.z - rig.group.position.z) * 0.2;
        resolveBaseWallCollisions(rig.group.position);
        rig.group.rotation.y = p.rotY || 0;

        if (rig.propellerMesh) rig.propellerMesh.rotation.y += 0.25;

        if ((p.y || 0) > 0.1) {
            rig.leftArm.rotation.x = -0.6;
            rig.rightArm.rotation.x = -0.6;
        } else if (p.moving) {
            const swing = Math.sin(time * 11) * 0.5;
            rig.leftLeg.rotation.x = swing;
            rig.rightLeg.rotation.x = -swing;
            rig.leftArm.rotation.x = -swing;
            rig.rightArm.rotation.x = swing;
        } else {
            rig.leftLeg.rotation.x = 0;
            rig.rightLeg.rotation.x = 0;
            rig.leftArm.rotation.x = 0;
            rig.rightArm.rotation.x = 0;
        }
    });

    Object.keys(remoteBaseAstros).forEach(id => {
        if (!activeIds.has(id)) {
            arScene.remove(remoteBaseAstros[id].rig.group);
            delete remoteBaseAstros[id];
        }
    });
}

function resolveBaseWallCollisions(pos) {
    pos.x = Math.max(-14.0, Math.min(14.0, pos.x));
    pos.z = Math.max(-14.0, Math.min(14.0, pos.z));

    baseWallColliders.forEach(box => {
        if (pos.x > box.minX && pos.x < box.maxX && pos.z > box.minZ && pos.z < box.maxZ) {
            const penLeft = Math.abs(pos.x - box.minX);
            const penRight = Math.abs(box.maxX - pos.x);
            const penTop = Math.abs(pos.z - box.minZ);
            const penBottom = Math.abs(box.maxZ - pos.z);
            const minPen = Math.min(penLeft, penRight, penTop, penBottom);

            if (minPen === penLeft) pos.x = box.minX;
            else if (minPen === penRight) pos.x = box.maxX;
            else if (minPen === penTop) pos.z = box.minZ;
            else pos.z = box.maxZ;
        }
    });
}

function updatePlanetExploration(time, dt) {
    if (skyCompanionPlanet && skyCompanionPlanet.sphere) {
        skyCompanionPlanet.sphere.rotation.y += 0.002;
    }
    if (reactorRing1) {
        reactorRing1.rotation.x += dt * 1.4;
        reactorRing1.rotation.y += dt * 1.1;
    }
    if (reactorRing2) {
        reactorRing2.rotation.y -= dt * 1.6;
    }
    if (medbayScanner) {
        medbayScanner.scale.setScalar(1 + Math.sin(time * 4) * 0.06);
    }

    syncRemoteBaseAstronauts(time, dt);
    const astro = planetAstroRig.group;

    if (planetAstroRig.propellerMesh) {
        planetAstroRig.propellerMesh.rotation.y += 0.25;
    }

    if (!isTaskModalOpen) {
        const isRunning = arKeys['shift'];
        const moveSpeed = isRunning ? 0.18 : 0.12;
        let forwardInput = 0, strafeInput = 0;
        if (arKeys['w'] || arKeys['arrowup']) forwardInput -= 1;
        if (arKeys['s'] || arKeys['arrowdown']) forwardInput += 1;
        if (arKeys['a'] || arKeys['arrowleft']) strafeInput -= 1;
        if (arKeys['d'] || arKeys['arrowright']) strafeInput += 1;

        const isMoving = forwardInput !== 0 || strafeInput !== 0;

        if (isMoving) {
            // Movimiento relativo al ángulo de la cámara 3D
            const moveAngle = Math.atan2(strafeInput, forwardInput) + planetCamYaw;
            astro.rotation.y = moveAngle;
            astro.position.x += Math.sin(moveAngle) * moveSpeed;
            astro.position.z += Math.cos(moveAngle) * moveSpeed;

            resolveBaseWallCollisions(astro.position);
        }

        astro.position.y += planetAstroVelY;
        if (!planetAstroGrounded) {
            planetAstroVelY -= 0.010;
            if (astro.position.y <= 0) {
                astro.position.y = 0;
                planetAstroVelY = 0;
                planetAstroGrounded = true;
            }
        }

        if (!planetAstroGrounded) {
            planetAstroRig.leftArm.rotation.x = -0.65;
            planetAstroRig.rightArm.rotation.x = -0.65;
            planetAstroRig.leftLeg.rotation.x = 0.25;
            planetAstroRig.rightLeg.rotation.x = -0.25;
        } else if (isMoving) {
            const swing = Math.sin(time * (isRunning ? 16 : 11)) * 0.55;
            planetAstroRig.leftLeg.rotation.x = swing;
            planetAstroRig.rightLeg.rotation.x = -swing;
            planetAstroRig.leftArm.rotation.x = -swing;
            planetAstroRig.rightArm.rotation.x = swing;
        } else {
            planetAstroRig.leftLeg.rotation.x = 0;
            planetAstroRig.rightLeg.rotation.x = 0;
            planetAstroRig.leftArm.rotation.x = 0;
            planetAstroRig.rightArm.rotation.x = 0;
        }

        MP.sendMyPosition(astro.position.x, astro.position.y, astro.position.z, astro.rotation.y, isMoving);
    }

    // Cámara inmersiva en 3.ª persona detrás del personaje dentro de la estación
    const camDist = 6.6;
    const desiredCamX = astro.position.x + Math.sin(planetCamYaw) * camDist;
    const desiredCamY = 4.3 + astro.position.y * 0.65;
    const desiredCamZ = astro.position.z + Math.cos(planetCamYaw) * camDist;

    arCamera.position.x += (desiredCamX - arCamera.position.x) * 0.14;
    arCamera.position.y += (desiredCamY - arCamera.position.y) * 0.14;
    arCamera.position.z += (desiredCamZ - arCamera.position.z) * 0.14;
    arCamera.lookAt(
        astro.position.x - Math.sin(planetCamYaw) * 1.5,
        1.75 + astro.position.y * 0.7,
        astro.position.z - Math.cos(planetCamYaw) * 1.5
    );

    const distToCore = Math.hypot(astro.position.x, astro.position.z);
    if (distToCore <= 3.65) {
        oxygen = Math.min(maxOxygen, oxygen + dt * 20);
    } else if (!isTaskModalOpen) {
        oxygen -= dt * 0.85;
    }

    let nearbyTask = null;
    baseWallTasks.forEach((t, idx) => {
        if (!t.completed) {
            t.ringMesh.scale.setScalar(1 + Math.sin(time * 4 + idx) * 0.08);
            if (Math.hypot(astro.position.x - t.interactPos.x, astro.position.z - t.interactPos.z) < 2.2) {
                nearbyTask = t;
            }
        }
    });

    activePlanetTask = nearbyTask;
    const promptBtn = document.getElementById('arena-interact-prompt');
    if (activePlanetTask && !isTaskModalOpen) {
        document.getElementById('arena-task-name').innerText = activePlanetTask.title;
        promptBtn.classList.remove('hidden');
    } else {
        promptBtn.classList.add('hidden');
    }

    const o2Pct = Math.max(0, Math.round((oxygen / maxOxygen) * 100));
    document.getElementById('primary-bar-label').innerText = distToCore <= 3.65
        ? `🟢 Mesa Central (O₂ Recargando): ${o2Pct}%`
        : `🫁 Oxígeno Traje: ${o2Pct}%`;
    document.getElementById('primary-bar-fill').style.width = `${o2Pct}%`;
    document.getElementById('primary-bar-fill').className = o2Pct < 25 ? 'progress-fill red' : 'progress-fill green';

    const missionPct = Math.round((completedTasksCount / 3) * 100);
    document.getElementById('secondary-bar-label').innerText = completedTasksCount === 3
        ? `🚀 ¡Vuelve a la Mesa Central Verde!`
        : `📋 Tareas de ${GAME_STATE.selectedRole.short}: ${completedTasksCount}/3`;
    document.getElementById('secondary-bar-fill').style.width = `${missionPct}%`;

    if (oxygen <= 0) {
        showMissionReport(false, 'Te quedaste sin oxígeno en los sectores exteriores de la base.', 0);
    } else if (completedTasksCount === 3 && distToCore <= 3.65) {
        // Iniciar viaje espacial de regreso hacia el Planeta Tierra
        arenaStage = 'return_flight';
        promptBtn.classList.add('hidden');
        document.getElementById('arena-phase-title').innerText = `🌍 Regresando al Planeta Tierra`;
        document.getElementById('arena-hint').innerHTML = `¡Misión cumplida! Pilota tu nave de <b>regreso a la Tierra</b> (<b>W A S D</b> / <b>Flechas</b>)`;
        document.getElementById('arena-container').classList.add('shaking');
        setTimeout(() => document.getElementById('arena-container').classList.remove('shaking'), 900);
        setupSpaceFlightStage('earth');
    }
}

let activeMinigameAnim = null;

function openPlanetTaskModal(task) {
    isTaskModalOpen = true;
    const modal = document.getElementById('planet-task-modal');
    const title = document.getElementById('task-modal-title');
    const body = document.getElementById('task-modal-body');
    title.innerText = `🖥️ ${task.title}`;

    if (task.type === 'timing') {
        body.innerHTML = `
            <div class="minigame-box">
                <p style="color:#cbd5e1;">Detén el indicador luminoso justo dentro de la <strong>franja verde central</strong>:</p>
                <div class="drill-meter">
                    <div class="drill-target-zone"></div>
                    <div id="drill-cursor" class="drill-cursor" style="left:0%;"></div>
                </div>
                <p id="drill-feedback" style="color:#38bdf8; min-height:22px; font-weight:600;"></p>
                <button id="drill-stop-btn" class="btn-primary">⚡ BLOQUEAR CALIBRACIÓN</button>
            </div>
        `;
        let pos = 0;
        let dir = 1;
        const cursor = document.getElementById('drill-cursor');
        function moveCursor() {
            pos += dir * 1.45;
            if (pos >= 96) { pos = 96; dir = -1; }
            if (pos <= 0) { pos = 0; dir = 1; }
            cursor.style.left = `${pos}%`;
            activeMinigameAnim = requestAnimationFrame(moveCursor);
        }
        activeMinigameAnim = requestAnimationFrame(moveCursor);

        document.getElementById('drill-stop-btn').onclick = () => {
            if (pos >= 34 && pos <= 64) {
                cancelAnimationFrame(activeMinigameAnim);
                completePlanetTask(task);
            } else {
                document.getElementById('drill-feedback').innerText = '⚠️ Fuera de zona verde, ¡intenta de nuevo!';
            }
        };

    } else if (task.type === 'wires') {
        const colors = [
            { id: 'cyan', label: 'Línea Alfa (Cian)', hex: '#0284c7' },
            { id: 'amber', label: 'Línea Beta (Ámbar)', hex: '#d97706' },
            { id: 'green', label: 'Línea Gamma (Verde)', hex: '#059669' }
        ];
        const rightOrder = [colors[2], colors[0], colors[1]];
        let selectedLeft = null;
        let connectedCount = 0;

        body.innerHTML = `
            <div class="minigame-box">
                <p style="color:#cbd5e1;">Une cada terminal de la izquierda con su par del mismo color a la derecha:</p>
                <div class="wire-grid">
                    <div class="wire-col" id="wire-left">
                        ${colors.map(c => `<button class="wire-node" data-id="${c.id}" style="background:${c.hex};">${c.label}</button>`).join('')}
                    </div>
                    <div class="wire-col" id="wire-right">
                        ${rightOrder.map(c => `<button class="wire-node" data-id="${c.id}" style="background:${c.hex};">${c.label}</button>`).join('')}
                    </div>
                </div>
                <p id="wire-status" style="color:#38bdf8; font-weight:600;">Conexiones: 0 / 3</p>
            </div>
        `;

        document.querySelectorAll('#wire-left .wire-node').forEach(btn => {
            btn.onclick = () => {
                if (btn.classList.contains('connected')) return;
                document.querySelectorAll('#wire-left .wire-node').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedLeft = btn;
            };
        });

        document.querySelectorAll('#wire-right .wire-node').forEach(btn => {
            btn.onclick = () => {
                if (!selectedLeft || btn.classList.contains('connected')) return;
                if (selectedLeft.dataset.id === btn.dataset.id) {
                    selectedLeft.classList.remove('active');
                    selectedLeft.classList.add('connected');
                    btn.classList.add('connected');
                    selectedLeft = null;
                    connectedCount++;
                    document.getElementById('wire-status').innerText = `Conexiones: ${connectedCount} / 3`;
                    if (connectedCount === 3) setTimeout(() => completePlanetTask(task), 300);
                } else {
                    selectedLeft.classList.remove('active');
                    selectedLeft = null;
                    document.getElementById('wire-status').innerText = '❌ Color distinto. Selecciona el par correcto.';
                }
            };
        });

    } else if (task.type === 'temp') {
        let currentTemp = 15;
        body.innerHTML = `
            <div class="minigame-box">
                <p style="color:#cbd5e1;">Estabiliza la cámara térmica exactamente en <strong>-40 °C</strong>:</p>
                <div class="temp-controls">
                    <button id="temp-down" class="temp-btn" style="background:#0284c7;">❄️ Enfriar (-15°)</button>
                    <div style="font-size:2rem; font-weight:700; min-width:120px; color:#38bdf8;" id="temp-readout">15 °C</div>
                    <button id="temp-up" class="temp-btn" style="background:#ea580c;">🔥 Calentar (+5°)</button>
                </div>
                <p style="color:#94a3b8; font-size:0.85rem;">Meta requerida: <strong>-40 °C</strong></p>
            </div>
        `;
        const updateTemp = () => {
            document.getElementById('temp-readout').innerText = `${currentTemp} °C`;
            if (currentTemp === -40) {
                document.getElementById('temp-readout').style.color = '#10b981';
                setTimeout(() => completePlanetTask(task), 350);
            }
        };
        document.getElementById('temp-down').onclick = () => { currentTemp -= 15; updateTemp(); };
        document.getElementById('temp-up').onclick = () => { currentTemp += 5; updateTemp(); };

    } else if (task.type === 'sequence') {
        const order = [3, 1, 4, 2];
        let nextExpected = 1;
        body.innerHTML = `
            <div class="minigame-box">
                <p style="color:#cbd5e1;">Activa los nodos en orden ascendente del <strong>1 al 4</strong>:</p>
                <div class="seq-grid">
                    ${order.map(num => `<button class="seq-btn" data-num="${num}">${num}</button>`).join('')}
                </div>
                <p id="seq-status" style="color:#38bdf8; font-weight:600;">Siguiente nodo: 1</p>
            </div>
        `;
        document.querySelectorAll('.seq-btn').forEach(btn => {
            btn.onclick = () => {
                const val = parseInt(btn.dataset.num, 10);
                if (val === nextExpected) {
                    btn.classList.add('done');
                    nextExpected++;
                    document.getElementById('seq-status').innerText = nextExpected <= 4 ? `Siguiente nodo: ${nextExpected}` : '¡Secuencia completa!';
                    if (nextExpected > 4) setTimeout(() => completePlanetTask(task), 300);
                } else if (!btn.classList.contains('done')) {
                    document.getElementById('seq-status').innerText = `⚠️ Orden incorrecto. Busca el número ${nextExpected}`;
                }
            };
        });

    } else if (task.type === 'slider') {
        const targetHz = 72;
        body.innerHTML = `
            <div class="minigame-box">
                <p style="color:#cbd5e1;">Mueve el sintonizador hasta alcanzar la frecuencia objetivo de <strong>${targetHz} MHz</strong>:</p>
                <div style="font-size:2rem; font-weight:800; color:#38bdf8; margin:14px 0;" id="hz-display">40 MHz</div>
                <input type="range" id="hz-slider" min="20" max="100" value="40" style="width:90%; accent-color:#38bdf8; cursor:pointer;">
                <p id="hz-feedback" style="color:#94a3b8; margin-top:10px;">Rango válido: 70 - 74 MHz</p>
                <button id="hz-confirm-btn" class="btn-primary">📡 FIJAR SEÑAL</button>
            </div>
        `;
        const slider = document.getElementById('hz-slider');
        slider.oninput = () => {
            document.getElementById('hz-display').innerText = `${slider.value} MHz`;
        };
        document.getElementById('hz-confirm-btn').onclick = () => {
            const val = parseInt(slider.value, 10);
            if (Math.abs(val - targetHz) <= 2) {
                completePlanetTask(task);
            } else {
                document.getElementById('hz-feedback').innerText = '⚠️ Señal ruidosa, acércate más a 72 MHz.';
            }
        };

    } else if (task.type === 'rivets') {
        let sealedCount = 0;
        const spots = [
            { top: '22%', left: '18%' },
            { top: '62%', left: '28%' },
            { top: '26%', left: '72%' },
            { top: '65%', left: '66%' }
        ];
        body.innerHTML = `
            <div class="minigame-box">
                <p style="color:#cbd5e1;">Haz clic en los <strong>4 puntos rojos de fuga</strong> para sellar el mamparo de la base:</p>
                <div class="rivet-panel">
                    ${spots.map((s, i) => `<button class="rivet-spot" style="top:${s.top}; left:${s.left};" data-idx="${i}">!</button>`).join('')}
                </div>
                <p id="rivet-status" style="color:#38bdf8; font-weight:600;">Fugas selladas: 0 / 4</p>
            </div>
        `;
        document.querySelectorAll('.rivet-spot').forEach(btn => {
            btn.onclick = () => {
                if (btn.classList.contains('sealed')) return;
                btn.classList.add('sealed');
                btn.innerText = '✓';
                sealedCount++;
                document.getElementById('rivet-status').innerText = `Fugas selladas: ${sealedCount} / 4`;
                if (sealedCount === 4) setTimeout(() => completePlanetTask(task), 300);
            };
        });
    }

    modal.classList.remove('hidden');
}

function completePlanetTask(task) {
    task.completed = true;
    task.ringMesh.visible = false;
    task.light.intensity = 0.2;
    task.leftTube.material.color.setHex(0x10b981);
    task.rightTube.material.color.setHex(0x10b981);
    task.screenMesh.material.map = createWallMonitorTexture(task.wallLabel, 'Operación finalizada', '#10b981', true);
    task.screenMesh.material.needsUpdate = true;

    completedTasksCount++;
    document.getElementById('samples-counter').innerText = `📋 Tareas: ${completedTasksCount} / 3`;
    closePlanetTaskModal();
}

function closePlanetTaskModal() {
    if (activeMinigameAnim) cancelAnimationFrame(activeMinigameAnim);
    isTaskModalOpen = false;
    document.getElementById('planet-task-modal').classList.add('hidden');
}

function clearArenaScene() {
    while (arScene.children.length > 0) {
        arScene.remove(arScene.children[0]);
    }
}

function showMissionReport(success, message, earnedCredits) {
    cancelAnimationFrame(arAnimId);
    const modal = document.getElementById('report-modal');
    document.getElementById('report-title').innerText = success ? '🎉 ¡Regreso a la Tierra Exitoso!' : '⚠️ Misión Abortada';
    document.getElementById('report-desc').innerText = message;
    document.getElementById('report-stats').innerHTML = `
        <div><strong>Expedición</strong><br>${GAME_STATE.selectedMission.name}</div>
        <div><strong>Recompensa Ganada</strong><br><span style="color:#fbbf24; font-weight:800;">+${earnedCredits} CR</span></div>
        <div><strong>Saldo Total</strong><br><span style="color:#34d399; font-weight:800;">${GAME_STATE.credits} CR</span></div>
    `;
    modal.classList.remove('hidden');

    document.getElementById('return-hub-btn').onclick = () => {
        modal.classList.add('hidden');
        returnToHub(success);
    };
}

function returnToHub(completedSuccess) {
    cancelAnimationFrame(arAnimId);
    closePlanetTaskModal();
    document.getElementById('arena-container').classList.add('hidden');
    document.getElementById('control-center-container').classList.remove('hidden');

    if (completedSuccess) {
        updateWindowPlanet('earth');
    }
    animateControlCenter();
}

function animateArena() {
    arAnimId = requestAnimationFrame(animateArena);
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    if (arenaStage === 'flight') {
        updateSpaceFlight(dt, false);
    } else if (arenaStage === 'return_flight') {
        updateSpaceFlight(dt, true);
    } else {
        updatePlanetExploration(now * 0.001, dt);
    }
    arRenderer.render(arScene, arCamera);
}
