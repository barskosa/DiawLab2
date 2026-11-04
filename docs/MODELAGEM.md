# Modelagem do sistema

O enunciado solicita casos de uso, histórias de usuário, classes, pacotes e revisão dos modelos em relação ao software. Este diretório preserva três versões: conceitual (`v1`), implementação inicial (`v2`) e revisão técnica de **3–4 de novembro de 2026** (`v3`), correspondente ao código atual.

As versões `v1` e `v2` foram elaboradas durante a implementação inicial. A `v3` registra mudanças observadas na auditoria do próprio código, incluindo a preservação das condições contratuais e a apresentação dos rendimentos na análise financeira. Não havia modelos anteriores ou feedback de aula no checkout inicial; nenhuma dessas revisões é atribuída a uma aprovação ou orientação histórica do professor.

## Versão 1 — modelo conceitual

O modelo inicial descreve o domínio do enunciado antes de escolher os detalhes de persistência: clientes, empresas e bancos como especializações de usuário, pedidos avaliados por agentes e crédito como conceito opcional do contrato.

| Modelo | Fonte editável | Visualização |
| --- | --- | --- |
| Casos de uso | [casos-de-uso.puml](uml/v1/casos-de-uso.puml) | [SVG](uml/v1/casos-de-uso.svg) |
| Classes | [classes.puml](uml/v1/classes.puml) | [SVG](uml/v1/classes.svg) |
| Pacotes / visão lógica | [pacotes.puml](uml/v1/pacotes.puml) | [SVG](uml/v1/pacotes.svg) |

### Casos de uso conceituais

![Casos de uso v1](uml/v1/casos-de-uso.svg)

### Classes conceituais

![Classes v1](uml/v1/classes.svg)

### Pacotes conceituais

![Pacotes v1](uml/v1/pacotes.svg)

## Versão 2 — modelo da implementação

Esta versão registra a primeira implementação em `backend/src/main/java/br/com/rota` e `frontend/src`. Suas fontes e SVGs permanecem preservados. Para os campos e as dependências do código atual, consulte a **versão 3** abaixo.

| Modelo | Fonte editável | Visualização |
| --- | --- | --- |
| Casos de uso | [casos-de-uso.puml](uml/v2/casos-de-uso.puml) | [SVG](uml/v2/casos-de-uso.svg) |
| Classes persistidas | [classes.puml](uml/v2/classes.puml) | [SVG](uml/v2/classes.svg) |
| Pacotes / MVC | [pacotes.puml](uml/v2/pacotes.puml) | [SVG](uml/v2/pacotes.svg) |

### Casos de uso implementados

![Casos de uso v2](uml/v2/casos-de-uso.svg)

O ator `Agente` representa a generalização de empresa e banco. Clientes consultam apenas seus dados. Recursos de negócio exigem autenticação; cadastro e entrada ficam disponíveis ao visitante. A concessão de crédito aparece como extensão opcional da contratação e é restrita ao banco autenticado.

### Classes persistidas

![Classes v2](uml/v2/classes.svg)

O diagrama representa entidades, enumerações e o valor embutido `Employment`. Os serviços, repositórios e DTOs estão na visão de pacotes. Cardinalidades refletem a regra de domínio: por exemplo, um pedido pode não ter contrato e um cliente possui no máximo três vínculos, embora o máximo seja validado no serviço.

### Pacotes e MVC

![Pacotes v2](uml/v2/pacotes.svg)

| Elemento | Responsabilidade | Código |
| --- | --- | --- |
| View | Páginas, formulários e navegação | `frontend/src/App.jsx`, `forms.jsx`, `components.jsx` |
| Cliente HTTP | JSON, sessão, token CSRF e tratamento de falhas | `frontend/src/api.js` |
| Controller | Receber HTTP, validar entradas e entregar DTOs | `backend/src/main/java/br/com/rota/controller` |
| Services | Regras de domínio, autorização e transações | `AuthService`, `RentalService` |
| Model | Estado do domínio e relações | `AppUser`, `Employment`, `Vehicle`, `RentalOrder`, `RentalContract` |
| Repository | Consultas e persistência JPA | `UserRepository`, `VehicleRepository`, `OrderRepository`, `ContractRepository` |
| DTO | Delimitar os dados expostos sem serializar entidades/senhas | `dto/ApiDtos.java` |
| Config / Exception | Segurança e apresentação consistente dos erros | Pacotes `config` e `exception` |

## Comparação das versões e justificativas

A tabela registra a passagem do conceito (`v1`) para a primeira implementação (`v2`). A [revisão da versão 3](#versão-3--revisão-do-código-e-dos-modelos) detalha as mudanças posteriores e suas evidências.

| Conceito da v1 | Implementação na v2 | Justificativa |
| --- | --- | --- |
| `Usuario`, `Cliente`, `Agente`, `Empresa`, `Banco` em hierarquia | Uma entidade `AppUser` com enum `Role` | Credenciais centralizadas; regras diferenciam pessoas e agentes pelo papel sem duplicar tabelas de login |
| Vínculo empregatício | `Employment` como `@Embeddable` e coleção em `AppUser` | Valor pertence ao cadastro e não tem ciclo de vida independente; limite de três no serviço |
| Automóvel | `Vehicle` | Preserva matrícula, ano, marca, modelo e placa; acrescenta diária/categoria para solicitar e calcular aluguel |
| Pedido e parecer financeiro | `RentalOrder`, `OrderStatus`, `reviewNotes`, `reviewedBy` | Parecer e responsável pertencem à decisão sobre o pedido; não requerem entidade independente |
| Contrato de aluguel | `RentalContract` com relação única ao pedido | Um pedido gera no máximo um contrato após aprovação |
| Contrato de crédito | Atributos opcionais em `RentalContract` e referência `bank` | Crédito é concedido no momento da contratação e não possui operações próprias no escopo do protótipo |
| Proprietário de automóvel | `Vehicle.owner` e `RentalContract.owner`, ambos `AppUser` | O papel do proprietário permite cliente, empresa ou banco; contrato preserva a definição daquela operação |
| Subsistemas de gestão e páginas | Back-end Spring MVC e front-end React | Separação das duas responsabilidades indicadas no enunciado com comunicação HTTP |
| Autenticação conceitual | Spring Security, sessão, BCrypt e CSRF | Define como credenciais e ações são protegidas no sistema executável |
| Cancelamento de pedido | Transição para `CANCELLED` | Mantém histórico consultável em vez de remover a solicitação |
| Exclusão de cliente | Desativação com anonimização e bloqueio de compromissos ativos | Preserva integridade referencial de pedidos/contratos históricos sem manter a identificação removida |

## Versão 3 — revisão do código e dos modelos

Esta revisão, de **3–4 de novembro de 2026**, acompanha mudanças efetivas nos serviços, no contrato persistido e na interface. Os arquivos de `v1` e `v2` foram mantidos para permitir a comparação solicitada no enunciado.

| Modelo | Fonte editável | Visualização |
| --- | --- | --- |
| Casos de uso revisados | [casos-de-uso.puml](uml/v3/casos-de-uso.puml) | [SVG](uml/v3/casos-de-uso.svg) |
| Classes atuais | [classes.puml](uml/v3/classes.puml) | [SVG](uml/v3/classes.svg) |
| Pacotes e MVC atuais | [pacotes.puml](uml/v3/pacotes.puml) | [SVG](uml/v3/pacotes.svg) |

### Casos de uso revisados

![Casos de uso v3](uml/v3/casos-de-uso.svg)

A avaliação financeira inclui a consulta da identificação, dos empregadores e dos rendimentos informados pelo cliente. A interface apresenta o total mensal e a proporção do valor do aluguel; a decisão e a justificativa continuam sob responsabilidade do agente, sem consulta a um serviço externo de crédito.

### Classes atuais e condições contratuais

![Classes v3](uml/v3/classes.svg)

`RentalContract` mantém as associações ao pedido, proprietário e banco e acrescenta dez campos `snapshot*`. Eles copiam matrícula, ano, marca, modelo, placa, diária negociada, categoria e nomes do cliente, proprietário e banco no momento da contratação. Os DTOs de contratos usam essas cópias para que alterações posteriores no cadastro ou na frota não reescrevam as condições já registradas.

A migração `V2__immutable_contract_terms.sql` adiciona os campos sem substituir a migração inicial. Para contratos anteriores à V2, o preenchimento usa os dados disponíveis no momento da migração; não reconstrói alterações históricas que não tenham sido registradas. Para novos contratos, a cópia ocorre na contratação.

A exclusão de cliente desativa a identidade e anonimiza o **cadastro**. Os nomes preservados em contratos continuam no histórico contratual. Essa distinção evita afirmar que a exclusão apaga a identificação de documentos já emitidos.

### Pacotes e dependências atuais

![Pacotes v3](uml/v3/pacotes.svg)

O diagrama inclui `Auth.jsx`, `ClientFinancialSummary.jsx` e `RentalDates`. As chamadas ao cliente HTTP partem de `App.jsx`, `Auth.jsx` e do resumo financeiro; os formulários recebem callbacks, e `components.jsx` reúne apresentação e suporte à interação. O back-end continua dividido em controllers, serviços, DTOs, entidades, repositórios, segurança e tratamento de erros.

| Achado na revisão | Alteração representada na v3 | Evidência no código |
| --- | --- | --- |
| Consultas do contrato dependiam dos nomes e dados correntes do cadastro/frota | Cópias das condições e nomes das partes em `RentalContract` | `model/RentalContract.java`, `service/RentalService.java`, migração `V2__immutable_contract_terms.sql` |
| Uma sessão precisava permanecer ligada à identidade original mesmo com reutilização de nome de usuário | Principal de sessão pelo UUID e verificação do usuário ativo | `service/AuthService.java` |
| Exclusão do cliente e criação de pedido precisavam compartilhar a verificação de identidade ativa | Bloqueio do cadastro nas operações que concorrem com sua exclusão | `AuthService.currentForUpdate`, `UserRepository.findLocked`, `RentalService.createOrder` |
| Agente precisava consultar rendimentos durante o próprio parecer | Resumo financeiro nos detalhes e na avaliação do pedido | `frontend/src/ClientFinancialSummary.jsx`, `App.jsx`, `forms.jsx` |
| Convenções de disponibilidade, diária mínima e fim do contrato precisavam ser uniformes | Serviço auxiliar `RentalDates` | `service/RentalDates.java`, `AuthService`, `RentalService` |
| O diagrama anterior simplificava incorretamente as dependências do front-end | `Auth.jsx` e resumo financeiro explícitos; remoção da ligação direta entre componentes/formulários e `api.js` | Importações em `frontend/src/` e [pacotes v3](uml/v3/pacotes.puml) |

Nos caminhos Java desta tabela, o prefixo é `backend/src/main/java/br/com/rota/`. A migração fica em `backend/src/main/resources/db/migration/`.

## Ciclo de vida do pedido

```mermaid
stateDiagram-v2
    [*] --> PENDING: cliente cria
    PENDING --> APPROVED: agente aprova
    PENDING --> REJECTED: agente rejeita
    PENDING --> CANCELLED: titular cancela
    APPROVED --> CANCELLED: titular cancela
    APPROVED --> CONTRACTED: agente executa contrato
    PENDING --> PENDING: titular/agente edita
    APPROVED --> PENDING: titular/agente edita e invalida parecer
    REJECTED --> [*]
    CANCELLED --> [*]
    CONTRACTED --> [*]
```

O valor é calculado no servidor. A aprovação registra o parecer, e a contratação revalida a disponibilidade do automóvel. Alterar um pedido aprovado o devolve à análise para evitar um contrato baseado em condições diferentes das aprovadas.

## Manutenção dos modelos

1. Preserve as fontes `.puml` e as versões anteriores.
2. Ao alterar entidades, associações, permissões ou fluxo, atualize os modelos correspondentes.
3. Crie `v4`, `v5` etc. quando uma nova revisão significativa precisar ser apresentada.
4. Registre a data, o requisito/feedback real, os arquivos alterados e a justificativa.
5. Reavalie a [matriz de requisitos](REQUISITOS.md) e as [histórias](HISTORIAS-USUARIO.md) após a mudança.

Os SVGs são artefatos de visualização gerados a partir das fontes PlantUML. Podem ser regenerados com uma instalação do [PlantUML](https://plantuml.com/):

```powershell
java -jar CAMINHO_DO_PLANTUML.jar -tsvg -charset UTF-8 docs/uml/v1/*.puml docs/uml/v2/*.puml docs/uml/v3/*.puml
```

As fontes declaram `!pragma layout smetana` para renderização pelo mecanismo Java. PlantUML é uma ferramenta de documentação e não é dependência da aplicação.
