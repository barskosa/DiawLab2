# Configuração da API e do Supabase

Este guia configura o Rota para execução local com o banco exigido pelo laboratório. A API é o próprio back-end Java. Não há integração obrigatória com pagamentos, FIPE, envio de e-mail ou outro serviço externo.

## 1. Conferir o ambiente

No PowerShell:

```powershell
java -version
node --version
npm.cmd --version
```

O Java deve indicar **25**. Se houver mais de um JDK instalado, configure `JAVA_HOME` para a pasta do JDK 25 e inclua seu diretório `bin` no `PATH`. Feche e reabra o terminal depois de alterar variáveis do Windows. `JAVA_HOME` aponta para a pasta do JDK, sem acrescentar `bin`.

Uma distribuição disponível é o [Eclipse Temurin JDK 25](https://adoptium.net/temurin/releases/?version=25). Para selecionar uma instalação já existente somente no terminal atual, adapte o caminho:

```powershell
$env:JAVA_HOME = 'C:\caminho\para\jdk-25'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
java -version
```

O projeto inclui Maven Wrapper em `backend`, portanto não depende de `mvn` instalado globalmente. Na primeira execução ele baixa a distribuição Maven e as dependências.

## 2. Criar o projeto no Supabase

1. Acesse o [painel do Supabase](https://supabase.com/dashboard) e crie um projeto em sua organização.
2. Escolha uma senha forte para o **banco de dados**, guarde-a e aguarde a conclusão do provisionamento.
3. Abra o projeto e clique em **Connect**.
4. Selecione **Session pooler**, na porta **5432**, e consulte a opção JDBC quando disponível.
5. Copie o host e o usuário exibidos. O usuário do pooler normalmente tem formato `postgres.PROJECT_REF`; ele é diferente do usuário `postgres` de uma conexão direta.

O Session pooler permite conexão em redes IPv4 e mantém compatibilidade com as sessões de banco usadas pelo Hibernate. Copie o host do painel; ele não deve ser deduzido a partir da região. O Supabase documenta esse fluxo em [Conexão com PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres) e no [guia Spring Boot](https://supabase.com/docs/guides/getting-started/quickstarts/spring-boot).

## 3. Preencher o back-end

Na raiz do repositório:

```powershell
Copy-Item backend/.env.example backend/.env
```

Abra `backend/.env` e substitua os valores de exemplo:

```dotenv
DB_URL=jdbc:postgresql://SEU_HOST_DO_POOLER:5432/postgres?sslmode=require
DB_USERNAME=postgres.SEU_PROJECT_REF
DB_PASSWORD=SUA_SENHA_DO_BANCO
APP_AGENT_REGISTRATION_CODE=SEU_CODIGO_PRIVADO_PARA_AGENTES
FRONTEND_ORIGIN=http://localhost:5173
SERVER_PORT=8080
SESSION_COOKIE_SECURE=false
```

| Variável | Como preencher |
| --- | --- |
| `DB_URL` | URL JDBC com host real, porta `5432`, banco `postgres` e `sslmode=require` |
| `DB_USERNAME` | Usuário completo fornecido pelo Session pooler |
| `DB_PASSWORD` | Senha do banco definida na criação do projeto, não a senha da sua conta Supabase |
| `APP_AGENT_REGISTRATION_CODE` | Código escolhido por você para autorizar cadastro de empresas/bancos |
| `FRONTEND_ORIGIN` | Origem exata do front-end; padrão `http://localhost:5173` |
| `SERVER_PORT` | Porta da API; padrão `8080` |
| `SESSION_COOKIE_SECURE` | `false` para HTTP local; `true` para HTTPS em produção |

A senha fica separada da URL; não é necessário inseri-la como parâmetro JDBC. O arquivo é carregado pelo Spring como **Java Properties**, por `spring.config.import=optional:file:.env[.properties]`: use `CHAVE=valor`, sem `export` e sem aspas externas. Caso sua senha contenha uma barra invertida (`\`), escape-a como `\\` no arquivo Properties ou forneça a senha diretamente como variável de ambiente do processo. Variáveis de ambiente do sistema também podem ser usadas, sem manter `.env`.

O diretório de trabalho importa: inicie a API dentro de `backend/`, onde está o `.env`. Nunca coloque `DB_PASSWORD` nem o código de agentes em uma variável `VITE_*`, que seria incorporada ao JavaScript enviado ao navegador. O `.env` local deve permanecer fora do Git.

### O que não é necessário configurar

- Nenhuma chave pública `anon` ou `publishable` do Supabase.
- Nenhuma chave privada `service_role` ou `secret`.
- Supabase Auth, provedores OAuth, confirmação de e-mail ou URLs de redirecionamento.
- Tabelas manuais no esquema `public` ou acesso direto do React ao banco.

A autenticação usa Spring Security com usuário e senha da aplicação. Supabase fornece o PostgreSQL acessado exclusivamente pelo servidor Java.

## 4. Inicializar o esquema

Dentro de `backend`:

```powershell
.\mvnw.cmd spring-boot:run
```

O Flyway cria o esquema **`rental`**, sua tabela de controle de migrações e as tabelas da aplicação. O usuário JDBC precisa ter permissão para criar o esquema e as tabelas; o usuário fornecido pelo painel do projeto permite a configuração inicial. As migrações ficam em `backend/src/main/resources/db/migration` e são executadas uma vez por versão. Hibernate usa `ddl-auto=validate`, evitando alterações silenciosas no modelo de dados.

Não adicione `rental` à lista de esquemas expostos pela Data API do Supabase. Toda autorização passa pelo Spring. No SQL Editor do Supabase, uma verificação opcional e somente de leitura é:

```sql
select table_schema, table_name
from information_schema.tables
where table_schema = 'rental'
order by table_name;
```

O início normal não gera dados de demonstração. Após o primeiro cadastro pela interface, o usuário deve aparecer no esquema `rental`.

Em 2 de novembro de 2026, a conexão foi validada localmente com um projeto real do Supabase, usando Session pooler e SSL: a migração V1 criou as tabelas, o Hibernate validou os mapeamentos e a API iniciou normalmente. Uma consulta de autenticação feita pelo front-end confirmou acesso ao PostgreSQL e funcionamento de sessão, CSRF e proxy, sem criar contas de teste no banco real. As credenciais dessa instalação permanecem no `.env` local.

## 5. Configurar e iniciar o front-end

Na raiz, copie o exemplo:

```powershell
Copy-Item frontend/.env.example frontend/.env
```

O padrão é:

```dotenv
VITE_API_BASE_URL=
```

Uma base vazia usa caminhos relativos como `/api/orders`. O proxy de desenvolvimento do Vite direciona `/api` para `http://127.0.0.1:8080`, preservando a sessão sem exigir configurações adicionais de CORS.

Dentro de `frontend`, em outro terminal:

```powershell
npm.cmd ci
npm.cmd run dev
```

Abra **http://localhost:5173**. Use o mesmo endereço durante o teste; alternar entre `localhost` e `127.0.0.1` altera a origem e os cookies. As chamadas da interface usam `credentials: 'include'` e obtêm um token de `/api/auth/csrf` antes de mutações.

Se a porta `5173` já estiver ocupada por outro projeto, o Vite poderá iniciar na `5174`. Nesse caso, defina `FRONTEND_ORIGIN=http://localhost:5174` em `backend/.env`, reinicie a API e acesse a porta exibida pelo Vite. Também é possível encerrar o outro projeto e manter a configuração padrão.

Se mudar a porta do Spring, ajuste também o alvo do proxy no `vite.config.js`. Se usar API em outra origem, defina `VITE_API_BASE_URL` como a origem, **sem `/api` no final**, por exemplo `https://api.seudominio.com`, e configure a origem permitida em `FRONTEND_ORIGIN`; prefira a mesma origem em uma publicação para simplificar cookies.

## 6. Preparar as contas para apresentar

1. Configure `APP_AGENT_REGISTRATION_CODE` no servidor e mantenha esse valor privado.
2. Na tela de cadastro, escolha **Empresa** ou **Banco** e informe o código. Código vazio ou incorreto impede o cadastro de agentes.
3. Faça login como agente e cadastre a frota.
4. Saia e crie um cliente. Informe identificação, endereço, profissão e até três entidades empregadoras/rendimentos.
5. Faça um pedido como cliente e entre como agente para avaliar e contratar.

O papel é persistido no banco e verificado pelo servidor. Alterar dados do navegador não concede privilégios. O código autoriza apenas a criação do agente; os acessos seguintes usam usuário e senha.

## Publicação

O deploy precisa executar um processo **Java 25** persistente conectado ao Supabase e servir os arquivos estáticos gerados pelo Vite. Uma configuração de mesma origem deve servir `/` a partir do build e encaminhar `/api` ao Spring, preservando cabeçalhos e cookies.

No servidor, configure as variáveis de ambiente sem incluir senhas no repositório. Use HTTPS, `SESSION_COOKIE_SECURE=true`, `FRONTEND_ORIGIN` com a origem publicada e `VITE_API_BASE_URL` compatível com o roteamento. A base Vite é lida no build: alterá-la requer recompilar a interface.

O arquivo `.env` do servidor, quando usado, deve ficar no diretório de trabalho do processo Java. Uma sessão expira após 30 minutos de inatividade; reiniciar o servidor invalida sessões em memória. Clientes e contratos continuam no PostgreSQL. Mais de uma instância Java exige configurar armazenamento compartilhado de sessões ou afinidade de conexão; essa topologia não faz parte do protótipo local.

## Resolução de problemas

| Sintoma | Conferir |
| --- | --- |
| `release version 25 not supported` | `JAVA_HOME`, `java -version` e JDK selecionado pelo terminal/IDE |
| Maven não está no PATH | Usar `.\mvnw.cmd` dentro de `backend`, em vez de `mvn` |
| PowerShell bloqueia `npm.ps1` | Usar `npm.cmd` nos comandos |
| `DB_URL` não resolvido | Criar `backend/.env` e iniciar a API nesse diretório |
| `password authentication failed` | Senha do banco e usuário completo `postgres.PROJECT_REF` |
| Timeout de conexão com PostgreSQL | Projeto Supabase ativo, host copiado do painel, porta `5432` e rede/firewall |
| Erro em prepared statement | Usar Session pooler `5432`; conferir se foi escolhida a porta de Transaction pooler `6543` |
| `schema rental` ou permissão negada | Permissões do usuário JDBC e logs de migração Flyway |
| Interface não conecta à API | Processo Spring ativo em `8080`, proxy Vite e origem do navegador |
| Cadastro de agente recusado | Código do formulário igual a `APP_AGENT_REGISTRATION_CODE` não vazio; reiniciar API após editar configuração |
| 401 após deixar a aba aberta | Sessão expirada; fazer login novamente |
| 403 em mutação manual da API | Obter CSRF e enviar o cabeçalho indicado, além do cookie da mesma sessão |

Para erros de banco, examine a causa original no log antes de mensagens derivadas do Hibernate. Não publique o `.env`, a senha ou URLs que contenham credenciais ao pedir ajuda.
