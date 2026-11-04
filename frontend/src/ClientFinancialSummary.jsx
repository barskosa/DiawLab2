import { useEffect, useId, useState } from "react";
import { api } from "./api.js";
import { ErrorMessage, Icon, money } from "./components.jsx";

// Rendered exclusively in agent workflows. The API also authorizes /clients/{id}.
export default function ClientFinancialSummary({ clientId, amount }) {
  const titleId = useId();
  const [client, setClient] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setClient(null);
    setError(null);
    api(`/clients/${clientId}`, { signal: controller.signal })
      .then(setClient)
      .catch((err) => {
        if (!controller.signal.aborted) setError(err);
      });
    return () => controller.abort();
  }, [clientId, attempt]);
  const income =
    client?.employments?.reduce((sum, item) => sum + Number(item.income), 0) ||
    0;
  return (
    <section className="financial-summary" aria-labelledby={titleId}>
      <div className="financial-heading">
        <span className="stat-icon stat-green">
          <Icon name="wallet" size={20} />
        </span>
        <div>
          <h3 id={titleId}>Dados para análise financeira</h3>
          <p>Cadastro e rendimentos informados pelo cliente.</p>
        </div>
      </div>
      {error ? (
        <>
          <ErrorMessage error={error} />
          <button
            type="button"
            className="button button-text button-small"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Carregar dados novamente
            <Icon name="arrow" size={16} />
          </button>
        </>
      ) : !client ? (
        <p className="financial-loading" role="status">
          Consultando os dados do cliente…
        </p>
      ) : (
        <>
          <div className="financial-person">
            <strong>{client.name}</strong>
            <span>{client.profession}</span>
          </div>
          <dl className="financial-identification">
            <div>
              <dt>CPF</dt>
              <dd>{client.cpf}</dd>
            </div>
            <div>
              <dt>RG</dt>
              <dd>{client.rg}</dd>
            </div>
            <div className="span-2">
              <dt>Endereço</dt>
              <dd>{client.address}</dd>
            </div>
          </dl>
          <div className="financial-total">
            <span>Renda mensal informada</span>
            <strong>{money(income)}</strong>
          </div>
          {client.employments?.length ? (
            <ul className="financial-employments">
              {client.employments.map((employment, index) => (
                <li key={index}>
                  <span>
                    <Icon name="building" size={16} />
                    {employment.employer}
                  </span>
                  <strong>
                    {money(employment.income)}
                    <small>/mês</small>
                  </strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="financial-empty">
              O cliente não informou vínculos ou rendimentos.
            </p>
          )}
          {income > 0 && (
            <p className="financial-ratio">
              O aluguel de <strong>{money(amount)}</strong> corresponde a{" "}
              <strong>
                {new Intl.NumberFormat("pt-BR", {
                  maximumFractionDigits: 1,
                }).format((Number(amount) / income) * 100)}
                %
              </strong>{" "}
              da renda mensal informada.
            </p>
          )}
        </>
      )}
    </section>
  );
}
