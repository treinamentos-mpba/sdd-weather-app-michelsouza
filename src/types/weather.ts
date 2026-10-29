/** Unidade de exibição. Os dados internos permanecem sempre em Celsius. */
export type Unit = 'celsius' | 'fahrenheit';

/** Cidade selecionável, normalizada a partir do geocoding. */
export interface City {
  /** Nome da cidade. */
  name: string;
  /** País, como exibido na interface. */
  country: string;
  /** Região ou estado (`admin1`). Ausente: mostrar só cidade e país. */
  region?: string;
  /** Latitude em graus decimais. */
  latitude: number;
  /** Longitude em graus decimais. */
  longitude: number;
}

/**
 * Clima atual validado. A temperatura está em Celsius; as demais métricas não são convertidas.
 * `null` é medição omitida pela Open-Meteo: a UI mostra "—", nunca 0 nem NaN.
 */
export interface CurrentWeather {
  /** Temperatura atual em Celsius. Ausente: "—". */
  temperatureC: number | null;
  /** Código WMO. Ausente: ícone e texto de condição desconhecida. */
  weatherCode: number | null;
  /** Descrição em pt-BR. Fallback de exibição: "Condição desconhecida". */
  description: string;
  /** Umidade relativa, em porcentagem. Ausente: "—". */
  humidity: number | null;
  /** Velocidade do vento, em km/h. Ausente: "—". */
  windSpeedKmh: number | null;
  /** Precipitação, em milímetros. Ausente ou null vira 0. */
  precipitationMm: number;
  /** Pressão ao nível do mar, em hPa. Ausente: "—". */
  pressureHpa: number | null;
}

/** Dia da previsão com data identificável. Temperaturas em Celsius; null vira "—" na UI. */
export interface ForecastDay {
  /** Data ISO no fuso local da cidade. Sem data, o dia é omitido. */
  date: string;
  /** Máxima diária em Celsius. Ausente: "—". */
  maxTemperatureC: number | null;
  /** Mínima diária em Celsius. Ausente: "—". */
  minTemperatureC: number | null;
  /** Código WMO do dia. Ausente: condição desconhecida. */
  weatherCode: number | null;
  /** Descrição em pt-BR. */
  description: string;
  /** Probabilidade de chuva, em porcentagem. Ausente ou null vira 0. */
  precipitationProbability: number;
}

/** Previsão diária. Zero dias válidos também é previsão parcial, não erro. */
export interface DailyForecast {
  /** Dias válidos, em ordem cronológica. */
  days: ForecastDay[];
  /** Verdadeiro quando há menos de cinco dias. */
  isPartial: boolean;
}

/** Classe de erro usada nas mensagens em pt-BR. */
export type AppErrorKind = 'network' | 'timeout' | 'service' | 'invalid-payload';

/** Erro já classificado para a interface. */
export interface AppError {
  kind: AppErrorKind;
  /** Mensagem em pt-BR, sem jargão técnico. */
  message: string;
}

/** Resultado de um painel. Permite sucesso de um bloco e erro do outro. */
export type PanelState<T> = { status: 'success'; data: T } | { status: 'error'; error: AppError };

/**
 * Consulta meteorológica validada.
 * `current` e `daily` são independentes.
 */
export interface WeatherData {
  current: PanelState<CurrentWeather>;
  daily: PanelState<DailyForecast>;
  /** Horário local do dispositivo no momento da recepção. */
  fetchedAt: Date;
}

/** Estados assíncronos explícitos de uma consulta. */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'empty' }
  | { status: 'error'; error: AppError };
