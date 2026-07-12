# Office Management

> A fast, self-hosted productivity app to track your **bookmarks** and **todos** in a single, portable database — so nothing gets lost and you stay productive.

[![Docker Pulls](https://img.shields.io/docker/pulls/anelsonwilsoncloud/office-management)](https://hub.docker.com/r/anelsonwilsoncloud/office-management)
[![Docker Image Size](https://img.shields.io/docker/image-size/anelsonwilsoncloud/office-management/latest)](https://hub.docker.com/r/anelsonwilsoncloud/office-management)
[![Build & Publish](https://github.com/anelsonwilsoncloud/office-management/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/anelsonwilsoncloud/office-management/actions/workflows/docker-publish.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Run the whole application — Angular UI, Spring Boot API, and database — with **one Docker command**. No build tools, no database server, no configuration.

```bash
docker run -d --name office-management -p 9090:8080 \
  -v ${PWD}/office-data:/data \
  anelsonwilsoncloud/office-management:latest
```

Then open <http://localhost:9090>.

---

## Table of contents

- [Quick start](#quick-start)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Why SQLite?](#why-sqlite-the-database-decision)
- [Running with Docker](#running-with-docker-recommended)
- [Data, backups & upgrades](#data-backups--upgrades)
- [Local development](#local-development-without-docker)
- [API reference](#api-reference)
- [Project layout](#project-layout)
- [License](#license)

---

## Quick start

The image is published publicly on **[Docker Hub](https://hub.docker.com/r/anelsonwilsoncloud/office-management)**. Anyone with Docker installed can run it — no source code required.

```bash
# 1. Pull the latest image
docker pull anelsonwilsoncloud/office-management:latest

# 2. Run it (your database is stored in ./office-data on your machine)
docker run -d --name office-management -p 9090:8080 \
  -v ${PWD}/office-data:/data \
  anelsonwilsoncloud/office-management:latest

# 3. Open the app
#    http://localhost:9090
```

**Windows PowerShell:**
```powershell
docker run -d --name office-management -p 9090:8080 `
  -v C:\path\to\your\office-data:/data `
  anelsonwilsoncloud/office-management:latest
```

---

## Features

### 📑 Bookmarks
- Add bookmarks with Name, URL, Folder (optional), and Additional Info.
- **Import from Chrome** — bulk-load your browser bookmarks from a Chrome HTML export (Bookmark Manager → Export). Duplicate URLs are skipped automatically, with full folder hierarchy support (unlimited nesting).
- **Export to Chrome** — export active bookmarks to browser-compatible HTML with nested folders. Works with Chrome, Edge, Firefox, Safari, and more.
- **Multi-word search** across name, URL, and additional info (e.g. searching `ai world` finds a bookmark named `AI Aggregator` at `www.ai-world.google.com`).
- Clickable URLs and a **copy-to-clipboard** button per row.
- Full **Edit** and **Delete** (soft-delete → moves to Archived).
- **Active / Archived toggle** — view, restore, or permanently delete archived bookmarks.
- **Bulk operations** — archive all active bookmarks, or permanently delete all archived ones, with confirmation dialogs.

### ✅ Todos
- Add todos with Name, Date (defaults to today), Priority (Low / Medium / High), Description, and Accomplished status.
- **Multi-word search** across name and description, **filter by status** (All / Pending / Accomplished), and a sortable Priority column.
- **Past Pending** grid — overdue, unaccomplished todos (due date < today).
- **Upcoming Pending** grid — unaccomplished todos due in the next 5 days.
- Toggle "Accomplished" inline; full Edit and Delete (soft-delete → Archived).
- **Active / Archived toggle** — view, restore, or permanently delete archived todos.

> 🛟 Deleted records are **soft-deleted** (archived) by default, so your history is never lost. Permanent removal is an explicit action available only inside the Archived view.

---

## Tech stack

| Layer     | Technology                                  |
|-----------|---------------------------------------------|
| Frontend  | Angular 18 (standalone components)          |
| Backend   | Spring Boot 3 + Hibernate / JPA (REST API)  |
| Database  | **SQLite** — a single portable file         |
| Packaging | Docker (multi-stage) + Docker Compose       |
| CI/CD     | GitHub Actions → Docker Hub                  |

The Angular UI is built and served as static resources by Spring Boot, so the entire app runs as a **single container** on port `8080` (mapped to `9090` on your host).

---

## Why SQLite? (the database decision)

The goal was a database that is **a file**, **easy to transfer between PCs**, and that **survives Docker volume cleanup**. SQLite is the ideal fit:

- 🗂️ **One portable file** (`office.db`). Move machines by copying a single file.
- 🛡️ **Survives `docker volume prune` and container/image removal** — because the file is stored on a **host bind mount** (`./office-data` on your machine), *not* a Docker named volume. Docker cleanup never touches your host folder.
- ⚡ **No DB server, no passwords, smaller image** — simpler for everyone.

> In-memory databases were rejected because they lose data on restart. Hibernate talks to SQLite via the community dialect (`org.hibernate.community.dialect.SQLiteDialect`) and the `xerial` JDBC driver.

---

## Running with Docker (recommended)

### Option A — Pull from Docker Hub (fastest)

See [Quick start](#quick-start) above. Your database is created at **`./office-data/office.db`** on your host machine.

**Docker Desktop UI:** configure the volume mapping in two **separate** fields:
- **Host path:** `C:\path\to\your\office-data` (the full path to where you want your database)
- **Container path:** `/data`

> ⚠️ **Common mistake:** Do NOT enter `/office-data:/data` in the Host path field — that syntax is CLI-only. The Host path must be the **full path on your machine**, e.g. `C:\Users\yourname\office-data`.

### Option B — Build from source with Docker Compose

Clone the repo and run:

```bash
docker compose up --build
```

Then open <http://localhost:9090>. Your database lives at `./office-data/office.db`.

---

## Data, backups & upgrades

### Moving to a new PC
Copy the **`office-data`** folder (it contains `office.db`) to the new machine and start the container there. All your bookmarks and todos come with you.

### Backup
Copy `office-data/office.db` anywhere (USB, cloud). That single file is your entire database.

### Upgrading to a new version
Your existing database is **automatically preserved** across upgrades:

```bash
# Pull the new image
docker pull anelsonwilsoncloud/office-management:latest

# Stop and remove the old container
docker stop office-management && docker rm office-management

# Start with the SAME office-data path — your data is intact
docker run -d --name office-management -p 9090:8080 \
  -v ${PWD}/office-data:/data \
  anelsonwilsoncloud/office-management:latest
```

**Why your data is safe:**
- The database file lives **on your machine** in `office-data/`, not inside the Docker image.
- Hibernate uses `ddl-auto=update`, which only **adds** missing columns — it never drops or overwrites data.
- `SqliteSchemaMigrator` safely migrates older databases by adding new columns with safe defaults.

---

## Local development (without Docker)

**Backend** (serves the API on `:8080`, DB at `backend/data/office.db`):
```bash
cd backend
mvn spring-boot:run
```

**Frontend** (dev server on `:4200`, proxies `/api` to `:8080`):
```bash
cd frontend
npm install
npm start
```
Open <http://localhost:4200>.

---

## API reference

Base URL: `http://localhost:9090/api`

### Bookmarks

| Method | Endpoint                             | Description                                              |
|--------|--------------------------------------|---------------------------------------------------------|
| GET    | `/api/bookmarks?search=`             | Multi-word search across name, URL, and additional info |
| GET    | `/api/bookmarks/archived`            | List archived bookmarks                                 |
| POST   | `/api/bookmarks`                     | Create bookmark                                         |
| POST   | `/api/bookmarks/import`              | Import bookmarks from a Chrome HTML export file         |
| GET    | `/api/bookmarks/export`              | Export active bookmarks to Chrome HTML with folders     |
| PUT    | `/api/bookmarks/{id}`                | Update bookmark                                         |
| DELETE | `/api/bookmarks/{id}`                | Soft-delete (archive) a bookmark                        |
| PUT    | `/api/bookmarks/{id}/restore`        | Restore an archived bookmark to active                  |
| DELETE | `/api/bookmarks/{id}/permanent`      | Permanently delete a bookmark from the database         |
| PUT    | `/api/bookmarks/archive-all`         | Archive all active bookmarks (bulk soft-delete)         |
| DELETE | `/api/bookmarks/delete-all-archived` | Permanently delete all archived bookmarks               |

### Todos

| Method | Endpoint                            | Description                                     |
|--------|-------------------------------------|-------------------------------------------------|
| GET    | `/api/todos?search=&accomplished=`  | List / multi-word search / filter active todos  |
| GET    | `/api/todos/archived`               | List archived todos                             |
| GET    | `/api/todos/past-pending`           | Overdue unaccomplished todos                    |
| GET    | `/api/todos/future-pending`         | Unaccomplished todos due in the next 5 days     |
| POST   | `/api/todos`                        | Create todo                                     |
| PUT    | `/api/todos/{id}`                   | Update todo                                     |
| DELETE | `/api/todos/{id}`                   | Soft-delete (archive) a todo                    |
| PUT    | `/api/todos/{id}/restore`           | Restore an archived todo to active              |
| DELETE | `/api/todos/{id}/permanent`         | Permanently delete a todo from the database     |

---

## Project layout

```
office-management/
├── .github/workflows/
│   └── docker-publish.yml   Builds & pushes the image to Docker Hub on every push to main
├── backend/                 Spring Boot + Hibernate REST API
│   └── src/main/java/com/office/officemanagement/
│       ├── config/          CORS config, SQLite schema migrator
│       ├── bookmark/        Bookmark entity, repo, controller
│       └── todo/            Todo entity, repo, controller
├── frontend/                Angular app (Bookmarks & Todos tabs)
├── Dockerfile               Multi-stage build (Angular + Spring Boot)
├── docker-compose.yml       Runs the app with a host bind-mounted DB folder
└── office-data/             Your SQLite database lives here (git-ignored)
```

---

## License

Released under the [MIT License](LICENSE). You are free to use, modify, and distribute this project.
