let arenaScene, arenaCamera, arenaRenderer, arenaAnimId;
var arenaPhase = 'flight_out'; // 'flight_out' | 'base_ops' | 'flight_back'
var arenaKeys = {};
let arenaLastTime = 0;

// Fase de vuelo espacial
let flightRocket = null;
let targetPlanetObj = null;
let asteroids = [];
let starField = null;
let shipShield = 100;
let maxShipShield = 100;
let flightProgress = 0;

// Fase complejo espacial 6x6 (ampliado con BASE_MAP_SCALE)
let baseAstroRig = null;
let baseAstroVelY = 0;
let baseAstroGrounded = true;
let remoteBaseAstros = {};
let baseColliders = [];
let radarWallSegments = [];
let roleTerminals = [];
let activeMissionTasks = [];
let flickeringLights = [];
let activeTerminal = null;
var isTaskModalOpen = false;
let completedTaskIds = new Set();
let suitOxygen = 110;
let maxSuitOxygen = 110;
var baseCamYaw = 0;
var baseCamPitch = 0.32;
const BASE_MAP_SCALE = 1.35;
let botTaskTimer = 0;

// Sistema de golpes / empujones amistosos entre participantes
let punchCooldown = 0;
let selfPunchAnimTimer = 0;
let selfStunTimer = 0;
let selfKnockbackX = 0;
let selfKnockbackZ = 0;
let punchEffects = [];
let lastPunchToastAt = 0;
let arenaAudioCtx = null;

function playPlayfulPunchSound(isHit) {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!arenaAudioCtx) arenaAudioCtx = new AudioCtx();
        if (arenaAudioCtx.state === 'suspended') arenaAudioCtx.resume();

        const now = arenaAudioCtx.currentTime;
        const osc = arenaAudioCtx.createOscillator();
        const gain = arenaAudioCtx.createGain();

        if (isHit) {
            // Sonido cómico "boing / bonk"
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(190, now);
            osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.24);
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.connect(gain);
            gain.connect(arenaAudioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.26);
        } else {
            // Sonido suave de aire al lanzar el golpe
            osc.type = 'sine';
            osc.frequency.setValueAtTime(340, now);
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
            gain.gain.setValueAtTime(0.09, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
            osc.connect(gain);
            gain.connect(arenaAudioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.14);
        }
    } catch (_) {}
}

function createComicBonkSprite(labelText) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(14, 14, 228, 68, 22);
    ctx.fill();
    ctx.stroke();

    ctx.font = '900 34px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fde047';
    ctx.fillText(labelText, 128, 50);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 1 });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(2.3, 0.86, 1);
    return sprite;
}

function spawnPunchImpactVisuals(worldX, worldY, worldZ, customWord) {
    if (!arenaScene) return;

    const words = ['¡BONK!', '¡ZAS!', '¡TOING!', '¡BOING!', '¡PAF!'];
    const word = customWord || words[Math.floor(Math.random() * words.length)];

    // Texto flotante cómico
    const sprite = createComicBonkSprite(word);
    sprite.position.set(worldX, worldY + 2.35, worldZ);
    arenaScene.add(sprite);

    // Onda expansiva en el aire
    const ringGeo = new THREE.RingGeometry(0.25, 0.45, 24);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(worldX, worldY + 1.0, worldZ);
    arenaScene.add(ring);

    // Estrellitas/chispas de impacto
    const sparks = [];
    const sparkColors = [0xfef08a, 0x38bdf8, 0xf97316, 0x34d399];
    for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const spark = new THREE.Mesh(
            new THREE.BoxGeometry(0.16, 0.16, 0.16),
            new THREE.MeshBasicMaterial({ color: sparkColors[i % sparkColors.length], transparent: true, opacity: 1 })
        );
        spark.position.set(worldX, worldY + 1.25, worldZ);
        arenaScene.add(spark);
        sparks.push({
            mesh: spark,
            vx: Math.cos(ang) * 3.4,
            vy: 2.1 + Math.random() * 1.4,
            vz: Math.sin(ang) * 3.4
        });
    }

    punchEffects.push({
        age: 0,
        maxAge: 0.85,
        sprite,
        ring,
        sparks
    });
}

function spawnAirWhooshVisual(rigGroup) {
    if (!arenaScene || !rigGroup) return;
    const rotY = rigGroup.rotation.y || 0;
    const fx = rigGroup.position.x + Math.sin(rotY) * 0.95;
    const fz = rigGroup.position.z + Math.cos(rotY) * 0.95;

    const arc = new THREE.Mesh(
        new THREE.TorusGeometry(0.45, 0.055, 8, 20, Math.PI * 0.9),
        new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.85 })
    );
    arc.position.set(fx, rigGroup.position.y + 1.15, fz);
    arc.rotation.y = rotY;
    arenaScene.add(arc);

    punchEffects.push({
        age: 0,
        maxAge: 0.24,
        ring: arc,
        sparks: []
    });
}

function handleNetworkPunchEvent(evt) {
    if (!evt || arenaPhase !== 'base_ops' || !arenaScene) return;
    const arenaEl = document.getElementById('arena-container');
    if (!arenaEl || arenaEl.classList.contains('hidden')) return;

    playPlayfulPunchSound(true);

    // Animar brazo del atacante remoto si no soy yo
    if (evt.attackerId !== MP.myId && remoteBaseAstros[evt.attackerId]) {
        remoteBaseAstros[evt.attackerId].punchTimer = 0.28;
    }

    // Coordenadas de impacto
    let hitX = 0;
    let hitY = 0;
    let hitZ = 0;

    if (evt.targetId === MP.myId && baseAstroRig && baseAstroRig.group) {
        hitX = baseAstroRig.group.position.x;
        hitY = baseAstroRig.group.position.y;
        hitZ = baseAstroRig.group.position.z;

        // Aplicar empujón amistoso + saltito cómico sin interrumpir minijuegos
        selfKnockbackX = (evt.kx || 0) * 0.34;
        selfKnockbackZ = (evt.kz || 0) * 0.34;
        selfStunTimer = 0.42;
        if (baseAstroGrounded) {
            baseAstroVelY = 0.13;
            baseAstroGrounded = false;
        }

        const now = performance.now();
        if (now - lastPunchToastAt > 3000 && typeof MP.showNetworkToast === 'function') {
            lastPunchToastAt = now;
            MP.showNetworkToast(`🥊 ¡${evt.attackerName} te dio un empujón amistoso!`, false);
        }
    } else if (remoteBaseAstros[evt.targetId]) {
        const targetRig = remoteBaseAstros[evt.targetId].rig;
        remoteBaseAstros[evt.targetId].stunTimer = 0.45;
        hitX = targetRig.group.position.x;
        hitY = targetRig.group.position.y;
        hitZ = targetRig.group.position.z;
    } else if (MP.players[evt.targetId]) {
        hitX = MP.players[evt.targetId].x || 0;
        hitY = MP.players[evt.targetId].y || 0;
        hitZ = MP.players[evt.targetId].z || 0;
    }

    spawnPunchImpactVisuals(hitX, hitY, hitZ);
}

function triggerPlayerPunch() {
    if (arenaPhase !== 'base_ops' || isTaskModalOpen || isAnyGameModalOpen()) return;
    if (!baseAstroRig || !baseAstroRig.group || punchCooldown > 0) return;

    punchCooldown = 0.55;
    selfPunchAnimTimer = 0.28;
    spawnAirWhooshVisual(baseAstroRig.group);

    const myPos = baseAstroRig.group.position;
    const facingX = Math.sin(baseAstroRig.group.rotation.y);
    const facingZ = Math.cos(baseAstroRig.group.rotation.y);

    let bestTarget = null;
    let bestDist = 2.45;

    Object.values(MP.players).forEach(p => {
        if (!p || p.id === MP.myId) return;
        const tx = remoteBaseAstros[p.id] ? remoteBaseAstros[p.id].rig.group.position.x : (p.x || 0);
        const tz = remoteBaseAstros[p.id] ? remoteBaseAstros[p.id].rig.group.position.z : (p.z || 0);

        const dx = tx - myPos.x;
        const dz = tz - myPos.z;
        const dist = Math.hypot(dx, dz);
        if (dist > bestDist) return;

        // Cono frontal generoso para golpear cómodo en tercera persona
        const dirX = dist > 0.001 ? dx / dist : facingX;
        const dirZ = dist > 0.001 ? dz / dist : facingZ;
        const dot = dirX * facingX + dirZ * facingZ;

        if (dot >= 0.05 || dist < 1.15) {
            bestDist = dist;
            bestTarget = { id: p.id, kx: dirX, kz: dirZ };
        }
    });

    if (bestTarget) {
        MP.sendPunch(bestTarget.id, bestTarget.kx, bestTarget.kz);
    } else {
        playPlayfulPunchSound(false);
    }
}

function startPhoraArena() {
    const container = document.getElementById('arena-container');
    container.classList.remove('hidden');
    document.getElementById('cc-controls-bar').classList.add('hidden');
    resetAllInputStates();

    const role = GAME_STATE.selectedRole;
    const stats = GAME_STATE.getShipTotalStats();

    maxShipShield = 100 + stats.shieldBonus;
    shipShield = maxShipShield;
    flightProgress = 0;

    // El oxígeno total se inicializa UNA SOLA VEZ al iniciar la misión y NUNCA se regenera al terminar tareas
    maxSuitOxygen = 115 + stats.o2Bonus;
    suitOxygen = maxSuitOxygen;
    completedTaskIds = new Set();
    isTaskModalOpen = false;
    activeTerminal = null;
    botTaskTimer = 0;

    punchCooldown = 0;
    selfPunchAnimTimer = 0;
    selfStunTimer = 0;
    selfKnockbackX = 0;
    selfKnockbackZ = 0;
    punchEffects = [];
    MP.onPunchCallback = handleNetworkPunchEvent;

    activeMissionTasks = getMissionTasksForRole(
        GAME_STATE.selectedMission.id,
        role.id,
        MP.roomCode
    );

    MP.resetMissionTaskState();

    document.getElementById('arena-role-badge').innerText = `ROL: ${role.short.toUpperCase()}`;
    document.getElementById('samples-counter').innerText = `📋 Tareas ${role.short}: 0 / ${activeMissionTasks.length}`;

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
                baseAstroVelY = 0.22;
                baseAstroGrounded = false;
            }
            if (e.code === 'KeyF') {
                triggerPlayerPunch();
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
        if (!isAnyGameModalOpen() && arenaPhase === 'base_ops' && !isTaskModalOpen) {
            if (document.pointerLockElement) {
                triggerPlayerPunch();
            } else {
                lockGamePointer();
            }
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

    const handleExitToRoomMenu = () => {
        stopArenaLoop();
        resetAllInputStates();
        unlockGamePointer();
        const radarBox = document.getElementById('sector-radar-box');
        if (radarBox) radarBox.classList.add('hidden');
        const arenaCont = document.getElementById('arena-container');
        if (arenaCont) arenaCont.classList.add('hidden');
        if (typeof MP !== 'undefined') {
            if (typeof MP.leaveCurrentRoom === 'function') MP.leaveCurrentRoom();
            else if (typeof MP.leaveRoom === 'function') MP.leaveRoom();
            else if (typeof MP.disconnect === 'function') MP.disconnect();
        }
        returnToControlCenter();
    };

    document.getElementById('abort-mission-btn').onclick = handleExitToRoomMenu;
    const backRoomBtn = document.getElementById('arena-back-room-btn');
    if (backRoomBtn) backRoomBtn.onclick = handleExitToRoomMenu;

    if (!window._arenaVerticalMouseBound) {
        window._arenaVerticalMouseBound = true;
        document.addEventListener('mousemove', e => {
            if (document.pointerLockElement && arenaPhase === 'base_ops' && !isTaskModalOpen && !isAnyGameModalOpen()) {
                baseCamPitch = Math.max(-0.35, Math.min(1.05, baseCamPitch + e.movementY * 0.0024));
            }
        });
    }
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
    arenaCamera = new THREE.PerspectiveCamera(58, holder.clientWidth / holder.clientHeight, 0.1, 220);
    arenaRenderer = new THREE.WebGLRenderer({ antialias: true });
    arenaRenderer.setSize(holder.clientWidth, holder.clientHeight);
    arenaRenderer.shadowMap.enabled = true;
    holder.appendChild(arenaRenderer.domElement);
}

// =========================================================================
// COOPERACIÓN DINÁMICA (1, 2, 3 O 4 JUGADORES + DESCONEXIONES)
// =========================================================================
function getTaskLockInfo(roleId, taskIndex) {
    if (taskIndex !== 1 && taskIndex !== 3) return { locked: false };

    const activeRoles = MP.getActiveRolesInMatch();
    if (activeRoles.length <= 1) return { locked: false };

    const myIdx = activeRoles.indexOf(roleId);
    if (myIdx === -1) return { locked: false };

    const partnerIdx = taskIndex === 1
        ? (myIdx - 1 + activeRoles.length) % activeRoles.length
        : (myIdx + 1) % activeRoles.length;

    const partnerRoleId = activeRoles[partnerIdx];
    if (!partnerRoleId || partnerRoleId === roleId) return { locked: false };

    const partnerRole = GAME_DATA.roles.find(r => r.id === partnerRoleId);
    if (!partnerRole) return { locked: false };

    const partnerTasks = getMissionTasksForRole(GAME_STATE.selectedMission.id, partnerRoleId, MP.roomCode);
    const requiredTaskIndex = taskIndex === 1 ? 0 : 2;
    const requiredTask = partnerTasks[requiredTaskIndex];
    const partnerDoneList = MP.completedTasksByRole[partnerRoleId] || [];

    if (partnerDoneList.includes(requiredTask.id)) {
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
// FASE 1 (IDA CON METEORITOS) Y FASE 3 (REGRESO AUTOMÁTICO SIN METEORITOS)
// =========================================================================
function initFlightPhase(phaseType) {
    arenaPhase = phaseType;
    flightProgress = 0;
    asteroids = [];
    document.getElementById('arena-interact-prompt').classList.add('hidden');
    document.getElementById('sector-radar-box').classList.add('hidden');

    resetArenaRenderer();
    arenaScene.background = new THREE.Color(0x030712);
    arenaScene.fog = new THREE.Fog(0x030712, 35, 130);

    arenaScene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const sun = new THREE.DirectionalLight(0xe0f2fe, 1.3);
    sun.position.set(12, 18, 15);
    arenaScene.add(sun);

    const mission = GAME_STATE.selectedMission;
    const isReturn = phaseType === 'flight_back';
    const hintBar = document.getElementById('arena-hint');

    document.getElementById('arena-phase-title').innerText = isReturn
        ? '🌍 Regreso Orbital Automático a la Tierra'
        : `🚀 Travesía hacia ${mission.name}`;

    document.getElementById('primary-bar-label').innerText = `🛡️ Escudo Nave: ${Math.round((shipShield / maxShipShield) * 100)}%`;
    document.getElementById('primary-bar-fill').className = 'progress-fill cyan';
    document.getElementById('secondary-bar-label').innerText = isReturn
        ? '🌍 Retorno a la Tierra: 0%'
        : `🪐 Progreso a ${mission.name}: 0%`;
    document.getElementById('secondary-bar-fill').className = 'progress-fill amber';
    document.getElementById('secondary-bar-fill').style.width = '0%';

    if (isReturn) {
        hintBar.classList.add('hidden');
    } else {
        hintBar.classList.remove('hidden');
        hintBar.innerHTML = 'Usa <b>W A S D</b> o <b>Flechas</b> para pilotar la nave y esquivar los meteoritos';
    }

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

    if (!isReturn) {
        const rockCount = mission.asteroidCount;
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
    const moveSpeed = 12 * stats.speedMult;
    const isReturn = arenaPhase === 'flight_back';

    if (flightRocket) {
        if (!isReturn) {
            let dx = 0;
            let dy = 0;
            if (arenaKeys['KeyA'] || arenaKeys['ArrowLeft']) dx -= 1;
            if (arenaKeys['KeyD'] || arenaKeys['ArrowRight']) dx += 1;
            if (arenaKeys['KeyW'] || arenaKeys['ArrowUp']) dy += 1;
            if (arenaKeys['KeyS'] || arenaKeys['ArrowDown']) dy -= 1;

            flightRocket.position.x = Math.max(-10.5, Math.min(10.5, flightRocket.position.x + dx * moveSpeed * dt));
            flightRocket.position.y = Math.max(-6.2, Math.min(6.2, flightRocket.position.y + dy * moveSpeed * dt));
            flightRocket.rotation.z = -dx * 0.35;
        } else {
            flightRocket.position.x += (0 - flightRocket.position.x) * 3 * dt;
            flightRocket.position.y += (0.4 - flightRocket.position.y) * 3 * dt;
            flightRocket.rotation.z = Math.sin(tNow * 0.002) * 0.06;
        }
        animateRocketExhaust(flightRocket, dt);
    }

    flightProgress += dt * (isReturn ? 16.5 : 8.2) * stats.speedMult;
    const pct = Math.min(100, Math.round(flightProgress));

    document.getElementById('secondary-bar-label').innerText = isReturn
        ? `🌍 Retorno a la Tierra: ${pct}%`
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

    if (!isReturn) {
        const rockSpeed = 26 * stats.speedMult;
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
    }

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
// FASE 2: COMPLEJO ESPACIAL AMPLIADO (36 SECTORES, PASILLOS LARGOS Y RADAR)
// =========================================================================
function initPlanetaryBasePhase() {
    arenaPhase = 'base_ops';
    baseColliders = [];
    radarWallSegments = [];
    roleTerminals = [];
    remoteBaseAstros = {};
    flickeringLights = [];
    punchEffects = [];
    punchCooldown = 0;
    selfPunchAnimTimer = 0;
    selfStunTimer = 0;
    selfKnockbackX = 0;
    selfKnockbackZ = 0;
    baseCamYaw = 0;
    baseCamPitch = 0.32;

    document.getElementById('sector-radar-box').classList.remove('hidden');
    document.getElementById('arena-hint').classList.remove('hidden');

    resetArenaRenderer();

    const mission = GAME_STATE.selectedMission;
    const role = GAME_STATE.selectedRole;

    arenaScene.background = new THREE.Color(0x040812);
    arenaScene.fog = new THREE.Fog(0x050a16, 32, 115);

    const o2Pct = Math.round((suitOxygen / maxSuitOxygen) * 100);
    document.getElementById('arena-phase-title').innerText = `🏛️ Estación Orbital — ${mission.name}`;
    document.getElementById('primary-bar-label').innerText = `🫁 Oxígeno Traje: ${o2Pct}%`;
    document.getElementById('primary-bar-fill').className = o2Pct <= 25 ? 'progress-fill red' : 'progress-fill green';
    document.getElementById('primary-bar-fill').style.width = `${o2Pct}%`;

    document.getElementById('secondary-bar-label').innerText = `📋 Tareas de ${role.short}: 0/${activeMissionTasks.length}`;
    document.getElementById('secondary-bar-fill').className = 'progress-fill cyan';
    document.getElementById('secondary-bar-fill').style.width = '0%';

    arenaScene.add(new THREE.AmbientLight(0x94a3b8, 0.78));

    buildSpaceshipCorridorComplex(mission);
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

function createSpaceshipHullTexture(accentHexCss) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#162033';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#0b1120';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 500);
    ctx.strokeRect(6, 170, 500, 172);
    ctx.beginPath();
    ctx.moveTo(256, 6);
    ctx.lineTo(256, 506);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    const rivets = [22, 236, 276, 490];
    const rows = [24, 150, 190, 322, 360, 488];
    rivets.forEach(rx => {
        rows.forEach(ry => {
            ctx.beginPath();
            ctx.arc(rx, ry, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    });

    ctx.fillStyle = '#090d16';
    ctx.fillRect(42, 46, 176, 78);
    ctx.fillStyle = '#334155';
    for (let y = 54; y < 118; y += 11) {
        ctx.fillRect(50, y, 160, 5);
    }

    ctx.fillStyle = '#0b1324';
    ctx.fillRect(290, 46, 176, 78);
    ctx.fillStyle = accentHexCss;
    ctx.fillRect(306, 64, 90, 8);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(306, 84, 130, 8);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(306, 102, 60, 8);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(10, 444, 492, 42);
    ctx.fillStyle = '#d97706';
    for (let x = -40; x < 520; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, 486);
        ctx.lineTo(x + 18, 486);
        ctx.lineTo(x + 34, 444);
        ctx.lineTo(x + 16, 444);
        ctx.closePath();
        ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
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
            new THREE.BoxGeometry(widthX + 0.1, 0.24, depthZ + 0.1),
            trimMat
        );
        bottomTrim.position.set(cx, 0.35, cz);
        arenaScene.add(bottomTrim);
    }

    if (topTrimMat) {
        const upperTrim = new THREE.Mesh(
            new THREE.BoxGeometry(widthX + 0.1, 0.2, depthZ + 0.1),
            topTrimMat
        );
        upperTrim.position.set(cx, heightY - 0.9, cz);
        arenaScene.add(upperTrim);
    }

    baseColliders.push({
        minX: cx - widthX / 2 - 0.55,
        maxX: cx + widthX / 2 + 0.55,
        minZ: cz - depthZ / 2 - 0.55,
        maxZ: cz + depthZ / 2 + 0.55
    });

    radarWallSegments.push({ cx, cz, widthX, depthZ });
}

function addInteriorCorridorChute(cx, cz, axis, wallMat, ribMat, accentMat) {
    const corridorLen = 11.5 * BASE_MAP_SCALE;
    const halfGap = 2.85 * BASE_MAP_SCALE;
    const wallThick = 0.85;
    const wallH = 11.0;
    const archOffsets = [-4.2, 0, 4.2].map(v => v * BASE_MAP_SCALE);

    if (axis === 'X') {
        addSolidWallBox(cx, cz - halfGap - wallThick / 2, corridorLen, wallThick, wallH, wallMat, accentMat, null);
        addSolidWallBox(cx, cz + halfGap + wallThick / 2, corridorLen, wallThick, wallH, wallMat, accentMat, null);

        archOffsets.forEach(ox => {
            const arch = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, halfGap * 2 + 0.4), ribMat);
            arch.position.set(cx + ox, 5.4, cz);
            arenaScene.add(arch);
        });
    } else {
        addSolidWallBox(cx - halfGap - wallThick / 2, cz, wallThick, corridorLen, wallH, wallMat, accentMat, null);
        addSolidWallBox(cx + halfGap + wallThick / 2, cz, wallThick, corridorLen, wallH, wallMat, accentMat, null);

        archOffsets.forEach(oz => {
            const arch = new THREE.Mesh(new THREE.BoxGeometry(halfGap * 2 + 0.4, 0.55, 0.45), ribMat);
            arch.position.set(cx, 5.4, cz + oz);
            arenaScene.add(arch);
        });
    }
}

function decorateSpaceshipComplex(mission, sectorCenters, wallH) {
    const ribMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.75 });
    const darkRackMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.75 });
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.28, metalness: 0.82 });
    const copperPipeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.35, metalness: 0.7 });
    const screenBlueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0ea5e9, emissiveIntensity: 0.75 });
    const screenGreenMat = new THREE.MeshStandardMaterial({ color: 0x059669, emissive: 0x10b981, emissiveIntensity: 0.65 });
    const viewportGlassMat = new THREE.MeshBasicMaterial({ color: 0x020617 });

    const pillarGeo = new THREE.BoxGeometry(1.1, wallH, 1.1);
    const pipeGeo = new THREE.CylinderGeometry(0.16, 0.16, 23.0 * BASE_MAP_SCALE, 10);
    const viewportFrameGeo = new THREE.BoxGeometry(7.2, 3.0, 0.35);
    const viewportGlassGeo = new THREE.BoxGeometry(6.6, 2.4, 0.4);

    const wallLines = [-48, -24, 0, 24, 48].map(v => v * BASE_MAP_SCALE);
    wallLines.forEach(wx => {
        wallLines.forEach(wz => {
            const col = new THREE.Mesh(pillarGeo, ribMat);
            col.position.set(wx, wallH / 2, wz);
            arenaScene.add(col);

            const ring = new THREE.Mesh(
                new THREE.BoxGeometry(1.3, 0.36, 1.3),
                new THREE.MeshBasicMaterial({ color: mission.accentColor })
            );
            ring.position.set(wx, 2.6, wz);
            arenaScene.add(ring);

            baseColliders.push({
                minX: wx - 1.0,
                maxX: wx + 1.0,
                minZ: wz - 1.0,
                maxZ: wz + 1.0
            });
        });
    });

    sectorCenters.forEach((sx, ix) => {
        sectorCenters.forEach((sz, iz) => {
            const isFlicker = (ix * 3 + iz) % 7 === 3;
            const lampMat = new THREE.MeshBasicMaterial({ color: isFlicker ? 0xfef08a : 0xe0f2fe });
            const lamp = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.24, 1.5), lampMat);
            lamp.position.set(sx, wallH - 0.05, sz);
            arenaScene.add(lamp);

            if ((ix + iz) % 2 === 0) {
                const pLight = new THREE.PointLight(isFlicker ? 0xfde047 : mission.accentColor, 0.85, 42);
                pLight.position.set(sx, wallH - 1.6, sz);
                arenaScene.add(pLight);
                if (isFlicker) {
                    flickeringLights.push({ light: pLight, mesh: lamp, seed: ix * 11 + iz * 17 });
                }
            }

            const pipeX1 = new THREE.Mesh(pipeGeo, pipeMat);
            pipeX1.rotation.z = Math.PI / 2;
            pipeX1.position.set(sx, wallH - 1.1, sz - 9.8 * BASE_MAP_SCALE);
            arenaScene.add(pipeX1);

            const pipeX2 = new THREE.Mesh(pipeGeo, copperPipeMat);
            pipeX2.rotation.z = Math.PI / 2;
            pipeX2.position.set(sx, wallH - 1.5, sz - 9.8 * BASE_MAP_SCALE);
            arenaScene.add(pipeX2);

            if ((ix + iz) % 2 === 1 && !(ix === 2 && iz === 2)) {
                const rack = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.8, 0.85), darkRackMat);
                rack.position.set(sx + 8.6 * BASE_MAP_SCALE, 1.9, sz + 8.6 * BASE_MAP_SCALE);
                rack.rotation.y = -Math.PI / 4;
                arenaScene.add(rack);

                const scr = new THREE.Mesh(
                    new THREE.BoxGeometry(2.0, 1.25, 0.1),
                    (ix + iz) % 4 === 1 ? screenBlueMat : screenGreenMat
                );
                scr.position.set(sx + 8.28 * BASE_MAP_SCALE, 2.45, sz + 8.28 * BASE_MAP_SCALE);
                scr.rotation.y = -Math.PI / 4;
                arenaScene.add(scr);
            }

            if ((ix * 2 + iz) % 3 === 0 && !(ix === 2 && iz === 2)) {
                const tank = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.65, 0.65, 4.2, 16),
                    copperPipeMat
                );
                tank.position.set(sx - 8.8 * BASE_MAP_SCALE, 2.1, sz - 8.8 * BASE_MAP_SCALE);
                arenaScene.add(tank);
            }
        });
    });

    const windowCoords = [-48, -24, 0, 24, 48].map(v => v * BASE_MAP_SCALE);
    const outerWinPos = 71.3 * BASE_MAP_SCALE;
    windowCoords.forEach(coord => {
        [-outerWinPos, outerWinPos].forEach(zWall => {
            const frame = new THREE.Mesh(viewportFrameGeo, ribMat);
            frame.position.set(coord, 4.6, zWall);
            arenaScene.add(frame);

            const glass = new THREE.Mesh(viewportGlassGeo, viewportGlassMat);
            glass.position.set(coord, 4.6, zWall);
            arenaScene.add(glass);

            for (let s = -2; s <= 2; s++) {
                const starDot = new THREE.Mesh(
                    new THREE.SphereGeometry(0.09, 6, 6),
                    new THREE.MeshBasicMaterial({ color: 0xe0f2fe })
                );
                starDot.position.set(coord + s * 1.1, 4.6 + (s % 2) * 0.45, zWall + (zWall < 0 ? 0.22 : -0.22));
                arenaScene.add(starDot);
            }
        });

        [-outerWinPos, outerWinPos].forEach(xWall => {
            const frame = new THREE.Mesh(viewportFrameGeo, ribMat);
            frame.rotation.y = Math.PI / 2;
            frame.position.set(xWall, 4.6, coord);
            arenaScene.add(frame);

            const glass = new THREE.Mesh(viewportGlassGeo, viewportGlassMat);
            glass.rotation.y = Math.PI / 2;
            glass.position.set(xWall, 4.6, coord);
            arenaScene.add(glass);
        });
    });
}

function buildSpaceshipCorridorComplex(mission) {
    const WALL_H = 11.0;
    const WALL_T = 1.5;
    const SPAN = 144.0 * BASE_MAP_SCALE;
    const HALF_SPAN = 72.0 * BASE_MAP_SCALE;
    const SECTOR_STEP = 24.0 * BASE_MAP_SCALE;
    const HALF_SECTOR = 12.0 * BASE_MAP_SCALE;

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(SPAN + 4, SPAN + 4),
        new THREE.MeshStandardMaterial({ color: 0x0b1222, roughness: 0.4, metalness: 0.35 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    arenaScene.add(floor);

    const grid = new THREE.GridHelper(SPAN, 60, mission.accentColor, 0x1e293b);
    grid.position.y = 0.01;
    arenaScene.add(grid);

    const ceiling = new THREE.Mesh(
        new THREE.BoxGeometry(SPAN + 6, 0.8, SPAN + 6),
        new THREE.MeshStandardMaterial({ color: 0x070d1a, roughness: 0.75, side: THREE.DoubleSide })
    );
    ceiling.position.set(0, WALL_H + 0.4, 0);
    arenaScene.add(ceiling);

    const accentHexCss = '#' + mission.accentColor.toString(16).padStart(6, '0');
    const hullTex = createSpaceshipHullTexture(accentHexCss);
    const outerWallMat = new THREE.MeshStandardMaterial({ map: hullTex, roughness: 0.42, metalness: 0.45 });
    const innerWallMat = new THREE.MeshStandardMaterial({ map: hullTex, roughness: 0.45, metalness: 0.4 });
    const ribMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.7 });
    const trimMat = new THREE.MeshBasicMaterial({ color: mission.accentColor });
    const upperTrimMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    addSolidWallBox(0, -HALF_SPAN, SPAN + WALL_T, WALL_T, WALL_H, outerWallMat, trimMat, upperTrimMat);
    addSolidWallBox(0, HALF_SPAN, SPAN + WALL_T, WALL_T, WALL_H, outerWallMat, trimMat, upperTrimMat);
    addSolidWallBox(-HALF_SPAN, 0, WALL_T, SPAN + WALL_T, WALL_H, outerWallMat, trimMat, upperTrimMat);
    addSolidWallBox(HALF_SPAN, 0, WALL_T, SPAN + WALL_T, WALL_H, outerWallMat, trimMat, upperTrimMat);

    const sectorCenters = [-60, -36, -12, 12, 36, 60].map(v => v * BASE_MAP_SCALE);
    const doorHalf = 2.6 * BASE_MAP_SCALE;

    const vOpen = {};
    const hOpen = {};

    const visited = Array.from({ length: 6 }, () => Array(6).fill(false));
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
            if (nx >= 0 && nx < 6 && nz >= 0 && nz < 6 && !visited[nx][nz]) {
                if (d.dx === 1) vOpen[`${cx}_${cz}`] = true;
                if (d.dx === -1) vOpen[`${nx}_${cz}`] = true;
                if (d.dz === 1) hOpen[`${cx}_${cz}`] = true;
                if (d.dz === -1) hOpen[`${cx}_${nz}`] = true;
                carveMaze(nx, nz);
            }
        });
    }
    carveMaze(2, 2);

    vOpen['2_2'] = true;
    hOpen['2_2'] = true;
    vOpen['1_3'] = true;
    hOpen['3_1'] = true;

    for (let ix = 0; ix < 5; ix++) {
        const wallX = (-48 + ix * 24) * BASE_MAP_SCALE;
        for (let iz = 0; iz < 6; iz++) {
            const centerZ = sectorCenters[iz];
            const segStart = centerZ - HALF_SECTOR;
            const segEnd = centerZ + HALF_SECTOR;

            if (vOpen[`${ix}_${iz}`]) {
                const leftLen = (centerZ - doorHalf) - segStart;
                const rightLen = segEnd - (centerZ + doorHalf);
                addSolidWallBox(wallX, segStart + leftLen / 2, 1.2, leftLen, WALL_H, innerWallMat, trimMat, upperTrimMat);
                addSolidWallBox(wallX, (centerZ + doorHalf) + rightLen / 2, 1.2, rightLen, WALL_H, innerWallMat, trimMat, upperTrimMat);

                const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.2, WALL_H - 4.8, doorHalf * 2), innerWallMat);
                lintel.position.set(wallX, 4.8 + (WALL_H - 4.8) / 2, centerZ);
                arenaScene.add(lintel);

                const glow = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.22, doorHalf * 2), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
                glow.position.set(wallX, 4.85, centerZ);
                arenaScene.add(glow);
            } else {
                addSolidWallBox(wallX, centerZ, 1.2, SECTOR_STEP, WALL_H, innerWallMat, trimMat, upperTrimMat);
            }
        }
    }

    for (let iz = 0; iz < 5; iz++) {
        const wallZ = (-48 + iz * 24) * BASE_MAP_SCALE;
        for (let ix = 0; ix < 6; ix++) {
            const centerX = sectorCenters[ix];
            const segStart = centerX - HALF_SECTOR;
            const segEnd = centerX + HALF_SECTOR;

            if (hOpen[`${ix}_${iz}`]) {
                const leftLen = (centerX - doorHalf) - segStart;
                const rightLen = segEnd - (centerX + doorHalf);
                addSolidWallBox(segStart + leftLen / 2, wallZ, leftLen, 1.2, WALL_H, innerWallMat, trimMat, upperTrimMat);
                addSolidWallBox((centerX + doorHalf) + rightLen / 2, wallZ, rightLen, 1.2, WALL_H, innerWallMat, trimMat, upperTrimMat);

                const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorHalf * 2, WALL_H - 4.8, 1.2), innerWallMat);
                lintel.position.set(centerX, 4.8 + (WALL_H - 4.8) / 2, wallZ);
                arenaScene.add(lintel);

                const glow = new THREE.Mesh(new THREE.BoxGeometry(doorHalf * 2, 0.22, 1.3), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
                glow.position.set(centerX, 4.85, wallZ);
                arenaScene.add(glow);
            } else {
                addSolidWallBox(centerX, wallZ, SECTOR_STEP, 1.2, WALL_H, innerWallMat, trimMat, upperTrimMat);
            }
        }
    }

    const longCorridors = [
        { cx: -36 * BASE_MAP_SCALE, cz: -36 * BASE_MAP_SCALE, axis: 'X' },
        { cx: 36 * BASE_MAP_SCALE, cz: -36 * BASE_MAP_SCALE, axis: 'X' },
        { cx: -36 * BASE_MAP_SCALE, cz: 36 * BASE_MAP_SCALE, axis: 'X' },
        { cx: 36 * BASE_MAP_SCALE, cz: 36 * BASE_MAP_SCALE, axis: 'X' },
        { cx: -12 * BASE_MAP_SCALE, cz: -36 * BASE_MAP_SCALE, axis: 'Z' },
        { cx: 12 * BASE_MAP_SCALE, cz: 36 * BASE_MAP_SCALE, axis: 'Z' },
        { cx: -36 * BASE_MAP_SCALE, cz: 12 * BASE_MAP_SCALE, axis: 'Z' },
        { cx: 36 * BASE_MAP_SCALE, cz: -12 * BASE_MAP_SCALE, axis: 'Z' }
    ];
    longCorridors.forEach(cor => {
        addInteriorCorridorChute(cor.cx, cor.cz, cor.axis, innerWallMat, ribMat, trimMat);
    });

    decorateSpaceshipComplex(mission, sectorCenters, WALL_H);

    const sectorNames = [
        ['ESCUDOS (NW)', 'ENLACE SATELITAL', 'PUENTE PRINCIPAL (N)', 'GIROSCOPIOS', 'GALERÍA NORTE', 'CRIOGENIA (NE)'],
        ['REFRIGERACIÓN', 'CORREDOR ALFA-1', 'TÚNEL CENTRAL-N', 'CORREDOR BETA-1', 'PASILLO ESTE-N', 'INVERNADERO LED'],
        ['REACTOR (W)', 'BALIZA CENTRAL', 'DESEMBARCO (0,0)', 'ANALIZADOR ATMO', 'ANTECÁMARA LAB', 'LABORATORIO (E)'],
        ['PASILLO OESTE-S', 'TÚNEL OESTE-SUR', 'NÚCLEO ENERGÍA', 'TÚNEL CENTRAL-S', 'CORREDOR GAMMA', 'RADAR ESPACIAL'],
        ['DUCTO SUR-W', 'PASILLO SUR-OESTE', 'CORREDOR SUR-C', 'TURBINAS AUXILIARES', 'PASILLO SUR-ESTE', 'BAHÍA TÉCNICA'],
        ['SUBESTACIÓN (SW)', 'ESCÁNER GEOLÓGICO', 'ANTENAS SUR (S)', 'COMPUERTA SUR', 'ESCLUSA CARGA', 'PROPULSORES (SE)']
    ];

    for (let iz = 0; iz < 6; iz++) {
        for (let ix = 0; ix < 6; ix++) {
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

    activeMissionTasks.forEach((task, taskIndex) => {
        const scaledX = (task.x || 0) * BASE_MAP_SCALE;
        const scaledZ = (task.z || 0) * BASE_MAP_SCALE;

        const group = new THREE.Group();
        group.position.set(scaledX, 0, scaledZ);
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
        roleTerminals.push({ ...task, x: scaledX, z: scaledZ, taskIndex, group, screenMat, beacon });
    });
}

function drawSectorRadarMinimap() {
    const canvas = document.getElementById('sector-radar-canvas');
    if (!canvas || !baseAstroRig) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const HALF_WORLD = 73.0 * BASE_MAP_SCALE;

    const toCanvasX = wx => ((wx + HALF_WORLD) / (HALF_WORLD * 2)) * W;
    const toCanvasY = wz => ((wz + HALF_WORLD) / (HALF_WORLD * 2)) * H;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#050b18';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
    ctx.lineWidth = 1;
    const gridLimit = 48 * BASE_MAP_SCALE;
    const gridStep = 24 * BASE_MAP_SCALE;
    for (let g = -gridLimit; g <= gridLimit + 0.1; g += gridStep) {
        const cx = toCanvasX(g);
        const cy = toCanvasY(g);
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
    }

    ctx.fillStyle = '#334155';
    radarWallSegments.forEach(seg => {
        const x1 = toCanvasX(seg.cx - seg.widthX / 2);
        const y1 = toCanvasY(seg.cz - seg.depthZ / 2);
        const rw = Math.max(1.5, (seg.widthX / (HALF_WORLD * 2)) * W);
        const rh = Math.max(1.5, (seg.depthZ / (HALF_WORLD * 2)) * H);
        ctx.fillRect(x1, y1, rw, rh);
    });

    const myRoleId = GAME_STATE.selectedRole.id;
    roleTerminals.forEach(t => {
        const tx = toCanvasX(t.x);
        const ty = toCanvasY(t.z);
        if (completedTaskIds.has(t.id)) {
            ctx.fillStyle = '#10b981';
        } else if (getTaskLockInfo(myRoleId, t.taskIndex).locked) {
            ctx.fillStyle = '#ef4444';
        } else {
            ctx.fillStyle = '#38bdf8';
        }
        ctx.beginPath();
        ctx.arc(tx, ty, 3.6, 0, Math.PI * 2);
        ctx.fill();
    });

    Object.values(MP.players).forEach(p => {
        if (p.id === MP.myId) return;
        const px = toCanvasX(p.x || 0);
        const py = toCanvasY(p.z || 0);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(px, py, 3.3, 0, Math.PI * 2);
        ctx.fill();
    });

    const meX = toCanvasX(baseAstroRig.group.position.x);
    const meY = toCanvasY(baseAstroRig.group.position.z);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(meX, meY);
    ctx.lineTo(meX - Math.sin(baseCamYaw) * 11, meY - Math.cos(baseCamYaw) * 11);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(meX, meY, 4.0, 0, Math.PI * 2);
    ctx.fill();
}

function updateBaseCompassHint() {
    const pending = roleTerminals.filter(t => !completedTaskIds.has(t.id));
    const hintEl = document.getElementById('arena-hint');
    if (!hintEl) return;

    if (pending.length === 0) {
        hintEl.innerHTML = '✅ <b>¡Tus 5 tareas completadas!</b> Iniciando retorno orbital...';
        return;
    }

    const myRoleId = GAME_STATE.selectedRole.id;
    const unlockedTask = pending.find(t => !getTaskLockInfo(myRoleId, t.taskIndex).locked);

    if (unlockedTask) {
        hintEl.innerHTML = `🎯 Pendientes (${pending.length}/5): <b>${unlockedTask.title}</b> en <b>${unlockedTask.roomName}</b> • <b>[E]</b> Operar • <b>[Clic / F]</b> Empujar`;
    } else {
        const blocked = pending[0];
        const lockInfo = getTaskLockInfo(myRoleId, blocked.taskIndex);
        hintEl.innerHTML = `🔒 <b>${blocked.title}</b> espera a que <b>${lockInfo.partnerRoleName}</b> complete su Tarea ${lockInfo.partnerTaskIndex} • <b>[Clic / F]</b> Empujar`;
    }
}

function resolveBaseWallCollisions(pos) {
    const r = 0.48;
    const maxBound = 70.8 * BASE_MAP_SCALE;
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
    pos.x = Math.max(-maxBound, Math.min(maxBound, pos.x));
    pos.z = Math.max(-maxBound, Math.min(maxBound, pos.z));
}

function clampBaseCameraInsideWalls(camPos, targetPos) {
    const camBound = 70.6 * BASE_MAP_SCALE;
    camPos.y = Math.min(9.6, Math.max(0.65, camPos.y));
    camPos.x = Math.max(-camBound, Math.min(camBound, camPos.x));
    camPos.z = Math.max(-camBound, Math.min(camBound, camPos.z));

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

function updatePunchEffects(dt) {
    for (let i = punchEffects.length - 1; i >= 0; i--) {
        const fx = punchEffects[i];
        fx.age += dt;
        const progress = Math.min(1, fx.age / fx.maxAge);

        if (fx.sprite) {
            fx.sprite.position.y += dt * 1.45;
            fx.sprite.material.opacity = 1 - progress;
        }
        if (fx.ring) {
            const s = 1 + progress * 3.2;
            fx.ring.scale.set(s, s, s);
            fx.ring.material.opacity = (1 - progress) * 0.85;
        }
        if (fx.sparks) {
            fx.sparks.forEach(sp => {
                sp.mesh.position.x += sp.vx * dt;
                sp.mesh.position.y += sp.vy * dt;
                sp.mesh.position.z += sp.vz * dt;
                sp.vy -= 7.5 * dt;
                sp.mesh.rotation.x += 8 * dt;
                sp.mesh.rotation.y += 8 * dt;
                sp.mesh.material.opacity = 1 - progress;
            });
        }

        if (fx.age >= fx.maxAge) {
            if (fx.sprite) arenaScene.remove(fx.sprite);
            if (fx.ring) arenaScene.remove(fx.ring);
            if (fx.sparks) fx.sparks.forEach(sp => arenaScene.remove(sp.mesh));
            punchEffects.splice(i, 1);
        }
    }
}

function syncBaseRemoteAstronauts(elapsed, dt) {
    MP.updateBots(dt, 62 * BASE_MAP_SCALE);

    if (MP.isHost) {
        botTaskTimer += dt;
        if (botTaskTimer >= 8) {
            botTaskTimer = 0;
            Object.values(MP.players).forEach(p => {
                if (!p.isBot) return;
                const botTasks = getMissionTasksForRole(GAME_STATE.selectedMission.id, p.roleId, MP.roomCode);
                const doneList = MP.completedTasksByRole[p.roleId] || [];
                const nextBotTask = botTasks.find(t => !doneList.includes(t.id));
                if (nextBotTask) {
                    MP.reportTaskCompleted(p.roleId, nextBotTask.id);
                    onRemoteTaskStateUpdated();
                }
            });
        }
    }

    const smoothFactor = Math.min(1, 1 - Math.exp(-12 * dt));
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
            remoteBaseAstros[p.id] = { rig, charId, name: p.name, punchTimer: 0, stunTimer: 0 };
        }

        const entry = remoteBaseAstros[p.id];
        const rig = entry.rig;
        rig.group.position.x += ((p.x || 0) - rig.group.position.x) * smoothFactor;
        rig.group.position.y += ((p.y || 0) - rig.group.position.y) * smoothFactor;
        rig.group.position.z += ((p.z || 0) - rig.group.position.z) * smoothFactor;

        const targetRot = p.rotY || 0;
        const diffRot = Math.atan2(Math.sin(targetRot - rig.group.rotation.y), Math.cos(targetRot - rig.group.rotation.y));
        rig.group.rotation.y += diffRot * smoothFactor;

        if (rig.propellerMesh) rig.propellerMesh.rotation.y += 0.25;

        if (entry.stunTimer > 0) {
            entry.stunTimer = Math.max(0, entry.stunTimer - dt);
            rig.group.rotation.z = Math.sin(entry.stunTimer * 28) * 0.28;
            rig.leftArm.rotation.x = -0.85;
            rig.rightArm.rotation.x = -0.85;
        } else {
            rig.group.rotation.z = 0;
            if (p.moving) {
                const swing = Math.sin(elapsed * 10) * 0.48;
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
        }

        if (entry.punchTimer > 0) {
            entry.punchTimer = Math.max(0, entry.punchTimer - dt);
            rig.rightArm.rotation.x = -Math.PI * 0.65;
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

    if (punchCooldown > 0) punchCooldown = Math.max(0, punchCooldown - dt);
    if (selfPunchAnimTimer > 0) selfPunchAnimTimer = Math.max(0, selfPunchAnimTimer - dt);
    if (selfStunTimer > 0) selfStunTimer = Math.max(0, selfStunTimer - dt);

    flickeringLights.forEach(fl => {
        const wave = Math.sin(elapsed * 19 + fl.seed) * Math.cos(elapsed * 7 + fl.seed);
        fl.light.intensity = wave > 0.78 ? 0.22 : 0.85;
    });

    // Desgaste continuo del oxígeno (1.35x más rápido y sin regenerarse jamás al completar misiones)
    if (!isTaskModalOpen) {
        suitOxygen = Math.max(0, suitOxygen - dt * 1.35);
        const o2Pct = Math.round((suitOxygen / maxSuitOxygen) * 100);
        document.getElementById('primary-bar-label').innerText = `🫁 Oxígeno Traje: ${o2Pct}%`;
        document.getElementById('primary-bar-fill').style.width = `${o2Pct}%`;
        if (o2Pct <= 25) {
            document.getElementById('primary-bar-fill').className = 'progress-fill red';
        }
        if (suitOxygen <= 0) {
            stopArenaLoop();
            unlockGamePointer();
            showMissionReport(false, 'Se agotó el oxígeno de tu traje espacial en la estación. Equipa alas o fuselaje de largo alcance para mayor reserva.');
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

            // Velocidad controlada de caminar (0.10) y correr (0.165)
            const speed = (arenaKeys['ShiftLeft'] || arenaKeys['ShiftRight']) ? 0.165 : 0.10;
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

        // Aplicar impulso de empujón/golpe amistoso recibido
        if (Math.abs(selfKnockbackX) > 0.001 || Math.abs(selfKnockbackZ) > 0.001) {
            baseAstroRig.group.position.x += selfKnockbackX;
            baseAstroRig.group.position.z += selfKnockbackZ;
            const kbDamp = Math.exp(-11 * dt);
            selfKnockbackX *= kbDamp;
            selfKnockbackZ *= kbDamp;
            moving = true;
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

        if (selfStunTimer > 0) {
            baseAstroRig.group.rotation.z = Math.sin(selfStunTimer * 28) * 0.26;
            baseAstroRig.leftArm.rotation.x = -0.85;
            baseAstroRig.rightArm.rotation.x = -0.85;
        } else {
            baseAstroRig.group.rotation.z = 0;
            if (!baseAstroGrounded) {
                baseAstroRig.leftArm.rotation.x = -0.6;
                baseAstroRig.rightArm.rotation.x = -0.6;
            } else if (moving) {
                const swing = Math.sin(elapsed * 10) * 0.48;
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
        }

        // Animación del brazo derecho al dar el golpe amistoso
        if (selfPunchAnimTimer > 0) {
            baseAstroRig.rightArm.rotation.x = -Math.PI * 0.68;
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
                promptBtn.style.background = 'rgba(153, 27, 27, 0.94)';
                promptBtn.style.borderColor = '#f87171';
                promptBtn.innerHTML = `🔒 Bloqueado: Espera a <strong>${lockInfo.partnerRoleName}</strong> (Tarea ${lockInfo.partnerTaskIndex})`;
            } else {
                promptBtn.style.background = 'linear-gradient(135deg, #0284c7, #0369a1)';
                promptBtn.style.borderColor = '#7dd3fc';
                promptBtn.innerHTML = `Presiona <strong>[E]</strong> o haz clic para operar: <span>${activeTerminal.title}</span>`;
            }
            promptBtn.classList.remove('hidden');
        } else {
            promptBtn.classList.add('hidden');
        }

        const camDist = 6.2;
        const targetPos = new THREE.Vector3(baseAstroRig.group.position.x, baseAstroRig.group.position.y + 1.8, baseAstroRig.group.position.z);
        const horizDist = camDist * Math.cos(baseCamPitch);
        const vertOffset = camDist * Math.sin(baseCamPitch);
        const desiredCam = new THREE.Vector3(
            targetPos.x + Math.sin(baseCamYaw) * horizDist,
            targetPos.y + vertOffset,
            targetPos.z + Math.cos(baseCamYaw) * horizDist
        );
        clampBaseCameraInsideWalls(desiredCam, targetPos);
        arenaCamera.position.copy(desiredCam);
        arenaCamera.lookAt(targetPos);
    }

    syncBaseRemoteAstronauts(elapsed, dt);
    updatePunchEffects(dt);
    drawSectorRadarMinimap();
    arenaRenderer.render(arenaScene, arenaCamera);
}

// =========================================================================
// MINIJUEGOS DE INGENIERÍA ESPACIAL + PREGUNTA CIENTÍFICA NASA (12 VARIANTES)
// =========================================================================
function closeTaskModal() {
    isTaskModalOpen = false;
    resetAllInputStates();
    document.getElementById('planet-task-modal').classList.add('hidden');
    lockGamePointer();
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

    const onHardwareSuccess = () => {
        renderNasaQuestionStep(body, task, () => {
            completedTaskIds.add(task.id);
            MP.reportTaskCompleted(GAME_STATE.selectedRole.id, task.id);
            refreshTerminalsVisualState();

            const doneCount = completedTaskIds.size;
            const totalCount = activeMissionTasks.length;
            const pct = Math.round((doneCount / totalCount) * 100);

            document.getElementById('secondary-bar-label').innerText = `📋 Tareas de ${GAME_STATE.selectedRole.short}: ${doneCount}/${totalCount}`;
            document.getElementById('secondary-bar-fill').style.width = `${pct}%`;
            document.getElementById('samples-counter').innerText = `📋 Tareas ${GAME_STATE.selectedRole.short}: ${doneCount} / ${totalCount}`;

            closeTaskModal();
            updateBaseCompassHint();

            if (doneCount >= totalCount) {
                setTimeout(() => {
                    stopArenaLoop();
                    initFlightPhase('flight_back');
                }, 750);
            }
        });
    };

    if (task.type === 'sequence') renderSequenceMinigame(body, onHardwareSuccess);
    else if (task.type === 'timing') renderTimingMinigame(body, onHardwareSuccess);
    else if (task.type === 'wires') renderWiresMinigame(body, onHardwareSuccess);
    else if (task.type === 'slider') renderSliderMinigame(body, onHardwareSuccess);
    else if (task.type === 'temp') renderTempMinigame(body, onHardwareSuccess);
    else if (task.type === 'orbit_sync') renderOrbitSyncMinigame(body, onHardwareSuccess);
    else if (task.type === 'power_balance') renderPowerBalanceMinigame(body, onHardwareSuccess);
    else if (task.type === 'dish_align') renderDishAlignMinigame(body, onHardwareSuccess);
    else if (task.type === 'fuel_mix') renderFuelMixMinigame(body, onHardwareSuccess);
    else if (task.type === 'binary_decode') renderBinaryDecodeMinigame(body, onHardwareSuccess);
    else if (task.type === 'shields_charge') renderShieldsChargeMinigame(body, onHardwareSuccess);
    else renderRivetsMinigame(body, onHardwareSuccess);
}

function renderNasaQuestionStep(body, task, onFinalComplete) {
    const mappedOptions = task.nasaOptions.map((text, idx) => ({
        text,
        isCorrect: idx === task.correctIdx
    }));
    for (let i = mappedOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mappedOptions[i], mappedOptions[j]] = [mappedOptions[j], mappedOptions[i]];
    }

    body.innerHTML = `
        <div style="background:rgba(14,165,233,0.16); border:1.5px solid #38bdf8; border-radius:12px; padding:13px; margin-bottom:14px; font-size:0.9rem; color:#e0f2fe; line-height:1.45;">
            🛰️ <strong>Dato de Ingeniería NASA:</strong> ${task.nasaFact}
        </div>
        <p style="font-weight:700; margin-bottom:14px; font-size:1.02rem; color:#ffffff;">${task.nasaQuestion}</p>
        <div style="display:flex; flex-direction:column; gap:10px;">
            ${mappedOptions.map((opt, idx) => `
                <button class="nasa-opt-btn" data-correct="${opt.isCorrect ? '1' : '0'}" style="text-align:left; cursor:pointer;">
                    <span style="color:#38bdf8; font-weight:800; margin-right:8px;">${String.fromCharCode(65 + idx)}.</span> ${opt.text}
                </button>
            `).join('')}
        </div>
        <p id="nasa-q-feedback" style="margin-top:12px; font-size:0.88rem; font-weight:700;"></p>
    `;

    body.querySelectorAll('.nasa-opt-btn').forEach(btn => {
        btn.onclick = () => {
            const isCorrect = btn.dataset.correct === '1';
            const fb = document.getElementById('nasa-q-feedback');
            if (isCorrect) {
                btn.style.background = '#065f46';
                btn.style.borderColor = '#10b981';
                fb.style.color = '#34d399';
                fb.innerText = '✅ ¡Correcto! Telemetría verificada y registrada.';
                setTimeout(onFinalComplete, 650);
            } else {
                btn.style.background = '#7f1d1d';
                btn.style.borderColor = '#ef4444';
                fb.style.color = '#fca5a5';
                fb.innerText = '❌ Dato incorrecto. Revisa el principio científico NASA de arriba e intenta otra opción.';
            }
        };
    });
}

// 1. Secuencia ascendente 1 al 8
function renderSequenceMinigame(body, onSuccess) {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5);
    let expected = 1;
    body.innerHTML = `
        <div class="minigame-box">
            <p>Pulsa los nodos de telemetría en orden ascendente del <strong>1 al 8</strong>:</p>
            <div class="seq-grid">
                ${nums.map(n => `<button class="seq-btn" data-num="${n}">${n}</button>`).join('')}
            </div>
        </div>
    `;
    body.querySelectorAll('.seq-btn').forEach(btn => {
        btn.onclick = () => {
            const val = parseInt(btn.dataset.num, 10);
            if (val === expected) {
                btn.classList.add('done');
                btn.disabled = true;
                expected++;
                if (expected > 8) onSuccess();
            } else {
                expected = 1;
                body.querySelectorAll('.seq-btn').forEach(b => {
                    b.classList.remove('done');
                    b.disabled = false;
                });
            }
        };
    });
}

// 2. Pulso de precisión (Escudo térmico / Frenado)
function renderTimingMinigame(body, onSuccess) {
    let pos = 0;
    let dir = 1;
    let hits = 0;
    body.innerHTML = `
        <div class="minigame-box">
            <p>Detén el indicador en la <strong>zona verde</strong> (2 veces) para estabilizar la maniobra:</p>
            <div class="drill-meter">
                <div class="drill-target-zone"></div>
                <div id="timing-cursor" class="drill-cursor" style="left:0%;"></div>
            </div>
            <p id="timing-status" style="font-size:0.86rem; color:#38bdf8; margin-bottom:10px; font-weight:700;">Aciertos: 0 / 2</p>
            <button id="timing-hit-btn" class="btn-primary">⚡ ACTIVAR PULSO</button>
        </div>
    `;
    const cursor = document.getElementById('timing-cursor');
    const interval = setInterval(() => {
        if (!document.getElementById('timing-cursor')) {
            clearInterval(interval);
            return;
        }
        pos += dir * 2.1;
        if (pos >= 96) { pos = 96; dir = -1; }
        if (pos <= 0) { pos = 0; dir = 1; }
        cursor.style.left = `${pos}%`;
    }, 22);

    document.getElementById('timing-hit-btn').onclick = () => {
        if (pos >= 34 && pos <= 66) {
            hits++;
            document.getElementById('timing-status').innerText = `Aciertos: ${hits} / 2`;
            if (hits >= 2) {
                clearInterval(interval);
                onSuccess();
            }
        } else {
            document.getElementById('timing-status').innerText = `❌ Fuera de rango. Aciertos: ${hits} / 2`;
        }
    };
}

// 3. Empalme de circuitos redundantes
function renderWiresMinigame(body, onSuccess) {
    const colors = [
        { id: 'c1', name: 'BUS ALFA', css: '#ef4444' },
        { id: 'c2', name: 'BUS BETA', css: '#3b82f6' },
        { id: 'c3', name: 'BUS GAMMA', css: '#eab308' },
        { id: 'c4', name: 'BUS DELTA', css: '#10b981' }
    ];
    const rightColors = [...colors].sort(() => Math.random() - 0.5);
    let selectedLeft = null;
    let connected = 0;

    body.innerHTML = `
        <div class="minigame-box">
            <p>Conecta cada línea de potencia redundante con su terminal del mismo color:</p>
            <div class="wire-grid">
                <div class="wire-col">
                    ${colors.map(c => `<button class="wire-node" data-side="L" data-cid="${c.id}" style="background:${c.css};">${c.name}</button>`).join('')}
                </div>
                <div class="wire-col">
                    ${rightColors.map(c => `<button class="wire-node" data-side="R" data-cid="${c.id}" style="background:${c.css};">${c.name}</button>`).join('')}
                </div>
            </div>
        </div>
    `;

    body.querySelectorAll('.wire-node').forEach(btn => {
        btn.onclick = () => {
            if (btn.classList.contains('connected')) return;
            if (btn.dataset.side === 'L') {
                body.querySelectorAll('[data-side="L"]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedLeft = btn;
            } else if (selectedLeft) {
                if (selectedLeft.dataset.cid === btn.dataset.cid) {
                    selectedLeft.classList.remove('active');
                    selectedLeft.classList.add('connected');
                    btn.classList.add('connected');
                    selectedLeft = null;
                    connected++;
                    if (connected >= 4) onSuccess();
                } else {
                    selectedLeft.classList.remove('active');
                    selectedLeft = null;
                }
            }
        };
    });
}

// 4. Calibrador de frecuencia / retardo orbital
function renderSliderMinigame(body, onSuccess) {
    const targetHz = 115 + Math.floor(Math.random() * 55);
    body.innerHTML = `
        <div class="minigame-box">
            <p>Ajusta la frecuencia del transmisor exactamente a <strong>${targetHz} MHz</strong>:</p>
            <h3 id="slider-val-display" style="text-align:center; color:#38bdf8; margin:12px 0; font-size:1.5rem;">100 MHz</h3>
            <input type="range" id="freq-slider" min="100" max="180" value="100" style="width:100%;" />
            <button id="verify-slider-btn" class="btn-primary" style="margin-top:14px;">✓ SINCRONIZAR FRECUENCIA</button>
        </div>
    `;
    const slider = document.getElementById('freq-slider');
    const disp = document.getElementById('slider-val-display');
    slider.oninput = () => {
        disp.innerText = `${slider.value} MHz`;
    };
    document.getElementById('verify-slider-btn').onclick = () => {
        if (Math.abs(parseInt(slider.value, 10) - targetHz) <= 2) {
            onSuccess();
        } else {
            disp.style.color = '#ef4444';
        }
    };
}

// 5. Regulador térmico criogénico
function renderTempMinigame(body, onSuccess) {
    let temp = 42;
    const goal = 20;
    body.innerHTML = `
        <div class="minigame-box">
            <p>Estabiliza la cámara térmica exactamente a <strong>${goal} °C</strong>:</p>
            <div class="temp-controls">
                <button id="temp-down" class="temp-btn" style="background:#0284c7;">-4 °C</button>
                <span id="temp-readout" style="font-size:1.8rem; font-weight:800;">${temp} °C</span>
                <button id="temp-up" class="temp-btn" style="background:#ea580c;">+3 °C</button>
            </div>
            <button id="temp-lock-btn" class="btn-primary">✓ FIJAR TEMPERATURA</button>
        </div>
    `;
    const readout = document.getElementById('temp-readout');
    document.getElementById('temp-down').onclick = () => {
        temp -= 4;
        readout.innerText = `${temp} °C`;
    };
    document.getElementById('temp-up').onclick = () => {
        temp += 3;
        readout.innerText = `${temp} °C`;
    };
    document.getElementById('temp-lock-btn').onclick = () => {
        if (temp === goal) onSuccess();
    };
}

// 6. Sellado de compuertas presurizadas
function renderRivetsMinigame(body, onSuccess) {
    let sealed = 0;
    const coords = [
        { top: '18%', left: '16%' },
        { top: '18%', left: '74%' },
        { top: '48%', left: '45%' },
        { top: '72%', left: '22%' },
        { top: '72%', left: '70%' }
    ];
    body.innerHTML = `
        <div class="minigame-box">
            <p>Presiona las <strong>5 válvulas de vacío</strong> para presurizar la compuerta:</p>
            <div class="rivet-panel">
                ${coords.map((c, i) => `<button class="rivet-spot" style="top:${c.top}; left:${c.left};" data-idx="${i}">!</button>`).join('')}
            </div>
        </div>
    `;
    body.querySelectorAll('.rivet-spot').forEach(btn => {
        btn.onclick = () => {
            if (btn.classList.contains('sealed')) return;
            btn.classList.add('sealed');
            btn.innerText = '✓';
            sealed++;
            if (sealed >= 5) onSuccess();
        };
    });
}

// 7. Sincronizador de Órbita / Rotor
function renderOrbitSyncMinigame(body, onSuccess) {
    let angle = 0;
    let locked = 0;
    body.innerHTML = `
        <div class="minigame-box" style="text-align:center;">
            <p>Pulsa <strong>CAPTURAR ÁNGULO</strong> cuando el satélite pase por el arco superior verde (<strong>340° - 20°</strong>):</p>
            <div style="position:relative; width:150px; height:150px; margin:16px auto; border:3px solid #334155; border-radius:50%;">
                <div style="position:absolute; top:-6px; left:52px; width:42px; height:12px; background:#10b981; border-radius:6px;"></div>
                <div id="orbit-dot" style="position:absolute; width:16px; height:16px; background:#38bdf8; border-radius:50%; top:65px; left:65px;"></div>
            </div>
            <p id="orbit-status" style="color:#38bdf8; font-weight:700; margin-bottom:10px;">Capturas: 0 / 2</p>
            <button id="orbit-cap-btn" class="btn-primary">🛰️ CAPTURAR ÁNGULO ORBITAL</button>
        </div>
    `;
    const dot = document.getElementById('orbit-dot');
    const timer = setInterval(() => {
        if (!document.getElementById('orbit-dot')) { clearInterval(timer); return; }
        angle = (angle + 5) % 360;
        const rad = (angle - 90) * (Math.PI / 180);
        dot.style.left = `${67 + Math.cos(rad) * 64}px`;
        dot.style.top = `${67 + Math.sin(rad) * 64}px`;
    }, 24);

    document.getElementById('orbit-cap-btn').onclick = () => {
        if (angle <= 24 || angle >= 336) {
            locked++;
            document.getElementById('orbit-status').innerText = `Capturas: ${locked} / 2`;
            if (locked >= 2) { clearInterval(timer); onSuccess(); }
        } else {
            document.getElementById('orbit-status').innerText = `❌ Desfase orbital (${angle}°). Capturas: ${locked} / 2`;
        }
    };
}

// 8. Balanceador de Energía Solar / Nuclear
function renderPowerBalanceMinigame(body, onSuccess) {
    let total = 0;
    const target = 100;
    body.innerHTML = `
        <div class="minigame-box" style="text-align:center;">
            <p>Suma exactamente <strong>100 MW</strong> de carga eléctrica combinando los módulos:</p>
            <h3 id="pwr-val" style="font-size:1.7rem; color:#fbbf24; margin:12px 0;">0 / 100 MW</h3>
            <div style="display:flex; gap:10px; justify-content:center; margin-bottom:12px;">
                <button class="temp-btn" style="background:#0284c7;" data-add="15">+15 MW</button>
                <button class="temp-btn" style="background:#0284c7;" data-add="25">+25 MW</button>
                <button class="temp-btn" style="background:#0284c7;" data-add="40">+40 MW</button>
                <button id="pwr-reset" class="temp-btn" style="background:#475569;">Reset</button>
            </div>
        </div>
    `;
    const disp = document.getElementById('pwr-val');
    body.querySelectorAll('[data-add]').forEach(b => {
        b.onclick = () => {
            total += parseInt(b.dataset.add, 10);
            disp.innerText = `${total} / 100 MW`;
            if (total === target) onSuccess();
            else if (total > target) {
                disp.style.color = '#ef4444';
                setTimeout(() => { total = 0; disp.style.color = '#fbbf24'; disp.innerText = '0 / 100 MW'; }, 500);
            }
        };
    });
    document.getElementById('pwr-reset').onclick = () => {
        total = 0;
        disp.style.color = '#fbbf24';
        disp.innerText = '0 / 100 MW';
    };
}

// 9. Alineador de Antena de Espacio Profundo
function renderDishAlignMinigame(body, onSuccess) {
    let az = 20;
    let el = 75;
    body.innerHTML = `
        <div class="minigame-box">
            <p>Orienta la antena parabólica a <strong>Azimut 50°</strong> y <strong>Elevación 45°</strong>:</p>
            <div style="margin:12px 0;">
                <label>Azimut: <strong id="az-lbl">20°</strong></label>
                <input type="range" id="az-rng" min="0" max="90" value="20" style="width:100%;" />
            </div>
            <div style="margin:12px 0;">
                <label>Elevación: <strong id="el-lbl">75°</strong></label>
                <input type="range" id="el-rng" min="0" max="90" value="75" style="width:100%;" />
            </div>
            <button id="dish-ok-btn" class="btn-primary">📡 BLOQUEAR SEÑAL NASA</button>
        </div>
    `;
    const azR = document.getElementById('az-rng');
    const elR = document.getElementById('el-rng');
    azR.oninput = () => { az = parseInt(azR.value, 10); document.getElementById('az-lbl').innerText = `${az}°`; };
    elR.oninput = () => { el = parseInt(elR.value, 10); document.getElementById('el-lbl').innerText = `${el}°`; };
    document.getElementById('dish-ok-btn').onclick = () => {
        if (Math.abs(az - 50) <= 3 && Math.abs(el - 45) <= 3) onSuccess();
    };
}

// 10. Decodificador Binario de Telemetría
function renderBinaryDecodeMinigame(body, onSuccess) {
    const bits = [0, 0, 0, 0];
    const target = [1, 0, 1, 1];
    body.innerHTML = `
        <div class="minigame-box" style="text-align:center;">
            <p>Configura el código de paridad de telemetría en <strong>1 - 0 - 1 - 1</strong>:</p>
            <div style="display:flex; gap:12px; justify-content:center; margin:16px 0;">
                ${bits.map((b, i) => `<button class="seq-btn" data-bi="${i}" style="width:62px;">0</button>`).join('')}
            </div>
        </div>
    `;
    body.querySelectorAll('[data-bi]').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.bi, 10);
            bits[idx] = bits[idx] === 0 ? 1 : 0;
            btn.innerText = bits[idx];
            btn.style.background = bits[idx] === 1 ? '#0284c7' : '#1e293b';
            if (bits.every((v, k) => v === target[k])) onSuccess();
        };
    });
}

// 11. Mezcla Química ISRU (Oxígeno / Propelente)
function renderFuelMixMinigame(body, onSuccess) {
    let o2 = 30;
    body.innerHTML = `
        <div class="minigame-box" style="text-align:center;">
            <p>Ajusta la pureza de oxígeno extraído al <strong>80%</strong> pulsando el sintetizador:</p>
            <h3 id="mix-pct" style="font-size:1.6rem; color:#10b981; margin:12px 0;">Pureza: 30%</h3>
            <button id="mix-pump-btn" class="btn-primary">🧪 INYECTAR CATALIZADOR (+10%)</button>
        </div>
    `;
    document.getElementById('mix-pump-btn').onclick = () => {
        o2 += 10;
        document.getElementById('mix-pct').innerText = `Pureza: ${o2}%`;
        if (o2 >= 80) onSuccess();
    };
}

// 12. Carga de Escudo Electrodinámico
function renderShieldsChargeMinigame(body, onSuccess) {
    let charge = 0;
    body.innerHTML = `
        <div class="minigame-box" style="text-align:center;">
            <p>Pulsa repetidamente para cargar los capacitores del escudo al <strong>100%</strong>:</p>
            <div class="progress-track" style="height:18px; margin:14px 0;"><div id="sh-fill" class="progress-fill cyan" style="width:0%;"></div></div>
            <button id="sh-tap-btn" class="btn-primary">⚡ CARGAR CAPACITOR</button>
        </div>
    `;
    document.getElementById('sh-tap-btn').onclick = () => {
        charge = Math.min(100, charge + 20);
        document.getElementById('sh-fill').style.width = `${charge}%`;
        if (charge >= 100) onSuccess();
    };
}

function showMissionReport(success, desc) {
    resetAllInputStates();
    document.getElementById('sector-radar-box').classList.add('hidden');
    const modal = document.getElementById('report-modal');
    const title = document.getElementById('report-title');
    const descEl = document.getElementById('report-desc');
    const statsEl = document.getElementById('report-stats');

    title.innerText = success ? '🏆 Misión Cumplida con Éxito' : '⚠️ Misión Interrumpida';
    title.style.color = success ? '#10b981' : '#ef4444';
    descEl.innerText = desc;

    statsEl.innerHTML = `
        <div><small style="color:#94a3b8;">Tareas Completadas</small><br><strong>${completedTaskIds.size} / ${activeMissionTasks.length}</strong></div>
        <div><small style="color:#94a3b8;">Oxígeno Restante</small><br><strong>${Math.round((suitOxygen / maxSuitOxygen) * 100)}%</strong></div>
        <div><small style="color:#94a3b8;">Créditos Totales</small><br><strong style="color:#fbbf24;">${GAME_STATE.credits} CR</strong></div>
    `;

    modal.classList.remove('hidden');
    document.getElementById('return-hub-btn').onclick = returnToControlCenter;
}
