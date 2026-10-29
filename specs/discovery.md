# Discovery — Weather App

## Contexto

A empresa solicita uma aplicação de previsão do tempo. O usuário deve conseguir pesquisar cidades, consultar as condições atuais e a previsão para cinco dias, alternar entre Celsius e Fahrenheit e usar a aplicação em dispositivos móveis.

### Personas iniciais

- **Pessoa em deslocamento diário:** consulta rapidamente o clima atual para se preparar para o dia.
- **Pessoa planejando uma viagem:** compara a previsão dos próximos dias para organizar atividades.
- **Pessoa que trabalha ou pratica atividades ao ar livre:** consulta no celular as condições locais antes de iniciar uma atividade e verifica quando os dados foram atualizados.

As personas são hipóteses iniciais derivadas dos usos mais prováveis e devem ser validadas.

## Requisitos Funcionais

- **RF1 — Buscar cidade:** permitir que o usuário pesquise cidades pelo nome e escolha a localidade desejada.
- **RF2 — Consultar clima atual:** apresentar as condições atuais para a cidade escolhida.
- **RF3 — Consultar previsão de cinco dias:** apresentar a previsão para a cidade escolhida por um horizonte de cinco dias.
- **RF4 — Alternar unidade de temperatura:** permitir alternar entre Celsius e Fahrenheit e atualizar as temperaturas exibidas.

## Requisitos Não-Funcionais

Os requisitos abaixo são candidatos para orientar a especificação; metas e critérios de aceite ainda precisam ser acordados.

- **RNF1 — Responsividade (derivado do briefing):** os fluxos de busca e consulta devem ser utilizáveis em dispositivos móveis e adaptar-se a diferentes tamanhos de tela.
- **RNF2 — Usabilidade:** busca, seleção da cidade, leitura da previsão e alternância de unidade devem ser compreensíveis e operáveis sem instruções externas.
- **RNF3 — Acessibilidade:** controles e resultados devem ter semântica e nomes acessíveis e permitir navegação por teclado; o nível de conformidade deve ser definido.
- **RNF4 — Desempenho:** busca e apresentação de dados devem ocorrer dentro de metas de tempo a definir, incluindo a conexão e o dispositivo de referência.
- **RNF5 — Resiliência:** falhas de rede ou indisponibilidade da fonte de dados não devem deixar a interface sem feedback; comportamento e mensagens devem ser definidos.

## Riscos

| Risco | Probabilidade | Impacto | Mitigação inicial |
| --- | --- | --- | --- |
| Busca retorna cidades homônimas ou localidade incorreta | Alta | Alto | Apresentar informações de desambiguação, como região e país, e permitir confirmação antes da consulta. |
| Fonte meteorológica indisponível, lenta ou com limite de requisições | Média | Alto | Avaliar cobertura e limites da fonte, tratar erros e definir mensagens e estratégia de nova tentativa. |
| "Previsão de cinco dias" é interpretada de formas diferentes | Alta | Médio | Definir se inclui o dia atual e qual granularidade será exibida antes da especificação detalhada. |
| Conversão ou rótulo de Celsius/Fahrenheit incorreto | Baixa | Alto | Definir a unidade como preferência de apresentação, manter unidade identificada e validar conversões com testes. |
| Interface fica difícil de usar em telas pequenas | Média | Alto | Adotar desenho mobile-first e validar busca e leitura da previsão em larguras de tela representativas. |

## Perguntas em Aberto

1. **A previsão será diária, horária ou ambas?** Impacto: define o volume de dados, o layout e a granularidade necessária da integração.
2. **Quais atributos devem aparecer no clima atual e na previsão?** Impacto: afeta a utilidade da consulta, os dados necessários e a interface.
3. **Como diferenciar cidades com o mesmo nome?** Impacto: reduz o risco de mostrar o clima da localidade errada.
4. **A escolha de unidade deve ser lembrada entre visitas?** Impacto: define se será necessário armazenar uma preferência no dispositivo; não há persistência de servidor.
5. **A busca será somente manual ou deve haver geolocalização automática?** Impacto: muda a interação, as permissões solicitadas e o tratamento de privacidade.
6. **Quais formatos de data/hora e convenções regionais devem ser usados além do idioma pt-BR da interface?** Impacto: influencia a leitura das datas e horários e a apresentação dos dados.
7. **É necessário oferecer dados recentes sem conexão, por meio de cache?** Impacto: aumenta a complexidade de armazenamento e exige indicar a atualidade dos dados.
8. **Quais limites de cobertura, disponibilidade e requisições do Open-Meteo são aceitáveis para o produto?** Impacto: pode afetar confiabilidade, experiência e necessidade de contingência.
9. **Quais metas mensuráveis de desempenho, acessibilidade e disponibilidade devem ser atendidas?** Impacto: sem critérios objetivos, não será possível verificar conformidade de forma consistente.

## Decisões

- **D1 — Fonte de dados: Open-Meteo, sem API key.** Justificativa: reduz o atrito de configuração e evita gerenciar uma chave de API no cliente. **Resolve:** a escolha de uma fonte de dados meteorológicos. Cobertura e limites de uso continuam em aberto.
- **D2 — Período da previsão: hoje mais os quatro dias seguintes.** Justificativa: define um horizonte consistente de cinco dias incluindo a data atual. **Resolve:** se o dia atual faz parte dos cinco dias; a granularidade da previsão continua em aberto.
- **D3 — Unidade inicial: Celsius.** Justificativa: estabelece uma apresentação padrão para a primeira consulta. **Resolve:** qual unidade mostrar inicialmente; lembrar a preferência do usuário entre visitas continua em aberto.
- **D4 — Sem autenticação e sem persistência de servidor.** Justificativa: mantém a primeira versão focada na consulta meteorológica sem contas ou dados associados a usuários no servidor. **Resolve:** se haverá login e armazenamento de dados no servidor; cache ou preferências locais continuam em aberto.
- **D5 — Idioma da interface: pt-BR.** Justificativa: define o idioma inicial da experiência. **Resolve:** o idioma da interface para a primeira versão; formatos de data/hora e convenções regionais ainda precisam ser definidos.

## Suposições

- A aplicação será uma interface web responsiva, já que o briefing menciona uso em dispositivos móveis, mas não especifica uma aplicação nativa.
- O usuário terá acesso à internet para pesquisar cidades e obter dados meteorológicos; suporte offline não foi solicitado.
- A pesquisa por cidade será iniciada pelo usuário. Geolocalização automática não foi solicitada.
- Celsius e Fahrenheit são unidades de apresentação da temperatura; outros valores meteorológicos não serão convertidos por essa alternância.
- As personas são hipóteses de trabalho, não segmentos confirmados pela empresa.
