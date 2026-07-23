# SimpleForum — Backend

Django REST Framework API for the SimpleForum discussion platform.

## Stack

| Component | Version |
|---|---|
| Python | 3.12 |
| Django | 5.2 |
| Django REST Framework | 3.15 |
| dj-rest-auth + SimpleJWT | JWT auth |
| django-allauth | Email-based + Google OAuth auth |
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
| `interactions/` | Like/unlike and bookmark topics and replies |
| `notifications/` | Notifications for replies and likes with rate-limited batching |

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

### Bookmarks (`/api/`)
- `POST /api/topics/<topic_id>/bookmark/` — Toggle bookmark (auth required)
- `POST /api/replies/<reply_id>/bookmark/` — Toggle bookmark (auth required)
- `GET /api/bookmarks/` — List your bookmarked items (auth required)

Topic and reply responses include `user_has_liked` and `user_has_bookmarked`.

### Notifications (`/api/notifications/`)

- `GET /api/notifications/` — List your notifications (paginated, newest first)
- `PATCH /api/notifications/<id>/read/` — Mark single as read
- `PATCH /api/notifications/read-all/` — Mark all as read
- `GET /api/notifications/unread-count/` — Unread badge count

Notifications fire on reply and like events. A 30-minute cooldown per target merges duplicates into one entry with an incremented `count` field. Self-actions are excluded.

### Google OAuth

| Method | Endpoint | Description |
|---|---|---|
| GET | `/accounts/google/login/?process=login` | Sign in with Google (browser redirect) |
| POST | `/auth/google/` | Exchange Google access token for app JWT |

**Setup steps:**
1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com)
2. Add redirect URI: `https://yourdomain.com/accounts/google/login/callback/`
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in environment
4. In Django admin, add the site and create a Social Application for Google

### Rate Limiting

| Scope | Rate | Endpoints |
|-------|------|-----------|
| `anon` | 5/minute | All unauthenticated requests |
| `user` | 200/day | All authenticated requests |
| `login` | 3/minute | `POST /auth/login/` |
| `register` | 2/minute | `POST /auth/registration/` |

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET / HEAD | `/health/` | Lightweight health check (no DB) |

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
