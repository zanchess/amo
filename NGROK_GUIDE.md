# 🌐 Ngrok + Webhooks Guide

## Быстрый старт

### 1. Запустите сервер
```bash
npm run dev
```

### 2. Запустите ngrok (в новом терминале)
```bash
npm run ngrok
# или
ngrok http 3000
```

### 3. Скопируйте HTTPS URL
Из вывода ngrok скопируйте URL, например:
```
https://abc123.ngrok-free.app
```

## Webhook Endpoints
Ваши webhook endpoints доступны по адресам:
- **amoCRM**: `https://your-domain.ngrok.io/api/webhooks/amocrm`

### amoCRM
1. Откройте [amoCRM](https://www.amocrm.ru)
2. Настройки → Интеграции → Webhooks
3. Добавить webhook
4. URL: `https://your-domain.ngrok.io/api/webhooks/amocrm`
5. Выберите события: Сделки, Контакты, Компании