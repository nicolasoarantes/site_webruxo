# Plano de Design Visual - Jogo Eggonaldo (Estilo Wander)

## 1. Personagem Principal: Eggonaldo

*   **Modelo 3D:** Low-poly, mantendo a forma de ovo característica, chapéu de mago pontudo (roxo), pernas finas (pretas) e botas arredondadas (amarelas). A simplicidade é chave para performance e estilo.
*   **Textura:** Simples, com cores sólidas ou leve gradiente, baseada na paleta Webruxo (#7D4EDB para o chapéu, #FFD93D para as botas, #FFFFFF ou um creme claro para o corpo, #1C1C1E para pernas e detalhes dos olhos). O rosto será texturizado com olhos grandes e expressivos e bochechas rosadas sutis, como nas referências (`Design sem nome (1).png` e SVG).
*   **Animações (Simples):**
    *   Idle: Leve balanço ou respiração.
    *   Caminhada/Corrida: Movimento das pernas e leve inclinação do corpo.
    *   Pulo: Compressão e extensão do corpo.
    *   Uso do Gancho: Animação do braço (se modelado) ou um efeito partindo do corpo.
*   **Referência Principal:** `Design sem nome (1).png` e `Design sem nome.svg` para o estilo e proporções gerais.

## 2. Ambiente e Plataformas

*   **Estilo:** Low-poly, formas geométricas simples e abstratas (cubos, prismas, planos inclinados) flutuando em um espaço etéreo.
*   **Texturas/Materiais:** Cores sólidas da paleta Webruxo (roxo, azul, amarelo, branco, preto) aplicadas às plataformas. Pode-se usar materiais com leve emissividade ou brilho para um toque mágico. Algumas plataformas podem ter texturas sutis (linhas de código estilizadas, gradientes suaves) para adicionar variedade.
*   **Névoa:** Usar a funcionalidade de névoa do Three.js com cores da paleta (azul claro ou roxo claro) para criar a atmosfera etérea.

## 3. Elementos Interativos

*   **Checkpoints:** Cristais low-poly translúcidos (cor azul ou amarela) ou um pequeno totem/plataforma com o logo simplificado da Webruxo (um 'W' estilizado ou a silhueta do chapéu do Eggonaldo).
*   **Colecionáveis ("Faíscas Criativas"):** Esferas pequenas e brilhantes (amarelas ou roxas) com um efeito de partícula suave.
*   **Gancho Mágico:** Um feixe de luz/energia (roxo ou amarelo) disparado por Eggonaldo, com um efeito de partícula na ponta ou ao longo do feixe.
*   **Pontos de Ancoragem:** Pequenos marcadores visuais nas plataformas onde o gancho pode se prender (talvez um brilho sutil ou um símbolo rúnico simples).
*   **Portal Final:** Uma estrutura maior, talvez um arco ou portal circular com efeitos de partículas e cores vibrantes da Webruxo, representando a chegada à "Guilda".

## 4. Interface (UI)

*   **Controles Mobile:** Botões semi-transparentes com ícones simples (seta para pulo, ícone de gancho) ou um joystick virtual discreto. Posicionados de forma a não obstruir muito a visão.
*   **Contador de Colecionáveis:** Texto simples no canto da tela.
*   **Indicador de Carga do Gancho (se aplicável):** Barra simples como no Wander, usando cores da Webruxo.
*   **Fonte:** Usar uma fonte web limpa e legível, alinhada com a identidade visual do site.

## 5. Considerações Técnicas

*   Manter a contagem de polígonos baixa para todos os modelos.
*   Otimizar texturas (tamanho e formato).
*   Usar iluminação simples (luz ambiente e talvez uma direcional).
*   Focar em shaders e materiais eficientes do Three.js.

Este plano visual servirá como guia para a criação dos assets na próxima etapa.
