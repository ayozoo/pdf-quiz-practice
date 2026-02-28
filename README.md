# pdf-quiz-practice 🚀

**English** | [中文](./README.zh-CN.md)

> Upload any PDF exam book → auto-parse questions & answers → practice online.

A **lightweight, open-source, zero-login** web app for exam practice. Supports **any text-based PDF** through a configurable regex template engine — automatically extracts questions, options, and answers. Progress is saved locally in the browser.

> **💡 Not just AWS!** Ships with a built-in AWS SAA / SOA template, and lets you create custom templates for any format — civil service exams, driving tests, graduate entrance exams, professional certifications, corporate training, and more.

## ✨ Features

- **🧩 Template-based parsing engine**
  - Not tied to a single PDF format. Configure regex rules to define question splitting, option detection, and answer extraction.
  - Built-in AWS SAA template works out of the box. Create, clone, or edit your own templates.
  - Choose a template when uploading — one click to parse and store.

- **📱 Desktop & mobile ready**
  - **Desktop**: 3-column layout — sidebar nav + exam list + answer area, with draggable panel widths.
  - **Mobile**: Responsive layout with drawer menu, large touch targets, and single-hand friendly design.

- **💾 Auto-saved progress**
  - No login required. Answers and page position are automatically persisted to browser LocalStorage.
  - Question navigator panel shows real-time status: current / correct / wrong / unanswered.

- **🔌 LAN access out of the box**
  - Both frontend and backend listen on `0.0.0.0`. Connect phone and PC to the same Wi-Fi and open the PC's IP.
  - API base URL is auto-detected — zero config for cross-device access.

## 📸 Pages

| Page                | Description                                                         |
| ------------------- | ------------------------------------------------------------------- |
| **Practice**        | Select an exam → answer questions → submit to see correct answers   |
| **Manage**          | Upload PDF (choose template) / delete individual exam / clear all   |
| **Template Config** | Create / edit / clone / delete parsing templates with regex preview |

## 🛠️ Quick Start

**Prerequisites**: Node.js v18+

### 1. Install dependencies

```bash
git clone https://github.com/ayozoo/pdf-quiz-practice.git
cd pdf-quiz-practice
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

### 2. Start

```bash
npm start            # starts frontend and backend in parallel
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000`

### 3. Mobile access

1. Connect your phone and PC to the same Wi-Fi.
2. Find the PC's LAN IP (Mac: `ifconfig` / Windows: `ipconfig`, e.g. `192.168.x.x`).
3. Open `http://<PC-IP>:5173` in the phone's browser.

## 📖 Usage

1. Go to **Templates** — confirm there is a template matching your PDF format (the built-in AWS template works for AWS exam PDFs). If not, create a new one and configure the regex rules.
2. Go to **Manage** — select a template, upload your PDF file, and it will be automatically parsed and stored.
3. Go to **Practice** — pick an exam and start answering. Progress is saved automatically.

## ⚠️ Notes

1. **Progress storage**: Saved in the current browser's LocalStorage. Different devices / browsers have independent progress.
2. **PDF requirement**: The PDF must be **text-based** (copyable text). Scanned image PDFs cannot be parsed.
3. **Template tuning**: If parse results are off, adjust the regex rules in the Template Config page or create a new template.

## 🧑‍💻 Tech Stack

| Layer        | Technologies                                                     |
| ------------ | ---------------------------------------------------------------- |
| **Frontend** | React 19 · TypeScript · Vite 5 · React Router 7 · Lucide Icons   |
| **Backend**  | NestJS 11 · TypeORM · pdf-parse                                  |
| **Database** | SQLite (file-based, zero installation)                           |
| **Tooling**  | Monorepo · npm-run-all · Husky · lint-staged · Prettier · ESLint |

## 📁 Project Structure

```
pdf-quiz-practice/
├── package.json          # root scripts (npm start launches both services)
├── client/               # React frontend
│   └── src/
│       ├── components/   # Layout, QuestionCard, QuestionNavigator, …
│       ├── pages/        # ExamPractice, ExamManagement, TemplateConfig
│       ├── types/        # TypeScript type definitions
│       └── utils/        # API helpers
└── server/               # NestJS backend
    └── src/
        ├── exam/         # Exam CRUD
        ├── pdf/          # PDF upload & parsing
        └── template/     # Template CRUD
```

## 📄 License

[MIT](./LICENSE)
