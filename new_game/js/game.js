import * as THREE from 'three';

console.log("Jogo Wander Webruxo - Script Carregado v0.7 - Movimentação/Gancho Refinados");

// Seletores DOM
const gameContainer = document.getElementById('game-container');
const loadingScreen = document.getElementById('loading-screen');
const mobileControls = document.getElementById('mobile-controls');
const jumpButton = document.getElementById('jump-button');
const hookButton = document.getElementById('hook-button');

// --- Constantes Visuais ---
const COLORS = {
    BACKGROUND_TOP: 0x1a0a2e,
    BACKGROUND_BOTTOM: 0x3a2058,
    FOG: 0x3a2058,
    AMBIENT_LIGHT: 0xcccccc,
    DIRECTIONAL_LIGHT: 0xffffff,
    PLAYER_BODY: 0xfff8e1,
    PLAYER_HAT: 0x6a1b9a,
    PLAYER_SHOES: 0xFFD93D,
    PLATFORM_BASE: 0x607d8b,
    PLATFORM_ACCENT: 0x455a64,
    HOOK_LINE: 0xFFD93D,
    COLLECTIBLE: 0x00FFFF,
    UI_BUTTON_BG: 'rgba(106, 27, 154, 0.7)',
    UI_BUTTON_HOVER_BG: 'rgba(126, 47, 174, 0.9)',
    UI_TEXT: '#FFFFFF',
};

// Variáveis Globais do Jogo
let scene, camera, renderer, player, clock;
let keys = {};
let isMobile = false;
let playerVelocity = new THREE.Vector3();
let onGround = false;
const gravity = -9.8 * 3.5; // Gravidade mais forte para sensação mais "pesada"
const moveSpeed = 7; // Aumentar velocidade base
const acceleration = 40; // Aceleração para movimento mais responsivo
const deceleration = 25; // Desaceleração
const jumpForce = 9; // Pulo mais forte
let platforms = [];
let playerCollider;
let platformColliders = [];

// Variáveis do Gancho Mágico
let hookActive = false;
let hookTarget = null;
let hookLine = null;
const hookMaxDistance = 40; // Maior alcance
const hookPullAcceleration = 50; // Usar aceleração em vez de velocidade constante
const hookMaxPullSpeed = 25; // Limitar velocidade máxima do gancho
const hookMinDistance = 1.0; // Distância mínima para soltar
let raycaster = new THREE.Raycaster();

// Variáveis de Controle de Toque
let touchStartX = 0;
let touchStartY = 0;
let touchCurrentX = 0;
let touchCurrentY = 0;
let isTouching = false;
let touchMoveX = 0;
let touchMoveY = 0;
const touchSensitivity = 0.02; // Ajustar sensibilidade do toque

// --- Inicialização --- 
function init() {
    console.log("Inicializando o jogo com Movimentação/Gancho Refinados...");

    isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        mobileControls.style.display = 'flex';
        jumpButton.style.backgroundColor = COLORS.UI_BUTTON_BG;
        hookButton.style.backgroundColor = COLORS.UI_BUTTON_BG;
    }

    scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.BACKGROUND_BOTTOM);
    scene.fog = new THREE.Fog(COLORS.FOG, 20, 100);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    gameContainer.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(COLORS.AMBIENT_LIGHT, 0.7); // Um pouco mais de luz ambiente
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(COLORS.DIRECTIONAL_LIGHT, 1.8); // Luz direcional mais forte
    directionalLight.position.set(20, 25, 15);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    clock = new THREE.Clock();

    createPlayer();
    createPlatforms();
    createBackgroundElements();
    setupControls();

    loadingScreen.style.display = 'none';
    console.log("Jogo inicializado com Movimentação/Gancho Refinados.");

    animate();
}

// --- Criação do Jogador (Eggonaldo) ---
function createPlayer() {
    const playerGroup = new THREE.Group();
    const bodyRadius = 0.5;
    const bodyHeight = 1.0;
    const hatHeight = 0.8;
    const shoeSize = 0.3;
    const totalHeight = bodyHeight + hatHeight + shoeSize;

    const bodyGeometry = new THREE.CapsuleGeometry(bodyRadius, bodyHeight, 4, 10);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: COLORS.PLAYER_BODY, roughness: 0.8, metalness: 0.1 });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.y = bodyHeight / 2 + shoeSize;
    playerGroup.add(bodyMesh);

    const hatGeometry = new THREE.ConeGeometry(bodyRadius * 1.2, hatHeight, 12);
    const hatMaterial = new THREE.MeshStandardMaterial({ color: COLORS.PLAYER_HAT, roughness: 0.7, metalness: 0.1 });
    const hatMesh = new THREE.Mesh(hatGeometry, hatMaterial);
    hatMesh.position.y = bodyMesh.position.y + bodyHeight / 2 + hatHeight / 2 - 0.1;
    hatMesh.rotation.z = Math.PI * 0.05;
    playerGroup.add(hatMesh);

    const shoeGeometry = new THREE.CylinderGeometry(shoeSize, shoeSize * 0.8, shoeSize * 0.8, 8);
    const shoeMaterial = new THREE.MeshStandardMaterial({ color: COLORS.PLAYER_SHOES, roughness: 0.6, metalness: 0.2 });
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
    const colliderSize = new THREE.Vector3(bodyRadius * 2, totalHeight, bodyRadius * 2);
    playerCollider.setFromCenterAndSize(player.position, colliderSize);
}

// --- Criação de Plataformas ---
function createPlatforms() {
    const platformMaterialBase = new THREE.MeshStandardMaterial({ color: COLORS.PLATFORM_BASE, roughness: 0.9, metalness: 0.1 });
    const platformMaterialAccent = new THREE.MeshStandardMaterial({ color: COLORS.PLATFORM_ACCENT, roughness: 0.8, metalness: 0.1 });

    const platformData = [
        { geo: new THREE.BoxGeometry(30, 1.5, 30), pos: new THREE.Vector3(0, -0.75, 0), mat: platformMaterialBase },
        { geo: new THREE.BoxGeometry(6, 1, 6), pos: new THREE.Vector3(12, 2.5, -7), mat: platformMaterialAccent },
        { geo: new THREE.BoxGeometry(4, 1, 10), pos: new THREE.Vector3(-10, 4.5, -12), mat: platformMaterialBase },
        { geo: new THREE.CylinderGeometry(3, 3, 1, 12), pos: new THREE.Vector3(0, 6.5, -18), mat: platformMaterialAccent },
        { geo: new THREE.BoxGeometry(5, 0.8, 2), pos: new THREE.Vector3(-5, 8, -25), mat: new THREE.MeshStandardMaterial({ color: COLORS.PLAYER_HAT, roughness: 0.7, metalness: 0.1 }), moving: { axis: 'x', range: 12, speed: 2.5 } }
    ];

    platformData.forEach((data) => {
        const platform = new THREE.Mesh(data.geo, data.mat.clone());
        platform.position.copy(data.pos);
        platform.userData.isAnchorable = true;
        scene.add(platform);
        platforms.push(platform);

        const platformBox = new THREE.Box3().setFromObject(platform);
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

// --- Criação de Elementos de Fundo ---
function createBackgroundElements() {
    const elementMaterial = new THREE.MeshBasicMaterial({ color: COLORS.PLATFORM_ACCENT, transparent: true, opacity: 0.1, side: THREE.DoubleSide });
    const shapes = [
        new THREE.BoxGeometry(5, 5, 0.1),
        new THREE.ConeGeometry(3, 6, 4),
        new THREE.TorusGeometry(4, 0.5, 8, 6)
    ];
    for (let i = 0; i < 15; i++) {
        const geometry = shapes[Math.floor(Math.random() * shapes.length)];
        const element = new THREE.Mesh(geometry, elementMaterial);
        element.position.set((Math.random() - 0.5) * 150, (Math.random() - 0.5) * 100 + 20, (Math.random() - 0.5) * 150 - 50);
        element.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        scene.add(element);
    }
}

// --- Configuração de Controles ---
function setupControls() {
    console.log("Configurando controles...");
    document.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        keys[key] = true;
        // Usar Shift ou F para gancho
        if ((key === 'shift' || key === 'f') && !hookActive) activateHook();
        // Pulo com Espaço
        if (key === ' ' && onGround) {
            playerVelocity.y = jumpForce;
            onGround = false;
        }
    });
    document.addEventListener('keyup', (event) => {
        const key = event.key.toLowerCase();
        keys[key] = false;
        if ((key === 'shift' || key === 'f') && hookActive) deactivateHook();
    });

    if (isMobile) {
        jumpButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (onGround) {
                playerVelocity.y = jumpForce;
                onGround = false;
            }
        }, { passive: false });
        hookButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!hookActive) activateHook();
        }, { passive: false });
        hookButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (hookActive) deactivateHook();
        }, { passive: false });

        gameContainer.addEventListener('touchstart', (e) => {
            if (e.target === jumpButton || e.target === hookButton) return;
            isTouching = true;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchCurrentX = touchStartX;
            touchCurrentY = touchStartY;
            touchMoveX = 0;
            touchMoveY = 0;
        }, { passive: false });
        gameContainer.addEventListener('touchmove', (e) => {
            if (!isTouching) return;
            touchCurrentX = e.touches[0].clientX;
            touchCurrentY = e.touches[0].clientY;
            touchMoveX = (touchCurrentX - touchStartX) / window.innerWidth;
            touchMoveY = (touchCurrentY - touchStartY) / window.innerHeight;
        }, { passive: false });
        gameContainer.addEventListener('touchend', (e) => {
            if (e.target === jumpButton || e.target === hookButton) return;
            isTouching = false;
            touchMoveX = 0;
            touchMoveY = 0;
        }, { passive: false });
    }
    window.addEventListener('resize', onWindowResize, false);
}

// --- Lógica do Gancho Mágico (Refinada) ---
function activateHook() {
    console.log("Tentando ativar gancho...");
    const playerDirection = new THREE.Vector3();
    camera.getWorldDirection(playerDirection);
    const rayOrigin = player.position.clone().add(new THREE.Vector3(0, 1.0, 0));
    raycaster.set(rayOrigin, playerDirection);
    const intersects = raycaster.intersectObjects(platforms, false);

    let closestAnchor = null;
    let minDistance = hookMaxDistance;

    intersects.forEach(intersect => {
        if (intersect.object.userData.isAnchorable && intersect.distance <= minDistance && intersect.distance > hookMinDistance) {
            minDistance = intersect.distance;
            closestAnchor = intersect.point;
        }
    });

    if (closestAnchor) {
        console.log("Gancho ancorado!", closestAnchor);
        hookActive = true;
        hookTarget = closestAnchor.clone();

        if (!hookLine) {
            const lineMaterial = new THREE.LineBasicMaterial({ color: COLORS.HOOK_LINE, linewidth: 3 });
            const points = [player.position.clone(), hookTarget];
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
        playerVelocity.set(0, 0, 0); // Parar completamente ao ancorar
        onGround = false;
    } else {
        console.log("Nenhum ponto de ancoragem encontrado.");
    }
}

function deactivateHook() {
    console.log("Desativando gancho.");
    hookActive = false;
    hookTarget = null;
    if (hookLine) {
        hookLine.visible = false;
    }
    // Pequeno impulso ao soltar para evitar ficar "preso"
    // playerVelocity.y = jumpForce * 0.3;
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
            // Aplicar aceleração em direção ao alvo
            playerVelocity.add(pullDirection.multiplyScalar(hookPullAcceleration * delta));
            // Limitar velocidade máxima
            if (playerVelocity.length() > hookMaxPullSpeed) {
                playerVelocity.normalize().multiplyScalar(hookMaxPullSpeed);
            }
        } else {
            deactivateHook();
            // Impulso ao chegar perto
            playerVelocity.y = jumpForce * 0.6;
            playerVelocity.x *= 0.6;
            playerVelocity.z *= 0.6;
        }
    } else {
        if (hookLine && hookLine.visible) {
            hookLine.visible = false;
        }
    }
}

// --- Loop de Animação --- 
function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);

    updateMovingPlatforms(delta);
    updatePlayerMovement(delta);
    handleCollisions(delta);
    updateCamera(delta);
    updateHook(delta); // Atualizar gancho depois da colisão/movimento

    renderer.render(scene, camera);
}

// --- Atualização de Plataformas Móveis --- 
function updateMovingPlatforms(delta) {
    platforms.forEach((platform, index) => {
        if (platform.userData.isMoving) {
            const speed = platform.userData.moveSpeed;
            const range = platform.userData.moveRange;
            const axis = platform.userData.moveAxis;
            const initialPos = platform.userData.initialPos;
            const oldPos = platform.position.clone();
            platform.position[axis] = initialPos[axis] + Math.sin(clock.elapsedTime * speed / 2) * range / 2;
            platformColliders[index].setFromObject(platform);
            platform.userData.velocity = platform.position.clone().sub(oldPos).divideScalar(delta);
        } else {
            platform.userData.velocity = new THREE.Vector3();
        }
    });
}

// --- Atualização do Movimento do Jogador (Refinado) --- 
function updatePlayerMovement(delta) {
    const targetVelocity = new THREE.Vector3(); // Velocidade desejada baseada no input
    const playerWorldDirection = new THREE.Vector3();
    player.getWorldDirection(playerWorldDirection);

    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();

    const rightDirection = new THREE.Vector3().crossVectors(camera.up, cameraDirection).normalize();

    // Movimento Horizontal (ignorado se o gancho estiver ativo)
    if (!hookActive) {
        let horizontalInput = false;
        const moveInput = new THREE.Vector3();
        // Teclado
        if (keys['w'] || keys['arrowup']) { moveInput.add(cameraDirection); horizontalInput = true; }
        if (keys['s'] || keys['arrowdown']) { moveInput.sub(cameraDirection); horizontalInput = true; }
        if (keys['a'] || keys['arrowleft']) { moveInput.sub(rightDirection); horizontalInput = true; }
        if (keys['d'] || keys['arrowright']) { moveInput.add(rightDirection); horizontalInput = true; }

        // Toque (Mobile)
        if (isTouching) {
            const moveForward = -touchMoveY * 3.0; // Maior sensibilidade
            const moveSideways = touchMoveX * 3.0;
            moveInput.add(cameraDirection.clone().multiplyScalar(moveForward));
            moveInput.add(rightDirection.clone().multiplyScalar(moveSideways));
            horizontalInput = true;
        }

        if (horizontalInput) {
            moveInput.normalize();
            targetVelocity.x = moveInput.x * moveSpeed;
            targetVelocity.z = moveInput.z * moveSpeed;
            // Rotacionar o modelo do jogador para a direção do movimento
            const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), moveInput);
            player.quaternion.slerp(targetQuaternion, 20 * delta); // Rotação mais rápida e suave
        } else {
            targetVelocity.x = 0;
            targetVelocity.z = 0;
        }

        // Aplicar aceleração/desaceleração horizontal
        const currentVelocityXZ = new THREE.Vector3(playerVelocity.x, 0, playerVelocity.z);
        const targetVelocityXZ = new THREE.Vector3(targetVelocity.x, 0, targetVelocity.z);
        const accel = horizontalInput ? acceleration : deceleration;
        currentVelocityXZ.lerp(targetVelocityXZ, accel * delta);
        playerVelocity.x = currentVelocityXZ.x;
        playerVelocity.z = currentVelocityXZ.z;

        // Aplicar gravidade
        playerVelocity.y += gravity * delta;

    } else {
        // Movimento é controlado por updateHook
        // A velocidade é aplicada lá
    }
}

// --- Tratamento de Colisões ---
function handleCollisions(delta) {
    onGround = false;
    let playerOnPlatformVelocity = new THREE.Vector3();

    const playerCenter = player.position.clone();
    const playerHeight = 1.8; // Usar valor fixo aproximado para collider
    const playerRadius = 0.5;
    const playerSize = new THREE.Vector3(playerRadius * 2, playerHeight, playerRadius * 2);
    playerCollider.setFromCenterAndSize(playerCenter, playerSize);

    const potentialPosition = player.position.clone().add(playerVelocity.clone().multiplyScalar(delta));
    const potentialCollider = playerCollider.clone().translate(playerVelocity.clone().multiplyScalar(delta));

    platformColliders.forEach((platformBox, index) => {
        const platform = platforms[index];
        if (potentialCollider.intersectsBox(platformBox)) {
            const collisionNormal = new THREE.Vector3();
            const penetrationDepth = new THREE.Vector3();
            const playerCenterPotential = new THREE.Vector3();
            potentialCollider.getCenter(playerCenterPotential);
            const platformCenter = new THREE.Vector3();
            platformBox.getCenter(platformCenter);
            const separationVector = playerCenterPotential.clone().sub(platformCenter);
            const platformSize = new THREE.Vector3();
            platformBox.getSize(platformSize);
            const overlapX = (playerSize.x / 2 + platformSize.x / 2) - Math.abs(separationVector.x);
            const overlapY = (playerSize.y / 2 + platformSize.y / 2) - Math.abs(separationVector.y);
            const overlapZ = (playerSize.z / 2 + platformSize.z / 2) - Math.abs(separationVector.z);

            if (overlapY < overlapX && overlapY < overlapZ && overlapY > 0) {
                if (separationVector.y > 0 && playerVelocity.y <= 0) {
                    potentialPosition.y = platformBox.max.y + playerSize.y / 2;
                    playerVelocity.y = 0;
                    onGround = true;
                    playerOnPlatformVelocity = platform.userData.velocity || new THREE.Vector3();
                } else if (separationVector.y < 0 && playerVelocity.y >= 0) {
                    potentialPosition.y = platformBox.min.y - playerSize.y / 2;
                    playerVelocity.y = 0;
                }
            } else if (overlapX < overlapY && overlapX < overlapZ && overlapX > 0) {
                potentialPosition.x += (separationVector.x > 0 ? overlapX : -overlapX);
                playerVelocity.x = 0;
            } else if (overlapZ > 0) { // overlapZ < overlapX && overlapZ < overlapY
                potentialPosition.z += (separationVector.z > 0 ? overlapZ : -overlapZ);
                playerVelocity.z = 0;
            }
            potentialCollider.setFromCenterAndSize(potentialPosition, playerSize);
        }
    });

    player.position.copy(potentialPosition);
    if (onGround) {
        player.position.add(playerOnPlatformVelocity.clone().multiplyScalar(delta));
    }

    playerCollider.setFromCenterAndSize(player.position, playerSize);

    if (player.position.y < -30) {
        player.position.set(0, 5, 0);
        playerVelocity.set(0, 0, 0);
        if (hookActive) deactivateHook();
    }
}

// --- Atualização da Câmera ---
function updateCamera(delta) {
    const cameraTargetPosition = player.position.clone().add(new THREE.Vector3(0, 1.2, 0)); // Olhar um pouco mais para cima
    const relativeCameraOffset = new THREE.Vector3(0, 3.5, 7.5); // Ajustar offset
    const playerRotation = new THREE.Quaternion();
    player.getWorldQuaternion(playerRotation);
    const cameraOffset = relativeCameraOffset.clone().applyQuaternion(playerRotation);
    const desiredCameraPosition = player.position.clone().add(cameraOffset);

    const cameraRay = new THREE.Raycaster(cameraTargetPosition, desiredCameraPosition.clone().sub(cameraTargetPosition).normalize());
    const cameraIntersects = cameraRay.intersectObjects(platforms, false);
    let cameraDistance = relativeCameraOffset.length();

    if (cameraIntersects.length > 0) {
        cameraDistance = Math.min(cameraDistance, cameraIntersects[0].distance * 0.9); // Aproximar um pouco mais
    }

    const finalCameraPosition = cameraTargetPosition.clone().add(desiredCameraPosition.clone().sub(cameraTargetPosition).normalize().multiplyScalar(cameraDistance));

    camera.position.lerp(finalCameraPosition, 12 * delta); // Lerp mais rápido

    const lookAtTarget = new THREE.Vector3();
    lookAtTarget.lerpVectors(camera.userData.lookAt || cameraTargetPosition, cameraTargetPosition, 12 * delta);
    camera.lookAt(lookAtTarget);
    camera.userData.lookAt = lookAtTarget.clone();
}

// --- Redimensionamento da Janela ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Iniciar o Jogo ---
init();
