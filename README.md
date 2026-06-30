# Office Management

A personal productivity app to track your **bookmarks** and **todos** in a fast,
searchable database — so nothing gets lost and you stay productive.

Share the Docker image with a colleague and they can run it in one command.

## Tech stack

| Layer    | Technology                                  |
|----------|---------------------------------------------|
| Frontend | Angular 18 (standalone components)          |
| Backend  | Spring Boot 3 + Hibernate / JPA (REST API)  |
| Database | **SQLite** — a single portable file         |
| Packaging| Docker (multi-stage) + Docker Compose       |

## Why SQLite? (the database decision)

You wanted a database that is **a file**, **easy to transfer between PCs**, and that
**survives Docker volume cleanup**. SQLite is the ideal fit:

- 🗂️ **One portable file** (`office.db`). Move PCs by copying a single file.
- 🛡️ **Survives `docker volume prune` / container & image removal** — because the file
  is stored on a **host bind mount** (`./office-data` on your machine), *not* a Docker
  named volume. Docker cleanup never touches your host folder.
- ⚡ **No DB server, no passwords, smaller image** — simpler for colleagues.

> In-memory databases were rejected because they lose data on restart.
> Hibernate talks to SQLite via the community dialect
> (`org.hibernate.community.dialect.SQLiteDialect`) + the `xerial` JDBC driver.

## Features

**Tab 1 — Bookmarks**
- Add bookmarks: Name, URL, Folder (optional), Additional Info
- **Import from Chrome** — export bookmarks from Chrome (Bookmark Manager → Export),
  then click "Import from Chrome" to bulk-load all your browser bookmarks at once.
  Duplicate URLs are skipped automatically. Full folder hierarchy support (unlimited nesting).
- **Export to Chrome** — export active bookmarks to browser-compatible HTML format with
  nested folder structure. Works with Chrome, Edge, Firefox, Safari, and other browsers.
- Grid with **multi-word search** across name, URL, and additional info
  (e.g. searching `ai world` finds a bookmark named `AI Aggregator` with URL `www.ai-world.google.com`)
- Clickable URLs + **copy-to-clipboard** button per row
- Full **Edit** and **Delete** (soft-delete → moves to Archived)
- **Active / Archived toggle** — view archived bookmarks, restore them, or permanently
  delete them from the database
- **Bulk operations** — Archive all active bookmarks at once, or permanently delete all
  archived bookmarks with a single click (with confirmation dialogs)

**Tab 2 — Todos**
- Add todos: Name, Date (defaults to today), Priority (Low / Medium / High),
  Description, Accomplished
- Main grid with **multi-word search** across name and description,
  **filter by status** (All / Pending / Accomplished), sortable Priority column
- **Past Pending** grid — overdue, unaccomplished todos (due date < today)
- **Upcoming Pending** grid — unaccomplished todos due in the next 5 days
- Toggle "Accomplished" inline; full Edit and Delete (soft-delete → Archived)
- **Active / Archived toggle** — view, restore, or permanently delete archived todos

> Deleted records are **soft-deleted** (archived) by default, so your history is never
> lost. Permanent removal is an explicit action available only inside the Archived view.

## Run with Docker (recommended)

```bash
docker compose up --build
```

Then open <http://localhost:9090>.

Your database is created at **`./office-data/office.db`** on your host machine.

### Sharing with a colleague
The Docker image is published automatically to GitHub Container Registry on every push to `main`.
A colleague only needs Docker installed — no source code required:

```bash
# Pull the latest image
docker pull ghcr.io/anelsonwilsoncloud/office-management:latest

# Run it (database stored in ./office-data on their machine)
docker run -d --name office-management -p 9090:8080 \
  -v ${PWD}/office-data:/data \
  ghcr.io/anelsonwilsoncloud/office-management:latest
```

**Windows PowerShell:**
```powershell
docker run -d --name office-management -p 9090:8080 `
  -v C:\path\to\your\office-data:/data `
  ghcr.io/anelsonwilsoncloud/office-management:latest
```

**Docker Desktop UI:** When running via the UI, configure the volume mapping in two **separate** fields:
- **Host path:** `C:\path\to\your\office-data` (full Windows path to where you want your database)
- **Container path:** `/data`

> ⚠️ **Common mistake:** Do NOT enter `/office-data:/data` in the Host path field. That syntax is for CLI only.
> The Host path should be the **full path on your machine**, e.g., `C:\Users\yourname\office-data`.

Then open <http://localhost:9090>.

Alternatively, share the whole repo and let them build locally:
```bash
docker compose up --build
```

### Moving to a new PC
Just copy the **`office-data`** folder (it contains `office.db`) to the new machine
and start the container there. All your bookmarks and todos come with you.

### Upgrading to a new version
When a new version of the app is released, your existing database is **automatically preserved**:

```bash
# Pull the new image
docker pull ghcr.io/anelsonwilsoncloud/office-management:latest

# Stop and remove the old container
docker stop office-management && docker rm office-management

# Start with the SAME office-data path — your data is intact
docker run -d --name office-management -p 9090:8080 \
  -v ${PWD}/office-data:/data \
  ghcr.io/anelsonwilsoncloud/office-management:latest
```

**Why your data is safe:**
- The database file lives **on your machine** in `office-data/`, not inside the Docker image
- Hibernate uses `ddl-auto=update` which only **adds** missing columns, never drops or overwrites data
- The `SqliteSchemaMigrator` safely migrates old databases by adding new columns with safe defaults

### Backup
Copy `office-data/office.db` anywhere (USB, cloud). That single file is your whole DB.

## Local development (without Docker)

**Backend** (serves API on :8080, DB at `backend/data/office.db`):
```bash
cd backend
mvn spring-boot:run
```

**Frontend** (dev server on :4200, proxies `/api` to :8080):
```bash
cd frontend
npm install
npm start
```
Open <http://localhost:4200>.

## API reference

### Bookmarks

| Method | Endpoint                        | Description                                      |
|--------|---------------------------------|--------------------------------------------------|
| GET    | `/api/bookmarks?search=`        | Multi-word search across name, URL, and additional info |
| GET    | `/api/bookmarks/archived`       | List archived bookmarks                          |
| POST   | `/api/bookmarks`                | Create bookmark                                  |
| POST   | `/api/bookmarks/import`         | Import bookmarks from a Chrome HTML export file  |
| GET    | `/api/bookmarks/export`         | Export active bookmarks to Chrome HTML format with folder structure |
| PUT    | `/api/bookmarks/{id}`           | Update bookmark                                  |
| DELETE | `/api/bookmarks/{id}`           | Soft-delete (archive) a bookmark                 |
| PUT    | `/api/bookmarks/{id}/restore`   | Restore an archived bookmark to active           |
| DELETE | `/api/bookmarks/{id}/permanent` | Permanently delete a bookmark from the database  |
| PUT    | `/api/bookmarks/archive-all`    | Archive all active bookmarks (bulk soft-delete)  |
| DELETE | `/api/bookmarks/delete-all-archived` | Permanently delete all archived bookmarks   |

### Todos

| Method | Endpoint                        | Description                                        |
|--------|---------------------------------|----------------------------------------------------|
| GET    | `/api/todos?search=&accomplished=` | List / multi-word search / filter active todos  |
| GET    | `/api/todos/archived`           | List archived todos                                |
| GET    | `/api/todos/past-pending`       | Overdue unaccomplished todos                       |
| GET    | `/api/todos/future-pending`     | Unaccomplished todos due in the next 5 days        |
| POST   | `/api/todos`                    | Create todo                                        |
| PUT    | `/api/todos/{id}`               | Update todo                                        |
| DELETE | `/api/todos/{id}`               | Soft-delete (archive) a todo                       |
| PUT    | `/api/todos/{id}/restore`       | Restore an archived todo to active                 |
| DELETE | `/api/todos/{id}/permanent`     | Permanently delete a todo from the database        |

## Project layout

```
office-management/
├── .github/workflows/
│   └── docker-publish.yml  Builds & pushes image to GHCR on every push to main
├── backend/            Spring Boot + Hibernate REST API
│   └── src/main/java/com/office/officemanagement/
│       ├── config/     CORS config, SQLite schema migrator
│       ├── bookmark/   Bookmark entity, repo, controller
│       └── todo/       Todo entity, repo, controller
├── frontend/           Angular app (Bookmarks & Todos tabs)
├── Dockerfile          Multi-stage build (Angular + Spring Boot)
├── docker-compose.yml  Runs the app with a host bind-mounted DB folder
└── office-data/        Your SQLite database lives here (git-ignored)
```
