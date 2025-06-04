# Plano de Redesign Visual - Jogo Eggonaldo Wander (Retrô Moderno)

Este documento detalha o plano para o redesign visual do jogo Eggonaldo Wander, seguindo o feedback do usuário para um estilo "retrô moderno" com boa distribuição de cores e texturas.

## 1. Conceito Visual Geral

O objetivo é criar uma estética que combine elementos nostálgicos de jogos retrô (low-poly, formas geométricas simples, talvez pixel art sutil) com técnicas visuais modernas (iluminação dinâmica, paleta de cores vibrante e equilibrada, animações fluidas).

*   **Inspiração:** Jogos indie modernos com estética retrô, synthwave, vaporwave, combinado com a identidade visual da Webruxo.
*   **Sensação:** Mágico, tecnológico, divertido, limpo e estiloso.

## 2. Paleta de Cores

*   **Primárias (Base Webruxo):** Roxo Webruxo (`#6a1b9a` ou similar) e Amarelo Ouro (`#FFD93D` ou similar) para Eggonaldo e elementos de destaque.
*   **Secundárias (Ambiente):** Tons de cinza azulado ou neutro para plataformas base, com variações para indicar diferentes tipos ou áreas.
*   **Acentos (Retrô Moderno):** Teal (`#00FFFF`), Magenta (`#FF00FF`), Laranja (`#FFA500`) para colecionáveis, efeitos visuais (gancho, pulo), UI e detalhes do ambiente.
*   **Fundo:** Gradientes suaves de azul escuro para roxo, ou um céu estrelado estilizado para reforçar o tema mágico/espacial.
*   **Contraste:** Garantir bom contraste entre personagem, plataformas, colecionáveis e fundo para legibilidade.

## 3. Texturas e Materiais

*   **Estilo:** Predominantemente materiais lisos (MeshStandardMaterial ou MeshLambertMaterial em Three.js) com cores sólidas ou gradientes sutis.
*   **Texturas Sutis:** Aplicar texturas simples e estilizadas em algumas superfícies para adicionar interesse visual sem sobrecarregar. Exemplos:
    *   Leve padrão de scanlines ou dithering em algumas plataformas.
    *   Textura de "hachura" sutil no chapéu do Eggonaldo, como na referência.
    *   Efeitos de emissão de luz para colecionáveis ou pontos de interação.
*   **Evitar:** Texturas fotorrealistas ou complexas.

## 4. Modelo do Personagem (Eggonaldo)

*   **Base:** Manter a forma de cápsula/ovo simples e icônica.
*   **Refinamentos:**
    *   Aplicar a paleta de cores definida (corpo branco/creme, chapéu roxo, sapatos amarelos).
    *   Adicionar a textura de hachura sutil ao chapéu.
    *   Implementar animações simples para idle, corrida, pulo e uso do gancho (squash and stretch, rotação sutil).
    *   Considerar um leve efeito de "rastro" ou partícula ao se mover rapidamente ou usar o gancho.

## 5. Ambiente e Plataformas

*   **Formas:** Manter formas geométricas simples e limpas para as plataformas (cubos, retângulos, cilindros).
*   **Variação:** Introduzir variações visuais sutis para diferentes tipos de plataformas (ex: plataformas móveis com cor de acento, plataformas quebradiças com textura diferente).
*   **Elementos de Fundo:** Adicionar elementos geométricos flutuantes simples no fundo para dar profundidade, usando cores da paleta secundária e de acento.
*   **Integração Webruxo:** Incorporar sutilmente elementos da marca, como formas inspiradas no logo ou a paleta de cores em áreas específicas ou colecionáveis.

## 6. UI (Interface do Usuário)

*   **Tela Inicial/Instruções:** Caixa de texto com fundo semitransparente, usando uma fonte pixelada legível ou uma fonte sans-serif limpa. Usar cores da paleta para texto e bordas.
*   **Menu de Opções/Remapeamento:** Design consistente com a tela inicial. Botões claros, feedback visual ao selecionar/alterar teclas.
*   **HUD (se houver):** Manter minimalista. Exibir pontuação/colecionáveis de forma discreta.
*   **Controles Mobile:** Botões com design limpo, usando cores de acento e ícones claros (seta para pulo, gancho para grappling hook).

## 7. Iluminação e Efeitos

*   **Iluminação Principal:** Uma luz direcional suave para criar sombras básicas e dar volume.
*   **Luz Ambiente:** Para garantir que as áreas escuras não fiquem completamente pretas.
*   **Efeitos:**
    *   Pequenos efeitos de partículas para pulo, aterrissagem e coleta de itens.
    *   Linha visual clara para o grappling hook quando disparado.
    *   Possível efeito de bloom sutil para elementos brilhantes (opcional, avaliar performance).

Este plano servirá como guia para a implementação do redesign visual, buscando um equilíbrio entre a estética retrô e a clareza moderna, alinhado à identidade da Webruxo.
