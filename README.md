# SimpleForum

A fullstack discussion forum — create topics, reply nested threads, like, bookmark, share, and follow users. Built with Django REST Framework and React.

## Features

- **Topic CRUD** — Create, read, update, and delete forum topics
- **Nested replies** — Threaded replies with parent-child relationship up to any depth
- **Likes** — Like and unlike topics and replies (no self-liking)
- **Bookmarks** — Bookmark and unbookmark topics and replies
- **Shares** — Share and unshare topics and replies
- **Follow system** — Follow/unfollow users with follower and following counts
- **JWT authentication** — Secure HttpOnly cookie-based auth with email login
- **Google OAuth** — Sign in with Google via allauth
- **Rate limiting** — Anonymous (5/min), authenticated (200/day), with stricter limits on login (3/min) and registration (2/min)
- **Notifications** — Real-time alerts for replies and likes with rate-limited batching
- **API documentation** — Auto-generated Swagger UI and ReDoc
- **RESTful API** — Clean, well-structured endpoints

## Tech Stack

| Backend | Frontend |
|---|---|
| Django 5.2 | React 18 |
| Django REST Framework 3.15 | TypeScript |
| dj-rest-auth + SimpleJWT | Vite 6 |
| django-allauth (Google OAuth) | Tailwind CSS v4 |
| PostgreSQL / SQLite | ShadCN UI + Radix |
| Redis (Upstash) | Lucide Icons |
| Gunicorn + Whitenoise | — |
| GitHub Actions (CI/CD) | — |

## Architecture

```mermaid
graph TB
    subgraph Frontend
        React[React + Vite + TypeScript]
    end

    subgraph Backend
        DRF[Django REST Framework]
        subgraph Apps
            Accounts[accounts]
            Forum[forum]
            Interactions[interactions]
            Notifications[notifications]
        end
        Auth[JWT httpOnly Cookies<br/>Google OAuth]
    end

    subgraph Services
        DB[(PostgreSQL - Neon)]
        Redis[(Redis - Upstash)]
        Secrets[Doppler Env Vars]
    end

    subgraph Deploy
        Render[Render]
        CI[GitHub Actions CI/CD]
    end

    React -->|REST API| DRF
    DRF --> Apps
    DRF --> Auth
    DRF --> DB
    DRF -->|Rate Limit & Cache| Redis
    Secrets --> Render
    CI -->|auto-deploy| Render
    Render --> DRF
    Render --> React
```

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

### 2. Environment Variables

Secrets and configuration are managed via [Doppler](https://doppler.com). Environment variables are injected at runtime — no `.env` files are needed.

To set up Doppler locally:

```bash
# Install Doppler CLI (macOS)
brew install dopplerhq/cli/doppler

# Login and link your project
doppler login
doppler setup
```

Then prefix any command with `doppler run`:

```bash
doppler run python manage.py runserver
```

> See the [Doppler docs](https://docs.doppler.com/docs) for other platforms.

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

> See [`backend/README.md`](backend/README.md) for detailed API docs and app structure.

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
| `DATABASE_URL` | No | PostgreSQL connection string (overrides `DB_ENGINE`/`DB_NAME`) | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `DB_ENGINE` | No | Database engine class (fallback when no `DATABASE_URL`) | `django.db.backends.sqlite3` |
| `DB_NAME` | No | Database name or file path (fallback when no `DATABASE_URL`) | `db.sqlite3` |
| `EMAIL_BACKEND` | Yes | Email backend — use `console` for dev | `django.core.mail.backends.console.EmailBackend` |
| `EMAIL_HOST` | No | SMTP server host | `smtp.gmail.com` |
| `EMAIL_PORT` | No | SMTP server port | `587` |
| `EMAIL_USE_TLS` | No | Enable TLS for email | `True` |
| `EMAIL_HOST_USER` | No* | SMTP email address | `your-email@gmail.com` |
| `EMAIL_HOST_PASSWORD` | No* | SMTP password or app password | (Gmail app password) |
| `DEFAULT_FROM_EMAIL` | No | Default sender address | `your-email@gmail.com` |
| `CORS_ALLOWED_ORIGINS` | Yes | Comma-separated allowed origins | `http://localhost:5173` |
| `FRONTEND_URL` | No | Frontend URL (for password reset emails & OAuth redirect) | `http://localhost:5173` |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | No* | Google OAuth client secret | (from Google Cloud Console) |
| `REDIS_URL` | No | Redis connection string (enables caching and global rate limiting) | `rediss://default:token@host:6379` |

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
| GET | `/api/users/<id>/` | — | Get user with their topics, replies, shares, and follow counts |
| GET | `/api/users/me/` | Yes | Get your own profile |
| POST | `/api/users/<id>/follow/` | Yes | Toggle follow/unfollow a user |

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

### Bookmarks

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/topics/<topic_id>/bookmark/` | Yes | Toggle bookmark on a topic |
| POST | `/api/replies/<reply_id>/bookmark/` | Yes | Toggle bookmark on a reply |
| GET | `/api/bookmarks/` | Yes | List your bookmarked items |

### Shares

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/topics/<topic_id>/shares/` | Yes | Toggle share on a topic |
| POST | `/api/replies/<reply_id>/shares/` | Yes | Toggle share on a reply |
| GET | `/api/shares/` | Yes | List your shared items |

### Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications/` | Yes | List your notifications (paginated, newest first) |
| PATCH | `/api/notifications/<id>/read/` | Yes | Mark a notification as read |
| PATCH | `/api/notifications/read-all/` | Yes | Mark all notifications as read |
| GET | `/api/notifications/unread-count/` | Yes | Get unread count for badge |

Notifications are created when someone replies to your topic or likes your content. Multiple events on the same target within 30 minutes merge into a single notification with an incremented count (e.g. *"X, Y and 3 others liked your post"*).

### Google OAuth

| Endpoint | Description |
|---|---|
| `GET /accounts/google/login/?process=login` | Sign in with Google |
| `POST /auth/google/` | Exchange Google access token for JWT |

Topic and reply responses include `user_has_liked`, `user_has_bookmarked`, `user_has_shared`, `shared_count`, and nested `children` replies. User detail responses include `follower_count`, `following_count`, and `is_following`.

### Health

| Endpoint | Description |
|---|---|
| `GET /health/` | Health check (for uptime monitoring) |

### Rate Limiting

| Scope | Rate | Applies To |
|-------|------|------------|
| `anon` | 5/minute | All unauthenticated requests |
| `user` | 200/day | All authenticated requests |
| `login` | 3/minute | `POST /auth/login/` |
| `register` | 2/minute | `POST /auth/registration/` |

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
├── .github/workflows/
│   ├── ci.yml                 # Backend tests on push/PR
│   └── cd.yml                 # Auto-deploy to Render on push to main
├── backend/
│   ├── core/                  # Django project config (settings, urls, health)
│   ├── accounts/              # User management, follow system
│   ├── forum/                 # Topics & nested replies
│   ├── interactions/          # Likes, bookmarks & shares
│   ├── notifications/         # Notification system with rate-limiting
│   ├── manage.py
│   └── requirements.txt
├── frontend/                  # React + Vite SPA (WIP)
├── .gitignore
└── README.md
```

## Testing

```bash
cd backend
source .venv/bin/activate
python manage.py test
```

The test suite covers models, serializers, views, and authentication flows. Tests run automatically via GitHub Actions CI on every push and pull request to `main`.

## Deployment

### Render (auto-deploy via GitHub Actions)

1. Push to `main` — CI runs tests, CD deploys to Render
2. Environment variables are managed via [Doppler](https://doppler.com). For Render, either:
   - **Doppler Sync** (recommended) — link your Doppler project in Integrations → Render, secrets sync automatically
   - **Service Token** — set `DOPPLER_TOKEN` in Render dashboard and prefix commands with `doppler run`
3. **Build Command:** `pip install -r backend/requirements.txt`
3. **Build Command:** `pip install -r backend/requirements.txt`
4. **Start Command:**
   ```bash
   python backend/manage.py collectstatic --noinput && python backend/manage.py migrate && gunicorn core.wsgi:application --bind 0.0.0.0:$PORT --workers 4
   ```
5. Static files are served automatically via Whitenoise
6. **Post-deploy:** In Django admin (`/admin/`):
   - Go to **Sites** → ensure your domain is set (e.g., `simpleforum.onrender.com`)
   - Go to **Social Applications** → add a Google app with your Client ID, Secret, and link it to the site

### Manual

```bash
cd backend
python manage.py collectstatic --noinput
python manage.py migrate
gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch and open a Pull Request

## License

[MIT](LICENSE)
