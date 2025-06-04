import * as THREE from 'https://unpkg.com/three@0.163.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.163.0/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'https://unpkg.com/three@0.163.0/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'https://unpkg.com/three@0.163.0/examples/jsm/loaders/MTLLoader.js';

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
        this.container.appendChild(this.renderer.domElement);
        
        // Adicionar luzes
        const ambientLight = new THREE.AmbientLight(0xcccccc, 0.7);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
        
        // Adicionar controles de órbita
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.7;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 10;
        
        // Adicionar evento de redimensionamento
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        this.isInitialized = true;
        this.animate();
    }
    
    loadModel(modelPath, mtlPath, texturePath) {
        if (!this.isInitialized) return;
        
        // Remover modelo anterior se existir
        if (this.model) {
            this.scene.remove(this.model);
            this.model = null;
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
                
                // Adicionar animação de rotação suave
                object.userData.rotationSpeed = 0.005;
                
                this.scene.add(object);
            });
        });
    }
    
    animate() {
        if (!this.isInitialized) return;
        
        this.animationId = requestAnimationFrame(this.animate.bind(this));
        
        // Atualizar controles
        this.controls.update();
        
        // Animar modelo se existir
        if (this.model) {
            this.model.rotation.y += this.model.userData.rotationSpeed || 0.005;
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
        this.isInitialized = false;
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

// Exportar funções e classe
export { ModelViewer, createEggonaldoViewer, createSplineViewer };
