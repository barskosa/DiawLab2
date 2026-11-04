# Histórias de usuário

As histórias traduzem o enunciado em comportamentos verificáveis. As decisões adicionais estão identificadas em [Requisitos](REQUISITOS.md).

## HU01 — Cadastrar acesso e identificação

**Como cliente**, quero cadastrar meu acesso e meus dados de identificação para solicitar um aluguel.

Critérios de aceite:

1. Dado um visitante, quando informa usuário, senha, nome, RG, CPF válido, endereço e profissão, o cadastro de cliente é criado e ele pode fazer login.
2. Usuário e CPF duplicados são recusados, inclusive pelo servidor.
3. Campos obrigatórios ausentes ou dados inválidos retornam erro compreensível e não criam cadastro parcial.
4. A senha é armazenada como hash e não aparece nas respostas de cadastro, consulta ou erro.
5. Vínculos empregatícios, quando informados, respeitam HU03.

**Como empresa ou banco**, quero cadastrar uma identidade de agente autorizada para analisar e executar pedidos.

Critérios de aceite:

1. O cadastro identifica o papel da entidade e exige usuário, senha, nome e código de agente.
2. Código vazio, incorreto ou não configurado no servidor impede a criação do agente.
3. Após entrar, o agente encontra ações correspondentes ao seu papel.

## HU02 — Autenticar e proteger o sistema

**Como usuário cadastrado**, quero entrar com usuário e senha e encerrar a sessão para controlar meu acesso ao sistema.

Critérios de aceite:

1. Credenciais válidas criam sessão e apresentam a área autenticada.
2. Credenciais inválidas retornam mensagem de falha sem revelar hash ou dados internos.
3. Sem sessão, consultar recursos de negócio retorna 401 e a interface solicita login.
4. Depois de sair, a sessão anterior não permite consultar recursos protegidos.
5. Requisição de escrita sem token CSRF válido é recusada.
6. Um cliente não acessa dados de outro cliente ao trocar IDs na URL ou no corpo de uma requisição.
7. A sessão permanece vinculada à identidade original por UUID. Se uma conta for excluída e seu nome de usuário for reutilizado, uma sessão antiga não acessa a nova conta.

## HU03 — Manter cadastro do cliente e rendimentos

**Como cliente**, quero consultar, alterar e excluir meu cadastro para manter meus dados atualizados.

Critérios de aceite:

1. A consulta apresenta os dados do usuário autenticado.
2. A alteração salva nome, RG, CPF, endereço, profissão e até três pares de empregador/rendimento.
3. A tentativa de enviar um quarto vínculo é recusada pelo servidor.
4. Cada vínculo contém entidade empregadora e valor de rendimento válido.
5. A exclusão é impedida quando há pedido pendente/aprovado ou contrato vigente.
6. Quando permitida, a exclusão encerra o acesso e anonimiza o cadastro, preservando referências históricas e os nomes já registrados em contratos.
7. A exclusão e a criação de pedido do mesmo cliente são serializadas; um pedido não é criado para uma conta desativada por uma operação concorrente.

**Como agente**, quero consultar e atualizar os dados de clientes para apoiar a análise dos pedidos.

Critérios de aceite:

1. Empresas e bancos autenticados conseguem listar clientes e editar seus dados cadastrais.
2. A edição obedece às mesmas validações de documentos e rendimentos.
3. A senha não é disponibilizada ao agente e o papel do cliente não pode ser promovido pela edição de perfil.

## HU04 — Solicitar aluguel

**Como cliente**, quero escolher um automóvel e um período para enviar um pedido de aluguel.

Critérios de aceite:

1. A frota apresenta os automóveis cadastrados, com suas características e diária.
2. Um período válido cria um pedido `PENDING` vinculado ao cliente autenticado.
3. O servidor calcula o total a partir da diária e do período, com ao menos uma diária.
4. Datas no passado, devolução anterior à retirada e automóvel inexistente são recusados.
5. Um período ocupado por contrato já existente é recusado.
6. Empresa e banco não criam pedidos em nome de clientes pela rota de criação.

## HU05 — Consultar e alterar pedido

**Como cliente**, quero consultar o status e alterar meu pedido antes da contratação para acompanhar e ajustar a solicitação.

Critérios de aceite:

1. A listagem contém apenas pedidos próprios e mostra o status e o valor.
2. Os detalhes apresentam veículo, período, observações e parecer quando existente.
3. Pedido pendente ou aprovado pode ser alterado pelo titular.
4. Ao alterar um pedido, o valor é recalculado e o status retorna a `PENDING`, removendo o parecer anterior.
5. Pedido cancelado, rejeitado ou contratado não pode ser alterado.

## HU06 — Cancelar pedido

**Como cliente**, quero cancelar um pedido antes da contratação para desistir da solicitação.

Critérios de aceite:

1. O titular pode cancelar pedido `PENDING` ou `APPROVED` após confirmar a ação.
2. O status passa para `CANCELLED` e permanece consultável no histórico.
3. Outro cliente não consegue cancelar esse pedido.
4. Pedido contratado, rejeitado ou já cancelado não é cancelado novamente pela rota de pedidos.

## HU07 — Analisar e modificar pedidos

**Como agente de empresa ou banco**, quero revisar as condições financeiras e registrar um parecer para decidir sobre o aluguel.

Critérios de aceite:

1. O agente consulta identificação, profissão, empregadores, rendimentos e renda mensal total nos detalhes e na avaliação do pedido, sem precisar editar o cadastro.
2. Para pedido `PENDING`, o agente registra aprovação ou rejeição acompanhada do parecer.
3. O servidor registra o responsável pela análise e o status `APPROVED` ou `REJECTED`.
4. Um cliente não emite parecer, mesmo chamando a API diretamente.
5. O agente pode modificar pedido pendente/aprovado; a modificação exige nova análise, conforme HU05.
6. A avaliação é um parecer registrado pelo agente; o sistema não afirma realizar análise automática de crédito ou consulta a bureaus externos.

## HU08 — Executar contrato e registrar propriedade

**Como agente**, quero executar o contrato de um pedido aprovado e definir o proprietário do automóvel para formalizar o aluguel.

Critérios de aceite:

1. Somente pedido `APPROVED` origina um contrato.
2. Um pedido origina no máximo um contrato.
3. A operação registra cliente, veículo, período, valor, propriedade e instante de execução.
4. `CLIENT` vincula a propriedade ao contratante; `COMPANY` à empresa executora; `BANK` ao banco permitido pela operação.
5. O pedido passa para `CONTRACTED` e o contrato fica disponível ao titular e aos agentes.
6. A contratação revalida disponibilidade do automóvel sob transação/bloqueio; dois pedidos conflitantes não são contratados para o mesmo período.
7. Contrato sem crédito é permitido.
8. Na contratação, os dados do veículo, a diária negociada e os nomes do cliente, proprietário e banco são copiados para o contrato. Alterações posteriores do cadastro ou da frota não alteram as condições apresentadas nesse documento.

## HU09 — Manter frota

**Como agente**, quero cadastrar e manter os automóveis disponíveis para permitir solicitações de aluguel.

Critérios de aceite:

1. O cadastro exige matrícula, ano, marca, modelo, placa, categoria e diária válida.
2. Matrícula e placa duplicadas são recusadas.
3. O automóvel recém-criado pertence inicialmente ao agente que o cadastrou.
4. O agente pode consultar e editar veículos; o cliente pode apenas consultá-los.
5. Um veículo sem histórico de pedidos pode ser excluído; veículo referenciado por pedido tem a exclusão bloqueada.

## HU10 — Conceder crédito opcional

**Como banco agente**, quero associar crédito ao contrato para registrar o financiamento concedido no aluguel.

Critérios de aceite:

1. O banco autenticado pode informar crédito ao executar contrato aprovado.
2. O banco do crédito é o próprio banco autenticado; uma empresa ou outro banco não concede crédito em seu nome.
3. O valor é positivo e não supera o valor do contrato; taxa não negativa; quantidade de parcelas positiva.
4. O contrato apresenta banco, valor, taxa e parcelas quando há crédito.
5. Sem crédito, esses dados ficam ausentes.
6. O protótipo registra as condições do crédito; não executa cobrança, pagamento ou simulação de amortização.
