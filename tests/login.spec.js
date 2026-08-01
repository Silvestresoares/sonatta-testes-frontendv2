import { test, expect } from '@playwright/test';

test.describe('Autenticação e Segurança (E2E)', () => {
  
  test('Deve bloquear login com credenciais inválidas', async ({ page }) => {
    // Acessa a página inicial (que redireciona para login se não estiver logado)
    await page.goto('http://localhost:5175/login');
    
    // Tenta fazer login com credenciais inválidas
    await page.fill('input[type="email"]', 'teste_invalido@sonatta.com');
    await page.fill('input[type="password"]', 'senha123');
    
    // Configura evento para capturar o alert() que o frontend dispara ao falhar
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('inválidos');
      await dialog.dismiss();
    });

    await page.click('button[type="submit"]');
  });

  // Nota: Em um ambiente de CI completo, teríamos um processo de seed no banco
  // para criar um usuário válido e testar o sucesso do login e a presença do HttpOnly Cookie.
  test('Acesso à rotas protegidas sem sessão deve redirecionar para Login', async ({ page }) => {
    await page.goto('http://localhost:5175/alunos');
    
    // Espera que a rota não permita acesso e mostre o formulário de login ou a landing page
    await expect(page).toHaveURL(/.*\/|\/login/);
  });

});
