# Configuração do Supabase para Autenticação por Código OTP

Este guia explica como configurar o Supabase para usar código OTP (One-Time Password) ao invés de magic link.

## 📋 Passos de Configuração

### 1. Acessar o Painel do Supabase

1. Acesse o [Painel do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **Authentication** no menu lateral

### 2. Configurar Provider de Email

1. Em **Authentication** > **Providers**
2. Certifique-se de que **Email** está habilitado
3. Clique em **Email** para abrir as configurações
4. Configure:
   - ✅ **Enable Email Provider**: Ativado
   - ✅ **Confirm email**: Pode estar desativado (não necessário para OTP)
   - ✅ **Secure email change**: Ativado (recomendado)

### 3. Configurar Email Templates (IMPORTANTE)

1. Vá para **Authentication** > **Email Templates**
2. Selecione o template **"Magic Link"** ou **"OTP"**
3. O Supabase já tem um template padrão para OTP, mas você pode personalizar

#### Template de Email OTP Recomendado:

```html
<h2>Seu código de acesso</h2>
<p>Use o código abaixo para fazer login:</p>
<p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; background-color: #f3f4f6; border-radius: 8px; margin: 20px 0;">
  {{ .Token }}
</p>
<p>Este código expira em 1 hora.</p>
<p>Se você não solicitou este código, ignore este email.</p>
```

**Variáveis disponíveis:**
- `{{ .Token }}` - O código de 6 dígitos
- `{{ .Email }}` - Email do usuário
- `{{ .SiteURL }}` - URL do seu site

### 4. Configurar SMTP (Opcional mas Recomendado)

Para produção, configure um servidor SMTP próprio:

1. Vá para **Settings** > **Auth** > **SMTP Settings**
2. Configure seu servidor SMTP:
   - **Host**: smtp.gmail.com (ou seu provedor)
   - **Port**: 587
   - **Username**: seu-email@gmail.com
   - **Password**: sua-senha-de-app
   - **Sender email**: seu-email@gmail.com
   - **Sender name**: Nome do seu app

**Nota**: Para Gmail, você precisa criar uma "Senha de App" em vez de usar sua senha normal.

### 5. Configurar Site URL

1. Vá para **Settings** > **API**
2. Em **Site URL**, configure:
   - Desenvolvimento: `http://localhost:3000`
   - Produção: `https://seu-dominio.com`

### 6. Configurar Redirect URLs (se necessário)

1. Vá para **Authentication** > **URL Configuration**
2. Adicione suas URLs de redirecionamento:
   - `http://localhost:3000/auth/callback`
   - `https://seu-dominio.com/auth/callback`

## 🔧 Configurações Adicionais

### Habilitar Criação Automática de Usuários

O código já está configurado com `shouldCreateUser: true`, então novos usuários serão criados automaticamente quando inserirem um código válido.

### Configurar Expiração do Código

Por padrão, os códigos OTP expiram em 1 hora. Para alterar:

1. Vá para **Settings** > **Auth**
2. Procure por **"OTP Expiry"** ou **"Token Expiry"**
3. Configure o tempo desejado (em segundos)

## ✅ Verificação

### Testar o Fluxo

1. Acesse sua aplicação
2. Clique em "Continuar com Email (Código)"
3. Digite um email válido
4. Clique em "Enviar Código"
5. Verifique seu email - você deve receber um código de 6 dígitos
6. Cole o código no campo
7. Clique em "Verificar Código"
8. Você deve ser autenticado com sucesso

### Troubleshooting

**Problema**: Não recebo o email
- Verifique a pasta de spam
- Confirme que o SMTP está configurado corretamente
- Verifique os logs em **Authentication** > **Logs**

**Problema**: Código inválido
- Certifique-se de copiar o código completo (6 dígitos)
- Verifique se o código não expirou (1 hora)
- Tente solicitar um novo código

**Problema**: Email não está sendo enviado
- Verifique se o provider de Email está habilitado
- Confirme as configurações de SMTP
- Verifique se não há limites de rate limiting

## 📝 Notas Importantes

1. **Em desenvolvimento**: O Supabase usa um servidor SMTP padrão que pode ter limitações
2. **Em produção**: Configure sempre um SMTP próprio para melhor confiabilidade
3. **Segurança**: Os códigos expiram automaticamente após 1 hora
4. **Rate Limiting**: O Supabase limita tentativas para prevenir spam

## 🔗 Referências

- [Documentação Supabase Auth](https://supabase.com/docs/guides/auth)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [OTP Authentication](https://supabase.com/docs/guides/auth/auth-otp)

