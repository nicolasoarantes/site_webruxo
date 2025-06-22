// Script para filtrar os itens do portfólio

document.addEventListener('DOMContentLoaded', function() {
    // Seleciona todos os botões de filtro e itens do portfólio
    const filterButtons = document.querySelectorAll('.portfolio-filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    // Adiciona evento de clique para cada botão de filtro
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove a classe 'active' de todos os botões
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Adiciona a classe 'active' ao botão clicado
            this.classList.add('active');
            
            // Obtém o valor do filtro do atributo data-filter
            const filterValue = this.getAttribute('data-filter');
            
            // Filtra os itens do portfólio
            portfolioItems.forEach(item => {
                // Se o filtro for 'all', mostra todos os itens
                if (filterValue === 'all') {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 100);
                } else {
                    // Verifica se o item pertence à categoria selecionada
                    if (item.getAttribute('data-category') === filterValue) {
                        item.style.display = 'block';
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        }, 100);
                    } else {
                        item.style.opacity = '0';
                        item.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            item.style.display = 'none';
                        }, 300);
                    }
                }
            });
        });
    });
    
    // Animação de entrada para os itens do portfólio
    function animatePortfolioItems() {
        portfolioItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('visible');
            }, 100 * index);
        });
    }
    
    // Inicia a animação quando a página carrega
    animatePortfolioItems();
    
    // Função para verificar quando os elementos entram na viewport
    function checkVisibility() {
        const windowHeight = window.innerHeight;
        const windowTop = window.scrollY;
        const windowBottom = windowTop + windowHeight;
        
        portfolioItems.forEach(item => {
            const elementTop = item.offsetTop;
            const elementBottom = elementTop + item.offsetHeight;
            
            // Verifica se o elemento está visível na viewport
            if (elementBottom > windowTop && elementTop < windowBottom) {
                item.classList.add('visible');
            }
        });
    }
    
    // Adiciona evento de scroll para verificar a visibilidade dos elementos
    window.addEventListener('scroll', checkVisibility);
    
    // Verifica a visibilidade dos elementos quando a página carrega
    checkVisibility();
});

// Efeito de hover para as imagens do portfólio
document.addEventListener('DOMContentLoaded', function() {
    const portfolioImages = document.querySelectorAll('.portfolio-image');
    
    portfolioImages.forEach(image => {
        image.addEventListener('mouseenter', function() {
            const img = this.querySelector('img');
            if (img) {
                img.style.transform = 'scale(1.05)';
            }
        });
        
        image.addEventListener('mouseleave', function() {
            const img = this.querySelector('img');
            if (img) {
                img.style.transform = 'scale(1)';
            }
        });
    });
});

