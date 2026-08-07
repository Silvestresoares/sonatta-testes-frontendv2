// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Executa os testes em paralelo */
  fullyParallel: true,
  /* Falha o build no CI se esquecer um test.only no código */
  forbidOnly: !!process.env.CI,
  /* Tenta rodar de novo se falhar (apenas no CI) */
  retries: process.env.CI ? 2 : 0,
  /* Ajusta os workers no ambiente de CI */
  workers: process.env.CI ? 1 : undefined,
  /* Formato do relatório dos testes */
  reporter: 'html',

  /* Configurações compartilhadas para os testes */
  use: {
    /* URL base ajustada para o IP padrão do Vite */
    baseURL: 'http://127.0.0.1:5173',

    /* Coleta rastreamento se o teste falhar */
    trace: 'on-first-retry',
  },

  /* Configura os navegadores para os testes */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

 /* BLOCO ÚNICO: Inicializa o Vite automaticamente de forma segura */
  webServer: {
    // Força o Vite a escutar no IP 127.0.0.1 e na porta 5173
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
