# SimpleForum

A fullstack discussion forum — create topics, reply, and like. Built with Django REST Framework and React.

## Features

- **Topic CRUD** — Create, read, update, and delete forum topics
- **Nested replies** — Reply to any topic
- **Likes** — Like and unlike topics and replies (no self-liking)
- **JWT authentication** — Secure HttpOnly cookie-based auth with email login
- **Rate limiting** — Anonymous (10/min) and authenticated (1000/day) throttle rates
- **API documentation** — Auto-generated Swagger UI and ReDoc
- **RESTful API** — Clean, well-structured endpoints

## Tech Stack

| Backend | Frontend |
|---|---|
| Django 5.1 | React 18 |
| Django REST Framework 3.15 | TypeScript |
| dj-rest-auth + SimpleJWT | Vite 6 |
| django-allauth | Tailwind CSS v4 |
| PostgreSQL / SQLite | ShadCN UI + Radix |
| Gunicorn + Whitenoise | Lucide Icons |

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+ and [Bun](https://bun.sh)
- PostgreSQL (optional — SQLite works out of the box)

### 1. Clone

```bash
git clone https://github.com/your-username/simpleforum.git
cd simpleforum
```

### 2. Environment Setup

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and update the variables. At minimum, set:

```env
SECRET_KEY=generate-a-random-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

> **Generate a secret key:**
> ```bash
> python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
> ```
>
> **Never commit `.env` to version control** — it contains secrets.

### 3. Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate      # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The API is now at `http://localhost:8000`.

### 4. Frontend Setup

Open a new terminal:

```bash
cd frontend
bun install
bun run dev
```

The app is now at `http://localhost:5173`.

## Environment Variables

| Variable | Required | Description | Example |
|---|---|---|---|
| `SECRET_KEY` | Yes | Django secret key — generate a random one | `django-insecure-abc...` |
| `DEBUG` | Yes | Enable debug mode (`True`/`False`) | `True` |
| `ALLOWED_HOSTS` | Yes | Comma-separated allowed hosts | `localhost,127.0.0.1` |
| `DB_ENGINE` | Yes | Database engine class | `django.db.backends.sqlite3` |
| `DB_NAME` | Yes | Database name or file path | `db.sqlite3` |
| `EMAIL_BACKEND` | Yes | Email backend — use `console` for dev | `django.core.mail.backends.console.EmailBackend` |
| `EMAIL_HOST` | No | SMTP server host | `smtp.gmail.com` |
| `EMAIL_PORT` | No | SMTP server port | `587` |
| `EMAIL_USE_TLS` | No | Enable TLS for email | `True` |
| `EMAIL_HOST_USER` | No* | SMTP email address | `your-email@gmail.com` |
| `EMAIL_HOST_PASSWORD` | No* | SMTP password or app password | (Gmail app password) |
| `DEFAULT_FROM_EMAIL` | No | Default sender address | `your-email@gmail.com` |
| `CORS_ALLOWED_ORIGINS` | Yes | Comma-separated allowed origins | `http://localhost:5173` |
| `FRONTEND_URL` | No | Frontend URL (for password reset emails) | `http://localhost:5173` |

*\*Required when using SMTP email backend.*

## API Overview

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/registration/` | — | Register a new account |
| POST | `/auth/login/` | — | Log in (returns JWT tokens) |
| POST | `/auth/logout/` | Yes | Log out |
| POST | `/auth/password/reset/` | — | Request password reset email |
| POST | `/auth/password/reset/confirm/<uid>/<token>/` | — | Confirm password reset |
| GET/PUT | `/auth/user/` | Yes | Retrieve or update profile |
| POST | `/auth/token/verify/` | — | Verify a JWT token |
| POST | `/auth/token/refresh/` | — | Refresh an expired JWT |

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users/` | — | List all users |
| GET | `/api/users/<id>/` | — | Get user with their topics and replies |
| GET | `/api/users/me/` | Yes | Get your own profile |

### Topics

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/topics/` | — | List all topics |
| POST | `/api/topics/` | Yes | Create a topic |
| GET | `/api/topics/<id>/` | — | Get topic details |
| PUT | `/api/topics/<id>/` | Yes | Update topic (author or admin) |
| DELETE | `/api/topics/<id>/` | Yes | Delete topic (author or admin) |

### Replies

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/topics/<topic_id>/replies/` | Yes | Create a reply |
| DELETE | `/api/replies/<id>/` | Yes | Delete reply (author or admin) |

### Likes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/topics/<topic_id>/like/` | Yes | Toggle like on a topic |
| POST | `/api/replies/<reply_id>/like/` | Yes | Toggle like on a reply |

### Documentation

| Endpoint | Description |
|---|---|
| `/swagger/` | Swagger UI |
| `/redoc/` | ReDoc UI |
| `/swagger.json` | OpenAPI schema (JSON) |
| `/swagger.yaml` | OpenAPI schema (YAML) |

## Project Structure

```
simpleforum/
├── backend/
│   ├── core/
│   │   ├── migrations/        # Database migrations
│   │   ├── serializers/       # DRF serializers
│   │   ├── tests/             # Test suite
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── models.py          # Topic, Reply, Likes
│   │   ├── permissions.py     # Custom permissions
│   │   ├── settings.py        # Django configuration
│   │   ├── urls.py            # URL routing
│   │   └── views.py           # API views
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/ui/     # ShadCN-styled components
│   │   ├── lib/               # Utility functions
│   │   ├── pages/             # Landing, Login, Signup
│   │   ├── App.tsx            # App root with routing
│   │   ├── main.tsx           # Entry point
│   │   └── index.css          # Global styles (Tailwind)
│   ├── package.json
│   └── vite.config.ts
├── .env                       # Environment variables (gitignored)
├── .env.example               # Example environment file
├── .gitignore
└── README.md
```

## Testing

```bash
cd backend
source .venv/bin/activate
python manage.py test
```

The test suite covers models, serializers, views, and authentication flows.

## Deployment

1. **Set `DEBUG=False`** and generate a fresh `SECRET_KEY`
2. **Use PostgreSQL** — set `DB_ENGINE=django.db.backends.postgresql` and configure `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
3. **Update `ALLOWED_HOSTS`** — add your domain
4. **Configure email** — set a real SMTP backend for password resets
5. **Run with Gunicorn:**
   ```bash
   gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 4
   ```
6. **Static files** are served automatically via Whitenoise

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push to your branch and open a Pull Request

## License

[MIT](LICENSE)
