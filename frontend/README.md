# SimpleForum — Frontend

React SPA for the SimpleForum discussion platform. Built with Vite, TypeScript, Tailwind CSS v4, and ShadCN UI.

## Stack

| Component | |
---|---
React 18 | TypeScript |
Vite 6 | Tailwind CSS v4 |
ShadCN UI + Radix | Lucide Icons |
TanStack Query | Axios |
React Router v7 | Bun |

## Getting Started

```bash
bun install
bun run dev
```

The app is at `http://localhost:5173`.

## Build

```bash
bun run build
```

Output goes to `dist/`. Deploy the `dist/` folder to any static host.

## Vercel Deployment

The frontend is deployed on Vercel. A `vercel.json` at the project root provides a catch-all rewrite rule so that direct URL access (e.g., refreshing `/feed`) serves `index.html` instead of returning a 404:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Features

- **Topic feed** — Paginated, searchable list of topics sorted by hot score
- **Topic detail** — Topic with up to 20 inline replies (nested to 10 children), like/bookmark/share buttons
- **Profile pages** — View any user's topics, replies, shares, and follow counts
- **Edit post** — Author can edit their own topics and replies inline
- **Share modal** — Share topics with attribution chain preserved
- **Authentication** — JWT-based auth with HttpOnly cookies, login/register/logout
- **Google OAuth** — Sign in with Google
- **TanStack Query** — Client-side caching with 5-minute stale time and `placeholderData` for smooth pagination
- **PWA** — Installable progressive web app with a service worker via `vite-plugin-pwa`
- **Responsive** — Mobile-friendly layout with sidebar navigation

## Project Structure

```
frontend/
├── public/            # Static assets served as-is (favicon, manifest, icons)
├── src/
│   ├── assets/        # Bundled assets (fonts, icons)
│   ├── components/    # UI components (post, replies, modals, navbar, sidebar)
│   ├── context/       # React context providers (auth, etc.)
│   ├── hooks/         # Custom React hooks (auth, follow, etc.)
│   ├── lib/           # Utilities (timeAgo, API client)
│   ├── pages/         # Route pages (feed, topic detail, profile, auth)
│   ├── services/      # API service layer and TypeScript interfaces
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── vercel.json
├── vite.config.ts
├── tsconfig.json
└── package.json
```
