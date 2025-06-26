# 💬 Project Zero Chat – Frontend

**Project Zero FE** is the frontend of a modern chat application built using [Next.js 15](https://nextjs.org/), [React 18](https://reactjs.org/), and [TailwindCSS](https://tailwindcss.com/). It integrates with [Appwrite](https://appwrite.io/) for authentication and backend functionality, and is styled and animated for a clean, responsive chat experience.

> ⚠️ This project is not run locally. It is deployed and consumed as a frontend service for the Project Zero chat application.

---

## 🪰 Tech Stack

- **Framework:** Next.js 15
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Animations:** Framer Motion
- **Authentication:** Appwrite
- **Icons:** Lucide React
- **Cookies Handling:** cookies-next
- **Utilities:** clsx, tailwind-merge

---

## 📁 Project Structure (High-Level)

```

project\_zero\_fe/
├── app/ or pages/           # Routing
├── components/              # UI Components (ChatBox, MessageList, etc.)
├── styles/                  # Tailwind and global styles
├── public/                  # Static assets
├── utils/                   # Helper functions
├── .env.local               # Environment variables (if used)
└── tsconfig.json            # TypeScript configuration

```

---

## 🚀 Deployment

This frontend is not **deployed**, and is intended for local development.

If needed for debugging or extending:

```bash
# Optional: Clone the repo
git clone https://github.com/Bidipto/project_zero_fe.git
cd project_zero_fe

# Optional: Install dependencies
npm install

# Optional: Start development server
npm run dev
```

---

## 🧑‍💻 Contributing

Want to contribute? Follow these steps:

1. Create a new branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit:

   ```bash
   git commit -m "Add: your message"
   ```

3. Push and open a pull request:

   ```bash
   git push origin feature/your-feature-name
   ```

---

## 📆 Scripts (If Used for Local Testing)

| Command              | Description                 |
| -------------------- | --------------------------- |
| `npm run dev`        | Start dev server            |
| `npm run build`      | Build for production        |
| `npm run start`      | Start built app             |
| `npm run lint`       | Run ESLint checks           |
| `npm run type-check` | Run TypeScript type checker |

---

## 📄 License

Licensed under [MIT](LICENSE)

---

## ✨ Maintainer

- [@Bidipto](https://github.com/Bidipto)
- [@Chagla]()
- [@Anubhav](https://github.com/anubhav126)

---

## 📌 Notes

- Will add as we go
