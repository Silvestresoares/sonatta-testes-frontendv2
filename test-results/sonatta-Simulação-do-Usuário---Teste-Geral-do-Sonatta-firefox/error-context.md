# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sonatta.spec.js >> Simulação do Usuário - Teste Geral do Sonatta
- Location: tests\sonatta.spec.js:3:1

# Error details

```
TimeoutError: locator.waitFor: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('text=/Gestão|Dashboard|Alunos|Financeiro/i').first() to be visible

```

# Test source

```ts
  8   |   const emailUnico = `admin${timestamp}@sonatta.com`;
  9   | 
  10  |   // ----------------------------------------------------------------------
  11  |   // 0. MOCKS DE API (Simula o Backend para o teste não quebrar no GitHub)
  12  |   // ----------------------------------------------------------------------
  13  |   
  14  |   // Simula sucesso no Cadastro
  15  |   await page.route('**/api/auth/cadastro', async route => {
  16  |     await route.fulfill({
  17  |       status: 201,
  18  |       contentType: 'application/json',
  19  |       body: JSON.stringify({ mensagem: 'Cadastro realizado com sucesso!' })
  20  |     });
  21  |   });
  22  | 
  23  |   // Simula sucesso no Login entregando um Token falso
  24  |   await page.route('**/api/auth/login', async route => {
  25  |     await route.fulfill({
  26  |       status: 200,
  27  |       contentType: 'application/json',
  28  |       body: JSON.stringify({ token: 'fake-jwt-token-123', mensagem: 'Login efetuado' })
  29  |     });
  30  |   });
  31  | 
  32  |   // Simula outras rotas do backend (Alunos, Dashboard) para a tela não travar no loading
  33  |   await page.route('**/api/**', async route => {
  34  |     if (!route.request().url().includes('/auth/')) {
  35  |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  36  |     } else {
  37  |       await route.fallback();
  38  |     }
  39  |   });
  40  | 
  41  | 
  42  |   // ----------------------------------------------------------------------
  43  |   // 1. Abre a página inicial (Ajustado para IP Exato)
  44  |   // ----------------------------------------------------------------------
  45  |   await page.goto('http://127.0.0.1:5173');
  46  |   await page.waitForLoadState('networkidle');
  47  | 
  48  |   // Configura interceptação de alertas (como "Usuário criado com sucesso!")
  49  |   page.on('dialog', async dialog => {
  50  |     console.log(`🤖 Alerta do Sistema: ${dialog.message()}`);
  51  |     await dialog.accept();
  52  |   });
  53  | 
  54  | 
  55  |   // ----------------------------------------------------------------------
  56  |   // 2. PASSO FORÇADO DE GARANTIA DE USUÁRIO
  57  |   // ----------------------------------------------------------------------
  58  |   const abaNovEscola = page.getByRole('button', { name: /Nova Escola/i });
  59  |   
  60  |   if (await abaNovEscola.isVisible()) {
  61  |     await abaNovEscola.click();
  62  |     await page.waitForLoadState('domcontentloaded');
  63  |     
  64  |     // Preenche o cadastro do administrador
  65  |     await page.locator('input[placeholder="Ex: Conservatório Sonatta"]').fill('Escola Teste Sonatta');
  66  |     await page.locator('input[placeholder="adm@escola.com"]').fill(emailUnico);
  67  |     
  68  |     const inputsSenha = page.locator('input[type="password"]');
  69  |     await inputsSenha.first().fill('suasenha');
  70  |     await inputsSenha.nth(1).fill('suasenha');
  71  |     
  72  |     // CORREÇÃO: Disparo e monitoramento simultâneos
  73  |     const [respostaCadastro] = await Promise.all([
  74  |       page.waitForResponse(resp => resp.url().includes('/api/auth/cadastro') && (resp.status() === 201 || resp.status() === 400)),
  75  |       page.getByRole('button', { name: /Criar Escola/i }).click()
  76  |     ]);
  77  |     
  78  |     // Aguarda o redirecionamento visual de volta para a tela de login
  79  |     await page.waitForTimeout(2000);
  80  |     
  81  |     // Volta para a aba de login
  82  |     await page.getByRole('button', { name: /Acessar Conta/i }).click();
  83  |   }
  84  | 
  85  | 
  86  |   // ----------------------------------------------------------------------
  87  |   // 3. FLUXO DE LOGIN COMPROVADO
  88  |   // ----------------------------------------------------------------------
  89  |   await page.locator('input[type="email"]').fill(emailUnico); 
  90  |   await page.locator('input[type="password"]').fill('suasenha');
  91  |   
  92  |   // CORREÇÃO: Disparo e monitoramento simultâneos
  93  |   const [respostaLogin] = await Promise.all([
  94  |     page.waitForResponse(resp => resp.url().includes('/api/auth/login') && resp.status() === 200),
  95  |     page.getByRole('button', { name: 'Entrar no Sistema' }).click()
  96  |   ]);
  97  | 
  98  |   // ----------------------------------------------------------------------
  99  |   // 4. NAVEGAÇÃO E ENTRADA NO DASHBOARD
  100 |   // ----------------------------------------------------------------------
  101 |   await page.waitForLoadState('networkidle');
  102 |   
  103 |   // Aguarda a validação do token e carregamento da interface
  104 |   await page.waitForTimeout(2000);
  105 |   
  106 |   // Tenta encontrar o painel principal
  107 |   const painel = page.locator('text=/Gestão|Dashboard|Alunos|Financeiro/i').first();
> 108 |   await painel.waitFor({ state: 'visible', timeout: 15000 });
      |                ^ TimeoutError: locator.waitFor: Timeout 15000ms exceeded.
  109 | 
  110 | 
  111 |   // ----------------------------------------------------------------------
  112 |   // 5. TESTE DE CADASTRO DE ALUNOS
  113 |   // ----------------------------------------------------------------------
  114 |   const abAlunos = page.getByRole('button', { name: /Alunos/i });
  115 |   if (await abAlunos.isVisible()) {
  116 |     await abAlunos.click();
  117 |     await page.waitForLoadState('networkidle');
  118 |   }
  119 | 
  120 |   const botaoNovoAluno = page.getByRole('button', { name: /\+ Novo/i });
  121 |   await botaoNovoAluno.waitFor({ state: 'visible', timeout: 15000 });
  122 |   await expect(botaoNovoAluno).toBeVisible();
  123 |   await botaoNovoAluno.click();
  124 | 
  125 |   // Preenche dados do novo aluno
  126 |   await page.locator('input[type="text"]').nth(0).fill('Aluno Teste Automatizado');
  127 |   
  128 |   const timeInputs = page.locator('input[type="time"]');
  129 |   if (await timeInputs.first().isVisible()) {
  130 |     await timeInputs.first().fill('15:30');
  131 |   }
  132 | 
  133 |   const numberInputs = page.locator('input[type="number"]');
  134 |   if (await numberInputs.first().isVisible()) {
  135 |     await numberInputs.first().fill('250');
  136 |   }
  137 |   
  138 |   await page.getByRole('button', { name: /Salvar|Finalizar|Matrícula/i }).waitFor({ state: 'visible', timeout: 10000 });
  139 |   await page.getByRole('button', { name: /Salvar|Finalizar|Matrícula/i }).click();
  140 |   await page.waitForTimeout(2000);
  141 | 
  142 | 
  143 |   // ----------------------------------------------------------------------
  144 |   // 6. TESTE DE VISUALIZAÇÃO NA AGENDA
  145 |   // ----------------------------------------------------------------------
  146 |   const botaoCancelar = page.getByRole('button', { name: /Cancelar/i });
  147 |   if (await botaoCancelar.isVisible()) {
  148 |     await botaoCancelar.click();
  149 |     await page.waitForTimeout(500);
  150 |   }
  151 | 
  152 |   const abAgenda = page.getByRole('button', { name: /Agenda/i });
  153 |   if (await abAgenda.isVisible()) {
  154 |     await abAgenda.click();
  155 |     await page.waitForLoadState('networkidle');
  156 |   }
  157 |   
  158 |   await page.waitForTimeout(1000);
  159 | 
  160 | 
  161 |   // ----------------------------------------------------------------------
  162 |   // 7. VALIDAÇÃO FINAL
  163 |   // ----------------------------------------------------------------------
  164 |   await expect(page.getByRole('button', { name: /Agenda|Dashboard|Alunos/i }).first()).toBeVisible();
  165 | });
```