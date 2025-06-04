// Adiciona funcionalidade de scroll suave para links internos (âncoras)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Adiciona classe 'active' ao link de navegação da página atual
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('header nav ul li a').forEach(link => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage) {
        link.classList.add('active'); // Uma classe 'active' pode ser estilizada no CSS
    }
});

// Exemplo de animação ao rolar (adiciona classe 'visible' quando o elemento entra na viewport)
const observerOptions = {
    root: null, // Relativo à viewport
    rootMargin: '0px',
    threshold: 0.1 // 10% do elemento visível
};

const observerCallback = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Opcional: parar de observar após a primeira vez que for visível
            // observer.unobserve(entry.target);
        }
        // Opcional: remover a classe se sair da viewport
        // else {
        //     entry.target.classList.remove('visible');
        // }
    });
};

const observer = new IntersectionObserver(observerCallback, observerOptions);

// Observar elementos que devem ter animação de fade-in
document.querySelectorAll('section > *, .service-card, .package-card, .team-member, .portfolio-item').forEach(el => {
    observer.observe(el);
});

// Adicionar estilo para a classe .visible e .active no CSS se necessário
/*
Exemplo no style.css:

nav ul li a.active::after {
    width: 100%;
}

section > *, .service-card, .package-card, .team-member, .portfolio-item {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

section > *.visible, .service-card.visible, .package-card.visible, .team-member.visible, .portfolio-item.visible {
    opacity: 1;
    transform: translateY(0);
}

*/

console.log("Webruxo script carregado!");


// Funcionalidade do Menu Mobile Toggle
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        // Opcional: Adicionar animação ao ícone do menu toggle
        menuToggle.classList.toggle('active'); 
    });
}

// Adicionar estilo para .menu-toggle.active no CSS se desejar animação no ícone
/*
Exemplo no responsive.css:

.menu-toggle.active span:nth-child(1) {
    transform: rotate(45deg) translate(5px, 5px);
}
.menu-toggle.active span:nth-child(2) {
    opacity: 0;
}
.menu-toggle.active span:nth-child(3) {
    transform: rotate(-45deg) translate(7px, -6px);
}
.menu-toggle span {
    transition: all 0.3s ease;
}

*/

