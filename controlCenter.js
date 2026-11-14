let ccScene, ccCamera, ccRenderer, ccAnimId;
let astroRig, windowPlanet;
let astroVelY = 0;
let astroGrounded = true;
let remoteCCAstros = {};
let stations = [];
let activeStation = null;
let ccKeys = {};
let isModalOpen = false;
let camYaw = 0;
let isDragging = false;
let prevMouseX = 0;
let ccLastTime = 0;

// Variables para el Taller Modular Completo estilo GTA en Ingeniería
let garageTab = 'primaryColors';
let garageFeedbackMsg = '';
let previewScene, previewCamera, previewRenderer, previewRocket, previewAnimId;
let previewRotY = 0.6;
let previewDragging = false;
let previewPrevX = 0;

function initControlCenter() {
    const container = document.getElementById('webgl-canvas-container');
    container.innerHTML = '';
    remoteCCAstros = {};

    ccScene = new THREE.Scene();
    ccScene.background = new THREE.Color(0x060b19);
    ccScene.fog = new THREE.Fog(0x060b19, 24, 58);

    ccCamera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 100);
    ccCamera.position.set(0, 9.5, 13.5);

    ccRenderer = new THREE.WebGLRenderer({ antialias: true });
    ccRenderer.setSize(container.clientWidth, container.clientHeight);
    ccRenderer.shadowMap.enabled = true;
    container.appendChild(ccRenderer.domElement);

    ccScene.add(new THREE.AmbientLight(0x94a3b8, 0.95));

    const mainLight = new THREE.DirectionalLight(0xe0f2fe, 1.15);
    mainLight.position.set(8, 18, 10);
    mainLight.castShadow = true;
    ccScene.add(mainLight);

    const cyanGlow = new THREE.PointLight(0x38bdf8, 1.5, 30);
    cyanGlow.position.set(0, 6, -4);
    ccScene.add(cyanGlow);

    buildControlRoom();
    updateWindowPlanet(GAME_STATE.currentOrbitId);
    rebuildControlCenterAstronaut(new THREE.Vector3(0, 0, 4.5));
    buildStations();
    setupControlCenterEvents(container);
    updateCreditsHUD();

    ccLastTime = performance.now();
    animateControlCenter();
}

function updateCreditsHUD() {
    const el = document.getElementById('hud-credits');
    if (el) el.innerText = `${GAME_STATE.credits} CR`;
}

function rebuildControlCenterAstronaut(pos) {
    if (astroRig && astroRig.group) {
        ccScene.remove(astroRig.group);
    }
    const role = GAME_STATE.selectedRole;
    const char = GAME_DATA.characters.find(c => c.id === GAME_STATE.selectedCharacterId) || GAME_DATA.characters[0];
    astroRig = createBackyardiganCharacter(char.id, {
        name: MP.myName,
        charName: char.name.split(' ')[0],
        roleShort: role.short,
        colorCss: role.colorCss
    });
    astroRig.group.position.copy(pos);
    ccScene.add(astroRig.group);
}

function syncAllRemoteAstronauts(time, dt) {
    MP.updateBots(dt, 6.5);

    const activeIds = new Set();
    Object.values(MP.players).forEach(p => {
        if (p.id === MP.myId) return;
        activeIds.add(p.id);

        const charId = p.characterId || 'uniqua';
        if (!remoteCCAstros[p.id] || remoteCCAstros[p.id].charId !== charId) {
            if (remoteCCAstros[p.id]) {
                ccScene.remove(remoteCCAstros[p.id].rig.group);
            }
            const role = GAME_DATA.roles.find(r => r.id === p.roleId) || GAME_DATA.roles[0];
            const char = GAME_DATA.characters.find(c => c.id === charId) || GAME_DATA.characters[1];
            const rig = createBackyardiganCharacter(charId, {
                name: p.name,
                charName: char.name.split(' ')[0],
                roleShort: role.short,
                colorCss: role.colorCss
            });
            rig.group.position.set(p.x || 0, p.y || 0, p.z || 3);
            ccScene.add(rig.group);
            remoteCCAstros[p.id] = { rig, charId };
        }

        const rig = remoteCCAstros[p.id].rig;
        rig.group.position.x += (p.x - rig.group.position.x) * 0.2;
        rig.group.position.y += ((p.y || 0) - rig.group.position.y) * 0.25;
        rig.group.position.z += (p.z - rig.group.position.z) * 0.2;
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

    Object.keys(remoteCCAstros).forEach(id => {
        if (!activeIds.has(id)) {
            ccScene.remove(remoteCCAstros[id].rig.group);
            delete remoteCCAstros[id];
        }
    });
}

function buildControlRoom() {
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(26, 24),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.3 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    ccScene.add(floor);

    const walkway = new THREE.Mesh(
        new THREE.PlaneGeometry(3.4, 22),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 })
    );
    walkway.rotation.x = -Math.PI / 2;
    walkway.position.y = 0.01;
    ccScene.add(walkway);

    [-1.7, 1.7].forEach(xPos => {
        const line = new THREE.Mesh(
            new THREE.PlaneGeometry(0.1, 22),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        line.rotation.x = -Math.PI / 2;
        line.position.set(xPos, 0.02, 0);
        ccScene.add(line);
    });

    [-12.5, 12.5].forEach(xWall => {
        const wall = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 7, 24),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
        );
        wall.position.set(xWall, 3.5, 0);
        ccScene.add(wall);

        for (let z = -8; z <= 8; z += 5.5) {
            const panel = new THREE.Mesh(
                new THREE.BoxGeometry(0.9, 3.2, 2.8),
                new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.45 })
            );
            panel.position.set(xWall > 0 ? xWall - 0.1 : xWall + 0.1, 3.4, z);
            ccScene.add(panel);
        }
    });

    const backWallBottom = new THREE.Mesh(
        new THREE.BoxGeometry(26, 2.2, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    backWallBottom.position.set(0, 1.1, -11.5);
    ccScene.add(backWallBottom);

    const windowFrame = new THREE.Mesh(
        new THREE.BoxGeometry(24, 0.25, 1),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    windowFrame.position.set(0, 2.2, -11.5);
    ccScene.add(windowFrame);

    const starGeo = new THREE.BufferGeometry();
    const starVertices = [];
    for (let i = 0; i < 450; i++) {
        starVertices.push((Math.random() - 0.5) * 85, Math.random() * 35 + 2, -14 - Math.random() * 35);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    ccScene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.25 })));
}

function updateWindowPlanet(planetId) {
    if (windowPlanet && windowPlanet.group) {
        ccScene.remove(windowPlanet.group);
    }
    windowPlanet = createHDPlanet(planetId, 7.6);
    windowPlanet.group.position.set(0, 5.5, -24);
    ccScene.add(windowPlanet.group);

    const foundMission = GAME_DATA.missions.find(m => m.id === planetId);
    document.getElementById('orbit-location-label').innerText = foundMission
        ? foundMission.orbitLabel
        : 'ÓRBITA ACTUAL: PLANETA TIERRA';
}

function createScreenTexture(numberText, titleText, subText, accentColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#091526';
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 496, 240);

    ctx.fillStyle = accentColor;
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(numberText, 30, 55);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px sans-serif';
    ctx.fillText(titleText, 30, 125);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '24px sans-serif';
    ctx.fillText(subText, 30, 180);

    return new THREE.CanvasTexture(canvas);
}

function buildStations() {
    stations = [];
    const stationConfigs = [
        { id: 'planning', num: '01', title: 'PLANIFICACIÓN', sub: 'DESTINO Y PLANETA', x: 5.5, z: 1.5, rotY: -0.35, color: '#38bdf8', hex: 0x38bdf8 },
        { id: 'engineering', num: '02', title: 'INGENIERÍA', sub: 'CUSTOMIZAR NAVE (8 PIEZAS)', x: -5.5, z: 1.5, rotY: 0.35, color: '#10b981', hex: 0x10b981 },
        { id: 'launch', num: '03', title: 'LANZAMIENTO', sub: 'DESPEGUE A ÓRBITA', x: 4.5, z: -5.5, rotY: -0.25, color: '#f59e0b', hex: 0xf59e0b },
        { id: 'operations', num: '04', title: 'OPERACIONES', sub: 'SIMULADOR DIRECTO', x: -4.5, z: -5.5, rotY: 0.25, color: '#a855f7', hex: 0xa855f7 }
    ];

    stationConfigs.forEach(cfg => {
        const group = new THREE.Group();
        group.position.set(cfg.x, 0, cfg.z);
        group.rotation.y = cfg.rotY;

        const desk = new THREE.Mesh(
            new THREE.BoxGeometry(3.4, 1.3, 1.3),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
        );
        desk.position.y = 0.65;
        desk.castShadow = true;
        group.add(desk);

        const trim = new THREE.Mesh(
            new THREE.BoxGeometry(3.5, 0.14, 1.36),
            new THREE.MeshBasicMaterial({ color: cfg.hex })
        );
        trim.position.y = 1.32;
        group.add(trim);

        const screenTex = createScreenTexture(cfg.num, cfg.title, cfg.sub, cfg.color);
        const screen = new THREE.Mesh(
            new THREE.BoxGeometry(3.1, 1.55, 0.15),
            new THREE.MeshBasicMaterial({ map: screenTex })
        );
        screen.position.set(0, 2.15, -0.15);
        screen.rotation.x = -0.18;
        group.add(screen);

        const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.85, 1.1, 32),
            new THREE.MeshBasicMaterial({ color: cfg.hex, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(0, 0.03, 2.1);
        group.add(ring);

        const dot = new THREE.Mesh(
            new THREE.CircleGeometry(0.2, 16),
            new THREE.MeshBasicMaterial({ color: cfg.hex })
        );
        dot.rotation.x = -Math.PI / 2;
        dot.position.set(0, 0.03, 2.1);
        group.add(dot);

        const interactWorldPos = new THREE.Vector3(0, 0, 2.1).applyAxisAngle(new THREE.Vector3(0, 1, 0), cfg.rotY).add(group.position);

        group.userData = { ...cfg, interactPos: interactWorldPos, ringMesh: ring };
        ccScene.add(group);
        stations.push(group);
    });
}

function setupControlCenterEvents(container) {
    container.addEventListener('contextmenu', e => e.preventDefault());

    ccRenderer.domElement.addEventListener('webglcontextlost', e => {
        e.preventDefault();
        cancelAnimationFrame(ccAnimId);
    });
    ccRenderer.domElement.addEventListener('webglcontextrestored', () => {
        initControlCenter();
    });

    window.addEventListener('keydown', e => {
        if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

        if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'u'].includes(e.key.toLowerCase())) {
            e.preventDefault();
            return;
        }

        const isLobbyOpen = !document.getElementById('lobby-modal').classList.contains('hidden');
        const isHubHidden = document.getElementById('control-center-container').classList.contains('hidden');
        if (isLobbyOpen || isHubHidden) return;

        const key = e.key.toLowerCase();
        ccKeys[key] = true;

        // Salto con Barra Espaciadora
        if (e.code === 'Space' && !isModalOpen) {
            e.preventDefault();
            if (astroGrounded) {
                astroVelY = 0.22;
                astroGrounded = false;
            }
        }

        if (key === 'e' && activeStation && !isModalOpen) {
            openStationModal(activeStation);
        }
        if (key === 'escape' && isModalOpen) {
            closeStationModal();
        }
    });

    window.addEventListener('keyup', e => {
        ccKeys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('blur', () => {
        ccKeys = {};
        isDragging = false;
    });

    container.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        isDragging = true;
        prevMouseX = e.clientX;
    });

    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('mousemove', e => {
        if (!isDragging) return;
        const deltaX = e.clientX - prevMouseX;
        prevMouseX = e.clientX;
        camYaw -= deltaX * 0.006;
        camYaw = Math.max(-0.7, Math.min(0.7, camYaw));
    });

    document.getElementById('station-prompt').onclick = () => {
        if (activeStation) openStationModal(activeStation);
    };

    document.getElementById('close-modal-btn').onclick = closeStationModal;

    window.addEventListener('resize', () => {
        if (!ccRenderer || !container.clientWidth || !container.clientHeight) return;
        ccCamera.aspect = container.clientWidth / container.clientHeight;
        ccCamera.updateProjectionMatrix();
        ccRenderer.setSize(container.clientWidth, container.clientHeight);
    });
}

function updateAstronautAndCamera(time, dt) {
    if (windowPlanet && windowPlanet.sphere) windowPlanet.sphere.rotation.y += 0.0022;
    syncAllRemoteAstronauts(time, dt);

    if (astroRig && astroRig.propellerMesh) {
        astroRig.propellerMesh.rotation.y += 0.25;
    }

    const isLobbyOpen = !document.getElementById('lobby-modal').classList.contains('hidden');
    if (isModalOpen || isLobbyOpen) return;

    const isRunning = ccKeys['shift'];
    const moveSpeed = isRunning ? 0.16 : 0.095;
    let dx = 0;
    let dz = 0;

    if (ccKeys['w'] || ccKeys['arrowup']) dz -= 1;
    if (ccKeys['s'] || ccKeys['arrowdown']) dz += 1;
    if (ccKeys['a'] || ccKeys['arrowleft']) dx -= 1;
    if (ccKeys['d'] || ccKeys['arrowright']) dx += 1;

    const astronaut = astroRig.group;
    const isMoving = dx !== 0 || dz !== 0;

    if (isMoving) {
        const angle = Math.atan2(dx, dz);
        astronaut.rotation.y = angle;
        astronaut.position.x += Math.sin(angle) * moveSpeed;
        astronaut.position.z += Math.cos(angle) * moveSpeed;

        astronaut.position.x = Math.max(-10.5, Math.min(10.5, astronaut.position.x));
        astronaut.position.z = Math.max(-8.5, Math.min(9.5, astronaut.position.z));
    }

    // Física vertical de salto
    astronaut.position.y += astroVelY;
    if (!astroGrounded) {
        astroVelY -= 0.011;
        if (astronaut.position.y <= 0) {
            astronaut.position.y = 0;
            astroVelY = 0;
            astroGrounded = true;
        }
    }

    if (!astroGrounded) {
        astroRig.leftArm.rotation.x = -0.65;
        astroRig.rightArm.rotation.x = -0.65;
        astroRig.leftLeg.rotation.x = 0.25;
        astroRig.rightLeg.rotation.x = -0.25;
    } else if (isMoving) {
        const swing = Math.sin(time * (isRunning ? 16 : 10)) * 0.55;
        astroRig.leftLeg.rotation.x = swing;
        astroRig.rightLeg.rotation.x = -swing;
        astroRig.leftArm.rotation.x = -swing;
        astroRig.rightArm.rotation.x = swing;
    } else {
        astroRig.leftLeg.rotation.x = 0;
        astroRig.rightLeg.rotation.x = 0;
        astroRig.leftArm.rotation.x = 0;
        astroRig.rightArm.rotation.x = 0;
    }

    MP.sendMyPosition(astronaut.position.x, astronaut.position.y, astronaut.position.z, astronaut.rotation.y, isMoving);

    const targetCamX = astronaut.position.x * 0.55 + Math.sin(camYaw) * 6;
    const targetCamY = 9.5 + astronaut.position.y * 0.6;
    const targetCamZ = astronaut.position.z + 10.5 * Math.cos(camYaw);
    ccCamera.position.x += (targetCamX - ccCamera.position.x) * 0.08;
    ccCamera.position.y += (targetCamY - ccCamera.position.y) * 0.1;
    ccCamera.position.z += (targetCamZ - ccCamera.position.z) * 0.08;
    ccCamera.lookAt(astronaut.position.x * 0.5, 1.8 + astronaut.position.y * 0.7, astronaut.position.z - 2.5);

    let nearest = null;
    stations.forEach(st => {
        st.userData.ringMesh.scale.setScalar(1 + Math.sin(time * 4) * 0.06);
        const dist = Math.hypot(astronaut.position.x - st.userData.interactPos.x, astronaut.position.z - st.userData.interactPos.z);
        if (dist < 2.2) nearest = st.userData;
    });

    activeStation = nearest;
    const promptBtn = document.getElementById('station-prompt');
    if (activeStation) {
        document.getElementById('prompt-station-name').innerText = `${activeStation.num}. ${activeStation.title}`;
        promptBtn.classList.remove('hidden');
    } else {
        promptBtn.classList.add('hidden');
    }
}

function openStationModal(station) {
    isModalOpen = true;
    stopShipPreview();

    const modal = document.getElementById('console-modal');
    const card = document.getElementById('console-modal-card');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    card.classList.remove('garage-wide');
    title.innerText = `${station.num} • ${station.title}`;

    if (station.id === 'planning') {
        body.innerHTML = `
            <p style="color:#94a3b8; margin-bottom:12px;">Elige el destino planetario de tu expedición (cada misión otorga <strong>Créditos Galácticos</strong> al completarla):</p>
            <div class="option-grid">
                ${GAME_DATA.missions.map(m => `
                    <div class="option-card ${GAME_STATE.selectedMission.id === m.id ? 'selected' : ''}" onclick="selectMission('${m.id}')">
                        <h4>🪐 ${m.name}</h4>
                        <p><strong>Dificultad:</strong> ${m.difficulty}</p>
                        <p style="color:#fbbf24; font-weight:700; margin:4px 0;">💰 Recompensa: +${m.rewardCredits} CR</p>
                        <p>${m.desc}</p>
                    </div>
                `).join('')}
            </div>
            <button class="btn-primary" onclick="closeStationModal()">Confirmar Destino</button>
        `;
    } else if (station.id === 'engineering') {
        card.classList.add('garage-wide');
        garageFeedbackMsg = '';
        renderGarageContent();
    } else {
        const sc = GAME_STATE.shipConfig;
        body.innerHTML = `
            <div style="text-align:center; padding: 10px 0;">
                <p style="font-size:1.05rem; margin-bottom:8px;">Destino: <strong style="color:#38bdf8;">${GAME_STATE.selectedMission.name}</strong> (<span style="color:#fbbf24;">+${GAME_STATE.selectedMission.rewardCredits} CR</span>)</p>
                <p style="color:#94a3b8; margin-bottom:8px;">Rol activo: <strong style="color:${GAME_STATE.selectedRole.colorCss};">${GAME_STATE.selectedRole.name}</strong></p>
                <p style="color:#94a3b8; margin-bottom:16px;">Piezas instaladas: <strong>${sc.hull.name}</strong> • <strong>${sc.cockpit.name}</strong> • <strong>${sc.booster.name}</strong> • <strong>${sc.wing.name}</strong></p>
                <p style="background:rgba(56,189,248,0.14); border:1px solid #38bdf8; padding:12px; border-radius:10px; font-size:0.9rem; margin-bottom:18px;">
                    🧭 <strong>Misión:</strong> Pilota tu nave personalizada esquivando meteoritos. Al aterrizar en la base del planeta, completa las <strong>3 pantallas iluminadas de tu rol</strong> y vuelve al centro verde para cobrar tu recompensa.
                </p>
                <button class="btn-primary" onclick="beginMissionLaunch(false)">🔥 INICIAR DESPEGUE AHORA</button>
            </div>
        `;
    }

    modal.classList.remove('hidden');
}

// Renderiza el Taller Modular Completo (8 categorías de piezas + personajes)
function renderGarageContent() {
    const body = document.getElementById('modal-body');
    const title = document.getElementById('modal-title');
    title.innerHTML = `02 • TALLER MODULAR DE NAVE <span style="float:right; color:#fbbf24; font-size:1rem;">💰 ${GAME_STATE.credits} CR</span>`;

    const tabs = [
        { id: 'primaryColors', label: '🎨 Color 1' },
        { id: 'secondaryColors', label: '🖌️ Color 2' },
        { id: 'hulls', label: '🚀 Fuselaje' },
        { id: 'cockpits', label: '🪟 Cabina' },
        { id: 'noses', label: '🛡️ Morro' },
        { id: 'wings', label: '🛸 Alas' },
        { id: 'boosters', label: '🔥 Motores' },
        { id: 'addons', label: '📡 Extras' },
        { id: 'crew', label: '🐾 Personaje/Rol' }
    ];

    const sc = GAME_STATE.shipConfig;
    const stats = GAME_STATE.getShipTotalStats();
    const speedPct = Math.min(100, Math.round(((stats.speedMult - 0.8) / 1.0) * 100));
    const shieldPct = Math.min(100, Math.round(((100 + stats.shieldBonus) / 260) * 100));
    const o2Pct = Math.min(100, Math.round(((130 + stats.o2Bonus) / 300) * 100));

    let itemsHtml = '';
    if (garageTab === 'crew') {
        itemsHtml = `
            <div class="section-label">Selecciona tu Backyardigan</div>
            <div class="option-grid">
                ${GAME_DATA.characters.map(c => `
                    <div class="option-card ${GAME_STATE.selectedCharacterId === c.id ? 'selected' : ''}" onclick="selectCharacterInGarage('${c.id}')">
                        <h4><span class="color-swatch" style="background:${c.colorCss};"></span> ${c.name}</h4>
                        <p>${c.species}</p>
                        <span class="price-badge ${GAME_STATE.selectedCharacterId === c.id ? 'equipped' : 'unlocked'}">
                            ${GAME_STATE.selectedCharacterId === c.id ? '✓ PERSONAJE ACTIVO' : 'ELEGIR'}
                        </span>
                    </div>
                `).join('')}
            </div>
            <div class="section-label">Selecciona tu Rol</div>
            <div class="option-grid">
                ${GAME_DATA.roles.map(role => `
                    <div class="option-card ${GAME_STATE.selectedRole.id === role.id ? 'selected' : ''}" onclick="selectRole('${role.id}')">
                        <h4><span class="color-swatch" style="background:${role.colorCss};"></span> ${role.name}</h4>
                        <p>${role.bonus}</p>
                        <span class="price-badge ${GAME_STATE.selectedRole.id === role.id ? 'equipped' : 'unlocked'}">
                            ${GAME_STATE.selectedRole.id === role.id ? '✓ ROL ACTIVO' : 'SELECCIONAR'}
                        </span>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        const list = GAME_DATA.shipCustomization[garageTab];
        const keyMap = {
            primaryColors: 'primaryColor',
            secondaryColors: 'secondaryColor',
            hulls: 'hull',
            cockpits: 'cockpit',
            noses: 'nose',
            wings: 'wing',
            boosters: 'booster',
            addons: 'addon'
        };
        const equippedId = sc[keyMap[garageTab]].id;

        itemsHtml = `
            <div class="option-grid">
                ${list.map(item => {
                    const isUnlocked = GAME_STATE.unlockedParts.includes(item.id);
                    const isEquipped = equippedId === item.id;
                    const swatchHtml = item.css ? `<span class="color-swatch" style="background:${item.css};"></span>` : '';
                    let badgeHtml = '';
                    if (isEquipped) {
                        badgeHtml = `<span class="price-badge equipped">✓ EQUIPADO</span>`;
                    } else if (isUnlocked) {
                        badgeHtml = `<span class="price-badge unlocked">DESBLOQUEADO (Instalar)</span>`;
                    } else {
                        badgeHtml = `<span class="price-badge locked">🔒 ${item.price} CR — Comprar</span>`;
                    }
                    return `
                        <div class="option-card ${isEquipped ? 'selected' : ''}" onclick="handleGarageItemClick('${garageTab}', '${item.id}')">
                            <h4>${swatchHtml} ${item.name}</h4>
                            <p>${item.desc}</p>
                            ${badgeHtml}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    body.innerHTML = `
        <div class="garage-layout">
            <div class="garage-left">
                <div id="ship-preview-canvas"></div>
                <p style="font-size:0.74rem; color:#94a3b8; margin-bottom:8px;">Arrastra con el ratón para girar la nave 3D</p>
                <div class="equipped-summary">
                    <strong>Configuración actual:</strong><br>
                    • Casco: ${sc.hull.name} | Cabina: ${sc.cockpit.name}<br>
                    • Morro: ${sc.nose.name} | Alas: ${sc.wing.name}<br>
                    • Motor: ${sc.booster.name} | Extra: ${sc.addon.name}
                </div>
                <div class="garage-stats">
                    <div class="stat-row">
                        <span><strong>🚀 Velocidad</strong><strong>${Math.round(stats.speedMult * 100)}%</strong></span>
                        <div class="progress-track"><div class="progress-fill cyan" style="width:${speedPct}%;"></div></div>
                    </div>
                    <div class="stat-row">
                        <span><strong>🛡️ Escudo</strong><strong>${100 + stats.shieldBonus}%</strong></span>
                        <div class="progress-track"><div class="progress-fill amber" style="width:${shieldPct}%;"></div></div>
                    </div>
                    <div class="stat-row">
                        <span><strong>🫁 Oxígeno</strong><strong>${130 + stats.o2Bonus}s</strong></span>
                        <div class="progress-track"><div class="progress-fill green" style="width:${o2Pct}%;"></div></div>
                    </div>
                </div>
            </div>

            <div>
                <div class="garage-tabs">
                    ${tabs.map(t => `<button class="garage-tab-btn ${garageTab === t.id ? 'active' : ''}" onclick="switchGarageTab('${t.id}')">${t.label}</button>`).join('')}
                </div>
                ${garageFeedbackMsg ? `<p style="color:#fbbf24; font-size:0.85rem; font-weight:700; margin-bottom:8px;">${garageFeedbackMsg}</p>` : ''}
                ${itemsHtml}
                <button class="btn-primary" onclick="closeStationModal()">Confirmar y Salir del Taller</button>
            </div>
        </div>
    `;

    initShipPreview3D();
}

function switchGarageTab(tabId) {
    garageTab = tabId;
    garageFeedbackMsg = '';
    renderGarageContent();
}

function handleGarageItemClick(category, itemId) {
    const list = GAME_DATA.shipCustomization[category];
    const item = list.find(i => i.id === itemId);
    if (!item) return;

    const keyMap = {
        primaryColors: 'primaryColor',
        secondaryColors: 'secondaryColor',
        hulls: 'hull',
        cockpits: 'cockpit',
        noses: 'nose',
        wings: 'wing',
        boosters: 'booster',
        addons: 'addon'
    };
    const isUnlocked = GAME_STATE.unlockedParts.includes(item.id);

    if (isUnlocked) {
        GAME_STATE.shipConfig[keyMap[category]] = item;
        garageFeedbackMsg = `✓ Pieza instalada: ${item.name}`;
        GAME_STATE.saveProgress();
        renderGarageContent();
    } else {
        if (GAME_STATE.credits >= item.price) {
            GAME_STATE.credits -= item.price;
            GAME_STATE.unlockedParts.push(item.id);
            GAME_STATE.shipConfig[keyMap[category]] = item;
            garageFeedbackMsg = `🎉 ¡Pieza comprada e instalada: ${item.name} (-${item.price} CR)!`;
            GAME_STATE.saveProgress();
            updateCreditsHUD();
            renderGarageContent();
        } else {
            garageFeedbackMsg = `⚠️ Créditos insuficientes (${item.price} CR). ¡Completa misiones en los planetas para ganar más!`;
            renderGarageContent();
        }
    }
}

function selectCharacterInGarage(charId) {
    GAME_STATE.selectedCharacterId = charId;
    GAME_STATE.saveProgress();
    MP.syncLocalPlayerEntry();
    MP.renderPlayersList();
    MP.broadcastRoomState();
    rebuildControlCenterAstronaut(astroRig.group.position.clone());
    renderGarageContent();
}

function initShipPreview3D() {
    stopShipPreview();
    const box = document.getElementById('ship-preview-canvas');
    if (!box) return;

    previewScene = new THREE.Scene();
    previewCamera = new THREE.PerspectiveCamera(45, box.clientWidth / box.clientHeight, 0.1, 50);
    previewCamera.position.set(0, 0.4, 6.2);

    previewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    previewRenderer.setSize(box.clientWidth, box.clientHeight);
    box.appendChild(previewRenderer.domElement);

    previewScene.add(new THREE.AmbientLight(0xffffff, 0.95));
    const dirLight = new THREE.DirectionalLight(0xe0f2fe, 1.3);
    dirLight.position.set(5, 8, 6);
    previewScene.add(dirLight);

    previewRocket = buildCustom3DRocket(true);
    previewRocket.scale.setScalar(0.84);
    previewRocket.rotation.y = previewRotY;
    previewScene.add(previewRocket);

    box.onmousedown = e => {
        previewDragging = true;
        previewPrevX = e.clientX;
    };
    window.addEventListener('mouseup', stopPreviewDrag);
    window.addEventListener('mousemove', movePreviewDrag);

    function animatePreview() {
        previewAnimId = requestAnimationFrame(animatePreview);
        if (!previewDragging && previewRocket) {
            previewRotY += 0.012;
        }
        if (previewRocket) {
            previewRocket.rotation.y = previewRotY;
            if (previewRocket.userData.flames) {
                previewRocket.userData.flames.forEach(f => { f.scale.y = 0.85 + Math.random() * 0.4; });
            }
        }
        previewRenderer.render(previewScene, previewCamera);
    }
    animatePreview();
}

function stopPreviewDrag() { previewDragging = false; }
function movePreviewDrag(e) {
    if (!previewDragging) return;
    previewRotY += (e.clientX - previewPrevX) * 0.015;
    previewPrevX = e.clientX;
}

function stopShipPreview() {
    if (previewAnimId) cancelAnimationFrame(previewAnimId);
    window.removeEventListener('mouseup', stopPreviewDrag);
    window.removeEventListener('mousemove', movePreviewDrag);
    if (previewRenderer) {
        try { previewRenderer.dispose(); } catch (_) {}
        previewRenderer = null;
    }
}

function selectMission(id) {
    GAME_STATE.selectedMission = GAME_DATA.missions.find(m => m.id === id);
    updateTopMissionBadge();
    openStationModal(activeStation);
}

function selectRole(id) {
    GAME_STATE.selectedRole = GAME_DATA.roles.find(r => r.id === id);
    MP.syncLocalPlayerEntry();
    MP.renderPlayersList();
    MP.broadcastRoomState();
    rebuildControlCenterAstronaut(astroRig.group.position.clone());
    updateTopMissionBadge();
    if (garageTab === 'crew') {
        renderGarageContent();
    } else {
        openStationModal(activeStation);
    }
}

function updateTopMissionBadge() {
    document.getElementById('active-mission-badge').innerHTML =
        `Destino: <strong>${GAME_STATE.selectedMission.name}</strong> | Rol: <strong>${GAME_STATE.selectedRole.short}</strong>`;
}

function closeStationModal() {
    isModalOpen = false;
    stopShipPreview();
    document.getElementById('console-modal').classList.add('hidden');
}

function beginMissionLaunch(fromNetwork) {
    if (!fromNetwork) {
        MP.broadcastLaunch();
    }
    closeStationModal();
    document.getElementById('lobby-modal').classList.add('hidden');
    const hub = document.getElementById('control-center-container');
    hub.classList.add('shaking');

    setTimeout(() => {
        hub.classList.remove('shaking');
        hub.classList.add('hidden');
        cancelAnimationFrame(ccAnimId);
        document.getElementById('arena-container').classList.remove('hidden');
        start3DSpaceAndPlanetGame();
    }, 1600);
}

function animateControlCenter() {
    ccAnimId = requestAnimationFrame(animateControlCenter);
    const now = performance.now();
    const dt = Math.min(0.05, (now - ccLastTime) / 1000);
    ccLastTime = now;
    updateAstronautAndCamera(now * 0.001, dt);
    ccRenderer.render(ccScene, ccCamera);
}

window.onload = () => {
    MP.initLobbyUI();
    initControlCenter();
};
