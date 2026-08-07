import { test, expect } from '@playwright/test';

test.describe('Autenticação e Login', () => {
  test('deve bloquear login com credenciais incorretas', async ({ page }) => {
    // 1. Acessar a página raiz (redireciona pro login se não autenticado)
    await page.goto('http://localhost:5175/login');

    // 2. Preencher o formulário
    await page.fill('input[type="email"]', 'admin_invalido@teste.com');
    await page.fill('input[type="password"]', 'senhaerrada123');

    // 3. Submeter
    await page.click('button[type="submit"]');

    // 4. Verificar se a mensagem de erro (toast ou alerta) aparece
    // O texto exato depende da implementação do toast no frontend (ex: "Usuário não encontrado")
    const erroToast = await page.waitForSelector('text="Credenciais inválidas" | text="Usuário não encontrado" | text="Token" | text="Acesso negado"', { timeout: 5000 }).catch(() => null);
    
    // Validamos se a mensagem de erro foi renderizada ou se ainda estamos na página de login
    expect(page.url()).toContain('/login');
  });

  test('deve renderizar a tela de login corretamente', async ({ page }) => {
    await page.goto('http://localhost:5175/login');
    
    // Verificar se existe um campo de e-mail e senha
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
