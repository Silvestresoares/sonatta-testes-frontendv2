import { test, expect } from '@playwright/test';

test('Simulação do Usuário - Teste Geral do Sonatta', async ({ page }) => {
  test.setTimeout(60000);

  // Gera timestamp único para evitar conflitos de email
  const timestamp = Date.now();
  const emailUnico = `admin${timestamp}@sonatta.com`;

  // ----------------------------------------------------------------------
  // 0. MOCKS DE API (Simula o Backend para o teste não quebrar no GitHub)
  // ----------------------------------------------------------------------
  
  // Simula sucesso no Cadastro
  await page.route('**/api/auth/cadastro', async route => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ mensagem: 'Cadastro realizado com sucesso!' })
    });
  });

  // Simula sucesso no Login entregando um Token falso
  await page.route('**/api/auth/login', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: 'fake-jwt-token-123', mensagem: 'Login efetuado' })
    });
  });

  // Simula outras rotas do backend (Alunos, Dashboard) para a tela não travar no loading
  await page.route('**/api/**', async route => {
    if (!route.request().url().includes('/auth/')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    } else {
      await route.fallback();
    }
  });


  // ----------------------------------------------------------------------
  // 1. Abre a página inicial (Ajustado para IP Exato)
  // ----------------------------------------------------------------------
  await page.goto('http://localhost:5175');
  await page.waitForLoadState('networkidle');

  // Configura interceptação de alertas (como "Usuário criado com sucesso!")
  page.on('dialog', async dialog => {
    console.log(`🤖 Alerta do Sistema: ${dialog.message()}`);
    await dialog.accept();
  });


  // ----------------------------------------------------------------------
  // 2. PASSO FORÇADO DE GARANTIA DE USUÁRIO
  // ----------------------------------------------------------------------
  const abaNovEscola = page.getByRole('button', { name: /Nova Escola/i });
  
  if (await abaNovEscola.isVisible()) {
    await abaNovEscola.click();
    await page.waitForLoadState('domcontentloaded');
    
    // Preenche o cadastro do administrador
    await page.locator('input[placeholder="Ex: Conservatório Sonatta"]').fill('Escola Teste Sonatta');
    await page.locator('input[placeholder="adm@escola.com"]').fill(emailUnico);
    
    const inputsSenha = page.locator('input[type="password"]');
    await inputsSenha.first().fill('suasenha');
    await inputsSenha.nth(1).fill('suasenha');
    
    // CORREÇÃO: Disparo e monitoramento simultâneos
    const [respostaCadastro] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/auth/cadastro') && (resp.status() === 201 || resp.status() === 400)),
      page.getByRole('button', { name: /Criar Escola/i }).click()
    ]);
    
    // Aguarda o redirecionamento visual de volta para a tela de login
    await page.waitForTimeout(2000);
    
    // Volta para a aba de login
    await page.getByRole('button', { name: /Acessar Conta/i }).click();
  }


  // ----------------------------------------------------------------------
  // 3. FLUXO DE LOGIN COMPROVADO
  // ----------------------------------------------------------------------
  await page.locator('input[type="email"]').fill(emailUnico); 
  await page.locator('input[type="password"]').fill('suasenha');
  
  // CORREÇÃO: Disparo e monitoramento simultâneos
  const [respostaLogin] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/auth/login') && resp.status() === 200),
    page.getByRole('button', { name: 'Entrar no Sistema' }).click()
  ]);

  // ----------------------------------------------------------------------
  // 4. NAVEGAÇÃO E ENTRADA NO DASHBOARD
  // ----------------------------------------------------------------------
  await page.waitForLoadState('networkidle');
  
  // Aguarda a validação do token e carregamento da interface
  await page.waitForTimeout(2000);
  
  // Tenta encontrar o painel principal
  const painel = page.locator('text=/Gestão|Dashboard|Alunos|Financeiro/i').first();
  await painel.waitFor({ state: 'visible', timeout: 15000 });


  // ----------------------------------------------------------------------
  // 5. TESTE DE CADASTRO DE ALUNOS
  // ----------------------------------------------------------------------
  const abAlunos = page.getByRole('link', { name: /Alunos/i });
  if (await abAlunos.isVisible()) {
    await abAlunos.click();
    await page.waitForLoadState('networkidle');
  }

  const botaoNovoAluno = page.getByRole('button', { name: /\+ Novo/i });
  await botaoNovoAluno.waitFor({ state: 'visible', timeout: 15000 });
  await expect(botaoNovoAluno).toBeVisible();
  await botaoNovoAluno.click();

  // Preenche dados do novo aluno
  await page.locator('input[type="text"]').nth(0).fill('Aluno Teste Automatizado');
  
  const timeInputs = page.locator('input[type="time"]');
  if (await timeInputs.first().isVisible()) {
    await timeInputs.first().fill('15:30');
  }

  const numberInputs = page.locator('input[type="number"]');
  if (await numberInputs.first().isVisible()) {
    await numberInputs.first().fill('250');
  }
  
  await page.getByRole('button', { name: /Salvar|Finalizar|Matrícula/i }).waitFor({ state: 'visible', timeout: 10000 });
  await page.getByRole('button', { name: /Salvar|Finalizar|Matrícula/i }).click();
  await page.waitForTimeout(2000);


  // ----------------------------------------------------------------------
  // 6. TESTE DE VISUALIZAÇÃO NA AGENDA
  // ----------------------------------------------------------------------
  const botaoCancelar = page.getByRole('button', { name: /Cancelar/i });
  if (await botaoCancelar.isVisible()) {
    await botaoCancelar.click();
    await page.waitForTimeout(500);
  }

  const abAgenda = page.getByRole('button', { name: /Agenda/i });
  if (await abAgenda.isVisible()) {
    await abAgenda.click();
    await page.waitForLoadState('networkidle');
  }
  
  await page.waitForTimeout(1000);


  // ----------------------------------------------------------------------
  // 7. VALIDAÇÃO FINAL
  // ----------------------------------------------------------------------
  await expect(page.getByRole('button', { name: /Agenda|Dashboard|Alunos/i }).first()).toBeVisible();
});