let arenaScene, arenaCamera, arenaRenderer, arenaAnimId;
let arenaPhase = 'flight_out'; // 'flight_out' | 'base_ops' | 'flight_back'
let arenaKeys = {};
let arenaLastTime = 0;

// Variables fase de vuelo espacial
let flightRocket = null;
let targetPlanetObj = null;
let asteroids = [];
let starField = null;
let shipShield = 100;
let maxShipShield = 100;
let flightProgress = 0;

// Variables fase base planetaria 68x68 (9 salas)
let baseAstroRig = null;
let baseAstroVelY = 0;
let baseAstroGrounded = true;
let remoteBaseAstros = {};
let baseColliders = []; // { minX, maxX, minZ, maxZ }
let roleTerminals = [];
let activeTerminal = null;
let isTaskModalOpen = false;
let completedTaskIds = new Set();
let suitOxygen = 90;
let maxSuitOxygen = 90;
let baseCamYaw = 0;
let baseDragging = false;
let basePrevMouseX = 0;

function startPhoraArena() {
    const container = document.getElementById('arena-container');
    container.classList.remove('hidden');

    const mission = GAME_STATE.selectedMission;
    const role = GAME_STATE.selectedRole;
    const stats = GAME_STATE.getShipTotalStats();

    maxShipShield = 100 + stats.shieldBonus;
    shipShield = maxShipShield;
    flightProgress = 0;

    maxSuitOxygen = 75 + stats.o2Bonus;
    suitOxygen = maxSuitOxygen;
    completedTaskIds = new Set();
    isTaskModalOpen = false;
    activeTerminal = null;

    document.getElementById('arena-role-badge').innerText = `ROL: ${role.short.toUpperCase()}`;
    document.getElementById('samples-counter').innerText = `📋 Tareas ${role.short}: 0 / ${role.tasks.length}`;

    setupArenaEvents();
    initFlightPhase('flight_out');
}

function setupArenaEvents() {
    const webglHolder = document.getElementById('arena-webgl-container');

    window.onkeydown = e => {
        if (document.getElementById('arena-container').classList.contains('hidden')) return;
        arenaKeys[e.code] = true;

        if (arenaPhase === 'base_ops' && !isTaskModalOpen) {
            if (e.code === 'Space' && baseAstroGrounded) {
                baseAstroVelY = 0.25;
                baseAstroGrounded = false;
            }
            if (e.code === 'KeyE' && activeTerminal && !completedTaskIds.has(activeTerminal.id)) {
                openTaskMinigame(activeTerminal);
            }
        }
        if (e.code === 'Escape' && isTaskModalOpen) {
            closeTaskModal();
        }
    };

    window.onkeyup = e => {
        arenaKeys[e.code] = false;
    };

    webglHolder.onmousedown = e => {
        baseDragging = true;
        basePrevMouseX = e.clientX;
    };

    window.onmousemove = e => {
        if (!baseDragging || isTaskModalOpen || arenaPhase !== 'base_ops') return;
        const dx = e.clientX - basePrevMouseX;
        basePrevMouseX = e.clientX;
        baseCamYaw -= dx * 0.0065;
    };

    window.onmouseup = () => {
        baseDragging = false;
    };

    document.getElementById('arena-interact-prompt').onclick = () => {
        if (activeTerminal && !isTaskModalOpen && !completedTaskIds.has(activeTerminal.id)) {
            openTaskMinigame(activeTerminal);
        }
    };

    document.getElementById('close-task-modal-btn').onclick = closeTaskModal;

    document.getElementById('abort-mission-btn').onclick = () => {
        stopArenaLoop();
        returnToControlCenter();
    };
}

function stopArenaLoop() {
    if (arenaAnimId) {
        cancelAnimationFrame(arenaAnimId);
        arenaAnimId = null;
    }
}

function resetArenaRenderer() {
    stopArenaLoop();
    const holder = document.getElementById('arena-webgl-container');
    holder.innerHTML = '';

    arenaScene = new THREE.Scene();
    arenaCamera = new THREE.PerspectiveCamera(58, holder.clientWidth / holder.clientHeight, 0.1, 160);
    arenaRenderer = new THREE.WebGLRenderer({ antialias: true });
    arenaRenderer.setSize(holder.clientWidth, holder.clientHeight);
    arenaRenderer.shadowMap.enabled = true;
    holder.appendChild(arenaRenderer.domElement);
}

// =========================================================================
// FASE 1 Y 3: VUELO ESPACIAL (IDA AL PLANETA Y REGRESO A LA TIERRA)
// =========================================================================
function initFlightPhase(phaseType) {
    arenaPhase = phaseType;
    flightProgress = 0;
    asteroids = [];
    document.getElementById('arena-interact-prompt').classList.add('hidden');

    resetArenaRenderer();
    arenaScene.background = new THREE.Color(0x030712);
    arenaScene.fog = new THREE.Fog(0x030712, 35, 130);

    arenaScene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const sun = new THREE.DirectionalLight(0xe0f2fe, 1.3);
    sun.position.set(12, 18, 15);
    arenaScene.add(sun);

    const mission = GAME_STATE.selectedMission;
    const isReturn = phaseType === 'flight_back';

    document.getElementById('arena-phase-title').innerText = isReturn
        ? '🌍 Regreso Orbital a la Tierra'
        : `🚀 Travesía hacia ${mission.name}`;

    document.getElementById('primary-bar-label').innerText = `🛡️ Escudo Nave: ${Math.round((shipShield / maxShipShield) * 100)}%`;
    document.getElementById('primary-bar-fill').className = 'progress-fill cyan';
    document.getElementById('secondary-bar-label').innerText = isReturn
        ? '🌍 Progreso a la Tierra: 0%'
        : `🪐 Progreso a ${mission.name}: 0%`;
    document.getElementById('secondary-bar-fill').className = 'progress-fill amber';
    document.getElementById('secondary-bar-fill').style.width = '0%';
    document.getElementById('arena-hint').innerHTML = 'Usa <b>W A S D</b> o <b>Flechas</b> para pilotar la nave y esquivar los meteoritos';

    // Campo de estrellas
    const starGeo = new THREE.BufferGeometry();
    const verts = [];
    for (let i = 0; i < 900; i++) {
        verts.push((Math.random() - 0.5) * 90, (Math.random() - 0.5) * 65, -Math.random() * 140);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    starField = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.28 }));
    arenaScene.add(starField);

    // Planeta destino lejano que se acerca
    targetPlanetObj = createHDPlanet(isReturn ? 'earth' : mission.id, 18);
    targetPlanetObj.group.position.set(0, 6, -125);
    arenaScene.add(targetPlanetObj.group);

    // Cohete personalizado
    flightRocket = buildCustom3DRocket(true);
    flightRocket.rotation.x = -Math.PI / 2;
    flightRocket.scale.setScalar(0.75);
    flightRocket.position.set(0, 0, 4);
    arenaScene.add(flightRocket);

    // Meteoritos
    const rockCount = mission.asteroidCount + (isReturn ? 3 : 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85, metalness: 0.15 });
    for (let i = 0; i < rockCount; i++) {
        const radius = 0.65 + Math.random() * 0.75;
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(radius, 1), rockMat);
        rock.position.set(
            (Math.random() - 0.5) * 22,
            (Math.random() - 0.5) * 13,
            -20 - Math.random() * 110
        );
        rock.userData = {
            radius,
            rotSpeedX: (Math.random() - 0.5) * 2.5,
            rotSpeedY: (Math.random() - 0.5) * 2.5
        };
        arenaScene.add(rock);
        asteroids.push(rock);
    }

    arenaCamera.position.set(0, 3.2, 12.5);
    arenaCamera.lookAt(0, 0.5, -10);

    arenaLastTime = performance.now();
    animateFlightPhase();
}

function animateFlightPhase(now) {
    arenaAnimId = requestAnimationFrame(animateFlightPhase);
    const tNow = now || performance.now();
    const dt = Math.min(0.05, (tNow - arenaLastTime) / 1000);
    arenaLastTime = tNow;

    const stats = GAME_STATE.getShipTotalStats();
    const moveSpeed = 13 * stats.speedMult;

    if (flightRocket) {
        let dx = 0;
        let dy = 0;
        if (arenaKeys['KeyA'] || arenaKeys['ArrowLeft']) dx -= 1;
        if (arenaKeys['KeyD'] || arenaKeys['ArrowRight']) dx += 1;
        if (arenaKeys['KeyW'] || arenaKeys['ArrowUp']) dy += 1;
        if (arenaKeys['KeyS'] || arenaKeys['ArrowDown']) dy -= 1;

        flightRocket.position.x = Math.max(-10.5, Math.min(10.5, flightRocket.position.x + dx * moveSpeed * dt));
        flightRocket.position.y = Math.max(-6.2, Math.min(6.2, flightRocket.position.y + dy * moveSpeed * dt));
        flightRocket.rotation.z = -dx * 0.35;
        animateRocketExhaust(flightRocket, dt);
    }

    // Avance de viaje
    flightProgress += dt * 7.8 * stats.speedMult;
    const pct = Math.min(100, Math.round(flightProgress));
    const isReturn = arenaPhase === 'flight_back';

    document.getElementById('secondary-bar-label').innerText = isReturn
        ? `🌍 Progreso a la Tierra: ${pct}%`
        : `🪐 Progreso a ${GAME_STATE.selectedMission.name}: ${pct}%`;
    document.getElementById('secondary-bar-fill').style.width = `${pct}%`;

    if (targetPlanetObj) {
        targetPlanetObj.group.position.z = -125 + (pct / 100) * 92;
        targetPlanetObj.sphere.rotation.y += dt * 0.25;
    }

    // Mover estrellas y meteoritos
    const posArr = starField.geometry.attributes.position.array;
    for (let i = 2; i < posArr.length; i += 3) {
        posArr[i] += 48 * dt * stats.speedMult;
        if (posArr[i] > 12) posArr[i] = -130;
    }
    starField.geometry.attributes.position.needsUpdate = true;

    const rockSpeed = 28 * stats.speedMult;
    asteroids.forEach(rock => {
        rock.position.z += rockSpeed * dt;
        rock.rotation.x += rock.userData.rotSpeedX * dt;
        rock.rotation.y += rock.userData.rotSpeedY * dt;

        if (flightRocket) {
            const dist = rock.position.distanceTo(flightRocket.position);
            if (dist < rock.userData.radius + 0.95) {
                shipShield = Math.max(0, shipShield - 18);
                const shieldPct = Math.round((shipShield / maxShipShield) * 100);
                document.getElementById('primary-bar-label').innerText = `🛡️ Escudo Nave: ${shieldPct}%`;
                document.getElementById('primary-bar-fill').style.width = `${shieldPct}%`;
                rock.position.z = -110 - Math.random() * 35;
                rock.position.x = (Math.random() - 0.5) * 21;
                rock.position.y = (Math.random() - 0.5) * 12;

                if (shipShield <= 0) {
                    stopArenaLoop();
                    showMissionReport(false, 'El escudo de la nave llegó al 0% por impacto de meteoritos. Mejora tu blindaje en el Taller de Nave.');
                    return;
                }
            }
        }

        if (rock.position.z > 14) {
            rock.position.z = -105 - Math.random() * 35;
            rock.position.x = (Math.random() - 0.5) * 21;
            rock.position.y = (Math.random() - 0.5) * 12;
        }
    });

    if (pct >= 100) {
        stopArenaLoop();
        if (arenaPhase === 'flight_out') {
            initPlanetaryBasePhase();
        } else {
            const reward = GAME_STATE.selectedMission.rewardCredits;
            GAME_STATE.credits += reward;
            GAME_STATE.saveProgress();
            showMissionReport(true, `¡Aterrizaje exitoso en la Tierra! Todas las tareas de ${GAME_STATE.selectedRole.short} fueron completadas en ${GAME_STATE.selectedMission.name}. Recompensa: +${reward} CR.`);
        }
        return;
    }

    arenaRenderer.render(arenaScene, arenaCamera);
}

// =========================================================================
// FASE 2: BASE PLANETARIA CERRADA 68x68 (9 SALAS, TECHO ALTO 11m, SIN TRANSPARENCIAS)
// =========================================================================
function initPlanetaryBasePhase() {
    arenaPhase = 'base_ops';
    baseColliders = [];
    roleTerminals = [];
    remoteBaseAstros = {};
    baseCamYaw = 0;

    resetArenaRenderer();

    const mission = GAME_STATE.selectedMission;
    const role = GAME_STATE.selectedRole;

    arenaScene.background = new THREE.Color(mission.skyColor);
    arenaScene.fog = new THREE.Fog(0x070d1a, 32, 85);

    document.getElementById('arena-phase-title').innerText = `🏛️ Base en ${mission.name}`;
    document.getElementById('primary-bar-label').innerText = `🫁 Oxígeno Traje: 100%`;
    document.getElementById('primary-bar-fill').className = 'progress-fill green';
    document.getElementById('primary-bar-fill').style.width = '100%';

    document.getElementById('secondary-bar-label').innerText = `📋 Tareas de ${role.short}: 0/${role.tasks.length}`;
    document.getElementById('secondary-bar-fill').className = 'progress-fill cyan';
    document.getElementById('secondary-bar-fill').style.width = '0%';

    // Iluminación interior amplia para las 9 salas
    arenaScene.add(new THREE.AmbientLight(0xcbd5e1, 0.85));

    const roomCoords = [-22.5, 0, 22.5];
    roomCoords.forEach(rx => {
        roomCoords.forEach(rz => {
            const pLight = new THREE.PointLight(mission.accentColor, 0.9, 28);
            pLight.position.set(rx, 8.8, rz);
            arenaScene.add(pLight);

            // Luminaria en el techo alto (y = 10.7)
            const lamp = new THREE.Mesh(
                new THREE.BoxGeometry(3.6, 0.25, 3.6),
                new THREE.MeshBasicMaterial({ color: 0xe0f2fe })
            );
            lamp.position.set(rx, 10.8, rz);
            arenaScene.add(lamp);
        });
    });

    buildClosed9RoomComplex(mission);
    buildRoleSpecificTerminals(role);

    // Astronauta del jugador en el centro de la sala central (0, 0, 0)
    const char = GAME_DATA.characters.find(c => c.id === GAME_STATE.selectedCharacterId) || GAME_DATA.characters[0];
    baseAstroRig = createBackyardiganCharacter(char.id, {
        name: MP.myName,
        charName: char.shortName,
        roleShort: role.short,
        colorCss: role.colorCss
    });
    baseAstroRig.group.position.set(0, 0, 0);
    arenaScene.add(baseAstroRig.group);

    updateBaseCompassHint();

    arenaLastTime = performance.now();
    animatePlanetaryBase();
}

function addSolidWallBox(cx, cz, widthX, depthZ, heightY, wallMat, trimMat) {
    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(widthX, heightY, depthZ),
        wallMat
    );
    wall.position.set(cx, heightY / 2, cz);
    wall.castShadow = true;
    wall.receiveShadow = true;
    arenaScene.add(wall);

    // Franja neón inferior para visibilidad espacial
    if (trimMat) {
        const trim = new THREE.Mesh(
            new THREE.BoxGeometry(widthX + 0.06, 0.25, depthZ + 0.06),
            trimMat
        );
        trim.position.set(cx, 0.35, cz);
        arenaScene.add(trim);
    }

    baseColliders.push({
        minX: cx - widthX / 2 - 0.55,
        maxX: cx + widthX / 2 + 0.55,
        minZ: cz - depthZ / 2 - 0.55,
        maxZ: cz + depthZ / 2 + 0.55
    });
}

function buildClosed9RoomComplex(mission) {
    const WALL_H = 11.0; // Techo alto de 11 metros
    const WALL_T = 1.4;  // Paredes gruesas 100% opacas

    // Suelo principal 68 x 68 (de -34 a +34)
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(68, 68),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45, metalness: 0.25 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    arenaScene.add(floor);

    const grid = new THREE.GridHelper(68, 34, mission.accentColor, 0x1e293b);
    grid.position.y = 0.01;
    arenaScene.add(grid);

    // Techo sólido cerrado a y = 11.0 (nadie puede ver hacia afuera ni atravesar paredes)
    const ceiling = new THREE.Mesh(
        new THREE.BoxGeometry(70, 0.8, 70),
        new THREE.MeshStandardMaterial({ color: 0x091122, roughness: 0.7, side: THREE.DoubleSide })
    );
    ceiling.position.set(0, WALL_H + 0.4, 0);
    arenaScene.add(ceiling);

    const outerWallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.2 });
    const innerWallMat = new THREE.MeshStandardMaterial({ color: 0x263349, roughness: 0.5, metalness: 0.2 });
    const trimMat = new THREE.MeshBasicMaterial({ color: mission.accentColor });

    // 4 Paredes Exteriores Sólidas (Norte z=-34, Sur z=34, Oeste x=-34, Este x=34)
    addSolidWallBox(0, -34.2, 69.8, WALL_T, WALL_H, outerWallMat, trimMat);
    addSolidWallBox(0, 34.2, 69.8, WALL_T, WALL_H, outerWallMat, trimMat);
    addSolidWallBox(-34.2, 0, WALL_T, 69.8, WALL_H, outerWallMat, trimMat);
    addSolidWallBox(34.2, 0, WALL_T, 69.8, WALL_H, outerWallMat, trimMat);

    // Divisiones Interiores en cuadrícula 3x3 (en x = -11, x = +11 y z = -11, z = +11)
    // Con puertas amplias de 5.2m centradas en -22.5, 0 y +22.5
    const doorCenters = [-22.5, 0, 22.5];
    const doorHalf = 2.6;

    function buildWallWithDoorways(isVerticalWall, fixedCoord) {
        let cursor = -33.5;
        doorCenters.forEach(dc => {
            const segEnd = dc - doorHalf;
            const segLen = segEnd - cursor;
            if (segLen > 0.4) {
                const segCenter = (cursor + segEnd) / 2;
                if (isVerticalWall) {
                    addSolidWallBox(fixedCoord, segCenter, 1.1, segLen, WALL_H, innerWallMat, trimMat);
                } else {
                    addSolidWallBox(segCenter, fixedCoord, segLen, 1.1, WALL_H, innerWallMat, trimMat);
                }
            }
            // Dintel superior sobre la puerta (de y=4.6 a y=11.0)
            const lintel = new THREE.Mesh(
                isVerticalWall
                    ? new THREE.BoxGeometry(1.1, WALL_H - 4.6, doorHalf * 2)
                    : new THREE.BoxGeometry(doorHalf * 2, WALL_H - 4.6, 1.1),
                innerWallMat
            );
            lintel.position.set(
                isVerticalWall ? fixedCoord : dc,
                4.6 + (WALL_H - 4.6) / 2,
                isVerticalWall ? dc : fixedCoord
            );
            arenaScene.add(lintel);

            cursor = dc + doorHalf;
        });

        const lastLen = 33.5 - cursor;
        if (lastLen > 0.4) {
            const lastCenter = (cursor + 33.5) / 2;
            if (isVerticalWall) {
                addSolidWallBox(fixedCoord, lastCenter, 1.1, lastLen, WALL_H, innerWallMat, trimMat);
            } else {
                addSolidWallBox(lastCenter, fixedCoord, lastLen, 1.1, WALL_H, innerWallMat, trimMat);
            }
        }
    }

    buildWallWithDoorways(true, -11);
    buildWallWithDoorways(true, 11);
    buildWallWithDoorways(false, -11);
    buildWallWithDoorways(false, 11);

    // Letreros identificadores de las 9 salas del complejo
    const roomSigns = [
        { text: 'CAFETERÍA CENTRAL', x: 0, z: 0 },
        { text: 'PUENTE DE NAVEGACIÓN (NORTE)', x: 0, z: -22.5 },
        { text: 'ARMERÍA Y ESCUDOS (NOROESTE)', x: -22.5, z: -22.5 },
        { text: 'SOPORTE VITAL O2 (NORESTE)', x: 22.5, z: -22.5 },
        { text: 'SALA DEL REACTOR (OESTE)', x: -22.5, z: 0 },
        { text: 'LABORATORIO MEDBAY (ESTE)', x: 22.5, z: 0 },
        { text: 'SALA ELÉCTRICA (SUROESTE)', x: -22.5, z: 22.5 },
        { text: 'COMUNICACIONES (SUR)', x: 0, z: 22.5 },
        { text: 'BAHÍA DE CARGA / MOTORES (SURESTE)', x: 22.5, z: 22.5 }
    ];

    roomSigns.forEach(rs => {
        const sprite = createConsoleLabelSprite(rs.text, '#38bdf8');
        sprite.scale.set(5.4, 1.15, 1);
        sprite.position.set(rs.x, 7.6, rs.z);
        arenaScene.add(sprite);
    });
}

function buildRoleSpecificTerminals(role) {
    roleTerminals = [];

    role.tasks.forEach(task => {
        const group = new THREE.Group();
        group.position.set(task.x, 0, task.z);
        group.rotation.y = task.rotY || 0;

        const pedestal = new THREE.Mesh(
            new THREE.BoxGeometry(1.7, 1.35, 0.85),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.5 })
        );
        pedestal.position.y = 0.675;
        group.add(pedestal);

        const screenMat = new THREE.MeshStandardMaterial({
            color: role.colorHex,
            emissive: role.colorHex,
            emissiveIntensity: 0.85
        });
        const screen = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.95, 0.14), screenMat);
        screen.position.set(0, 1.75, 0.12);
        screen.rotation.x = -0.25;
        group.add(screen);

        // Baliza vertical luminosa para localizar el objetivo en la sala
        const beacon = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.45, 9.5, 16, 1, true),
            new THREE.MeshBasicMaterial({
                color: role.colorHex,
                transparent: true,
                opacity: 0.22,
                side: THREE.DoubleSide
            })
        );
        beacon.position.set(0, 5.0, 0.6);
        group.add(beacon);

        const label = createConsoleLabelSprite(task.wallLabel, role.colorCss);
        label.position.set(0, 2.85, 0.2);
        group.add(label);

        arenaScene.add(group);
        roleTerminals.push({ ...task, group, screenMat, beacon });
    });
}

function updateBaseCompassHint() {
    const pending = roleTerminals.filter(t => !completedTaskIds.has(t.id));
    const hintEl = document.getElementById('arena-hint');
    if (!hintEl) return;

    if (pending.length === 0) {
        hintEl.innerHTML = '✅ <b>¡Todas tus tareas completadas!</b> Preparando regreso orbital...';
        return;
    }

    const nextTask = pending[0];
    hintEl.innerHTML = `🎯 Objetivo pendiente (${pending.length}): <b>${nextTask.title}</b> en <b>${nextTask.roomName}</b> • <b>[E]</b> Operar`;
}

function resolveBaseWallCollisions(pos) {
    const r = 0.48;
    for (let i = 0; i < baseColliders.length; i++) {
        const box = baseColliders[i];
        if (pos.x + r > box.minX && pos.x - r < box.maxX && pos.z + r > box.minZ && pos.z - r < box.maxZ) {
            const overlapLeft = (pos.x + r) - box.minX;
            const overlapRight = box.maxX - (pos.x - r);
            const overlapTop = (pos.z + r) - box.minZ;
            const overlapBottom = box.maxZ - (pos.z - r);
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

            if (minOverlap === overlapLeft) pos.x = box.minX - r;
            else if (minOverlap === overlapRight) pos.x = box.maxX + r;
            else if (minOverlap === overlapTop) pos.z = box.minZ - r;
            else if (minOverlap === overlapBottom) pos.z = box.maxZ + r;
        }
    }
    pos.x = Math.max(-32.8, Math.min(32.8, pos.x));
    pos.z = Math.max(-32.8, Math.min(32.8, pos.z));
}

function clampBaseCameraInsideWalls(camPos, targetPos) {
    // Mantener la cámara siempre debajo del techo (y = 11) y dentro de las paredes exteriores
    camPos.y = Math.min(9.2, Math.max(1.8, camPos.y));
    camPos.x = Math.max(-32.6, Math.min(32.6, camPos.x));
    camPos.z = Math.max(-32.6, Math.min(32.6, camPos.z));

    // Evitar que la cámara cruce muros interiores entre el personaje y la lente
    const steps = 8;
    for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const testX = targetPos.x + (camPos.x - targetPos.x) * t;
        const testZ = targetPos.z + (camPos.z - targetPos.z) * t;
        for (let i = 0; i < baseColliders.length; i++) {
            const b = baseColliders[i];
            if (testX > b.minX + 0.25 && testX < b.maxX - 0.25 && testZ > b.minZ + 0.25 && testZ < b.maxZ - 0.25) {
                const safeT = Math.max(0.18, (s - 1) / steps);
                camPos.x = targetPos.x + (camPos.x - targetPos.x) * safeT;
                camPos.z = targetPos.z + (camPos.z - targetPos.z) * safeT;
                return;
            }
        }
    }
}

function syncBaseRemoteAstronauts(elapsed, dt) {
    MP.updateBots(dt, 28);

    const activeIds = new Set();
    Object.values(MP.players).forEach(p => {
        if (p.id === MP.myId) return;
        activeIds.add(p.id);

        const charId = p.characterId || 'pablo';
        if (!remoteBaseAstros[p.id] || remoteBaseAstros[p.id].charId !== charId || remoteBaseAstros[p.id].name !== p.name) {
            if (remoteBaseAstros[p.id]) arenaScene.remove(remoteBaseAstros[p.id].rig.group);
            const role = GAME_DATA.roles.find(r => r.id === p.roleId) || GAME_DATA.roles[0];
            const char = GAME_DATA.characters.find(c => c.id === charId) || GAME_DATA.characters[0];
            const rig = createBackyardiganCharacter(charId, {
                name: p.name,
                charName: char.shortName,
                roleShort: role.short,
                colorCss: role.colorCss
            });
            rig.group.position.set(p.x || 0, p.y || 0, p.z || 0);
            arenaScene.add(rig.group);
            remoteBaseAstros[p.id] = { rig, charId, name: p.name };
        }

        const rig = remoteBaseAstros[p.id].rig;
        rig.group.position.x += (p.x - rig.group.position.x) * 0.2;
        rig.group.position.y += ((p.y || 0) - rig.group.position.y) * 0.25;
        rig.group.position.z += (p.z - rig.group.position.z) * 0.2;
        rig.group.rotation.y = p.rotY || 0;

        if (rig.propellerMesh) rig.propellerMesh.rotation.y += 0.25;

        if (p.moving) {
            const swing = Math.sin(elapsed * 11) * 0.5;
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
            arenaScene.remove(remoteBaseAstros[id].rig.group);
            delete remoteBaseAstros[id];
        }
    });
}

function animatePlanetaryBase(now) {
    arenaAnimId = requestAnimationFrame(animatePlanetaryBase);
    const tNow = now || performance.now();
    const dt = Math.min(0.05, (tNow - arenaLastTime) / 1000);
    arenaLastTime = tNow;
    const elapsed = tNow * 0.001;

    // Consumo de oxígeno del traje
    if (!isTaskModalOpen) {
        suitOxygen = Math.max(0, suitOxygen - dt);
        const o2Pct = Math.round((suitOxygen / maxSuitOxygen) * 100);
        document.getElementById('primary-bar-label').innerText = `🫁 Oxígeno Traje: ${o2Pct}%`;
        document.getElementById('primary-bar-fill').style.width = `${o2Pct}%`;
        if (o2Pct <= 25) {
            document.getElementById('primary-bar-fill').className = 'progress-fill red';
        }
        if (suitOxygen <= 0) {
            stopArenaLoop();
            showMissionReport(false, 'Se agotó el oxígeno de tu traje espacial en la base. Equipa alas o fuselaje de largo alcance para mayor reserva.');
            return;
        }
    }

    roleTerminals.forEach((t, idx) => {
        if (!completedTaskIds.has(t.id)) {
            t.beacon.rotation.y += dt * 1.5;
            t.beacon.material.opacity = 0.16 + Math.sin(elapsed * 4 + idx) * 0.08;
        }
    });

    if (baseAstroRig && baseAstroRig.group) {
        let moving = false;
        if (!isTaskModalOpen) {
            let forward = 0;
            let strafe = 0;
            if (arenaKeys['KeyW'] || arenaKeys['ArrowUp']) forward -= 1;
            if (arenaKeys['KeyS'] || arenaKeys['ArrowDown']) forward += 1;
            if (arenaKeys['KeyA'] || arenaKeys['ArrowLeft']) strafe -= 1;
            if (arenaKeys['KeyD'] || arenaKeys['ArrowRight']) strafe += 1;

            const speed = (arenaKeys['ShiftLeft'] || arenaKeys['ShiftRight']) ? 0.21 : 0.14;
            if (forward !== 0 || strafe !== 0) {
                moving = true;
                const sinY = Math.sin(baseCamYaw);
                const cosY = Math.cos(baseCamYaw);
                const vx = strafe * cosY + forward * sinY;
                const vz = -strafe * sinY + forward * cosY;
                const len = Math.hypot(vx, vz) || 1;

                baseAstroRig.group.position.x += (vx / len) * speed;
                baseAstroRig.group.position.z += (vz / len) * speed;
                baseAstroRig.group.rotation.y = Math.atan2(vx, vz);
            }
        }

        resolveBaseWallCollisions(baseAstroRig.group.position);

        if (!baseAstroGrounded) {
            baseAstroRig.group.position.y += baseAstroVelY;
            baseAstroVelY -= 0.013;
            if (baseAstroRig.group.position.y <= 0) {
                baseAstroRig.group.position.y = 0;
                baseAstroVelY = 0;
                baseAstroGrounded = true;
            }
        }

        if (baseAstroRig.propellerMesh) baseAstroRig.propellerMesh.rotation.y += 0.25;

        if (!baseAstroGrounded) {
            baseAstroRig.leftArm.rotation.x = -0.6;
            baseAstroRig.rightArm.rotation.x = -0.6;
        } else if (moving) {
            const swing = Math.sin(elapsed * 12) * 0.52;
            baseAstroRig.leftLeg.rotation.x = swing;
            baseAstroRig.rightLeg.rotation.x = -swing;
            baseAstroRig.leftArm.rotation.x = -swing;
            baseAstroRig.rightArm.rotation.x = swing;
        } else {
            baseAstroRig.leftLeg.rotation.x = 0;
            baseAstroRig.rightLeg.rotation.x = 0;
            baseAstroRig.leftArm.rotation.x = 0;
            baseAstroRig.rightArm.rotation.x = 0;
        }

        MP.sendMyPosition(
            baseAstroRig.group.position.x,
            baseAstroRig.group.position.y,
            baseAstroRig.group.position.z,
            baseAstroRig.group.rotation.y,
            moving
        );

        // Detectar terminal de misión cercana
        let nearest = null;
        let minDist = 3.2;
        roleTerminals.forEach(t => {
            if (completedTaskIds.has(t.id)) return;
            const d = Math.hypot(baseAstroRig.group.position.x - t.x, baseAstroRig.group.position.z - t.z);
            if (d < minDist) {
                minDist = d;
                nearest = t;
            }
        });
        activeTerminal = nearest;

        const promptBtn = document.getElementById('arena-interact-prompt');
        if (activeTerminal && !isTaskModalOpen) {
            document.getElementById('arena-task-name').innerText = activeTerminal.title;
            promptBtn.classList.remove('hidden');
        } else {
            promptBtn.classList.add('hidden');
        }

        // Cámara tercera persona dentro de la base (sin atravesar paredes ni techo)
        const camDist = 6.2;
        const rawCam = new THREE.Vector3(
            baseAstroRig.group.position.x + Math.sin(baseCamYaw) * camDist,
            baseAstroRig.group.position.y + 3.6,
            baseAstroRig.group.position.z + Math.cos(baseCamYaw) * camDist
        );
        const lookTarget = new THREE.Vector3(
            baseAstroRig.group.position.x,
            baseAstroRig.group.position.y + 1.8,
            baseAstroRig.group.position.z
        );
        clampBaseCameraInsideWalls(rawCam, lookTarget);
        arenaCamera.position.copy(rawCam);
        arenaCamera.lookAt(lookTarget);
    }

    syncBaseRemoteAstronauts(elapsed, dt);
    arenaRenderer.render(arenaScene, arenaCamera);
}

// =========================================================================
// MINIJUEGOS INTERACTIVOS POR ROL (6 MECÁNICAS DISTINTAS)
// =========================================================================
function closeTaskModal() {
    isTaskModalOpen = false;
    document.getElementById('planet-task-modal').classList.add('hidden');
}

function completeCurrentTask(task) {
    completedTaskIds.add(task.id);
    task.screenMat.color.setHex(0x10b981);
    task.screenMat.emissive.setHex(0x10b981);
    task.beacon.visible = false;

    const total = GAME_STATE.selectedRole.tasks.length;
    const done = completedTaskIds.size;
    const pct = Math.round((done / total) * 100);

    document.getElementById('samples-counter').innerText = `📋 Tareas ${GAME_STATE.selectedRole.short}: ${done} / ${total}`;
    document.getElementById('secondary-bar-label').innerText = `📋 Tareas de ${GAME_STATE.selectedRole.short}: ${done}/${total}`;
    document.getElementById('secondary-bar-fill').style.width = `${pct}%`;

    closeTaskModal();
    updateBaseCompassHint();

    if (done >= total) {
        setTimeout(() => {
            stopArenaLoop();
            initFlightPhase('flight_back');
        }, 900);
    }
}

function openTaskMinigame(task) {
    isTaskModalOpen = true;
    const modal = document.getElementById('planet-task-modal');
    const title = document.getElementById('task-modal-title');
    const body = document.getElementById('task-modal-body');

    title.innerText = `${task.title} — ${task.roomName}`;
    modal.classList.remove('hidden');

    if (task.type === 'sequence') {
        // Minijuego 1: Secuencia numérica ascendente 1 -> 4
        const nums = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
        let expected = 1;
        body.innerHTML = `
            <div class="minigame-box">
                <p style="color:#cbd5e1;">Pulsa los nodos de calibración en orden ascendente (<strong>1 → 2 → 3 → 4</strong>):</p>
                <div class="seq-grid">
                    ${nums.map(n => `<button class="seq-btn" data-num="${n}">${n}</button>`).join('')}
                </div>
                <p id="seq-msg" style="color:#38bdf8; font-weight:600; min-height:22px;"></p>
            </div>
        `;
        body.querySelectorAll('.seq-btn').forEach(btn => {
            btn.onclick = () => {
                const val = parseInt(btn.dataset.num, 10);
                if (val === expected) {
                    btn.classList.add('done');
                    expected++;
                    if (expected > 4) {
                        completeCurrentTask(task);
                    }
                } else {
                    expected = 1;
                    body.querySelectorAll('.seq-btn').forEach(b => b.classList.remove('done'));
                    document.getElementById('seq-msg').innerText = '⚠️ Orden incorrecto, secuencia reiniciada.';
                }
            };
        });

    } else if (task.type === 'timing') {
        // Minijuego 2: Detener cursor en zona verde
        body.innerHTML = `
            <div class="minigame-box">
                <p style="color:#cbd5e1;">Detén el estabilizador cuando el cursor azul esté dentro de la <strong>zona verde central</strong>:</p>
                <div class="drill-meter">
                    <div class="drill-target-zone"></div>
                    <div class="drill-cursor" id="timing-cursor" style="left:10%;"></div>
                </div>
                <button id="timing-lock-btn" class="btn-primary">⚡ FIJAR ESTABILIZADOR</button>
                <p id="timing-msg" style="color:#fbbf24; font-weight:600; margin-top:8px;"></p>
            </div>
        `;
        let pos = 5;
        let dir = 1;
        const cursor = document.getElementById('timing-cursor');
        const interval = setInterval(() => {
            if (!isTaskModalOpen) { clearInterval(interval); return; }
            pos += dir * 2.4;
            if (pos >= 94) { pos = 94; dir = -1; }
            if (pos <= 2) { pos = 2; dir = 1; }
            cursor.style.left = pos + '%';
        }, 25);

        document.getElementById('timing-lock-btn').onclick = () => {
            if (pos >= 35 && pos <= 65) {
                clearInterval(interval);
                completeCurrentTask(task);
            } else {
                document.getElementById('timing-msg').innerText = '⚠️ Fuera de rango óptimo, intenta nuevamente.';
            }
        };

    } else if (task.type === 'slider') {
        // Minijuego 3: Sintonizador de frecuencia / presión exacta
        const targetVal = Math.floor(25 + Math.random() * 55);
        body.innerHTML = `
            <div class="minigame-box">
                <p style="color:#cbd5e1;">Ajusta el dial hasta alcanzar la lectura objetivo: <strong style="color:#10b981; font-size:1.15rem;">${targetVal}.0 MHz</strong></p>
                <input type="range" id="freq-slider" min="10" max="90" value="50" style="width:100%; margin:20px 0; accent-color:#38bdf8;">
                <div style="font-size:1.3rem; font-weight:800; color:#38bdf8; margin-bottom:12px;">Lectura Actual: <span id="freq-readout">50</span>.0 MHz</div>
                <button id="freq-confirm-btn" class="btn-primary">📡 BLOQUEAR FRECUENCIA</button>
                <p id="freq-msg" style="color:#fbbf24; font-weight:600; margin-top:8px;"></p>
            </div>
        `;
        const slider = document.getElementById('freq-slider');
        const readout = document.getElementById('freq-readout');
        slider.oninput = () => { readout.innerText = slider.value; };
        document.getElementById('freq-confirm-btn').onclick = () => {
            const diff = Math.abs(parseInt(slider.value, 10) - targetVal);
            if (diff <= 2) {
                completeCurrentTask(task);
            } else {
                document.getElementById('freq-msg').innerText = `⚠️ Desviación detectada (acércate más a ${targetVal}.0 MHz).`;
            }
        };

    } else if (task.type === 'wires') {
        // Minijuego 4: Conexión de cables de colores
        const wires = [
            { id: 'red', label: 'Bus Rojo', color: '#ef4444' },
            { id: 'blue', label: 'Bus Azul', color: '#3b82f6' },
            { id: 'green', label: 'Bus Verde', color: '#10b981' },
            { id: 'amber', label: 'Bus Ámbar', color: '#f59e0b' }
        ];
        const rightWires = [...wires].sort(() => Math.random() - 0.5);
        let selectedLeft = null;
        let connectedCount = 0;

        body.innerHTML = `
            <div class="minigame-box">
                <p style="color:#cbd5e1;">Conecta cada terminal izquierda con su par del mismo color a la derecha:</p>
                <div class="wire-grid">
                    <div class="wire-col">
                        ${wires.map(w => `<button class="wire-node" data-side="L" data-wid="${w.id}" style="background:${w.color};">${w.label}</button>`).join('')}
                    </div>
                    <div class="wire-col">
                        ${rightWires.map(w => `<button class="wire-node" data-side="R" data-wid="${w.id}" style="background:${w.color};">${w.label}</button>`).join('')}
                    </div>
                </div>
            </div>
        `;

        body.querySelectorAll('.wire-node').forEach(btn => {
            btn.onclick = () => {
                if (btn.classList.contains('connected')) return;
                const side = btn.dataset.side;
                const wid = btn.dataset.wid;

                if (side === 'L') {
                    body.querySelectorAll('[data-side="L"]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    selectedLeft = btn;
                } else if (side === 'R' && selectedLeft) {
                    if (selectedLeft.dataset.wid === wid) {
                        selectedLeft.classList.remove('active');
                        selectedLeft.classList.add('connected');
                        btn.classList.add('connected');
                        selectedLeft = null;
                        connectedCount++;
                        if (connectedCount >= 4) {
                            completeCurrentTask(task);
                        }
                    } else {
                        selectedLeft.classList.remove('active');
                        selectedLeft = null;
                    }
                }
            };
        });

    } else if (task.type === 'temp') {
        // Minijuego 5: Regulador térmico criogénico
        let currentTemp = -12;
        const targetTemp = -45;
        body.innerHTML = `
            <div class="minigame-box">
                <p style="color:#cbd5e1;">Estabiliza la cámara criogénica exactamente a <strong style="color:#38bdf8;">${targetTemp}°C</strong>:</p>
                <div class="temp-controls">
                    <button class="temp-btn" id="temp-down" style="background:#0284c7;">❄️ -11°C</button>
                    <div id="temp-display" style="font-size:1.8rem; font-weight:800; min-width:110px;">${currentTemp}°C</div>
                    <button class="temp-btn" id="temp-up" style="background:#ea580c;">🔥 +5°C</button>
                </div>
                <button id="temp-confirm" class="btn-primary">✓ SELLAR CÁMARA CRIOGÉNICA</button>
            </div>
        `;
        const disp = document.getElementById('temp-display');
        document.getElementById('temp-down').onclick = () => {
            currentTemp -= 11;
            disp.innerText = `${currentTemp}°C`;
        };
        document.getElementById('temp-up').onclick = () => {
            currentTemp += 5;
            disp.innerText = `${currentTemp}°C`;
        };
        document.getElementById('temp-confirm').onclick = () => {
            if (Math.abs(currentTemp - targetTemp) <= 3) {
                completeCurrentTask(task);
            }
        };

    } else {
        // Minijuego 6 ('rivets'): Sellar 5 remaches de compuerta presurizada
        const spots = [
            { top: '18%', left: '15%' },
            { top: '22%', left: '75%' },
            { top: '50%', left: '46%' },
            { top: '72%', left: '22%' },
            { top: '70%', left: '72%' }
        ];
        let sealed = 0;
        body.innerHTML = `
            <div class="minigame-box">
                <p style="color:#cbd5e1;">Haz clic en los <strong>5 puntos rojos de fuga</strong> para soldar y presurizar la compuerta:</p>
                <div class="rivet-panel">
                    ${spots.map((s, i) => `<button class="rivet-spot" data-idx="${i}" style="top:${s.top}; left:${s.left};">!</button>`).join('')}
                </div>
            </div>
        `;
        body.querySelectorAll('.rivet-spot').forEach(btn => {
            btn.onclick = () => {
                if (btn.classList.contains('sealed')) return;
                btn.classList.add('sealed');
                btn.innerText = '✓';
                sealed++;
                if (sealed >= spots.length) {
                    completeCurrentTask(task);
                }
            };
        });
    }
}

function showMissionReport(success, message) {
    const modal = document.getElementById('report-modal');
    const title = document.getElementById('report-title');
    const desc = document.getElementById('report-desc');
    const statsBox = document.getElementById('report-stats');

    title.innerText = success ? '🎉 ¡Misión Completada con Éxito!' : '⚠️ Misión Abortada';
    desc.innerText = message;

    statsBox.innerHTML = `
        <div><small style="color:#94a3b8;">DESTINO</small><br><strong>${GAME_STATE.selectedMission.name}</strong></div>
        <div><small style="color:#94a3b8;">ROL EJERCIDO</small><br><strong>${GAME_STATE.selectedRole.short}</strong></div>
        <div><small style="color:#94a3b8;">SALDO TOTAL</small><br><strong style="color:#fbbf24;">${GAME_STATE.credits} CR</strong></div>
    `;

    modal.classList.remove('hidden');
    document.getElementById('return-hub-btn').onclick = returnToControlCenter;
}
