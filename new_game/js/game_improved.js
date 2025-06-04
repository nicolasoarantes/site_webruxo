import * as THREE from 'three';
import { OBJLoader } from 'https://unpkg.com/three@0.163.0/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'https://unpkg.com/three@0.163.0/examples/jsm/loaders/MTLLoader.js';

console.log("Jogo Wander Webruxo - Script Carregado v2.0 - Modelo 3D Eggonaldo, Responsividade Melhorada");

// Seletores DOM
const gameContainer = document.getElementById('game-container');
const loadingScreen = document.getElementById('loading-screen');
const mobileControls = document.getElementById('mobile-controls');
const jumpButton = document.getElementById('jump-button');
const hookButton = document.getElementById('hook-button');
const instructionScreen = document.getElementById('instruction-screen');
const startGameButton = document.getElementById('start-game-button');
const pauseButton = document.getElementById('pause-button');
const pauseMenu = document.getElementById('pause-menu');
const resumeButton = document.getElementById('resume-button');
const controlsButton = document.getElementById('controls-button');
const restartButton = document.getElementById('restart-button');
const exitButton = document.getElementById('exit-button');
const backToSiteButton = document.getElementById('back-to-site-button');
const configScreen = document.getElementById('config-screen');
const saveConfigButton = document.getElementById('save-config-button');
const backButton = document.getElementById('back-button');
const configButton = document.getElementById('config-button');

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
    AIM_INDICATOR_MISS: 0xFF6B35,
    HOOK_RANGE_INDICATOR: 0x00FFFF,
    ANIMAL_BODY: 0x90EE90, // Verde claro
    ANIMAL_ACCENT: 0x8A2BE2, // Roxo azulado
    UI_BUTTON_BG: 'rgba(106, 27, 154, 0.8)',
    UI_BUTTON_HOVER_BG: 'rgba(255, 0, 255, 0.9)',
    UI_TEXT: '#FFFFFF',
    UI_BORDER: '#00FFFF'
};

// Variáveis Globais do Jogo
let scene, camera, renderer, player, playerModel, clock;
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
let animationFrameId = null;
let gameOver = false;
let gameOverScreen = null;

// Variáveis do Pulo Duplo
let canDoubleJump = false;
let hasDoubleJumped = false;

// Variáveis do Gancho Mágico (Refinadas)
let hookActive = false;
let hookTarget = null;
let hookLine = null;
const hookMaxDistance = 40;
const hookPullAcceleration = 60;
const hookMaxPullSpeed = 30;
const hookMinDistance = 1.5;
let raycaster = new THREE.Raycaster();
let potentialHookTarget = null;
let hookCooldown = 0;
const hookCooldownTime = 0.2;
let hookRangeIndicator = null;

// Variáveis de Controle de Toque
let touchStartX = 0, touchStartY = 0, touchCurrentX = 0, touchCurrentY = 0;
let isTouching = false;
let touchMoveX = 0, touchMoveY = 0;
const touchSensitivity = 0.02;

// Variáveis para efeitos visuais
let backgroundGrid, particleSystem, glowMaterial;

// Variáveis de Controle de Câmera com Mouse (Corrigido)
let cameraYaw = 0;
let cameraPitch = 0.3;
const mouseSensitivity = 0.002;
const minPitch = -Math.PI / 2 + 0.1;
const maxPitch = Math.PI / 2 - 0.1;
let aimIndicator = null;
let aimIndicatorLine = null;
let aimIndicatorPoint = null;

// Variáveis dos Animais
let animals = [];
let animalColliders = [];

// --- Inicialização --- 
function init() {
    console.log("Inicializando o jogo v2.0...");

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
    loadPlayerModel();
    createPlatforms();
    createAnimals();
    createParticleSystem();
    createAimIndicator();
    createHookRangeIndicator();
    createGameOverScreen();
    setupControls();
    setupMenuButtons();

    window.addEventListener('resize', onWindowResize);

    loadingScreen.style.display = 'none';
    instructionScreen.style.display = 'flex';
    console.log("Jogo inicializado v2.0. Aguardando início.");
}

// --- Função para iniciar o jogo (Corrigida) ---
function startGame() {
    console.log("Iniciando o jogo...");
    if (gameStarted) return;

    instructionScreen.style.display = 'none';
    configScreen.style.display = 'none';
    pauseMenu.style.display = 'none';
    pauseButton.style.display = 'flex';
    gameOverScreen.visible = false;

    gameStarted = true;
    gamePaused = false;
    gameOver = false;
    clock.start();

    player.position.set(0, 5, 0);
    playerVelocity.set(0, 0, 0);
    onGround = false;
    canDoubleJump = false;
    hasDoubleJumped = false;
    if (hookActive) deactivateHook();
    cameraYaw = 0;
    cameraPitch = 0.3;

    setTimeout(() => {
        if (!isMobile && !document.pointerLockElement) {
            renderer.domElement.requestPointerLock();
        }
    }, 100);

    if (animationFrameId === null) {
        animate();
    }
}

// --- Função para pausar/despausar (Corrigida) ---
function togglePause(pauseState) {
    if (!gameStarted || gameOver) return;
    gamePaused = pauseState;
    pauseMenu.style.display = gamePaused ? 'flex' : 'none';
    pauseButton.innerHTML = gamePaused ? '▶' : 'II';

    if (gamePaused) {
        clock.stop();
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    } else {
        clock.start();
        if (!isMobile) {
            renderer.domElement.requestPointerLock();
        }
        if (animationFrameId === null) {
            animate();
        }
    }
}

// --- Configuração dos Botões do Menu (Novo) ---
function setupMenuButtons() {
    startGameButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', () => togglePause(!gamePaused));
    resumeButton.addEventListener('click', () => togglePause(false));
    controlsButton.addEventListener('click', () => {
        pauseMenu.style.display = 'none';
        configScreen.style.display = 'flex';
    });
    restartButton.addEventListener('click', () => {
        togglePause(false);
        startGame();
    });
    exitButton.addEventListener('click', () => {
        gameStarted = false;
        gamePaused = true;
        gameOver = false;
        if (document.pointerLockElement) document.exitPointerLock();
        instructionScreen.style.display = 'flex';
        pauseMenu.style.display = 'none';
        pauseButton.style.display = 'none';
        gameOverScreen.visible = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    });
    backToSiteButton.addEventListener('click', () => {
        if (window.parent && window.parent.location !== window.location) {
            window.parent.location.href = '../index.html';
        } else {
            window.location.href = '../index.html';
        }
    });
    configButton.addEventListener('click', () => {
        instructionScreen.style.display = 'none';
        configScreen.style.display = 'flex';
    });
    saveConfigButton.addEventListener('click', () => {
        configScreen.style.display = 'none';
        if (!gameStarted) {
            instructionScreen.style.display = 'flex';
        } else {
            togglePause(false);
        }
    });
    backButton.addEventListener('click', () => {
        configScreen.style.display = 'none';
        if (!gameStarted) {
            instructionScreen.style.display = 'flex';
        } else {
            pauseMenu.style.display = 'flex';
        }
    });
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

// --- Carregamento do Modelo 3D do Eggonaldo ---
function loadPlayerModel() {
    const playerGroup = new THREE.Group();
    scene.add(playerGroup);
    player = playerGroup;
    player.position.set(0, 5, 0);

    // Criar um modelo temporário enquanto carrega
    createTempPlayerModel();

    // Carregar o modelo 3D
    const mtlLoader = new MTLLoader();
    mtlLoader.load('assets/models/eggonaldo/Witchy_Egg_0526231003_texture.mtl', (materials) => {
        materials.preload();
        
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load('assets/models/eggonaldo/Witchy_Egg_0526231003_texture.obj', (object) => {
            console.log("Modelo 3D do Eggonaldo carregado com sucesso!");
            
            // Ajustar escala e posição
            object.scale.set(0.5, 0.5, 0.5);
            object.position.y = -0.5; // Ajuste para o centro do grupo
            
            // Remover o modelo temporário
            if (playerModel) {
                player.remove(playerModel);
            }
            
            // Adicionar o novo modelo
            playerModel = object;
            player.add(playerModel);
            
            // Atualizar o colisor
            updatePlayerCollider();
        }, 
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% carregado');
        },
        (error) => {
            console.error('Erro ao carregar o modelo:', error);
            // Manter o modelo temporário em caso de erro
        });
    });
}

// --- Criar modelo temporário enquanto carrega o 3D ---
function createTempPlayerModel() {
    const bodyRadius = 0.5, bodyHeight = 1.0, hatHeight = 0.8, shoeSize = 0.3;
    
    const bodyGeometry = new THREE.CapsuleGeometry(bodyRadius, bodyHeight, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: COLORS.PLAYER_BODY, roughness: 0.4, metalness: 0.6, emissive: COLORS.PLAYER_BODY, emissiveIntensity: 0.2 });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.y = bodyHeight / 2 + shoeSize;
    
    const hatGeometry = new THREE.ConeGeometry(bodyRadius * 1.2, hatHeight, 12);
    const hatMaterial = new THREE.MeshStandardMaterial({ color: COLORS.PLAYER_HAT, roughness: 0.3, metalness: 0.7, emissive: COLORS.PLAYER_HAT, emissiveIntensity: 0.3 });
    const hatMesh = new THREE.Mesh(hatGeometry, hatMaterial);
    hatMesh.position.y = bodyMesh.position.y + bodyHeight / 2 + hatHeight / 2 - 0.1;
    hatMesh.rotation.z = Math.PI * 0.05;
    
    const tempModel = new THREE.Group();
    tempModel.add(bodyMesh);
    tempModel.add(hatMesh);
    
    playerModel = tempModel;
    player.add(playerModel);
    
    updatePlayerCollider();
}

// --- Atualizar o colisor do jogador ---
function updatePlayerCollider() {
    const totalHeight = 2.3; // Altura total aproximada do modelo
    const bodyRadius = 0.9; // Raio aproximado do modelo
    
    playerCollider = new THREE.Box3();
    const colliderSize = new THREE.Vector3(bodyRadius, totalHeight, bodyRadius);
    playerCollider.setFromCenterAndSize(player.position, colliderSize);
}

// --- Criação de Plataformas (Mais Plataformas) ---
function createPlatforms() {
    const platformMaterialBase = createGridMaterial(COLORS.PLATFORM_BASE, 0.2);
    const platformMaterialAccent = createGridMaterial(COLORS.PLATFORM_ACCENT, 0.3);
    const platformMaterialSpecial = createGridMaterial(COLORS.PLATFORM_SPECIAL, 0.4);

    const platformData = [
        // Plataforma inicial maior
        { geo: new THREE.BoxGeometry(40, 1.5, 40), pos: new THREE.Vector3(0, -0.75, 0), mat: platformMaterialBase },
        // Plataformas fixas
        { geo: new THREE.BoxGeometry(6, 1, 6), pos: new THREE.Vector3(12, 2.5, -7), mat: platformMaterialAccent },
        { geo: new THREE.BoxGeometry(4, 1, 10), pos: new THREE.Vector3(-10, 4.5, -12), mat: platformMaterialBase },
        { geo: new THREE.CylinderGeometry(3, 3, 1, 16), pos: new THREE.Vector3(0, 6.5, -18), mat: platformMaterialAccent },
        { geo: new THREE.BoxGeometry(8, 1, 3), pos: new THREE.Vector3(15, 8.5, -22), mat: platformMaterialBase },
        { geo: new THREE.BoxGeometry(3, 1, 8), pos: new THREE.Vector3(5, 10.5, -30), mat: platformMaterialAccent },
        { geo: new THREE.CylinderGeometry(2, 4, 1.2, 8), pos: new THREE.Vector3(-15, 12.5, -35), mat: platformMaterialBase },
        // Plataformas adicionais
        { geo: new THREE.BoxGeometry(5, 1, 5), pos: new THREE.Vector3(25, 7.5, -10), mat: platformMaterialAccent },
        { geo: new THREE.BoxGeometry(4, 1, 4), pos: new THREE.Vector3(-25, 9.5, -25), mat: platformMaterialBase },
        { geo: new THREE.CylinderGeometry(2.5, 2.5, 1, 16), pos: new THREE.Vector3(10, 14.5, -40), mat: platformMaterialAccent },
        // Plataformas móveis
        { geo: new THREE.BoxGeometry(5, 0.8, 2), pos: new THREE.Vector3(-5, 8, -25), mat: platformMaterialSpecial, moving: { axis: 'x', range: 12, speed: 2.5 } },
        { geo: new THREE.BoxGeometry(4, 0.8, 4), pos: new THREE.Vector3(20, 5, -15), mat: platformMaterialSpecial, moving: { axis: 'y', range: 6, speed: 1.5 } },
        { geo: new THREE.BoxGeometry(7, 1, 2), pos: new THREE.Vector3(-20, 10, -20), mat: platformMaterialSpecial, moving: { axis: 'z', range: 15, speed: 2.0 } },
        { geo: new THREE.BoxGeometry(6, 0.8, 3), pos: new THREE.Vector3(15, 12, -35), mat: platformMaterialSpecial, moving: { axis: 'x', range: 10, speed: 3.0 } }
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
    context.strokeStyle = '#' + new THREE.Color(color).getHexString();
    context.lineWidth = lineWidth;
    context.beginPath();
    for (let i = 0; i <= gridSize; i += gridSpacing) {
        context.moveTo(0, i); context.lineTo(gridSize, i);
        context.moveTo(i, 0); context.lineTo(i, gridSize);
    }
    context.stroke();
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.5,
        metalness: 0.7,
        map: texture,
        emissive: color,
        emissiveIntensity: emissiveIntensity
    });
}

// --- Criar brilho para plataformas ---
function createPlatformGlow(geometry, position) {
    let glowGeo;
    if (geometry instanceof THREE.BoxGeometry) {
        const size = new THREE.Vector3();
        const box = new THREE.Box3().setFromObject(new THREE.Mesh(geometry));
        box.getSize(size);
        glowGeo = new THREE.BoxGeometry(size.x * 1.05, size.y * 1.05, size.z * 1.05);
    } else if (geometry instanceof THREE.CylinderGeometry) {
        const radiusTop = geometry.parameters.radiusTop * 1.05;
        const radiusBottom = geometry.parameters.radiusBottom * 1.05;
        const height = geometry.parameters.height * 1.05;
        const radialSegments = geometry.parameters.radialSegments;
        glowGeo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
    }
    const glow = new THREE.Mesh(glowGeo, glowMaterial.clone());
    return glow;
}

// --- Criar elementos de fundo ---
function createBackgroundElements() {
    const gridSize = 200, gridDivisions = 20;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x00FFFF, 0x6A1B9A);
    gridHelper.position.y = -1;
    scene.add(gridHelper);

    const gridMaterial = new THREE.LineBasicMaterial({ color: 0x00FFFF, transparent: true, opacity: 0.2 });
    const gridGeometry = new THREE.BufferGeometry();
    const gridVertices = [];
    const gridStep = gridSize / gridDivisions;
    const halfSize = gridSize / 2;
    for (let i = 0; i <= gridDivisions; i++) {
        const x = -halfSize + i * gridStep;
        gridVertices.push(x, 0, -halfSize, x, 0, halfSize);
        gridVertices.push(-halfSize, 0, x, halfSize, 0, x);
    }
    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridVertices, 3));
    backgroundGrid = new THREE.LineSegments(gridGeometry, gridMaterial);
    backgroundGrid.position.y = -0.99;
    scene.add(backgroundGrid);
}

// --- Criar sistema de partículas ---
function createParticleSystem() {
    const particleCount = 500;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    const particleColors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        particlePositions[i3] = (Math.random() - 0.5) * 100;
        particlePositions[i3 + 1] = Math.random() * 50;
        particlePositions[i3 + 2] = (Math.random() - 0.5) * 100;
        
        particleSizes[i] = Math.random() * 0.5 + 0.1;
        
        // Cores variando entre roxo e ciano
        const color = new THREE.Color();
        color.setHSL(Math.random() * 0.2 + 0.7, 1, 0.5 + Math.random() * 0.5);
        particleColors[i3] = color.r;
        particleColors[i3 + 1] = color.g;
        particleColors[i3 + 2] = color.b;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
}

// --- Criar indicador de mira ---
function createAimIndicator() {
    const aimGeo = new THREE.RingGeometry(0.02, 0.04, 32);
    const aimMat = new THREE.MeshBasicMaterial({ color: COLORS.AIM_INDICATOR, transparent: true, opacity: 0.8 });
    aimIndicator = new THREE.Mesh(aimGeo, aimMat);
    aimIndicator.position.set(0, 0, -0.5);
    camera.add(aimIndicator);
    scene.add(camera);
    
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -hookMaxDistance], 3));
    const lineMat = new THREE.LineBasicMaterial({ color: COLORS.AIM_INDICATOR, transparent: true, opacity: 0.5 });
    aimIndicatorLine = new THREE.Line(lineGeo, lineMat);
    aimIndicatorLine.visible = false;
    scene.add(aimIndicatorLine);
    
    const pointGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const pointMat = new THREE.MeshBasicMaterial({ color: COLORS.AIM_INDICATOR_MISS });
    aimIndicatorPoint = new THREE.Mesh(pointGeo, pointMat);
    aimIndicatorPoint.visible = false;
    scene.add(aimIndicatorPoint);
}

// --- Criar indicador de alcance do gancho ---
function createHookRangeIndicator() {
    const rangeGeo = new THREE.RingGeometry(hookMaxDistance - 0.2, hookMaxDistance, 64);
    const rangeMat = new THREE.MeshBasicMaterial({ 
        color: COLORS.HOOK_RANGE_INDICATOR, 
        transparent: true, 
        opacity: 0.15,
        side: THREE.DoubleSide
    });
    hookRangeIndicator = new THREE.Mesh(rangeGeo, rangeMat);
    hookRangeIndicator.rotation.x = Math.PI / 2;
    hookRangeIndicator.visible = false;
    scene.add(hookRangeIndicator);
}

// --- Criar tela de Game Over ---
function createGameOverScreen() {
    // Criar um grupo para a tela de game over
    gameOverScreen = new THREE.Group();
    gameOverScreen.visible = false;
    scene.add(gameOverScreen);
    
    // Fundo semi-transparente
    const bgGeometry = new THREE.PlaneGeometry(5, 3);
    const bgMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    gameOverScreen.add(background);
    
    // Texto "Game Over"
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'bold 72px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#FF00FF';
    context.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
    context.font = '36px Arial';
    context.fillStyle = '#00FFFF';
    context.fillText('Pressione R para reiniciar', canvas.width / 2, canvas.height / 2 + 50);
    
    const texture = new THREE.CanvasTexture(canvas);
    const textGeometry = new THREE.PlaneGeometry(4, 2);
    const textMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.z = 0.1;
    gameOverScreen.add(textMesh);
    
    // Adicionar brilho ao redor
    const glowGeometry = new THREE.PlaneGeometry(5.2, 3.2);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF00FF,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.z = -0.1;
    gameOverScreen.add(glow);
}

// --- Criar animais ---
function createAnimals() {
    const animalData = [
        { pos: new THREE.Vector3(8, 1, -5), scale: 0.8, speed: 0.5, range: 5 },
        { pos: new THREE.Vector3(-7, 5, -15), scale: 0.7, speed: 0.7, range: 4 },
        { pos: new THREE.Vector3(12, 9, -25), scale: 0.9, speed: 0.4, range: 6 }
    ];
    
    animalData.forEach(data => {
        const animal = createAnimal(data.scale);
        animal.position.copy(data.pos);
        animal.userData.initialPos = data.pos.clone();
        animal.userData.speed = data.speed;
        animal.userData.range = data.range;
        animal.userData.time = Math.random() * Math.PI * 2;
        scene.add(animal);
        animals.push(animal);
        
        const animalBox = new THREE.Box3().setFromObject(animal);
        animalColliders.push(animalBox);
    });
}

// --- Criar um animal ---
function createAnimal(scale = 1) {
    const animalGroup = new THREE.Group();
    
    // Corpo
    const bodyGeo = new THREE.SphereGeometry(0.7 * scale, 16, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ 
        color: COLORS.ANIMAL_BODY, 
        roughness: 0.5, 
        metalness: 0.3,
        emissive: COLORS.ANIMAL_BODY,
        emissiveIntensity: 0.2
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    animalGroup.add(body);
    
    // Olhos
    const eyeGeo = new THREE.SphereGeometry(0.15 * scale, 12, 12);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.3 * scale, 0.2 * scale, 0.5 * scale);
    eyeR.position.set(0.3 * scale, 0.2 * scale, 0.5 * scale);
    animalGroup.add(eyeL);
    animalGroup.add(eyeR);
    
    // Pupilas
    const pupilGeo = new THREE.SphereGeometry(0.07 * scale, 8, 8);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const pupilL = new THREE.Mesh(pupilGeo, pupilMat);
    const pupilR = new THREE.Mesh(pupilGeo, pupilMat);
    pupilL.position.set(0, 0, 0.08 * scale);
    pupilR.position.set(0, 0, 0.08 * scale);
    eyeL.add(pupilL);
    eyeR.add(pupilR);
    
    // Orelhas
    const earGeo = new THREE.ConeGeometry(0.2 * scale, 0.5 * scale, 8);
    const earMat = new THREE.MeshStandardMaterial({ 
        color: COLORS.ANIMAL_ACCENT, 
        roughness: 0.5, 
        metalness: 0.3,
        emissive: COLORS.ANIMAL_ACCENT,
        emissiveIntensity: 0.2
    });
    const earL = new THREE.Mesh(earGeo, earMat);
    const earR = new THREE.Mesh(earGeo, earMat);
    earL.position.set(-0.4 * scale, 0.6 * scale, 0);
    earR.position.set(0.4 * scale, 0.6 * scale, 0);
    earL.rotation.x = -Math.PI / 6;
    earR.rotation.x = -Math.PI / 6;
    earL.rotation.z = -Math.PI / 6;
    earR.rotation.z = Math.PI / 6;
    animalGroup.add(earL);
    animalGroup.add(earR);
    
    return animalGroup;
}

// --- Configuração de Controles ---
function setupControls() {
    // Controles de teclado
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        
        // Tecla R para reiniciar quando game over
        if (e.code === 'KeyR' && gameOver) {
            startGame();
        }
        
        // Tecla ESC para pausar/despausar
        if (e.code === 'Escape' && gameStarted && !gameOver) {
            togglePause(!gamePaused);
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });
    
    // Controles de mouse
    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement && gameStarted && !gamePaused && !gameOver) {
            cameraYaw -= e.movementX * mouseSensitivity;
            cameraPitch -= e.movementY * mouseSensitivity;
            cameraPitch = Math.max(minPitch, Math.min(maxPitch, cameraPitch));
        }
    });
    
    document.addEventListener('mousedown', (e) => {
        if (e.button === 0 && gameStarted && !gamePaused && !gameOver) {
            activateHook();
        }
    });
    
    // Controles de toque para dispositivos móveis
    if (isMobile) {
        renderer.domElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchCurrentX = touchStartX;
            touchCurrentY = touchStartY;
            isTouching = true;
        });
        
        renderer.domElement.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!isTouching) return;
            
            const touch = e.touches[0];
            touchCurrentX = touch.clientX;
            touchCurrentY = touch.clientY;
            
            touchMoveX = (touchCurrentX - touchStartX) * touchSensitivity;
            touchMoveY = (touchCurrentY - touchStartY) * touchSensitivity;
            
            cameraYaw -= touchMoveX;
            cameraPitch -= touchMoveY;
            cameraPitch = Math.max(minPitch, Math.min(maxPitch, cameraPitch));
            
            touchStartX = touchCurrentX;
            touchStartY = touchCurrentY;
        });
        
        renderer.domElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            isTouching = false;
            touchMoveX = 0;
            touchMoveY = 0;
        });
        
        jumpButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameStarted && !gamePaused && !gameOver) {
                jump();
            }
        });
        
        hookButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameStarted && !gamePaused && !gameOver) {
                activateHook();
            }
        });
    }
    
    // Ajuste de tamanho da janela
    window.addEventListener('resize', onWindowResize);
}

// --- Ajuste de tamanho da janela ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Função de pulo ---
function jump() {
    if (onGround) {
        playerVelocity.y = jumpForce;
        onGround = false;
        canDoubleJump = true;
    } else if (canDoubleJump && !hasDoubleJumped) {
        playerVelocity.y = jumpForce * 0.8;
        hasDoubleJumped = true;
        canDoubleJump = false;
        
        // Efeito visual de pulo duplo
        const jumpEffect = createJumpEffect();
        jumpEffect.position.copy(player.position);
        scene.add(jumpEffect);
        setTimeout(() => scene.remove(jumpEffect), 500);
    }
}

// --- Criar efeito visual de pulo duplo ---
function createJumpEffect() {
    const effectGroup = new THREE.Group();
    
    const ringGeo = new THREE.RingGeometry(0.5, 0.7, 32);
    const ringMat = new THREE.MeshBasicMaterial({ 
        color: COLORS.PLAYER_BODY, 
        transparent: true, 
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    
    for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(ringGeo, ringMat.clone());
        ring.rotation.x = Math.PI / 2;
        ring.scale.set(1, 1, 1);
        effectGroup.add(ring);
        
        // Animação de expansão e desaparecimento
        const initialScale = 1;
        const targetScale = 2 + i;
        const initialOpacity = 0.7;
        const duration = 500;
        const delay = i * 100;
        
        setTimeout(() => {
            const startTime = Date.now();
            
            function animate() {
                const elapsedTime = Date.now() - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                
                const currentScale = initialScale + (targetScale - initialScale) * progress;
                ring.scale.set(currentScale, currentScale, currentScale);
                
                ring.material.opacity = initialOpacity * (1 - progress);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            }
            
            animate();
        }, delay);
    }
    
    return effectGroup;
}

// --- Ativar gancho mágico ---
function activateHook() {
    if (hookActive || hookCooldown > 0) return;
    
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    
    raycaster.set(player.position, direction);
    
    const intersects = raycaster.intersectObjects(platforms);
    
    if (intersects.length > 0 && intersects[0].distance <= hookMaxDistance) {
        hookTarget = intersects[0].point.clone();
        
        // Criar linha do gancho
        const lineGeometry = new THREE.BufferGeometry();
        const lineMaterial = new THREE.LineBasicMaterial({ color: COLORS.HOOK_LINE, linewidth: 3 });
        hookLine = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(hookLine);
        
        // Efeito visual no ponto de ancoragem
        const anchorEffect = createAnchorEffect();
        anchorEffect.position.copy(hookTarget);
        scene.add(anchorEffect);
        setTimeout(() => scene.remove(anchorEffect), 1000);
        
        hookActive = true;
    } else {
        // Feedback visual de falha
        const missEffect = createMissEffect();
        scene.add(missEffect);
        setTimeout(() => scene.remove(missEffect), 300);
        
        hookCooldown = hookCooldownTime;
    }
}

// --- Criar efeito visual de ancoragem ---
function createAnchorEffect() {
    const effectGroup = new THREE.Group();
    
    // Círculo de impacto
    const circleGeo = new THREE.RingGeometry(0, 1, 32);
    const circleMat = new THREE.MeshBasicMaterial({ 
        color: COLORS.HOOK_LINE, 
        transparent: true, 
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    const circle = new THREE.Mesh(circleGeo, circleMat);
    
    // Orientar para a câmera
    circle.lookAt(camera.position);
    effectGroup.add(circle);
    
    // Animação de expansão e desaparecimento
    const startTime = Date.now();
    const duration = 500;
    
    function animate() {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        circle.scale.set(progress * 2, progress * 2, progress * 2);
        circle.material.opacity = 0.8 * (1 - progress);
        
        if (progress < 1 && effectGroup.parent) {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
    
    return effectGroup;
}

// --- Criar efeito visual de falha do gancho ---
function createMissEffect() {
    const effectGroup = new THREE.Group();
    
    // Texto "Fora de alcance"
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    context.fillStyle = 'rgba(0,0,0,0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'bold 32px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#FF6B35';
    context.fillText('Fora de alcance!', canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const textGeo = new THREE.PlaneGeometry(2, 0.5);
    const textMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
    });
    const textMesh = new THREE.Mesh(textGeo, textMat);
    
    // Posicionar na frente da câmera
    textMesh.position.set(0, 0, -2);
    camera.add(textMesh);
    effectGroup.add(camera);
    
    // Animação de desaparecimento
    const startTime = Date.now();
    const duration = 1000;
    
    function animate() {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        textMesh.position.y = 0.5 * progress;
        textMat.opacity = 0.9 * (1 - progress);
        
        if (progress < 1 && textMesh.parent) {
            requestAnimationFrame(animate);
        } else if (progress >= 1 && textMesh.parent) {
            camera.remove(textMesh);
        }
    }
    
    animate();
    
    return effectGroup;
}

// --- Desativar gancho mágico ---
function deactivateHook() {
    if (hookLine) {
        scene.remove(hookLine);
        hookLine = null;
    }
    hookTarget = null;
    hookActive = false;
    hookCooldown = hookCooldownTime;
}

// --- Atualizar linha do gancho ---
function updateHookLine() {
    if (!hookActive || !hookLine) return;
    
    const linePositions = [
        player.position.x, player.position.y + 1, player.position.z,
        hookTarget.x, hookTarget.y, hookTarget.z
    ];
    
    hookLine.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    hookLine.geometry.attributes.position.needsUpdate = true;
}

// --- Atualizar movimento do jogador ---
function updatePlayerMovement(deltaTime) {
    // Aplicar gravidade
    if (!onGround) {
        playerVelocity.y += gravity * deltaTime;
    }
    
    // Movimento baseado na orientação da câmera
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();
    
    const cameraRight = new THREE.Vector3(1, 0, 0);
    cameraRight.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
    
    let moveX = 0, moveZ = 0;
    
    // Controles de teclado
    if (keys['KeyW'] || keys['ArrowUp']) moveZ -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) moveZ += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;
    
    // Normalizar movimento diagonal
    if (moveX !== 0 && moveZ !== 0) {
        const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
        moveX /= length;
        moveZ /= length;
    }
    
    // Calcular direção de movimento
    const moveDirection = new THREE.Vector3();
    moveDirection.addScaledVector(cameraDirection, moveZ);
    moveDirection.addScaledVector(cameraRight, moveX);
    moveDirection.normalize();
    
    // Aplicar aceleração/desaceleração
    if (moveDirection.lengthSq() > 0) {
        playerVelocity.x += moveDirection.x * acceleration * deltaTime;
        playerVelocity.z += moveDirection.z * acceleration * deltaTime;
    } else {
        // Desaceleração
        const horizontalVelocity = new THREE.Vector2(playerVelocity.x, playerVelocity.z);
        const currentSpeed = horizontalVelocity.length();
        
        if (currentSpeed > 0) {
            const drop = deceleration * deltaTime;
            playerVelocity.x *= Math.max(0, 1 - drop / currentSpeed);
            playerVelocity.z *= Math.max(0, 1 - drop / currentSpeed);
        }
    }
    
    // Limitar velocidade horizontal
    const horizontalVelocity = new THREE.Vector2(playerVelocity.x, playerVelocity.z);
    if (horizontalVelocity.length() > moveSpeed) {
        horizontalVelocity.normalize();
        horizontalVelocity.multiplyScalar(moveSpeed);
        playerVelocity.x = horizontalVelocity.x;
        playerVelocity.z = horizontalVelocity.y;
    }
    
    // Atualizar posição
    player.position.x += playerVelocity.x * deltaTime;
    player.position.y += playerVelocity.y * deltaTime;
    player.position.z += playerVelocity.z * deltaTime;
    
    // Atualizar colisor do jogador
    updatePlayerCollider();
    
    // Verificar colisões com plataformas
    checkPlatformCollisions();
    
    // Verificar colisões com animais
    checkAnimalCollisions();
    
    // Verificar se caiu do mapa
    if (player.position.y < -20) {
        triggerGameOver();
    }
    
    // Pulo
    if ((keys['Space'] || keys['KeyJ']) && (onGround || (canDoubleJump && !hasDoubleJumped))) {
        jump();
    }
    
    // Ativar gancho
    if ((keys['ShiftLeft'] || keys['KeyF']) && !hookActive && hookCooldown <= 0) {
        activateHook();
    }
    
    // Atualizar cooldown do gancho
    if (hookCooldown > 0) {
        hookCooldown -= deltaTime;
    }
    
    // Atualizar gancho
    if (hookActive) {
        updateHook(deltaTime);
    }
}

// --- Atualizar gancho ---
function updateHook(deltaTime) {
    if (!hookTarget) return;
    
    updateHookLine();
    
    const toTarget = new THREE.Vector3().subVectors(hookTarget, player.position);
    const distance = toTarget.length();
    
    if (distance < hookMinDistance) {
        deactivateHook();
        return;
    }
    
    toTarget.normalize();
    
    // Aplicar força de puxão
    const pullStrength = Math.min(hookPullAcceleration * deltaTime, hookMaxPullSpeed * deltaTime);
    playerVelocity.addScaledVector(toTarget, pullStrength);
    
    // Limitar velocidade máxima do gancho
    const speed = playerVelocity.length();
    if (speed > hookMaxPullSpeed) {
        playerVelocity.multiplyScalar(hookMaxPullSpeed / speed);
    }
}

// --- Verificar colisões com plataformas ---
function checkPlatformCollisions() {
    let isOnPlatform = false;
    let highestPlatformY = -Infinity;
    let currentPlatform = null;
    
    for (let i = 0; i < platformColliders.length; i++) {
        const platform = platforms[i];
        const platformBox = platformColliders[i];
        
        // Atualizar caixa de colisão da plataforma se estiver em movimento
        if (platform.userData.isMoving) {
            platformBox.setFromObject(platform);
            platformBox.min.y += 0.05;
        }
        
        if (playerCollider.intersectsBox(platformBox)) {
            const playerBottom = player.position.y;
            const platformTop = platformBox.max.y;
            
            // Verificar se o jogador está acima da plataforma
            if (playerVelocity.y <= 0 && playerBottom >= platformTop - 0.2) {
                if (platformTop > highestPlatformY) {
                    highestPlatformY = platformTop;
                    currentPlatform = platform;
                    isOnPlatform = true;
                }
            } else {
                // Colisão lateral ou superior
                const playerCenter = new THREE.Vector3();
                playerCollider.getCenter(playerCenter);
                
                const platformCenter = new THREE.Vector3();
                platformBox.getCenter(platformCenter);
                
                const direction = new THREE.Vector3().subVectors(playerCenter, platformCenter).normalize();
                
                // Ajustar posição para evitar sobreposição
                if (Math.abs(direction.y) < 0.5) {
                    const overlap = 0.1;
                    player.position.addScaledVector(direction, overlap);
                    
                    // Zerar componente de velocidade na direção da colisão
                    const dot = playerVelocity.dot(direction);
                    if (dot < 0) {
                        playerVelocity.addScaledVector(direction, -dot);
                    }
                    
                    updatePlayerCollider();
                }
            }
        }
    }
    
    // Atualizar estado de estar no chão
    if (isOnPlatform) {
        player.position.y = highestPlatformY;
        if (playerVelocity.y < 0) playerVelocity.y = 0;
        onGround = true;
        hasDoubleJumped = false;
        
        // Verificar se mudou de plataforma
        if (currentPlatform !== lastPlatform) {
            lastPlatform = currentPlatform;
            
            // Efeito visual ao pousar
            if (playerVelocity.y < -5) {
                const landEffect = createLandEffect();
                landEffect.position.copy(player.position);
                scene.add(landEffect);
                setTimeout(() => scene.remove(landEffect), 500);
            }
        }
        
        // Se a plataforma estiver em movimento, mover o jogador junto
        if (currentPlatform && currentPlatform.userData.isMoving) {
            const axis = currentPlatform.userData.moveAxis;
            const platformVelocity = calculatePlatformVelocity(currentPlatform);
            player.position[axis] += platformVelocity;
            updatePlayerCollider();
        }
    } else {
        onGround = false;
        lastPlatform = null;
    }
}

// --- Calcular velocidade da plataforma ---
function calculatePlatformVelocity(platform) {
    const axis = platform.userData.moveAxis;
    const range = platform.userData.moveRange;
    const speed = platform.userData.moveSpeed;
    const initialPos = platform.userData.initialPos[axis];
    
    const time = Date.now() / 1000;
    const offset = Math.sin(time * speed) * range / 2;
    const newPos = initialPos + offset;
    const velocity = newPos - platform.position[axis];
    
    return velocity;
}

// --- Verificar colisões com animais ---
function checkAnimalCollisions() {
    for (let i = 0; i < animalColliders.length; i++) {
        const animalBox = animalColliders[i];
        animalBox.setFromObject(animals[i]);
        
        if (playerCollider.intersectsBox(animalBox)) {
            // Efeito de colisão com animal
            const collisionEffect = createCollisionEffect();
            collisionEffect.position.copy(animals[i].position);
            scene.add(collisionEffect);
            setTimeout(() => scene.remove(collisionEffect), 500);
            
            // Aplicar impulso ao jogador
            const direction = new THREE.Vector3().subVectors(player.position, animals[i].position).normalize();
            direction.y = 0.5;
            direction.normalize();
            playerVelocity.addScaledVector(direction, 15);
            
            // Mover o animal para evitar colisões repetidas
            animals[i].position.y += 5;
            setTimeout(() => {
                animals[i].position.copy(animals[i].userData.initialPos);
            }, 3000);
        }
    }
}

// --- Criar efeito de colisão ---
function createCollisionEffect() {
    const effectGroup = new THREE.Group();
    
    // Partículas de colisão
    const particleCount = 20;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        particlePositions[i3] = (Math.random() - 0.5) * 2;
        particlePositions[i3 + 1] = (Math.random() - 0.5) * 2;
        particlePositions[i3 + 2] = (Math.random() - 0.5) * 2;
        
        const color = new THREE.Color(COLORS.ANIMAL_ACCENT);
        particleColors[i3] = color.r;
        particleColors[i3 + 1] = color.g;
        particleColors[i3 + 2] = color.b;
    }
    
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    
    const particleMat = new THREE.PointsMaterial({
        size: 0.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });
    
    const particles = new THREE.Points(particleGeo, particleMat);
    effectGroup.add(particles);
    
    // Animação de explosão
    const startTime = Date.now();
    const duration = 500;
    
    function animate() {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        const positions = particles.geometry.attributes.position.array;
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const initialX = positions[i3];
            const initialY = positions[i3 + 1];
            const initialZ = positions[i3 + 2];
            
            positions[i3] = initialX * (1 + progress * 2);
            positions[i3 + 1] = initialY * (1 + progress * 2);
            positions[i3 + 2] = initialZ * (1 + progress * 2);
        }
        
        particles.geometry.attributes.position.needsUpdate = true;
        particleMat.opacity = 0.8 * (1 - progress);
        
        if (progress < 1 && effectGroup.parent) {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
    
    return effectGroup;
}

// --- Criar efeito ao pousar ---
function createLandEffect() {
    const effectGroup = new THREE.Group();
    
    // Onda circular
    const ringGeo = new THREE.RingGeometry(0, 1, 32);
    const ringMat = new THREE.MeshBasicMaterial({ 
        color: COLORS.PLATFORM_ACCENT, 
        transparent: true, 
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.05;
    effectGroup.add(ring);
    
    // Animação de expansão
    const startTime = Date.now();
    const duration = 500;
    
    function animate() {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        ring.scale.set(progress * 3, progress * 3, progress * 3);
        ring.material.opacity = 0.7 * (1 - progress);
        
        if (progress < 1 && effectGroup.parent) {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
    
    return effectGroup;
}

// --- Atualizar movimento das plataformas ---
function updatePlatforms(deltaTime) {
    platforms.forEach(platform => {
        if (platform.userData.isMoving) {
            const axis = platform.userData.moveAxis;
            const range = platform.userData.moveRange;
            const speed = platform.userData.moveSpeed;
            const initialPos = platform.userData.initialPos[axis];
            
            const time = Date.now() / 1000;
            const offset = Math.sin(time * speed) * range / 2;
            
            platform.position[axis] = initialPos + offset;
        }
    });
}

// --- Atualizar movimento dos animais ---
function updateAnimals(deltaTime) {
    animals.forEach(animal => {
        if (animal.position.y > animal.userData.initialPos.y + 0.1) return;
        
        const time = animal.userData.time += deltaTime * animal.userData.speed;
        const range = animal.userData.range;
        
        // Movimento em figura de 8
        animal.position.x = animal.userData.initialPos.x + Math.sin(time) * range / 2;
        animal.position.z = animal.userData.initialPos.z + Math.sin(time * 0.5) * Math.cos(time) * range / 2;
        
        // Pequeno movimento vertical
        animal.position.y = animal.userData.initialPos.y + Math.sin(time * 2) * 0.2 + 0.2;
        
        // Rotação para olhar na direção do movimento
        const lookPos = new THREE.Vector3(
            animal.position.x + Math.cos(time) * 0.1,
            animal.position.y,
            animal.position.z - Math.sin(time) * 0.1
        );
        animal.lookAt(lookPos);
    });
}

// --- Atualizar indicador de mira ---
function updateAimIndicator() {
    // Atualizar posição do indicador de alcance do gancho
    hookRangeIndicator.position.copy(player.position);
    
    // Raycasting para detectar alvos potenciais
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    
    raycaster.set(player.position, direction);
    
    const intersects = raycaster.intersectObjects(platforms);
    
    if (intersects.length > 0 && intersects[0].distance <= hookMaxDistance) {
        potentialHookTarget = intersects[0].point.clone();
        aimIndicator.material.color.set(COLORS.AIM_INDICATOR_HIT);
        
        // Mostrar linha de mira e ponto de impacto
        aimIndicatorLine.visible = true;
        aimIndicatorPoint.visible = true;
        
        // Atualizar posições
        const linePositions = [
            player.position.x, player.position.y + 1, player.position.z,
            potentialHookTarget.x, potentialHookTarget.y, potentialHookTarget.z
        ];
        aimIndicatorLine.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        aimIndicatorLine.geometry.attributes.position.needsUpdate = true;
        
        aimIndicatorPoint.position.copy(potentialHookTarget);
        aimIndicatorPoint.material.color.set(COLORS.AIM_INDICATOR_HIT);
    } else {
        potentialHookTarget = null;
        aimIndicator.material.color.set(COLORS.AIM_INDICATOR_MISS);
        
        // Esconder linha de mira e ponto de impacto ou mostrar fora de alcance
        if (intersects.length > 0) {
            aimIndicatorLine.visible = true;
            aimIndicatorPoint.visible = true;
            
            const linePositions = [
                player.position.x, player.position.y + 1, player.position.z,
                intersects[0].point.x, intersects[0].point.y, intersects[0].point.z
            ];
            aimIndicatorLine.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
            aimIndicatorLine.geometry.attributes.position.needsUpdate = true;
            
            aimIndicatorPoint.position.copy(intersects[0].point);
            aimIndicatorPoint.material.color.set(COLORS.AIM_INDICATOR_MISS);
        } else {
            aimIndicatorLine.visible = false;
            aimIndicatorPoint.visible = false;
        }
    }
}

// --- Atualizar sistema de partículas ---
function updateParticleSystem(deltaTime) {
    if (!particleSystem) return;
    
    const positions = particleSystem.geometry.attributes.position.array;
    const colors = particleSystem.geometry.attributes.color.array;
    const particleCount = positions.length / 3;
    
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Movimento lento para cima
        positions[i3 + 1] += deltaTime * 0.5;
        
        // Reiniciar partículas que saem do campo
        if (positions[i3 + 1] > 50) {
            positions[i3] = (Math.random() - 0.5) * 100;
            positions[i3 + 1] = 0;
            positions[i3 + 2] = (Math.random() - 0.5) * 100;
            
            // Nova cor
            const color = new THREE.Color();
            color.setHSL(Math.random() * 0.2 + 0.7, 1, 0.5 + Math.random() * 0.5);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }
    }
    
    particleSystem.geometry.attributes.position.needsUpdate = true;
    particleSystem.geometry.attributes.color.needsUpdate = true;
    
    // Rotação lenta
    particleSystem.rotation.y += deltaTime * 0.05;
}

// --- Acionar Game Over ---
function triggerGameOver() {
    if (gameOver) return;
    
    gameOver = true;
    
    // Mostrar tela de game over
    gameOverScreen.visible = true;
    
    // Posicionar na frente da câmera
    const cameraDirection = new THREE.Vector3(0, 0, -1);
    cameraDirection.applyQuaternion(camera.quaternion);
    cameraDirection.multiplyScalar(5);
    
    gameOverScreen.position.copy(camera.position).add(cameraDirection);
    gameOverScreen.lookAt(camera.position);
    
    // Parar movimento do jogador
    playerVelocity.set(0, 0, 0);
    
    // Desativar gancho se estiver ativo
    if (hookActive) {
        deactivateHook();
    }
    
    // Efeito visual de game over
    const gameOverEffect = createGameOverEffect();
    scene.add(gameOverEffect);
    setTimeout(() => scene.remove(gameOverEffect), 2000);
}

// --- Criar efeito visual de game over ---
function createGameOverEffect() {
    const effectGroup = new THREE.Group();
    
    // Onda de choque
    const shockwaveGeo = new THREE.RingGeometry(0, 1, 32);
    const shockwaveMat = new THREE.MeshBasicMaterial({ 
        color: 0xFF0000, 
        transparent: true, 
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    
    for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(shockwaveGeo, shockwaveMat.clone());
        ring.position.copy(player.position);
        effectGroup.add(ring);
        
        // Animação de expansão
        const startTime = Date.now();
        const duration = 1500;
        const delay = i * 300;
        
        setTimeout(() => {
            function animate() {
                const elapsedTime = Date.now() - (startTime + delay);
                const progress = Math.min(elapsedTime / duration, 1);
                
                ring.scale.set(progress * 50, progress * 50, progress * 50);
                ring.material.opacity = 0.7 * (1 - progress);
                
                if (progress < 1 && effectGroup.parent) {
                    requestAnimationFrame(animate);
                }
            }
            
            animate();
        }, delay);
    }
    
    // Flash vermelho na tela
    const flashGeo = new THREE.PlaneGeometry(2, 2);
    const flashMat = new THREE.MeshBasicMaterial({ 
        color: 0xFF0000, 
        transparent: true, 
        opacity: 0.5,
        side: THREE.DoubleSide
    });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.z = -1;
    camera.add(flash);
    effectGroup.add(camera);
    
    // Animação de flash
    const startTime = Date.now();
    const duration = 1000;
    
    function animateFlash() {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        if (progress < 0.2) {
            flashMat.opacity = progress * 2.5;
        } else {
            flashMat.opacity = 0.5 * (1 - ((progress - 0.2) / 0.8));
        }
        
        if (progress < 1 && flash.parent) {
            requestAnimationFrame(animateFlash);
        } else if (progress >= 1 && flash.parent) {
            camera.remove(flash);
        }
    }
    
    animateFlash();
    
    return effectGroup;
}

// --- Loop de animação principal ---
function animate() {
    if (!gameStarted || gamePaused) {
        animationFrameId = requestAnimationFrame(animate);
        return;
    }
    
    const deltaTime = Math.min(clock.getDelta(), 0.1);
    
    // Atualizar posição da câmera
    const cameraOffset = new THREE.Vector3(0, 1.5, 0);
    camera.position.copy(player.position).add(cameraOffset);
    
    // Atualizar rotação da câmera
    camera.rotation.order = 'YXZ';
    camera.rotation.y = cameraYaw;
    camera.rotation.x = cameraPitch;
    
    // Atualizar uniforms do material de brilho
    if (glowMaterial.uniforms) {
        glowMaterial.uniforms.viewVector.value.copy(camera.position);
    }
    
    // Atualizar movimento do jogador
    if (!gameOver) {
        updatePlayerMovement(deltaTime);
    }
    
    // Atualizar plataformas
    updatePlatforms(deltaTime);
    
    // Atualizar animais
    updateAnimals(deltaTime);
    
    // Atualizar indicador de mira
    updateAimIndicator();
    
    // Atualizar sistema de partículas
    updateParticleSystem(deltaTime);
    
    // Atualizar rotação do modelo do jogador para olhar na direção do movimento
    if (playerModel && (playerVelocity.x !== 0 || playerVelocity.z !== 0)) {
        const horizontalVelocity = new THREE.Vector3(playerVelocity.x, 0, playerVelocity.z);
        if (horizontalVelocity.lengthSq() > 0.1) {
            const targetRotation = Math.atan2(playerVelocity.x, playerVelocity.z);
            
            // Suavizar rotação
            let currentRotation = player.rotation.y;
            const rotationDiff = targetRotation - currentRotation;
            
            // Normalizar diferença para o caminho mais curto
            let normalizedDiff = ((rotationDiff + Math.PI) % (Math.PI * 2)) - Math.PI;
            if (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;
            
            // Aplicar rotação suavizada
            player.rotation.y += normalizedDiff * 5 * deltaTime;
        }
    }
    
    // Renderizar cena
    renderer.render(scene, camera);
    
    animationFrameId = requestAnimationFrame(animate);
}

// Inicializar o jogo quando a página carregar
window.addEventListener('load', init);
