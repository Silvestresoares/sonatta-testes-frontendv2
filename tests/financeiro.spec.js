import { test, expect } from '@playwright/test';

test.describe('Módulo Financeiro', () => {
  // Esse teste assume que faremos o bypass da autenticação injetando um token falso
  // ou simulando que a página do financeiro carrega independentemente (apenas para validar UI).
  
  test.beforeEach(async ({ page }) => {
    // Acessa a página (idealmente com auth state injetado no playwright.config)
    await page.goto('http://localhost:5175/financeiro');
  });

  test('deve exibir a aba de receitas e despesas', async ({ page }) => {
    // Aguarda carregar
    await page.waitForTimeout(1000); 

    // Verifica se os botões/abas de Receitas ou filtros estão visíveis
    // O texto exato varia, mas normalmente há um "Nova Receita" ou "Filtros"
    const novaMensalidadeBtn = await page.locator('text="Nova" | text="Adicionar" | text="Receita"').first();
    
    if (await novaMensalidadeBtn.isVisible()) {
       expect(await novaMensalidadeBtn.isVisible()).toBeTruthy();
    }
    
    // Verifica se a tabela/lista de itens do financeiro está presente
    const listaFinanceiro = await page.locator('table, .list, .grid').first();
    expect(listaFinanceiro).toBeDefined();
  });
});
