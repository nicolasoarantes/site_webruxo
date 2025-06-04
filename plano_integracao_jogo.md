# Plano de Integração do Jogo Eggonaldo ao Site da Webruxo

## Análise da Situação Atual

- O site institucional da Webruxo já possui uma estrutura bem definida com páginas para Home, Serviços, Cases e Contato
- Já existe uma entrada no menu de navegação para "Jogo Eggonaldo" que aponta para `new_game/jogo.html`
- Existe um arquivo `jogo.html` na raiz que contém uma versão anterior do jogo
- A versão mais recente e aprimorada do jogo está na pasta `new_game` com melhorias como:
  - Controle de câmera com mouse
  - Sistema de grappling hook refinado
  - Estética retro moderna
  - Correções de bugs de colisão

## Estratégia de Integração

### 1. Estrutura de Arquivos e Navegação

- Manter a entrada "Jogo Eggonaldo" no menu de navegação principal
- Atualizar o arquivo `jogo.html` na raiz para redirecionar ou incorporar a versão mais recente do jogo
- Preservar a estrutura de navegação consistente em todas as páginas

### 2. Abordagem de Implementação

**Opção escolhida: Página dedicada com introdução e iframe**

Esta abordagem oferece o melhor equilíbrio entre:
- Manter a identidade visual do site
- Fornecer contexto sobre o jogo antes da experiência imersiva
- Permitir que o jogo funcione em tela cheia sem interferências
- Facilitar atualizações futuras do jogo

### 3. Layout da Página do Jogo

A página `jogo.html` atualizada terá:

1. **Seção de Introdução**:
   - Título e descrição do jogo
   - História do Eggonaldo (personagem mascote)
   - Instruções de controle (desktop e mobile)
   - Botão para iniciar o jogo em tela cheia

2. **Seção de Jogo Incorporado**:
   - Iframe responsivo contendo o jogo
   - Opção para jogar em tela cheia
   - Indicadores visuais de carregamento

3. **Seção de Desenvolvimento**:
   - Breve explicação sobre como o jogo foi desenvolvido
   - Conexão com a identidade da Webruxo
   - Call-to-action para contato

### 4. Responsividade

- Garantir que a página do jogo seja totalmente responsiva
- Adaptar controles e instruções para dispositivos móveis
- Ajustar tamanho do iframe conforme o dispositivo

### 5. Performance

- Otimizar carregamento da página
- Carregar o jogo apenas quando solicitado pelo usuário
- Fornecer feedback visual durante o carregamento

## Implementação Técnica

1. Atualizar o arquivo `jogo.html` na raiz com o novo layout
2. Criar links adequados para a versão mais recente do jogo
3. Garantir que todos os scripts e estilos necessários sejam carregados
4. Manter consistência com o design do site institucional
5. Testar em múltiplos dispositivos e navegadores

## Próximos Passos

1. Adaptar o layout e navegação conforme este plano
2. Integrar o jogo melhorado preservando o conteúdo institucional
3. Validar o funcionamento em todos os dispositivos
4. Reportar e enviar o site atualizado ao usuário
