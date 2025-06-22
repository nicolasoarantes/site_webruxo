// Script para a página de modelos 3D

document.addEventListener('DOMContentLoaded', function() {
    // Adicionar loaders para os containers de modelos
    const modelContainers = document.querySelectorAll('.model-container');
    
    modelContainers.forEach(container => {
        // Criar e adicionar loader
        const loader = document.createElement('div');
        loader.className = 'model-loader';
        
        const spinner = document.createElement('div');
        spinner.className = 'loader-spinner';
        
        loader.appendChild(spinner);
        container.appendChild(loader);
        
        // Adicionar tooltip com instruções
        const tooltip = document.createElement('div');
        tooltip.className = 'model-tooltip';
        tooltip.textContent = 'Clique e arraste para girar o modelo';
        container.appendChild(tooltip);
        
        // Remover loader após carregamento do iframe ou modelo
        const iframe = container.querySelector('iframe');
        if (iframe) {
            iframe.addEventListener('load', function() {
                setTimeout(() => {
                    loader.classList.add('hidden');
                }, 1000);
            });
        } else {
            // Para modelos Three.js, remover loader após um tempo
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 3000);
        }
    });
    
    // Adicionar controles para modelos que não são iframes
    const nonIframeModels = document.querySelectorAll('.model-container:not(:has(iframe))');
    
    nonIframeModels.forEach(container => {
        // Criar controles
        const controls = document.createElement('div');
        controls.className = 'model-controls';
        
        // Botão de rotação
        const rotateBtn = document.createElement('button');
        rotateBtn.className = 'model-control-btn';
        rotateBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        rotateBtn.title = 'Alternar rotação automática';
        
        // Botão de zoom in
        const zoomInBtn = document.createElement('button');
        zoomInBtn.className = 'model-control-btn';
        zoomInBtn.innerHTML = '<i class="fas fa-search-plus"></i>';
        zoomInBtn.title = 'Aproximar';
        
        // Botão de zoom out
        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.className = 'model-control-btn';
        zoomOutBtn.innerHTML = '<i class="fas fa-search-minus"></i>';
        zoomOutBtn.title = 'Afastar';
        
        // Botão de reset
        const resetBtn = document.createElement('button');
        resetBtn.className = 'model-control-btn';
        resetBtn.innerHTML = '<i class="fas fa-home"></i>';
        resetBtn.title = 'Resetar visualização';
        
        // Adicionar botões aos controles
        controls.appendChild(rotateBtn);
        controls.appendChild(zoomInBtn);
        controls.appendChild(zoomOutBtn);
        controls.appendChild(resetBtn);
        
        // Adicionar controles ao container
        container.appendChild(controls);
        
        // Adicionar eventos para os botões (serão implementados pelo Three.js)
        rotateBtn.addEventListener('click', function() {
            // Será implementado pelo viewer 3D
            if (window.toggleModelRotation && container.id) {
                window.toggleModelRotation(container.id);
            }
        });
        
        zoomInBtn.addEventListener('click', function() {
            // Será implementado pelo viewer 3D
            if (window.zoomInModel && container.id) {
                window.zoomInModel(container.id);
            }
        });
        
        zoomOutBtn.addEventListener('click', function() {
            // Será implementado pelo viewer 3D
            if (window.zoomOutModel && container.id) {
                window.zoomOutModel(container.id);
            }
        });
        
        resetBtn.addEventListener('click', function() {
            // Será implementado pelo viewer 3D
            if (window.resetModelView && container.id) {
                window.resetModelView(container.id);
            }
        });
    });
    
    // Função para verificar quando os elementos entram na viewport
    function checkVisibility() {
        const windowHeight = window.innerHeight;
        const windowTop = window.scrollY;
        const windowBottom = windowTop + windowHeight;
        
        modelContainers.forEach(container => {
            const elementTop = container.offsetTop;
            const elementBottom = elementTop + container.offsetHeight;
            
            // Verificar se o elemento está visível na viewport
            if (elementBottom > windowTop && elementTop < windowBottom) {
                container.classList.add('visible');
            }
        });
    }
    
    // Adicionar evento de scroll para verificar a visibilidade dos elementos
    window.addEventListener('scroll', checkVisibility);
    
    // Verificar a visibilidade dos elementos quando a página carrega
    checkVisibility();
    
    // Adicionar funcionalidade para botões de tela cheia
    const fullscreenButtons = document.querySelectorAll('.model-buttons a[href*="spline.design"]');
    
    fullscreenButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Abrir em uma nova janela
            e.preventDefault();
            const url = this.getAttribute('href');
            window.open(url, '_blank', 'width=1200,height=800');
        });
    });
});

