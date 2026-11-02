import { useCallback, useEffect, useState } from "react";
import Auth from "./Auth.jsx";
import { api } from "./api.js";
import {
  CarArt,
  Empty,
  ErrorMessage,
  FormShell,
  Icon,
  Logo,
  Modal,
  Status,
  date,
  money,
  roleLabel,
  statuses,
} from "./components.jsx";
import {
  ContractForm,
  OrderForm,
  ProfileForm,
  ReviewForm,
  VehicleForm,
} from "./forms.jsx";

const initialData = {
  vehicles: [],
  orders: [],
  contracts: [],
  clients: [],
  profile: null,
};
const titles = {
  dashboard: ["Visão geral", "Um bom caminho começa com tudo organizado."],
  orders: [
    "Pedidos de aluguel",
    "Acompanhe cada etapa, do pedido à contratação.",
  ],
  vehicles: ["Nossa frota", "Encontre o automóvel para o seu próximo destino."],
  contracts: ["Contratos", "Todos os detalhes dos aluguéis contratados."],
  clients: ["Clientes", "Cadastros e informações para uma análise completa."],
  profile: ["Meu cadastro", "Mantenha seus dados e rendimentos atualizados."],
};

function getPage() {
  return window.location.hash.slice(1) || "dashboard";
}
export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState(getPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [toast, setToast] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const isAgent = user?.role === "BANK" || user?.role === "COMPANY";
  useEffect(() => {
    let active = true;
    api("/auth/me")
      .then((result) => {
        if (active) setUser(result);
      })
      .catch((err) => {
        if (active && err.status !== 401) setConnectionError(err);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    function update() {
      setPage(getPage());
      setMobileMenu(false);
    }
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timeout);
  }, [toast]);
  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [vehicles, orders, contracts, extra] = await Promise.all([
        api("/vehicles"),
        api("/orders"),
        api("/contracts"),
        api(isAgent ? "/clients" : "/clients/me"),
      ]);
      setData({
        vehicles,
        orders,
        contracts,
        clients: isAgent ? extra : [],
        profile: isAgent ? null : extra,
      });
    } catch (err) {
      if (err.status === 401) {
        setUser(null);
        setData(initialData);
        setConnectionError(null);
      } else setError(err);
    } finally {
      setLoading(false);
    }
  }, [user, isAgent]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  const activePage =
    titles[page] &&
    !(page === "clients" && !isAgent) &&
    !(page === "profile" && isAgent)
      ? page
      : "dashboard";
  function navigate(next) {
    window.location.hash = next;
    setMobileMenu(false);
  }
  async function mutate(path, method, body, message) {
    const result = await api(path, {
      method,
      ...(body !== undefined ? { body } : {}),
    });
    setDialog(null);
    setToast(message);
    await refresh();
    return result;
  }
  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
      setUser(null);
      setData(initialData);
      setConnectionError(null);
      setDialog(null);
      window.location.hash = "";
    } catch (err) {
      setError(err);
    }
  }
  function login(result) {
    setConnectionError(null);
    setUser(result);
    setData(initialData);
    navigate("dashboard");
  }
  const open = (kind, item) => setDialog({ kind, item });
  const close = () => setDialog(null);
  if (checking)
    return (
      <div className="initial-loading">
        <Logo />
        <span className="loading-line" />
        <p>Preparando seu caminho…</p>
      </div>
    );
  if (!user)
    return <Auth onAuthenticated={login} connectionError={connectionError} />;
  const nav = [
    ["dashboard", "grid", "Visão geral"],
    ["orders", "file", "Pedidos"],
    ["vehicles", "car", "Frota"],
    ["contracts", "shield", "Contratos"],
    [
      isAgent ? "clients" : "profile",
      isAgent ? "users" : "user",
      isAgent ? "Clientes" : "Meu cadastro",
    ],
  ];
  return (
    <div className="app-layout">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Pular para o conteúdo
      </a>
      {mobileMenu && (
        <button
          className="sidebar-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <Logo light />
          <span>GESTÃO DE ALUGUÉIS</span>
        </div>
        <div className="workspace-label">SEU ESPAÇO</div>
        <nav aria-label="Navegação principal">
          {nav.map(([key, icon, label]) => (
            <a
              key={key}
              href={`#${key}`}
              className={activePage === key ? "nav-active" : ""}
              aria-current={activePage === key ? "page" : undefined}
            >
              <Icon name={icon} />
              <span>{label}</span>
              {key === "orders" &&
                data.orders.some((item) => item.status === "PENDING") && (
                  <b className="nav-count">
                    {
                      data.orders.filter((item) => item.status === "PENDING")
                        .length
                    }
                  </b>
                )}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Icon name="shield" size={24} />
            <strong>Cada etapa, mais simples.</strong>
            <p>Seus pedidos e contratos em um só lugar.</p>
            <span>Você segue em frente.</span>
          </div>
          <div className="sidebar-user">
            <span className="avatar">
              {user.name
                ?.trim()
                .split(/\s+/)
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <div>
              <strong>{user.name}</strong>
              <small>{roleLabel(user.role)}</small>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Sair da conta"
              onClick={logout}
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              aria-label="Abrir menu"
              aria-expanded={mobileMenu}
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              <Icon name="menu" />
            </button>
            <span className="breadcrumb">
              Meu espaço <span>/</span> <strong>{titles[activePage][0]}</strong>
            </span>
          </div>
          <div className="topbar-right">
            <span className="workspace-badge">
              <span className="live-dot" />
              {roleLabel(user.role)}
            </span>
            <span className="topbar-date">
              {new Intl.DateTimeFormat("pt-BR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }).format(new Date())}
            </span>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {activePage === "dashboard"
                  ? `OLÁ, ${user.name?.split(" ")[0]?.toUpperCase()}`
                  : "SEU ESPAÇO, ORGANIZADO"}
              </span>
              <h1>
                {titles[activePage][0]}
                <span className="heading-dot">.</span>
              </h1>
              <p>{titles[activePage][1]}</p>
            </div>
            <div className="heading-actions">
              <button
                className="button button-secondary button-refresh"
                disabled={loading}
                onClick={refresh}
              >
                <Icon name="clock" size={16} />
                {loading ? "Atualizando…" : "Atualizar"}
              </button>
              {["dashboard", "orders", "vehicles"].includes(activePage) &&
                (!isAgent || activePage !== "orders") && (
                  <button
                    className="button button-primary"
                    disabled={!isAgent && !data.vehicles.length}
                    onClick={() => open(isAgent ? "vehicle" : "order")}
                  >
                    <Icon name="plus" size={18} />
                    {isAgent ? "Cadastrar automóvel" : "Novo pedido"}
                  </button>
                )}
            </div>
          </div>
          {error && (
            <div className="page-error">
              <ErrorMessage error={error} />
              <button className="button button-text" onClick={refresh}>
                Tentar novamente
                <Icon name="arrow" size={16} />
              </button>
            </div>
          )}
          {loading && (
            <div className="load-status" role="status">
              Atualizando informações…
            </div>
          )}
          <div className={loading ? "page-body is-loading" : "page-body"}>
            {activePage === "dashboard" && (
              <Dashboard
                user={user}
                data={data}
                onOpen={open}
                navigate={navigate}
              />
            )}{" "}
            {activePage === "orders" && (
              <Orders orders={data.orders} isAgent={isAgent} onOpen={open} />
            )}{" "}
            {activePage === "vehicles" && (
              <Vehicles
                vehicles={data.vehicles}
                isAgent={isAgent}
                onOpen={open}
              />
            )}{" "}
            {activePage === "contracts" && (
              <Contracts contracts={data.contracts} onOpen={open} />
            )}{" "}
            {activePage === "clients" && (
              <Clients clients={data.clients} onOpen={open} />
            )}{" "}
            {activePage === "profile" && (
              <Profile profile={data.profile} user={user} onOpen={open} />
            )}
          </div>
          <footer className="page-footer">
            <span>
              <b>rota.</b> Um caminho mais simples.
            </span>
            <span>Gestão de aluguel de automóveis</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <span>
            <Icon name="check" size={17} />
          </span>
          {toast}
          <button
            className="icon-button"
            aria-label="Fechar aviso"
            onClick={() => setToast("")}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      {dialog && (
        <Modal
          key={dialog.kind}
          title={dialogTitle(dialog)}
          description={dialogDescription(dialog)}
          onClose={close}
          wide={dialog.kind === "profile"}
        >
          {dialog.kind === "vehicle" && (
            <VehicleForm
              vehicle={dialog.item}
              onClose={close}
              onSubmit={(body) =>
                mutate(
                  dialog.item ? `/vehicles/${dialog.item.id}` : "/vehicles",
                  dialog.item ? "PUT" : "POST",
                  body,
                  "Automóvel salvo com sucesso.",
                )
              }
            />
          )}{" "}
          {dialog.kind === "order" && (
            <OrderForm
              order={dialog.item?.id ? dialog.item : null}
              vehicleId={dialog.item?.selectedVehicleId}
              vehicles={data.vehicles}
              onClose={close}
              onSubmit={(body) =>
                mutate(
                  dialog.item?.id ? `/orders/${dialog.item.id}` : "/orders",
                  dialog.item?.id ? "PUT" : "POST",
                  body,
                  "Pedido enviado para análise.",
                )
              }
            />
          )}{" "}
          {dialog.kind === "order-details" && (
            <OrderDetails
              order={dialog.item}
              isAgent={isAgent}
              onOpen={open}
              onClose={close}
            />
          )}{" "}
          {dialog.kind === "review" && (
            <ReviewForm
              order={dialog.item}
              onClose={close}
              onSubmit={(body) =>
                mutate(
                  `/orders/${dialog.item.id}/review`,
                  "POST",
                  body,
                  "Parecer financeiro registrado.",
                )
              }
            />
          )}{" "}
          {dialog.kind === "contract" && (
            <ContractForm
              order={dialog.item}
              user={user}
              onClose={close}
              onSubmit={(body) =>
                mutate(
                  `/orders/${dialog.item.id}/contract`,
                  "POST",
                  body,
                  "Contrato executado com sucesso.",
                )
              }
            />
          )}{" "}
          {dialog.kind === "contract-details" && (
            <ContractDetails contract={dialog.item} onClose={close} />
          )}{" "}
          {dialog.kind === "profile" && (
            <ProfileForm
              profile={dialog.item}
              onClose={close}
              onSubmit={async (body) => {
                await mutate(
                  isAgent ? `/clients/${dialog.item.id}` : "/clients/me",
                  "PUT",
                  body,
                  "Cadastro atualizado com sucesso.",
                );
                if (!isAgent) setUser({ ...user, name: body.name });
              }}
            />
          )}{" "}
          {["cancel", "delete-vehicle", "delete-account"].includes(
            dialog.kind,
          ) && (
            <FormShell
              onClose={close}
              danger
              submitLabel={
                dialog.kind === "cancel"
                  ? "Cancelar pedido"
                  : dialog.kind === "delete-account"
                    ? "Excluir minha conta"
                    : "Excluir automóvel"
              }
              onSubmit={async () => {
                if (dialog.kind === "cancel")
                  await mutate(
                    `/orders/${dialog.item.id}/cancel`,
                    "POST",
                    undefined,
                    "Pedido cancelado.",
                  );
                else if (dialog.kind === "delete-vehicle")
                  await mutate(
                    `/vehicles/${dialog.item.id}`,
                    "DELETE",
                    undefined,
                    "Automóvel excluído.",
                  );
                else {
                  await api("/clients/me", { method: "DELETE" });
                  setDialog(null);
                  setUser(null);
                  setData(initialData);
                  setConnectionError(null);
                }
              }}
            >
              <p>
                {dialog.kind === "cancel"
                  ? "O pedido deixará de seguir para contratação. Para alugar em outro momento, você poderá criar um novo pedido."
                  : dialog.kind === "delete-account"
                    ? "Seus dados de acesso e seu cadastro serão excluídos. A exclusão só é permitida quando não há pedidos ou contratos ativos. Esta ação é permanente."
                    : `${dialog.item.brand} ${dialog.item.model} (${dialog.item.plate}) será removido da frota. A exclusão é permitida apenas para automóveis sem pedidos registrados.`}
              </p>
            </FormShell>
          )}
        </Modal>
      )}
    </div>
  );
}

function dialogTitle({ kind, item }) {
  return {
    vehicle: item ? "Editar automóvel" : "Um novo automóvel na rota",
    order: item?.id ? "Editar pedido" : "Planeje seu próximo caminho",
    "order-details": "Detalhes do pedido",
    review: "Avaliação financeira",
    contract: "Executar contrato",
    "contract-details": "Detalhes do contrato",
    profile: "Editar cadastro do cliente",
    cancel: "Cancelar este pedido?",
    "delete-vehicle": "Excluir este automóvel?",
    "delete-account": "Excluir sua conta?",
  }[kind];
}
function dialogDescription({ kind }) {
  return {
    vehicle: "Informações do veículo e valor da diária.",
    order: "Escolha o automóvel e o período de aluguel.",
    "order-details": "Informações e andamento da solicitação.",
    review: "Registre seu parecer sobre este pedido.",
    contract: "Defina a propriedade e as condições da contratação.",
    profile: "Dados pessoais e vínculos profissionais.",
  }[kind];
}

function Dashboard({ user, data, onOpen, navigate }) {
  const agent = user.role !== "CLIENT";
  const pending = data.orders.filter(
    (item) => item.status === "PENDING",
  ).length;
  const approved = data.orders.filter(
    (item) => item.status === "APPROVED",
  ).length;
  const contracted = data.orders.filter(
    (item) => item.status === "CONTRACTED",
  ).length;
  const stats = [
    [
      "file",
      "Pedidos no total",
      data.orders.length,
      "Todas as suas solicitações",
      "navy",
    ],
    [
      "clock",
      "Em análise",
      pending,
      agent ? "Aguardando seu parecer" : "Aguardando parecer financeiro",
      "amber",
    ],
    ["check", "Aprovados", approved, "Prontos para contratação", "green"],
    [
      "shield",
      "Contratos",
      data.contracts.length,
      "Aluguéis formalizados",
      "purple",
    ],
  ];
  const latest = [...data.orders]
    .sort((a, b) =>
      String(b.createdAt || b.id).localeCompare(String(a.createdAt || a.id)),
    )
    .slice(0, 5);
  return (
    <>
      <section className="dashboard-hero">
        <div className="hero-copy">
          <span className="hero-tag">
            <span className="live-dot" />
            SEU PRÓXIMO DESTINO
          </span>
          <h2>
            {agent ? (
              <>
                Gestão em dia.
                <br />
                Novos caminhos à frente.
              </>
            ) : (
              <>
                Seu caminho,
                <br />
                do seu jeito.
              </>
            )}
          </h2>
          <p>
            {agent
              ? "Acompanhe pedidos, avalie clientes e transforme aprovações em novos contratos."
              : "Escolha um automóvel, envie seu pedido e acompanhe tudo por aqui."}
          </p>
          <button
            className="button button-hero"
            onClick={() => navigate(agent ? "orders" : "vehicles")}
          >
            {agent ? "Acompanhar pedidos" : "Explorar a frota"}
            <Icon name="arrow" size={18} />
          </button>
        </div>
        <div className="hero-art">
          <div className="hero-circle circle-one" />
          <div className="hero-circle circle-two" />
          <div className="hero-road" />
          <CarArt tone="#d9e6c9" large />
          <span className="hero-art-label">BOAS JORNADAS COMEÇAM AQUI.</span>
        </div>
      </section>
      <section className="stats-grid" aria-label="Resumo da atividade">
        {stats.map(([icon, label, value, note, color]) => (
          <article className="stat-card" key={label}>
            <div className="stat-card-top">
              <span>{label}</span>
              <span className={`stat-icon stat-${color}`}>
                <Icon name={icon} size={19} />
              </span>
            </div>
            <strong>{value.toString().padStart(2, "0")}</strong>
            <p>
              <span className={`stat-dot dot-${color}`} />
              {note}
            </p>
          </article>
        ))}
      </section>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Pedidos recentes</h2>
              <p>Os últimos movimentos da sua jornada.</p>
            </div>
            <button
              className="button button-text button-small"
              onClick={() => navigate("orders")}
            >
              Ver todos
              <Icon name="arrow" size={16} />
            </button>
          </div>
          {latest.length ? (
            <OrdersTable
              orders={latest}
              isAgent={agent}
              onOpen={onOpen}
              compact
            />
          ) : (
            <Empty
              icon="file"
              title="Tudo pronto para começar"
              text={
                agent
                  ? "Os novos pedidos dos clientes aparecerão aqui para avaliação."
                  : "Seu primeiro pedido é o começo de uma boa viagem."
              }
            >
              {!agent && (
                <button
                  className="button button-secondary button-small"
                  onClick={() => navigate("vehicles")}
                >
                  Conhecer a frota
                  <Icon name="arrow" size={16} />
                </button>
              )}
            </Empty>
          )}
        </section>
        <aside className="journey-card">
          <span className="eyebrow">SIMPLES DO INÍCIO AO FIM</span>
          <h2>
            Uma rota.
            <br />
            Três passos.
          </h2>
          <ol className="journey-steps">
            <li>
              <span>01</span>
              <div>
                <strong>Faça seu pedido</strong>
                <p>Escolha o carro e o período.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Análise financeira</strong>
                <p>O agente avalia a solicitação.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Contrato e próximo destino</strong>
                <p>Aprovado, é hora de formalizar.</p>
              </div>
            </li>
          </ol>
          <div className="journey-footer">
            <Icon name="shield" size={19} />
            <span>
              {contracted
                ? `${contracted} ${contracted === 1 ? "jornada contratada" : "jornadas contratadas"}`
                : "Acompanhe o status a cada etapa."}
            </span>
          </div>
        </aside>
      </div>
    </>
  );
}
function Toolbar({ query, setQuery, placeholder, children, count }) {
  return (
    <div className="list-toolbar">
      <label className="search-input">
        <Icon name="search" size={19} />
        <span className="sr-only">{placeholder}</span>
        <input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="toolbar-right">
        {children}
        <span className="result-count">
          {count} {count === 1 ? "registro" : "registros"}
        </span>
      </div>
    </div>
  );
}
function Orders({ orders, isAgent, onOpen }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const filtered = orders.filter(
    (item) =>
      (!status || item.status === status) &&
      `${item.vehicle?.brand} ${item.vehicle?.model} ${item.clientName} ${item.id}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <section className="panel">
      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Buscar por automóvel, cliente ou pedido"
        count={filtered.length}
      >
        <label>
          <span className="sr-only">Filtrar por status</span>
          <select
            className="filter-select"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Todos os status</option>
            {Object.entries(statuses).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </Toolbar>
      {filtered.length ? (
        <OrdersTable orders={filtered} isAgent={isAgent} onOpen={onOpen} />
      ) : (
        <Empty
          title={
            orders.length
              ? "Nenhum pedido encontrado"
              : "Seu próximo caminho começa aqui"
          }
          text={
            orders.length
              ? "Tente outra busca ou escolha um status diferente."
              : isAgent
                ? "As solicitações enviadas pelos clientes aparecerão aqui."
                : "Explore a frota e envie seu primeiro pedido de aluguel."
          }
        />
      )}
    </section>
  );
}
function OrdersTable({ orders, isAgent, onOpen, compact = false }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Automóvel / pedido</th>
            {isAgent && <th>Cliente</th>}
            <th>Período</th>
            {!compact && <th>Valor total</th>}
            <th>Status</th>
            <th>
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <button
                  className="row-title"
                  onClick={() => onOpen("order-details", order)}
                >
                  <span className="table-car-icon">
                    <Icon name="car" size={21} />
                  </span>
                  <span>
                    <strong>
                      {order.vehicle?.brand} {order.vehicle?.model}
                    </strong>
                    <small>#{order.id?.slice(0, 8).toUpperCase()}</small>
                  </span>
                </button>
              </td>
              {isAgent && <td>{order.clientName}</td>}
              <td>
                <span className="date-cell">
                  {date(order.startDate)}
                  <small>até {date(order.endDate)}</small>
                </span>
              </td>
              {!compact && (
                <td className="money-cell">{money(order.totalAmount)}</td>
              )}
              <td>
                <Status value={order.status} />
              </td>
              <td>
                <button
                  className="icon-button row-action"
                  aria-label={`Ver pedido ${order.id?.slice(0, 8)}`}
                  onClick={() => onOpen("order-details", order)}
                >
                  <Icon name="arrow" size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Vehicles({ vehicles, isAgent, onOpen }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const filtered = vehicles.filter(
    (item) =>
      (!category || item.category === category) &&
      `${item.brand} ${item.model} ${item.plate} ${item.registration}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="panel vehicles-toolbar">
        <Toolbar
          query={query}
          setQuery={setQuery}
          placeholder="Buscar marca, modelo ou placa"
          count={filtered.length}
        >
          <label>
            <span className="sr-only">Filtrar categoria</span>
            <select
              className="filter-select"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">Todas as categorias</option>
              {[...new Set(vehicles.map((item) => item.category))].map(
                (item) => (
                  <option key={item}>{item}</option>
                ),
              )}
            </select>
          </label>
        </Toolbar>
      </div>
      {filtered.length ? (
        <div className="vehicles-grid">
          {filtered.map((vehicle, index) => (
            <article className="vehicle-card" key={vehicle.id}>
              <div className="vehicle-visual">
                <span className="category-badge">{vehicle.category}</span>
                <CarArt
                  tone={["#b2c5b4", "#d2c6b0", "#b5c7cc", "#c5bdd0"][index % 4]}
                />
                <span className="vehicle-year">{vehicle.year}</span>
              </div>
              <div className="vehicle-body">
                <div className="vehicle-title">
                  <div>
                    <span>{vehicle.brand}</span>
                    <h2>{vehicle.model}</h2>
                  </div>
                  <div className="vehicle-price">
                    <strong>{money(vehicle.dailyRate)}</strong>
                    <small>por diária</small>
                  </div>
                </div>
                <div className="vehicle-metadata">
                  <span>
                    <Icon name="car" size={16} />
                    {vehicle.plate}
                  </span>
                  <span>Matrícula {vehicle.registration}</span>
                </div>
                <p className="vehicle-owner">
                  <Icon
                    name={vehicle.ownerType === "CLIENT" ? "user" : "building"}
                    size={15}
                  />
                  {vehicle.ownerName}
                  <span>{roleLabel(vehicle.ownerType)}</span>
                </p>
                {isAgent ? (
                  <div className="vehicle-actions">
                    <button
                      className="button button-secondary"
                      onClick={() => onOpen("vehicle", vehicle)}
                    >
                      <Icon name="edit" size={16} />
                      Editar automóvel
                    </button>
                    <button
                      className="icon-button danger-text"
                      aria-label={`Excluir ${vehicle.brand} ${vehicle.model}`}
                      onClick={() => onOpen("delete-vehicle", vehicle)}
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="button button-secondary vehicle-rent"
                    onClick={() =>
                      onOpen("order", { selectedVehicleId: vehicle.id })
                    }
                  >
                    Quero alugar
                    <Icon name="arrow" size={17} />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="panel">
          <Empty
            icon="car"
            title={
              vehicles.length
                ? "Nenhum automóvel encontrado"
                : "Uma frota de possibilidades"
            }
            text={
              vehicles.length
                ? "Experimente buscar outra marca, modelo ou categoria."
                : isAgent
                  ? "Cadastre o primeiro automóvel para que os clientes possam enviar pedidos."
                  : "Os agentes estão preparando a frota. Os automóveis cadastrados aparecerão aqui."
            }
          >
            {isAgent && !vehicles.length && (
              <button
                className="button button-primary"
                onClick={() => onOpen("vehicle")}
              >
                <Icon name="plus" size={17} />
                Cadastrar automóvel
              </button>
            )}
          </Empty>
        </section>
      )}
      <p className="illustration-note">
        Ilustrações representativas. Consulte marca, modelo e ano de cada
        automóvel.
      </p>
    </>
  );
}
function Contracts({ contracts, onOpen }) {
  const [query, setQuery] = useState("");
  const filtered = contracts.filter((item) =>
    `${item.vehicle?.brand} ${item.vehicle?.model} ${item.clientName} ${item.id}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <section className="panel">
      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Buscar contrato, cliente ou automóvel"
        count={filtered.length}
      />
      {filtered.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Contrato / automóvel</th>
                <th>Cliente</th>
                <th>Período</th>
                <th>Valor</th>
                <th>Crédito</th>
                <th>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <button
                      className="row-title"
                      onClick={() => onOpen("contract-details", item)}
                    >
                      <span className="table-car-icon">
                        <Icon name="shield" size={21} />
                      </span>
                      <span>
                        <strong>
                          {item.vehicle?.brand} {item.vehicle?.model}
                        </strong>
                        <small>#{item.id?.slice(0, 8).toUpperCase()}</small>
                      </span>
                    </button>
                  </td>
                  <td>{item.clientName}</td>
                  <td>
                    <span className="date-cell">
                      {date(item.startDate)}
                      <small>até {date(item.endDate)}</small>
                    </span>
                  </td>
                  <td className="money-cell">{money(item.totalAmount)}</td>
                  <td>
                    <span
                      className={`credit-badge ${item.credit ? "has-credit" : ""}`}
                    >
                      {item.credit ? "Associado" : "Sem crédito"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="icon-button row-action"
                      aria-label="Ver detalhes do contrato"
                      onClick={() => onOpen("contract-details", item)}
                    >
                      <Icon name="arrow" size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty
          icon="shield"
          title={
            contracts.length
              ? "Nenhum contrato encontrado"
              : "Seus próximos destinos, formalizados"
          }
          text={
            contracts.length
              ? "Experimente outra busca."
              : "Os contratos aparecem aqui após a aprovação e execução de um pedido por um agente."
          }
        />
      )}
    </section>
  );
}
function Clients({ clients, onOpen }) {
  const [query, setQuery] = useState("");
  const filtered = clients.filter((item) =>
    `${item.name} ${item.cpf} ${item.username}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <section className="panel">
      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Buscar nome, CPF ou usuário"
        count={filtered.length}
      />
      {filtered.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>CPF / RG</th>
                <th>Profissão</th>
                <th>Renda mensal informada</th>
                <th>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id}>
                  <td>
                    <div className="row-title">
                      <span className="client-avatar">
                        {client.name?.[0]?.toUpperCase()}
                      </span>
                      <span>
                        <strong>{client.name}</strong>
                        <small>@{client.username}</small>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="date-cell">
                      {client.cpf}
                      <small>RG {client.rg}</small>
                    </span>
                  </td>
                  <td>{client.profession}</td>
                  <td className="money-cell">
                    {money(
                      client.employments?.reduce(
                        (sum, item) => sum + Number(item.income),
                        0,
                      ),
                    )}
                  </td>
                  <td>
                    <button
                      className="button button-text button-small"
                      onClick={() => onOpen("profile", client)}
                    >
                      <Icon name="edit" size={16} />
                      Ver e editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty
          icon="users"
          title={
            clients.length
              ? "Nenhum cliente encontrado"
              : "Cada jornada começa com uma pessoa"
          }
          text={
            clients.length
              ? "Experimente outra busca."
              : "Os clientes que criarem uma conta no sistema aparecerão aqui."
          }
        />
      )}
    </section>
  );
}
function Profile({ profile, user, onOpen }) {
  if (!profile)
    return (
      <section className="panel">
        <Empty
          icon="user"
          title="Carregando seu cadastro"
          text="Caso seus dados não apareçam, use o botão Atualizar."
        />
      </section>
    );
  return (
    <div className="profile-layout">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Dados pessoais</h2>
            <p>Suas informações para alugar com tranquilidade.</p>
          </div>
          <button
            className="button button-secondary button-small"
            onClick={() => onOpen("profile", profile)}
          >
            <Icon name="edit" size={16} />
            Editar cadastro
          </button>
        </div>
        <div className="profile-content">
          <div className="profile-identity">
            <span className="profile-avatar">{profile.name?.[0]}</span>
            <div>
              <h2>{profile.name}</h2>
              <p>
                @{user.username}
                <span className="workspace-badge">Cliente</span>
              </p>
            </div>
          </div>
          <dl className="detail-grid">
            <Detail label="CPF" value={profile.cpf} />
            <Detail label="RG" value={profile.rg} />
            <Detail label="Profissão" value={profile.profession} />
            <Detail label="Endereço" value={profile.address} />
          </dl>
          <div className="section-title">
            <div>
              <h3>Vínculos e rendimentos</h3>
              <p>Até três fontes de renda para análise financeira.</p>
            </div>
          </div>
          {profile.employments?.length ? (
            profile.employments.map((item, index) => (
              <div className="employment-view" key={index}>
                <span>
                  <Icon name="building" size={20} />
                  {item.employer}
                </span>
                <strong>
                  {money(item.income)}
                  <small>/mês</small>
                </strong>
              </div>
            ))
          ) : (
            <p className="muted small">Nenhum vínculo informado.</p>
          )}
        </div>
      </section>
      <aside>
        <div className="profile-tip">
          <span className="stat-icon stat-green">
            <Icon name="shield" size={22} />
          </span>
          <h3>Seu cadastro, em dia.</h3>
          <p>
            Dados completos ajudam os agentes a analisar os pedidos e agilizam a
            contratação.
          </p>
        </div>
        <div className="delete-account">
          <h3>Encerrar minha conta</h3>
          <p>
            A exclusão é permanente e depende de não haver pedidos ou contratos
            ativos.
          </p>
          <button
            className="button button-text danger-text button-small"
            onClick={() => onOpen("delete-account")}
          >
            <Icon name="trash" size={16} />
            Excluir minha conta
          </button>
        </div>
      </aside>
    </div>
  );
}
function Detail({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value ?? "—"}</dd>
    </div>
  );
}
function OrderDetails({ order, isAgent, onOpen, onClose }) {
  const editable = ["PENDING", "APPROVED"].includes(order.status);
  return (
    <div>
      <div className="form-content">
        <div className="detail-top">
          <span className="reference">
            PEDIDO #{order.id?.slice(0, 8).toUpperCase()}
          </span>
          <Status value={order.status} />
        </div>
        <div className="detail-vehicle">
          <CarArt />
          <h3>
            {order.vehicle?.brand} {order.vehicle?.model}
          </h3>
          <p>
            {order.vehicle?.year} · {order.vehicle?.plate}
          </p>
        </div>
        <dl className="detail-grid">
          <Detail label="Cliente" value={order.clientName} />
          <Detail label="Valor total" value={money(order.totalAmount)} />
          <Detail label="Retirada" value={date(order.startDate)} />
          <Detail label="Devolução" value={date(order.endDate)} />
        </dl>
        {order.notes && (
          <div className="notes-block">
            <h4>Observações do pedido</h4>
            <p>{order.notes}</p>
          </div>
        )}
        {order.reviewNotes && (
          <div className="review-block">
            <span className="eyebrow">PARECER FINANCEIRO</span>
            <p>{order.reviewNotes}</p>
            <small>
              Registrado por {order.reviewedByName || "agente responsável"}
            </small>
          </div>
        )}
        {order.status === "PENDING" && (
          <p className="info-note">
            <Icon name="clock" size={18} />
            {isAgent
              ? "Este pedido aguarda uma análise financeira."
              : "Seu pedido está aguardando análise financeira por um agente."}
          </p>
        )}
        {order.status === "APPROVED" && (
          <p className="info-note">
            <Icon name="check" size={18} />
            {isAgent
              ? "Parecer positivo. O pedido está disponível para execução do contrato."
              : "Pedido aprovado. Aguarde a execução do contrato por um agente."}
          </p>
        )}
      </div>
      <div className="detail-actions">
        {editable && (
          <button
            className="button button-secondary"
            onClick={() => onOpen("order", order)}
          >
            <Icon name="edit" size={16} />
            Editar pedido
          </button>
        )}
        {editable && !isAgent && (
          <button
            className="button button-text danger-text"
            onClick={() => onOpen("cancel", order)}
          >
            Cancelar pedido
          </button>
        )}
        {isAgent && order.status === "PENDING" && (
          <button
            className="button button-primary"
            onClick={() => onOpen("review", order)}
          >
            <Icon name="check" size={17} />
            Avaliar pedido
          </button>
        )}
        {isAgent && order.status === "APPROVED" && (
          <button
            className="button button-primary"
            onClick={() => onOpen("contract", order)}
          >
            <Icon name="shield" size={17} />
            Executar contrato
          </button>
        )}
        {!editable && (
          <button className="button button-secondary" onClick={onClose}>
            Fechar detalhes
          </button>
        )}
      </div>
    </div>
  );
}
function ContractDetails({ contract, onClose }) {
  return (
    <>
      <div className="form-content">
        <div className="detail-top">
          <span className="reference">
            CONTRATO #{contract.id?.slice(0, 8).toUpperCase()}
          </span>
          <Status value="CONTRACTED" />
        </div>
        <div className="detail-vehicle">
          <CarArt />
          <h3>
            {contract.vehicle?.brand} {contract.vehicle?.model}
          </h3>
          <p>
            {contract.vehicle?.year} · {contract.vehicle?.plate}
          </p>
        </div>
        <dl className="detail-grid">
          <Detail label="Cliente" value={contract.clientName} />
          <Detail label="Valor total" value={money(contract.totalAmount)} />
          <Detail label="Retirada" value={date(contract.startDate)} />
          <Detail label="Devolução" value={date(contract.endDate)} />
          <Detail
            label="Propriedade registrada"
            value={`${roleLabel(contract.ownerType)} · ${contract.ownerName}`}
          />
          <Detail label="Contratado em" value={date(contract.signedAt)} />
          <Detail
            label="Pedido de origem"
            value={`#${contract.orderId?.slice(0, 8).toUpperCase()}`}
          />
          <Detail
            label="Matrícula do automóvel"
            value={contract.vehicle?.registration}
          />
        </dl>
        {contract.credit ? (
          <div className="credit-detail">
            <div className="section-title">
              <h3>
                <Icon name="wallet" size={20} />
                Contrato de crédito associado
              </h3>
            </div>
            <dl className="detail-grid">
              <Detail
                label="Banco concedente"
                value={contract.credit.bankName}
              />
              <Detail
                label="Valor financiado"
                value={money(contract.credit.amount)}
              />
              <Detail
                label="Taxa de juros"
                value={`${Number(contract.credit.interestRate).toLocaleString("pt-BR")}%`}
              />
              <Detail label="Parcelas" value={contract.credit.installments} />
            </dl>
          </div>
        ) : (
          <p className="info-note">
            <Icon name="info" size={18} />
            Este aluguel não possui contrato de crédito associado.
          </p>
        )}
      </div>
      <div className="form-footer">
        <button className="button button-secondary" onClick={onClose}>
          Fechar detalhes
        </button>
      </div>
    </>
  );
}
