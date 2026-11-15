let ccScene, ccCamera, ccRenderer, ccAnimId;
var astroRig = null;
let windowPlanet = null;
let astroVelY = 0;
let astroGrounded = true;
let remoteCCAstros = {};
let stations = [];
let activeStation = null;
var ccKeys = {};
let isModalOpen = false;
let camYaw = 0;
let ccLastTime = 0;
let lastPointerUnlockAt = 0;

let garageTab = 'noses';
let garageFeedbackMsg = '';
let previewScene, previewCamera, previewRenderer, previewRocket, previewAnimId;
let previewRotY = 0.6;
let previewDragging = false;
let previewPrevX = 0;
let previewLastTime = 0;

function resetAllInputStates() {
    ccKeys = {};
    if (typeof arenaKeys !== 'undefined') {
        arenaKeys = {};
    }
}

function isAnyGameModalOpen() {
    const ids = ['lobby-modal', 'console-modal', 'planet-task-modal', 'report-modal'];
    return ids.some(id => {
        const el = document.getElementById(id);
        return el && !el.classList.contains('hidden');
    });
}

function getActiveGameCanvas() {
    const ccHidden = document.getElementById('control-center-container').classList.contains('hidden');
    if (!ccHidden) {
        return document.querySelector('#webgl-canvas-container canvas');
    }
    return document.querySelector('#arena-webgl-container canvas');
}

function lockGamePointer() {
    if (isAnyGameModalOpen()) return;
    const canvas = getActiveGameCanvas();
    if (canvas && document.pointerLockElement !== canvas && canvas.requestPointerLock) {
        try {
            const promise = canvas.requestPointerLock();
            if (promise && typeof promise.catch === 'function') {
                promise.catch(() => {});
            }
        } catch (_) {}
    }
}

function unlockGamePointer() {
    if (document.pointerLockElement && document.exitPointerLock) {
        try {
            document.exitPointerLock();
        } catch (_) {}
    }
}

function updatePointerLockStatusHint() {
    const bar = document.getElementById('cc-controls-bar');
    if (!bar) return;
    const ccHidden = document.getElementById('control-center-container').classList.contains('hidden');
    if (ccHidden) {
        bar.classList.add('hidden');
        return;
    }
    bar.classList.remove('hidden');
    const locked = !!document.pointerLockElement;
    bar.innerHTML = `
        <span><kbd>WASD</kbd> / <kbd>Flechas</kbd> Moverse</span>
        <span><kbd>Espacio</kbd> Saltar</span>
        <span><kbd>Shift</kbd> Correr</span>
        <span><kbd>E</kbd> Interactuar</span>
        <span><kbd>ESC</kbd> ${locked ? 'Mostrar Ratón' : 'Ocultar Ratón'}</span>
    `;
}

function initControlCenter() {
    const container = document.getElementById('webgl-canvas-container');
    container.innerHTML = '';
    remoteCCAstros = {};
    resetAllInputStates();

    ccScene = new THREE.Scene();
    ccScene.background = new THREE.Color(0x060b19);
    ccScene.fog = new THREE.Fog(0x060b19, 28, 70);

    ccCamera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 120);
    ccCamera.position.set(0, 8.5, 13.5);

    ccRenderer = new THREE.WebGLRenderer({ antialias: true });
    ccRenderer.setSize(container.clientWidth, container.clientHeight);
    ccRenderer.shadowMap.enabled = true;
    container.appendChild(ccRenderer.domElement);

    ccScene.add(new THREE.AmbientLight(0x94a3b8, 1.0));

    const mainLight = new THREE.DirectionalLight(0xe0f2fe, 1.15);
    mainLight.position.set(8, 18, 10);
    mainLight.castShadow = true;
    ccScene.add(mainLight);

    const cyanGlow = new THREE.PointLight(0x38bdf8, 1.5, 32);
    cyanGlow.position.set(0, 6.5, -4);
    ccScene.add(cyanGlow);

    buildControlRoom();
    updateWindowPlanet(GAME_STATE.currentOrbitId);
    rebuildControlCenterAstronaut(new THREE.Vector3(0, 0, 4.5));
    buildStations();
    setupControlCenterEvents(container);
    updateCreditsHUD();
    updateTopMissionBadge();
    updatePointerLockStatusHint();

    ccLastTime = performance.now();
    animateControlCenter();
}

function updateCreditsHUD() {
    const el = document.getElementById('hud-credits');
    if (el) el.innerText = `${GAME_STATE.credits} CR`;
}

function updateTopMissionBadge() {
    const badge = document.getElementById('active-mission-badge');
    if (badge) {
        badge.innerHTML = `Destino: <strong>${GAME_STATE.selectedMission.name}</strong> | Rol: <strong>${GAME_STATE.selectedRole.short}</strong>`;
    }
}

function rebuildControlCenterAstronaut(pos) {
    if (!ccScene) return;
    if (astroRig && astroRig.group) {
        ccScene.remove(astroRig.group);
    }
    const role = GAME_STATE.selectedRole;
    const char = GAME_DATA.characters.find(c => c.id === GAME_STATE.selectedCharacterId) || GAME_DATA.characters[0];
    astroRig = createBackyardiganCharacter(char.id, {
        name: MP.myName,
        charName: char.shortName,
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

        const charId = p.characterId || 'pablo';
        if (!remoteCCAstros[p.id] || remoteCCAstros[p.id].charId !== charId || remoteCCAstros[p.id].name !== p.name || remoteCCAstros[p.id].roleId !== p.roleId) {
            if (remoteCCAstros[p.id]) {
                ccScene.remove(remoteCCAstros[p.id].rig.group);
            }
            const role = GAME_DATA.roles.find(r => r.id === p.roleId) || GAME_DATA.roles[0];
            const char = GAME_DATA.characters.find(c => c.id === charId) || GAME_DATA.characters[0];
            const rig = createBackyardiganCharacter(charId, {
                name: p.name,
                charName: char.shortName,
                roleShort: role.short,
                colorCss: role.colorCss
            });
            rig.group.position.set(p.x || 0, p.y || 0, p.z || 3);
            ccScene.add(rig.group);
            remoteCCAstros[p.id] = { rig, charId, name: p.name, roleId: p.roleId };
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

    const grid = new THREE.GridHelper(24, 24, 0x38bdf8, 0x1e293b);
    grid.position.y = 0.005;
    ccScene.add(grid);

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
            new THREE.BoxGeometry(1.0, 9.5, 24),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
        );
        wall.position.set(xWall, 4.75, 0);
        ccScene.add(wall);

        for (let z = -8; z <= 8; z += 5.5) {
            const panel = new THREE.Mesh(
                new THREE.BoxGeometry(1.1, 3.2, 2.8),
                new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.45 })
            );
            panel.position.set(xWall > 0 ? xWall - 0.1 : xWall + 0.1, 3.4, z);
            ccScene.add(panel);
        }
    });

    const frontWall = new THREE.Mesh(
        new THREE.BoxGeometry(26, 9.5, 1.0),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
    );
    frontWall.position.set(0, 4.75, 11.8);
    ccScene.add(frontWall);

    const ceiling = new THREE.Mesh(
        new THREE.BoxGeometry(26, 0.6, 24),
        new THREE.MeshStandardMaterial({ color: 0x0b1324, roughness: 0.6 })
    );
    ceiling.position.set(0, 9.6, 0);
    ccScene.add(ceiling);

    const backWallBottom = new THREE.Mesh(
        new THREE.BoxGeometry(26, 2.2, 0.9),
        new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    backWallBottom.position.set(0, 1.1, -11.5);
    ccScene.add(backWallBottom);

    const backWallTop = new THREE.Mesh(
        new THREE.BoxGeometry(26, 1.6, 0.9),
        new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    backWallTop.position.set(0, 8.7, -11.5);
    ccScene.add(backWallTop);

    const windowFrame = new THREE.Mesh(
        new THREE.BoxGeometry(24, 0.25, 1.05),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    windowFrame.position.set(0, 2.2, -11.5);
    ccScene.add(windowFrame);

    const topFrame = windowFrame.clone();
    topFrame.position.set(0, 7.9, -11.5);
    ccScene.add(topFrame);

    const starGeo = new THREE.BufferGeometry();
    const starVertices = [];
    for (let i = 0; i < 450; i++) {
        starVertices.push((Math.random() - 0.5) * 90, Math.random() * 35 + 1, -14 - Math.random() * 40);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    ccScene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.25 })));
}

function updateWindowPlanet(planetId) {
    if (!ccScene) return;
    if (windowPlanet && windowPlanet.group) {
        ccScene.remove(windowPlanet.group);
    }
    const targetId = planetId || 'earth';
    windowPlanet = createHDPlanet(targetId, 14);
    windowPlanet.group.position.set(0, 4.5, -36);
    ccScene.add(windowPlanet.group);

    const orbitLabel = document.getElementById('orbit-location-label');
    if (orbitLabel) {
        if (targetId === 'earth') {
            orbitLabel.innerText = 'ÓRBITA ACTUAL: PLANETA TIERRA';
        } else {
            const m = GAME_DATA.missions.find(x => x.id === targetId);
            orbitLabel.innerText = m ? m.orbitLabel : 'ÓRBITA ACTUAL: ESPACIO PROFUNDO';
        }
    }
}

function createConsoleLabelSprite(text, hexColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 88;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 380, 68, 14);
    ctx.fill();

    ctx.strokeStyle = hexColor;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 200, 52);

    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.scale.set(3.4, 0.78, 1);
    return sprite;
}

function buildStations() {
    stations = [];
    const stationDefs = [
        {
            id: 'planet',
            name: '1. Mapa Estelar y Destino',
            label: 'PANEL 1: DESTINO',
            x: -6.8,
            z: -5.2,
            color: 0x38bdf8,
            cssColor: '#38bdf8'
        },
        {
            id: 'garage',
            name: '2. Taller de Nave Espacial',
            label: 'PANEL 2: TALLER NAVE',
            x: 6.8,
            z: -5.2,
            color: 0xf59e0b,
            cssColor: '#f59e0b'
        },
        {
            id: 'protocol',
            name: '3. Protocolo EVA y Rol',
            label: 'PANEL 3: TRAJE Y ROL',
            x: -6.8,
            z: 3.6,
            color: 0xa855f7,
            cssColor: '#a855f7'
        },
        {
            id: 'launch',
            name: '4. Consola de Ignición y Despliegue',
            label: 'PANEL 4: DESPLEGAR',
            x: 6.8,
            z: 3.6,
            color: 0x10b981,
            cssColor: '#10b981'
        }
    ];

    stationDefs.forEach(def => {
        const group = new THREE.Group();
        group.position.set(def.x, 0, def.z);

        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(1.15, 1.35, 1.15, 20),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.5 })
        );
        base.position.y = 0.575;
        group.add(base);

        const screen = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.9, 0.14),
            new THREE.MeshStandardMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 0.65 })
        );
        screen.position.set(0, 1.55, 0);
        screen.rotation.x = -0.35;
        group.add(screen);

        const ring = new THREE.Mesh(
            new THREE.RingGeometry(1.55, 1.8, 32),
            new THREE.MeshBasicMaterial({ color: def.color, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.03;
        group.add(ring);

        const tag = createConsoleLabelSprite(def.label, def.cssColor);
        tag.position.set(0, 2.55, 0);
        group.add(tag);

        ccScene.add(group);
        stations.push({ ...def, group, screen, ring });
    });
}

function setupControlCenterEvents(container) {
    document.addEventListener('contextmenu', e => {
        e.preventDefault();
    });

    window.addEventListener('blur', () => {
        resetAllInputStates();
    });

    document.addEventListener('pointerlockchange', () => {
        if (!document.pointerLockElement) {
            lastPointerUnlockAt = performance.now();
        }
        updatePointerLockStatusHint();
    });

    // Sensibilidad de cámara suave (0.0014) para evitar giros bruscos
    window.addEventListener('mousemove', e => {
        if (!document.pointerLockElement || isAnyGameModalOpen()) return;
        const dx = Math.max(-60, Math.min(60, e.movementX || 0));
        const ccHidden = document.getElementById('control-center-container').classList.contains('hidden');
        if (!ccHidden) {
            camYaw -= dx * 0.0014;
        } else if (typeof arenaPhase !== 'undefined' && arenaPhase === 'base_ops') {
            baseCamYaw -= dx * 0.0014;
        }
    });

    container.addEventListener('mousedown', e => {
        if (e.button === 2) return;
        if (!isAnyGameModalOpen()) {
            lockGamePointer();
        }
    });

    window.addEventListener('keydown', e => {
        if (e.code === 'Escape') {
            if (isModalOpen) {
                closeConsoleModal();
                return;
            }
            if (typeof isTaskModalOpen !== 'undefined' && isTaskModalOpen) {
                if (typeof closeTaskModal === 'function') closeTaskModal();
                return;
            }
            if (!isAnyGameModalOpen() && !document.pointerLockElement) {
                if (performance.now() - lastPointerUnlockAt > 160) {
                    lockGamePointer();
                }
            }
            return;
        }

        if (document.getElementById('control-center-container').classList.contains('hidden')) return;
        if (isAnyGameModalOpen()) return;

        ccKeys[e.code] = true;

        if (e.code === 'Space' && !isModalOpen && astroGrounded) {
            astroVelY = 0.22;
            astroGrounded = false;
        }
        if (e.code === 'KeyE' && !isModalOpen && activeStation) {
            openStationModal(activeStation);
        }
    });

    window.addEventListener('keyup', e => {
        ccKeys[e.code] = false;
    });

    document.getElementById('station-prompt').onclick = () => {
        if (activeStation && !isModalOpen) openStationModal(activeStation);
    };

    document.getElementById('close-modal-btn').onclick = closeConsoleModal;

    window.addEventListener('resize', () => {
        if (!ccRenderer || !ccCamera) return;
        const c = document.getElementById('webgl-canvas-container');
        if (!c || c.clientWidth === 0) return;
        ccCamera.aspect = c.clientWidth / c.clientHeight;
        ccCamera.updateProjectionMatrix();
        ccRenderer.setSize(c.clientWidth, c.clientHeight);
    });
}

function closeConsoleModal() {
    isModalOpen = false;
    resetAllInputStates();
    document.getElementById('console-modal').classList.add('hidden');
    document.getElementById('console-modal-card').classList.remove('garage-wide');
    if (previewAnimId) {
        cancelAnimationFrame(previewAnimId);
        previewAnimId = null;
    }
    lockGamePointer();
}

function openStationModal(station) {
    isModalOpen = true;
    resetAllInputStates();
    unlockGamePointer();

    const modal = document.getElementById('console-modal');
    const card = document.getElementById('console-modal-card');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    card.classList.remove('garage-wide');
    title.innerText = station.name;

    if (station.id === 'planet') {
        renderPlanetStationUI(body);
    } else if (station.id === 'garage') {
        card.classList.add('garage-wide');
        garageFeedbackMsg = '';
        renderGarageStationUI(body);
    } else if (station.id === 'protocol') {
        renderProtocolStationUI(body);
    } else if (station.id === 'launch') {
        renderLaunchStationUI(body);
    }

    modal.classList.remove('hidden');
}

function renderPlanetStationUI(body) {
    const canChoose = MP.isHost;
    body.innerHTML = `
        <p style="color:#cbd5e1; font-size:0.88rem; margin-bottom:12px;">
            ${canChoose
                ? 'Selecciona el destino planetario para toda la tripulación. Cada planeta tiene desafíos y minijuegos científicos distintos.'
                : 'Solo el Anfitrión de la sala puede cambiar el destino planetario.'}
        </p>
        <div class="option-grid">
            ${GAME_DATA.missions.map(m => `
                <div class="option-card ${GAME_STATE.selectedMission.id === m.id ? 'selected' : ''}" data-mid="${m.id}" style="${!canChoose ? 'cursor:default;' : ''}">
                    <h4>🪐 ${m.name}</h4>
                    <p>${m.desc}</p>
                    <span class="price-badge unlocked">Dificultad: ${m.difficulty} • +${m.rewardCredits} CR</span>
                </div>
            `).join('')}
        </div>
        <button id="confirm-planet-btn" class="btn-primary">✓ Confirmar y Cerrar</button>
    `;

    if (canChoose) {
        body.querySelectorAll('.option-card').forEach(el => {
            el.onclick = () => {
                const found = GAME_DATA.missions.find(x => x.id === el.dataset.mid);
                if (found) {
                    GAME_STATE.selectedMission = found;
                    updateWindowPlanet(found.id);
                    updateTopMissionBadge();
                    MP.broadcastRoomState();
                    renderPlanetStationUI(body);
                }
            };
        });
    }

    document.getElementById('confirm-planet-btn').onclick = closeConsoleModal;
}

function renderProtocolStationUI(body) {
    MP.refreshTakenRolesFromPlayers();
    const currentRole = GAME_STATE.selectedRole;
    const currentProto = GAME_STATE.selectedSuitProtocol || GAME_DATA.suitProtocols[0];
    const previewTasks = getMissionTasksForRole(GAME_STATE.selectedMission.id, currentRole.id, MP.roomCode);

    body.innerHTML = `
        <p style="color:#cbd5e1; font-size:0.86rem; margin-bottom:10px;">
            Configura el <strong>protocolo técnico de tu traje EVA</strong> y revisa las <strong>5 terminales asignadas en ${GAME_STATE.selectedMission.name}</strong>.
        </p>

        <div class="section-label">1. Protocolo de Soporte Vital del Traje EVA</div>
        <div class="option-grid">
            ${GAME_DATA.suitProtocols.map(sp => `
                <div class="option-card ${currentProto.id === sp.id ? 'selected' : ''}" data-proto="${sp.id}">
                    <h4>🧑‍🚀 ${sp.name}</h4>
                    <p>${sp.desc}</p>
                    <span class="price-badge ${currentProto.id === sp.id ? 'equipped' : 'unlocked'}">
                        ${currentProto.id === sp.id ? '✓ ACTIVO' : 'Seleccionar'}
                    </span>
                </div>
            `).join('')}
        </div>

        <div class="section-label">2. Especialidad de Tripulación (Roles únicos en sala)</div>
        <div class="option-grid">
            ${GAME_DATA.roles.map(r => {
                const takenBy = MP.takenRolesByOthers[r.id];
                const isSel = !takenBy && currentRole.id === r.id;
                return `
                    <div class="option-card ${isSel ? 'selected' : ''} ${takenBy ? 'taken' : ''}" data-role="${r.id}">
                        <h4><span class="color-swatch" style="background:${r.colorCss};"></span> ${r.name}</h4>
                        <p>${r.bonus}</p>
                        ${takenBy ? `<span class="role-taken-pill">🔒 Ocupado por ${takenBy}</span>` : ''}
                    </div>
                `;
            }).join('')}
        </div>

        <div class="section-label">3. Tus 5 Terminales Asignadas en ${GAME_STATE.selectedMission.name}</div>
        <div class="task-preview-list">
            ${previewTasks.map((t, idx) => `
                <div>
                    <strong>${idx + 1}. ${t.title}</strong> — <span style="color:${currentRole.colorCss};">${t.roomName}</span>
                </div>
            `).join('')}
        </div>

        <button id="save-protocol-btn" class="btn-primary">✓ Guardar Configuración</button>
    `;

    body.querySelectorAll('[data-proto]').forEach(el => {
        el.onclick = () => {
            const p = GAME_DATA.suitProtocols.find(x => x.id === el.dataset.proto);
            if (p) {
                GAME_STATE.selectedSuitProtocol = p;
                renderProtocolStationUI(body);
            }
        };
    });

    body.querySelectorAll('[data-role]').forEach(el => {
        el.onclick = () => {
            const rid = el.dataset.role;
            if (MP.takenRolesByOthers[rid]) return;
            const role = GAME_DATA.roles.find(r => r.id === rid);
            if (role) {
                GAME_STATE.selectedRole = role;
                MP.syncLocalPlayerEntry();
                MP.broadcastRoomState();
                updateTopMissionBadge();
                if (astroRig) rebuildControlCenterAstronaut(astroRig.group.position.clone());
                renderProtocolStationUI(body);
            }
        };
    });

    document.getElementById('save-protocol-btn').onclick = closeConsoleModal;
}

function renderLaunchStationUI(body) {
    const m = GAME_STATE.selectedMission;
    const r = GAME_STATE.selectedRole;
    const stats = GAME_STATE.getShipTotalStats();
    const crew = Object.values(MP.players);

    body.innerHTML = `
        <div class="task-preview-list" style="margin-bottom:14px;">
            <div>🪐 <strong>Destino Seleccionado:</strong> ${m.name} (${m.difficulty} — Recompensa: +${m.rewardCredits} CR)</div>
            <div>🧑‍🚀 <strong>Tu Especialidad:</strong> <span style="color:${r.colorCss}; font-weight:700;">${r.name}</span> (${GAME_STATE.selectedSuitProtocol.name})</div>
            <div>🚀 <strong>Bonificaciones de Nave + Traje:</strong> Velocidad ×${stats.speedMult.toFixed(2)} | Escudo +${stats.shieldBonus}% | Oxígeno +${stats.o2Bonus}s</div>
        </div>

        <div class="section-label">Tripulación en la Nave (${crew.length}/${MP.maxPlayers})</div>
        <div class="players-list" style="margin-bottom:14px;">
            ${crew.map(p => {
                const pr = GAME_DATA.roles.find(x => x.id === p.roleId) || GAME_DATA.roles[0];
                const pc = GAME_DATA.characters.find(x => x.id === p.characterId) || GAME_DATA.characters[0];
                return `
                    <div class="player-slot-row" style="cursor:default;">
                        <span><strong>${p.name}</strong> (${pc.shortName})</span>
                        <span style="color:${pr.colorCss}; font-weight:700;">${pr.short}</span>
                    </div>
                `;
            }).join('')}
        </div>

        ${MP.isHost
            ? `<p style="font-size:0.82rem; color:#94a3b8; margin-bottom:10px;">
                   Como <strong>Anfitrión de la sala</strong>, al iniciar la ignición toda la tripulación despegará junta hacia <strong>${m.name}</strong>.
               </p>
               <button id="deploy-ship-btn" class="btn-primary">🚀 INICIAR IGNICIÓN Y DESPEGAR NAVE</button>`
            : `<div style="background:rgba(245,158,11,0.15); border:1px solid #f59e0b; border-radius:10px; padding:12px; color:#fde68a; font-size:0.86rem; text-align:center; font-weight:600;">
                   ⏳ Esperando a que el Anfitrión (creador de la sala) inicie el despegue de toda la tripulación...
               </div>`
        }
    `;

    const deployBtn = document.getElementById('deploy-ship-btn');
    if (deployBtn && MP.isHost) {
        deployBtn.onclick = () => {
            beginMissionLaunch(false);
        };
    }
}

function renderGarageStationUI(body) {
    const stats = GAME_STATE.getShipTotalStats();
    const cfg = GAME_STATE.shipConfig;

    const tabDefs = [
        { key: 'noses', label: 'Punta', list: GAME_DATA.shipCustomization.noses, cur: cfg.nose.id, field: 'nose' },
        { key: 'wings', label: 'Alas', list: GAME_DATA.shipCustomization.wings, cur: cfg.wing.id, field: 'wing' },
        { key: 'boosters', label: 'Propulsores', list: GAME_DATA.shipCustomization.boosters, cur: cfg.booster.id, field: 'booster' },
        { key: 'hulls', label: 'Fuselaje', list: GAME_DATA.shipCustomization.hulls, cur: cfg.hull.id, field: 'hull' },
        { key: 'primaryColors', label: 'Color Base', list: GAME_DATA.shipCustomization.primaryColors, cur: cfg.primaryColor.id, field: 'primaryColor' },
        { key: 'secondaryColors', label: 'Franjas', list: GAME_DATA.shipCustomization.secondaryColors, cur: cfg.secondaryColor.id, field: 'secondaryColor' }
    ];

    const activeTabObj = tabDefs.find(t => t.key === garageTab) || tabDefs[0];
    const speedPct = Math.min(100, Math.round((stats.speedMult - 0.85) * 140));
    const shieldPct = Math.min(100, Math.round((stats.shieldBonus / 120) * 100));
    const o2Pct = Math.min(100, Math.round((stats.o2Bonus / 140) * 100));

    body.innerHTML = `
        <div class="garage-layout">
            <div class="garage-left">
                <div id="ship-preview-canvas"></div>
                <div class="equipped-summary">
                    <div>💰 <strong>Créditos Disponibles:</strong> <span style="color:#fbbf24;">${GAME_STATE.credits} CR</span></div>
                    <div>🚀 <strong>Configuración:</strong> ${cfg.nose.name} • ${cfg.wing.name} • ${cfg.booster.name}</div>
                </div>
                <div class="garage-stats">
                    <div class="stat-row">
                        <span><strong>Velocidad Orbital</strong><strong>×${stats.speedMult.toFixed(2)}</strong></span>
                        <div class="progress-track"><div class="progress-fill cyan" style="width:${Math.max(18, speedPct)}%;"></div></div>
                    </div>
                    <div class="stat-row">
                        <span><strong>Blindaje de Escudo</strong><strong>+${stats.shieldBonus}%</strong></span>
                        <div class="progress-track"><div class="progress-fill amber" style="width:${Math.max(12, shieldPct)}%;"></div></div>
                    </div>
                    <div class="stat-row">
                        <span><strong>Reserva Extra O2</strong><strong>+${stats.o2Bonus}s</strong></span>
                        <div class="progress-track"><div class="progress-fill green" style="width:${Math.max(12, o2Pct)}%;"></div></div>
                    </div>
                </div>
            </div>

            <div>
                <div class="garage-tabs">
                    ${tabDefs.map(t => `
                        <button class="garage-tab-btn ${t.key === garageTab ? 'active' : ''}" data-gtab="${t.key}">${t.label}</button>
                    `).join('')}
                </div>

                ${garageFeedbackMsg ? `<p style="font-size:0.82rem; color:#fbbf24; margin-bottom:8px; font-weight:600;">${garageFeedbackMsg}</p>` : ''}

                <div class="option-grid">
                    ${activeTabObj.list.map(item => {
                        const isUnlocked = GAME_STATE.unlockedParts.includes(item.id) || item.price === 0;
                        const isEquipped = activeTabObj.cur === item.id;
                        const swatch = item.css ? `<span class="color-swatch" style="background:${item.css};"></span>` : '';
                        let badgeHtml = '';
                        if (isEquipped) {
                            badgeHtml = `<span class="price-badge equipped">✓ EQUIPADO</span>`;
                        } else if (isUnlocked) {
                            badgeHtml = `<span class="price-badge unlocked">Equipar (Desbloqueado)</span>`;
                        } else {
                            badgeHtml = `<span class="price-badge locked">🔒 Comprar: ${item.price} CR</span>`;
                        }
                        return `
                            <div class="option-card ${isEquipped ? 'selected' : ''}" data-part="${item.id}">
                                <h4>${swatch}${item.name}</h4>
                                <p>${item.desc}</p>
                                ${badgeHtml}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;

    body.querySelectorAll('.garage-tab-btn').forEach(btn => {
        btn.onclick = () => {
            garageTab = btn.dataset.gtab;
            garageFeedbackMsg = '';
            renderGarageStationUI(body);
        };
    });

    body.querySelectorAll('[data-part]').forEach(cardEl => {
        cardEl.onclick = () => {
            const partId = cardEl.dataset.part;
            const part = activeTabObj.list.find(x => x.id === partId);
            if (!part) return;

            const isUnlocked = GAME_STATE.unlockedParts.includes(part.id) || part.price === 0;
            if (!isUnlocked) {
                if (GAME_STATE.credits < part.price) {
                    garageFeedbackMsg = `⚠️ Créditos insuficientes (${part.price} CR necesarios). Completa misiones para ganar más.`;
                    renderGarageStationUI(body);
                    return;
                }
                GAME_STATE.credits -= part.price;
                GAME_STATE.unlockedParts.push(part.id);
                garageFeedbackMsg = `🎉 ¡Pieza "${part.name}" comprada y equipada!`;
                updateCreditsHUD();
            } else {
                garageFeedbackMsg = '';
            }

            GAME_STATE.shipConfig[activeTabObj.field] = part;
            GAME_STATE.saveProgress();
            renderGarageStationUI(body);
        };
    });

    initShipPreview3D();
}

function initShipPreview3D() {
    const holder = document.getElementById('ship-preview-canvas');
    if (!holder) return;
    holder.innerHTML = '';

    if (previewAnimId) cancelAnimationFrame(previewAnimId);

    previewScene = new THREE.Scene();
    previewCamera = new THREE.PerspectiveCamera(45, holder.clientWidth / holder.clientHeight, 0.1, 50);
    previewCamera.position.set(0, 0.5, 6.4);

    previewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    previewRenderer.setSize(holder.clientWidth, holder.clientHeight);
    holder.appendChild(previewRenderer.domElement);

    previewScene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dir = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dir.position.set(4, 6, 5);
    previewScene.add(dir);

    previewRocket = buildCustom3DRocket(true);
    previewRocket.scale.setScalar(0.88);
    previewRocket.position.y = 0.25;
    previewScene.add(previewRocket);

    holder.onmousedown = e => {
        previewDragging = true;
        previewPrevX = e.clientX;
    };
    window.addEventListener('mousemove', e => {
        if (!previewDragging) return;
        const dx = e.clientX - previewPrevX;
        previewPrevX = e.clientX;
        previewRotY += dx * 0.015;
    });
    window.addEventListener('mouseup', () => {
        previewDragging = false;
    });

    previewLastTime = performance.now();
    function loopPreview(now) {
        if (!document.getElementById('ship-preview-canvas')) return;
        const dt = Math.min(0.05, (now - previewLastTime) / 1000);
        previewLastTime = now;

        if (!previewDragging) previewRotY += dt * 0.8;
        if (previewRocket) {
            previewRocket.rotation.y = previewRotY;
            animateRocketExhaust(previewRocket, dt);
        }
        previewRenderer.render(previewScene, previewCamera);
        previewAnimId = requestAnimationFrame(loopPreview);
    }
    previewAnimId = requestAnimationFrame(loopPreview);
}

function beginMissionLaunch(fromRemote) {
    if (!fromRemote && !MP.isHost) return;

    isModalOpen = false;
    resetAllInputStates();
    document.getElementById('console-modal').classList.add('hidden');
    document.getElementById('lobby-modal').classList.add('hidden');
    document.getElementById('console-modal-card').classList.remove('garage-wide');
    if (previewAnimId) {
        cancelAnimationFrame(previewAnimId);
        previewAnimId = null;
    }

    if (!fromRemote && MP.isHost) {
        MP.broadcastLaunch();
    }

    const ccContainer = document.getElementById('control-center-container');
    ccContainer.classList.add('shaking');

    setTimeout(() => {
        ccContainer.classList.remove('shaking');
        ccContainer.classList.add('hidden');
        updatePointerLockStatusHint();
        if (ccAnimId) {
            cancelAnimationFrame(ccAnimId);
            ccAnimId = null;
        }
        if (typeof startPhoraArena === 'function') {
            startPhoraArena();
        }
    }, 950);
}

function returnToControlCenter() {
    resetAllInputStates();
    document.getElementById('arena-container').classList.add('hidden');
    document.getElementById('report-modal').classList.add('hidden');
    document.getElementById('planet-task-modal').classList.add('hidden');
    document.getElementById('sector-radar-box').classList.add('hidden');
    document.getElementById('control-center-container').classList.remove('hidden');

    GAME_STATE.currentOrbitId = 'earth';
    updateWindowPlanet('earth');
    updateCreditsHUD();
    updateTopMissionBadge();
    updatePointerLockStatusHint();
    lockGamePointer();

    ccLastTime = performance.now();
    if (!ccAnimId) animateControlCenter();
}

function animateControlCenter(now) {
    ccAnimId = requestAnimationFrame(animateControlCenter);
    const tNow = now || performance.now();
    const dt = Math.min(0.05, (tNow - ccLastTime) / 1000);
    ccLastTime = tNow;
    const elapsed = tNow * 0.001;

    MP.tickNetworkHealth();

    if (windowPlanet && windowPlanet.sphere) {
        windowPlanet.sphere.rotation.y += dt * 0.08;
    }

    stations.forEach((st, idx) => {
        st.ring.scale.setScalar(1 + Math.sin(elapsed * 3 + idx) * 0.04);
    });

    if (astroRig && astroRig.group) {
        let moving = false;
        if (!isAnyGameModalOpen()) {
            let forward = 0;
            let strafe = 0;
            if (ccKeys['KeyW'] || ccKeys['ArrowUp']) forward -= 1;
            if (ccKeys['KeyS'] || ccKeys['ArrowDown']) forward += 1;
            if (ccKeys['KeyA'] || ccKeys['ArrowLeft']) strafe -= 1;
            if (ccKeys['KeyD'] || ccKeys['ArrowRight']) strafe += 1;

            const speed = (ccKeys['ShiftLeft'] || ccKeys['ShiftRight']) ? 0.11 : 0.07;
            if (forward !== 0 || strafe !== 0) {
                moving = true;
                const sinY = Math.sin(camYaw);
                const cosY = Math.cos(camYaw);
                const vx = strafe * cosY + forward * sinY;
                const vz = -strafe * sinY + forward * cosY;
                const len = Math.hypot(vx, vz) || 1;

                astroRig.group.position.x += (vx / len) * speed;
                astroRig.group.position.z += (vz / len) * speed;
                astroRig.group.rotation.y = Math.atan2(vx, vz);
            }
        }

        astroRig.group.position.x = Math.max(-10.8, Math.min(10.8, astroRig.group.position.x));
        astroRig.group.position.z = Math.max(-9.6, Math.min(10.2, astroRig.group.position.z));

        if (!astroGrounded) {
            astroRig.group.position.y += astroVelY;
            astroVelY -= 0.013;
            if (astroRig.group.position.y <= 0) {
                astroRig.group.position.y = 0;
                astroVelY = 0;
                astroGrounded = true;
            }
        }

        if (astroRig.propellerMesh) astroRig.propellerMesh.rotation.y += 0.25;

        if (!astroGrounded) {
            astroRig.leftArm.rotation.x = -0.6;
            astroRig.rightArm.rotation.x = -0.6;
        } else if (moving) {
            const swing = Math.sin(elapsed * 10) * 0.48;
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

        MP.sendMyPosition(
            astroRig.group.position.x,
            astroRig.group.position.y,
            astroRig.group.position.z,
            astroRig.group.rotation.y,
            moving
        );

        let nearest = null;
        let minDist = 3.1;
        stations.forEach(st => {
            const d = Math.hypot(astroRig.group.position.x - st.x, astroRig.group.position.z - st.z);
            if (d < minDist) {
                minDist = d;
                nearest = st;
            }
        });
        activeStation = nearest;
        const promptBtn = document.getElementById('station-prompt');
        if (activeStation && !isModalOpen) {
            document.getElementById('prompt-station-name').innerText = activeStation.name;
            promptBtn.classList.remove('hidden');
        } else {
            promptBtn.classList.add('hidden');
        }

        const camDist = 7.4;
        const rawCamX = astroRig.group.position.x + Math.sin(camYaw) * camDist;
        const rawCamZ = astroRig.group.position.z + Math.cos(camYaw) * camDist;
        ccCamera.position.x = Math.max(-11.2, Math.min(11.2, rawCamX));
        ccCamera.position.z = Math.max(-10.2, Math.min(10.8, rawCamZ));
        ccCamera.position.y = Math.min(8.2, astroRig.group.position.y + 4.2);
        ccCamera.lookAt(astroRig.group.position.x, astroRig.group.position.y + 1.8, astroRig.group.position.z);
    }

    syncAllRemoteAstronauts(elapsed, dt);
    ccRenderer.render(ccScene, ccCamera);
}

window.addEventListener('DOMContentLoaded', () => {
    MP.initLobbyUI();
    initControlCenter();
});
