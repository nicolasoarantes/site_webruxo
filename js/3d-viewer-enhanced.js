import * as THREE from 'https://unpkg.com/three@0.163.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.163.0/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'https://unpkg.com/three@0.163.0/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'https://unpkg.com/three@0.163.0/examples/jsm/loaders/MTLLoader.js';

// Mapa de visualizadores
const viewers = new Map();

// Configuração principal do visualizador 3D
class ModelViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.animationId = null;
        this.isInitialized = false;
        this.autoRotate = true;
        this.containerId = containerId;
        
        // Verificar se o container existe
        if (!this.container) {
            console.error(`Container com ID ${containerId} não encontrado`);
            return;
        }
        
        this.init();
    }
    
    init() {
        // Criar cena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0B0B2D);
        
        // Adicionar fog para efeito de profundidade
        this.scene.fog = new THREE.FogExp2(0x0B0B2D, 0.05);
        
        // Configurar dimensões baseadas no container
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        // Criar câmera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 1, 5);
        
        // Criar renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
        
        // Adicionar luzes
        const ambientLight = new THREE.AmbientLight(0xcccccc, 0.7);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
        directionalLight.position.set(1, 1, 1);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);
        
        // Adicionar luz de realce
        const purpleLight = new THREE.PointLight(0x6a1b9a, 1, 10);
        purpleLight.position.set(-2, 1, 2);
        this.scene.add(purpleLight);
        
        const blueLight = new THREE.PointLight(0x1565c0, 1, 10);
        blueLight.position.set(2, 1, -2);
        this.scene.add(blueLight);
        
        // Adicionar controles de órbita
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.7;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 10;
        this.controls.autoRotate = this.autoRotate;
        this.controls.autoRotateSpeed = 2.0;
        
        // Adicionar evento de redimensionamento
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Adicionar plano de base com grid
        const gridHelper = new THREE.GridHelper(10, 20, 0x6a1b9a, 0x1565c0);
        gridHelper.position.y = -1;
        this.scene.add(gridHelper);
        
        // Adicionar partículas para efeito mágico
        this.addParticles();
        
        this.isInitialized = true;
        this.animate();
        
        // Registrar visualizador no mapa global
        viewers.set(this.containerId, this);
    }
    
    addParticles() {
        const particleCount = 100;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 10;
            positions[i + 1] = (Math.random() - 0.5) * 10;
            positions[i + 2] = (Math.random() - 0.5) * 10;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffd600,
            size: 0.05,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        this.particles = new THREE.Points(particles, particleMaterial);
        this.scene.add(this.particles);
    }
    
    loadModel(modelPath, mtlPath, texturePath) {
        if (!this.isInitialized) return;
        
        // Remover modelo anterior se existir
        if (this.model) {
            this.scene.remove(this.model);
            this.model = null;
        }
        
        // Mostrar loader
        const loader = this.container.querySelector('.model-loader');
        if (loader) {
            loader.classList.remove('hidden');
        }
        
        // Carregar materiais e modelo
        const mtlLoader = new MTLLoader();
        mtlLoader.load(mtlPath, (materials) => {
            materials.preload();
            
            const objLoader = new OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.load(modelPath, (object) => {
                this.model = object;
                
                // Centralizar e ajustar escala
                const box = new THREE.Box3().setFromObject(object);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2.5 / maxDim;
                
                object.position.x = -center.x * scale;
                object.position.y = -center.y * scale + 0.5;
                object.position.z = -center.z * scale;
                object.scale.set(scale, scale, scale);
                
                // Configurar sombras
                object.traverse(function(child) {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                // Adicionar animação de rotação suave
                object.userData.rotationSpeed = 0.005;
                
                this.scene.add(object);
                
                // Esconder loader
                if (loader) {
                    setTimeout(() => {
                        loader.classList.add('hidden');
                    }, 1000);
                }
            });
        });
    }
    
    animate() {
        if (!this.isInitialized) return;
        
        this.animationId = requestAnimationFrame(this.animate.bind(this));
        
        // Atualizar controles
        this.controls.update();
        
        // Animar partículas
        if (this.particles) {
            this.particles.rotation.y += 0.001;
        }
        
        // Renderizar cena
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        if (!this.isInitialized) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    toggleRotation() {
        if (!this.isInitialized) return;
        
        this.controls.autoRotate = !this.controls.autoRotate;
        return this.controls.autoRotate;
    }
    
    zoomIn() {
        if (!this.isInitialized) return;
        
        const currentDistance = this.camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
        if (currentDistance > this.controls.minDistance + 0.5) {
            this.camera.position.multiplyScalar(0.9);
        }
    }
    
    zoomOut() {
        if (!this.isInitialized) return;
        
        const currentDistance = this.camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
        if (currentDistance < this.controls.maxDistance - 0.5) {
            this.camera.position.multiplyScalar(1.1);
        }
    }
    
    resetView() {
        if (!this.isInitialized) return;
        
        this.camera.position.set(0, 1, 5);
        this.camera.lookAt(0, 0, 0);
        this.controls.update();
    }
    
    dispose() {
        if (!this.isInitialized) return;
        
        // Cancelar animação
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Remover evento de redimensionamento
        window.removeEventListener('resize', this.onWindowResize);
        
        // Limpar cena
        if (this.model) {
            this.scene.remove(this.model);
        }
        
        if (this.particles) {
            this.scene.remove(this.particles);
        }
        
        // Remover renderer do DOM
        if (this.renderer && this.renderer.domElement) {
            this.container.removeChild(this.renderer.domElement);
        }
        
        // Limpar referências
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.particles = null;
        this.isInitialized = false;
        
        // Remover do mapa global
        viewers.delete(this.containerId);
    }
}

// Função para criar visualizador de modelo Eggonaldo
function createEggonaldoViewer(containerId) {
    const viewer = new ModelViewer(containerId);
    viewer.loadModel(
        '/models/eggonaldo/Witchy_Egg_0526231003_texture_obj/Witchy_Egg_0526231003_texture.obj',
        '/models/eggonaldo/Witchy_Egg_0526231003_texture_obj/Witchy_Egg_0526231003_texture.mtl',
        '/models/eggonaldo/Witchy_Egg_0526231003_texture_obj/Witchy_Egg_0526231003_texture.png'
    );
    return viewer;
}

// Função para criar visualizador com cena Spline do Monster
function createSplineViewer(containerId, splineUrl) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container com ID ${containerId} não encontrado`);
        return;
    }
    
    // Criar iframe para Spline
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.src = splineUrl;
    
    // Limpar container e adicionar iframe
    container.innerHTML = '';
    container.appendChild(iframe);
    
    return {
        dispose: () => {
            container.removeChild(iframe);
        }
    };
}

// Funções globais para controle dos modelos
window.toggleModelRotation = function(containerId) {
    const viewer = viewers.get(containerId);
    if (viewer) {
        const isRotating = viewer.toggleRotation();
        // Atualizar ícone do botão
        const button = document.querySelector(`#${containerId} .model-controls button:first-child i`);
        if (button) {
            if (isRotating) {
                button.className = 'fas fa-pause';
            } else {
                button.className = 'fas fa-sync-alt';
            }
        }
    }
};

window.zoomInModel = function(containerId) {
    const viewer = viewers.get(containerId);
    if (viewer) {
        viewer.zoomIn();
    }
};

window.zoomOutModel = function(containerId) {
    const viewer = viewers.get(containerId);
    if (viewer) {
        viewer.zoomOut();
    }
};

window.resetModelView = function(containerId) {
    const viewer = viewers.get(containerId);
    if (viewer) {
        viewer.resetView();
    }
};

// Exportar funções e classe
export { ModelViewer, createEggonaldoViewer, createSplineViewer };

