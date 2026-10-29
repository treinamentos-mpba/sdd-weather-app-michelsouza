# Weather App — Backlog de Tarefas

> A spec é a fonte de verdade. Duas premissas de decomposição resolvem conflitos
> do plano: (1) AC-04.3 inclui resposta com zero dias, tratada como previsão
> parcial vazia com aviso (não como erro); (2) resultados válidos de geocoding
> são preservados na ordem da API, enquanto payload que viole campos obrigatórios
> é classificado como `invalid-payload`, sem descarte silencioso de registros.
>
> Cada critério usa Given/When/Then com resultado observável e cita o ID da spec quando existe rastreabilidade direta.
>
> A ordem de implementação é: tipos → funções puras → services → hooks → componentes → integração → testes → hardening. Cada tarefa depende apenas de IDs anteriores. A última tarefa de cada fase depende das demais tarefas da fase, de modo que a fase seguinte só começa quando a anterior está completa.
>
> Implementação e testes foram separados. Cada tarefa lista no máximo dois arquivos prováveis; a validação final não prevê edição de arquivos.

## Entrega 1 — Tipos

> Contratos compartilhados antes de qualquer implementação.

### T-01
- **ID:** T-01
- **Título acionável:** Definir contratos brutos e tipos de domínio
- **Descrição curta:** Declarar os formatos Open-Meteo e os tipos compartilhados da aplicação.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** os tipos de geocoding, **When** um resultado é declarado, **Then** `name`, `country`, `latitude` e `longitude` são obrigatórios e `admin1` é opcional (seção 2.1, AC-02.1, AC-02.3, EC-15).
  - **Given** os tipos de forecast, **When** os blocos são declarados, **Then** `current` e `daily` são tipos independentes; `daily` exige arrays alinhados de data, máxima, mínima e código (seção 2.1, AC-03.1, AC-04.1, AC-07.3, EC-14).
  - **Given** os tipos de domínio, **When** são inspecionados, **Then** `Unit` aceita apenas `celsius` e `fahrenheit`; `AppError` distingue `network`, `service`, `invalid-payload` e `timeout`; `AsyncState` inclui `idle`, `loading`, `success`, `empty` e `error` (RF-05, RF-06, RF-07, RF-08, NFR-04, EC-04, EC-05, EC-06).

- **Dependências (IDs ou "Nenhuma"):** Nenhuma
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/types/openMeteo.ts`, `src/types/domain.ts`
- **Tipo:** Data

## Entrega 2 — Funções puras

> Lógica determinística, sem React e sem I/O, depois dos tipos.

### T-02
- **ID:** T-02
- **Título acionável:** Implementar validação do termo de busca
- **Descrição curta:** Criar função pura para normalizar e validar o nome de cidade.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** `""`, `" "` ou `"a"`, **When** o termo é validado, **Then** o resultado é inválido, o valor normalizado tem menos de 2 caracteres e nenhuma exceção é lançada (RF-01, AC-01.2, EC-01).
  - **Given** `"  São Paulo  "`, **When** o termo é normalizado, **Then** o resultado válido é exatamente `"São Paulo"` (RF-01, AC-01.3, EC-10).
  - **Given** `"São Luís"`, `"Val-d'Or"` ou uma string de 200 caracteres, **When** a função é chamada, **Then** o texto é preservado após o trim e a chamada não lança exceção (EC-10, EC-12).

- **Dependências (IDs ou "Nenhuma"):** T-01
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/lib/searchTerm.ts`
- **Tipo:** Data

### T-03
- **ID:** T-03
- **Título acionável:** Implementar conversão de temperatura
- **Descrição curta:** Criar função pura de conversão e arredondamento Celsius/Fahrenheit.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** 25 °C, **When** convertido para Fahrenheit, **Then** o resultado exibido é 77 (RF-05, AC-05.2).
  - **Given** 20,6 °C, **When** convertido para Fahrenheit, **Then** o resultado exibido é 69 (RF-05, AC-05.2).
  - **Given** um valor original em Celsius convertido para Fahrenheit e de volta, **When** a unidade retorna a Celsius, **Then** o valor exibido é o Celsius original arredondado, sem usar o Fahrenheit como nova fonte (RF-05, AC-05.3).

- **Dependências (IDs ou "Nenhuma"):** T-01
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/lib/temperature.ts`
- **Tipo:** Data

### T-04
- **ID:** T-04
- **Título acionável:** Implementar mapeamento de códigos WMO
- **Descrição curta:** Mapear códigos meteorológicos para descrições em pt-BR.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** o código WMO 0, **When** ele é mapeado, **Then** retorna uma descrição não vazia em pt-BR, diferente de `"Condição desconhecida"` (RF-03, AC-03.1).
  - **Given** o código 999, **When** ele é mapeado, **Then** retorna exatamente `"Condição desconhecida"` (RF-03, AC-03.1).
  - **Given** o mesmo código chamado duas vezes, **When** as descrições são comparadas, **Then** são idênticas e a função não realiza I/O (RF-03).

- **Dependências (IDs ou "Nenhuma"):** T-01
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/lib/wmoCodes.ts`
- **Tipo:** Data

### T-05
- **ID:** T-05
- **Título acionável:** Implementar formatação de datas
- **Descrição curta:** Criar funções puras para datas da previsão e horário de atualização.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** a data local `2026-10-28` da cidade, **When** formatada para a previsão, **Then** o texto é `"qua, 28/10"` (RF-04, AC-04.2).
  - **Given** o instante local `2026-10-29T15:04`, **When** formatado como atualização, **Then** o texto é `"29/10/2026 15:04"` (RF-09, AC-09.1).
  - **Given** um instante que cai em dias diferentes no fuso da cidade e no fuso do dispositivo, **When** a data da previsão é formatada, **Then** o dia corresponde ao fuso da cidade, não ao do dispositivo (EC-11, AC-04.2).

- **Dependências (IDs ou "Nenhuma"):** T-01, T-02, T-03, T-04
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/lib/dateFormat.ts`
- **Tipo:** Data

## Entrega 3 — Services

> Acesso HTTP e normalização, depois das funções puras.

### T-06
- **ID:** T-06
- **Título acionável:** Implementar cliente HTTP resiliente
- **Descrição curta:** Encapsular `fetch`, timeout de 10 segundos, cancelamento e classificação de falhas.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** uma requisição sem resposta, **When** passam 10 segundos, **Then** ela é abortada e classificada como `timeout` (NFR-04, EC-05, AC-07.1).
  - **Given** falha de rede, resposta HTTP fora de 2xx (incluindo 429), ou JSON inválido, **When** o cliente trata a falha, **Then** o resultado é respectivamente `network`, `service` ou `invalid-payload`, sem renderizar o corpo inválido (EC-04, EC-06, EC-07, AC-07.1).
  - **Given** um `AbortSignal` já cancelado pelo chamador, **When** a requisição é interrompida antes do timeout, **Then** o cliente não a classifica como `timeout` (EC-08).

- **Dependências (IDs ou "Nenhuma"):** T-01, T-05
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/services/httpClient.ts`
- **Tipo:** Data

### T-07
- **ID:** T-07
- **Título acionável:** Implementar serviço de geocoding
- **Descrição curta:** Consultar a Open-Meteo e normalizar resultados válidos em `City[]`.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** o termo `"São Paulo"`, **When** a busca é montada, **Then** a URL contém o termo URL-encoded, `count=10` e `language=pt` (RF-01, AC-01.1, AC-01.3, seção 2.1).
  - **Given** resultados válidos, **When** são normalizados, **Then** a ordem da API é preservada e `admin1` ausente produz cidade sem região (AC-01.1, AC-02.1, AC-02.3, EC-15).
  - **Given** `results` ausente ou vazio, **When** a resposta é tratada, **Then** o serviço retorna lista vazia; **Given** ausência de `name`, `country`, `latitude` ou `longitude`, **Then** retorna `invalid-payload` e nenhum registro inválido (AC-08.2, EC-06).

- **Dependências (IDs ou "Nenhuma"):** T-02, T-06
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/services/geocodingService.ts`
- **Tipo:** Data

### T-08
- **ID:** T-08
- **Título acionável:** Implementar serviço de forecast por blocos
- **Descrição curta:** Consultar a Forecast API e validar `current` e `daily` independentemente.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** latitude `-12.97` e longitude `-38.5`, **When** a consulta é montada, **Then** a URL inclui essas coordenadas, `forecast_days=5`, `timezone=auto`, `temperature_unit=celsius` e os campos `current` e `daily` da seção 2.1 (AC-02.2, AC-04.1).
  - **Given** um bloco `current` válido e um bloco `daily` ausente, ou o inverso, **When** a resposta é validada, **Then** somente o bloco inválido produz erro e o válido é mapeado (AC-07.3, EC-14).
  - **Given** 0, 1 ou 4 dias com arrays alinhados, **When** o diário é mapeado, **Then** retorna exatamente esses dias, em ordem, com indicação de previsão parcial e nenhum dia extra (AC-04.3, EC-13).
  - **Given** uma resposta válida recebida às 15:04 locais, **When** o domínio é criado, **Then** `fetchedAt` registra esse instante do cliente, não um horário vindo da API (RF-09, AC-09.1).

- **Dependências (IDs ou "Nenhuma"):** T-04, T-06, T-07
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/services/forecastService.ts`
- **Tipo:** Data

## Entrega 4 — Hooks

> Orquestração de estado, depois dos services.

### T-09
- **ID:** T-09
- **Título acionável:** Implementar hook de busca de cidades
- **Descrição curta:** Orquestrar submissão, estados, seleção, retry e cancelamento da busca.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** termo inválido, **When** a busca é submetida, **Then** o serviço não é chamado e o estado não entra em `loading` (AC-01.2, EC-01).
  - **Given** termo válido, **When** a requisição está pendente, termina sem itens ou falha, **Then** o estado passa respectivamente por `loading`, `empty` ou `error`; sucesso com itens produz `success` na ordem recebida (AC-01.1, AC-06.1a, AC-06.1b, AC-08.2).
  - **Given** erro visível, **When** retry é acionado, **Then** a nova chamada usa o termo normalizado original (AC-07.2).
  - **Given** uma resposta antiga ainda pendente, **When** uma busca mais recente termina antes, **Then** a resposta antiga não substitui o estado atual (EC-08).

- **Dependências (IDs ou "Nenhuma"):** T-02, T-07, T-08
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/hooks/useCitySearch.ts`
- **Tipo:** Data

### T-10
- **ID:** T-10
- **Título acionável:** Implementar hook de clima
- **Descrição curta:** Orquestrar carregamento, cancelamento, retry e estados independentes dos painéis.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** uma cidade selecionada, **When** a consulta está pendente, **Then** os painéis entram em `loading` e dados da cidade anterior não são apresentados como da nova (AC-06.2, EC-08, EC-16).
  - **Given** sucesso apenas de `current` ou apenas de `daily`, **When** o estado é atualizado, **Then** o bloco válido fica em `success` e o inválido em `error` (AC-07.3, EC-14).
  - **Given** erro de um painel, **When** seu retry é acionado, **Then** a nova chamada usa as coordenadas originais da cidade selecionada (AC-07.2).
  - **Given** uma nova resposta bem-sucedida, **When** ela substitui a anterior, **Then** `fetchedAt` é posterior ao valor anterior (AC-09.2).

- **Dependências (IDs ou "Nenhuma"):** T-08
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/hooks/useWeather.ts`
- **Tipo:** Data

### T-11
- **ID:** T-11
- **Título acionável:** Implementar estado compartilhado de unidade
- **Descrição curta:** Criar o hook e contexto para alternar a unidade de apresentação.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** um contexto recém-criado, **When** a unidade é lida, **Then** o valor é `celsius` (RF-05, AC-05.1, A-07).
  - **Given** a unidade atual, **When** o usuário alterna, **Then** o valor passa a ser o outro membro de `celsius | fahrenheit` e nenhuma função de forecast é chamada (AC-05.4, AC-05.5, EC-09).
  - **Given** estados `loading`, `error` ou `empty` no clima, **When** a unidade muda, **Then** essa mudança não altera nem limpa esses estados (AC-05.5, EC-09).

- **Dependências (IDs ou "Nenhuma"):** T-01, T-08, T-09, T-10
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/hooks/useTemperatureUnit.ts`, `src/context/UnitContext.tsx`
- **Tipo:** Data

## Entrega 5 — Componentes

> Apresentação, depois dos hooks.

### T-12
- **ID:** T-12
- **Título acionável:** Implementar campo de busca acessível
- **Descrição curta:** Criar o campo e as ações para submeter a pesquisa de cidade.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** o campo renderizado, **When** a árvore de acessibilidade é consultada, **Then** o campo tem nome acessível e o botão de busca é operável por clique e por Enter no campo (RF-01, AC-01.1, AC-NFR-03a, AC-NFR-03b).
  - **Given** o usuário submete `"Salvador"`, **When** Enter ou o botão é acionado, **Then** o callback recebe esse valor e o componente não importa nem chama serviços (AC-01.1).
  - **Given** submissão com termo inválido delegada ao callback, **When** o componente apenas encaminha o evento, **Then** não dispara requisição própria (AC-01.2, EC-01).

- **Dependências (IDs ou "Nenhuma"):** T-01, T-11
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/components/SearchBar.tsx`
- **Tipo:** UI

### T-13
- **ID:** T-13
- **Título acionável:** Implementar lista de resultados de cidades
- **Descrição curta:** Apresentar resultados e permitir seleção explícita da localidade.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** duas cidades homônimas, **When** a lista é renderizada, **Then** cada item mostra nome, região quando existir e país, na ordem recebida (AC-02.1, AC-01.1, EC-03).
  - **Given** um item sem região, **When** ele é renderizado, **Then** mostra cidade e país e não exibe placeholder como `"undefined"` ou `"null"` (AC-02.3, EC-15).
  - **Given** um item focado, **When** o usuário o aciona por clique ou teclado, **Then** o callback recebe exatamente essa cidade e o componente não chama API (AC-02.2, AC-NFR-03a).

- **Dependências (IDs ou "Nenhuma"):** T-01, T-11
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/components/SearchResults.tsx`
- **Tipo:** UI

### T-14
- **ID:** T-14
- **Título acionável:** Implementar indicador de carregamento
- **Descrição curta:** Criar feedback visual e acessível para operações em andamento.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** o indicador renderizado, **When** consultado pela Testing Library, **Then** possui role `status` e nome acessível não vazio (RF-06, AC-06.1a, AC-NFR-03b).
  - **Given** o componente desmontado, **When** a busca ou consulta termina, **Then** ele não permanece no documento (AC-06.1b, AC-06.2).

- **Dependências (IDs ou "Nenhuma"):** T-11
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/components/LoadingIndicator.tsx`
- **Tipo:** UI

### T-15
- **ID:** T-15
- **Título acionável:** Implementar mensagem de erro reutilizável
- **Descrição curta:** Apresentar erro não técnico e ação manual de nova tentativa.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** a mensagem `"Não foi possível obter os dados. Tente novamente."`, **When** o componente é renderizado, **Then** esse texto aparece e os textos `500`, `AbortError`, `fetch` e a URL da API não aparecem (RF-07, AC-07.1, EC-04, EC-06).
  - **Given** um callback de retry, **When** o botão é acionado por clique ou teclado, **Then** o callback é chamado uma vez e o botão tem nome acessível (AC-07.2, AC-NFR-03a, AC-NFR-03b).

- **Dependências (IDs ou "Nenhuma"):** T-01, T-11
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/components/ErrorMessage.tsx`
- **Tipo:** UI

### T-16
- **ID:** T-16
- **Título acionável:** Implementar estado vazio reutilizável
- **Descrição curta:** Apresentar orientação inicial ou ausência de resultados.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** a variante inicial, **When** renderizada, **Then** o texto orienta a pesquisar uma cidade (RF-08, AC-08.1).
  - **Given** a variante sem resultados para `"Atlântida"`, **When** renderizada, **Then** informa que nenhuma cidade foi encontrada e sugere revisar o texto, sem reutilizar a mensagem inicial (AC-08.2, EC-02).

- **Dependências (IDs ou "Nenhuma"):** T-11
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/components/EmptyState.tsx`
- **Tipo:** UI

### T-17
- **ID:** T-17
- **Título acionável:** Implementar painel de clima atual
- **Descrição curta:** Apresentar temperatura, condição e localidade selecionada.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** 27,4 °C, código com descrição `"Céu limpo"`, unidade Celsius e cidade com região, **When** o painel é renderizado, **Then** exibe `27 °C`, `"Céu limpo"`, cidade, região e país (AC-03.1, AC-03.2, AC-05.2, AC-05.4).
  - **Given** a mesma temperatura e unidade Fahrenheit, **When** o painel é renderizado, **Then** exibe `81 °F` e não exibe `27` como valor principal (AC-05.2, AC-05.4).
  - **Given** cidade sem região, **When** o painel é renderizado, **Then** exibe cidade e país, sem `"undefined"` (AC-03.2, EC-15).

- **Dependências (IDs ou "Nenhuma"):** T-03, T-11
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/components/CurrentWeatherPanel.tsx`
- **Tipo:** UI

### T-18
- **ID:** T-18
- **Título acionável:** Implementar cartão de dia da previsão
- **Descrição curta:** Apresentar data, condição e temperaturas máxima/mínima de um dia.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** o dia `2026-10-28`, máxima 29,1 °C, mínima 23,2 °C e uma descrição, **When** o cartão é renderizado em Celsius, **Then** exibe `"qua, 28/10"`, `29 °C`, `23 °C` e a descrição (AC-04.2, AC-05.4).
  - **Given** os mesmos valores em Fahrenheit, **When** o cartão é renderizado, **Then** exibe `84 °F` e `74 °F` (AC-05.2).

- **Dependências (IDs ou "Nenhuma"):** T-03, T-04, T-05, T-11
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/components/ForecastDayCard.tsx`
- **Tipo:** UI

### T-19
- **ID:** T-19
- **Título acionável:** Implementar painel de previsão diária
- **Descrição curta:** Exibir cartões em ordem e comunicar previsão parcial ou erro local.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** 5 dias em ordem cronológica, **When** o painel é renderizado, **Then** exibe 5 cartões nessa ordem e nenhum aviso de previsão incompleta (AC-04.1, AC-04.2).
  - **Given** 3 dias ou 0 dias, **When** o painel é renderizado, **Then** exibe exatamente essa quantidade, em ordem, com aviso de previsão incompleta e sem cartão extra (AC-04.3, EC-13).
  - **Given** erro do bloco diário, **When** o painel é renderizado, **Then** mostra mensagem de erro e botão de retry, sem renderizar dias parciais inventados (AC-07.3, EC-14).

- **Dependências (IDs ou "Nenhuma"):** T-15, T-16, T-18
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/components/ForecastPanel.tsx`
- **Tipo:** UI

### T-20
- **ID:** T-20
- **Título acionável:** Implementar controle de unidade
- **Descrição curta:** Criar toggle acessível entre Celsius e Fahrenheit.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** unidade `celsius`, **When** o controle é renderizado, **Then** o estado selecionado é Celsius e o nome acessível contém `"°C"` (AC-05.1, AC-05.4, AC-NFR-03b).
  - **Given** foco no controle, **When** o usuário o aciona por clique ou teclado, **Then** o callback de alternância é chamado uma vez e o componente não chama forecast (AC-05.5, AC-NFR-03a, EC-09).

- **Dependências (IDs ou "Nenhuma"):** T-11
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/components/UnitToggle.tsx`
- **Tipo:** UI

### T-21
- **ID:** T-21
- **Título acionável:** Implementar indicador de atualização
- **Descrição curta:** Exibir data e hora de recebimento dos dados meteorológicos.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** `fetchedAt` correspondente a 29/10/2026 15:04 no fuso local, **When** o indicador é renderizado, **Then** o texto visível é `"29/10/2026 15:04"` (RF-09, AC-09.1).
  - **Given** um novo `fetchedAt` de 29/10/2026 15:10, **When** o componente recebe a nova prop, **Then** substitui o horário anterior (AC-09.2).

- **Dependências (IDs ou "Nenhuma"):** T-05, T-11, T-12, T-13, T-14, T-15, T-16, T-17, T-18, T-19, T-20
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/components/FreshnessIndicator.tsx`
- **Tipo:** UI

## Entrega 6 — Integração

> Composição da tela, bootstrap e tema.

### T-22
- **ID:** T-22
- **Título acionável:** Implementar Error Boundary
- **Descrição curta:** Criar fallback acessível para erros inesperados de renderização.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** um filho que lança erro ao renderizar, **When** o boundary o captura, **Then** exibe uma mensagem visível em pt-BR e não propaga a tela em branco (NFR-05, AC-NFR-05).
  - **Given** o fallback visível, **When** a árvore é consultada, **Then** ela contém texto de recuperação e não contém stack trace (NFR-05).

- **Dependências (IDs ou "Nenhuma"):** T-21
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/components/ErrorBoundary.tsx`
- **Tipo:** UI

### T-23
- **ID:** T-23
- **Título acionável:** Compor a tela principal
- **Descrição curta:** Integrar hooks, componentes de busca e painéis em `App`.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** a aplicação recém-aberta, **When** `App` renderiza, **Then** o estado inicial orienta a pesquisar uma cidade e nenhum serviço é chamado (AC-08.1, A-03).
  - **Given** dados de uma cidade já visíveis, **When** uma nova busca começa sem nova seleção, **Then** os dados anteriores permanecem visíveis (EC-16, AC-06.2).
  - **Given** seleção de cidade, **When** o forecast resolve, **Then** `App` passa as coordenadas selecionadas ao hook e exibe clima, previsão e horário de atualização sem os componentes chamarem API (AC-02.2, AC-03.1, AC-04.1, AC-09.1).
  - **Given** erro apenas do bloco diário, **When** a tela renderiza, **Then** o clima atual continua visível e o retry diário permanece disponível (AC-07.3, EC-14).

- **Dependências (IDs ou "Nenhuma"):** T-09, T-10, T-11, T-12, T-13, T-14, T-15, T-16, T-17, T-19, T-20, T-21, T-22
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/App.tsx`
- **Tipo:** UI

### T-24
- **ID:** T-24
- **Título acionável:** Configurar bootstrap da aplicação
- **Descrição curta:** Montar a raiz React e envolver a tela no Error Boundary.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** o elemento raiz do HTML, **When** o bootstrap executa, **Then** `App` é montado dentro do Error Boundary (NFR-05).
  - **Given** uma exceção de renderização em `App`, **When** ela ocorre, **Then** o fallback do boundary fica visível no lugar da árvore quebrada (AC-NFR-05).

- **Dependências (IDs ou "Nenhuma"):** T-22, T-23
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/main.tsx`
- **Tipo:** UI

### T-25
- **ID:** T-25
- **Título acionável:** Implementar tema visual responsivo
- **Descrição curta:** Aplicar tema dark glassmorphism e ajustes de layout nos breakpoints definidos.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** a tela composta, **When** renderizada em 360 px, 768 px e 1280 px, **Then** `document.documentElement.scrollWidth` não excede a largura da viewport (NFR-01, AC-NFR-01).
  - **Given** o tema aplicado, **When** os tokens são inspecionados, **Then** o fundo é escuro, superfícies principais usam transparência/blur de glassmorphism e não existe tema claro alternável (NFR-06).

- **Dependências (IDs ou "Nenhuma"):** T-23, T-24
- **Arquivos prováveis (caminhos concretos a criar/editar):** `src/index.css`, `tailwind.config.js`
- **Tipo:** UI

## Entrega 7 — Testes

> Unitários e E2E somente depois da integração.

### T-26
- **ID:** T-26
- **Título acionável:** Testar validação do termo de busca
- **Descrição curta:** Cobrir limites, normalização e caracteres acentuados com Vitest.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** os casos `""`, `" "`, `"a"`, `"  São Paulo  "`, `"São Luís"` e `"Val-d'Or"`, **When** os testes unitários executam, **Then** reproduzem exatamente os resultados de T-02 (RF-01, AC-01.2, AC-01.3, EC-01, EC-10, EC-12).
  - **Given** a suíte, **When** ela termina, **Then** não há chamada de rede nem dependência de DOM.

- **Dependências (IDs ou "Nenhuma"):** T-02, T-25
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/unit/lib/searchTerm.test.ts`
- **Tipo:** Test

### T-27
- **ID:** T-27
- **Título acionável:** Testar conversão de unidade com testes unitários
- **Descrição curta:** Cobrir só a função pura de Celsius/Fahrenheit, sem DOM e sem `fetch`.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** as entradas 25 °C e 20,6 °C, **When** os testes executam, **Then** afirmam 77 °F e 69 °F (RF-05, AC-05.2).
  - **Given** uma ida para Fahrenheit e volta para Celsius, **When** o teste compara o valor, **Then** o Celsius original arredondado é restaurado (RF-05, AC-05.3).
  - **Given** a suíte desta tarefa, **When** ela executa, **Then** não renderiza componentes e não chama `fetch` (RF-05, AC-05.2, AC-05.3).

- **Dependências (IDs ou "Nenhuma"):** T-03, T-25
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/unit/lib/temperature.test.ts`
- **Tipo:** Test

### T-28
- **ID:** T-28
- **Título acionável:** Testar mapeamento de códigos WMO
- **Descrição curta:** Verificar códigos conhecidos e o fallback para códigos desconhecidos.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** o código 0 e o código 999, **When** os testes executam, **Then** afirmam uma descrição pt-BR conhecida e exatamente `"Condição desconhecida"` (RF-03, AC-03.1).

- **Dependências (IDs ou "Nenhuma"):** T-04, T-25
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/unit/lib/wmoCodes.test.ts`
- **Tipo:** Test

### T-29
- **ID:** T-29
- **Título acionável:** Testar formatação de datas
- **Descrição curta:** Verificar padrões de data e respeitar o fuso aplicável.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** `2026-10-28` e `2026-10-29T15:04`, **When** os testes executam, **Then** afirmam `"qua, 28/10"` e `"29/10/2026 15:04"` (RF-04, RF-09, AC-04.2, AC-09.1).
  - **Given** um instante com dia diferente entre o fuso da cidade e o do dispositivo, **When** o teste formata a previsão, **Then** o rótulo usa o dia da cidade (EC-11).

- **Dependências (IDs ou "Nenhuma"):** T-05, T-25
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/unit/lib/dateFormat.test.ts`
- **Tipo:** Test

### T-30
- **ID:** T-30
- **Título acionável:** Testar serviço de geocoding com fetch mockado
- **Descrição curta:** Validar URL, parsing e erros substituindo `fetch`, sem rede real.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** `fetch` mockado, **When** os testes chamam o serviço com `"São Paulo"`, **Then** a URL observada contém termo codificado, `count=10` e `language=pt`, sem rede real (AC-01.1, AC-01.3).
  - **Given** fixtures com região, sem `admin1`, `results` vazio e payload sem campo obrigatório, **When** os testes executam, **Then** afirmam ordem preservada, região ausente, lista vazia e `invalid-payload` (AC-02.3, AC-08.2, EC-06, EC-15).
  - **Given** HTTP 500, **When** o serviço é chamado, **Then** o teste afirma erro `service` e nenhum `City` derivado do corpo (EC-06, AC-07.1).
  - **Given** a suíte, **When** ela termina, **Then** `fetch` usado pelo serviço é o mock e nenhuma chamada sai para a Open-Meteo (NFR-07).

- **Dependências (IDs ou "Nenhuma"):** T-07, T-25
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/unit/services/geocodingService.test.ts`, `tests/unit/fixtures/geocoding.ts`
- **Tipo:** Test

### T-31
- **ID:** T-31
- **Título acionável:** Testar serviço de forecast com fetch mockado
- **Descrição curta:** Validar URL, blocos parciais e erros substituindo `fetch`, sem rede real.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** `fetch` mockado, **When** os testes chamam o serviço, **Then** a URL contém coordenadas, `forecast_days=5`, `timezone=auto` e Celsius, sem rede real (AC-04.1, seção 2.1).
  - **Given** fixtures de 5, 3, 1 e 0 dias e de bloco ausente, **When** os testes executam, **Then** afirmam contagem exata, ordem, aviso parcial e erro isolado do bloco inválido (AC-04.1, AC-04.3, AC-07.3, EC-13, EC-14).
  - **Given** HTTP 500 ou arrays diários de tamanhos diferentes, **When** o bloco é validado, **Then** o teste afirma erro e nenhum dia inventado (EC-06, AC-04.3).
  - **Given** a suíte, **When** ela termina, **Then** `fetch` usado pelo serviço é o mock e nenhuma chamada sai para a Open-Meteo (NFR-07).

- **Dependências (IDs ou "Nenhuma"):** T-08, T-25
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/unit/services/forecastService.test.ts`, `tests/unit/fixtures/forecast.ts`
- **Tipo:** Test

### T-32
- **ID:** T-32
- **Título acionável:** Testar hook de busca de cidades
- **Descrição curta:** Cobrir transições assíncronas, retry, seleção e descarte de respostas antigas.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** serviço mockado, **When** o hook recebe termo inválido, sucesso, lista vazia e erro, **Then** os testes afirmam ausência de chamada, `success`, `empty` e `error`, com `loading` apenas enquanto a Promise está pendente (AC-01.2, AC-06.1a, AC-06.1b, AC-08.2).
  - **Given** falha seguida de retry, **When** o teste aciona retry, **Then** a segunda chamada usa o mesmo termo normalizado (AC-07.2).
  - **Given** duas buscas sobrepostas, **When** a primeira resolve depois da segunda, **Then** o estado final contém somente o resultado da segunda (EC-08).

- **Dependências (IDs ou "Nenhuma"):** T-09, T-25
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/unit/hooks/useCitySearch.test.ts`
- **Tipo:** Test

### T-33
- **ID:** T-33
- **Título acionável:** Testar hook de clima
- **Descrição curta:** Cobrir estados, retry, cancelamento e falha isolada por painel.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** serviço mockado com atraso, sucesso parcial e erro, **When** os testes exercitam o hook, **Then** afirmam `loading`, descarte da resposta antiga, erro isolado por painel e retry com as mesmas coordenadas (AC-06.2, AC-07.2, AC-07.3, EC-08, EC-14).
  - **Given** duas respostas bem-sucedidas em sequência, **When** a segunda resolve, **Then** o `fetchedAt` final é o da segunda resposta (AC-09.2).

- **Dependências (IDs ou "Nenhuma"):** T-10, T-25
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/unit/hooks/useWeather.test.ts`
- **Tipo:** Test

### T-34
- **ID:** T-34
- **Título acionável:** Testar estado compartilhado de unidade
- **Descrição curta:** Verificar unidade inicial e alternância sem chamadas de serviço.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** o hook/contexto montado, **When** o teste lê a unidade, **Then** o valor inicial é `celsius` (AC-05.1).
  - **Given** estados de loading, erro e vazio, **When** o teste alterna a unidade, **Then** ela muda sem chamar o serviço de forecast e sem alterar o estado dos dados (AC-05.5, EC-09).

- **Dependências (IDs ou "Nenhuma"):** T-11, T-25
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/unit/hooks/useTemperatureUnit.test.ts`
- **Tipo:** Test

### T-35
- **ID:** T-35
- **Título acionável:** Testar campo de busca
- **Descrição curta:** Verificar submissão por teclado, botão e acessibilidade do campo.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** `SearchBar` renderizado, **When** o teste consulta por role, **Then** encontra textbox e botão com nomes acessíveis (AC-NFR-03a, AC-NFR-03b).
  - **Given** o valor `"Salvador"`, **When** o teste pressiona Enter e, em outro caso, aciona o botão, **Then** o callback é chamado com `"Salvador"` em ambos (AC-01.1).

- **Dependências (IDs ou "Nenhuma"):** T-12, T-25
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/unit/components/SearchBar.test.tsx`
- **Tipo:** Test

### T-36
- **ID:** T-36
- **Título acionável:** Testar lista de resultados de cidades
- **Descrição curta:** Verificar desambiguação, região opcional, seleção e teclado.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** itens com e sem região, **When** os testes renderizam a lista, **Then** afirmam cidade, região, país e ausência de `"undefined"` (AC-02.1, AC-02.3, EC-03, EC-15).
  - **Given** um item, **When** acionado por clique e por teclado, **Then** o callback recebe essa cidade (AC-02.2, AC-NFR-03a).

- **Dependências (IDs ou "Nenhuma"):** T-13, T-25
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/unit/components/SearchResults.test.tsx`
- **Tipo:** Test

### T-37
- **ID:** T-37
- **Título acionável:** Testar componente no estado loading
- **Descrição curta:** Verificar somente o indicador de carregamento, sem misturar erro ou vazio.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** `LoadingIndicator`, **When** o teste consulta o documento, **Then** encontra um único elemento com role `status` e nome acessível (RF-06, AC-06.1a, AC-NFR-03b).

- **Dependências (IDs ou "Nenhuma"):** T-14, T-25
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/unit/components/LoadingIndicator.test.tsx`
- **Tipo:** Test

### T-38
- **ID:** T-38
- **Título acionável:** Testar componente no estado erro
- **Descrição curta:** Verificar somente a mensagem de erro e o retry, sem misturar loading ou vazio.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** uma mensagem de erro em pt-BR, **When** o teste renderiza o componente, **Then** a mensagem está visível e `500`, `fetch` e `AbortError` estão ausentes (AC-07.1).
  - **Given** o botão de retry, **When** o teste o aciona, **Then** o callback é chamado e o botão tem nome acessível (AC-07.2, AC-NFR-03a, AC-NFR-03b).

- **Dependências (IDs ou "Nenhuma"):** T-15, T-25
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/unit/components/ErrorMessage.test.tsx`
- **Tipo:** Test

### T-39
- **ID:** T-39
- **Título acionável:** Testar componente no estado vazio
- **Descrição curta:** Verificar somente as mensagens de vazio inicial e de busca sem resultados.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** as duas variantes, **When** os testes renderizam cada uma, **Then** a inicial pede para pesquisar uma cidade e a de busca informa que nenhuma cidade foi encontrada, com textos diferentes (AC-08.1, AC-08.2, EC-02).

- **Dependências (IDs ou "Nenhuma"):** T-16, T-25
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/unit/components/EmptyState.test.tsx`
- **Tipo:** Test

### T-40
- **ID:** T-40
- **Título acionável:** Testar painel de clima atual
- **Descrição curta:** Verificar dados, descrição, unidade e conversão renderizados.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** props de 27,4 °C, descrição, cidade, região e país, **When** os testes renderizam Celsius e Fahrenheit, **Then** afirmam `27 °C`, `81 °F`, a descrição e a localidade (AC-03.1, AC-03.2, AC-05.2, AC-05.4).
  - **Given** região ausente, **When** o teste consulta o texto, **Then** `"undefined"` e `"null"` estão ausentes (EC-15).

- **Dependências (IDs ou "Nenhuma"):** T-17, T-25
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/unit/components/CurrentWeatherPanel.test.tsx`
- **Tipo:** Test

### T-41
- **ID:** T-41
- **Título acionável:** Testar painel de previsão diária
- **Descrição curta:** Verificar ordem, valores, estado parcial e erro localizado.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** fixtures de 5, 3 e 0 dias, **When** os testes renderizam o painel, **Then** afirmam as contagens 5, 3 e 0, a ordem recebida e aviso somente nos casos parciais (AC-04.1, AC-04.3, EC-13).
  - **Given** estado de erro diário, **When** o teste aciona retry, **Then** o callback é chamado e nenhum dia é renderizado (AC-07.3, EC-14).

- **Dependências (IDs ou "Nenhuma"):** T-19, T-25
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/unit/components/ForecastPanel.test.tsx`
- **Tipo:** Test

### T-42
- **ID:** T-42
- **Título acionável:** Testar controle de unidade
- **Descrição curta:** Verificar seleção, nomes acessíveis e operação por teclado.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** `UnitToggle` em Celsius, **When** o teste consulta o controle, **Then** ele tem nome acessível e indica °C (AC-05.1, AC-05.4, AC-NFR-03b).
  - **Given** foco no controle, **When** o teste o aciona por teclado, **Then** o callback é chamado uma vez (AC-NFR-03a, AC-05.5).

- **Dependências (IDs ou "Nenhuma"):** T-20, T-25
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/unit/components/UnitToggle.test.tsx`
- **Tipo:** Test

### T-43
- **ID:** T-43
- **Título acionável:** Testar indicador de atualização
- **Descrição curta:** Verificar presença e formatação do horário de atualização.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** `fetchedAt` de 29/10/2026 15:04, **When** o teste renderiza o indicador, **Then** o texto é exatamente `"29/10/2026 15:04"` (AC-09.1).
  - **Given** atualização para 15:10, **When** o componente é rerenderizado, **Then** o texto anterior desaparece e `"29/10/2026 15:10"` aparece (AC-09.2).

- **Dependências (IDs ou "Nenhuma"):** T-21, T-25
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/unit/components/FreshnessIndicator.test.tsx`
- **Tipo:** Test

### T-44
- **ID:** T-44
- **Título acionável:** Testar composição da tela
- **Descrição curta:** Verificar estados integrados, callbacks e isolamento entre painéis.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** serviços mockados, **When** `App` monta sem interação, **Then** nenhuma chamada de geocoding ou forecast ocorre e a orientação inicial está visível (AC-08.1).
  - **Given** erro isolado de um painel, **When** o teste consulta a tela, **Then** o outro painel permanece visível e o retry do painel com falha está presente (AC-07.3, EC-14).
  - **Given** dados visíveis, **When** o teste alterna a unidade, **Then** os rótulos mudam e o número de chamadas de forecast permanece o mesmo (AC-05.5, EC-09).
  - **Given** loading ou erro, **When** o teste consulta a árvore, **Then** existe região anunciável para o estado dinâmico (AC-NFR-03b, AC-06.1a, AC-07.1).

- **Dependências (IDs ou "Nenhuma"):** T-23, T-24, T-25
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/unit/App.test.tsx`
- **Tipo:** Test

### T-45
- **ID:** T-45
- **Título acionável:** Preparar mocks E2E da Open-Meteo
- **Descrição curta:** Criar fixtures e interceptação reutilizável dos endpoints de geocoding e forecast.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** os testes E2E, **When** a aplicação chama geocoding ou forecast, **Then** `page.route()` responde e nenhuma requisição alcança a Open-Meteo real (NFR-07, seção 2.1).
  - **Given** uma configuração de mock, **When** o teste pede latência, HTTP 500, falha de rede, payload vazio ou payload parcial, **Then** a rota devolve exatamente essa variante (EC-04, EC-05, EC-06, EC-13, EC-14, EC-15).

- **Dependências (IDs ou "Nenhuma"):** T-07, T-08, T-25
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/e2e/mocks/openMeteo.ts`
- **Tipo:** Test

### T-46
- **ID:** T-46
- **Título acionável:** Testar fluxo E2E de busca e seleção
- **Descrição curta:** Cobrir busca, desambiguação e escolha explícita da cidade.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** a aplicação aberta, **When** o teste observa a tela antes de buscar, **Then** a orientação inicial está visível (AC-08.1).
  - **Given** o termo `"a"`, **When** a busca é acionada, **Then** nenhuma requisição de geocoding é emitida e a orientação de mínimo de 2 caracteres aparece (AC-01.2, EC-01).
  - **Given** o termo `"São Paulo"` com dois resultados, **When** a busca termina, **Then** os itens aparecem na ordem mockada, com região e país, e a seleção dispara forecast somente com as coordenadas do item escolhido (AC-01.1, AC-01.3, AC-02.1, AC-02.2, EC-10).

- **Dependências (IDs ou "Nenhuma"):** T-23, T-24, T-25, T-45
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/e2e/search-and-select.spec.ts`
- **Tipo:** Test

### T-47
- **ID:** T-47
- **Título acionável:** Testar fluxo E2E de clima e previsão
- **Descrição curta:** Cobrir consulta nominal e apresentação dos dados meteorológicos.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** uma cidade selecionada e forecast completo, **When** a tela atualiza, **Then** exibe temperatura atual, descrição em pt-BR, cidade, região e país (AC-03.1, AC-03.2).
  - **Given** cinco dias mockados, **When** a previsão é exibida, **Then** aparecem 5 itens em ordem, cada um com data `dia, dd/mm`, máxima, mínima e condição (AC-04.1, AC-04.2).

- **Dependências (IDs ou "Nenhuma"):** T-23, T-24, T-25, T-45
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/e2e/current-and-forecast.spec.ts`
- **Tipo:** Test

### T-48
- **ID:** T-48
- **Título acionável:** Testar alternância de unidade em E2E
- **Descrição curta:** Verificar valores, rótulos e ausência de nova consulta ao alternar unidade.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** dados recém-carregados, **When** o teste observa as temperaturas, **Then** todas têm rótulo `"°C"` (AC-05.1, AC-05.4).
  - **Given** atual 25 °C e máxima 20,6 °C, **When** o usuário alterna para Fahrenheit e volta para Celsius, **Then** vê `77 °F` e `69 °F` e depois os Celsius originais, sem nova requisição de forecast (AC-05.2, AC-05.3).

- **Dependências (IDs ou "Nenhuma"):** T-23, T-24, T-25, T-45
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/e2e/unit-toggle.spec.ts`
- **Tipo:** Test

### T-49
- **ID:** T-49
- **Título acionável:** Testar carregamento em E2E
- **Descrição curta:** Verificar feedback visual durante buscas e consultas meteorológicas atrasadas.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** geocoding e forecast configurados para responder após 1 segundo, **When** o usuário busca ou seleciona cidade, **Then** um indicador com role `status` fica visível em até 100 ms (RF-06, AC-06.1a, AC-06.2, NFR-04).
  - **Given** a resposta mockada entregue, **When** a interface atualiza, **Then** o indicador correspondente é removido (AC-06.1b, AC-06.2).

- **Dependências (IDs ou "Nenhuma"):** T-23, T-24, T-25, T-45
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/e2e/loading-states.spec.ts`
- **Tipo:** Test

### T-50
- **ID:** T-50
- **Título acionável:** Testar erros e retry em E2E
- **Descrição curta:** Verificar feedback, recuperação manual e preservação do termo/localidade originais.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** falha de rede, HTTP 500 e ausência de resposta por mais de 10 segundos, **When** cada cenário termina, **Then** uma mensagem em pt-BR fica visível, sem tela branca nem indicador permanente (AC-07.1, EC-04, EC-05, EC-06, AC-NFR-05, NFR-04).
  - **Given** a mensagem de erro, **When** o usuário aciona retry, **Then** a requisição repetida usa o mesmo termo ou as mesmas coordenadas e o sucesso substitui o erro (AC-07.2).

- **Dependências (IDs ou "Nenhuma"):** T-23, T-24, T-25, T-45
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/e2e/error-retry.spec.ts`
- **Tipo:** Test

### T-51
- **ID:** T-51
- **Título acionável:** Testar respostas parciais em E2E
- **Descrição curta:** Verificar dias incompletos e falha isolada entre painéis meteorológicos.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** payloads diários com 3 dias e com 0 dias, **When** a previsão é exibida, **Then** aparecem exatamente 3 ou 0 dias, em ordem, com aviso de previsão incompleta (AC-04.3, EC-13).
  - **Given** `current` válido e `daily` inválido, ou o inverso, **When** a tela renderiza, **Then** o painel válido permanece e o inválido mostra erro com retry (AC-07.3, EC-14).

- **Dependências (IDs ou "Nenhuma"):** T-23, T-24, T-25, T-45
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/e2e/partial-responses.spec.ts`
- **Tipo:** Test

### T-52
- **ID:** T-52
- **Título acionável:** Testar estado vazio em E2E
- **Descrição curta:** Verificar orientação inicial e busca sem resultados no fluxo completo.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** a abertura da aplicação, **When** nenhuma busca ocorreu, **Then** a orientação para pesquisar uma cidade está visível (AC-08.1).
  - **Given** geocoding com `results` vazio para o termo pesquisado, **When** a busca termina, **Then** a mensagem informa que nenhuma cidade foi encontrada e sugere revisar o texto (AC-08.2, EC-02).

- **Dependências (IDs ou "Nenhuma"):** T-23, T-24, T-25, T-45
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/e2e/empty-states.spec.ts`
- **Tipo:** Test

### T-53
- **ID:** T-53
- **Título acionável:** Testar acessibilidade por teclado em E2E
- **Descrição curta:** Percorrer a jornada principal usando teclado e validar foco e anúncios.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** apenas teclado, **When** o teste percorre busca, resultado, retry e toggle, **Then** cada controle recebe foco em ordem lógica, é acionável e mostra indicador de foco visível (NFR-03, AC-NFR-03a).
  - **Given** loading e erro provocados pelo mock, **When** o estado muda, **Then** cada controle tem nome acessível e o estado é exposto em live region (AC-NFR-03b).

- **Dependências (IDs ou "Nenhuma"):** T-23, T-24, T-25, T-45
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/e2e/accessibility.spec.ts`
- **Tipo:** Test

### T-54
- **ID:** T-54
- **Título acionável:** Testar jornada E2E em viewport mobile
- **Descrição curta:** Executar busca e consulta meteorológica em viewport mobile.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** viewport de 360×800, **When** o teste executa busca, seleção, leitura e alternância de unidade, **Then** cada etapa é operável e `scrollWidth` não excede a largura da viewport (NFR-01, AC-NFR-01).
  - **Given** a mesma jornada, **When** os controles são localizados, **Then** campo, botão, resultado e toggle têm nomes acessíveis (NFR-03, AC-NFR-03b).

- **Dependências (IDs ou "Nenhuma"):** T-23, T-24, T-25, T-45
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/e2e/mobile-flow.spec.ts`
- **Tipo:** Test

### T-55
- **ID:** T-55
- **Título acionável:** Testar componentes nos estados loading, erro e vazio
- **Descrição curta:** Cobrir busca e clima renderizados em cada estado, sem misturar o caminho de sucesso.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** a área de busca em loading, **When** os componentes são renderizados, **Then** o indicador com role `status` está visível e nenhum item de cidade é exibido (RF-06, AC-06.1a).
  - **Given** a área de busca em erro, **When** os componentes são renderizados, **Then** a mensagem em pt-BR e o botão de retry estão visíveis, e a lista de resultados está ausente (RF-07, AC-07.1, AC-07.2).
  - **Given** a busca sem resultados e o estado inicial, **When** os componentes são renderizados, **Then** as duas mensagens de vazio aparecem em casos separados e nenhuma temperatura é exibida (RF-08, AC-08.1, AC-08.2).
  - **Given** os painéis de clima em loading e, em outro caso, em erro, **When** são renderizados, **Then** o loading não mostra temperatura e o erro mostra retry sem cartões de previsão (RF-06, RF-07, AC-06.2, AC-07.1).

- **Dependências (IDs ou "Nenhuma"):** T-13, T-14, T-15, T-16, T-17, T-19, T-25
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/unit/components/asyncStates.test.tsx`
- **Tipo:** Test

### T-56
- **ID:** T-56
- **Título acionável:** Testar fluxo principal E2E em desktop e viewport mobile
- **Descrição curta:** Cobrir busca, seleção, clima, previsão e unidade no desktop e em 360×800.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** viewport de 1280×800 e APIs interceptadas, **When** o usuário busca `"Salvador"`, seleciona a cidade e lê a tela, **Then** aparecem temperatura atual, condição em pt-BR, localidade e 5 dias em ordem, com rótulo `"°C"` (RF-01, RF-02, RF-03, RF-04, RF-05, AC-01.1, AC-02.2, AC-03.1, AC-04.1, AC-05.1).
  - **Given** esses dados visíveis, **When** o usuário alterna para Fahrenheit, **Then** os rótulos passam a `"°F"` e nenhuma nova requisição de forecast ocorre (AC-05.2, AC-05.3).
  - **Given** viewport de 360×800, **When** o mesmo fluxo é repetido, **Then** busca, seleção, clima, 5 dias e alternância de unidade permanecem visíveis e operáveis, sem `scrollWidth` maior que a viewport (NFR-01, AC-NFR-01).

- **Dependências (IDs ou "Nenhuma"):** T-23, T-24, T-25, T-45
- **Arquivos prováveis (caminhos concretos a criar/editar):** `tests/e2e/main-flow.spec.ts`
- **Tipo:** Test

## Entrega 8 — Hardening

> Matriz de browsers e validação final, depois dos testes.

### T-57
- **ID:** T-57
- **Título acionável:** Configurar matriz de browsers da CI
- **Descrição curta:** Configurar projetos e execução da matriz requerida de browsers desktop/mobile.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** a configuração do Playwright, **When** os projetos são listados, **Then** existem projetos desktop e mobile para Chrome/Chromium, Firefox, Safari/WebKit e Edge (NFR-08).
  - **Given** o workflow de CI, **When** ele executa a suíte E2E, **Then** cada um desses projetos é incluído e a ausência de um projeto faz a validação falhar (NFR-08).

- **Dependências (IDs ou "Nenhuma"):** T-45, T-46, T-47, T-48, T-49, T-50, T-51, T-52, T-53, T-54, T-56
- **Arquivos prováveis (caminhos concretos a criar/editar):** `playwright.config.ts`, `.github/workflows/ci.yml`
- **Tipo:** Infra

### T-58
- **ID:** T-58
- **Título acionável:** Executar validação final de qualidade
- **Descrição curta:** Rodar os gates de qualidade e registrar o resultado da auditoria visual e de segurança.
- **Critérios de aceite verificáveis (com referência aos RF/AC/EC/NFR relevantes do plano/spec):**
  - **Given** o repositório na revisão final, **When** `pnpm lint`, `pnpm build`, `pnpm test` e `pnpm test:e2e` são executados, **Then** cada comando termina com código 0 (NFR-05).
  - **Given** a suíte de testes, **When** ela roda sem rede externa, **Then** nenhum teste tenta acessar a Open-Meteo real (NFR-07).
  - **Given** os pares essenciais de texto e fundo do tema dark, **When** o contraste é medido, **Then** cada par é de pelo menos 4,5:1 (NFR-03, NFR-06, AC-NFR-03c).
  - **Given** o bundle do cliente, **When** ele é inspecionado, **Then** não contém API key, token ou segredo (NFR-07, AC-NFR-05).

- **Dependências (IDs ou "Nenhuma"):** T-25, T-26, T-27, T-28, T-29, T-30, T-31, T-32, T-33, T-34, T-35, T-36, T-37, T-38, T-39, T-40, T-41, T-42, T-43, T-44, T-45, T-46, T-47, T-48, T-49, T-50, T-51, T-52, T-53, T-54, T-55, T-56, T-57
- **Arquivos prováveis (caminhos concretos a criar/editar):** Nenhum; executar comandos e registrar resultados
- **Tipo:** Infra

## Rastreabilidade — requisitos funcionais → tarefas

> Fonte: `specs/weather-app-spec.md`, seção 2. A coluna **Implementação** lista tarefas de código (Data/UI) que realizam o requisito. A coluna **Verificação** lista testes que o exercitam. `T-23` entra em todos os RFs porque compõe a tela única.

| RF | Requisito | Implementação | Verificação |
| --- | --- | --- | --- |
| RF-01 | Busca de cidade | T-02, T-07, T-09, T-12, T-23 | T-26, T-30, T-32, T-35, T-46, T-56 |
| RF-02 | Desambiguação e seleção | T-07, T-09, T-13, T-23 | T-30, T-36, T-46, T-56 |
| RF-03 | Clima atual | T-04, T-08, T-10, T-17, T-23 | T-28, T-31, T-33, T-40, T-47, T-56 |
| RF-04 | Previsão de 5 dias | T-05, T-08, T-10, T-18, T-19, T-23 | T-29, T-31, T-41, T-47, T-51, T-56 |
| RF-05 | Alternância °C/°F | T-03, T-11, T-17, T-18, T-20, T-23 | T-27, T-34, T-40, T-42, T-48, T-56 |
| RF-06 | Estados de loading | T-09, T-10, T-14, T-23 | T-32, T-33, T-37, T-49, T-55 |
| RF-07 | Estados de erro e retry | T-06, T-09, T-10, T-15, T-19, T-23 | T-30, T-31, T-38, T-50, T-55 |
| RF-08 | Estados vazios | T-09, T-16, T-23 | T-32, T-39, T-52, T-55 |
| RF-09 | Indicador de atualização | T-05, T-08, T-10, T-21, T-23 | T-29, T-33, T-43 |

Nenhum requisito funcional ficou sem tarefa. RF-01 a RF-09 têm implementação e verificação.

Tarefas de suporte, sem RF exclusivo: T-01 (tipos), T-22 (error boundary), T-24 (bootstrap), T-25 (tema), T-45 (mocks E2E), T-53 (teclado), T-54 (viewport mobile), T-57 (matriz de browsers) e T-58 (validação final). Elas cobrem NFR-01, NFR-03, NFR-05, NFR-06, NFR-07 e NFR-08, não um RF isolado.

## Prioridade, tamanho e fatias verticais

> **Prioridade:** P0 bloqueia a primeira demo utilizável (buscar e ver o clima atual). P1 completa os demais requisitos funcionais. P2 é endurecimento e cobertura ampla.
> **Tamanho:** P = um arquivo e poucos casos; M = regra com vários ramos ou dois arquivos; G = composição ampla ou vários cenários integrados.
> **T-23** começa na Fatia 1 só com a busca e cresce nas fatias seguintes. Não espere todos os painéis para a primeira tela.

### Sequência sugerida

| Fatia | Resultado visível | Tarefas |
| --- | --- | --- |
| 1 — Busca | Campo, loading, lista de cidades ou vazio | T-01, T-02, T-06, T-07, T-09, T-12, T-13, T-14, T-16, T-23, T-24, T-26, T-30, T-32, T-35, T-36 |
| 2 — Clima atual | Seleção mostra temperatura, condição e localidade | T-04, T-08, T-10, T-17, T-23, T-28, T-31, T-33, T-40 |
| 3 — Previsão | Cinco dias e horário da atualização | T-05, T-18, T-19, T-21, T-29, T-41, T-43 |
| 4 — Unidade | Alternância °C/°F sem nova consulta | T-03, T-11, T-20, T-27, T-34, T-42, T-48 |
| 5 — Recuperação | Erro com retry, vazio e loading no fluxo | T-15, T-37, T-38, T-39, T-49, T-50, T-52, T-55 |
| 6 — Acabamento | Tema, E2E do fluxo principal e hardening | T-22, T-25, T-44, T-45, T-46, T-47, T-51, T-53, T-54, T-56, T-57, T-58 |

A Fatia 1 é a primeira entrega visível. As Fatias 2 e 3 completam a consulta meteorológica. A Fatia 4 é independente da previsão e pode avançar em paralelo depois da Fatia 2.

### Classificação

| ID | Título | Prioridade | Tamanho | Fatia |
| --- | --- | --- | --- | --- |
| T-01 | Definir contratos brutos e tipos de domínio | P0 | P | 1 |
| T-02 | Implementar validação do termo de busca | P0 | P | 1 |
| T-03 | Implementar conversão de temperatura | P1 | P | 4 |
| T-04 | Implementar mapeamento de códigos WMO | P0 | P | 2 |
| T-05 | Implementar formatação de datas | P1 | P | 3 |
| T-06 | Implementar cliente HTTP resiliente | P0 | M | 1 |
| T-07 | Implementar serviço de geocoding | P0 | M | 1 |
| T-08 | Implementar serviço de forecast por blocos | P0 | G | 2 |
| T-09 | Implementar hook de busca de cidades | P0 | M | 1 |
| T-10 | Implementar hook de clima | P0 | M | 2 |
| T-11 | Implementar estado compartilhado de unidade | P1 | P | 4 |
| T-12 | Implementar campo de busca acessível | P0 | P | 1 |
| T-13 | Implementar lista de resultados de cidades | P0 | P | 1 |
| T-14 | Implementar indicador de carregamento | P0 | P | 1 |
| T-15 | Implementar mensagem de erro reutilizável | P1 | P | 5 |
| T-16 | Implementar estado vazio reutilizável | P0 | P | 1 |
| T-17 | Implementar painel de clima atual | P0 | P | 2 |
| T-18 | Implementar cartão de dia da previsão | P1 | P | 3 |
| T-19 | Implementar painel de previsão diária | P1 | M | 3 |
| T-20 | Implementar controle de unidade | P1 | P | 4 |
| T-21 | Implementar indicador de atualização | P1 | P | 3 |
| T-22 | Implementar Error Boundary | P2 | P | 6 |
| T-23 | Compor a tela principal | P0 | G | 1–5 |
| T-24 | Configurar bootstrap da aplicação | P0 | P | 1 |
| T-25 | Implementar tema visual responsivo | P1 | M | 6 |
| T-26 | Testar validação do termo de busca | P0 | P | 1 |
| T-27 | Testar conversão de unidade com testes unitários | P1 | P | 4 |
| T-28 | Testar mapeamento de códigos WMO | P0 | P | 2 |
| T-29 | Testar formatação de datas | P1 | P | 3 |
| T-30 | Testar serviço de geocoding com fetch mockado | P0 | M | 1 |
| T-31 | Testar serviço de forecast com fetch mockado | P0 | M | 2 |
| T-32 | Testar hook de busca de cidades | P0 | M | 1 |
| T-33 | Testar hook de clima | P0 | M | 2 |
| T-34 | Testar estado compartilhado de unidade | P1 | P | 4 |
| T-35 | Testar campo de busca | P0 | P | 1 |
| T-36 | Testar lista de resultados de cidades | P0 | P | 1 |
| T-37 | Testar componente no estado loading | P1 | P | 5 |
| T-38 | Testar componente no estado erro | P1 | P | 5 |
| T-39 | Testar componente no estado vazio | P1 | P | 5 |
| T-40 | Testar painel de clima atual | P0 | P | 2 |
| T-41 | Testar painel de previsão diária | P1 | P | 3 |
| T-42 | Testar controle de unidade | P1 | P | 4 |
| T-43 | Testar indicador de atualização | P1 | P | 3 |
| T-44 | Testar composição da tela | P1 | M | 6 |
| T-45 | Preparar mocks E2E da Open-Meteo | P1 | M | 6 |
| T-46 | Testar fluxo E2E de busca e seleção | P2 | M | 6 |
| T-47 | Testar fluxo E2E de clima e previsão | P2 | M | 6 |
| T-48 | Testar alternância de unidade em E2E | P1 | P | 4 |
| T-49 | Testar carregamento em E2E | P1 | P | 5 |
| T-50 | Testar erros e retry em E2E | P1 | M | 5 |
| T-51 | Testar respostas parciais em E2E | P2 | M | 6 |
| T-52 | Testar estado vazio em E2E | P1 | P | 5 |
| T-53 | Testar acessibilidade por teclado em E2E | P2 | M | 6 |
| T-54 | Testar jornada E2E em viewport mobile | P2 | M | 6 |
| T-55 | Testar componentes nos estados loading, erro e vazio | P1 | M | 5 |
| T-56 | Testar fluxo principal E2E em desktop e viewport mobile | P1 | M | 6 |
| T-57 | Configurar matriz de browsers da CI | P2 | G | 6 |
| T-58 | Executar validação final de qualidade | P1 | M | 6 |
