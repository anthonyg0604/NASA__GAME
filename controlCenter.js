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

let garageTab = 'noses';
let garageFeedbackMsg = '';
let previewScene, previewCamera, previewRenderer, previewRocket, previewAnimId;
let previewRotY = 0.6;
let previewDragging = false;
let previewPrevX = 0;
let previewLastTime = 0;

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
        if (!remoteCCAstros[p.id] || remoteCCAstros[p.id].charId !== charId || remoteCCAstros[p.id].name !== p.name) {
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
            remoteCCAstros[p.id] = { rig, charId, name: p.name };
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
    if (window
