# PineQuest Backend

Express + TypeScript REST API. MongoDB Atlas холбогдоогүй үед mock mode-д ажилладаг.

## Суулгах

```bash
cd backend
npm install
cp .env.example .env   # .env дотор MONGODB_URI тавина
```

## Ажиллуулах

```bash
# Dev (nodemon — автоматаар дахин эхлэнэ)
npm run dev

# Prod build
npm run build
npm start
```

## Endpoint-ууд

| Method | Path | Тайлбар |
|--------|------|---------|
| POST | `/api/transcribe` | `multipart/form-data` — `audio` field. Mock текст буцаана. |
| POST | `/api/process` | `{ text }` — tasks, events, summary mock буцаана. |
| POST | `/api/entries` | `{ text, tasks, events, summary }` — DB-д хадгална. |
| GET | `/api/entries` | Бүх entry буцаана. |
| GET | `/api/tasks` | Бүх task буцаана. |
| POST | `/api/report` | `{ date: "YYYY-MM-DD" }` — тухайн өдрийн тайлан. |
| GET | `/health` | `{ status: "ok" }` |

## Орчны хувьсагч (.env)

```
PORT=4000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>
CHIMEGE_API_KEY=...
OPENAI_API_KEY=...
```

## Railway deploy

1. Railway дээр шинэ проект үүсгэх
2. GitHub repo холбох → `backend` folder-г root болгох (Railway → Settings → Root Directory: `backend`)
3. Environment variables дотор `MONGODB_URI` болон бусдыг тавих
4. Railway автоматаар `npm run build && npm start` ажиллуулна

## Folder бүтэц

```
src/
├── controllers/   # Бизнес логик
├── middleware/    # multer upload
├── models/        # Mongoose schemas (Entry, Task)
├── routes/        # Express router
└── index.ts       # Entry point
```
