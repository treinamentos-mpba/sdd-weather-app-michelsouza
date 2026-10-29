# Weather App — Product Specification

> **Fonte:** `specs/discovery.md` (Discovery — Weather App)
> **Fase SDD:** Specification — este documento é a fonte única da verdade para planejamento e implementação.
> **Idioma:** narrativa em pt-BR; termos técnicos e identificadores em en-US.

---

## 1. Overview

### 1.1 Visão geral

Aplicação web responsiva de previsão do tempo que permite ao usuário pesquisar cidades pelo nome, consultar as condições meteorológicas atuais e a previsão para cinco dias (hoje + 4 dias seguintes), alternando a exibição de temperaturas entre Celsius e Fahrenheit.

### 1.2 Objetivos do produto

- Entregar consulta meteorológica rápida e confiável, sem fricção de cadastro ou configuração.
- Garantir uso confortável em dispositivos móveis (abordagem mobile-first).
- Evitar ambiguidade de localidade: o usuário sempre confirma a cidade correta antes da consulta (desambiguação por região/país).
- Comunicar claramente os estados da aplicação: loading, erro, vazio e dados atualizados (com indicação de quando foram obtidos).

### 1.3 Contexto técnico (decisões herdadas do discovery)

- **Stack:** React + Vite + TypeScript (SPA client-side).
- **Fonte de dados:** Open-Meteo — Geocoding API (busca de cidades) e Forecast API (clima atual e previsão), sem API key (**D1**).
- **Período da previsão:** hoje + 4 dias seguintes, totalizando 5 dias (**D2**).
- **Unidade inicial:** Celsius (**D3**).
- **Sem autenticação e sem persistência de servidor** (**D4**).
- **Idioma da interface:** pt-BR (**D5**).
- **Identidade visual:** tema dark com estilo glassmorphism.

### 1.4 Personas (hipóteses a validar)

| Persona | Necessidade principal |
| --- | --- |
| **P1 — Pessoa em deslocamento diário** | Consultar rapidamente o clima atual para se preparar para o dia. |
| **P2 — Pessoa planejando uma viagem** | Comparar a previsão dos próximos dias para organizar atividades. |
| **P3 — Pessoa que trabalha ou pratica atividades ao ar livre** | Consultar no celular as condições locais e verificar quando os dados foram atualizados. |

---

## 2. Functional Requirements

> Rastreabilidade: cada RF possui ao menos um critério de aceite correspondente na seção 4 (Acceptance Criteria), identificado como `AC-XX.Y`, onde `XX` referencia o RF.

- **RF-01 — Search city:** o sistema deve permitir que o usuário pesquise cidades pelo nome, consultando a Open-Meteo Geocoding API, e exiba uma lista de resultados correspondentes. A busca é submetida explicitamente pelo usuário (botão de busca ou tecla Enter); não há autocomplete nesta versão. O termo é normalizado com trim e deve ter no mínimo **2 caracteres** após o trim; termos inválidos não disparam requisição. A consulta solicita até 10 resultados (`count=10`, default da API) com `language=pt`.
- **RF-02 — City disambiguation:** cada resultado da busca deve exibir informações de desambiguação (no mínimo: nome da cidade, região/estado quando disponível e país), e o usuário deve selecionar explicitamente a localidade desejada antes da consulta meteorológica. Após a seleção, a lista de resultados é fechada e o termo digitado permanece no campo de busca.
- **RF-03 — Current weather:** ao selecionar uma cidade, o sistema deve exibir as condições atuais obtidas da Open-Meteo Forecast API, incluindo no mínimo: temperatura atual, descrição da condição do tempo e a unidade de temperatura ativa. A descrição é obtida mapeando o WMO weather code retornado pela API para texto em pt-BR; códigos não mapeados exibem uma descrição genérica (ex.: "Condição desconhecida").
- **RF-04 — 5-day forecast:** o sistema deve exibir a previsão para a cidade selecionada cobrindo hoje + 4 dias seguintes (5 dias), com granularidade diária, incluindo no mínimo: data, temperaturas máxima e mínima e condição do tempo de cada dia (mapeamento de condição conforme RF-03).
- **RF-05 — Temperature unit toggle:** o sistema deve oferecer um controle para alternar entre Celsius (°C) e Fahrenheit (°F); ao alternar, todas as temperaturas exibidas (clima atual e previsão) devem ser atualizadas e rotuladas com a unidade ativa. A unidade inicial é Celsius. Todas as temperaturas são exibidas arredondadas para o inteiro mais próximo, em ambas as unidades.
- **RF-06 — Loading states:** o sistema deve exibir indicação visual de carregamento enquanto aguarda resposta da busca de cidades e das consultas meteorológicas, sem bloquear a interface sem feedback.
- **RF-07 — Error states:** em caso de falha de rede, timeout ou erro da API, o sistema deve exibir mensagem de erro em pt-BR, compreensível e não técnica, com ação de nova tentativa (retry) disponível para o usuário. O retry é sempre manual (acionado pelo usuário); não há tentativas automáticas em segundo plano.
- **RF-08 — Empty states:** o sistema deve exibir estados vazios informativos: (a) estado inicial antes de qualquer busca, orientando o usuário a pesquisar uma cidade; (b) busca sem resultados, informando que nenhuma cidade foi encontrada.
- **RF-09 — Data freshness indicator:** o sistema deve exibir quando os dados meteorológicos apresentados foram obtidos (data/hora da última atualização), permitindo ao usuário avaliar a atualidade da informação. A referência é o horário local do dispositivo no momento em que a resposta da API foi recebida.

### 2.1 Contrato mínimo de dados (Open-Meteo)

> Base para tipos (`src/types/`), fixtures e mocks de teste. Campos fora desta tabela são ignorados pela aplicação.

| Consulta | Campos obrigatórios da resposta | Campos opcionais | Parâmetros da requisição |
| --- | --- | --- | --- |
| Geocoding (busca de cidades) | `results[].name`, `results[].country`, `results[].latitude`, `results[].longitude` | `results[].admin1` (região/estado — EC-15) | `name` (termo), `count=10`, `language=pt` |
| Forecast — clima atual | temperatura atual e `weathercode` atual | — | `latitude`, `longitude`, `timezone=auto` |
| Forecast — previsão diária | `daily.time[]`, `daily.temperature_2m_max[]`, `daily.temperature_2m_min[]`, `daily.weathercode[]` (arrays alinhados, 5 posições no caso nominal) | — | `forecast_days=5`, `timezone=auto` (dias no fuso local da cidade — EC-11) |

Regras do contrato:

- Temperaturas são sempre solicitadas em **Celsius** (fonte única da verdade); a exibição em °F é conversão de apresentação (RF-05, AC-05.2/AC-05.3).
- Ausência de campo obrigatório invalida o bloco correspondente e ativa o tratamento de resposta parcial (EC-13/EC-14) ou de erro (EC-06).
- `weathercode` segue a tabela WMO; o mapeamento para pt-BR é responsabilidade da aplicação (RF-03).

---

## 3. User Stories

> Formato: "Como [persona], quero [ação] para [valor]". Personas conforme o
> discovery: **P1 — Pessoa em deslocamento diário**, **P2 — Pessoa planejando
> uma viagem**, **P3 — Pessoa que trabalha ou pratica atividades ao ar livre**.
> Cada story referencia explicitamente o(s) requisito(s) funcional(is) que atende.

- **US-01 (P1 | RF-01, RF-02):** Como **pessoa em deslocamento diário**, quero **pesquisar minha cidade pelo nome e confirmá-la pela região e pelo país antes da consulta** para **ter certeza de que estou vendo o clima do lugar certo**.
- **US-02 (P1 | RF-03):** Como **pessoa em deslocamento diário**, quero **ver as condições atuais da cidade escolhida logo após selecioná-la** para **me preparar rapidamente para o dia**.
- **US-03 (P2 | RF-04):** Como **pessoa planejando uma viagem**, quero **ver a previsão de hoje e dos próximos quatro dias, com máximas e mínimas por dia,** para **comparar os dias e organizar minhas atividades**.
- **US-04 (P2 | RF-05):** Como **pessoa planejando uma viagem**, quero **alternar as temperaturas entre Celsius e Fahrenheit** para **interpretar os valores na unidade usada no meu destino**.
- **US-05 (P3 | RF-09):** Como **pessoa que trabalha ou pratica atividades ao ar livre**, quero **ver quando os dados meteorológicos foram atualizados** para **decidir se posso confiar neles antes de iniciar uma atividade**.
- **US-06 (P3 | RF-06):** Como **pessoa que trabalha ou pratica atividades ao ar livre**, quero **ver uma indicação clara de carregamento enquanto consulto o clima pelo celular** para **saber que a aplicação está respondendo mesmo em conexões lentas em campo**.
- **US-07 (P1 | RF-07):** Como **pessoa em deslocamento diário**, quero **receber uma mensagem compreensível com opção de tentar novamente quando a consulta falhar** para **não ficar sem informação nem precisar recomeçar a busca do zero**.
- **US-08 (P2 | RF-08):** Como **pessoa planejando uma viagem**, quero **ser orientada sobre o que fazer quando ainda não pesquisei nada ou quando a busca não encontra a cidade digitada** para **ajustar minha pesquisa e chegar ao destino correto**.

---

## 4. Acceptance Criteria

> Formato Given/When/Then. Cada bloco referencia explicitamente o RF correspondente.
> Estes critérios são a base direta dos testes automatizados (unit com Vitest e
> E2E com Playwright): cada AC deve ser verificável por pelo menos um teste, com
> entradas e resultados observáveis definidos no próprio critério.

### AC-01 — RF-01 (Search city)

- **AC-01.1:** **Given** que o usuário está na tela principal, **When** digita um nome de cidade válido (ex.: "Salvador") e aciona a busca, **Then** o sistema consulta a Open-Meteo Geocoding API com o termo digitado e exibe uma lista contendo todos os resultados retornados pela API, na ordem recebida.
- **AC-01.2:** **Given** que o campo de busca está vazio, contém apenas espaços em branco ou tem menos de 2 caracteres após o trim, **When** o usuário aciona a busca, **Then** nenhuma requisição é disparada e o usuário é orientado a informar um nome de cidade com pelo menos 2 caracteres.
- **AC-01.3:** **Given** que o usuário digita um nome com acentos ou caracteres especiais (ex.: "São Paulo"), **When** aciona a busca, **Then** a consulta é realizada corretamente e retorna resultados coerentes com o termo.

### AC-02 — RF-02 (City disambiguation)

- **AC-02.1:** **Given** que a busca retornou múltiplas cidades homônimas, **When** a lista de resultados é exibida, **Then** cada item apresenta nome da cidade, região/estado (quando disponível) e país.
- **AC-02.2:** **Given** que a lista de resultados está visível, **When** o usuário seleciona um item, **Then** a consulta meteorológica é feita exatamente para as coordenadas da localidade selecionada, e a cidade escolhida (com região/país) é exibida junto aos dados meteorológicos.
- **AC-02.3:** **Given** que um resultado do geocoding não possui o campo de região/estado, **When** a lista é exibida, **Then** o item apresenta nome da cidade e país, sem texto de placeholder quebrado, e a seleção funciona normalmente.

### AC-03 — RF-03 (Current weather)

- **AC-03.1:** **Given** que o usuário selecionou uma cidade, **When** a resposta da Forecast API é recebida com sucesso, **Then** são exibidos, no mínimo, a temperatura atual com a unidade ativa e a descrição textual da condição do tempo em pt-BR.
- **AC-03.2:** **Given** que os dados atuais estão exibidos, **When** o usuário observa o painel de clima atual, **Then** o painel exibe nome da cidade, região/estado (quando disponível) e país da localidade selecionada.

### AC-04 — RF-04 (5-day forecast)

- **AC-04.1:** **Given** que o usuário selecionou uma cidade, **When** a previsão é exibida com resposta completa da API, **Then** são apresentados 5 dias — o dia atual e os 4 dias seguintes — em ordem cronológica.
- **AC-04.2:** **Given** que a previsão está visível, **When** o usuário observa cada dia, **Then** cada item exibe a data no formato dia da semana abreviado + `dd/mm` (ex.: "qua, 29/10" — padrão até decisão em OQ-04), temperatura máxima, temperatura mínima e condição do tempo do dia.
- **AC-04.3:** **Given** que a Forecast API retornou menos de 5 dias válidos (resposta parcial — EC-13), **When** a previsão é exibida, **Then** apenas os dias efetivamente recebidos aparecem, em ordem cronológica, acompanhados de aviso de previsão incompleta; nenhum dia é inventado ou duplicado.

### AC-05 — RF-05 (Temperature unit toggle)

- **AC-05.1:** **Given** que a aplicação foi carregada pela primeira vez na sessão, **When** dados meteorológicos são exibidos, **Then** todas as temperaturas aparecem em Celsius, com rótulo "°C".
- **AC-05.2:** **Given** que há dados exibidos em Celsius, **When** o usuário alterna para Fahrenheit, **Then** todas as temperaturas visíveis (clima atual, máximas e mínimas da previsão) passam a ser exibidas em Fahrenheit com rótulo "°F", convertidas pela fórmula `F = C × 9/5 + 32` e arredondadas para o inteiro mais próximo (ex.: 25 °C → 77 °F; 20,6 °C → 69 °F).
- **AC-05.3:** **Given** que a unidade ativa é Fahrenheit, **When** o usuário alterna de volta para Celsius, **Then** todas as temperaturas retornam aos valores originais em Celsius (sem erro acumulado de conversão) com rótulo "°C".
- **AC-05.4:** **Given** qualquer estado da aplicação com temperaturas visíveis, **When** o usuário observa os valores, **Then** nenhuma temperatura é exibida sem a identificação da unidade.
- **AC-05.5:** **Given** que a aplicação está em estado de loading, erro ou vazio (EC-09), **When** o usuário aciona o toggle de unidade, **Then** a interface não quebra e a unidade escolhida é aplicada assim que houver temperaturas exibidas.

### AC-06 — RF-06 (Loading states)

- **AC-06.1a:** **Given** que o usuário acionou a busca de cidades, **When** a resposta ainda não chegou, **Then** um indicador de carregamento é exibido na área de resultados.
- **AC-06.1b:** **Given** que o indicador de carregamento da busca está visível, **When** a resposta chega (sucesso ou erro), **Then** o indicador é removido.
- **AC-06.2:** **Given** que o usuário selecionou uma cidade, **When** os dados meteorológicos ainda estão sendo carregados, **Then** um indicador de carregamento é exibido na área de clima/previsão, nenhum dado obsoleto é apresentado como se fosse da nova cidade e o indicador é removido quando a resposta chega.

### AC-07 — RF-07 (Error states)

- **AC-07.1:** **Given** que a Geocoding API ou a Forecast API falhou (erro de rede, timeout ou resposta de erro), **When** a falha é detectada, **Then** uma mensagem de erro em pt-BR, clara e sem jargão técnico, é exibida no lugar do conteúdo esperado.
- **AC-07.2:** **Given** que uma mensagem de erro está visível, **When** o usuário aciona o controle de tentar novamente (retry), **Then** a última requisição que falhou é reexecutada com os parâmetros originais e, em caso de sucesso, o conteúdo substitui a mensagem de erro.
- **AC-07.3:** **Given** que a resposta trouxe dados válidos para um painel e inválidos/ausentes para outro (resposta parcial — EC-14), **When** a tela é renderizada, **Then** o painel com dados válidos é exibido normalmente e o painel sem dados exibe estado de erro próprio com retry, sem derrubar o restante da tela.

### AC-08 — RF-08 (Empty states)

- **AC-08.1:** **Given** que o usuário abriu a aplicação e ainda não realizou nenhuma busca, **When** a tela principal é exibida, **Then** um estado inicial orienta o usuário a pesquisar uma cidade.
- **AC-08.2:** **Given** que a busca foi concluída sem nenhum resultado, **When** a resposta vazia é recebida, **Then** uma mensagem informa que nenhuma cidade foi encontrada para o termo pesquisado e sugere revisar o texto digitado.

### AC-09 — RF-09 (Data freshness indicator)

- **AC-09.1:** **Given** que dados meteorológicos foram carregados com sucesso, **When** o painel de clima é exibido, **Then** a data/hora em que os dados foram obtidos é apresentada no formato `dd/mm/aaaa hh:mm` (convenção pt-BR padrão até decisão em **OQ-04**).
- **AC-09.2:** **Given** que o usuário realiza uma nova consulta (nova cidade ou retry), **When** novos dados chegam, **Then** a indicação de atualização reflete o horário da nova consulta.

### AC-NFR — Critérios verificáveis para NFRs (checklist)

- [ ] **AC-NFR-01 (NFR-01):** todos os fluxos (busca, seleção, clima atual, previsão, alternância de unidade) são utilizáveis sem scroll horizontal e sem sobreposição de elementos em larguras de 360 px, 768 px e 1280 px.
- [ ] **AC-NFR-03a (NFR-03):** todos os controles interativos (campo de busca, botão de busca, itens da lista de resultados, toggle de unidade, botão de retry) são alcançáveis e operáveis apenas com teclado, com ordem de foco lógica e indicador de foco visível.
- [ ] **AC-NFR-03b (NFR-03):** todos os controles possuem nome acessível (accessible name) e semântica adequada; estados de loading e erro são anunciados a tecnologias assistivas (ex.: live regions).
- [ ] **AC-NFR-03c (NFR-03):** textos e elementos essenciais do tema dark atendem contraste mínimo de **4.5:1** (baseline WCAG 2.1 AA, provisório até decisão em OQ-07).
- [ ] **AC-NFR-05 (NFR-05):** em nenhuma simulação de falha (rede offline, timeout, erro 4xx/5xx da API) a interface permanece em branco ou em loading infinito; sempre há feedback e caminho de recuperação.

---

## 5. Non-Functional Requirements

- **NFR-01 — Responsiveness:** interface mobile-first, adaptável de 360 px a desktop; fluxos de busca e leitura da previsão plenamente utilizáveis em telas pequenas. *(derivado de RNF1)*
- **NFR-02 — Usability:** busca, seleção de cidade, leitura da previsão e alternância de unidade devem ser compreensíveis e operáveis sem instruções externas; rótulos e mensagens em pt-BR. *(derivado de RNF2)*
- **NFR-03 — Accessibility:** semântica HTML adequada, nomes acessíveis em todos os controles, navegação completa por teclado com foco visível, anúncios de estados dinâmicos (loading/erro) para tecnologias assistivas e contraste adequado no tema dark. Nível formal de conformidade (ex.: WCAG 2.1 AA) a confirmar — ver **OQ-07**. *(derivado de RNF3)*
- **NFR-04 — Performance:** cada ação do usuário produz feedback visual em até **100 ms** (mudança de estado, indicador de loading etc.); requisições sem resposta em até **10 s** são abortadas e tratadas como erro recuperável (RF-07). Metas quantitativas de carregamento (dispositivo/conexão de referência) a acordar — ver **OQ-08**. *(derivado de RNF4)*
- **NFR-05 — Resilience:** falhas de rede ou indisponibilidade do Open-Meteo nunca deixam a interface sem feedback; todo erro tem mensagem e ação de recuperação (retry). *(derivado de RNF5)*
- **NFR-06 — Visual identity:** tema dark com estilo glassmorphism aplicado de forma consistente, sem comprometer legibilidade e contraste (sujeito a NFR-03).
- **NFR-07 — Privacy & simplicity:** sem autenticação, sem coleta de dados pessoais, sem persistência de servidor e sem API keys expostas no cliente (**D1**, **D4**).
- **NFR-08 — Browser compatibility:** suporte às duas últimas versões estáveis de Chrome, Firefox, Safari e Edge, em desktop e mobile.

---

## 6. Edge Cases

> Cada EC referencia o AC que o verifica; ECs sem AC próprio (EC-11, EC-12) dependem
> de decisões em aberto (OQ-04) ou são verificados diretamente nos testes E2E a
> partir desta tabela.

| ID | Cenário | Comportamento esperado |
| --- | --- | --- |
| EC-01 | Busca com campo vazio, somente espaços ou menos de 2 caracteres após trim | Nenhuma requisição; orientação ao usuário (AC-01.2). |
| EC-02 | Busca sem resultados (cidade inexistente ou grafia incorreta) | Estado vazio com mensagem e sugestão de revisão (AC-08.2). |
| EC-03 | Cidades homônimas (ex.: "Springfield") | Lista com região/país para desambiguação; seleção explícita obrigatória (AC-02.1). |
| EC-04 | Falha de rede (offline) durante busca ou consulta | Mensagem de erro + retry; interface nunca fica sem feedback (AC-07.1, AC-07.2). |
| EC-05 | Timeout ou lentidão extrema da API | Indicador de loading enquanto aguarda; requisições sem resposta em até **10 s** são abortadas e tratadas como erro recuperável com retry (AC-06, AC-07). |
| EC-06 | Resposta de erro da API (4xx/5xx) ou payload com estrutura inválida | Tratar como erro recuperável com mensagem clara e retry; nenhum dado da resposta inválida é renderizado. |
| EC-07 | Rate limiting / indisponibilidade do Open-Meteo | Mensagem de erro amigável + retry; limites aceitáveis a definir (OQ-05). |
| EC-08 | Usuário seleciona nova cidade enquanto consulta anterior ainda carrega | A resposta da consulta anterior é descartada; apenas os dados da seleção mais recente são exibidos (AC-06.2). |
| EC-09 | Alternância de unidade durante loading ou em estado de erro | O toggle não quebra a interface; a unidade escolhida é aplicada quando houver dados exibidos (AC-05.5). |
| EC-10 | Termo de busca com acentos, hífens, apóstrofos, números, emojis ou símbolos (ex.: "São Luís", "Val-d'Or", "123🌧") | O termo é enviado como texto simples (URL-encoded) sem quebrar a aplicação; com resultados, exibe a lista (AC-01.1, AC-01.3); sem resultados, exibe o estado vazio (AC-08.2); nunca interpreta a entrada como código (sem injection). |
| EC-11 | Fuso horário da cidade diferente do fuso do usuário | Datas da previsão correspondem aos dias locais da cidade consultada; convenções de exibição a confirmar (OQ-04). |
| EC-12 | Termo de busca excessivamente longo | Entrada tratada sem quebra de layout nem erro não tratado. |
| EC-13 | Resposta parcial: payload válido, porém incompleto — previsão com menos de 5 dias retornados | Exibem-se apenas os dias efetivamente recebidos, em ordem cronológica, com aviso de previsão incompleta; nenhum dia é inventado ou duplicado (AC-04.3). |
| EC-14 | Resposta parcial: clima atual presente, mas bloco diário ausente (ou vice-versa) | O painel com dados válidos é exibido normalmente; o painel sem dados exibe estado de erro próprio com retry, sem derrubar o restante da tela (AC-07.3). |
| EC-15 | Resposta parcial: resultado de geocoding sem região/estado (campo opcional ausente) | O item exibe cidade + país (AC-02.3); a seleção e a consulta meteorológica funcionam normalmente. |
| EC-16 | Nova busca iniciada enquanto dados de outra cidade estão exibidos | Os dados da cidade anterior permanecem visíveis até o usuário selecionar uma nova localidade; a seleção dispara a substituição (AC-06.2). |

---

## 7. Assumptions

- **A-01:** A aplicação é uma SPA web responsiva (React + Vite + TypeScript); não há aplicativo nativo. *(suposição do discovery)*
- **A-02:** O usuário possui conexão com a internet; suporte offline não faz parte desta versão. *(suposição do discovery; cache é OQ-06)*
- **A-03:** A busca de cidade é sempre iniciada manualmente pelo usuário; não há geolocalização automática. *(suposição do discovery; ver OQ-02)*
- **A-04:** A alternância °C/°F afeta apenas a apresentação de temperaturas; demais grandezas meteorológicas não são convertidas por esse controle. *(suposição do discovery)*
- **A-05:** A previsão de 5 dias terá **granularidade diária** (máxima/mínima + condição por dia), por ser a interpretação mínima consistente com o horizonte definido em D2; granularidade horária fica fora desta versão (ver OQ-01).
- **A-06:** O conjunto mínimo de atributos do clima atual é temperatura + condição do tempo; atributos adicionais (vento, umidade, sensação térmica etc.) dependem de confirmação (ver OQ-03).
- **A-07:** A preferência de unidade vale para a sessão corrente; persistência entre visitas não está confirmada (ver OQ-09).
- **A-08:** Datas e horários são exibidos em convenções pt-BR (formato e detalhes regionais a confirmar — OQ-04).
- **A-09:** A cobertura e os limites de uso gratuito do Open-Meteo são suficientes para o volume esperado desta primeira versão (ver OQ-05).
- **A-10:** As personas são hipóteses de trabalho derivadas do briefing, não segmentos validados pela empresa.

---

## 8. Risks

| ID | Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- | --- |
| R-01 | Busca retorna cidades homônimas ou localidade incorreta | Alta | Alto | RF-02: desambiguação obrigatória com região/país e seleção explícita antes da consulta. |
| R-02 | Open-Meteo indisponível, lento ou com limite de requisições | Média | Alto | RF-07/NFR-05: tratamento de erro com mensagem e retry; acordar limites aceitáveis (OQ-05). |
| R-03 | Interpretações divergentes de "previsão de cinco dias" | Alta | Médio | Resolvido por D2 (hoje + 4) e A-05 (granularidade diária); validar A-05 com stakeholders (OQ-01). |
| R-04 | Conversão ou rótulo °C/°F incorreto | Baixa | Alto | RF-05/AC-05: unidade sempre identificada; conversões validadas por critérios verificáveis e testes de aceitação. |
| R-05 | Interface difícil de usar em telas pequenas | Média | Alto | NFR-01/AC-NFR-01: design mobile-first validado em larguras representativas (360/768/1280 px). |
| R-06 | Tema dark glassmorphism comprometer contraste e legibilidade | Média | Médio | NFR-03/AC-NFR-03c: verificação de contraste como critério de aceite; ajustar estilo antes de flexibilizar acessibilidade. |
| R-07 | Metas de performance/acessibilidade não acordadas inviabilizam verificação objetiva | Média | Médio | OQ-07/OQ-08 priorizadas antes do planejamento detalhado; baseline qualitativo definido em NFR-03/NFR-04. |

---

## 9. Out of Scope

Explicitamente **fora** desta versão:

- Autenticação, contas de usuário e qualquer persistência de servidor (**D4**).
- Geolocalização automática do usuário (busca é manual — A-03; revisitar via OQ-02).
- Suporte offline / cache de dados recentes (revisitar via OQ-06).
- Previsão horária e horizontes maiores que 5 dias (revisitar via OQ-01).
- Aplicativos nativos (iOS/Android); apenas web responsiva.
- Múltiplos idiomas da interface (apenas pt-BR — **D5**).
- Alertas meteorológicos, notificações push e avisos severos.
- Favoritos / histórico de cidades pesquisadas.
- Mapas, radar e visualizações meteorológicas avançadas.
- Conversão de unidades além da temperatura (vento, pressão etc. — A-04).
- Dados meteorológicos históricos (passado); apenas condições atuais e previsão.
- Qualidade do ar, índice UV, pólen e demais APIs complementares da Open-Meteo.
- Exibição simultânea ou comparação de múltiplas cidades; uma cidade ativa por vez.
- Deep-linking / URL compartilhável com a cidade selecionada (estado não refletido na URL).
- PWA, instalação e service workers.
- Tema claro (light mode); apenas tema dark glassmorphism (**NFR-06**).
- Telemetria, analytics e qualquer rastreamento de uso (**NFR-07**).

---

## 10. Open Questions

| ID | Pergunta | Origem | Impacto |
| --- | --- | --- | --- |
| OQ-01 | A granularidade diária (A-05) atende, ou será necessária previsão horária (agora ou em versão futura)? | Discovery Q1 | Volume de dados, layout e integração. |
| OQ-02 | Haverá geolocalização automática em versão futura? | Discovery Q5 | Interação, permissões e privacidade. |
| OQ-03 | Quais atributos adicionais devem aparecer no clima atual e na previsão (vento, umidade, sensação térmica, probabilidade de chuva etc.)? | Discovery Q2 | Utilidade da consulta, dados necessários e interface. |
| OQ-04 | Quais formatos de data/hora e convenções regionais devem ser usados além do idioma pt-BR? | Discovery Q6 | Leitura de datas/horários e exibição de dados (inclui EC-11). |
| OQ-05 | Quais limites de cobertura, disponibilidade e requisições do Open-Meteo são aceitáveis para o produto? | Discovery Q8 | Confiabilidade, experiência e necessidade de contingência. |
| OQ-06 | É necessário oferecer dados recentes sem conexão, por meio de cache local? | Discovery Q7 | Complexidade de armazenamento e indicação de atualidade (relaciona-se a RF-09). |
| OQ-07 | Qual nível formal de conformidade de acessibilidade será exigido (ex.: WCAG 2.1 AA)? | Discovery RNF3/Q9 | Critérios objetivos de verificação de NFR-03. |
| OQ-08 | Quais metas mensuráveis de performance e disponibilidade (com dispositivo e conexão de referência) devem ser atendidas? | Discovery RNF4/Q9 | Verificação objetiva de NFR-04. |
| OQ-09 | A escolha de unidade (°C/°F) deve ser lembrada entre visitas (armazenamento local no dispositivo)? | Discovery Q4 | Necessidade de preferência local; não há persistência de servidor (D4). |

---

### Matrizes de rastreabilidade (resumo)

> "Unit" = Vitest + Testing Library (lógica pura e componentes isolados); "E2E" = Playwright com API mockada.

#### RF → US → AC → nível de teste

| RF | User Stories | Acceptance Criteria | Nível de teste |
| --- | --- | --- | --- |
| RF-01 | US-01 | AC-01.1, AC-01.2, AC-01.3 | Unit (validação do termo, serviço de geocoding) + E2E (fluxo de busca) |
| RF-02 | US-01 | AC-02.1, AC-02.2, AC-02.3 | Unit (formatação do resultado) + E2E (seleção) |
| RF-03 | US-02 | AC-03.1, AC-03.2 | Unit (mapeamento WMO → pt-BR) + E2E (painel atual) |
| RF-04 | US-03 | AC-04.1, AC-04.2, AC-04.3 | Unit (parsing diário, resposta parcial) + E2E (lista de 5 dias) |
| RF-05 | US-04 | AC-05.1, AC-05.2, AC-05.3, AC-05.4, AC-05.5 | Unit (conversão/arredondamento) + E2E (toggle) |
| RF-06 | US-06 | AC-06.1a, AC-06.1b, AC-06.2 | E2E (loading com respostas atrasadas mockadas) |
| RF-07 | US-07 | AC-07.1, AC-07.2, AC-07.3 | Unit (classificação de erro no serviço) + E2E (falha mockada + retry) |
| RF-08 | US-08 | AC-08.1, AC-08.2 | E2E (estado inicial e busca sem resultados) |
| RF-09 | US-05 | AC-09.1, AC-09.2 | Unit (formatação data/hora) + E2E (atualização após retry) |

#### US → AC → NFR relevantes

> Visão orientada a entrega: cada linha é um candidato natural a tarefa (fase Tasks) e a grupo de testes (fase Test). A coluna NFR lista apenas os requisitos não-funcionais com impacto direto na story — NFR-02 (usability) e NFR-08 (browsers) aplicam-se transversalmente a todas.

| User Story | RF | Acceptance Criteria | NFRs relevantes | Verificação NFR |
| --- | --- | --- | --- | --- |
| US-01 — Buscar e confirmar cidade (P1) | RF-01, RF-02 | AC-01.1, AC-01.2, AC-01.3, AC-02.1, AC-02.2, AC-02.3 | NFR-01 (busca mobile-first), NFR-03 (campo/lista operáveis por teclado, nomes acessíveis), NFR-04 (feedback ≤ 100 ms) | AC-NFR-01, AC-NFR-03a, AC-NFR-03b |
| US-02 — Ver clima atual (P1) | RF-03 | AC-03.1, AC-03.2 | NFR-01 (leitura em telas pequenas), NFR-06 (legibilidade no tema dark) | AC-NFR-01, AC-NFR-03c |
| US-03 — Ver previsão de 5 dias (P2) | RF-04 | AC-04.1, AC-04.2, AC-04.3 | NFR-01 (lista legível em 360 px), NFR-06 (contraste) | AC-NFR-01, AC-NFR-03c |
| US-04 — Alternar °C/°F (P2) | RF-05 | AC-05.1, AC-05.2, AC-05.3, AC-05.4, AC-05.5 | NFR-03 (toggle com nome acessível, operável por teclado), NFR-04 (feedback ≤ 100 ms) | AC-NFR-03a, AC-NFR-03b |
| US-05 — Ver atualidade dos dados (P3) | RF-09 | AC-09.1, AC-09.2 | NFR-06 (legibilidade do indicador) | AC-NFR-03c |
| US-06 — Ver carregamento (P3) | RF-06 | AC-06.1a, AC-06.1b, AC-06.2 | NFR-03 (loading anunciado a tecnologias assistivas), NFR-04 (feedback ≤ 100 ms), NFR-05 (nunca sem feedback) | AC-NFR-03b, AC-NFR-05 |
| US-07 — Erro com retry (P1) | RF-07 | AC-07.1, AC-07.2, AC-07.3 | NFR-03 (erro anunciado, retry por teclado), NFR-04 (timeout 10 s), NFR-05 (sempre há recuperação) | AC-NFR-03a, AC-NFR-03b, AC-NFR-05 |
| US-08 — Estados vazios orientativos (P2) | RF-08 | AC-08.1, AC-08.2 | NFR-03 (conteúdo acessível dos estados vazios) | AC-NFR-03b |
