// Basic Three.js Game - Eggonaldo Collects Web Elements

let scene, camera, renderer, eggonaldo, score = 0, gameActive = true;
let fallingItems = [];
const gameContainer = document.getElementById("game-container");
const scoreElement = document.getElementById("score");
const loadingScreen = document.getElementById("loading-screen");

function init() {
    console.log("Initializing game...");

    if (!gameContainer) {
        console.error("Game container not found!");
        if(loadingScreen) loadingScreen.innerText = "Erro: Container do jogo não encontrado!";
        return;
    }
     if (!scoreElement) {
        console.error("Score element not found!");
    }
     if (!loadingScreen) {
        console.error("Loading screen not found!");
    }

    try {
        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf5f5f5); // Match site background
        console.log("Scene created.");

        // Camera
        camera = new THREE.PerspectiveCamera(75, gameContainer.clientWidth / gameContainer.clientHeight, 0.1, 1000);
        camera.position.z = 15;
        camera.position.y = 5;
        console.log("Camera created.");

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(gameContainer.clientWidth, gameContainer.clientHeight);
        gameContainer.appendChild(renderer.domElement);
        console.log("Renderer created and appended.");

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);
        console.log("Lighting added.");

        // Eggonaldo (Placeholder: a Cylinder)
        const eggGeo = new THREE.CylinderGeometry(0.8, 0.8, 2.5, 16); // Using Cylinder instead of Capsule
        const eggMat = new THREE.MeshStandardMaterial({ color: 0x6a1b9a }); // Purple
        eggonaldo = new THREE.Mesh(eggGeo, eggMat);
        eggonaldo.position.y = -5;
        scene.add(eggonaldo);
        console.log("Eggonaldo added.");

        // Controls
        document.addEventListener("keydown", onKeyDown);
        gameContainer.addEventListener("touchstart", onTouchStart, { passive: false });
        gameContainer.addEventListener("touchmove", onTouchMove, { passive: false });
        console.log("Controls added.");

        // Handle Resize
        window.addEventListener("resize", onWindowResize);
        console.log("Resize listener added.");

        // Start Game Logic
        spawnItem();
        animate();
        console.log("Game logic started.");

        // Hide loading screen
        if (loadingScreen) {
            loadingScreen.style.display = "none";
            console.log("Loading screen hidden.");
        }

    } catch (error) {
        console.error("Error during Three.js initialization:", error);
         if(loadingScreen) {
             loadingScreen.style.display = "flex"; // Show loading screen again on error
             loadingScreen.innerText = `Erro ao carregar o jogo: ${error.message}`;
         }
    }
}

function spawnItem() {
    if (!gameActive) return;

    const isGood = Math.random() > 0.3; // 70% chance of good item
    const geometry = isGood ? new THREE.BoxGeometry(1, 1, 1) : new THREE.SphereGeometry(0.7, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color: isGood ? 0x1565c0 : 0xff0000 }); // Blue for good, Red for bad
    const item = new THREE.Mesh(geometry, material);

    item.position.x = (Math.random() - 0.5) * 20; // Random x position within approx -10 to 10 range
    item.position.y = 15; // Start above the screen
    item.isGood = isGood;

    fallingItems.push(item);
    scene.add(item);

    // Spawn next item after a delay
    const spawnInterval = Math.random() * 1000 + 500; // 0.5s to 1.5s
    setTimeout(spawnItem, spawnInterval);
}

function onKeyDown(event) {
    if (!gameActive) return;
    const moveSpeed = 0.5;
    switch (event.key) {
        case "ArrowLeft":
            eggonaldo.position.x -= moveSpeed;
            break;
        case "ArrowRight":
            eggonaldo.position.x += moveSpeed;
            break;
    }
    // Clamp position
    eggonaldo.position.x = Math.max(-10, Math.min(10, eggonaldo.position.x));
}

let touchStartX = 0;
function onTouchStart(event) {
    if (!gameActive || event.touches.length === 0) return;
    event.preventDefault(); // Prevent scrolling
    touchStartX = event.touches[0].clientX;
}

function onTouchMove(event) {
    if (!gameActive || event.touches.length === 0) return;
    event.preventDefault(); // Prevent scrolling
    const touchX = event.touches[0].clientX;
    const touchDiff = touchX - touchStartX;
    const moveSpeed = 0.05; // Adjust sensitivity

    eggonaldo.position.x += touchDiff * moveSpeed;
    
    // Update touchStartX for continuous movement feel
    touchStartX = touchX;

    // Clamp position
    eggonaldo.position.x = Math.max(-10, Math.min(10, eggonaldo.position.x));
}


function checkCollisions() {
    if (!eggonaldo) return; // Ensure eggonaldo exists
    const eggBox = new THREE.Box3().setFromObject(eggonaldo);

    for (let i = fallingItems.length - 1; i >= 0; i--) {
        const item = fallingItems[i];
        const itemBox = new THREE.Box3().setFromObject(item);

        if (eggBox.intersectsBox(itemBox)) {
            if (item.isGood) {
                score++;
                if (scoreElement) scoreElement.innerText = `Pontos: ${score}`;
            } else {
                // Game Over or penalty
                // alert(`Game Over! Pontuação final: ${score}`);
                // gameActive = false;
                score = Math.max(0, score - 2); // Penalty
                 if (scoreElement) scoreElement.innerText = `Pontos: ${score}`;
            }
            scene.remove(item);
            fallingItems.splice(i, 1);
        }
    }
}

function animate() {
    if (!gameActive) return;

    requestAnimationFrame(animate);

    // Move items down
    const fallSpeed = 0.05;
    for (let i = fallingItems.length - 1; i >= 0; i--) {
        const item = fallingItems[i];
        item.position.y -= fallSpeed;
        item.rotation.x += 0.01;
        item.rotation.y += 0.01;

        // Remove if off-screen
        if (item.position.y < -10) {
            scene.remove(item);
            fallingItems.splice(i, 1);
        }
    }

    checkCollisions();

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function onWindowResize() {
    if (!camera || !renderer || !gameContainer) return;
    // Ensure container has dimensions
    const width = gameContainer.clientWidth;
    const height = gameContainer.clientHeight;
    if (width === 0 || height === 0) return; 
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// Start the game
init();

