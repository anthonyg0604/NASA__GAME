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

const PEER_ICE_CONFIG = {
    debug: 1,
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
        ]
    }
};

const MP = {
    isHost: true,
    roomCode: '',
    maxPlayers: 4,
    myId: getPersistentClientId(),
    myName: 'Pablo',
    fillWithBots: false,
    peer: null,
    hostConn: null,
    guestConns: [],
    players: {},
    takenRolesByOthers: {}, // { roleId: playerName }
    lastSendTime: 0,
    lastPeekedCode: '',

    initLobbyUI() {
        const initChar = GAME_DATA.characters.find(c => c.id === GAME_STATE.selectedCharacterId) || GAME_DATA.characters[0];
        this.myName = initChar.shortName;
        const nameInput = document.getElementById('player-name-input');
        if (nameInput) nameInput.value = this.myName;

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

        nameInput.oninput = e => {
            this.myName = e.target.value.trim() || initChar.shortName;
            this.syncLocalPlayerEntry();
            this.renderPlayersList();
            if (typeof rebuildControlCenterAstronaut === 'function' && astroRig) {
                rebuildControlCenterAstronaut(astroRig.group.position.clone());
            }
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
            this.takenRolesByOthers = {};
            this.lastPeekedCode = '';
            document.getElementById('tab-create-btn').classList.add('active');
            document.getElementById('tab-join-btn').classList.remove('active');
            document.getElementById('panel-create-room').classList.remove('hidden');
            document.getElementById('panel-join-room').classList.add('hidden');
            this.players = {};
            this.syncLocalPlayerEntry();
            this.rebuildBotSlots();
            this.renderLobbyRoles();
            this.renderPlayersList();
            this.setupHostPeer();
        };

        document.getElementById('tab-join-btn').onclick = () => {
            this.isHost = false;
            this.takenRolesByOthers = {};
            this.lastPeekedCode = '';
            document.getElementById('tab-join-btn').classList.add('active');
            document.getElementById('tab-create-btn').classList.remove('active');
            document.getElementById('panel-join-room').classList.remove('hidden');
            document.getElementById('panel-create-room').classList.add('hidden');
            document.getElementById('join-feedback').innerText = '';
            this.renderLobbyRoles();
            setTimeout(() => document.getElementById('join-code-input').focus(), 50);
        };

        document.getElementById('start-session-btn').onclick = () => {
            document.getElementById('lobby-modal').classList.add('hidden');
            this.updateHudBadge();
            if (this.isHost && this.peer && this.peer.disconnected) {
                try { this.peer.reconnect(); } catch (_) {}
            }
        };

        const joinInput = document.getElementById('join-code-input');
        joinInput.oninput = () => {
            const clean = joinInput.value.replace(/\D/g, '').trim();
            if (clean.length === 4 && clean !== this.lastPeekedCode) {
                this.lastPeekedCode = clean;
                this.peekRemoteRoomRoles(clean);
            } else if (clean.length < 4) {
                this.lastPeekedCode = '';
                this.takenRolesByOthers = {};
                this.renderLobbyRoles();
            }
        };

        const triggerJoin = () => {
            const rawCode = joinInput.value.replace(/\D/g, '').trim();
            if (rawCode.length !== 4) {
                document.getElementById('join-feedback').style.color = '#fbbf24';
                document.getElementById('join-feedback').innerText = '⚠️ Escribe el código de 4 números de la sala.';
                return;
            }
            this.joinRemoteRoom(rawCode);
        };

        document.getElementById('connect-room-btn').onclick = triggerJoin;
        joinInput.onkeydown = e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                triggerJoin();
            }
        };

        document.getElementById('room-info-pill').onclick = () => {
            this.refreshTakenRolesFromPlayers();
            this.renderLobbyRoles();
            this.renderPlayersList();
            document.getElementById('lobby-modal').classList.remove('hidden');
        };
    },

    refreshTakenRolesFromPlayers() {
        const map = {};
        Object.values(this.players).forEach(p => {
            if (p.id !== this.myId && !p.isBot && p.roleId) {
                map[p.roleId] = p.name;
            }
        });
        this.takenRolesByOthers = map;
    },

    renderLobbyCharacters() {
        const grid = document.getElementById('lobby-char-grid');
        if (!grid) return;
        grid.innerHTML = GAME_DATA.characters.map(c => `
            <div class="char-card ${GAME_STATE.selectedCharacterId === c.id ? 'selected' : ''}" data-char="${c.id}">
                <span class="color-swatch" style="background:${c.colorCss};"></span>
                <div>
                    <strong style="font-size:0.86rem; display:block;">${c.name}</strong>
                    <span style="font-size:0.72rem; color:#94a3b8;">${c.species}</span>
                </div>
            </div>
        `).join('');

        grid.querySelectorAll('.char-card').forEach(el => {
            el.onclick = () => {
                const chosenId = el.dataset.char;
                const charObj = GAME_DATA.characters.find(x => x.id === chosenId) || GAME_DATA.characters[0];
                GAME_STATE.selectedCharacterId = charObj.id;
                GAME_STATE.saveProgress();

                const nameInput = document.getElementById('player-name-input');
                nameInput.value = charObj.shortName;
                this.myName = charObj.shortName;

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
        if (!grid) return;

        // Si el rol actual quedó ocupado por otro jugador, cambiar automáticamente a uno libre
        if (this.takenRolesByOthers[GAME_STATE.selectedRole.id]) {
            const firstFree = GAME_DATA.roles.find(r => !this.takenRolesByOthers[r.id]);
            if (firstFree) {
                GAME_STATE.selectedRole = firstFree;
                if (typeof updateTopMissionBadge === 'function') updateTopMissionBadge();
            }
        }

        grid.innerHTML = GAME_DATA.roles.map(r => {
            const takenBy = this.takenRolesByOthers[r.id];
            const isSelected = !takenBy && GAME_STATE.selectedRole.id === r.id;
            return `
                <div class="role-mini-item ${isSelected ? 'selected' : ''} ${takenBy ? 'taken' : ''}" data-role="${r.id}">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="color-swatch" style="background:${r.colorCss};"></span>
                        <div>
                            <strong style="font-size:0.84rem; display:block;">${r.name}</strong>
                            <span style="font-size:0.71rem; color:#94a3b8;">${r.bonus}</span>
                        </div>
                    </div>
                    ${takenBy ? `<span class="role-taken-pill">🔒 ${takenBy}</span>` : ''}
                </div>
            `;
        }).join('');

        grid.querySelectorAll('.role-mini-item').forEach(el => {
            el.onclick = () => {
                const roleId = el.dataset.role;
                if (this.takenRolesByOthers[roleId]) return; // Bloqueado porque ya lo tomó otro jugador

                const role = GAME_DATA.roles.find(r => r.id === roleId);
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
                name: `${char.shortName} (IA)`,
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
        if (!list) return;
        const all = Object.values(this.players);
        list.innerHTML = all.map(p => {
            const role = GAME_DATA.roles.find(r => r.id === p.roleId) || GAME_DATA.roles[0];
            const char = GAME_DATA.characters.find(c => c.id === p.characterId) || GAME_DATA.characters[0];
            return `
                <div class="player-slot-row">
                    <span><span class="color-swatch" style="background:${char.colorCss}; vertical-align:middle; margin-right:6px;"></span><strong>${p.name}</strong> <small style="color:#94a3b8;">(${char.shortName})</small></span>
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
        const badge = document.getElementById('net-status-badge');
        badge.innerText = '● Registrando sala...';

        try {
            this.peer = new Peer('nasa-cubo-phora-' + this.roomCode, PEER_ICE_CONFIG);
            this.peer.on('open', () => {
                badge.innerText = `● Sala Online #${this.roomCode}`;
            });
            this.peer.on('connection', conn => {
                this.guestConns = this.guestConns.filter(c => c.open);
                this.guestConns.push(conn);
                conn.on('data', data => this.handleHostData(conn, data));
                conn.on('close', () => {
                    this.guestConns = this.guestConns.filter(c => c !== conn);
                    if (conn.peerPlayerId && this.players[conn.peerPlayerId]) {
                        delete this.players[conn.peerPlayerId];
                        this.refreshTakenRolesFromPlayers();
                        this.rebuildBotSlots();
                        this.renderLobbyRoles();
                        this.renderPlayersList();
                        this.broadcastRoomState();
                    }
                });
            });
            this.peer.on('disconnected', () => {
                try { this.peer.reconnect(); } catch (_) {}
            });
            this.peer.on('error', err => {
                if (err && err.type === 'unavailable-id') {
                    this.roomCode = String(Math.floor(1000 + Math.random() * 9000));
                    document.getElementById('generated-room-code').innerText = this.roomCode;
                    this.setupHostPeer();
                } else {
                    badge.innerText = '● Modo Local Activo';
                }
            });
        } catch (_) {}
    },

    handleHostData(conn, data) {
        if (!data || !data.type) return;

        if (data.type === 'PEEK_ROOM') {
            const takenRoles = {};
            Object.values(this.players).forEach(p => {
                if (!p.isBot && p.id !== data.requesterId && p.roleId) {
                    takenRoles[p.roleId] = p.name;
                }
            });
            const humanCount = Object.values(this.players).filter(p => !p.isBot).length;
            if (conn.open) {
                conn.send({
                    type: 'PEEK_RESULT',
                    takenRoles,
                    maxPlayers: this.maxPlayers,
                    currentHumans: humanCount
                });
            }

        } else if (data.type === 'JOIN') {
            const incomingId = data.player.id;

            if (conn.peerPlayerId && conn.peerPlayerId !== incomingId) {
                delete this.players[conn.peerPlayerId];
            }

            const existingHumans = Object.values(this.players).filter(p => !p.isBot && p.id !== incomingId);
            if (existingHumans.length >= this.maxPlayers) {
                if (conn.open) conn.send({ type: 'ROOM_FULL', maxPlayers: this.maxPlayers });
                return;
            }

            // Garantizar que el rol del invitado sea único y no esté ocupado por otro humano
            const usedHumanRoles = new Set(existingHumans.map(p => p.roleId));
            let finalRoleId = data.player.roleId;
            if (usedHumanRoles.has(finalRoleId)) {
                const availableRole = GAME_DATA.roles.find(r => !usedHumanRoles.has(r.id));
                if (availableRole) finalRoleId = availableRole.id;
            }

            conn.peerPlayerId = incomingId;
            this.players[incomingId] = { ...data.player, roleId: finalRoleId, isBot: false };

            this.refreshTakenRolesFromPlayers();
            this.rebuildBotSlots();
            this.renderLobbyRoles();
            this.renderPlayersList();

            const welcomePayload = {
                type: 'ROOM_STATE',
                maxPlayers: this.maxPlayers,
                players: this.players,
                missionId: GAME_STATE.selectedMission.id
            };
            if (conn.open) conn.send(welcomePayload);
            this.broadcastRoomState();

        } else if (data.type === 'MOVE') {
            if (this.players[data.id]) {
                Object.assign(this.players[data.id], data.pos);
                this.refreshTakenRolesFromPlayers();
            }
            this.guestConns.forEach(c => {
                if (c !== conn && c.open) c.send(data);
            });
        }
    },

    // Consulta en vivo los roles ocupados en la sala antes de entrar
    peekRemoteRoomRoles(code) {
        if (typeof Peer === 'undefined') return;
        const feedback = document.getElementById('join-feedback');
        feedback.style.color = '#38bdf8';
        feedback.innerText = `🔍 Verificando roles disponibles en sala #${code}...`;

        const tempPeer = new Peer(PEER_ICE_CONFIG);
        const cleanup = () => { try { tempPeer.destroy(); } catch (_) {} };

        tempPeer.on('open', () => {
            const conn = tempPeer.connect('nasa-cubo-phora-' + code, { reliable: true, serialization: 'json' });
            conn.on('open', () => {
                conn.send({ type: 'PEEK_ROOM', requesterId: this.myId });
            });
            conn.on('data', data => {
                if (data && data.type === 'PEEK_RESULT') {
                    this.takenRolesByOthers = data.takenRoles || {};
                    this.renderLobbyRoles();
                    const freeCount = 4 - Object.keys(this.takenRolesByOthers).length;
                    feedback.style.color = '#10b981';
                    feedback.innerText = `✓ Sala #${code} encontrada (${data.currentHumans}/${data.maxPlayers} jugadores). ${freeCount} roles libres marcados a la izquierda.`;
                    setTimeout(cleanup, 300);
                }
            });
        });
        tempPeer.on('error', () => {
            feedback.style.color = '#fbbf24';
            feedback.innerText = `⚠️ No se detectó la sala #${code} aún. Verifica el código con el anfitrión.`;
            cleanup();
        });
    },

    joinRemoteRoom(code) {
        const feedback = document.getElementById('join-feedback');
        const btn = document.getElementById('connect-room-btn');

        if (typeof Peer === 'undefined') {
            feedback.style.color = '#ef4444';
            feedback.innerText = '❌ Error cargando red. Recarga la página con Ctrl + Shift + R.';
            return;
        }

        btn.disabled = true;
        btn.innerText = '⏳ CONECTANDO...';
        feedback.style.color = '#38bdf8';
        feedback.innerText = `⏳ Buscando sala #${code}...`;

        if (this.peer) {
            try { this.peer.destroy(); } catch (_) {}
        }

        let joinedOk = false;
        const failTimeout = setTimeout(() => {
            if (!joinedOk) {
                btn.disabled = false;
                btn.innerText = '🔗 INGRESAR A LA SALA';
                feedback.style.color = '#fbbf24';
                feedback.innerText = `⚠️ No se pudo conectar a #${code}. Verifica que el anfitrión tenga el juego abierto y el código sea exacto.`;
            }
        }, 8500);

        this.peer = new Peer(PEER_ICE_CONFIG);

        this.peer.on('error', err => {
            clearTimeout(failTimeout);
            btn.disabled = false;
            btn.innerText = '🔗 INGRESAR A LA SALA';
            feedback.style.color = '#ef4444';
            if (err && err.type === 'peer-unavailable') {
                feedback.innerText = `❌ La sala #${code} no existe o el anfitrión cerró su pestaña.`;
            } else {
                feedback.innerText = `❌ Error de red (${err.type || 'conexión'}). Intenta nuevamente.`;
            }
        });

        this.peer.on('open', () => {
            feedback.innerText = `🔗 Enlazando con la nave #${code}...`;
            const conn = this.peer.connect('nasa-cubo-phora-' + code, { reliable: true, serialization: 'json' });
            this.hostConn = conn;

            conn.on('open', () => {
                this.roomCode = code;
                this.players = {};
                this.syncLocalPlayerEntry();
                conn.send({ type: 'JOIN', player: this.players[this.myId] });
            });

            conn.on('data', data => {
                if (!data || !data.type) return;

                if (data.type === 'ROOM_FULL') {
                    joinedOk = true;
                    clearTimeout(failTimeout);
                    btn.disabled = false;
                    btn.innerText = '🔗 INGRESAR A LA SALA';
                    feedback.style.color = '#fbbf24';
                    feedback.innerText = `⚠️ Sala llena (${data.maxPlayers}/${data.maxPlayers} jugadores).`;
                    try { conn.close(); } catch (_) {}

                } else if (data.type === 'ROOM_STATE') {
                    joinedOk = true;
                    clearTimeout(failTimeout);
                    btn.disabled = false;
                    btn.innerText = '🔗 INGRESAR A LA SALA';

                    this.maxPlayers = data.maxPlayers;
                    const myLocal = this.players[this.myId];
                    this.players = data.players;

                    // Si el anfitrión nos asignó un rol libre distinto, aplicarlo
                    if (this.players[this.myId] && this.players[this.myId].roleId) {
                        const assignedRole = GAME_DATA.roles.find(r => r.id === this.players[this.myId].roleId);
                        if (assignedRole) {
                            GAME_STATE.selectedRole = assignedRole;
                            if (typeof updateTopMissionBadge === 'function') updateTopMissionBadge();
                        }
                    }

                    if (myLocal && this.players[this.myId]) {
                        this.players[this.myId].x = myLocal.x;
                        this.players[this.myId].y = myLocal.y;
                        this.players[this.myId].z = myLocal.z;
                    }

                    this.refreshTakenRolesFromPlayers();
                    this.renderLobbyRoles();

                    if (data.missionId) {
                        GAME_STATE.selectedMission = GAME_DATA.missions.find(m => m.id === data.missionId) || GAME_STATE.selectedMission;
                        if (typeof updateTopMissionBadge === 'function') updateTopMissionBadge();
                    }

                    if (typeof rebuildControlCenterAstronaut === 'function' && astroRig) {
                        rebuildControlCenterAstronaut(astroRig.group.position.clone());
                    }

                    document.getElementById('lobby-modal').classList.add('hidden');
                    this.updateHudBadge();

                } else if (data.type === 'MOVE') {
                    if (data.id !== this.myId && this.players[data.id]) {
                        Object.assign(this.players[data.id], data.pos);
                        this.refreshTakenRolesFromPlayers();
                    }

                } else if (data.type === 'LAUNCH') {
                    GAME_STATE.selectedMission = GAME_DATA.missions.find(m => m.id === data.missionId) || GAME_STATE.selectedMission;
                    if (typeof beginMissionLaunch === 'function') beginMissionLaunch(true);
                }
            });

            conn.on('close', () => {
                if (joinedOk) {
                    document.getElementById('net-status-badge').innerText = '● Desconectado del anfitrión';
                }
            });
        });
    },

    broadcastRoomState() {
        if (!this.isHost) return;
        const payload = {
            type: 'ROOM_STATE',
            maxPlayers: this.maxPlayers,
            players: this.players,
            missionId: GAME_STATE.selectedMission.id
        };
        this.guestConns.forEach(c => {
            if (c.open) c.send(payload);
        });
    },

    sendMyPosition(x, y, z, rotY, moving) {
        if (this.players[this.myId]) {
            Object.assign(this.players[this.myId], {
                x, y, z, rotY, moving,
                name: this.myName,
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
                name: this.myName,
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
                p.targetX = (Math.random() - 0.5) * boundsLimit * 1.4;
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
