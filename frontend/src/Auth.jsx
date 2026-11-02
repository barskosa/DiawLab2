import { useState } from "react";
import { api } from "./api.js";
import {
  CarArt,
  ErrorMessage,
  Icon,
  Logo,
  SelectField,
  SubmitButton,
  TextField,
} from "./components.jsx";
import { ClientFields, blankClient } from "./forms.jsx";

export default function Auth({ onAuthenticated, connectionError }) {
  const [register, setRegister] = useState(false);
  const [value, setValue] = useState({
    ...blankClient,
    username: "",
    password: "",
    role: "CLIENT",
    agentCode: "",
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  function field(key) {
    return (event) => setValue({ ...value, [key]: event.target.value });
  }
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (register)
        await api("/auth/register", {
          method: "POST",
          body: {
            ...value,
            cpf: value.cpf.replace(/\D/g, ""),
            employments: value.employments.map((item) => ({
              ...item,
              income: Number(item.income),
            })),
          },
        });
      const user = await api("/auth/login", {
        method: "POST",
        body: { username: value.username, password: value.password },
      });
      onAuthenticated(user);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-layout">
      <aside className="auth-story">
        <Logo light />
        <div className="auth-story-main">
          <span className="eyebrow">SEU PRÓXIMO CAMINHO COMEÇA AQUI</span>
          <h1>
            Mais liberdade.
            <br />
            Menos distância.
          </h1>
          <p>
            Do primeiro pedido ao contrato, uma experiência simples para seguir
            em frente.
          </p>
          <div className="auth-car-scene">
            <div className="route-line" />
            <CarArt tone="#d5e8c8" large />
            <span className="scene-label">
              <span className="live-dot" />
              Tudo pronto para o próximo destino
            </span>
          </div>
        </div>
        <div className="auth-story-footer">
          <span>Aluguel de automóveis, de ponta a ponta.</span>
          <span>Rota © {new Date().getFullYear()}</span>
        </div>
      </aside>
      <section className="auth-form-panel">
        <div className="auth-mobile-logo">
          <Logo />
        </div>
        <div className={`auth-form ${register ? "auth-form-register" : ""}`}>
          <div className="auth-intro">
            <span className="eyebrow">BEM-VINDO À ROTA</span>
            <h2>
              {register ? "Comece uma nova jornada." : "Bom ter você por aqui."}
            </h2>
            <p>
              {register
                ? "Crie seu cadastro para acessar o sistema."
                : "Entre na sua conta para continuar."}
            </p>
          </div>
          <form onSubmit={submit}>
            <div className="form-content">
              <TextField
                label="Usuário"
                placeholder="Seu nome de usuário"
                autoComplete="username"
                minLength={3}
                maxLength={60}
                required
                value={value.username}
                onChange={field("username")}
              />
              <TextField
                label="Senha"
                placeholder={register ? "Pelo menos 8 caracteres" : "Sua senha"}
                type="password"
                autoComplete={register ? "new-password" : "current-password"}
                minLength={register ? 8 : undefined}
                maxLength={72}
                required
                value={value.password}
                onChange={field("password")}
              />
              {register && (
                <>
                  <SelectField
                    label="Tipo de cadastro"
                    value={value.role}
                    onChange={field("role")}
                  >
                    <option value="CLIENT">Cliente — quero alugar</option>
                    <option value="COMPANY">Empresa — agente de locação</option>
                    <option value="BANK">Banco — agente financeiro</option>
                  </SelectField>
                  {value.role === "CLIENT" ? (
                    <ClientFields value={value} onChange={setValue} />
                  ) : (
                    <>
                      <TextField
                        label="Nome da instituição"
                        required
                        maxLength={120}
                        autoComplete="organization"
                        value={value.name}
                        onChange={field("name")}
                      />
                      <TextField
                        label="Código de cadastro de agente"
                        hint="Solicite o código ao responsável pelo sistema."
                        type="password"
                        required
                        autoComplete="off"
                        value={value.agentCode}
                        onChange={field("agentCode")}
                      />
                    </>
                  )}
                </>
              )}
              <ErrorMessage error={error || connectionError} />
              <SubmitButton busy={busy}>
                {register ? "Criar conta e entrar" : "Entrar na minha conta"}
              </SubmitButton>
            </div>
          </form>
          <p className="auth-switch">
            {register ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
            <button
              type="button"
              onClick={() => {
                setRegister(!register);
                setError(null);
              }}
            >
              {register ? "Entrar" : "Cadastre-se"}
            </button>
          </p>
          <div className="auth-security">
            <Icon name="shield" size={17} />
            <span>Acesso exclusivo para usuários cadastrados.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
