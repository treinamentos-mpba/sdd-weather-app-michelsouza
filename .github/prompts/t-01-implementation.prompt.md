---
mode: agent
description: 'Implementa T-01 — contratos brutos e tipos de domínio do Weather App.'
---

# Prompt — Implementar T-01

Você é o **Code Agent** do Weather App. Implemente somente a tarefa **T-01 — Definir contratos brutos e tipos de domínio**.

Este prompt é autocontido. Não implemente T-02 nem qualquer tarefa posterior. Não consulte a conversa anterior; use apenas as regras abaixo.

## Contexto

Aplicação SPA client-side (React + Vite + TypeScript strict) que consulta a Open-Meteo sem API key. Esta tarefa declara os contratos compartilhados. Ainda não há `src/`; crie apenas os arquivos desta tarefa.

A spec (`specs/weather-app-spec.md`, seção 2.1) é a fonte de verdade. O plano (`plans/weather-app-plan.md`, seção 4) já traduziu esse contrato para os tipos abaixo. Duas premissas do backlog prevalecem se houver conflito com outra parte do plano:

1. Resposta de previsão com zero dias válidos é previsão parcial (`isPartial: true`), não erro.
2. Payload de geocoding que viole campo obrigatório será, numa tarefa futura, `invalid-payload`. Não descarte registros nesta tarefa: aqui só existem tipos, sem validação.

Temperaturas de domínio permanecem em Celsius. Fahrenheit é só apresentação e não faz parte destes tipos.

## Escopo

Crie exatamente estes arquivos:

- `src/types/openMeteo.ts`
- `src/types/domain.ts`

Não crie `src/types/index.ts`, services, hooks, componentes, testes, fixtures nem altere `package.json`. Não implemente funções, type guards, fetch, mapeamento WMO nem formatação de data. Não use `any`, `unknown` genérico no lugar de um campo conhecido, classe ou `enum`.

Exporte cada tipo. Comentários curtos em pt-BR; identificadores em en-US. TypeScript strict está ativo (`noUnusedLocals`, `noUnusedParameters`): não deixe símbolo local sem uso.

## Arquivo `src/types/openMeteo.ts`

Declare e exporte:

```ts
export interface GeocodingResult {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  admin1?: string;
}

export interface GeocodingResponse {
  results?: GeocodingResult[];
}

export interface ForecastCurrent {
  time: string;
  interval?: number;
  temperature_2m: number;
  weather_code: number;
}

export interface ForecastDaily {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  weather_code: number[];
}

export interface ForecastResponse {
  current?: ForecastCurrent;
  daily?: ForecastDaily;
}
```

Regras:

- `name`, `country`, `latitude` e `longitude` são obrigatórios. `admin1` é o único campo opcional do resultado (região/estado).
- `results` é opcional. Ausência ou array vazio significará, numa tarefa futura, busca sem resultados. Não modele isso aqui.
- `current` e `daily` são propriedades opcionais e tipos independentes. A ausência de um não torna o outro inválido.
- `ForecastDaily` exige os quatro arrays no tipo. O alinhamento e a contagem serão validados no service, não neste arquivo.
- Use os nomes de campo da API (`temperature_2m`, `weather_code`). Não renomeie para camelCase neste arquivo.
- Ignore campos fora do contrato mínimo; não os declare.

## Arquivo `src/types/domain.ts`

Este arquivo pode importar apenas tipos de `./openMeteo` se precisar, mas não deve importar React nem services. Prefira não importar nada.

Declare e exporte:

```ts
export interface City {
  name: string;
  country: string;
  region?: string;
  latitude: number;
  longitude: number;
}

export type Unit = 'celsius' | 'fahrenheit';

export interface CurrentWeather {
  temperatureC: number;
  weatherCode: number;
  description: string;
}

export interface ForecastDay {
  date: string;
  maxTemperatureC: number;
  minTemperatureC: number;
  weatherCode: number;
  description: string;
}

export interface DailyForecast {
  days: ForecastDay[];
  isPartial: boolean;
}

export type AppErrorKind = 'network' | 'timeout' | 'service' | 'invalid-payload';

export interface AppError {
  kind: AppErrorKind;
  message: string;
}

export type PanelState<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; error: AppError };

export interface WeatherData {
  current: PanelState<CurrentWeather>;
  daily: PanelState<DailyForecast>;
  fetchedAt: Date;
}

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'empty' }
  | { status: 'error'; error: AppError };
```

Regras de domínio:

- `Unit` aceita somente `'celsius'` e `'fahrenheit'`. Não inclua `'C'`, `'F'` nem `string`.
- `region` é opcional e corresponde a `admin1`. Não use `admin1` no domínio.
- `temperatureC`, `maxTemperatureC` e `minTemperatureC` representam Celsius, não a unidade ativa.
- `description` é texto pt-BR. O fallback `"Condição desconhecida"` será produzido por outra tarefa; não hardcode um mapa WMO aqui.
- `DailyForecast.isPartial` existe para representar menos de cinco dias, inclusive zero. Não transforme zero dias em `AppError` neste tipo.
- `PanelState` não tem `idle`, `loading` nem `empty`. Só `success` e `error`, para falha isolada de `current` ou `daily`.
- `WeatherData.current` e `WeatherData.daily` são independentes. `fetchedAt` é `Date` criado no cliente, não string da API.
- `AppErrorKind` distingue exatamente `network`, `timeout`, `service` e `invalid-payload`. Não una timeout com network. `message` é string pt-BR; não coloque status HTTP no tipo.
- `AsyncState` inclui exatamente `idle`, `loading`, `success`, `empty` e `error`. `empty` não carrega `data`. `error` carrega `AppError`, não `Error` nativo.

## Critérios de aceite

A tarefa só termina quando todos forem verdadeiros:

1. **Given** `GeocodingResult`, **When** o tipo é inspecionado, **Then** `name`, `country`, `latitude` e `longitude` são obrigatórios e `admin1` é opcional.
2. **Given** `ForecastResponse`, **When** os blocos são inspecionados, **Then** `current` e `daily` são tipos independentes e opcionais; `daily` declara `time`, `temperature_2m_max`, `temperature_2m_min` e `weather_code`.
3. **Given** os tipos de domínio, **When** são inspecionados, **Then** `Unit` aceita apenas `'celsius' | 'fahrenheit'`; `AppErrorKind` distingue `network`, `service`, `invalid-payload` e `timeout`; `AsyncState` inclui `idle`, `loading`, `success`, `empty` e `error`.
4. `PanelState` permite sucesso de um bloco e erro do outro sem derrubar `WeatherData`.
5. Nenhum arquivo fora de `src/types/openMeteo.ts` e `src/types/domain.ts` foi criado ou editado.
6. Não há função exportada, `any`, acesso a rede nem dependência de React.

## Verificação

Rode, nesta ordem:

```bash
pnpm lint
pnpm build
pnpm test
```

`pnpm test` pode passar sem novos testes: T-01 não pede teste. Se `pnpm lint` ou `pnpm build` falhar por causa destes arquivos, corrija os tipos. Não crie aplicação, teste ou configuração só para fazer o comando passar.

## Fora de escopo

Não implemente validação de termo, conversão de temperatura, mapa WMO, formatação de data, `fetch`, timeout, services, hooks, componentes, estado React, tema, testes unitários ou E2E.
