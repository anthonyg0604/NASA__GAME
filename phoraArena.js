let arenaScene, arenaCamera, arenaRenderer, arenaAnimId;
var arenaPhase = 'flight_out'; // 'flight_out' | 'base_ops' | 'flight_back'
var arenaKeys = {};
let arenaLastTime = 0;

// Variables fase de vuelo espacial
let flightRocket = null;
let targetPlanetObj = null;
let asteroids = [];
let starField = null;
let shipShield = 100;
let maxShipShield = 100;
let flightProgress = 0;

// Variables fase complejo espacial 114x114 (25 sectores tipo Backrooms)
let baseAstroRig = null;
let baseAstroVelY = 0;
let baseAstroGrounded = true;
let remoteBaseAstros = {};
let baseColliders = [];
let roleTerminals = [];
let flickeringLights = [];
let activeTerminal = null;
var isTaskModalOpen = false;
let completedTaskIds = new Set();
let suitOxygen = 135;
let maxSuitOxygen = 135;
var baseCamYaw = 0;
let botTaskTimer = 0;

function startPhoraArena() {
    const container = document.getElementById('arena-container');
    container.classList.remove('hidden');
    resetAllInputStates();

    const role = GAME_STATE.selectedRole;
    const stats = GAME_STATE.getShipTotalStats();

    maxShipShield = 100 + stats.shieldBonus;
    shipShield = maxShipShield;
    flightProgress = 0;

    maxSuitOxygen = 135 + stats.o2Bonus;
    suitOxygen = maxSuitOxygen;
    completedTaskIds = new Set();
    isTaskModalOpen = false;
    activeTerminal = null;
    botTaskTimer = 0;

    MP.resetMissionTaskState();

    document.getElementById('arena-role-badge').innerText = `ROL: ${role.short.toUpperCase()}`;
    document.getElementById('samples-counter').innerText = `📋 Tareas ${role.short}: 0 / ${role.tasks.length}`;

    setupArenaEvents();
    initFlightPhase('flight_out');
}

function setupArenaEvents() {
    const webglHolder = document.getElementById('arena-webgl-container');

    window.onkeydown = e => {
        if (document.getElementById('arena-container').classList.contains('hidden')) return;

        if (e.code === 'Escape') {
            if (isTaskModalOpen) {
                closeTaskModal();
                return;
            }
            if (!isAnyGameModalOpen() && !document.pointerLockElement && arenaPhase === 'base_ops') {
                if (performance.now() - lastPointerUnlockAt > 160) {
                    lockGamePointer();
                }
            }
            return;
        }

        if (isAnyGameModalOpen()) return;
        arenaKeys[e.code] = true;

        if (arenaPhase === 'base_ops' && !isTaskModalOpen) {
            if (e.code === 'Space' && baseAstroGrounded) {
                baseAstroVelY = 0.25;
                baseAstroGrounded = false;
            }
            if (e.code === 'KeyE' && activeTerminal && !completedTaskIds.has(activeTerminal.id)) {
                const lockInfo = getTaskLockInfo(GAME_STATE.selectedRole.id, activeTerminal.taskIndex);
                if (!lockInfo.locked) {
                    openTaskMinigame(activeTerminal);
                }
            }
        }
    };

    window.onkeyup = e => {
        arenaKeys[e.code] = false;
    };

    webglHolder.onmousedown = e => {
        if (e.button === 2) return;
        if (!isAnyGameModalOpen() && arenaPhase === 'base_ops') {
            lockGamePointer();
        }
    };

    document.getElementById('arena-interact-prompt').onclick = () => {
        if (activeTerminal && !isTaskModalOpen && !completedTaskIds.has(activeTerminal.id)) {
            const lockInfo = getTaskLockInfo(GAME_STATE.selectedRole.id, activeTerminal.taskIndex);
            if (!lockInfo.locked) {
                openTaskMinigame(activeTerminal);
            }
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
    resetAllInputStates();
    const holder = document.getElementById('arena-webgl-container');
    holder.innerHTML = '';

    arenaScene = new THREE.Scene();
    arenaCamera = new THREE.PerspectiveCamera(58, holder.clientWidth / holder.clientHeight, 0.1, 180);
    arenaRenderer = new THREE.WebGLRenderer({ antialias: true });
    arenaRenderer.setSize(holder.clientWidth, holder.clientHeight);
    arenaRenderer.shadowMap.enabled = true;
    holder.appendChild(arenaRenderer.domElement);
}

// =========================================================================
// COOPERACIÓN DINÁMICA PARA 5 MISIONES (1, 2, 3 O 4 JUGADORES + DESCONEXIONES)
// =========================================================================
function getTaskLockInfo(roleId, taskIndex) {
    // Misiones 1, 3 y 5 (índices 0, 2, 4) siempre son independientes.
    // Misión 2 (índice 1) y Misión 4 (índice 3) requieren cooperación si hay >= 2 roles activos.
    if (taskIndex !== 1 && taskIndex !== 3) return { locked: false };

    const activeRoles = MP.getActiveRolesInMatch();
    // Si solo queda 1 jugador (o se desconectaron los demás), nada se bloquea
    if (activeRoles.length <= 1) return { locked: false };

    const myIdx = activeRoles.indexOf(roleId);
    if (myIdx === -1) return { locked: false };

    // Rotar dependencia entre los jugadores activos actuales
    const partnerIdx = taskIndex === 1
        ? (myIdx - 1 + activeRoles.length) % activeRoles.length
        : (myIdx + 1) % activeRoles.length;

    const partnerRoleId = activeRoles[partnerIdx];
    if (!partnerRoleId || partnerRoleId === roleId) return { locked: false };

    const partnerRole = GAME_DATA.roles.find(r => r.id === partnerRoleId);
    if (!partnerRole) return { locked: false };

    const requiredTaskIndex = taskIndex === 1 ? 0 : 2;
    const requiredTask = partnerRole.tasks[requiredTaskIndex];
    const partnerDoneList = MP.completedTasksByRole[partnerRoleId] || [];
    const isPartnerDone = partnerDoneList.includes(requiredTask.id);

    if (isPartnerDone) {
        return { locked: false };
    }

    return {
        locked: true,
        partnerRoleName: partnerRole.short,
        partnerTaskIndex: requiredTaskIndex + 1,
        partnerTaskTitle: requiredTask.title
    };
}

function onRemoteTaskStateUpdated() {
    if (arenaPhase !== 'base_ops') return;
    refreshTerminalsVisualState();
    updateBaseCompassHint();
}

function refreshTerminalsVisualState() {
    const role = GAME_STATE.selectedRole;
    roleTerminals.forEach(t => {
        if (completedTaskIds.has(t.id)) {
            t.screenMat.color.setHex(0x10b981);
            t.screenMat.emissive.setHex(0x10b981);
            t.beacon.visible = false;
            return;
        }
        const lockInfo = getTaskLockInfo(role.id, t.taskIndex);
        if (lockInfo.locked) {
            t.screenMat.color.setHex(0xef4444);
            t.screenMat.emissive.setHex(0x991b1b);
            t.beacon.material.color.setHex(0xef4444);
        } else {
            t.screenMat.color.setHex(role.colorHex);
            t.screenMat.emissive.setHex(role.colorHex);
            t.beacon.material.color.setHex(role.colorHex);
        }
    });
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

    const starGeo = new THREE.BufferGeometry();
    const verts = [];
    for (let i = 0; i < 900; i++) {
        verts.push((Math.random() - 0.5) * 90, (Math.random() - 0.5) * 65, -Math.random() * 140);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    starField = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.28 }));
    arenaScene.add(starField);

    targetPlanetObj = createHDPlanet(isReturn ? 'earth' : mission.id, 18);
    targetPlanetObj.group.position.set(0, 6, -125);
    arenaScene.add(targetPlanetObj.group);

    flightRocket = buildCustom3DRocket(true);
    flightRocket.rotation.x = -Math.PI / 2;
    flightRocket.scale.setScalar(0.75);
    flightRocket.position.set(0, 0, 4);
    arenaScene.add(flightRocket);

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

    MP.tickNetworkHealth();

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
                    unlockGamePointer();
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
            unlockGamePointer();
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
// FASE 2: COMPLEJO ESPACIAL TIPO BACKROOMS 114x114 (25 SECTORES DECORADOS)
// =========================================================================
function initPlanetaryBasePhase() {
    arenaPhase = 'base_ops';
    baseColliders = [];
    roleTerminals = [];
    remoteBaseAstros = {};
    flickeringLights = [];
    baseCamYaw = 0;

    resetArenaRenderer();

    const mission = GAME_STATE.selectedMission;
    const role = GAME_STATE.selectedRole;

    arenaScene.background = new THREE.Color(0x040812);
    arenaScene.fog = new THREE.Fog(0x050a16, 26, 76);

    document.getElementById('arena-phase-title').innerText = `🏛️ Complejo Espacial — ${mission.name}`;
    document.getElementById('primary-bar-label').innerText = `🫁 Oxígeno Traje: 100%`;
    document.getElementById('primary-bar-fill').className = 'progress-fill green';
    document.getElementById('primary-bar-fill').style.width = '100%';

    document.getElementById('secondary-bar-label').innerText = `📋 Tareas de ${role.short}: 0/${role.tasks.length}`;
    document.getElementById('secondary-bar-fill').className = 'progress-fill cyan';
    document.getElementById('secondary-bar-fill').style.width = '0%';

    arenaScene.add(new THREE.AmbientLight(0x94a3b8, 0.72));

    buildBackroomsSpaceshipComplex(mission);
    buildRoleSpecificTerminals(role);
    refreshTerminalsVisualState();

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
    lockGamePointer();

    arenaLastTime = performance.now();
    animatePlanetaryBase();
}

function addSolidWallBox(cx, cz, widthX, depthZ, heightY, wallMat, trimMat, topTrimMat) {
    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(widthX, heightY, depthZ),
        wallMat
    );
    wall.position.set(cx, heightY / 2, cz);
    wall.castShadow = true;
    wall.receiveShadow = true;
    arenaScene.add(wall);

    if (trimMat) {
        const bottomTrim = new THREE.Mesh(
            new THREE.BoxGeometry(widthX + 0.08, 0.24, depthZ + 0.08),
            trimMat
        );
        bottomTrim.position.set(cx, 0.35, cz);
        arenaScene.add(bottomTrim);
    }

    if (topTrimMat) {
        const upperTrim = new THREE.Mesh(
            new THREE.BoxGeometry(widthX + 0.08, 0.18, depthZ + 0.08),
            topTrimMat
        );
        upperTrim.position.set(cx, heightY - 0.85, cz);
        arenaScene.add(upperTrim);
    }

    baseColliders.push({
        minX: cx - widthX / 2 - 0.55,
        maxX: cx + widthX / 2 + 0.55,
        minZ: cz - depthZ / 2 - 0.55,
        maxZ: cz + depthZ / 2 + 0.55
    });
}

function decorateSpaceshipComplex(mission, sectorCenters, wallH) {
    const ribMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.65 });
    const darkRackMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.35, metalness: 0.7 });
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.3, metalness: 0.8 });
    const hazardMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309, emissiveIntensity: 0.35 });
    const screenBlueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0ea5e9, emissiveIntensity: 0.65 });
    const screenGreenMat = new THREE.MeshStandardMaterial({ color: 0x059669, emissive: 0x10b981, emissiveIntensity: 0.55 });
    const viewportGlassMat = new THREE.MeshBasicMaterial({ color: 0x020617 });

    const pillarGeo = new THREE.BoxGeometry(0.85, wallH, 0.85);
    const rackGeo = new THREE.BoxGeometry(2.4, 3.6, 0.75);
    const rackScreenGeo = new THREE.BoxGeometry(1.9, 1.1, 0.08);
    const pipeGeo = new THREE.CylinderGeometry(0.14, 0.14, 21.5, 10);
    const hazardGeo = new THREE.BoxGeometry(2.6, 0.22, 0.12);
    const viewportFrameGeo = new THREE.BoxGeometry(6.4, 2.6, 0.28);
    const viewportGlassGeo = new THREE.BoxGeometry(5.9, 2.1, 0.32);

    // 1. Pilares estructurales en las intersecciones internas de la nave (4x4 = 16 columnas maestras)
    const wallLines = [-33.75, -11.25, 11.25, 33.75];
    wallLines.forEach(wx => {
        wallLines.forEach(wz => {
            const col = new THREE.Mesh(pillarGeo, ribMat);
            col.position.set(wx, wallH / 2, wz);
            arenaScene.add(col);

            const ring = new THREE.Mesh(
                new THREE.BoxGeometry(1.02, 0.32, 1.02),
                new THREE.MeshBasicMaterial({ color: mission.accentColor })
            );
            ring.position.set(wx, 2.4, wz);
            arenaScene.add(ring);

            baseColliders.push({
                minX: wx - 0.9,
                maxX: wx + 0.9,
                minZ: wz - 0.9,
                maxZ: wz + 0.9
            });
        });
    });

    // 2. Tuberías superiores y luces de techo tipo Backrooms en los 25 sectores
    sectorCenters.forEach((sx, ix) => {
        sectorCenters.forEach((sz, iz) => {
            // Luminaria fluorescente empotrada en techo
            const isFlicker = (ix + iz) % 5 === 2;
            const lampMat = new THREE.MeshBasicMaterial({ color: isFlicker ? 0xfef08a : 0xe0f2fe });
            const lamp = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.22, 1.4), lampMat);
            lamp.position.set(sx, wallH - 0.05, sz);
            arenaScene.add(lamp);

            // Solo iluminar estratégicamente para mantener 60 FPS fluidos
            if ((ix + iz) % 2 === 0) {
                const pLight = new THREE.PointLight(isFlicker ? 0xfde047 : mission.accentColor, 0.85, 34);
                pLight.position.set(sx, wallH - 1.5, sz);
                arenaScene.add(pLight);
                if (isFlicker) {
                    flickeringLights.push({ light: pLight, mesh: lamp, seed: ix * 7 + iz * 13 });
                }
            }

            // Tuberías industriales paralelas cerca del techo
            const pipeX = new THREE.Mesh(pipeGeo, pipeMat);
            pipeX.rotation.z = Math.PI / 2;
            pipeX.position.set(sx, wallH - 1.15, sz - 8.8);
            arenaScene.add(pipeX);

            const pipeZ = new THREE.Mesh(pipeGeo, pipeMat);
            pipeZ.rotation.x = Math.PI / 2;
            pipeZ.position.set(sx - 8.8, wallH - 1.45, sz);
            arenaScene.add(pipeZ);

            // Racks de servidores / consolas decorativas en esquinas libres de los sectores
            if ((ix * 3 + iz) % 2 === 0 && !(ix === 2 && iz === 2)) {
                const rack = new THREE.Mesh(rackGeo, darkRackMat);
                rack.position.set(sx + 7.6, 1.8, sz + 7.6);
                rack.rotation.y = -Math.PI / 4;
                arenaScene.add(rack);

                const scr = new THREE.Mesh(rackScreenGeo, (ix + iz) % 4 === 0 ? screenBlueMat : screenGreenMat);
                scr.position.set(sx + 7.32, 2.35, sz + 7.32);
                scr.rotation.y = -Math.PI / 4;
                arenaScene.add(scr);

                const haz = new THREE.Mesh(hazardGeo, hazardMat);
                haz.position.set(sx + 7.32, 0.45, sz + 7.32);
                haz.rotation.y = -Math.PI / 4;
                arenaScene.add(haz);
            }
        });
    });

    // 3. Ventanales espaciales blindados en los muros exteriores (evitando las posiciones de terminales)
    const windowOffsets = [-33.75, -11.25, 11.25, 33.75];
    windowOffsets.forEach(coord => {
        // Muro Norte y Sur
        [-55.45, 55.45].forEach(zWall => {
            const frame = new THREE.Mesh(viewportFrameGeo, ribMat);
            frame.position.set(coord, 4.4, zWall);
            arenaScene.add(frame);

            const glass = new THREE.Mesh(viewportGlassGeo, viewportGlassMat);
            glass.position.set(coord, 4.4, zWall);
            arenaScene.add(glass);

            // Estrellas visibles dentro del ventanal
            for (let s = -2; s <= 2; s += 2) {
                const starDot = new THREE.Mesh(
                    new THREE.SphereGeometry(0.08, 6, 6),
                    new THREE.MeshBasicMaterial({ color: 0xe0f2fe })
                );
                starDot.position.set(coord + s * 0.9, 4.4 + (s % 2) * 0.4, zWall + (zWall < 0 ? 0.18 : -0.18));
                arenaScene.add(starDot);
            }
        });

        // Muro Oeste y Este
        [-55.45, 55.45].forEach(xWall => {
            const frame = new THREE.Mesh(viewportFrameGeo, ribMat);
            frame.rotation.y = Math.PI / 2;
            frame.position.set(xWall, 4.4, coord);
            arenaScene.add(frame);

            const glass = new THREE.Mesh(viewportGlassGeo, viewportGlassMat);
            glass.rotation.y = Math.PI / 2;
            glass.position.set(xWall, 4.4, coord);
            arenaScene.add(glass);
        });
    });
}

function buildBackroomsSpaceshipComplex(mission) {
    const WALL_H = 11.0;
    const WALL_T = 1.4;
    const SPAN = 112.5; // 5 sectores x 22.5 = 112.5 (-56.25 a +56.25)

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(SPAN + 4, SPAN + 4),
        new THREE.MeshStandardMaterial({ color: 0x0b1222, roughness: 0.42, metalness: 0.35 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    arenaScene.add(floor);

    const grid = new THREE.GridHelper(SPAN, 50, mission.accentColor, 0x1e293b);
    grid.position.y = 0.01;
    arenaScene.add(grid);

    const ceiling = new THREE.Mesh(
        new THREE.BoxGeometry(SPAN + 6, 0.8, SPAN + 6),
        new THREE.MeshStandardMaterial({ color: 0x070d1a, roughness: 0.75, side: THREE.DoubleSide })
    );
    ceiling.position.set(0, WALL_H + 0.4, 0);
    arenaScene.add(ceiling);

    const outerWallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.3 });
    const innerWallMat = new THREE.MeshStandardMaterial({ color: 0x243247, roughness: 0.48, metalness: 0.28 });
    const trimMat = new THREE.MeshBasicMaterial({ color: mission.accentColor });
    const upperTrimMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    // 4 Muros Exteriores Blindados (±56.25)
    addSolidWallBox(0, -56.25, SPAN + WALL_T, WALL_T, WALL_H, outerWallMat, trimMat, upperTrimMat);
    addSolidWallBox(0, 56.25, SPAN + WALL_T, WALL_T, WALL_H, outerWallMat, trimMat, upperTrimMat);
    addSolidWallBox(-56.25, 0, WALL_T, SPAN + WALL_T, WALL_H, outerWallMat, trimMat, upperTrimMat);
    addSolidWallBox(56.25, 0, WALL_T, SPAN + WALL_T, WALL_H, outerWallMat, trimMat, upperTrimMat);

    // Laberinto 5x5 con conectividad 100% garantizada (Árbol de expansión + corredores extra)
    const sectorCenters = [-45, -22.5, 0, 22.5, 45];
    const doorHalf = 2.6;

    // Conjuntos de puertas abiertas:
    // vOpen["ix_iz"] = true si hay puerta en el muro vertical entre (ix, iz) y (ix+1, iz)
    // hOpen["ix_iz"] = true si hay puerta en el muro horizontal entre (ix, iz) y (ix, iz+1)
    const vOpen = {};
    const hOpen = {};

    // 1. Generar árbol de expansión determinista para garantizar que los 25 sectores estén conectados
    const visited = Array.from({ length: 5 }, () => Array(5).fill(false));
    function carveMaze(cx, cz) {
        visited[cx][cz] = true;
        const dirs = [
            { dx: 1, dz: 0, order: (cx * 7 + cz * 3) % 4 },
            { dx: -1, dz: 0, order: (cx * 5 + cz * 11) % 4 },
            { dx: 0, dz: 1, order: (cx * 13 + cz * 2) % 4 },
            { dx: 0, dz: -1, order: (cx * 3 + cz * 17) % 4 }
        ].sort((a, b) => a.order - b.order);

        dirs.forEach(d => {
            const nx = cx + d.dx;
            const nz = cz + d.dz;
            if (nx >= 0 && nx < 5 && nz >= 0 && nz < 5 && !visited[nx][nz]) {
                if (d.dx === 1) vOpen[`${cx}_${cz}`] = true;
                if (d.dx === -1) vOpen[`${nx}_${cz}`] = true;
                if (d.dz === 1) hOpen[`${cx}_${cz}`] = true;
                if (d.dz === -1) hOpen[`${cx}_${nz}`] = true;
                carveMaze(nx, nz);
            }
        });
    }
    carveMaze(2, 2);

    // 2. Abrir bucles adicionales (~50% de muros restantes) para crear rutas alternativas estilo Backrooms
    for (let ix = 0; ix < 4; ix++) {
        for (let iz = 0; iz < 5; iz++) {
            if ((ix + iz) % 2 === 0 || (ix === 1 && iz === 2) || (ix === 2 && iz === 2)) {
                vOpen[`${ix}_${iz}`] = true;
            }
        }
    }
    for (let ix = 0; ix < 5; ix++) {
        for (let iz = 0; iz < 4; iz++) {
            if ((ix * 2 + iz) % 2 === 1 || (ix === 2 && iz === 1) || (ix === 2 && iz === 2)) {
                hOpen[`${ix}_${iz}`] = true;
            }
        }
    }

    // Construir los 4 muros internos verticales (x = -33.75, -11.25, 11.25, 33.75)
    for (let ix = 0; ix < 4; ix++) {
        const wallX = -33.75 + ix * 22.5;
        for (let iz = 0; iz < 5; iz++) {
            const centerZ = sectorCenters[iz];
            const segStart = centerZ - 11.25;
            const segEnd = centerZ + 11.25;

            if (vOpen[`${ix}_${iz}`]) {
                // Muro con compuerta abierta
                const leftLen = (centerZ - doorHalf) - segStart;
                const rightLen = segEnd - (centerZ + doorHalf);
                addSolidWallBox(wallX, segStart + leftLen / 2, 1.1, leftLen, WALL_H, innerWallMat, trimMat, upperTrimMat);
                addSolidWallBox(wallX, (centerZ + doorHalf) + rightLen / 2, 1.1, rightLen, WALL_H, innerWallMat, trimMat, upperTrimMat);

                const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.1, WALL_H - 4.8, doorHalf * 2), innerWallMat);
                lintel.position.set(wallX, 4.8 + (WALL_H - 4.8) / 2, centerZ);
                arenaScene.add(lintel);

                const doorFrameGlow = new THREE.Mesh(
                    new THREE.BoxGeometry(1.22, 0.22, doorHalf * 2),
                    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
                );
                doorFrameGlow.position.set(wallX, 4.85, centerZ);
                arenaScene.add(doorFrameGlow);
            } else {
                // Mamparo cerrado completo (obliga a rodear por el laberinto)
                addSolidWallBox(wallX, centerZ, 1.1, 22.5, WALL_H, innerWallMat, trimMat, upperTrimMat);
            }
        }
    }

    // Construir los 4 muros internos horizontales (z = -33.75, -11.25, 11.25, 33.75)
    for (let iz = 0; iz < 4; iz++) {
        const wallZ = -33.75 + iz * 22.5;
        for (let ix = 0; ix < 5; ix++) {
            const centerX = sectorCenters[ix];
            const segStart = centerX - 11.25;
            const segEnd = centerX + 11.25;

            if (hOpen[`${ix}_${iz}`]) {
                const leftLen = (centerX - doorHalf) - segStart;
                const rightLen = segEnd - (centerX + doorHalf);
                addSolidWallBox(segStart + leftLen / 2, wallZ, leftLen, 1.1, WALL_H, innerWallMat, trimMat, upperTrimMat);
                addSolidWallBox((centerX + doorHalf) + rightLen / 2, wallZ, rightLen, 1.1, WALL_H, innerWallMat, trimMat, upperTrimMat);

                const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorHalf * 2, WALL_H - 4.8, 1.1), innerWallMat);
                lintel.position.set(centerX, 4.8 + (WALL_H - 4.8) / 2, wallZ);
                arenaScene.add(lintel);

                const doorFrameGlow = new THREE.Mesh(
                    new THREE.BoxGeometry(doorHalf * 2, 0.22, 1.22),
                    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
                );
                doorFrameGlow.position.set(centerX, 4.85, wallZ);
                arenaScene.add(doorFrameGlow);
            } else {
                addSolidWallBox(centerX, wallZ, 22.5, 1.1, WALL_H, innerWallMat, trimMat, upperTrimMat);
            }
        }
    }

    // Decoraciones detalladas de nave espacial en todos los corredores y muros
    decorateSpaceshipComplex(mission, sectorCenters, WALL_H);

    // Letreros superiores de los 25 sectores
    const sectorNames = [
        ['ESCUDOS (NW)', 'ENLACE SATELITAL', 'PUENTE PRINCIPAL (N)', 'GIROSCOPIOS', 'CRIOGENIA (NE)'],
        ['REFRIGERACIÓN', 'CORREDOR ALFA-2', 'TIMÓN CENTRAL-N', 'CORREDOR BETA-2', 'INVERNADERO LED'],
        ['REACTOR (W)', 'BALIZA CENTRAL', 'NÚCLEO CENTRAL', 'ANALIZADOR ATMO', 'LABORATORIO (E)'],
        ['CORREDOR GAMMA-4', 'PASILLO SUR-OESTE', 'TURBINAS CENTRAL-S', 'PASILLO SUR-ESTE', 'RADAR ESPACIAL'],
        ['SUBESTACIÓN (SW)', 'ESCÁNER GEOLÓGICO', 'ANTENAS SUR (S)', 'BAHÍA AUXILIAR', 'PROPULSORES (SE)']
    ];

    for (let iz = 0; iz < 5; iz++) {
        for (let ix = 0; ix < 5; ix++) {
            const label = sectorNames[iz][ix];
            const sprite = createConsoleLabelSprite(label, '#38bdf8');
            sprite.scale.set(5.4, 1.15, 1);
            sprite.position.set(sectorCenters[ix], 7.8, sectorCenters[iz]);
            arenaScene.add(sprite);
        }
    }
}

function buildRoleSpecificTerminals(role) {
    roleTerminals = [];

    role.tasks.forEach((task, taskIndex) => {
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
        roleTerminals.push({ ...task, taskIndex, group, screenMat, beacon });
    });
}

function updateBaseCompassHint() {
    const pending = roleTerminals.filter(t => !completedTaskIds.has(t.id));
    const hintEl = document.getElementById('arena-hint');
    if (!hintEl) return;

    if (pending.length === 0) {
        hintEl.innerHTML = '✅ <b>¡Tus 5 tareas completadas!</b> Preparando regreso orbital...';
        return;
    }

    const myRoleId = GAME_STATE.selectedRole.id;
    const unlockedTask = pending.find(t => !getTaskLockInfo(myRoleId, t.taskIndex).locked);

    if (unlockedTask) {
        hintEl.innerHTML = `🎯 Pendientes (${pending.length}/5): <b>${unlockedTask.title}</b> en <b>${unlockedTask.roomName}</b> • <b>[E]</b> Operar`;
    } else {
        const blocked = pending[0];
        const lockInfo = getTaskLockInfo(myRoleId, blocked.taskIndex);
        hintEl.innerHTML = `🔒 <b>${blocked.title}</b> espera a que <b>${lockInfo.partnerRoleName}</b> complete su Tarea ${lockInfo.partnerTaskIndex}`;
    }
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
    pos.x = Math.max(-55.0, Math.min(55.0, pos.x));
    pos.z = Math.max(-55.0, Math.min(55.0, pos.z));
}

function clampBaseCameraInsideWalls(camPos, targetPos) {
    camPos.y = Math.min(9.2, Math.max(1.8, camPos.y));
    camPos.x = Math.max(-54.8, Math.min(54.8, camPos.x));
    camPos.z = Math.max(-54.8, Math.min(54.8, camPos.z));

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
    MP.updateBots(dt, 48);

    if (MP.isHost) {
        botTaskTimer += dt;
        if (botTaskTimer >= 8) {
            botTaskTimer = 0;
            Object.values(MP.players).forEach(p => {
                if (!p.isBot) return;
                const botRole = GAME_DATA.roles.find(r => r.id === p.roleId);
                if (!botRole) return;
                const doneList = MP.completedTasksByRole[botRole.id] || [];
                const nextBotTask = botRole.tasks.find(t => !doneList.includes(t.id));
                if (nextBotTask) {
                    MP.reportTaskCompleted(botRole.id, nextBotTask.id);
                    onRemoteTaskStateUpdated();
                }
            });
        }
    }

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

    MP.tickNetworkHealth();

    // Efecto sutil de parpadeo tipo Backrooms en luces seleccionadas
    flickeringLights.forEach(fl => {
        const wave = Math.sin(elapsed * 19 + fl.seed) * Math.cos(elapsed * 7 + fl.seed);
        const dim = wave > 0.78 ? 0.25 : 0.85;
        fl.light.intensity = dim;
    });

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
            unlockGamePointer();
            showMissionReport(false, 'Se agotó el oxígeno de tu traje espacial en el complejo. Equipa alas o fuselaje de largo alcance para mayor reserva.');
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

            const speed = (arenaKeys['ShiftLeft'] || arenaKeys['ShiftRight']) ? 0.24 : 0.16;
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
            const lockInfo = getTaskLockInfo(GAME_STATE.selectedRole.id, activeTerminal.taskIndex);
            if (lockInfo.locked) {
                promptBtn.innerHTML = `🔒 Bloqueado: Espera a que <strong>${lockInfo.partnerRoleName}</strong> complete su Tarea ${lockInfo.partnerTaskIndex} (<em>${lockInfo.partnerTaskTitle}</em>)`;
            } else {
                promptBtn.innerHTML = `Presiona <strong>[E]</strong> o haz clic para operar: <span id="arena-task-name">${activeTerminal.title}</span>`;
            }
            promptBtn.classList.remove('hidden');
        } else {
            promptBtn.classList.add('hidden');
        }

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
// MINIJUEGOS CON VERIFICACIÓN CIENTÍFICA NASA CORTA
// =========================================================================
function closeTaskModal() {
    isTaskModalOpen = false;
    resetAllInputStates();
    document.getElementById('planet-task-modal').classList.add('hidden');
    if (arenaPhase === 'base_ops') {
        lockGamePointer();
    }
}

function completeCurrentTask(task) {
    completedTaskIds.add(task.id);
    MP.reportTaskCompleted(GAME_STATE.selectedRole.id, task.id);
    refreshTerminalsVisualState();

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
    resetAllInputStates();
    unlockGamePointer();

    const modal = document.getElementById('planet-task-modal');
    const title = document.getElementById('task-modal-title');
    const body = document.getElementById('task-modal-body');

    title.innerText = `${task.title} — ${task.roomName}`;
    modal.classList.remove('hidden');

    body.innerHTML = `
        <div class="minigame-box">
            <div style="background:rgba(56,189,248,0.14); border:1px solid #38bdf8; border-radius:10px; padding:10px 12px; margin-bottom:12px; font-size:0.86rem; color:#e0f2fe;">
                🛰️ <strong>Dato NASA:</strong> ${task.nasaFact}
            </div>
            <p style="font-weight:700; color:#f8fafc; margin-bottom:10px; font-size:0.95rem;">
                ${task.nasaQuestion}
            </p>
            <div style="display:flex; flex-direction:column; gap:8px;">
                ${task.nasaOptions.map((opt, idx) => `
                    <button class="option-card nasa-opt-btn" data-opt="${idx}" style="text-align:center; font-weight:600;">
                        ${opt}
                    </button>
                `).join('')}
            </div>
            <p id="nasa-quiz-msg" style="color:#fbbf24; font-weight:600; margin-top:10px; min-height:20px;"></p>
        </div>
    `;

    body.querySelectorAll('.nasa-opt-btn').forEach(btn => {
        btn.onclick = () => {
            const chosen = parseInt(btn.dataset.opt, 10);
            if (chosen === task.correctIdx) {
                renderTerminalControlStep(task, body);
            } else {
                document.getElementById('nasa-quiz-msg').innerText = '⚠️ Respuesta incorrecta. Revisa el dato NASA arriba e intenta otra opción.';
            }
        };
    });
}

function renderTerminalControlStep(task, body) {
    if (task.type === 'sequence') {
        const nums = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
        let expected = 1;
        body.innerHTML = `
            <div class="minigame-box">
                <p style="color:#cbd5e1;">Pulsa los nodos en orden ascendente (<strong>1 → 2 → 3 → 4</strong>):</p>
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
                    if (expected > 4) completeCurrentTask(task);
                } else {
                    expected = 1;
                    body.querySelectorAll('.seq-btn').forEach(b => b.classList.remove('done'));
                    document.getElementById('seq-msg').innerText = '⚠️ Orden incorrecto, secuencia reiniciada.';
                }
            };
        });

    } else if (task.type === 'timing') {
        body.innerHTML = `
            <div class="minigame-box">
                <p style="color:#cbd5e1;">Detén el cursor azul dentro de la <strong>zona verde central</strong>:</p>
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
        const targetVal = Math.floor(25 + Math.random() * 55);
        body.innerHTML = `
            <div class="minigame-box">
                <p style="color:#cbd5e1;">Ajusta el dial hasta alcanzar <strong style="color:#10b981; font-size:1.15rem;">${targetVal}.0 MHz</strong>:</p>
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
                document.getElementById('freq-msg').innerText = `⚠️ Acércate más a ${targetVal}.0 MHz.`;
            }
        };

    } else if (task.type === 'wires') {
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
                        if (connectedCount >= 4) completeCurrentTask(task);
                    } else {
                        selectedLeft.classList.remove('active');
                        selectedLeft = null;
                    }
                }
            };
        });

    } else if (task.type === 'temp') {
        let currentTemp = -12;
        const targetTemp = -45;
        body.innerHTML = `
            <div class="minigame-box">
                <p style="color:#cbd5e1;">Estabiliza la cámara criogénica a <strong style="color:#38bdf8;">${targetTemp}°C</strong>:</p>
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
            if (Math.abs(currentTemp - targetTemp) <= 3) completeCurrentTask(task);
        };

    } else {
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
                <p style="color:#cbd5e1;">Haz clic en los <strong>5 puntos rojos</strong> para soldar la compuerta:</p>
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
                if (sealed >= spots.length) completeCurrentTask(task);
            };
        });
    }
}

function showMissionReport(success, message) {
    unlockGamePointer();
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
