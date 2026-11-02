# Contrato de integração — Rota

Contrato compartilhado entre React e Spring MVC. Prefixo `/api`. JSON em camelCase, UUIDs como strings, datas `YYYY-MM-DD`, valores decimais em reais. A API usa sessão HTTP (`credentials: 'include'`); `GET /auth/csrf` retorna `{token,headerName}` e toda mutação envia esse cabeçalho. Erros: `{message,fieldErrors?}` com códigos HTTP adequados. Listagens são arrays. Nenhuma resposta inclui senha/hash.

## Autenticação

- `GET /auth/csrf`: público; cria token CSRF.
- `POST /auth/register`: `{username,password,name,role,agentCode?,rg?,cpf?,address?,profession?,employments?:[{employer,income}]}`. Papéis `CLIENT`, `COMPANY`, `BANK`. Cliente exige RG, CPF, endereço, profissão; até três vínculos. Agente exige código definido no servidor. Retorna usuário (201); após registro, fazer login.
- `POST /auth/login`: `{username,password}`; retorna usuário e estabelece sessão.
- `GET /auth/me`: usuário autenticado `{id,username,name,role}`; sem sessão, 401.
- `POST /auth/logout`: encerra sessão (204).

## Clientes

- `GET /clients/me`, `PUT /clients/me`, `DELETE /clients/me`: CRUD do próprio cadastro. Exclusão é bloqueada se houver pedidos ou contratos ativos. PUT `{name,rg,cpf,address,profession,employments:[{employer,income}]}`.
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
- `POST /orders/{id}/contract`: agente, `{ownerType,credit?:{bankId,amount,interestRate,installments}}`; somente `APPROVED`; cria contrato e marca `CONTRACTED`. Propriedade CLIENT refere-se ao cliente do pedido, COMPANY exige agente empresa, BANK exige agente banco ou banco financiador informado. Crédito precisa ser concedido pelo próprio banco autenticado (empresas podem executar contrato sem crédito); valor > 0 e <= total, taxa >= 0, parcelas >= 1.

## Contratos

- `GET /contracts`: próprios do cliente ou todos para agentes. Retorno `{id,orderId,clientName,vehicle,startDate,endDate,totalAmount,ownerType,ownerName,signedAt,credit?:{bankId,bankName,amount,interestRate,installments}}`.

## Regras transversais

Datas de novos/alterados pedidos não podem estar no passado; devolução >= retirada. Conflitos com contratos existentes impedem contratar e impedirão pedidos no intervalo ocupado. Usar transação e bloqueio do veículo para impedir dupla reserva concorrente. CPF válido e único, username único; matrícula e placa únicas. Dados de autenticação e acesso devem ser validados no servidor, nunca apenas na interface. Supabase via JDBC em esquema privado `rental`, sem expor credenciais no React. H2 apenas no perfil explícito `test` para testes; execução normal exige PostgreSQL.
