import { expect, type Page, test } from '@playwright/test';

const geocoding = {
  results: [
    {
      name: 'Salvador',
      country: 'Brasil',
      latitude: -12.97,
      longitude: -38.51,
      admin1: 'Bahia',
    },
  ],
};

const forecast = {
  current: {
    temperature_2m: 20,
    weather_code: 0,
    relative_humidity_2m: 50,
    wind_speed_10m: 10,
    precipitation: 0,
    pressure_msl: 1013,
  },
  daily: {
    time: ['2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'],
    temperature_2m_max: [31, 30, 29, 28, 30],
    temperature_2m_min: [24, 23, 24, 23, 24],
    weather_code: [2, 1, 3, 61, 0],
    precipitation_probability_max: [20, 10, 40, 80, 5],
  },
};

async function mockWeather(page: Page, cities: unknown) {
  await page.route('**/geocoding-api.open-meteo.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(cities),
    });
  });
  await page.route('**/api.open-meteo.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(forecast),
    });
  });
}

async function expectNoNetworkSearch(page: Page, term: string) {
  let calls = 0;
  await page.route('**/*open-meteo.com/**', async (route) => {
    calls += 1;
    await route.abort();
  });
  await page.goto('/');
  if (term.length > 0) {
    await page.getByRole('textbox', { name: 'Buscar cidade' }).fill(term);
  }
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByText('pelo menos 2 caracteres')).toBeVisible();
  expect(calls).toBe(0);
}

async function search(page: Page, city: string) {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Buscar cidade' }).fill(city);
  await page.getByRole('button', { name: 'Buscar' }).click();
}

test('busca a cidade, mostra a previsão e converte para Fahrenheit', async ({ page }) => {
  await mockWeather(page, geocoding);
  await search(page, 'Salvador');

  await expect(page.getByRole('heading', { name: 'Salvador, Bahia, Brasil' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Previsão de 5 dias' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Clima atual' })).toContainText('20 °C');

  await page.getByRole('button', { name: 'Fahrenheit' }).click();

  await expect(page.getByRole('region', { name: 'Clima atual' })).toContainText('68 °F');
  await expect(page.getByRole('region', { name: 'Previsão de 5 dias' })).toContainText('88 °F');
});

test('mostra erro recuperável quando a API falha', async ({ page }) => {
  let calls = 0;
  await page.route('**/geocoding-api.open-meteo.com/**', async (route) => {
    calls += 1;
    if (calls === 1) {
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(geocoding),
    });
  });
  await page.route('**/api.open-meteo.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(forecast),
    });
  });

  await search(page, 'Salvador');
  await expect(page.getByRole('alert')).toContainText('Não foi possível buscar cidades.');
  await expect(page.getByRole('region', { name: 'Clima atual' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('heading', { name: 'Salvador, Bahia, Brasil' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Clima atual' })).toContainText('20 °C');
});

test('não consulta a rede quando a busca está vazia', async ({ page }) => {
  await expectNoNetworkSearch(page, '');
});

test('não consulta a rede quando a busca tem só espaços', async ({ page }) => {
  await expectNoNetworkSearch(page, '   ');
});

test('envia caracteres especiais codificados e renderiza o nome sem quebrar', async ({ page }) => {
  let geocodingUrl = '';
  await page.route('**/geocoding-api.open-meteo.com/**', async (route) => {
    geocodingUrl = route.request().url();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          {
            name: "Val-d'Or",
            country: 'Canadá',
            latitude: 48.1,
            longitude: -77.78,
            admin1: 'Quebec',
          },
        ],
      }),
    });
  });
  await page.route('**/api.open-meteo.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(forecast),
    });
  });

  await search(page, "Val-d'Or");

  expect(decodeURIComponent(geocodingUrl)).toContain("name=Val-d'Or");
  await expect(page.getByRole('heading', { name: "Val-d'Or, Quebec, Canadá" })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Clima atual' })).toContainText('20 °C');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('mostra cidade não encontrada para emoji sem results', async ({ page }) => {
  let geocodingUrl = '';
  let forecastCalls = 0;
  await page.route('**/geocoding-api.open-meteo.com/**', async (route) => {
    geocodingUrl = route.request().url();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [] }),
    });
  });
  await page.route('**/api.open-meteo.com/**', async (route) => {
    forecastCalls += 1;
    await route.abort();
  });

  await search(page, '123🌧');

  expect(geocodingUrl).toContain(`name=${encodeURIComponent('123🌧')}`);
  await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
  await expect(page.getByText('Revise o texto digitado e tente outro nome.')).toBeVisible();
  expect(forecastCalls).toBe(0);
});

test('mostra cidade não encontrada quando o geocoding não traz results', async ({ page }) => {
  let forecastCalls = 0;
  await page.route('**/geocoding-api.open-meteo.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });
  await page.route('**/api.open-meteo.com/**', async (route) => {
    forecastCalls += 1;
    await route.abort();
  });
  await search(page, 'Atlântida');

  await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
  await expect(page.getByText('Revise o texto digitado e tente outro nome.')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Clima atual' })).toHaveCount(0);
  expect(forecastCalls).toBe(0);
});

test('mostra só os dias recebidos quando o forecast vem incompleto', async ({ page }) => {
  await page.route('**/geocoding-api.open-meteo.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(geocoding),
    });
  });
  await page.route('**/api.open-meteo.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...forecast,
        daily: {
          time: ['2026-10-29', '2026-10-30'],
          temperature_2m_max: [31, 30],
          temperature_2m_min: [24, 23],
          weather_code: [2, 1],
          precipitation_probability_max: [20, 10],
        },
      }),
    });
  });

  await search(page, 'Salvador');

  await expect(page.getByRole('region', { name: 'Clima atual' })).toContainText('20 °C');
  await expect(page.getByRole('status')).toContainText('apenas 2 dias');
  await expect(page.getByRole('listitem')).toHaveCount(2);
  await expect(page.getByRole('region', { name: 'Previsão de 5 dias' })).toHaveCount(0);
});

test('no viewport mobile o fluxo principal renderiza o clima', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mockWeather(page, geocoding);
  await search(page, 'Salvador');

  await expect(page.getByRole('heading', { name: 'Salvador, Bahia, Brasil' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Clima atual' })).toContainText('20 °C');
  await expect(page.getByRole('region', { name: 'Previsão de 5 dias' })).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(5);
});
