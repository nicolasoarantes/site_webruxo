import * as THREE from 'three';

console.log("Jogo Wander Webruxo - Script Carregado v1.3 - Controle de Câmera com Mouse");

// Seletores DOM
const gameContainer = document.getElementById('game-container');
const loadingScreen = document.getElementById('loading-screen');
const mobileControls = document.getElementById('mobile-controls');
const jumpButton = document.getElementById('jump-button');
const hookButton = document.getElementById('hook-button');
const instructionScreen = document.getElementById('instruction-screen');
const startGameButton = document.getElementById('start-game-button');

// --- Constantes Visuais - Nova Paleta Retro Moderna ---
const COLORS = {
    PLAYER_BODY: 0xFFD700,
    PLAYER_HAT: 0x6A1B9A,
    PLAYER_SHOES: 0x00FFFF,
    BACKGROUND_TOP: 0x0B0B2D,
    BACKGROUND_BOTTOM: 0x2D0B38,
    FOG: 0x2D0B38,
    PLATFORM_BASE: 0x0B6EFD,
    PLATFORM_ACCENT: 0x39FF14,
    PLATFORM_SPECIAL: 0xFF6B35,
    HOOK_LINE: 0xFF00FF,
    COLLECTIBLE: 0x00FFFF,
    GLOW: 0xFF00FF,
    AIM_INDICATOR: 0xFF00FF,
    AIM_INDICATOR_HIT: 0x39FF14,
    UI_BUTTON_BG: 'rgba(106, 27, 154, 0.8)',
    UI_BUTTON_HOVER_BG: 'rgba(255, 0, 255, 0.9)',
    UI_TEXT: '#FFFFFF',
    UI_BORDER: '#00FFFF'
};

// Variáveis Globais do Jogo
let scene, camera, renderer, player, clock;
let keys = {};
let isMobile = false;
let playerVelocity = new THREE.Vector3();
let onGround = false;
let lastPlatform = null;
const gravity = -9.8 * 3.5;
const moveSpeed = 7;
const acceleration = 40;
const deceleration = 25;
const jumpForce = 9;
let platforms = [];
let playerCollider;
let platformColliders = [];
let gameStarted = false;
let gamePaused = false;

// Variáveis do Gancho Mágico
let hookActive = false;
let hookTarget = null;
let hookLine = null;
const hookMaxDistance = 40;
const hookPullAcceleration = 50;
const hookMaxPullSpeed = 25;
const hookMinDistance = 1.0;
let raycaster = new THREE.Raycaster();
let potentialHookTarget = null;

// Variáveis de Controle de Toque
let touchStartX = 0, touchStartY = 0, touchCurrentX = 0, touchCurrentY = 0;
let isTouching = false;
let touchMoveX = 0, touchMoveY = 0;
const touchSensitivity = 0.02;

// Variáveis para efeitos visuais
let backgroundGrid, particleSystem, glowMaterial;

// Variáveis de Controle de Câmera com Mouse
let cameraYaw = 0; // Rotação horizontal da câmera
let cameraPitch = 0.3; // Rotação vertical da câmera (inicia olhando um pouco para baixo)
const mouseSensitivity = 0.002;
const minPitch = -Math.PI / 2 + 0.1; // Limite inferior para olhar para baixo
const maxPitch = Math.PI / 2 - 0.1;  // Limite superior para olhar para cima
let aimIndicator = null;

// --- Inicialização --- 
function init() {
    console.log("Inicializando o jogo com Controle de Câmera...");

    isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        mobileControls.style.display = 'flex';
        jumpButton.style.backgroundColor = COLORS.UI_BUTTON_BG;
        hookButton.style.backgroundColor = COLORS.UI_BUTTON_BG;
        jumpButton.style.border = `2px solid ${COLORS.UI_BORDER}`;
        hookButton.style.border = `2px solid ${COLORS.UI_BORDER}`;
    }

    scene = new THREE.Scene();
    const bgTexture = createGradientTexture(COLORS.BACKGROUND_TOP, COLORS.BACKGROUND_BOTTOM);
    scene.background = bgTexture;
    scene.fog = new THREE.Fog(COLORS.FOG, 20, 100);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Posição inicial da câmera será calculada em updateCamera

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    gameContainer.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
    directionalLight.position.set(20, 25, 15);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            "c": { type: "f", value: 0.2 },
            "p": { type: "f", value: 4.5 },
            glowColor: { type: "c", value: new THREE.Color(COLORS.GLOW) },
            viewVector: { type: "v3", value: camera.position }
        },
        vertexShader: `
            uniform vec3 viewVector;
            uniform float c;
            uniform float p;
            varying float intensity;
            void main() {
                vec3 vNormal = normalize(normalMatrix * normal);
                vec3 vNormel = normalize(normalMatrix * viewVector);
                intensity = pow(c - dot(vNormal, vNormel), p);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 glowColor;
            varying float intensity;
            void main() {
                vec3 glow = glowColor * intensity;
                gl_FragColor = vec4(glow, 1.0);
            }
        `,
        side: THREE.FrontSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });

    clock = new THREE.Clock();

    createBackgroundElements();
    createPlayer();
    createPlatforms();
    createParticleSystem();
    createAimIndicator();
    setupControls();

    startGameButton.addEventListener('click', startGame);

    window.addEventListener('game-pause-toggle', (event) => {
        gamePaused = event.detail.paused;
        if (gamePaused) {
            clock.stop();
            if (document.pointerLockElement) document.exitPointerLock();
        } else {
            clock.start();
            if (gameStarted && !isMobile) renderer.domElement.requestPointerLock();
        }
    });

    loadingScreen.style.display = 'none';
    console.log("Jogo inicializado com Controle de Câmera.");
}

// --- Função para iniciar o jogo ---
function startGame() {
    instructionScreen.style.display = 'none';
    gameStarted = true;
    gamePaused = false;
    if (!isMobile) {
        renderer.domElement.requestPointerLock();
    }
    animate();
}

// --- Criar textura de gradiente ---
function createGradientTexture(colorTop, colorBottom) {
    const canvas = document.createElement('canvas');
    canvas.width = 2; canvas.height = 512;
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#' + new THREE.Color(colorTop).getHexString());
    gradient.addColorStop(1, '#' + new THREE.Color(colorBottom).getHexString());
    context.fillStyle = gradient;
    context.fillRect(0, 0, 2, 512);
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
}

// --- Criação do Jogador (Eggonaldo) ---
function createPlayer() {
    const playerGroup = new THREE.Group();
    const bodyRadius = 0.5, bodyHeight = 1.0, hatHeight = 0.8, shoeSize = 0.3;
    const totalHeight = bodyHeight + hatHeight + shoeSize;

    const bodyGeometry = new THREE.CapsuleGeometry(bodyRadius, bodyHeight, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: COLORS.PLAYER_BODY, roughness: 0.4, metalness: 0.6, emissive: COLORS.PLAYER_BODY, emissiveIntensity: 0.2 });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.y = bodyHeight / 2 + shoeSize;
    playerGroup.add(bodyMesh);

    const hatGeometry = new THREE.ConeGeometry(bodyRadius * 1.2, hatHeight, 12);
    const hatMaterial = new THREE.MeshStandardMaterial({ color: COLORS.PLAYER_HAT, roughness: 0.3, metalness: 0.7, emissive: COLORS.PLAYER_HAT, emissiveIntensity: 0.3 });
    const hatMesh = new THREE.Mesh(hatGeometry, hatMaterial);
    hatMesh.position.y = bodyMesh.position.y + bodyHeight / 2 + hatHeight / 2 - 0.1;
    hatMesh.rotation.z = Math.PI * 0.05;
    playerGroup.add(hatMesh);

    const hatGlowGeometry = new THREE.ConeGeometry(bodyRadius * 1.3, hatHeight * 1.1, 12);
    const hatGlow = new THREE.Mesh(hatGlowGeometry, glowMaterial.clone());
    hatGlow.position.copy(hatMesh.position);
    hatGlow.rotation.copy(hatMesh.rotation);
    playerGroup.add(hatGlow);

    const shoeGeometry = new THREE.CylinderGeometry(shoeSize, shoeSize * 0.8, shoeSize * 0.8, 8);
    const shoeMaterial = new THREE.MeshStandardMaterial({ color: COLORS.PLAYER_SHOES, roughness: 0.5, metalness: 0.5, emissive: COLORS.PLAYER_SHOES, emissiveIntensity: 0.2 });
    const shoeL = new THREE.Mesh(shoeGeometry, shoeMaterial);
    const shoeR = new THREE.Mesh(shoeGeometry, shoeMaterial);
    shoeL.position.set(-bodyRadius * 0.6, shoeSize / 2, 0);
    shoeR.position.set(bodyRadius * 0.6, shoeSize / 2, 0);
    playerGroup.add(shoeL);
    playerGroup.add(shoeR);

    player = playerGroup;
    player.position.set(0, 5, 0);
    scene.add(player);

    playerCollider = new THREE.Box3();
    const colliderSize = new THREE.Vector3(bodyRadius * 1.8, totalHeight * 0.95, bodyRadius * 1.8);
    playerCollider.setFromCenterAndSize(player.position, colliderSize);
}

// --- Criação de Plataformas ---
function createPlatforms() {
    const platformMaterialBase = createGridMaterial(COLORS.PLATFORM_BASE, 0.2);
    const platformMaterialAccent = createGridMaterial(COLORS.PLATFORM_ACCENT, 0.3);
    const platformMaterialSpecial = createGridMaterial(COLORS.PLATFORM_SPECIAL, 0.4);

    const platformData = [
        { geo: new THREE.BoxGeometry(30, 1.5, 30), pos: new THREE.Vector3(0, -0.75, 0), mat: platformMaterialBase },
        { geo: new THREE.BoxGeometry(6, 1, 6), pos: new THREE.Vector3(12, 2.5, -7), mat: platformMaterialAccent },
        { geo: new THREE.BoxGeometry(4, 1, 10), pos: new THREE.Vector3(-10, 4.5, -12), mat: platformMaterialBase },
        { geo: new THREE.CylinderGeometry(3, 3, 1, 16), pos: new THREE.Vector3(0, 6.5, -18), mat: platformMaterialAccent },
        { geo: new THREE.BoxGeometry(5, 0.8, 2), pos: new THREE.Vector3(-5, 8, -25), mat: platformMaterialSpecial, moving: { axis: 'x', range: 12, speed: 2.5 } }
    ];

    platformData.forEach((data) => {
        const platform = new THREE.Mesh(data.geo, data.mat);
        platform.position.copy(data.pos);
        platform.userData.isAnchorable = true;
        const edgeGlow = createPlatformGlow(data.geo, platform.position);
        platform.add(edgeGlow);
        scene.add(platform);
        platforms.push(platform);

        const platformBox = new THREE.Box3().setFromObject(platform);
        platformBox.min.y += 0.05;
        platformColliders.push(platformBox);

        if (data.moving) {
            platform.userData.isMoving = true;
            platform.userData.moveAxis = data.moving.axis;
            platform.userData.moveRange = data.moving.range;
            platform.userData.moveSpeed = data.moving.speed;
            platform.userData.initialPos = platform.position.clone();
        }
    });
}

// --- Criar material com efeito de grade ---
function createGridMaterial(color, emissiveIntensity = 0.2) {
    const gridSize = 512, lineWidth = 2, gridSpacing = 32;
    const canvas = document.createElement('canvas');
    canvas.width = gridSize; canvas.height = gridSize;
    const context = canvas.getContext('2d');
    context.fillStyle = 'black'; context.fillRect(0, 0, gridSize, gridSize);
    context.strokeStyle = '#' + new THREE.Color(color).getHexString(); context.lineWidth = lineWidth;
    for (let i = 0; i <= gridSize; i += gridSpacing) { context.beginPath(); context.moveTo(0, i); context.lineTo(gridSize, i); context.stroke(); }
    for (let i = 0; i <= gridSize; i += gridSpacing) { context.beginPath(); context.moveTo(i, 0); context.lineTo(i, gridSize); context.stroke(); }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(1, 1);
    return new THREE.MeshStandardMaterial({ map: texture, color: color, roughness: 0.7, metalness: 0.3, emissive: color, emissiveIntensity: emissiveIntensity });
}

// --- Criar efeito de brilho para plataformas ---
function createPlatformGlow(geometry, position) {
    let glowGeometry;
    if (geometry instanceof THREE.BoxGeometry) {
        glowGeometry = new THREE.BoxGeometry(geometry.parameters.width * 1.05, geometry.parameters.height * 1.05, geometry.parameters.depth * 1.05);
    } else if (geometry instanceof THREE.CylinderGeometry) {
        glowGeometry = new THREE.CylinderGeometry(geometry.parameters.radiusTop * 1.05, geometry.parameters.radiusBottom * 1.05, geometry.parameters.height * 1.05, geometry.parameters.radialSegments);
    } else { glowGeometry = geometry.clone(); }
    const glow = new THREE.Mesh(glowGeometry, glowMaterial.clone());
    return glow;
}

// --- Criação de Elementos de Fundo ---
function createBackgroundElements() {
    const gridHelper = new THREE.GridHelper(200, 50, 0x00FFFF, 0xFF00FF);
    gridHelper.position.y = -5; gridHelper.material.opacity = 0.15; gridHelper.material.transparent = true;
    scene.add(gridHelper);

    const mountainGeometry = new THREE.PlaneGeometry(300, 100, 30, 10);
    const mountainVertices = mountainGeometry.attributes.position.array;
    for (let i = 0; i < mountainVertices.length; i += 3) { if (i % 9 === 0) mountainVertices[i + 1] = Math.random() * 15; }
    const mountainMaterial = new THREE.MeshBasicMaterial({ color: COLORS.PLATFORM_ACCENT, wireframe: true, transparent: true, opacity: 0.2 });
    const mountains = new THREE.Mesh(mountainGeometry, mountainMaterial);
    mountains.rotation.x = -Math.PI / 2; mountains.position.set(0, -5, -100);
    scene.add(mountains);

    const elementMaterial = new THREE.MeshBasicMaterial({ color: COLORS.PLATFORM_SPECIAL, transparent: true, opacity: 0.15, wireframe: true });
    const shapes = [new THREE.BoxGeometry(5, 5, 5), new THREE.ConeGeometry(3, 6, 4), new THREE.TorusGeometry(4, 0.5, 8, 16)];
    for (let i = 0; i < 20; i++) {
        const geometry = shapes[Math.floor(Math.random() * shapes.length)];
        const element = new THREE.Mesh(geometry, elementMaterial);
        element.position.set((Math.random() - 0.5) * 150, (Math.random() - 0.5) * 100 + 20, (Math.random() - 0.5) * 150 - 50);
        element.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        element.userData.rotationSpeed = { x: (Math.random() - 0.5) * 0.01, y: (Math.random() - 0.5) * 0.01, z: (Math.random() - 0.5) * 0.01 };
        scene.add(element);
    }

    const sunGeometry = new THREE.SphereGeometry(15, 16, 16);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFF00FF, transparent: true, opacity: 0.2 });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(-50, 40, -100);
    scene.add(sun);

    const sunGlow = new THREE.Mesh(new THREE.SphereGeometry(18, 16, 16), glowMaterial.clone());
    sunGlow.position.copy(sun.position);
    scene.add(sunGlow);
}

// --- Criar sistema de partículas ---
function createParticleSystem() {
    const particleCount = 1000;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    const particleColors = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        particlePositions[i3] = (Math.random() - 0.5) * 200; particlePositions[i3 + 1] = (Math.random() - 0.5) * 100 + 20; particlePositions[i3 + 2] = (Math.random() - 0.5) * 200 - 50;
        particleSizes[i] = Math.random() * 2 + 0.5;
        if (i % 3 === 0) { particleColors[i3] = 1; particleColors[i3 + 1] = 0; particleColors[i3 + 2] = 1; }
        else if (i % 3 === 1) { particleColors[i3] = 0; particleColors[i3 + 1] = 1; particleColors[i3 + 2] = 0.5; }
        else { particleColors[i3] = 0; particleColors[i3 + 1] = 1; particleColors[i3 + 2] = 1; }
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    const particleMaterial = new THREE.PointsMaterial({ size: 1, vertexColors: true, transparent: true, opacity: 0.6, sizeAttenuation: true });
    particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
}

// --- Criar Indicador de Mira (agora fixo na frente) ---
function createAimIndicator() {
    const indicatorGroup = new THREE.Group();
    const lineGeometry = new THREE.BufferGeometry();
    const lineVertices = new Float32Array([0, 0, 0, 0, 0, -hookMaxDistance]);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(lineVertices, 3));
    const lineMaterial = new THREE.LineBasicMaterial({ color: COLORS.AIM_INDICATOR, linewidth: 2, transparent: true, opacity: 0.5 });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    indicatorGroup.add(line);

    const pointGeometry = new THREE.TorusGeometry(0.2, 0.05, 8, 16);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: COLORS.AIM_INDICATOR, side: THREE.DoubleSide });
    const point = new THREE.Mesh(pointGeometry, pointMaterial);
    point.position.z = -hookMaxDistance;
    point.rotation.x = Math.PI / 2;
    indicatorGroup.add(point);

    aimIndicator = indicatorGroup;
    aimIndicator.visible = false; // Começa invisível, aparece com mouse lock
    scene.add(aimIndicator);
}

// --- Configuração de Controles ---
function setupControls() {
    console.log("Configurando controles...");
    const keyConfig = window.gameKeyConfig || {};

    document.addEventListener('keydown', (event) => {
        if (gamePaused) return;
        const key = event.key.toLowerCase();
        keys[key] = true;
        if (key === (keyConfig.hook?.key || 'shift') || key === 'f') { if (!hookActive) activateHook(); }
        if (key === (keyConfig.jump?.key || ' ') && onGround) { playerVelocity.y = jumpForce; onGround = false; createJumpEffect(); }
    });

    document.addEventListener('keyup', (event) => {
        const key = event.key.toLowerCase();
        keys[key] = false;
        if (key === (keyConfig.hook?.key || 'shift') || key === 'f') { if (hookActive) deactivateHook(); }
    });

    if (!isMobile) {
        document.addEventListener('mousemove', onMouseMove, false);
        renderer.domElement.addEventListener('mousedown', (event) => {
            if (gamePaused || event.button !== 0) return;
            if (!document.pointerLockElement) {
                renderer.domElement.requestPointerLock();
            } else {
                if (!hookActive) activateHook();
            }
        });
        renderer.domElement.addEventListener('mouseup', (event) => {
             if (gamePaused || event.button !== 0) return;
             if (hookActive) deactivateHook();
        });

        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === renderer.domElement) {
                console.log('Pointer Lock Ativado');
                if(aimIndicator) aimIndicator.visible = true;
            } else {
                console.log('Pointer Lock Desativado');
                if(aimIndicator) aimIndicator.visible = false;
                if (gameStarted && !gamePaused) {
                    window.dispatchEvent(new CustomEvent('game-pause-toggle', { detail: { paused: true } }));
                }
            }
        }, false);
    }

    if (isMobile) {
        jumpButton.addEventListener('touchstart', (e) => { e.preventDefault(); if (onGround && !gamePaused) { playerVelocity.y = jumpForce; onGround = false; createJumpEffect(); } }, { passive: false });
        hookButton.addEventListener('touchstart', (e) => { e.preventDefault(); if (!hookActive && !gamePaused) activateHook(); }, { passive: false });
        hookButton.addEventListener('touchend', (e) => { e.preventDefault(); if (hookActive && !gamePaused) deactivateHook(); }, { passive: false });
        gameContainer.addEventListener('touchstart', (e) => { if (e.target === jumpButton || e.target === hookButton || gamePaused) return; isTouching = true; touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; touchCurrentX = touchStartX; touchCurrentY = touchStartY; touchMoveX = 0; touchMoveY = 0; }, { passive: false });
        gameContainer.addEventListener('touchmove', (e) => { if (!isTouching || gamePaused) return; touchCurrentX = e.touches[0].clientX; touchCurrentY = e.touches[0].clientY; touchMoveX = (touchCurrentX - touchStartX) * touchSensitivity; touchMoveY = (touchCurrentY - touchStartY) * touchSensitivity; }, { passive: false });
        gameContainer.addEventListener('touchend', (e) => { if (e.target === jumpButton || e.target === hookButton || gamePaused) return; isTouching = false; touchMoveX = 0; touchMoveY = 0; }, { passive: false });
    }

    window.addEventListener('resize', onWindowResize, false);
}

// --- Handler de Movimento do Mouse (agora controla a câmera) ---
function onMouseMove(event) {
    if (document.pointerLockElement === renderer.domElement) {
        // Atualizar ângulos da câmera
        cameraYaw -= event.movementX * mouseSensitivity;
        cameraPitch -= event.movementY * mouseSensitivity;

        // Limitar ângulo vertical (pitch)
        cameraPitch = Math.max(minPitch, Math.min(maxPitch, cameraPitch));
    }
}

// --- Atualizar Indicador Visual de Mira ---
function updateAimIndicatorVisuals() {
    if (!aimIndicator || !player) return;

    const aimOrigin = player.position.clone().add(new THREE.Vector3(0, 0.5, 0));
    const cameraDirection = camera.getWorldDirection(new THREE.Vector3());

    // Posicionar e orientar indicador na frente do jogador, seguindo a câmera
    aimIndicator.position.copy(aimOrigin);
    aimIndicator.lookAt(aimOrigin.clone().add(cameraDirection));
    aimIndicator.visible = !isMobile && document.pointerLockElement === renderer.domElement; // Visível apenas no desktop com mouse travado

    // Verificar alvo potencial na direção da câmera
    potentialHookTarget = null;
    if (aimIndicator.visible && !hookActive) {
        raycaster.set(aimOrigin, cameraDirection);
        const intersects = raycaster.intersectObjects(platforms, false);
        let minDistance = hookMaxDistance;

        intersects.forEach(intersect => {
            if (intersect.object.userData.isAnchorable && intersect.distance <= minDistance && intersect.distance > hookMinDistance) {
                minDistance = intersect.distance;
                potentialHookTarget = intersect.point;
            }
        });
    }

    // Atualizar cor do indicador
    const aimLine = aimIndicator.children[0];
    const aimPoint = aimIndicator.children[1];
    if (aimLine && aimPoint) {
        const targetColor = potentialHookTarget ? COLORS.AIM_INDICATOR_HIT : COLORS.AIM_INDICATOR;
        aimLine.material.color.setHex(targetColor);
        aimPoint.material.color.setHex(targetColor);
    }
}

// --- Criar efeito de pulo ---
function createJumpEffect() {
    const jumpParticleCount = 20;
    const jumpParticleGeometry = new THREE.BufferGeometry();
    const jumpParticlePositions = new Float32Array(jumpParticleCount * 3);
    const jumpParticleSizes = new Float32Array(jumpParticleCount);
    const jumpParticleColors = new Float32Array(jumpParticleCount * 3);
    for (let i = 0; i < jumpParticleCount; i++) {
        const i3 = i * 3;
        const angle = Math.random() * Math.PI * 2; const radius = Math.random() * 0.5;
        jumpParticlePositions[i3] = player.position.x + Math.cos(angle) * radius; jumpParticlePositions[i3 + 1] = player.position.y; jumpParticlePositions[i3 + 2] = player.position.z + Math.sin(angle) * radius;
        jumpParticleSizes[i] = Math.random() * 3 + 1;
        jumpParticleColors[i3] = 0; jumpParticleColors[i3 + 1] = 1; jumpParticleColors[i3 + 2] = 1;
    }
    jumpParticleGeometry.setAttribute('position', new THREE.BufferAttribute(jumpParticlePositions, 3));
    jumpParticleGeometry.setAttribute('size', new THREE.BufferAttribute(jumpParticleSizes, 1));
    jumpParticleGeometry.setAttribute('color', new THREE.BufferAttribute(jumpParticleColors, 3));
    const jumpParticleMaterial = new THREE.PointsMaterial({ size: 1, vertexColors: true, transparent: true, opacity: 0.8, sizeAttenuation: true });
    const jumpParticles = new THREE.Points(jumpParticleGeometry, jumpParticleMaterial);
    scene.add(jumpParticles);
    const startTime = clock.elapsedTime;
    function animateJumpParticles() {
        if (!gameStarted) return;
        const positions = jumpParticleGeometry.attributes.position.array;
        const sizes = jumpParticleGeometry.attributes.size.array;
        const elapsed = clock.elapsedTime - startTime;
        if (elapsed > 1) { scene.remove(jumpParticles); return; }
        for (let i = 0; i < jumpParticleCount; i++) { const i3 = i * 3; positions[i3 + 1] += 0.1; sizes[i] -= 0.03; }
        jumpParticleMaterial.opacity = 1 - elapsed;
        jumpParticleGeometry.attributes.position.needsUpdate = true; jumpParticleGeometry.attributes.size.needsUpdate = true;
        requestAnimationFrame(animateJumpParticles);
    }
    animateJumpParticles();
}

// --- Lógica do Gancho Mágico (Usa direção da câmera) ---
function activateHook() {
    if (potentialHookTarget) {
        console.log("Gancho ancorado no alvo potencial!", potentialHookTarget);
        hookActive = true;
        hookTarget = potentialHookTarget.clone();

        if (!hookLine) {
            const lineMaterial = new THREE.LineBasicMaterial({ color: COLORS.HOOK_LINE, linewidth: 3, transparent: true, opacity: 0.8 });
            const points = [player.position.clone().add(new THREE.Vector3(0, 0.5, 0)), hookTarget];
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            hookLine = new THREE.Line(lineGeometry, lineMaterial);
            scene.add(hookLine);
        } else {
            const positions = hookLine.geometry.attributes.position;
            positions.setXYZ(0, player.position.x, player.position.y + 0.5, player.position.z);
            positions.setXYZ(1, hookTarget.x, hookTarget.y, hookTarget.z);
            positions.needsUpdate = true;
            hookLine.visible = true;
        }

        playerVelocity.set(0, 0, 0);
        onGround = false;
        createHookActivationEffect();
        if (aimIndicator) aimIndicator.visible = false;
    } else {
        console.log("Nenhum ponto de ancoragem válido na direção da câmera.");
    }
}

function deactivateHook() {
    console.log("Desativando gancho.");
    hookActive = false;
    hookTarget = null;
    if (hookLine) hookLine.visible = false;
    if (aimIndicator && !isMobile && document.pointerLockElement) aimIndicator.visible = true;
    playerVelocity.y = jumpForce * 0.3;
}

function updateHook(delta) {
    if (hookActive && hookTarget && hookLine) {
        const positions = hookLine.geometry.attributes.position;
        positions.setXYZ(0, player.position.x, player.position.y + 0.5, player.position.z);
        positions.needsUpdate = true;
        const pullDirection = hookTarget.clone().sub(player.position);
        const distanceToTarget = pullDirection.length();
        if (distanceToTarget > hookMinDistance) {
            pullDirection.normalize();
            playerVelocity.add(pullDirection.multiplyScalar(hookPullAcceleration * delta));
            if (playerVelocity.length() > hookMaxPullSpeed) playerVelocity.normalize().multiplyScalar(hookMaxPullSpeed);
            if (Math.random() > 0.7) createHookParticle();
        } else {
            deactivateHook();
            playerVelocity.y = jumpForce * 0.6; playerVelocity.x *= 0.6; playerVelocity.z *= 0.6;
        }
    } else {
        if (hookLine && hookLine.visible) hookLine.visible = false;
    }
}

// --- Criar efeito de ativação do gancho ---
function createHookActivationEffect() {
    const ringParticleCount = 30;
    const ringGeometry = new THREE.BufferGeometry();
    const ringPositions = new Float32Array(ringParticleCount * 3);
    const ringColors = new Float32Array(ringParticleCount * 3);
    for (let i = 0; i < ringParticleCount; i++) {
        const angle = (i / ringParticleCount) * Math.PI * 2; const radius = 0.5; const i3 = i * 3;
        ringPositions[i3] = hookTarget.x + Math.cos(angle) * radius; ringPositions[i3 + 1] = hookTarget.y; ringPositions[i3 + 2] = hookTarget.z + Math.sin(angle) * radius;
        ringColors[i3] = 1; ringColors[i3 + 1] = 0; ringColors[i3 + 2] = 1;
    }
    ringGeometry.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));
    ringGeometry.setAttribute('color', new THREE.BufferAttribute(ringColors, 3));
    const ringMaterial = new THREE.PointsMaterial({ size: 0.2, vertexColors: true, transparent: true, opacity: 1 });
    const ringParticles = new THREE.Points(ringGeometry, ringMaterial);
    scene.add(ringParticles);
    const startTime = clock.elapsedTime;
    function animateRingParticles() {
        if (!gameStarted) return;
        const positions = ringGeometry.attributes.position.array;
        const elapsed = clock.elapsedTime - startTime;
        if (elapsed > 0.5 || !hookActive) { scene.remove(ringParticles); return; }
        const scale = 1 + elapsed * 4;
        for (let i = 0; i < ringParticleCount; i++) {
            const i3 = i * 3; const angle = (i / ringParticleCount) * Math.PI * 2; const radius = 0.5 * scale;
            positions[i3] = hookTarget.x + Math.cos(angle) * radius; positions[i3 + 1] = hookTarget.y; positions[i3 + 2] = hookTarget.z + Math.sin(angle) * radius;
        }
        ringMaterial.opacity = 1 - elapsed * 2;
        ringGeometry.attributes.position.needsUpdate = true;
        requestAnimationFrame(animateRingParticles);
    }
    animateRingParticles();
}

// --- Criar partícula ao longo da linha do gancho ---
function createHookParticle() {
    if (!hookActive || !hookTarget) return;
    const t = Math.random();
    const particlePos = new THREE.Vector3().lerpVectors(player.position.clone().add(new THREE.Vector3(0, 0.5, 0)), hookTarget, t);
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(3); positions[0] = particlePos.x; positions[1] = particlePos.y; positions[2] = particlePos.z;
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({ color: COLORS.HOOK_LINE, size: 0.3, transparent: true, opacity: 1 });
    const particle = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particle);
    const startTime = clock.elapsedTime;
    function animateParticle() {
        if (!gameStarted) return;
        const elapsed = clock.elapsedTime - startTime;
        if (elapsed > 0.3 || !hookActive) { scene.remove(particle); return; }
        particleMaterial.opacity = 1 - elapsed * 3; particleMaterial.size = 0.3 * (1 - elapsed);
        requestAnimationFrame(animateParticle);
    }
    animateParticle();
}

// --- Loop de Animação --- 
function animate() {
    if (!gameStarted) return;
    requestAnimationFrame(animate);
    if (gamePaused) return;
    const delta = Math.min(clock.getDelta(), 0.05);
    updateMovingPlatforms(delta);
    updatePlayerMovement(delta);
    handleCollisions(delta);
    updateCamera(delta); // Atualiza a câmera ANTES de atualizar a mira
    updateHook(delta);
    updateVisualEffects(delta);
    updateAimIndicatorVisuals(); // Atualiza a mira DEPOIS da câmera
    renderer.render(scene, camera);
}

// --- Atualização de Plataformas Móveis --- 
function updateMovingPlatforms(delta) {
    platforms.forEach((platform, index) => {
        if (platform.userData.isMoving) {
            const speed = platform.userData.moveSpeed; const range = platform.userData.moveRange; const axis = platform.userData.moveAxis; const initialPos = platform.userData.initialPos;
            const oldPos = platform.position.clone();
            platform.position[axis] = initialPos[axis] + Math.sin(clock.elapsedTime * speed / 2) * range / 2;
            platformColliders[index].setFromObject(platform);
            platform.userData.velocity = platform.position.clone().sub(oldPos).divideScalar(delta);
        } else { platform.userData.velocity = new THREE.Vector3(); }
    });
}

// --- Atualização do Movimento do Jogador (Refinado) --- 
function updatePlayerMovement(delta) {
    const targetVelocity = new THREE.Vector3();
    const keyConfig = window.gameKeyConfig || {};
    
    // Usar a direção da câmera (apenas horizontal) para o movimento
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();
    const rightDirection = new THREE.Vector3().crossVectors(camera.up, cameraDirection).normalize();

    if (!hookActive) {
        let horizontalInput = false; const moveInput = new THREE.Vector3();
        if (keys[keyConfig.forward?.key || 'w'] || keys['arrowup']) { moveInput.add(cameraDirection); horizontalInput = true; }
        if (keys[keyConfig.backward?.key || 's'] || keys['arrowdown']) { moveInput.sub(cameraDirection); horizontalInput = true; }
        if (keys[keyConfig.left?.key || 'a'] || keys['arrowleft']) { moveInput.add(rightDirection.clone().negate()); horizontalInput = true; } // Corrigido para esquerda
        if (keys[keyConfig.right?.key || 'd'] || keys['arrowright']) { moveInput.add(rightDirection); horizontalInput = true; } // Corrigido para direita
        
        if (isTouching) { 
            // Movimento mobile relativo à câmera
            moveInput.add(cameraDirection.clone().multiplyScalar(-touchMoveY * 50)); 
            moveInput.add(rightDirection.clone().multiplyScalar(touchMoveX * 50)); 
            horizontalInput = Math.abs(touchMoveX) > 0.001 || Math.abs(touchMoveY) > 0.001; 
        }
        
        if (horizontalInput) { moveInput.normalize(); targetVelocity.add(moveInput.multiplyScalar(moveSpeed)); }
    }

    playerVelocity.y += gravity * delta;

    if (!hookActive) {
        const currentHorizontalVelocity = new THREE.Vector3(playerVelocity.x, 0, playerVelocity.z);
        const targetHorizontalVelocity = new THREE.Vector3(targetVelocity.x, 0, targetVelocity.z);
        const velocityDifference = targetHorizontalVelocity.clone().sub(currentHorizontalVelocity);
        if (velocityDifference.length() > 0.001) {
            const accelerationFactor = targetHorizontalVelocity.length() > 0.001 ? acceleration : deceleration;
            const step = velocityDifference.normalize().multiplyScalar(accelerationFactor * delta);
            if (step.length() > velocityDifference.length()) { playerVelocity.x = targetVelocity.x; playerVelocity.z = targetVelocity.z; }
            else { playerVelocity.x += step.x; playerVelocity.z += step.z; }
        }
    }

    player.position.x += playerVelocity.x * delta;
    player.position.y += playerVelocity.y * delta;
    player.position.z += playerVelocity.z * delta;
    updatePlayerCollider();
    if (player.position.y < -30) { player.position.set(0, 5, 0); playerVelocity.set(0, 0, 0); if (hookActive) deactivateHook(); }
}

// --- Atualizar colisor do jogador ---
function updatePlayerCollider() {
    const size = new THREE.Vector3();
    playerCollider.getSize(size);
    playerCollider.setFromCenterAndSize(player.position, size);
}

// --- Detecção e Resolução de Colisões (Melhorada) ---
function handleCollisions(delta) {
    onGround = false; lastPlatform = null;
    platformColliders.forEach((platformBox, index) => {
        if (playerCollider.intersectsBox(platformBox)) {
            const platform = platforms[index]; const platformVelocity = platform.userData.velocity || new THREE.Vector3();
            const playerMin = playerCollider.min; const playerMax = playerCollider.max; const platformMin = platformBox.min; const platformMax = platformBox.max;
            const overlapX = Math.min(playerMax.x - platformMin.x, platformMax.x - playerMin.x);
            const overlapY = Math.min(playerMax.y - platformMin.y, platformMax.y - playerMin.y);
            const overlapZ = Math.min(playerMax.z - platformMin.z, platformMax.z - playerMin.z);
            if (overlapY < overlapX && overlapY < overlapZ) {
                if (player.position.y > (platformMin.y + platformMax.y) / 2) {
                    player.position.y = platformMax.y + (playerMax.y - player.position.y) + 0.01;
                    if (playerVelocity.y < 0) { onGround = true; lastPlatform = platform; playerVelocity.x += platformVelocity.x; playerVelocity.z += platformVelocity.z; }
                    playerVelocity.y = 0;
                } else {
                    player.position.y = platformMin.y - (player.position.y - playerMin.y) - 0.01;
                    if (playerVelocity.y > 0) playerVelocity.y = 0;
                }
            } else if (overlapX < overlapZ) {
                if (player.position.x < (platformMin.x + platformMax.x) / 2) player.position.x = platformMin.x - (playerMax.x - player.position.x) - 0.01;
                else player.position.x = platformMax.x + (player.position.x - playerMin.x) + 0.01;
                playerVelocity.x = 0;
            } else {
                if (player.position.z < (platformMin.z + platformMax.z) / 2) player.position.z = platformMin.z - (playerMax.z - player.position.z) - 0.01;
                else player.position.z = platformMax.z + (player.position.z - playerMin.z) + 0.01;
                playerVelocity.z = 0;
            }
            updatePlayerCollider();
        }
    });
    if (onGround) { playerVelocity.x *= 0.9; playerVelocity.z *= 0.9; if (Math.abs(playerVelocity.x) < 0.01) playerVelocity.x = 0; if (Math.abs(playerVelocity.z) < 0.01) playerVelocity.z = 0; }
}

// --- Atualização da Câmera (com controle de mouse) ---
function updateCamera(delta) {
    if (!player) return;

    const cameraTargetPosition = player.position.clone().add(new THREE.Vector3(0, 1.2, 0)); // Ponto que a câmera olha
    const cameraDistance = 7.5; // Distância da câmera ao jogador

    // Calcular posição da câmera com base nos ângulos yaw e pitch
    const cameraOffset = new THREE.Vector3();
    cameraOffset.x = cameraDistance * Math.sin(cameraYaw) * Math.cos(cameraPitch);
    cameraOffset.y = cameraDistance * Math.sin(cameraPitch);
    cameraOffset.z = cameraDistance * Math.cos(cameraYaw) * Math.cos(cameraPitch);

    let desiredCameraPosition = cameraTargetPosition.clone().add(cameraOffset);

    // Verificar colisões da câmera com plataformas (Raycasting da posição do jogador para a câmera)
    const cameraRayOrigin = player.position.clone().add(new THREE.Vector3(0, 0.5, 0));
    const cameraRayDirection = desiredCameraPosition.clone().sub(cameraRayOrigin).normalize();
    const cameraRaycaster = new THREE.Raycaster(cameraRayOrigin, cameraRayDirection, 0, cameraDistance);
    const cameraIntersects = cameraRaycaster.intersectObjects(platforms, false);

    let actualCameraDistance = cameraDistance;
    if (cameraIntersects.length > 0) {
        // Se houver colisão, aproximar a câmera
        actualCameraDistance = Math.max(1.0, cameraIntersects[0].distance * 0.9); // Mínimo de 1.0 para não entrar no jogador
    }

    // Calcular posição final da câmera com distância ajustada
    const finalCameraOffset = cameraOffset.normalize().multiplyScalar(actualCameraDistance);
    const finalCameraPosition = cameraTargetPosition.clone().add(finalCameraOffset);

    // Suavizar movimento da câmera
    camera.position.lerp(finalCameraPosition, 15 * delta); // Lerp mais rápido para responsividade

    // Fazer a câmera olhar para o ponto alvo
    camera.lookAt(cameraTargetPosition);
}

// --- Atualizar Efeitos Visuais ---
function updateVisualEffects(delta) {
    scene.children.forEach(child => { if (child.userData.rotationSpeed) { child.rotation.x += child.userData.rotationSpeed.x * delta; child.rotation.y += child.userData.rotationSpeed.y * delta; child.rotation.z += child.userData.rotationSpeed.z * delta; } });
    if (particleSystem) particleSystem.rotation.y += delta * 0.05;
    scene.traverse(object => { if (object.material && object.material.uniforms && object.material.uniforms.viewVector) object.material.uniforms.viewVector.value = camera.position; });
    if (!hookActive && (Math.abs(playerVelocity.x) > 1 || Math.abs(playerVelocity.z) > 1) && onGround) { if (Math.random() > 0.8) createMovementTrail(); }
}

// --- Criar rastro de movimento ---
function createMovementTrail() {
    const trailGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(3); positions[0] = player.position.x; positions[1] = player.position.y + 0.1; positions[2] = player.position.z;
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const trailMaterial = new THREE.PointsMaterial({ color: COLORS.PLAYER_SHOES, size: 0.3, transparent: true, opacity: 0.7 });
    const trail = new THREE.Points(trailGeometry, trailMaterial);
    scene.add(trail);
    const startTime = clock.elapsedTime;
    function animateTrail() {
        if (!gameStarted) return;
        const elapsed = clock.elapsedTime - startTime;
        if (elapsed > 0.5) { scene.remove(trail); return; }
        trailMaterial.opacity = 0.7 * (1 - elapsed * 2); trailMaterial.size = 0.3 * (1 - elapsed);
        requestAnimationFrame(animateTrail);
    }
    animateTrail();
}

// --- Redimensionamento da Janela ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Iniciar o Jogo ---
init();

