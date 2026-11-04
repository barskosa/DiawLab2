# Requisitos e rastreabilidade

Fonte: enunciado **DIAW — Laboratório 02 — Sistema de Aluguel de Carros**, três páginas, fornecido para este trabalho. As seções abaixo distinguem os requisitos do enunciado das decisões complementares adotadas para tornar o protótipo executável.

## Requisitos funcionais do enunciado

Nos caminhos abaixo, `java/` significa `backend/src/main/java/br/com/rota/`.

| ID | Requisito | Elementos correspondentes | História |
| --- | --- | --- | --- |
| RF01 | Cadastro prévio e autenticação obrigatória com usuário e senha | `java/controller/AuthController.java`, `java/service/AuthService.java`, `java/config/SecurityConfig.java`; telas de autenticação React | HU01, HU02 |
| RF02 | CRUD de cliente | Cadastro em `/api/auth/register`; leitura, alteração e exclusão em `/api/clients/me`; `ClientController`, `AuthService`, `AppUser` | HU01, HU03 |
| RF03 | Armazenar RG, CPF, nome, endereço e profissão do contratante | `java/model/AppUser.java`, `java/dto/ApiDtos.java`; cadastro/perfil React | HU01, HU03 |
| RF04 | Armazenar até três entidades empregadoras e respectivos rendimentos | `java/model/Employment.java`; coleção em `AppUser`; validações de `AuthService` e formulário | HU03 |
| RF05 | Cliente introduzir, modificar, consultar e cancelar pedidos | `java/controller/OrderController.java`, `java/service/RentalService.java`, `java/model/RentalOrder.java` | HU04, HU05, HU06 |
| RF06 | Empresa/banco modificar e avaliar pedidos | `OrderController`, `RentalService`; papel `COMPANY`/`BANK` de `java/model/Role.java` | HU07 |
| RF07 | Análise financeira e parecer positivo antes do contrato | `RentalService`; `reviewNotes`, `reviewedBy`, `OrderStatus`, `RentalContract` e `frontend/src/ClientFinancialSummary.jsx` | HU07, HU08 |
| RF08 | Veículo com matrícula, ano, marca, modelo e placa | `java/model/Vehicle.java`, `java/controller/VehicleController.java` | HU09 |
| RF09 | Propriedade do automóvel vinculada a cliente, empresa ou banco conforme contrato | `Vehicle.owner`, `RentalContract.owner` e `Role`; contratação em `RentalService` | HU08 |
| RF10 | Crédito opcional concedido por banco agente | `RentalContract.bank`, `creditAmount`, `interestRate`, `installments`; validação na contratação | HU10 |
| RF11 | Usuário criado pode criar pedido e visualizar seu status | Fluxo autenticação → frota → pedido → acompanhamento, via `/api/orders` | HU04, HU05 |
| RF12 | Acesso web centralizado para clientes e agentes | React → API HTTP → Spring → PostgreSQL | HU02 |

## Requisitos não funcionais e entregáveis

| ID | Exigência do enunciado | Evidência no projeto |
| --- | --- | --- |
| RNF01 | Java JDK 25 | `backend/pom.xml`, propriedade `java.version` |
| RNF02 | Spring Boot 4.0.x | Parent Spring Boot 4.0.9 no `backend/pom.xml` |
| RNF03 | Apache Maven | `backend/pom.xml`, Maven Wrapper |
| RNF04 | React + Vite | `frontend/package.json`, `frontend/src/` |
| RNF05 | Supabase (PostgreSQL) | Configuração JDBC em `backend/src/main/resources/application.properties`; execução normal exige credenciais PostgreSQL |
| RNF06 | Arquitetura MVC | React como View; controllers Spring; entidades, serviços e repositórios no Model; [diagrama de pacotes atual](uml/v3/pacotes.puml) |
| DOC01 | Diagrama de casos de uso | Versões `v1`, `v2` e [v3 atual](uml/v3/casos-de-uso.puml), com fontes e SVGs |
| DOC02 | Histórias de usuário | [Histórias e critérios de aceite](HISTORIAS-USUARIO.md) |
| DOC03 | Diagrama de classes | Versões `v1`, `v2` e [v3 atual](uml/v3/classes.puml), incluindo as condições preservadas do contrato |
| DOC04 | Diagrama de pacotes / visão lógica | Versões `v1`, `v2` e [v3 atual](uml/v3/pacotes.puml), com dependências da interface e serviços Java |
| DOC05 | Comparar modelos iniciais e implementação e preservar versões | [Modelagem](MODELAGEM.md), diretórios `v1`, `v2` e `v3`; revisão técnica de 3–4 de novembro de 2026 |
| DOC06 | README adaptado ao template da disciplina | `README.md` com as seções pertinentes ao projeto |
| DOC07 | GitHub atualizado com modelos e código final | Código, fontes UML, diagramas SVG e documentação versionados no [repositório do projeto](https://github.com/barskosa/DiawLab2) |
| DOC08 | Revisar modelos conforme feedback em aula | Estrutura versionada preparada; nenhum feedback de aula foi fornecido nesta implementação |

## Verificação dos requisitos no código de testes

Os métodos abaixo permitem localizar verificações reproduzíveis das regras e dos acessos. `Fluxo` refere-se a [RentalFlowTest](../backend/src/test/java/br/com/rota/RentalFlowTest.java), e `HTTP` a [HttpSecurityTest](../backend/src/test/java/br/com/rota/HttpSecurityTest.java).

| Requisitos | Exemplos de verificação automatizada |
| --- | --- |
| RF01 — cadastro, login e sessão | `HTTP.registrationLoginCookieAndLogoutLifecycle`, `HTTP.allBusinessEndpointsRequireLogin`, `HTTP.agentRegistrationRequiresServerInvitation` |
| RF02 — manutenção e exclusão do cadastro | `Fluxo.profileUpdateAndDeletionRespectActiveOrders`, `Fluxo.accountDeletionIsAllowedOnTheExclusiveReturnDateAndPreservesSignedNames` |
| RF03/RF04 — documentos e até três rendimentos | `HTTP.dtoValidationAndCpfValidationRunBeforePersistence`, `Fluxo.identityValidationEnforcesCpfEmployerLimitAndAgentInvitation` |
| RF05/RF11 — operações e acompanhamento do pedido | `Fluxo.completeFinancialApprovalAndContractLifecycle`, `Fluxo.editingApprovedOrderRequiresAnotherFinancialReview`, `Fluxo.pendingRequestCanBeCancelledAndCannotBeReviewedAfterwards` |
| RF06 — empresa e banco modificam pedidos | `Fluxo.bothAgentRolesCanModifyOrdersAndTheirChangesRequireAnotherReview` |
| RF07 — aprovação financeira antes da contratação | `Fluxo.noContractWithoutFinancialApproval`, `Fluxo.editingApprovedOrderRequiresAnotherFinancialReview` |
| RF08 — automóvel e permissões da frota | `Fluxo.onlyAnAgentCanRegisterVehiclesOrReadOtherClientProfiles`, `HTTP.fullRentalLifecycleLoadsAssociationsAcrossIndependentHttpTransactions` |
| RF09 — propriedade de cliente, empresa e banco | `Fluxo.completeFinancialApprovalAndContractLifecycle`, `Fluxo.cannotDoubleBookAnApprovedRequestOrCreateAnOverlappingRequest`, `Fluxo.onlyGrantingBankCanAttachCreditToContract` |
| RF10 — crédito opcional e banco concedente | `Fluxo.onlyGrantingBankCanAttachCreditToContract`, `HTTP.fullRentalLifecycleLoadsAssociationsAcrossIndependentHttpTransactions` |
| RF12 — servidor HTTP e isolamento de acesso | `HTTP.clientsCannotAccessAnotherClientsOrderOrAgentOperations`, `HTTP.fullRentalLifecycleLoadsAssociationsAcrossIndependentHttpTransactions` |

As revisões técnicas também acrescentam verificações de [concorrência](../backend/src/test/java/br/com/rota/ConcurrentRentalTest.java) e da [migração de contratos V1 → V2](../backend/src/test/java/br/com/rota/ContractMigrationTest.java). A quantidade e o resultado da execução mais recente ficam na seção [Testes do README](../README.md#testes).

## Decisões de implementação

As regras abaixo detalham lacunas do enunciado. Elas são decisões deste projeto e devem ser explicadas na apresentação, sem atribuí-las ao professor.

| ID | Decisão | Motivo e comportamento |
| --- | --- | --- |
| DEC01 | Papéis `CLIENT`, `COMPANY`, `BANK` na mesma entidade `AppUser` | Centraliza autenticação sem repetir credenciais; o papel determina as regras de domínio |
| DEC02 | Cadastro de agentes exige código privado do servidor | Um visitante não pode simplesmente escolher privilégios de avaliação/contratação sem autorização do responsável |
| DEC03 | Cliente acessa apenas seus próprios dados/pedidos/contratos | A sessão identifica o UUID imutável e verifica se a conta está ativa; reutilizar um nome de usuário não transfere uma sessão antiga. Agentes veem os pedidos necessários à análise |
| DEC04 | Cadastro do cliente é o Create do CRUD; perfil é Read/Update/Delete | Mantém uma identidade única entre acesso e contratante; agentes podem consultar e editar perfis |
| DEC05 | Exclusão de cliente desativa a identidade e anonimiza o cadastro | Preserva as referências e os nomes já registrados em contratos; a anonimização não apaga as condições de contratos emitidos. Pedidos em análise/aprovados ou contratos vigentes impedem a exclusão |
| DEC06 | Fluxo de status explícito | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `CONTRACTED`; somente aprovados podem ser contratados |
| DEC07 | Edição invalida parecer anterior | Alterar um pedido pendente/aprovado retorna a `PENDING`; preço/período/veículo alterados precisam de nova análise |
| DEC08 | Diária de aluguel e cálculo no servidor | Total = diária × `max(1, dias entre retirada e devolução)`; datas não retroativas, devolução igual ou posterior à retirada e anos com até quatro dígitos, até 9999 |
| DEC09 | Intervalos de aluguel são semiabertos | Retirada incluída, devolução excluída; aluguel no mesmo dia ocupa uma diária. Permite devolver e iniciar outro aluguel na mesma data |
| DEC10 | Aprovação não reserva definitivamente o veículo | Pedidos podem concorrer até contratar; contrato é criado em transação com bloqueio do veículo e nova checagem de conflito |
| DEC11 | Crédito é opcional e fica embutido no contrato | Dispensa recurso independente sem ciclo de vida próprio no escopo; valor, banco, taxa e parcelas são preservados |
| DEC12 | Só o banco autenticado concede seu crédito | Evita empresa ou outro banco conceder crédito em nome alheio; empresa pode executar contrato sem crédito |
| DEC13 | Propriedade segue o contrato | `CLIENT` aponta ao cliente do pedido; `COMPANY` à empresa executora; `BANK` ao banco permitido pela operação. A frota registra o proprietário corrente |
| DEC14 | Veículo com histórico não é removido | Evita perder referências de pedidos e contratos; matrícula e placa são únicas |
| DEC15 | Sessão HTTP, BCrypt e proteção CSRF | Evita persistir tokens no navegador e armazena apenas hash de senha; todas as mutações exigem CSRF |
| DEC16 | Esquema PostgreSQL privado `rental` e migrações Flyway | Mantém dados fora do esquema exposto pela Data API; estrutura de banco versionada com validação do Hibernate |
| DEC17 | H2 restrito ao perfil de testes | Testes reproduzíveis sem credenciais; não substitui o PostgreSQL/Supabase da apresentação |
| DEC18 | Contrato preserva suas condições e os nomes das partes | Campos `snapshot*` são copiados na contratação e usados nos DTOs; alterações no cadastro/frota não reescrevem o contrato. A migração V2 preenche contratos anteriores com os dados conhecidos na migração |
| DEC19 | Criação de pedido e manutenção/exclusão do cadastro são serializadas | O bloqueio do cadastro impede criar um pedido para uma identidade desativada por uma operação concorrente |

## Permissões

| Operação | Cliente | Empresa | Banco |
| --- | --- | --- | --- |
| Cadastrar e entrar na própria conta | Sim | Sim, com código no cadastro | Sim, com código no cadastro |
| Consultar/editar/excluir o próprio perfil de cliente | Sim, com regras de histórico | Não se aplica | Não se aplica |
| Consultar/editar perfis de clientes | Não | Sim | Sim |
| Consultar frota e bancos | Sim | Sim | Sim |
| Cadastrar/editar/excluir veículo | Não | Sim | Sim |
| Criar pedido | Sim | Não | Não |
| Consultar pedidos | Próprios | Todos | Todos |
| Editar pedido pendente/aprovado | Próprios | Todos | Todos |
| Cancelar pedido pendente/aprovado | Próprios | Não | Não |
| Emitir parecer de pedido pendente | Não | Sim | Sim |
| Executar contrato de pedido aprovado | Não | Sim | Sim |
| Conceder crédito no contrato | Não | Não | Sim, em nome próprio |
| Consultar contratos | Próprios | Todos | Todos |

As permissões da interface tornam os fluxos compreensíveis; a segurança efetiva é verificada pelos controllers/serviços no servidor.
