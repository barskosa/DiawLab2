# Roteiro de apresentação e entrega

## Preparação

1. Prepare JDK 25 e o Supabase conforme [Instalação e execução no README](../README.md#instalação-e-execução).
2. Execute os testes do back-end e o build do front-end.
3. Inicie a API e o React em dois terminais.
4. Prepare dados de teste de uma empresa, um banco e dois clientes com documentos válidos distintos. Não use dados pessoais reais de terceiros.
5. Mantenha disponíveis o enunciado, o README, a modelagem `v1` e a modelagem `v2`.

## Demonstração sugerida

| Etapa | Ação | O que comprova |
| --- | --- | --- |
| 1 | Abrir a aplicação sem login e tentar consultar `/api/orders` | Sistema protegido por autenticação |
| 2 | Cadastrar uma empresa usando o código definido no servidor e entrar | Cadastro de agentes e login |
| 3 | Cadastrar veículo com matrícula, ano, marca, modelo e placa | Entidade automóvel e frota |
| 4 | Sair e cadastrar um cliente com identificação, profissão e rendimentos | Create do CRUD de cliente e limite de vínculos |
| 5 | Consultar o perfil, alterar endereço ou rendimento e recarregar a página | Read/Update e persistência no Supabase |
| 6 | Criar um pedido, consultar status e alterar suas datas | Protótipo exigido e operações de pedido |
| 7 | Criar outro pedido e cancelá-lo | Cancelamento preservando histórico |
| 8 | Entrar como empresa, consultar cliente/pedido e emitir parecer positivo | Análise financeira pelo agente |
| 9 | Executar o contrato aprovado, escolhendo propriedade do cliente ou empresa | Regra aprovação → contrato e titularidade |
| 10 | Entrar como cliente e consultar o contrato | Cliente acompanha o resultado da solicitação |
| 11 | Em um novo pedido aprovado, entrar como banco e contratar com crédito | Concessão opcional por banco e dados do crédito |
| 12 | Em conta sem compromissos ativos, excluir o cadastro e tentar entrar | Delete do CRUD e revogação do acesso |

Para demonstrar cada proprietário, crie contratos independentes: um com `CLIENT`, outro com `COMPANY` executado por empresa e outro com `BANK` executado por banco. Use períodos/veículos sem conflito.

## Validações negativas para mostrar

- Credenciais incorretas não autenticam.
- Cliente não possui ações de parecer/contratação e a API também recusa essas operações.
- Um quarto vínculo de empregador/rendimento não é aceito.
- CPF inválido ou duplicado impede o cadastro/alteração.
- Devolução anterior à retirada e datas retroativas são recusadas.
- Alterar pedido aprovado remove o parecer e exige nova análise.
- Contratação de pedido não aprovado é recusada.
- Dois contratos não ocupam o mesmo automóvel em período sobreposto.
- Empresa não concede crédito em nome de um banco.
- Exclusão de cliente com compromisso ativo é bloqueada.

## Comparação entre modelo e código

1. Apresente os [modelos conceituais `v1`](MODELAGEM.md#versão-1--modelo-conceitual).
2. Apresente os [modelos de implementação `v2`](MODELAGEM.md#versão-2--modelo-da-implementação).
3. Explique a unificação de clientes/agentes em `AppUser` com papel e a representação de vínculos como coleção de `Employment`.
4. Explique que o crédito não possui CRUD independente e seus atributos ficam em `RentalContract`, preservando a associação opcional a um banco.
5. Mostre a separação entre páginas React, controllers, serviços, entidades e repositórios Spring.
6. Use a [matriz de rastreabilidade](REQUISITOS.md) para relacionar requisito, fluxo e código.

As duas versões foram produzidas para esta implementação; não representam feedback histórico de aula. Quando o professor solicitar mudanças, preserve esta versão e crie uma nova pasta com os ajustes e seus motivos reais.

## Checklist antes de entregar

- [ ] Projeto Supabase ativo e credenciais locais conferidas.
- [ ] Aplicação executada com **JDK 25**, Spring Boot **4.0.x**, React + Vite e PostgreSQL/Supabase.
- [ ] Login, CRUD de cliente e criação/consulta de pedido demonstrados na base real.
- [ ] Agentes, parecer, contrato, propriedade e crédito demonstrados.
- [ ] Testes executados e resultado registrado de forma fiel.
- [ ] README revisado com nomes reais dos integrantes e divisão de contribuições.
- [ ] Modelos UML e histórias revisados em relação à versão final do código.
- [ ] Feedback de aula incorporado e documentado, caso exista.
- [ ] `.env`, senhas, código de agentes, `node_modules`, `target` e dados pessoais fora do commit.
- [ ] Código e todas as versões de UML enviados ao repositório GitHub.
- [ ] Link do repositório e forma de execução conferidos em outro checkout, quando possível.

Este checklist auxilia a preparação; a nota depende da avaliação do professor e da demonstração efetiva dos requisitos.
