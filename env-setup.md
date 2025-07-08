# Environment Variables Setup

Создайте файл `.env` в корне проекта со следующими переменными:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Database Configuration (example)
# DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# JWT Configuration (example)
# JWT_SECRET=your-super-secret-jwt-key
# JWT_EXPIRE=7d

# Other configurations
API_VERSION=v1
```

## Описание переменных

- `PORT` - Порт для запуска сервера
- `NODE_ENV` - Окружение (development, production, test)
- `ALLOWED_ORIGINS` - Разрешенные домены для CORS (разделенные запятой)
- `DATABASE_URL` - Строка подключения к базе данных
- `JWT_SECRET` - Секретный ключ для JWT токенов
- `JWT_EXPIRE` - Время жизни JWT токенов
- `API_VERSION` - Версия API

## Быстрая настройка

Выполните следующие команды:

```bash
# Создайте .env файл
touch .env

# Скопируйте содержимое выше в .env файл
echo "PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
API_VERSION=v1" > .env
```

**Важно**: Никогда не коммитьте .env файл в Git! Файл уже добавлен в .gitignore. 