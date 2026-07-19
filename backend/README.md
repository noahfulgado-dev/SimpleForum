# SimpleForum — Backend

Django REST Framework API for the SimpleForum discussion platform.

## Stack

| Component | Version |
|---|---|
| Python | 3.12 |
| Django | 5.2 |
| Django REST Framework | 3.15 |
| dj-rest-auth + SimpleJWT | JWT auth |
| django-allauth | Email-based auth |
| PostgreSQL / SQLite | Database |
| Gunicorn + Whitenoise | Serving |
| drf-yasg | Swagger / ReDoc |

## Quick Start

Requires **Python 3.12**. Use `pyenv` to match:

```bash
pyenv install 3.12
pyenv local 3.12
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

API at `http://localhost:8000`. Swagger at `/swagger/`.

## Apps

| App | Role |
|---|---|
| `core/` | Project settings, URLs, WSGI/ASGI |
| `accounts/` | User list, detail, current user |
| `forum/` | Topics and replies CRUD |
| `interactions/` | Like/unlike topics and replies |

## API Endpoints

### Auth (`/auth/`)
- `POST /auth/registration/` — Register
- `POST /auth/login/` — Login (sets JWT cookies)
- `POST /auth/logout/` — Logout (clears cookies)
- `POST /auth/token/refresh/` — Refresh access token
- `POST /auth/password/reset/` — Request reset
- `GET/PUT /auth/user/` — Profile

### Users (`/api/users/`)
- `GET /api/users/` — List all
- `GET /api/users/<id>/` — Detail with topics & replies
- `GET /api/users/me/` — Current user

### Topics (`/api/topics/`)
- `GET /api/topics/` — List (paginated)
- `POST /api/topics/` — Create (auth required)
- `GET /api/topics/<id>/` — Detail with replies
- `PUT /api/topics/<id>/` — Update (author/admin)
- `DELETE /api/topics/<id>/` — Delete (author/admin)

### Replies (`/api/`)
- `POST /api/topics/<topic_id>/replies/` — Create (auth required)
- `DELETE /api/replies/<id>/` — Delete (author/admin)

### Likes (`/api/`)
- `POST /api/topics/<topic_id>/like/` — Toggle like (auth required)
- `POST /api/replies/<reply_id>/like/` — Toggle like (auth required)

## Auth

Cookie-based JWT. Login sets two HttpOnly cookies:

- `core-app-auth` — access token (60 min)
- `core-refresh-token` — refresh token (7 days)

No manual token handling needed — cookies are sent automatically.

## Database

Uses `DATABASE_URL` env var for PostgreSQL. Falls back to SQLite (`db.sqlite3`) if not set.

## Requirements

Two files split by environment:

| File | Use | Install |
|---|---|---|
| `requirements.txt` | Local dev & CI | `pip install -r requirements.txt` |
| `requirements-prod.txt` | Production (Render) | `pip install -r requirements-prod.txt` |

Production adds `psycopg2-binary` (PostgreSQL driver, needs `libpq-dev`) and `gunicorn` (WSGI server). Local dev uses SQLite + `manage.py runserver`, so neither is needed.

## Tests

```bash
python manage.py test
```

## Deployment

```bash
python manage.py collectstatic --noinput
python manage.py migrate
gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 4
```
