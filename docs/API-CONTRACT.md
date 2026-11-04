# Contrato de integração — Rota

Contrato compartilhado entre React e Spring MVC. Prefixo `/api`. JSON em camelCase, UUIDs como strings, datas `YYYY-MM-DD` com ano até 9999, valores decimais em reais. A API usa sessão HTTP (`credentials: 'include'`); `GET /auth/csrf` retorna `{token,headerName}` e toda mutação envia esse cabeçalho. Erros: `{message,fieldErrors?}` com códigos HTTP adequados. Listagens são arrays. Nenhuma resposta inclui senha/hash.

A autorização resolve o UUID original da sessão e verifica se a identidade está ativa. Excluir uma conta e reutilizar seu nome de usuário não transfere a sessão antiga para a nova identidade. Após login, logout ou expiração, obtenha novamente o CSRF antes de uma nova mutação.

## Autenticação

- `GET /auth/csrf`: público; cria token CSRF.
- `POST /auth/register`: `{username,password,name,role,agentCode?,rg?,cpf?,address?,profession?,employments?:[{employer,income}]}`. Papéis `CLIENT`, `COMPANY`, `BANK`. Cliente exige RG, CPF, endereço, profissão; até três vínculos. Agente exige código definido no servidor. Retorna usuário (201); após registro, fazer login.
- `POST /auth/login`: `{username,password}`; retorna usuário e estabelece sessão.
- `GET /auth/me`: usuário autenticado `{id,username,name,role}`; sem sessão, 401.
- `POST /auth/logout`: encerra sessão (204).

## Clientes

- `GET /clients/me`, `PUT /clients/me`, `DELETE /clients/me`: CRUD do próprio cadastro. Exclusão é bloqueada se houver pedidos `PENDING`/`APPROVED` ou contratos cujo fim exclusivo ainda não tenha sido alcançado, incluindo períodos futuros. Quando permitida, anonimiza o cadastro, desativa a identidade e encerra a sessão (204); nomes preservados em contratos permanecem no histórico. PUT `{name,rg,cpf,address,profession,employments:[{employer,income}]}`.
- `GET /clients`: agentes consultam clientes; `GET /clients/{id}` e `PUT /clients/{id}` para agentes consultar/editar. Criação é o cadastro público; exclusão pelo próprio titular. Retorno de perfil `{id,username,name,rg,cpf,address,profession,employments}`.

## Automóveis

- `GET /vehicles`: todos autenticados. Retorno `{id,registration,year,brand,model,plate,dailyRate,category,ownerType,ownerId,ownerName}`. `ownerType`: `CLIENT`, `COMPANY`, `BANK`. Categorias: texto (ex.: Econômico, Sedan, SUV).
- `POST /vehicles`, `PUT /vehicles/{id}`, `DELETE /vehicles/{id}`: agentes; payload `{registration,year,brand,model,plate,dailyRate,category}`; propriedade inicial do agente autenticado. Exclusão bloqueada quando há histórico de pedidos.
- `GET /agents/banks`: autenticados, lista bancos `{id,name}`.

## Pedidos

- `GET /orders`, `GET /orders/{id}`: cliente vê próprios; agentes veem todos. Retorno `{id,clientId,clientName,vehicleId,vehicle,startDate,endDate,totalAmount,status,notes,reviewNotes,reviewedByName,createdAt}`.
- `POST /orders`: cliente, `{vehicleId,startDate,endDate,notes}`; status inicial `PENDING`; preço calculado no servidor com mínimo de uma diária. Intervalo de aluguel é `[startDate,endDate)`; retirada e devolução no mesmo dia equivale a uma diária.
- `PUT /orders/{id}`: cliente titular ou agente altera pedido `PENDING`/`APPROVED`, mesmo payload; volta a `PENDING` e remove parecer anterior.
- `POST /orders/{id}/cancel`: cliente titular, cancela `PENDING`/`APPROVED`; status `CANCELLED`.
- `POST /orders/{id}/review`: agente, `{approved:boolean,reviewNotes:string}`; analisa `PENDING` e define `APPROVED`/`REJECTED`.
- `POST /orders/{id}/contract`: agente, `{ownerType,credit?:{bankId,amount,interestRate,installments}}`; somente `APPROVED`; cria contrato e marca `CONTRACTED`. Propriedade `CLIENT` refere-se ao cliente do pedido; `COMPANY` exige a própria empresa autenticada; `BANK` exige o próprio banco autenticado. Crédito precisa ser concedido pelo próprio banco autenticado (`bankId` igual ao seu ID; empresas executam contratos sem crédito); valor > 0 e <= total, taxa >= 0, parcelas entre 1 e 600. A contratação copia os dados do veículo, a diária negociada e os nomes das partes para o contrato.

## Contratos

- `GET /contracts`: próprios do cliente ou todos para agentes. Retorno `{id,orderId,clientName,vehicle,startDate,endDate,totalAmount,ownerType,ownerName,signedAt,credit?:{bankId,bankName,amount,interestRate,installments}}`.

`clientName`, `ownerName`, `credit.bankName` e os dados/tarifa do automóvel retornado em `vehicle` representam as condições preservadas na contratação. Editar nome ou automóvel posteriormente não altera esses valores no contrato. O formato JSON permanece igual; as cópias são detalhes de persistência em `RentalContract`. Para contratos anteriores à migração V2, as cópias foram inicializadas com os dados conhecidos no momento dessa migração.

## Regras transversais

Datas de novos/alterados pedidos não podem estar no passado; devolução >= retirada e anos até 9999. O intervalo é `[retirada,devolução)`; se as datas forem iguais, ocupa um dia e a devolução exclusiva é o dia seguinte. A mesma convenção determina disponibilidade e encerramento do contrato para exclusão do cadastro. Conflitos com contratos existentes impedem contratar e criar/alterar pedidos no intervalo ocupado. Transação e bloqueio do veículo impedem dupla contratação concorrente; o bloqueio da identidade serializa criação de pedido com manutenção/exclusão do cadastro. CPF válido e único, username único; matrícula e placa únicas. Dados de autenticação e acesso são validados no servidor. Supabase via JDBC em esquema privado `rental`, sem expor credenciais no React. H2 apenas no perfil explícito `test` para testes; execução normal exige PostgreSQL.
