# Design System — Rota

Referência visual da aplicação de aluguel de automóveis. O sistema combina títulos com linguagem automotiva, leitura clara de dados e componentes consistentes nos temas claro e escuro.

## Acesso

Com o front-end em execução, abra [a página de componentes](http://localhost:5174/design). Se o Vite usar outra porta, mantenha `/design` no endereço. A referência visual é pública; cadastros, pedidos e contratos exigem autenticação.

O [guia em PDF](../frontend/public/design-system-rota.pdf) tem sete páginas e apresenta a versão clara. Na página, **Exportar PDF** abre a impressão do navegador no tema selecionado; **Baixar este guia em PDF** obtém a versão pronta para download.

## Identidade e tipografia

- **Rajdhani**, pesos 600 e 700: marca textual, títulos, números de destaque e chamadas.
- **Inter**, variável: textos, formulários, tabelas e controles.
- Fontes servidas localmente, com licenças [Rajdhani](../frontend/public/fonts/Rajdhani-OFL.txt) e [Inter](../frontend/public/fonts/Inter-OFL.txt).
- Escala tipográfica: **11, 12, 14, 16, 20, 28, 40 e 60 px**, de informação auxiliar a títulos de destaque.

A marca usa símbolo e nome “rota.”, com versões de contraste adequadas a fundos claros e escuros. Não distorcer o símbolo, reduzir sua legibilidade ou colocá-lo sobre fundos sem contraste.

## Paleta e temas

| Token | Claro | Escuro | Aplicação |
| --- | --- | --- | --- |
| `--color-bg` | `#f3f6f4` | `#091d26` | Fundo da aplicação |
| `--color-surface` | `#ffffff` | `#112c36` | Cartões, diálogos e formulários |
| `--color-surface-alt` | `#edf3ef` | `#173640` | Áreas secundárias |
| `--color-text` | `#1d383f` | `#e4f1ed` | Texto principal |
| `--color-muted` | `#52685d` | `#b0c5ba` | Texto de apoio |
| `--color-primary` | `#246b4f` | `#9ed6aa` | Ação principal |
| `--color-accent` | `#b8d7a6` | `#b7dba5` | Destaques visuais |
| `--color-border` | `#d7e2dc` | `#2d4c52` | Separação de elementos |
| `--color-focus` | `#3f8b64` | `#b6dfaa` | Foco do teclado |

As escalas incluem estados de interação e cores semânticas para sucesso, aviso, informação e erro. Os valores completos ficam em [tokens.css](../frontend/src/tokens.css).

O tema inicial acompanha a preferência do sistema operacional. A escolha manual entre claro e escuro é compartilhada pela aplicação e pela página de componentes, persiste em `rota.theme` e acompanha alterações entre abas. Essa preferência visual é o único dado persistido em `localStorage`; os dados de negócio permanecem na API e no PostgreSQL.

## Espaçamento, bordas e elevação

| Elemento | Escala |
| --- | --- |
| Espaçamento `--space-1` a `--space-10` | 4, 8, 12, 16, 20, 24, 32, 40, 48 e 64 px |
| Raios `sm`, `md`, `lg`, `xl`, `pill` | 4, 8, 12, 20 e 999 px |
| Sombras | `--shadow-sm`, `--shadow-md`, `--shadow-lg` |

Usar espaçamentos menores dentro de controles e grupos relacionados; espaçamentos maiores separam seções. A elevação destaca cartões e diálogos sem substituir a hierarquia dos títulos.

## Componentes e acessibilidade

- Botões primário, secundário, textual e destrutivo, com estados normal, foco, interação e desabilitado.
- Campos com rótulos, instruções e erros associados ao controle; mensagens de resultado anunciadas por tecnologias assistivas.
- Ícones vetoriais consistentes; ações sem texto visível recebem nome acessível.
- Status acompanhados de texto e ícone, preservando o significado além da cor.
- Navegação por teclado, foco visível, diálogos com contenção de foco e fechamento por Escape.
- Contraste verificado por combinação de texto e fundo; manter legibilidade nos dois temas e em telas estreitas.

## Implementação

| Arquivo | Responsabilidade |
| --- | --- |
| [tokens.css](../frontend/src/tokens.css) | Cores, escalas, fontes, bordas e sombras |
| [Theme.jsx](../frontend/src/Theme.jsx) | Preferência de tema e alternância |
| [components.jsx](../frontend/src/components.jsx) | Controles, ícones, marca e diálogos compartilhados |
| [DesignSystem.jsx](../frontend/src/DesignSystem.jsx) | Página de referência, exemplos e exportação |
| [design-utils.js](../frontend/src/design-utils.js) | Cálculo de contraste para as amostras |

Ao alterar a identidade visual, atualizar os tokens, conferir os componentes nos dois temas e revisar a referência visual e suas versões exportadas.
