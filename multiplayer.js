const PREFIJO_SALA = 'misionespacial-';

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

// Configuración STUN + TURN abierta para atravesar routers/NAT entre distintas casas y operadoras
const PEER_ICE_CONFIG = {
    debug: 1,
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun.relay.metered.ca:80' },
            {
                urls: 'turn:global.relay.metered.ca:80',
                username: 'e8dd65b92f62d3e365b807c9',
                credential: '3k712/61B681732k'
            },
            {
                urls: 'turn:global.relay.metered.ca:80?transport=tcp',
                username: 'e8dd65b92f62d3e365b807c9',
                credential: '3k712/61B681732k'
            },
            {
                urls: 'turn:global.relay.metered.ca:443',
                username: 'e8dd65b92f62d3e365b807c9',
                credential: '3k712/61B681732k'
            },
            {
                urls: 'turns:global.relay.metered.ca:443?transport=tcp',
                username: 'e8dd65b92f62d3e365b807c9',
                credential: '3k712/61B681732k'
            }
        ],
        iceCandidatePoolSize: 10
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
    peekPeer: null,
    hostConn: null,
    guestConns: [],
    players: {},
    takenRolesByOthers: {},
    completedTasksByRole: {},
    lastSendTime: 0,
    lastHeartbeatTime: 0,
    lastPruneTime: 0,
    lastPeekedCode: '',
    hostSyncInterval: null,
    heartbeatInterval: null,
    voluntaryLeave: false,
    onPunchCallback: null,

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
        this.startNetworkHeartbeatLoop();
        this.syncLocalPlayerEntry();
        this.rebuildBotSlots();
        this.renderPlayersList();
        this.setCountButtonsLocked(false);

        document.querySelectorAll('.count-btn').forEach(btn => {
            btn.onclick = () => {
                if (!this.isHost) return;
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
            this.switchToCreateRoomTab(false);
        };

        document.getElementById('tab-join-btn').onclick = () => {
            this.stopHostSyncLoop();
            this.destroyPeekPeer();
            this.isHost = false;
            this.takenRolesByOthers = {};
            this.lastPeekedCode = '';
            this.setCountButtonsLocked(true);
            document.getElementById('tab-join-btn').classList.add('active');
            document.getElementById('tab-create-btn').classList.remove('active');
            document.getElementById('panel-join-room').classList.remove('hidden');
            document.getElementById('panel-create-room').classList.add('hidden');
            document.getElementById('join-feedback').innerText = '';
            this.renderLobbyRoles();
            setTimeout(() => document.getElementById('join-code-input').focus(), 50);
        };

        document.getElementById('start-session-btn').onclick = () => {
            if (typeof resetAllInputStates === 'function') resetAllInputStates();
            document.getElementById('lobby-modal').classList.add('hidden');
            this.updateHudBadge();
            if (this.isHost && this.peer && this.peer.disconnected) {
                try { this.peer.reconnect(); } catch (_) {}
            }
            if (typeof lockGamePointer === 'function') lockGamePointer();
        };

        const joinInput = document.getElementById('join-code-input');
        joinInput.oninput = () => {
            const clean = joinInput.value.replace(/\D/g, '').trim();
            if (clean.length === 4 && clean !== this.lastPeekedCode) {
                this.lastPeekedCode = clean;
                this.peekRemoteRoomRoles(clean);
            } else if (clean.length < 4) {
                this.destroyPeekPeer();
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
            if (typeof resetAllInputStates === 'function') resetAllInputStates();
            if (typeof unlockGamePointer === 'function') unlockGamePointer();
            this.refreshTakenRolesFromPlayers();
            this.renderLobbyRoles();
            this.renderPlayersList();
            document.getElementById('lobby-modal').classList.remove('hidden');
        };

        const notifyUnload = () => {
            const leaveMsg = { type: 'PLAYER_LEAVE', id: this.myId, name: this.myName };
            try {
                if (this.isHost) {
                    this.guestConns.forEach(c => { if (c && c.open) c.send(leaveMsg); });
                } else if (this.hostConn && this.hostConn.open) {
                    this.hostConn.send(leaveMsg);
                }
                this.destroyPeekPeer();
                if (this.peer) this.peer.destroy();
            } catch (_) {}
        };
        window.addEventListener('beforeunload', notifyUnload);
        window.addEventListener('pagehide', notifyUnload);
    },

    destroyPeekPeer() {
        if (this.peekPeer) {
            try {
                if (!this.peekPeer.destroyed) this.peekPeer.destroy();
            } catch (_) {}
            this.peekPeer = null;
        }
    },

    isMissionCurrentlyRunning() {
        const arenaEl = document.getElementById('arena-container');
        return Boolean(arenaEl && !arenaEl.classList.contains('hidden'));
    },

    switchToCreateRoomTab(generateNewCode) {
        this.destroyPeekPeer();
        this.isHost = true;
        this.takenRolesByOthers = {};
        this.lastPeekedCode = '';
        if (generateNewCode) {
            this.roomCode = String(Math.floor(1000 + Math.random() * 9000));
            const codeEl = document.getElementById('generated-room-code');
            if (codeEl) codeEl.innerText = this.roomCode;
        }
        this.setCountButtonsLocked(false);
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
    },

    // Botón "Volver" desde la nave para desconectarse y crear/unirse a otra sala
    leaveCurrentRoom(isHostDisconnect = false) {
        this.voluntaryLeave = true;
        this.stopHostSyncLoop();
        this.destroyPeekPeer();

        const leaveMsg = { type: 'PLAYER_LEAVE', id: this.myId, name: this.myName };
        try {
            if (!this.isHost && this.hostConn && this.hostConn.open) {
                this.hostConn.send(leaveMsg);
            }
            this.guestConns.forEach(c => {
                try { if (c) c.close(); } catch (_) {}
            });
            if (this.hostConn) {
                try { this.hostConn.close(); } catch (_) {}
            }
            if (this.peer && !this.peer.destroyed) {
                this.peer.destroy();
            }
        } catch (_) {}

        this.guestConns = [];
        this.hostConn = null;
        this.peer = null;
        this.completedTasksByRole = {};

        const joinBtn = document.getElementById('connect-room-btn');
        if (joinBtn) {
            joinBtn.disabled = false;
            joinBtn.innerText = '🔗 INGRESAR A LA SALA';
        }
        const joinInput = document.getElementById('join-code-input');
        if (joinInput) joinInput.value = '';
        const joinFb = document.getElementById('join-feedback');
        if (joinFb) joinFb.innerText = '';

        this.switchToCreateRoomTab(true);
        this.updateHudBadge();

        if (typeof resetAllInputStates === 'function') resetAllInputStates();
        if (typeof unlockGamePointer === 'function') unlockGamePointer();

        const consoleModal = document.getElementById('console-modal');
        if (consoleModal) consoleModal.classList.add('hidden');
        const lobbyModal = document.getElementById('lobby-modal');
        if (lobbyModal) lobbyModal.classList.remove('hidden');

        setTimeout(() => {
            this.voluntaryLeave = false;
        }, 300);

        if (isHostDisconnect) {
            this.showNetworkToast('⚠️ El anfitrión cerró la sala. Has vuelto al menú principal.');
        }
    },

    setCountButtonsLocked(locked) {
        const btns = document.querySelectorAll('.count-btn');
        btns.forEach(btn => {
            btn.disabled = locked;
            btn.style.opacity = locked ? '0.35' : '1';
            btn.style.pointerEvents = locked ? 'none' : 'auto';
            btn.style.cursor = locked ? 'not-allowed' : 'pointer';
        });
        const firstBtn = btns[0];
        if (firstBtn && firstBtn.parentElement) {
            let note = document.getElementById('count-locked-note');
            if (locked) {
                if (!note) {
                    note = document.createElement('div');
                    note.id = 'count-locked-note';
                    note.style.cssText = 'font-size:0.74rem; color:#94a3b8; margin-top:4px; font-style:italic;';
                    note.innerText = '🔒 El cupo de jugadores lo define el anfitrión de la sala.';
                    firstBtn.parentElement.insertAdjacentElement('afterend', note);
                }
            } else if (note) {
                note.remove();
            }
        }
    },

    showNetworkToast(message, isWarning = true) {
        let toastBox = document.getElementById('mp-toast-container');
        if (!toastBox) {
            toastBox = document.createElement('div');
            toastBox.id = 'mp-toast-container';
            toastBox.style.cssText = 'position:fixed; top:76px; left:50%; transform:translateX(-50%); z-index:9999; display:flex; flex-direction:column; gap:8px; pointer-events:none; align-items:center;';
            document.body.appendChild(toastBox);
        }

        const item = document.createElement('div');
        item.style.cssText = `
            background: rgba(15, 23, 42, 0.94);
            border: 1.5px solid ${isWarning ? '#f59e0b' : '#38bdf8'};
            color: #f8fafc;
            padding: 10px 18px;
            border-radius: 12px;
            font-size: 0.88rem;
            font-weight: 700;
            box-shadow: 0 10px 25px rgba(0,0,0,0.55);
            transition: opacity 0.4s ease;
        `;
        item.innerText = message;
        toastBox.appendChild(item);

        setTimeout(() => {
            item.style.opacity = '0';
            setTimeout(() => item.remove(), 420);
        }, 4200);
    },

    // Si alguien se desconecta, su rol lo toma un bot
    handlePlayerRemoved(playerId, customReason) {
        const departing = this.players[playerId];
        if (!departing) return;

        const roleObj = GAME_DATA.roles.find(r => r.id === departing.roleId);
        const roleLabel = roleObj ? roleObj.short : 'Tripulante';
        const displayName = departing.name || 'Jugador';

        delete this.players[playerId];

        if (this.isHost && !departing.isBot) {
            const char = GAME_DATA.characters.find(c => c.id === departing.characterId) || GAME_DATA.characters[0];
            const replacementBotId = 'bot_sub_' + Date.now().toString(36).slice(-4);
            this.players[replacementBotId] = {
                id: replacementBotId,
                name: `${char.shortName} (IA)`,
                characterId: departing.characterId || char.id,
                roleId: departing.roleId,
                isBot: true,
                x: departing.x || 0,
                y: 0,
                z: departing.z || 2.5,
                rotY: departing.rotY || 0,
                moving: false,
                targetX: departing.x || 0,
                targetZ: departing.z || 2.5,
                waitTimer: 1.5,
                kbX: 0,
                kbZ: 0
            };
        }

        this.refreshTakenRolesFromPlayers();
        this.renderLobbyRoles();
        this.renderPlayersList();

        this.showNetworkToast(
            customReason || `⚠️ ${displayName} (${roleLabel}) se desconectó. Su rol lo tomó un bot IA.`
        );

        if (typeof onRemoteTaskStateUpdated === 'function') {
            onRemoteTaskStateUpdated();
        }
        if (this.isHost) {
            this.broadcastRoomState();
        }
    },

    // El anfitrión es el cerebro: envía el estado de la partida ~10 veces por segundo (100ms)
    startHostSyncLoop() {
        this.stopHostSyncLoop();
        this.hostSyncInterval = setInterval(() => {
            if (!this.isHost) return;
            // Limpiar únicamente conexiones ya destruidas/cerradas, nunca las que están conectando
            this.guestConns = this.guestConns.filter(c => {
                if (!c) return false;
                const pcState = c.peerConnection ? c.peerConnection.connectionState : '';
                return pcState !== 'closed' && pcState !== 'failed';
            });

            const activeConns = this.guestConns.filter(c => c && c.open);
            if (activeConns.length === 0) return;

            const worldPayload = {
                type: 'WORLD_STATE',
                maxPlayers: this.maxPlayers,
                players: this.players,
                missionId: GAME_STATE.selectedMission.id,
                missionStarted: this.isMissionCurrentlyRunning(),
                completedTasksByRole: this.completedTasksByRole,
                credits: GAME_STATE.credits,
                arenaState: {
                    phase: typeof arenaPhase !== 'undefined' ? arenaPhase : 'flight_out',
                    oxygen: typeof suitOxygen !== 'undefined' ? suitOxygen : 110,
                    shield: typeof shipShield !== 'undefined' ? shipShield : 100
                }
            };

            activeConns.forEach(c => {
                try { c.send(worldPayload); } catch (_) {}
            });
        }, 100);
    },

    stopHostSyncLoop() {
        if (this.hostSyncInterval) {
            clearInterval(this.hostSyncInterval);
            this.hostSyncInterval = null;
        }
    },

    // Bucle de latidos independiente de requestAnimationFrame (evita desconexiones al cambiar de pestaña)
    startNetworkHeartbeatLoop() {
        this.stopNetworkHeartbeatLoop();
        this.heartbeatInterval = setInterval(() => {
            this.tickNetworkHealth(true);
        }, 1000);
    },

    stopNetworkHeartbeatLoop() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    },

    tickNetworkHealth(fromInterval = false) {
        const now = performance.now();

        if (fromInterval || now - this.lastHeartbeatTime >= 1000) {
            this.lastHeartbeatTime = now;
            const me = this.players[this.myId];
            if (me) {
                me.lastSeen = now;
                const hb = {
                    type: 'HEARTBEAT',
                    id: this.myId,
                    pos: {
                        x: me.x,
                        y: me.y,
                        z: me.z,
                        rotY: me.rotY,
                        moving: false,
                        name: this.myName,
                        characterId: GAME_STATE.selectedCharacterId,
                        roleId: GAME_STATE.selectedRole.id
                    }
                };
                if (this.isHost) {
                    this.guestConns.forEach(c => {
                        if (c && c.open) {
                            try { c.send(hb); } catch (_) {}
                        }
                    });
                } else if (this.hostConn && this.hostConn.open) {
                    try { this.hostConn.send(hb); } catch (_) {}
                }
            }
        }

        if (this.isHost && now - this.lastPruneTime >= 2000) {
            this.lastPruneTime = now;
            Object.values(this.players).forEach(p => {
                if (p.id === this.myId || p.isBot) return;
                // 15 segundos de tolerancia para conexiones WebRTC/TURN o cambios de pestaña
                if (p.lastSeen && (now - p.lastSeen > 15000)) {
                    this.handlePlayerRemoved(p.id);
                }
            });
        }
    },

    getActiveRolesInMatch() {
        const order = ['commander', 'engineer', 'scientist', 'comms'];
        const present = new Set(Object.values(this.players).map(p => p.roleId).filter(Boolean));
        present.add(GAME_STATE.selectedRole.id);
        return order.filter(rid => present.has(rid));
    },

    resetMissionTaskState() {
        this.completedTasksByRole = {};
    },

    reportTaskCompleted(roleId, taskId) {
        if (!this.completedTasksByRole[roleId]) {
            this.completedTasksByRole[roleId] = [];
        }
        if (!this.completedTasksByRole[roleId].includes(taskId)) {
            this.completedTasksByRole[roleId].push(taskId);
        }

        if (this.isHost) {
            this.broadcastTaskState();
        } else if (this.hostConn && this.hostConn.open) {
            this.hostConn.send({ type: 'TASK_DONE', roleId, taskId });
        }
    },

    broadcastTaskState() {
        if (!this.isHost) return;
        const payload = {
            type: 'TASK_STATE',
            completedTasksByRole: this.completedTasksByRole
        };
        this.guestConns.forEach(c => {
            if (c && c.open) {
                try { c.send(payload); } catch (_) {}
            }
        });
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
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="color-swatch" style="background:${c.colorCss};"></span>
                    <div>
                        <strong style="font-size:0.84rem; display:block;">${c.shortName}</strong>
                        <span style="font-size:0.70rem; color:#94a3b8;">${c.species}</span>
                    </div>
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
                if (this.takenRolesByOthers[roleId]) return;

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
            lastSeen: performance.now(),
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
            { x: -3.2, z: 3.2 },
            { x: 3.2, z: 3.2 },
            { x: -2.2, z: 1.2 }
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
                waitTimer: 1.5 + Math.random() * 2.5,
                kbX: 0,
                kbZ: 0
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
                <div class="player-slot-row" style="cursor:default;">
                    <span><span class="color-swatch" style="background:${char.colorCss}; vertical-align:middle; margin-right:6px;"></span><strong>${p.name}</strong> <small style="color:#94a3b8;">(${char.shortName})</small></span>
                    <span style="color:${role.colorCss}; font-weight:600;">${role.short}</span>
                </div>
            `;
        }).join('');
        this.updateHudBadge();
    },

    updateHudBadge() {
        const count = Object.keys(this.players).length;
        const codeEl = document.getElementById('hud-room-code');
        const countEl = document.getElementById('hud-player-count');
        if (codeEl) codeEl.innerText = this.roomCode;
        if (countEl) countEl.innerText = `${count}/${this.maxPlayers}`;
    },

    setupHostPeer() {
        if (typeof Peer === 'undefined') return;
        this.stopHostSyncLoop();
        this.guestConns = [];
        if (this.peer) {
            try { this.peer.destroy(); } catch (_) {}
        }
        const badge = document.getElementById('net-status-badge');
        if (badge) badge.innerText = '● Registrando sala en servidor PeerJS...';

        try {
            this.peer = new Peer(PREFIJO_SALA + this.roomCode, PEER_ICE_CONFIG);
            this.peer.on('open', () => {
                if (badge) badge.innerText = `● Sala Online #${this.roomCode} (Anfitrión WebRTC)`;
                this.startHostSyncLoop();
            });
            this.peer.on('connection', conn => {
                // No filtrar conexiones en negociación (c.open === false), solo evitar duplicados exactos
                this.guestConns = this.guestConns.filter(c => c && c !== conn);
                this.guestConns.push(conn);

                conn.on('data', data => this.handleHostData(conn, data));
                conn.on('close', () => {
                    this.guestConns = this.guestConns.filter(c => c !== conn);
                    if (conn.peerPlayerId && this.players[conn.peerPlayerId]) {
                        this.handlePlayerRemoved(conn.peerPlayerId);
                    }
                });
                conn.on('error', () => {
                    this.guestConns = this.guestConns.filter(c => c !== conn);
                });
            });
            this.peer.on('disconnected', () => {
                try {
                    if (this.peer && !this.peer.destroyed) this.peer.reconnect();
                } catch (_) {}
            });
            this.peer.on('error', err => {
                if (err && err.type === 'unavailable-id') {
                    this.roomCode = String(Math.floor(1000 + Math.random() * 9000));
                    document.getElementById('generated-room-code').innerText = this.roomCode;
                    this.setupHostPeer();
                } else if (badge) {
                    badge.innerText = '● Reintentando enlace PeerJS...';
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
                try {
                    conn.send({
                        type: 'PEEK_RESULT',
                        takenRoles,
                        maxPlayers: this.maxPlayers,
                        currentHumans: humanCount
                    });
                } catch (_) {}
            }

        } else if (data.type === 'JOIN') {
            if (!this.guestConns.includes(conn)) {
                this.guestConns.push(conn);
            }

            const incomingId = data.player.id;

            if (conn.peerPlayerId && conn.peerPlayerId !== incomingId) {
                delete this.players[conn.peerPlayerId];
            }

            const existingHumans = Object.values(this.players).filter(p => !p.isBot && p.id !== incomingId);
            if (existingHumans.length >= this.maxPlayers) {
                if (conn.open) {
                    try { conn.send({ type: 'ROOM_FULL', maxPlayers: this.maxPlayers }); } catch (_) {}
                }
                return;
            }

            // Si había un bot ocupando un rol, liberamos un bot para dar paso al jugador humano
            const botKey = Object.keys(this.players).find(k => this.players[k].isBot);
            if (botKey) delete this.players[botKey];

            const usedHumanRoles = new Set(existingHumans.map(p => p.roleId));
            let finalRoleId = data.player.roleId;
            if (usedHumanRoles.has(finalRoleId)) {
                const availableRole = GAME_DATA.roles.find(r => !usedHumanRoles.has(r.id));
                if (availableRole) finalRoleId = availableRole.id;
            }

            const isRejoinSamePlayer = Boolean(this.players[incomingId]);
            conn.peerPlayerId = incomingId;
            this.players[incomingId] = {
                ...data.player,
                roleId: finalRoleId,
                isBot: false,
                lastSeen: performance.now()
            };

            this.refreshTakenRolesFromPlayers();
            this.rebuildBotSlots();
            this.renderLobbyRoles();
            this.renderPlayersList();
            if (!isRejoinSamePlayer) {
                this.showNetworkToast(`🛰️ ${data.player.name} se unió a la tripulación.`, false);
            }

            const welcomePayload = {
                type: 'ROOM_STATE',
                maxPlayers: this.maxPlayers,
                players: this.players,
                missionId: GAME_STATE.selectedMission.id,
                missionStarted: this.isMissionCurrentlyRunning()
            };
            if (conn.open) {
                try { conn.send(welcomePayload); } catch (_) {}
            }
            this.broadcastRoomState();

        } else if (data.type === 'MOVE' || data.type === 'HEARTBEAT') {
            if (!this.guestConns.includes(conn)) {
                this.guestConns.push(conn);
            }
            if (this.players[data.id]) {
                Object.assign(this.players[data.id], data.pos, { lastSeen: performance.now() });
                this.refreshTakenRolesFromPlayers();
            }

        } else if (data.type === 'PLAYER_LEAVE') {
            this.guestConns = this.guestConns.filter(c => c !== conn);
            if (this.players[data.id]) {
                this.handlePlayerRemoved(data.id);
            }

        } else if (data.type === 'TASK_DONE') {
            this.reportTaskCompleted(data.roleId, data.taskId);
            if (typeof onRemoteTaskStateUpdated === 'function') {
                onRemoteTaskStateUpdated();
            }

        } else if (data.type === 'PUNCH_HIT') {
            const attacker = this.players[data.attackerId];
            const target = this.players[data.targetId];
            if (!attacker || !target) return;

            if (target.isBot) {
                target.kbX = (data.kx || 0) * 0.34;
                target.kbZ = (data.kz || 0) * 0.34;
            }

            const punchEvent = {
                type: 'PLAYER_PUNCHED',
                attackerId: attacker.id,
                attackerName: attacker.name,
                targetId: target.id,
                targetName: target.name,
                kx: data.kx || 0,
                kz: data.kz || 0
            };

            this.guestConns.forEach(c => {
                if (c && c.open) {
                    try { c.send(punchEvent); } catch (_) {}
                }
            });

            if (typeof this.onPunchCallback === 'function') {
                this.onPunchCallback(punchEvent);
            }
        }
    },

    // Enviar golpe amistoso entre participantes (funciona tanto si eres anfitrión como invitado)
    sendPunch(targetId, kx, kz) {
        const target = this.players[targetId];
        if (!target) return;

        if (this.isHost) {
            if (target.isBot) {
                target.kbX = (kx || 0) * 0.34;
                target.kbZ = (kz || 0) * 0.34;
            }

            const punchEvent = {
                type: 'PLAYER_PUNCHED',
                attackerId: this.myId,
                attackerName: this.myName,
                targetId: target.id,
                targetName: target.name,
                kx: kx || 0,
                kz: kz || 0
            };

            this.guestConns.forEach(c => {
                if (c && c.open) {
                    try { c.send(punchEvent); } catch (_) {}
                }
            });

            if (typeof this.onPunchCallback === 'function') {
                this.onPunchCallback(punchEvent);
            }
        } else if (this.hostConn && this.hostConn.open) {
            try {
                this.hostConn.send({
                    type: 'PUNCH_HIT',
                    attackerId: this.myId,
                    attackerName: this.myName,
                    targetId,
                    kx: kx || 0,
                    kz: kz || 0
                });
            } catch (_) {}
        }
    },

    peekRemoteRoomRoles(code) {
        if (typeof Peer === 'undefined') return;
        this.destroyPeekPeer();

        const feedback = document.getElementById('join-feedback');
        feedback.style.color = '#38bdf8';
        feedback.innerText = `🔍 Verificando sala remota #${code}...`;

        const tempPeer = new Peer(PEER_ICE_CONFIG);
        this.peekPeer = tempPeer;

        const cleanup = () => {
            if (this.peekPeer === tempPeer) {
                this.peekPeer = null;
            }
            try {
                if (!tempPeer.destroyed) tempPeer.destroy();
            } catch (_) {}
        };

        const peekSafetyTimer = setTimeout(cleanup, 5000);

        tempPeer.on('open', () => {
            if (tempPeer.destroyed) return;
            const conn = tempPeer.connect(PREFIJO_SALA + code, { reliable: true, serialization: 'json' });
            conn.on('open', () => {
                try { conn.send({ type: 'PEEK_ROOM', requesterId: this.myId }); } catch (_) {}
            });
            conn.on('data', data => {
                if (data && data.type === 'PEEK_RESULT') {
                    clearTimeout(peekSafetyTimer);
                    this.takenRolesByOthers = data.takenRoles || {};
                    this.renderLobbyRoles();
                    const freeCount = 4 - Object.keys(this.takenRolesByOthers).length;
                    feedback.style.color = '#10b981';
                    feedback.innerText = `✓ Sala #${code} activa (${data.currentHumans}/${data.maxPlayers} jugadores). ${freeCount} roles libres.`;
                    setTimeout(cleanup, 250);
                }
            });
            conn.on('error', () => {
                clearTimeout(peekSafetyTimer);
                cleanup();
            });
        });
        tempPeer.on('error', () => {
            clearTimeout(peekSafetyTimer);
            feedback.style.color = '#fbbf24';
            feedback.innerText = `⚠️ Buscando sala #${code}... Pulsa INGRESAR A LA SALA para conectar.`;
            cleanup();
        });
    },

    applySyncedPlayersFromHost(nextPlayers) {
        const myLocal = this.players[this.myId];
        const prevIds = Object.keys(this.players);
        const now = performance.now();

        Object.values(nextPlayers).forEach(np => {
            np.lastSeen = now;
        });

        prevIds.forEach(oldId => {
            if (oldId !== this.myId && !nextPlayers[oldId] && this.players[oldId] && !this.players[oldId].isBot) {
                const gone = this.players[oldId];
                const rObj = GAME_DATA.roles.find(r => r.id === gone.roleId);
                this.showNetworkToast(`⚠️ ${gone.name} (${rObj ? rObj.short : 'Tripulante'}) salió. Su rol lo tomó un bot IA.`);
            }
        });

        this.players = nextPlayers;

        if (this.players[this.myId] && this.players[this.myId].roleId) {
            const assignedRole = GAME_DATA.roles.find(r => r.id === this.players[this.myId].roleId);
            if (assignedRole && assignedRole.id !== GAME_STATE.selectedRole.id) {
                GAME_STATE.selectedRole = assignedRole;
                if (typeof updateTopMissionBadge === 'function') updateTopMissionBadge();
            }
        }

        if (myLocal && this.players[this.myId]) {
            this.players[this.myId].x = myLocal.x;
            this.players[this.myId].y = myLocal.y;
            this.players[this.myId].z = myLocal.z;
            this.players[this.myId].rotY = myLocal.rotY;
            this.players[this.myId].moving = myLocal.moving;
        }
    },

    joinRemoteRoom(code) {
        const feedback = document.getElementById('join-feedback');
        const btn = document.getElementById('connect-room-btn');

        if (typeof Peer === 'undefined') {
            feedback.style.color = '#ef4444';
            feedback.innerText = '❌ Error cargando PeerJS. Recarga con Ctrl + Shift + R.';
            return;
        }

        this.stopHostSyncLoop();
        this.destroyPeekPeer();

        btn.disabled = true;
        btn.innerText = '⏳ ENLAZANDO RED...';
        feedback.style.color = '#38bdf8';
        feedback.innerText = `⏳ Conectando por WebRTC (PeerJS) a sala #${code}...`;

        if (this.peer) {
            try { this.peer.destroy(); } catch (_) {}
        }

        let joinedOk = false;
        let joinRetryTimer = null;

        const failTimeout = setTimeout(() => {
            if (joinRetryTimer) clearInterval(joinRetryTimer);
            if (!joinedOk) {
                btn.disabled = false;
                btn.innerText = '🔗 INGRESAR A LA SALA';
                feedback.style.color = '#fbbf24';
                feedback.innerText = `⚠️ Tiempo de espera agotado para #${code}. Verifica el código e intenta de nuevo.`;
            }
        }, 15000);

        this.peer = new Peer(PEER_ICE_CONFIG);

        this.peer.on('disconnected', () => {
            try {
                if (this.peer && !this.peer.destroyed) this.peer.reconnect();
            } catch (_) {}
        });

        this.peer.on('error', err => {
            clearTimeout(failTimeout);
            if (joinRetryTimer) clearInterval(joinRetryTimer);
            btn.disabled = false;
            btn.innerText = '🔗 INGRESAR A LA SALA';
            feedback.style.color = '#ef4444';
            if (err && err.type === 'peer-unavailable') {
                feedback.innerText = `❌ La sala #${code} no existe o el anfitrión la cerró.`;
            } else {
                feedback.innerText = `❌ Error de enlace (${err.type || 'red'}). Intenta de nuevo.`;
            }
        });

        this.peer.on('open', () => {
            feedback.innerText = `🔗 Estableciendo túnel directo con sala #${code}...`;
            const conn = this.peer.connect(PREFIJO_SALA + code, { reliable: true, serialization: 'json' });
            this.hostConn = conn;

            const sendJoinPacket = () => {
                if (!conn.open || joinedOk) return;
                this.roomCode = code;
                this.players = {};
                this.syncLocalPlayerEntry();
                try {
                    conn.send({ type: 'JOIN', player: this.players[this.myId] });
                } catch (_) {}
            };

            conn.on('open', () => {
                sendJoinPacket();
                joinRetryTimer = setInterval(() => {
                    if (joinedOk || !conn.open) {
                        clearInterval(joinRetryTimer);
                        return;
                    }
                    sendJoinPacket();
                }, 1300);
            });

            conn.on('error', () => {
                if (!joinedOk) {
                    clearTimeout(failTimeout);
                    if (joinRetryTimer) clearInterval(joinRetryTimer);
                    btn.disabled = false;
                    btn.innerText = '🔗 INGRESAR A LA SALA';
                    feedback.style.color = '#ef4444';
                    feedback.innerText = `❌ No se pudo abrir el canal WebRTC con #${code}. Reintenta.`;
                }
            });

            conn.on('data', data => {
                if (!data || !data.type) return;

                if (data.type === 'ROOM_FULL') {
                    joinedOk = true;
                    clearTimeout(failTimeout);
                    if (joinRetryTimer) clearInterval(joinRetryTimer);
                    btn.disabled = false;
                    btn.innerText = '🔗 INGRESAR A LA SALA';
                    feedback.style.color = '#fbbf24';
                    feedback.innerText = `⚠️ Sala llena (${data.maxPlayers}/${data.maxPlayers} jugadores).`;
                    try { conn.close(); } catch (_) {}

                } else if (data.type === 'ROOM_STATE') {
                    const wasFirstJoin = !joinedOk;
                    joinedOk = true;
                    clearTimeout(failTimeout);
                    if (joinRetryTimer) clearInterval(joinRetryTimer);
                    btn.disabled = false;
                    btn.innerText = '🔗 INGRESAR A LA SALA';

                    this.maxPlayers = data.maxPlayers;
                    this.applySyncedPlayersFromHost(data.players || {});

                    this.refreshTakenRolesFromPlayers();
                    this.renderLobbyRoles();
                    this.renderPlayersList();

                    if (typeof onRemoteTaskStateUpdated === 'function') {
                        onRemoteTaskStateUpdated();
                    }

                    if (data.missionId) {
                        GAME_STATE.selectedMission = GAME_DATA.missions.find(m => m.id === data.missionId) || GAME_STATE.selectedMission;
                        if (typeof updateWindowPlanet === 'function') updateWindowPlanet(GAME_STATE.selectedMission.id);
                        if (typeof updateTopMissionBadge === 'function') updateTopMissionBadge();
                    }

                    if (typeof rebuildControlCenterAstronaut === 'function' && astroRig) {
                        rebuildControlCenterAstronaut(astroRig.group.position.clone());
                    }

                    if (typeof resetAllInputStates === 'function') resetAllInputStates();
                    document.getElementById('lobby-modal').classList.add('hidden');
                    this.updateHudBadge();
                    const badge = document.getElementById('net-status-badge');
                    if (badge) badge.innerText = `● Conectado a Sala #${this.roomCode}`;

                    if (wasFirstJoin && data.missionStarted && !this.isMissionCurrentlyRunning()) {
                        this.resetMissionTaskState();
                        if (typeof beginMissionLaunch === 'function') {
                            beginMissionLaunch(true);
                            return;
                        }
                    }

                    if (typeof lockGamePointer === 'function') lockGamePointer();

                } else if (data.type === 'WORLD_STATE') {
                    // Estado autoritativo enviado ~10 veces por segundo desde el anfitrión
                    if (!joinedOk) return;
                    this.maxPlayers = data.maxPlayers || this.maxPlayers;
                    this.applySyncedPlayersFromHost(data.players || {});
                    this.refreshTakenRolesFromPlayers();
                    this.updateHudBadge();

                    if (data.completedTasksByRole) {
                        this.completedTasksByRole = data.completedTasksByRole;
                        if (typeof onRemoteTaskStateUpdated === 'function') {
                            onRemoteTaskStateUpdated();
                        }
                    }

                    if (data.missionId && data.missionId !== GAME_STATE.selectedMission.id) {
                        GAME_STATE.selectedMission = GAME_DATA.missions.find(m => m.id === data.missionId) || GAME_STATE.selectedMission;
                        if (typeof updateWindowPlanet === 'function') updateWindowPlanet(GAME_STATE.selectedMission.id);
                        if (typeof updateTopMissionBadge === 'function') updateTopMissionBadge();
                    }

                    if (data.missionStarted && !this.isMissionCurrentlyRunning() && typeof beginMissionLaunch === 'function') {
                        beginMissionLaunch(true);
                    }

                } else if (data.type === 'MOVE' || data.type === 'HEARTBEAT') {
                    if (data.id !== this.myId && this.players[data.id]) {
                        Object.assign(this.players[data.id], data.pos, { lastSeen: performance.now() });
                        this.refreshTakenRolesFromPlayers();
                    }

                } else if (data.type === 'PLAYER_LEAVE') {
                    if (data.id !== this.myId && this.players[data.id]) {
                        this.handlePlayerRemoved(data.id);
                    }

                } else if (data.type === 'TASK_STATE') {
                    this.completedTasksByRole = data.completedTasksByRole || {};
                    if (typeof onRemoteTaskStateUpdated === 'function') {
                        onRemoteTaskStateUpdated();
                    }

                } else if (data.type === 'PLAYER_PUNCHED') {
                    if (typeof this.onPunchCallback === 'function') {
                        this.onPunchCallback(data);
                    }

                } else if (data.type === 'LAUNCH') {
                    if (data.players) {
                        this.players = data.players;
                        Object.values(this.players).forEach(p => { p.lastSeen = performance.now(); });
                    }
                    this.resetMissionTaskState();
                    GAME_STATE.selectedMission = GAME_DATA.missions.find(m => m.id === data.missionId) || GAME_STATE.selectedMission;
                    if (typeof beginMissionLaunch === 'function') beginMissionLaunch(true);
                }
            });

            // Si se va el anfitrión, todos vuelven al menú principal
            conn.on('close', () => {
                if (joinRetryTimer) clearInterval(joinRetryTimer);
                if (joinedOk && !this.voluntaryLeave) {
                    if (typeof stopArenaLoop === 'function') stopArenaLoop();
                    const arenaEl = document.getElementById('arena-container');
                    if (arenaEl) arenaEl.classList.add('hidden');
                    const reportEl = document.getElementById('report-modal');
                    if (reportEl) reportEl.classList.add('hidden');
                    const taskEl = document.getElementById('planet-task-modal');
                    if (taskEl) taskEl.classList.add('hidden');
                    const radarEl = document.getElementById('sector-radar-box');
                    if (radarEl) radarEl.classList.add('hidden');

                    const ccEl = document.getElementById('control-center-container');
                    if (ccEl && ccEl.classList.contains('hidden')) {
                        ccEl.classList.remove('hidden');
                        if (typeof animateControlCenter === 'function' && !ccAnimId) {
                            animateControlCenter();
                        }
                    }

                    this.leaveCurrentRoom(true);
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
            missionId: GAME_STATE.selectedMission.id,
            missionStarted: this.isMissionCurrentlyRunning()
        };
        this.guestConns.forEach(c => {
            if (c && c.open) {
                try { c.send(payload); } catch (_) {}
            }
        });
    },

    sendMyPosition(x, y, z, rotY, moving) {
        const now = performance.now();
        if (this.players[this.myId]) {
            Object.assign(this.players[this.myId], {
                x, y, z, rotY, moving,
                lastSeen: now,
                name: this.myName,
                characterId: GAME_STATE.selectedCharacterId,
                roleId: GAME_STATE.selectedRole.id
            });
        }
        if (now - this.lastSendTime < 50) return;
        this.lastSendTime = now;

        // Los clientes envían sus movimientos al anfitrión; el anfitrión difunde el estado global a 10 Hz
        if (!this.isHost && this.hostConn && this.hostConn.open) {
            try {
                this.hostConn.send({
                    type: 'MOVE',
                    id: this.myId,
                    pos: {
                        x, y, z, rotY, moving,
                        name: this.myName,
                        characterId: GAME_STATE.selectedCharacterId,
                        roleId: GAME_STATE.selectedRole.id
                    }
                });
            } catch (_) {}
        }
    },

    broadcastLaunch() {
        if (!this.isHost) return;
        this.resetMissionTaskState();
        const msg = {
            type: 'LAUNCH',
            missionId: GAME_STATE.selectedMission.id,
            players: this.players
        };
        this.guestConns.forEach(c => {
            if (c && c.open) {
                try { c.send(msg); } catch (_) {}
            }
        });
    },

    updateBots(dt, boundsLimit) {
        if (!this.isHost) return;
        Object.values(this.players).forEach(p => {
            if (!p.isBot) return;

            // Aplicar retroceso si un jugador empujó/golpeó al bot
            if (Math.abs(p.kbX || 0) > 0.002 || Math.abs(p.kbZ || 0) > 0.002) {
                p.x = Math.max(-boundsLimit, Math.min(boundsLimit, p.x + p.kbX));
                p.z = Math.max(-boundsLimit, Math.min(boundsLimit, p.z + p.kbZ));
                const damp = Math.exp(-10 * dt);
                p.kbX *= damp;
                p.kbZ *= damp;
                p.moving = true;
                return;
            }

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
                p.x += Math.sin(angle) * 0.04;
                p.z += Math.cos(angle) * 0.04;
                p.moving = true;
            } else {
                p.moving = false;
            }
        });
    }
};
