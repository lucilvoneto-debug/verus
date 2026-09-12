# Marketing → ERP: guia de ligação

Fluxo: **anúncio / Google / site → lead no CRM → conversa no WhatsApp → orçamento → contrato**.

## 1. Vercel — variáveis de ambiente

| Variável | Onde pegar |
|---|---|
| `META_APP_ID`, `META_APP_SECRET` | developers.facebook.com → app (pode ser o app `retric`, mesmo Business) → Configurações → Básico |
| `META_WEBHOOK_VERIFY_TOKEN` | qualquer string aleatória (`openssl rand -hex 16`) |
| `META_BUSINESS_ID` | business.facebook.com → Configurações → Informações da empresa (Locações Lucilvo = `522463666830103`) |
| `META_ACCESS_TOKEN` | opcional — token de usuário do sistema com `whatsapp_business_messaging`, `whatsapp_business_management`, `leads_retrieval`. Sem ele o ERP usa o token do Embedded Signup |
| `NEXT_PUBLIC_META_APP_ID` | igual a `META_APP_ID` |
| `NEXT_PUBLIC_META_ES_CONFIG_ID` | app → WhatsApp → Cadastro Incorporado → id da configuração (criar uma com "coexistência" ligada) |
| `WHATSAPP_PROVIDER` | `meta` (envios automáticos do ERP saem pela Cloud API) |
| `NEXT_PUBLIC_SITE_URL` | domínio público do ERP |
| `NEXT_PUBLIC_GA_ID` | Google tag (`AW-…` do Google Ads ou `G-…`) |
| `NEXT_PUBLIC_GADS_CONV_FORM`, `NEXT_PUBLIC_GADS_CONV_WA` | rótulos de conversão do Google Ads (`AW-xxx/yyy`) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Pixel da Meta |

## 2. App da Meta

1. **Login do Facebook para Empresas → Configurações**: adicionar o domínio do ERP em *Domínios permitidos para o SDK JavaScript*.
2. **WhatsApp → Configuração → Webhooks**: URL `https://<dominio>/api/webhooks/meta`, token = `META_WEBHOOK_VERIFY_TOKEN`. Assinar: `messages`, `smb_message_echoes`, `history`, `message_template_status_update`.
3. **Webhooks → Página**: assinar `leadgen` (formulários de Lead Ads) na mesma URL.
4. **Cadastro Incorporado**: configuração com *WhatsApp Business App onboarding* (coexistência) habilitado.

## 3. Conectar o número (coexistência)

ERP → Configurações → WhatsApp → **Conectar número**. Escolher "continuar usando o aplicativo", escanear o QR no WhatsApp Business (Configurações → Dispositivos conectados). Depois dar nome/responsável à linha. Desligar a Evolution (`WHATSAPP_PROVIDER=meta`).

## 4. Atribuição — como o ERP sabe de onde veio o lead

| Canal | Mecanismo | `origem` |
|---|---|---|
| Perfil da Empresa (Google) | botão de chat com texto "vim pelo Google" | `GOOGLE_GBP` |
| Google Ads → landing | `gclid`/`utm_*` salvos no browser → formulário ou wa.me com `(ref: google-ads/campanha)` | `GOOGLE_ADS` |
| Meta click-to-WhatsApp | `referral.ctwa_clid` + `source_id` (anúncio) no webhook | `META_ADS` |
| Meta Lead Ads (formulário) | webhook `leadgen` → `MetaLead` | `META_ADS` |
| Site / landing | formulário `/api/leads` ou wa.me `(ref: site)` | `SITE` |
| WhatsApp direto | sem marca | `WHATSAPP` |

Links para anúncios/bio: `https://<dominio>/?utm_source=meta&utm_medium=cpc&utm_campaign=laje-maceio`.

## 5. Conversão offline (fechar o ciclo)

Lead `GANHO` guarda `valorFechado` + `gclid`/`ctwaClid`. Próximo passo: subir como conversão offline no Google Ads / CAPI da Meta — assim o algoritmo otimiza para **contrato**, não para clique.
