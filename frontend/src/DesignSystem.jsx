import { useEffect, useId, useRef, useState } from "react";
import {
  CarArt,
  Empty,
  Icon,
  Logo,
  Modal,
  SelectField,
  Status,
  SubmitButton,
  TextField,
} from "./components.jsx";
import { ThemeToggle, useTheme } from "./Theme.jsx";
import { contrastRatio } from "./design-utils.js";
import "./design-system.css";

const colors = [
  ["--color-bg", "Fundo", "Plano geral da aplicação"],
  ["--color-surface", "Superfície", "Cards, formulários e tabelas"],
  ["--color-text", "Texto", "Informação principal"],
  ["--color-muted", "Texto de apoio", "Contexto e descrições"],
  ["--color-primary", "Ação principal", "Ações que fazem o fluxo avançar"],
  ["--color-accent", "Destaque", "Identidade e elementos de apoio"],
  ["--color-border", "Contorno", "Separação entre elementos"],
  ["--color-danger", "Atenção", "Erros e ações destrutivas"],
];
const greenScale = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
const spacing = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64];
const sections = [
  ["identidade", "Identidade"],
  ["cores", "Cores"],
  ["tipografia", "Tipografia"],
  ["estrutura", "Estrutura"],
  ["componentes", "Componentes"],
  ["acessibilidade", "Acessibilidade"],
];
const iconNames = [
  "car",
  "file",
  "users",
  "user",
  "shield",
  "wallet",
  "calendar",
  "clock",
  "search",
  "plus",
  "edit",
  "trash",
  "check",
  "close",
  "arrow",
  "logout",
  "sun",
  "moon",
];
const iconLabels = [
  "Automóvel",
  "Pedido",
  "Clientes",
  "Perfil",
  "Contrato",
  "Crédito",
  "Calendário",
  "Andamento",
  "Buscar",
  "Adicionar",
  "Editar",
  "Excluir",
  "Confirmar",
  "Fechar",
  "Avançar",
  "Sair",
  "Tema claro",
  "Tema escuro",
];

function SectionHeading({ number, title, children }) {
  return (
    <div className="ds-section-heading">
      <span className="ds-section-number">{number}</span>
      <div>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
    </div>
  );
}

export default function DesignSystem() {
  const { theme, setTheme } = useTheme();
  const probes = useRef({});
  const [palettes, setPalettes] = useState({ light: {}, dark: {} });
  const [notice, setNotice] = useState("");
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Econômico" });
  const [busy, setBusy] = useState(false);
  const timer = useRef(null);
  const previewId = useId();
  useEffect(() => {
    document.title = "Design system | Rota";
    const tokens = [
      ...colors.map(([name]) => name),
      "--color-primary-contrast",
      "--color-focus",
      ...greenScale.map((step) => `--brand-green-${step}`),
    ];
    const next = {};
    for (const mode of ["light", "dark"]) {
      const style = getComputedStyle(probes.current[mode]);
      next[mode] = Object.fromEntries(
        tokens.map((token) => [token, style.getPropertyValue(token).trim()]),
      );
    }
    setPalettes(next);
  }, [theme]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(id);
  }, [notice]);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copy(value) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${value} copiado.`);
    } catch {
      setNotice(`Valor da cor: ${value}`);
    }
  }
  function submit(event) {
    event.preventDefault();
    setBusy(true);
    timer.current = setTimeout(() => {
      setBusy(false);
      setNotice("Exemplo de formulário validado.");
    }, 650);
  }
  const current = palettes[theme];
  return (
    <div className="ds-root">
      <div className="ds-probes" aria-hidden="true">
        {["light", "dark"].map((mode) => (
          <span
            key={mode}
            data-theme={mode}
            ref={(node) => {
              probes.current[mode] = node;
            }}
          />
        ))}
      </div>
      <a className="skip-link" href="#ds-main">
        Pular para o conteúdo
      </a>
      <header className="ds-header">
        <div className="ds-header-inner">
          <a
            href="/"
            className="ds-brand"
            aria-label="Rota — voltar ao sistema"
          >
            <Logo />
          </a>
          <span className="ds-header-divider" />
          <span className="ds-header-title">DESIGN SYSTEM</span>
          <nav aria-label="Seções do design system">
            {sections.slice(0, 3).map(([id, label]) => (
              <a key={id} href={`#${id}`}>
                {label}
              </a>
            ))}
          </nav>
          <div className="ds-header-actions">
            <ThemeToggle compact />
            <button
              type="button"
              className="button button-primary ds-export"
              onClick={() => window.print()}
            >
              <Icon name="file" size={17} />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </header>
      <main id="ds-main" tabIndex={-1} className="ds-container">
        <section className="ds-hero">
          <div className="ds-hero-copy">
            <span className="ds-kicker">
              <span />
              IDENTIDADE EM MOVIMENTO
            </span>
            <h1>
              Uma direção.
              <br />
              <span>Em cada detalhe.</span>
            </h1>
            <p>
              O sistema visual da Rota. Fundamentos e componentes para conectar
              pessoas, automóveis e novos caminhos.
            </p>
            <div className="ds-hero-actions">
              <a className="button button-primary" href="#componentes">
                Explorar componentes
                <Icon name="arrow" size={17} />
              </a>
              <a className="button button-secondary" href="/">
                Acessar o sistema
                <Icon name="car" size={17} />
              </a>
            </div>
            <div className="ds-hero-specs">
              <span>
                <strong>02</strong> temas
              </span>
              <span>
                <strong>02</strong> famílias tipográficas
              </span>
              <span>
                <strong>04px</strong> módulo de espaçamento
              </span>
            </div>
          </div>
          <div className="ds-hero-art" aria-hidden="true">
            <div className="ds-art-coordinate">ROTA / VISUAL SYSTEM</div>
            <div className="ds-art-rings" />
            <div className="ds-art-road" />
            <CarArt tone="var(--color-accent)" large />
            <div className="ds-art-caption">
              <span>CLAREZA EM CADA ETAPA.</span>
              <span>01 — 06</span>
            </div>
          </div>
        </section>
        <nav className="ds-section-nav" aria-label="Índice completo">
          {sections.map(([id, label], index) => (
            <a href={`#${id}`} key={id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {label}
            </a>
          ))}
        </nav>

        <section id="identidade" className="ds-section">
          <SectionHeading number="01" title="Uma marca, muitos caminhos.">
            A letra R encontra a ideia de percurso: simples de reconhecer,
            consistente em qualquer contexto.
          </SectionHeading>
          <div className="ds-brand-grid">
            <div className="ds-brand-card" data-theme="light">
              <span className="ds-card-label">MARCA PRINCIPAL / CLARO</span>
              <Logo />
              <p>Azul-petróleo, presença e clareza.</p>
            </div>
            <div className="ds-brand-card" data-theme="dark">
              <span className="ds-card-label">MARCA PRINCIPAL / ESCURO</span>
              <Logo />
              <p>Contraste para continuar em movimento.</p>
            </div>
          </div>
          <div className="ds-brand-notes">
            <div>
              <h3>Área de proteção</h3>
              <p>
                Reserve ao redor da marca uma distância mínima equivalente à
                metade da altura do símbolo. Preserve suas proporções.
              </p>
            </div>
            <div>
              <h3>Redução</h3>
              <p>
                Use o símbolo a partir de 24 px. A assinatura completa funciona
                a partir de 100 px de largura.
              </p>
            </div>
            <a
              href="/rota.svg"
              download="rota-simbolo.svg"
              className="button button-secondary"
            >
              <Icon name="file" size={17} />
              Baixar símbolo SVG
            </a>
          </div>
        </section>

        <section id="cores" className="ds-section">
          <SectionHeading number="02" title="Cores com uma função.">
            Verde-esmeralda e azul-petróleo formam uma base análoga no círculo
            cromático. Neutros organizam o conteúdo; cores de estado comunicam o
            andamento.
          </SectionHeading>
          <div className="ds-colors-layout">
            <div className="ds-color-grid">
              {colors.map(([token, label, usage]) => (
                <button
                  type="button"
                  className="ds-color-card"
                  key={token}
                  onClick={() => copy(current[token] || token)}
                  aria-label={`Copiar cor ${label}`}
                >
                  <span
                    className="ds-color-sample"
                    style={{ background: `var(${token})` }}
                  />
                  <span className="ds-color-content">
                    <strong>{label}</strong>
                    <code>{current[token] || "—"}</code>
                    <small>{usage}</small>
                  </span>
                </button>
              ))}
            </div>
            <aside className="ds-harmony">
              <div className="ds-color-wheel" aria-hidden="true">
                <span className="ds-wheel-center" />
                <i className="ds-wheel-marker marker-green" />
                <i className="ds-wheel-marker marker-blue" />
              </div>
              <h3>Harmonia análoga</h3>
              <p>
                Do verde ao azul: uma transição associada à confiança, à
                orientação e ao movimento.
              </p>
              <div className="ds-harmony-key">
                <span>
                  <i />
                  Verde-esmeralda
                </span>
                <span>
                  <i />
                  Azul-petróleo
                </span>
              </div>
            </aside>
          </div>
          <div className="ds-scale-title">
            <h3>Escala cromática do verde</h3>
            <span>Da superfície ao contraste.</span>
          </div>
          <div className="ds-color-scale">
            {greenScale.map((step) => {
              const value = current[`--brand-green-${step}`];
              const foreground =
                (contrastRatio(value, "#ffffff") || 0) >= 4.5
                  ? "#ffffff"
                  : "#091d26";
              return (
                <button
                  key={step}
                  type="button"
                  style={{
                    background: `var(--brand-green-${step})`,
                    color: foreground,
                  }}
                  onClick={() => copy(value || `--brand-green-${step}`)}
                  aria-label={`Copiar verde ${step}`}
                >
                  <strong>{step}</strong>
                  <span>{value || "—"}</span>
                </button>
              );
            })}
          </div>
          <div className="ds-theme-comparison">
            {["light", "dark"].map((mode) => (
              <div key={mode} data-theme={mode} className="ds-theme-card">
                <span className="ds-card-label">
                  {mode === "light" ? "TEMA CLARO" : "TEMA ESCURO"}
                </span>
                <h3>
                  O mesmo sistema.
                  <br />
                  Outra atmosfera.
                </h3>
                <p>
                  Superfícies, textos, contornos e ações respondem ao tema,
                  mantendo suas funções.
                </p>
                <div className="ds-demo-actions">
                  <button
                    className="button button-primary"
                    type="button"
                    onClick={() => setTheme(mode)}
                  >
                    Usar este tema
                    <Icon name={mode === "light" ? "sun" : "moon"} size={16} />
                  </button>
                  <Status value="APPROVED" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="tipografia" className="ds-section">
          <SectionHeading number="03" title="Precisão também se lê.">
            Rajdhani traz a linguagem angular do universo automotivo. Inter
            sustenta a leitura de dados, formulários e contratos.
          </SectionHeading>
          <div className="ds-type-grid">
            <article className="ds-type-card ds-display-type">
              <span className="ds-card-label">TÍTULOS / RAJDHANI</span>
              <div className="ds-type-large">Aa</div>
              <h3>
                Direção.
                <br />
                Presença.
                <br />
                Movimento.
              </h3>
              <p>Semibold 600 · Bold 700</p>
              <div className="ds-alphabet">
                ABCDEFGHIJKLMNOPQRSTUVWXYZ
                <br />
                abcdefghijklmnopqrstuvwxyz
                <br />
                0123456789 · ÁÉÍÓÚ ÃÕ Ç
              </div>
            </article>
            <article className="ds-type-card ds-body-type">
              <span className="ds-card-label">INTERFACE / INTER</span>
              <div className="ds-type-large">Aa</div>
              <h3>
                Informação clara.
                <br />
                Leitura confortável.
              </h3>
              <p>Regular 400 · Medium 500 · Semibold 600 · Bold 700</p>
              <div className="ds-reading-sample">
                Seu próximo caminho começa com uma escolha. Consulte a frota,
                confira as condições e acompanhe cada etapa do aluguel em um só
                lugar.
              </div>
              <div className="ds-alphabet">
                R$ 150,00 / diária
                <br />
                10 a 13 de novembro de 2026
                <br />
                Pedido aprovado
              </div>
            </article>
          </div>
          <div className="ds-type-scale">
            {[
              [
                "Display",
                "--font-size-display",
                "60 px",
                "Seu próximo caminho",
              ],
              ["Título de página", "--font-size-3xl", "40 px", "Nossa frota"],
              [
                "Título de seção",
                "--font-size-2xl",
                "28 px",
                "Pedidos de aluguel",
              ],
              [
                "Título de componente",
                "--font-size-xl",
                "20 px",
                "Análise financeira",
              ],
              [
                "Texto de interface",
                "--font-size-base",
                "14 px",
                "Escolha o automóvel e o período.",
              ],
              [
                "Legenda",
                "--font-size-sm",
                "12 px",
                "Informações atualizadas do cadastro.",
              ],
            ].map(([label, token, size, sample]) => (
              <div key={token}>
                <span>
                  {label}
                  <small>{size}</small>
                </span>
                <p
                  style={{
                    "--type-size": `var(${token})`,
                    fontSize: `var(${token})`,
                    fontFamily:
                      token === "--font-size-base" || token === "--font-size-sm"
                        ? "var(--font-body)"
                        : "var(--font-display)",
                    fontWeight:
                      token === "--font-size-base" || token === "--font-size-sm"
                        ? 400
                        : 600,
                  }}
                >
                  {sample}
                </p>
              </div>
            ))}
          </div>
          <p className="ds-footnote">
            Fontes locais em WOFF2, com suporte ao português. Licenças SIL Open
            Font License incluídas no projeto.
          </p>
        </section>

        <section id="estrutura" className="ds-section">
          <SectionHeading number="04" title="Ritmo, espaço e hierarquia.">
            Um módulo de 4 px organiza os intervalos. Contornos suaves aproximam
            os elementos; sombras indicam a elevação.
          </SectionHeading>
          <div className="ds-structure-grid">
            <article className="ds-panel">
              <h3>Espaçamento</h3>
              <div className="ds-spacing">
                {spacing.map((value, index) => (
                  <div key={value}>
                    <code>space-{index + 1}</code>
                    <span style={{ width: `var(--space-${index + 1})` }} />
                    <small>{value} px</small>
                  </div>
                ))}
              </div>
            </article>
            <article className="ds-panel">
              <h3>Arredondamentos</h3>
              <div className="ds-radius-grid">
                {[
                  ["sm", 4],
                  ["md", 8],
                  ["lg", 12],
                  ["xl", 20],
                ].map(([name, value]) => (
                  <div key={name}>
                    <span style={{ borderRadius: `var(--radius-${name})` }} />
                    <strong>{name}</strong>
                    <small>{value} px</small>
                  </div>
                ))}
              </div>
              <h3 className="ds-shadow-title">Elevação</h3>
              <div className="ds-shadows">
                {["sm", "md", "lg"].map((name) => (
                  <span
                    key={name}
                    style={{ boxShadow: `var(--shadow-${name})` }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </article>
          </div>
          <div className="ds-rule">
            <Icon name="grid" size={22} />
            <p>
              Na interface, mantenha proximidade entre informações relacionadas
              e use intervalos maiores para separar decisões, grupos e etapas.
            </p>
          </div>
        </section>

        <section id="componentes" className="ds-section">
          <SectionHeading number="05" title="Um repertório em comum.">
            Os mesmos componentes utilizados nos pedidos, na frota e nos
            contratos. Experimente seus estados e interações.
          </SectionHeading>
          <div className="ds-components-grid">
            <article className="ds-panel">
              <span className="ds-card-label">AÇÕES</span>
              <h3>Botões e hierarquia</h3>
              <div className="ds-button-examples">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => setNotice("Ação principal selecionada.")}
                >
                  Ação principal
                  <Icon name="arrow" size={16} />
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setNotice("Ação secundária selecionada.")}
                >
                  Ação secundária
                </button>
                <button
                  type="button"
                  className="button button-text"
                  onClick={() => setNotice("Ação de apoio selecionada.")}
                >
                  Ação de apoio
                  <Icon name="arrow" size={16} />
                </button>
                <button
                  type="button"
                  className="button button-danger"
                  onClick={() => setDialog(true)}
                >
                  <Icon name="trash" size={16} />
                  Ação destrutiva
                </button>
                <button
                  type="button"
                  className="button button-primary"
                  disabled
                >
                  Indisponível
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Exemplo: editar"
                  onClick={() => setNotice("Ação de editar selecionada.")}
                >
                  <Icon name="edit" />
                </button>
              </div>
              <p>
                Use uma ação principal por grupo. Ações destrutivas exigem
                confirmação; ícones isolados recebem nome acessível.
              </p>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setDialog(true)}
              >
                Pré-visualizar diálogo
                <Icon name="file" size={16} />
              </button>
            </article>
            <article className="ds-panel">
              <span className="ds-card-label">ENTRADA DE DADOS</span>
              <h3>Formulários</h3>
              <form onSubmit={submit}>
                <TextField
                  label="Identificação"
                  placeholder="Ex.: matrícula do automóvel"
                  name={`${previewId}-name`}
                  required
                  maxLength={60}
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  disabled={busy}
                />
                <SelectField
                  label="Categoria"
                  name={`${previewId}-category`}
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                  disabled={busy}
                >
                  <option>Econômico</option>
                  <option>Sedan</option>
                  <option>SUV</option>
                </SelectField>
                <TextField
                  label="Campo indisponível"
                  value="Valor somente para consulta"
                  disabled
                  readOnly
                />
                <SubmitButton busy={busy}>Testar formulário</SubmitButton>
              </form>
            </article>
            <article className="ds-panel ds-status-panel">
              <span className="ds-card-label">COMUNICAÇÃO</span>
              <h3>Estados do pedido</h3>
              <div className="ds-statuses">
                {[
                  "PENDING",
                  "APPROVED",
                  "REJECTED",
                  "CONTRACTED",
                  "CANCELLED",
                ].map((value) => (
                  <Status key={value} value={value} />
                ))}
              </div>
              <p>
                Cor e texto trabalham juntos: o significado permanece
                compreensível sem depender apenas da cor.
              </p>
              <div className="ds-state-example">
                <Icon name="info" size={20} />
                <span>
                  <strong>Informação próxima da decisão.</strong>
                  <small>
                    Explique o estado atual e indique o próximo passo.
                  </small>
                </span>
              </div>
            </article>
            <article className="ds-panel ds-empty-panel">
              <span className="ds-card-label">AUSÊNCIA DE RESULTADOS</span>
              <Empty
                icon="car"
                title="Nenhum automóvel encontrado"
                text="Altere os filtros para consultar outras opções."
              >
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setNotice("Filtros de exemplo limpos.")}
                >
                  Limpar filtros
                  <Icon name="search" size={16} />
                </button>
              </Empty>
            </article>
          </div>
          <div className="ds-panel ds-icon-panel">
            <div>
              <span className="ds-card-label">ICONOGRAFIA</span>
              <h3>Claros na forma e na intenção.</h3>
              <p>
                Ícones SVG com traço consistente. Use texto de apoio quando a
                ação não for evidente.
              </p>
            </div>
            <div className="ds-icons">
              {iconNames.map((name, index) => (
                <div key={name}>
                  <Icon name={name} size={24} />
                  <span>{iconLabels[index]}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="acessibilidade" className="ds-section">
          <SectionHeading
            number="06"
            title="Uma experiência para seguir junto."
          >
            Contraste, foco e mensagens claras fazem parte da interface desde a
            escolha das cores.
          </SectionHeading>
          <div className="ds-access-grid">
            <article className="ds-panel">
              <h3>Contraste dos temas</h3>
              <p>
                Relações calculadas a partir dos tokens em uso. Referência:
                4,5:1 para texto normal e 3:1 para o indicador de foco.
              </p>
              <div className="table-scroll ds-contrast-table">
                <table>
                  <thead>
                    <tr>
                      <th>Aplicação</th>
                      <th>Claro</th>
                      <th>Escuro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [
                        "Texto principal",
                        "--color-text",
                        "--color-surface",
                        4.5,
                      ],
                      [
                        "Texto de apoio",
                        "--color-muted",
                        "--color-surface",
                        4.5,
                      ],
                      [
                        "Botão principal",
                        "--color-primary-contrast",
                        "--color-primary",
                        4.5,
                      ],
                      [
                        "Indicador de foco",
                        "--color-focus",
                        "--color-surface",
                        3,
                      ],
                    ].map(([label, fg, bg, minimum]) => (
                      <tr key={fg}>
                        <td>{label}</td>
                        {["light", "dark"].map((mode) => {
                          const ratio = contrastRatio(
                            palettes[mode][fg],
                            palettes[mode][bg],
                          );
                          return (
                            <td key={mode}>
                              <span
                                className="ds-contrast-score"
                                data-pass={ratio !== null && ratio >= minimum}
                              >
                                {ratio === null ? "—" : `${ratio.toFixed(2)}:1`}
                                <Icon
                                  name={
                                    ratio !== null && ratio >= minimum
                                      ? "check"
                                      : "info"
                                  }
                                  size={14}
                                />
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
            <article className="ds-panel ds-guidelines">
              <h3>Diretrizes de interação</h3>
              <ul>
                <li>
                  <Icon name="check" size={18} />
                  <span>
                    <strong>Navegação por teclado</strong>Tab e Shift+Tab
                    percorrem os controles; Escape fecha menus e diálogos.
                  </span>
                </li>
                <li>
                  <Icon name="check" size={18} />
                  <span>
                    <strong>Foco visível</strong>O indicador de foco permanece
                    perceptível nos dois temas.
                  </span>
                </li>
                <li>
                  <Icon name="check" size={18} />
                  <span>
                    <strong>Formulários identificados</strong>Rótulos,
                    instruções e erros são associados aos campos.
                  </span>
                </li>
                <li>
                  <Icon name="check" size={18} />
                  <span>
                    <strong>Estados compreensíveis</strong>Mensagens e texto
                    complementam cores e ícones.
                  </span>
                </li>
                <li>
                  <Icon name="check" size={18} />
                  <span>
                    <strong>Movimento reduzido</strong>Respeite a preferência do
                    dispositivo por menos animação.
                  </span>
                </li>
              </ul>
            </article>
          </div>
          <div className="ds-access-footer">
            <a
              href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html"
              target="_blank"
              rel="noreferrer"
            >
              Referência de contraste · WCAG 2.2
              <Icon name="arrow" size={15} />
            </a>
            <span>
              Teste os componentes nos dois temas e em diferentes larguras.
            </span>
          </div>
        </section>

        <section className="ds-closing">
          <div>
            <Logo />
            <h2>
              Consistência para
              <br />
              ir mais longe.
            </h2>
            <p>Consulte este guia ao criar ou revisar uma tela da Rota.</p>
          </div>
          <div className="ds-closing-actions">
            <a className="button button-primary" href="/">
              Abrir a aplicação
              <Icon name="arrow" size={17} />
            </a>
            <a
              className="button button-secondary"
              href="/design-system-rota.pdf"
              download
            >
              <Icon name="file" size={17} />
              Baixar este guia em PDF
            </a>
          </div>
        </section>
        <footer className="ds-footer">
          <span>ROTA · SISTEMA DE ALUGUEL DE AUTOMÓVEIS</span>
          <a href="#ds-main">
            Voltar ao início
            <Icon name="arrow" size={15} />
          </a>
        </footer>
      </main>
      {notice && (
        <div className="toast ds-notice" role="status">
          <span>
            <Icon name="check" size={17} />
          </span>
          {notice}
          <button
            className="icon-button"
            aria-label="Fechar aviso"
            onClick={() => setNotice("")}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      {dialog && (
        <Modal
          title="Confirmar ação"
          description="Exemplo de diálogo de confirmação."
          onClose={() => setDialog(false)}
        >
          <div className="form-content">
            <p>
              Apresente o efeito da ação antes de pedir a confirmação. Mantenha
              uma alternativa clara para voltar.
            </p>
          </div>
          <div className="form-footer">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setDialog(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="button button-danger"
              onClick={() => {
                setDialog(false);
                setNotice("Exemplo confirmado.");
              }}
            >
              Confirmar exemplo
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
