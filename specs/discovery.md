# Discovery — Aplicação de previsão do tempo

## Contexto

A empresa solicitou uma aplicação de previsão do tempo para que usuários consultem o clima de cidades de seu interesse. A experiência deve funcionar em dispositivos móveis e permitir a alternância entre Celsius e Fahrenheit.

## Requisitos funcionais

- **RF1 — Buscar cidades:** permitir que o usuário pesquise uma cidade e selecione o local desejado.
- **RF2 — Consultar clima atual:** exibir as condições meteorológicas atuais da cidade selecionada.
- **RF3 — Consultar previsão:** exibir a previsão para um período de cinco dias da cidade selecionada.
- **RF4 — Alternar unidades:** permitir alternar entre Celsius e Fahrenheit e atualizar os valores de temperatura exibidos.

## Requisitos não funcionais

- **RNF1 — Responsividade:** oferecer uma experiência utilizável em dispositivos móveis, com layout adaptável a diferentes tamanhos de tela.
- **RNF2 — Usabilidade:** tornar busca, consulta das condições e alternância de unidade claras e diretas.
- **RNF3 — Desempenho:** apresentar resultados em tempo adequado após a busca; o limite aceitável ainda precisa ser definido.
- **RNF4 — Confiabilidade:** comunicar indisponibilidade de rede ou de dados sem deixar a interface em um estado indefinido.
- **RNF5 — Acessibilidade:** permitir a utilização dos controles principais com teclado e tecnologias assistivas; os critérios de conformidade precisam ser definidos.

## Riscos

| Risco | Probabilidade | Impacto | Consideração |
| --- | --- | --- | --- |
| Nomes de cidades ambíguos ou repetidos | Alta | Médio | Pode levar o usuário a consultar a localidade errada; avaliar como diferenciar resultados, por exemplo, com estado ou país. |
| Serviço de dados indisponível ou com latência elevada | Média | Alto | Pode impedir a busca ou a atualização das condições; definir tratamento de falhas e mensagens ao usuário. |
| Interpretação diferente do período de cinco dias | Média | Médio | Pode gerar uma previsão diferente da expectativa do usuário; esclarecer se o dia atual está incluído. |
| Erro na conversão ou apresentação das unidades | Baixa | Alto | Pode induzir decisões incorretas; definir se a unidade também afeta outros dados meteorológicos e validar os valores apresentados. |
| Layout ou controles inadequados em telas pequenas | Média | Alto | Pode dificultar a busca e a leitura da previsão em dispositivos móveis; validar em diferentes larguras de tela. |

## Perguntas em aberto (open questions)

1. Qual fonte de dados meteorológicos deve ser utilizada? Há requisitos de custo, licença, cobertura geográfica ou chave de API?
2. A previsão de cinco dias inclui o dia atual ou os cinco dias seguintes?
3. Como o usuário deve escolher entre cidades com o mesmo nome? Quais informações de localização devem aparecer nos resultados?
4. Qual deve ser a unidade padrão na primeira visita? A escolha do usuário deve ser lembrada entre sessões?
5. Quais informações compõem o clima atual e cada dia da previsão (por exemplo, mínima e máxima, condição, precipitação e vento)?
6. Qual idioma ou quais idiomas devem ser suportados? Datas, horários e unidades devem seguir a localidade do usuário?
7. É necessário oferecer localização automática, cidades favoritas ou consulta recente, ou a busca manual é suficiente?
8. O que a interface deve fazer quando não houver conexão ou o serviço de dados falhar? É necessário suporte offline ou cache?
9. Quais metas de desempenho, requisitos de acessibilidade e navegadores/dispositivos precisam ser atendidos?
