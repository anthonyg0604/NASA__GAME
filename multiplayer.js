function getPersistentClientId() {
    try {
        let id = sessionStorage.getItem('cubo_phora_pid');
        if (!id) {
            id = 'p_' + Math.random().toString(36).substring(2, 9);
            sessionStorage.setItem('cubo_phora_pid', id);
        }
        return id;
    } catch (_) {
        return 'p_' + Math.random().toString(36).substring(2, 9);
    }
}

const MP = {
    isHost: true,
    roomCode: '',
    maxPlayers: 4,
    myId: getPersistentClientId(),
    myName: 'Pablo',
    fillWithBots: false, // Desactivado por defecto para que no aparezcan muñecos IA no deseados
    peer: null,
    hostConn: null,
    guestConns: [],
    players: {}, // id -> { id, name, characterId, roleId, isBot, x, y, z, rotY, moving }
    lastSendTime: 0,

    initLobbyUI() {
        this.roomCode = String(Math.floor(1000 + Math.random() * 9000));
        document.getElementById('generated-room-code').innerText = this.roomCode;

        this.renderLobbyCharacters();
        this.renderLobbyRoles();
        this.setupHostPeer();
        this.syncLocalPlayerEntry();
        this.rebuildBotSlots();
        this.renderPlayersList();

        document.querySelectorAll('.count-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.maxPlayers = parseInt(btn.dataset.count, 10);
                this.rebuildBotSlots();
                this.renderPlayersList();
                this.broadcastRoomState();
            };
        });

        document.getElementById('player-name-input').oninput = e => {
            this.myName = e.target.value.trim() || 'Tripulante';
            this.syncLocalPlayerEntry();
            this.renderPlayersList();
            this.broadcastRoomState();
        };

        document.getElementById('fill-bots-checkbox').onchange = e => {
            this.fillWithBots = e.target.checked;
            this.rebuildBotSlots();
            this.renderPlayersList();
            this.broadcastRoomState();
        };

        document.getElementById('tab-create-btn').onclick = () => {
            this.isHost = true;
            document.getElementById('tab-create-btn').classList.add('active');
            document.getElementById('tab-join-btn').classList.remove('active');
            document.getElementById('panel-create-room').classList.remove('hidden');
            document.getElementById('panel-join-room').classList.add('hidden');
            this.players = {};
            this.syncLocalPlayerEntry();
            this.rebuildBotSlots();
            this.renderPlayersList();
            this.setupHostPeer();
        };

        document.getElementById('tab-join-btn').onclick = () => {
            this.isHost = false;
            document.getElementById('tab-join-btn').classList.add('active');
            document.getElementById('tab-create-btn').classList.remove('active');
            document.getElementById('panel-join-room').classList.remove('hidden');
            document.getElementById('panel-create-room').classList.add('hidden');
        };

        document.getElementById('start-session-btn').onclick = () => {
            document.getElementById('lobby-modal').classList.add('hidden');
            this.updateHudBadge();
        };

        document.getElementById('connect-room-btn').onclick = () => {
            const code = document.getElementById('join-code-input').value.trim();
            if (code.length !== 4) {
                document.getElementById('join-feedback').innerText = '⚠️ Escribe el código de 4 números.';
                return;
            }
            this.joinRemoteRoom(code);
        };

        document.getElementById('room-info-pill').onclick = () => {
            document.getElementById('lobby-modal').classList.remove('hidden');
        };
    },

    renderLobbyCharacters() {
        const grid = document.getElementById('lobby-char-grid');
        if (!grid) return;
        grid.innerHTML = GAME_DATA.characters.map(c => `
            <div class="char-card ${GAME_STATE.selectedCharacterId === c.id ? 'selected' : ''}" data-char="${c.id}">
                <span class="color-swatch" style="background:${c.colorCss};"></span>
                <div>
                    <strong style="font-size:0.84rem; display:block;">${c.name}</strong>
                    <span style="font-size:0.72rem; color:#94a3b8;">${c.species}</span>
                </div>
            </div>
        `).join('');

        grid.querySelectorAll('.char-card').forEach(el => {
            el.onclick = () => {
                GAME_STATE.selectedCharacterId = el.dataset.char;
                GAME_STATE.saveProgress();
                const charObj = GAME_DATA.characters.find(x => x.id === el.dataset.char);
                const nameInput = document.getElementById('player-name-input');
                if (charObj && ['Pablo', 'Uniqua (Yonicua)', 'Tyrone', 'Tasha', 'Comandante 1'].includes(nameInput.value)) {
                    nameInput.value = charObj.name.split(' ')[0];
                    this.myName = nameInput.value;
                }
                this.renderLobbyCharacters();
                this.syncLocalPlayerEntry();
                this.renderPlayersList();
                if (typeof rebuildControlCenterAstronaut === 'function' && astroRig) {
                    rebuildControlCenterAstronaut(astroRig.group.position.clone());
                }
                this.broadcastRoomState();
            };
        });
    },

    renderLobbyRoles() {
        const grid = document.getElementById('lobby-role-grid');
        grid.innerHTML = GAME_DATA.roles.map(r => `
            <div class="role-mini-item ${GAME_STATE.selectedRole.id === r.id ? 'selected' : ''}" data-role="${r.id}">
                <span class="color-swatch" style="background:${r.colorCss};"></span>
                <div>
                    <strong style="font-size:0.84rem; display:block;">${r.name}</strong>
                    <span style="font-size:0.72rem; color:#94a3b8;">${r.bonus}</span>
                </div>
            </div>
        `).join('');

        grid.querySelectorAll('.role-mini-item').forEach(el => {
            el.onclick = () => {
                const role = GAME_DATA.roles.find(r => r.id === el.dataset.role);
                GAME_STATE.selectedRole = role;
                this.renderLobbyRoles();
                this.syncLocalPlayerEntry();
                this.renderPlayersList();
                if (typeof rebuildControlCenterAstronaut === 'function' && astroRig) {
                    rebuildControlCenterAstronaut(astroRig.group.position.clone());
                }
                if (typeof updateTopMissionBadge === 'function') updateTopMissionBadge();
                this.broadcastRoomState();
            };
        });
    },

    syncLocalPlayerEntry() {
        const prev = this.players[this.myId] || {};
        this.players[this.myId] = {
            id: this.myId,
            name: this.myName,
            characterId: GAME_STATE.selectedCharacterId,
            roleId: GAME_STATE.selectedRole.id,
            isBot: false,
            x: prev.x ?? 0,
            y: prev.y ?? 0,
            z: prev.z ?? 4.5,
            rotY: prev.rotY ?? 0,
            moving: false
        };
    },

    // Garantiza que nunca se exceda maxPlayers ni se dupliquen bots
    rebuildBotSlots() {
        Object.keys(this.players).forEach(pid => {
            if (this.players[pid].isBot) delete this.players[pid];
        });

        if (!this.isHost || !this.fillWithBots) return;

        const currentRealCount = Object.values(this.players).filter(p => !p.isBot).length;
        const neededBots = Math.max(0, this.maxPlayers - currentRealCount);

        const usedChars = new Set(Object.values(this.players).map(p => p.characterId));
        const freeChars = GAME_DATA.characters.filter(c => !usedChars.has(c.id));

        const usedRoles = new Set(Object.values(this.players).map(p => p.roleId));
        const freeRoles = GAME_DATA.roles.filter(r => !usedRoles.has(r.id));

        const spawnSpots = [
            { x: -2.6, z: 2.8 },
            { x: 2.6, z: 2.8 },
            { x: -1.8, z: 1.0 }
        ];

        for (let i = 0; i < neededBots; i++) {
            const char = freeChars[i] || GAME_DATA.characters[(i + 1) % GAME_DATA.characters.length];
            const role = freeRoles[i] || GAME_DATA.roles[(i + 1) % GAME_DATA.roles.length];
            const spot = spawnSpots[i % spawnSpots.length];
            const botId = 'bot_' + i;
            this.players[botId] = {
                id: botId,
                name: `${char.name.split(' ')[0]} (IA)`,
                characterId: char.id,
                roleId: role.id,
                isBot: true,
                x: spot.x,
                y: 0,
                z: spot.z,
                rotY: 0,
                moving: false,
                targetX: spot.x,
                targetZ: spot.z,
                waitTimer: 1.5 + Math.random() * 2.5
            };
        }
    },

    renderPlayersList() {
        const list = document.getElementById('lobby-players-list');
        const all = Object.values(this.players);
        list.innerHTML = all.map(p => {
            const role = GAME_DATA.roles.find(r => r.id === p.roleId) || GAME_DATA.roles[0];
            const char = GAME_DATA.characters.find(c => c.id === p.characterId) || GAME_DATA.characters[0];
            return `
                <div class="player-slot-row">
                    <span><span class="color-swatch" style="background:${char.colorCss}; vertical-align:middle; margin-right:6px;"></span><strong>${p.name}</strong> <small style="color:#94a3b8;">(${char.name.split(' ')[0]})</small></span>
                    <span style="color:${role.colorCss}; font-weight:600;">${role.short}</span>
                </div>
            `;
        }).join('');
        this.updateHudBadge();
    },

    updateHudBadge() {
        const count = Object.keys(this.players).length;
        document.getElementById('hud-room-code').innerText = this.roomCode;
        document.getElementById('hud-player-count').innerText = `${count}/${this.maxPlayers}`;
    },

    setupHostPeer() {
        if (typeof Peer === 'undefined') return;
        if (this.peer) {
            try { this.peer.destroy(); } catch (_) {}
        }
        try {
            this.peer = new Peer('nasa-cubo-phora-' + this.roomCode);
            this.peer.on('open', () => {
                document.getElementById('net-status-badge').innerText = `● Sala Online #${this.roomCode}`;
            });
            this.peer.on('connection', conn => {
                this.guestConns = this.guestConns.filter(c => c.open);
                this.guestConns.push(conn);
                conn.on('data', data => this.handleHostData(conn, data));
                conn.on('close', () => {
                    this.guestConns = this.guestConns.filter(c => c !== conn);
                    if (conn.peerPlayerId && this.players[conn.peerPlayerId]) {
                        delete this.players[conn.peerPlayerId];
                        this.rebuildBotSlots();
                        this.renderPlayersList();
                        this.broadcastRoomState();
                    }
                });
            });
            this.peer.on('error', () => {
                document.getElementById('net-status-badge').innerText = '● Modo Local Activo';
            });
        } catch (_) {}
    },

    handleHostData(conn, data) {
        if (data.type === 'JOIN') {
            const incomingId = data.player.id;

            // Si esta misma conexión tenía otro ID previo, limpiarlo
            if (conn.peerPlayerId && conn.peerPlayerId !== incomingId) {
                delete this.players[conn.peerPlayerId];
            }

            // Verificar cupo máximo de humanos sin contar bots
            const existingHumans = Object.values(this.players).filter(p => !p.isBot && p.id !== incomingId);
            if (existingHumans.length >= this.maxPlayers) {
                if (conn.open) conn.send({ type: 'ROOM_FULL', maxPlayers: this.maxPlayers });
                return;
            }

            conn.peerPlayerId = incomingId;
            this.players[incomingId] = { ...data.player, isBot: false };

            // Reajustar bots estrictamente dentro del límite maxPlayers
            this.rebuildBotSlots();
            this.renderPlayersList();
            this.broadcastRoomState();
        } else if (data.type === 'MOVE') {
            if (this.players[data.id]) {
                Object.assign(this.players[data.id], data.pos);
            }
            this.guestConns.forEach(c => {
                if (c !== conn && c.open) c.send(data);
            });
        }
    },

    joinRemoteRoom(code) {
        if (typeof Peer === 'undefined') {
            document.getElementById('join-feedback').innerText = '❌ Librería de red no disponible.';
            return;
        }
        document.getElementById('join-feedback').innerText = '⏳ Conectando a la nave...';
        if (this.peer) {
            try { this.peer.destroy(); } catch (_) {}
        }
        this.peer = new Peer();
        this.peer.on('open', () => {
            const conn = this.peer.connect('nasa-cubo-phora-' + code);
            this.hostConn = conn;
            conn.on('open', () => {
                this.roomCode = code;
                this.players = {};
                this.syncLocalPlayerEntry();
                conn.send({ type: 'JOIN', player: this.players[this.myId] });
            });
            conn.on('data', data => {
                if (data.type === 'ROOM_FULL') {
                    document.getElementById('join-feedback').innerText = `⚠️ Sala llena (${data.maxPlayers}/${data.maxPlayers} jugadores).`;
                    try { conn.close(); } catch (_) {}
                } else if (data.type === 'ROOM_STATE') {
                    this.maxPlayers = data.maxPlayers;
                    const myLocal = this.players[this.myId];
                    this.players = data.players;
                    if (myLocal && this.players[this.myId]) {
                        Object.assign(this.players[this.myId], myLocal);
                    }
                    document.getElementById('lobby-modal').classList.add('hidden');
                    this.updateHudBadge();
                } else if (data.type === 'MOVE') {
                    if (data.id !== this.myId && this.players[data.id]) {
                        Object.assign(this.players[data.id], data.pos);
                    }
                } else if (data.type === 'LAUNCH') {
                    GAME_STATE.selectedMission = GAME_DATA.missions.find(m => m.id === data.missionId) || GAME_STATE.selectedMission;
                    if (typeof beginMissionLaunch === 'function') beginMissionLaunch(true);
                }
            });
            conn.on('error', () => {
                document.getElementById('join-feedback').innerText = '❌ No se encontró esa sala.';
            });
        });
    },

    broadcastRoomState() {
        if (!this.isHost) return;
        const payload = {
            type: 'ROOM_STATE',
            maxPlayers: this.maxPlayers,
            players: this.players
        };
        this.guestConns.forEach(c => {
            if (c.open) c.send(payload);
        });
    },

    sendMyPosition(x, y, z, rotY, moving) {
        if (this.players[this.myId]) {
            Object.assign(this.players[this.myId], {
                x, y, z, rotY, moving,
                characterId: GAME_STATE.selectedCharacterId,
                roleId: GAME_STATE.selectedRole.id
            });
        }
        const now = performance.now();
        if (now - this.lastSendTime < 45) return;
        this.lastSendTime = now;

        const msg = {
            type: 'MOVE',
            id: this.myId,
            pos: {
                x, y, z, rotY, moving,
                characterId: GAME_STATE.selectedCharacterId,
                roleId: GAME_STATE.selectedRole.id
            }
        };
        if (this.isHost) {
            this.guestConns.forEach(c => { if (c.open) c.send(msg); });
        } else if (this.hostConn && this.hostConn.open) {
            this.hostConn.send(msg);
        }
    },

    broadcastLaunch() {
        if (!this.isHost) return;
        const msg = {
            type: 'LAUNCH',
            missionId: GAME_STATE.selectedMission.id
        };
        this.guestConns.forEach(c => { if (c.open) c.send(msg); });
    },

    updateBots(dt, boundsLimit) {
        if (!this.isHost) return;
        Object.values(this.players).forEach(p => {
            if (!p.isBot) return;
            p.waitTimer -= dt;
            if (p.waitTimer <= 0) {
                p.targetX = (Math.random() - 0.5) * boundsLimit * 1.6;
                p.targetZ = (Math.random() - 0.5) * boundsLimit * 1.4;
                p.waitTimer = 2.5 + Math.random() * 3.5;
            }
            const dx = p.targetX - p.x;
            const dz = p.targetZ - p.z;
            const dist = Math.hypot(dx, dz);
            if (dist > 0.35) {
                const angle = Math.atan2(dx, dz);
                p.rotY = angle;
                p.x += Math.sin(angle) * 0.055;
                p.z += Math.cos(angle) * 0.055;
                p.moving = true;
            } else {
                p.moving = false;
            }
        });
    }
};
