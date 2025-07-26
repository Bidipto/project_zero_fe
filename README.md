# 💬 Project Zero Chat – Frontend

**Project Zero FE** is the frontend of a modern chat application built using [Next.js 15](https://nextjs.org/), [React 18](https://reactjs.org/), and [TailwindCSS](https://tailwindcss.com/). It integrates with a custom backend API for authentication and backend functionality, and is styled and animated for a clean, responsive chat experience.

> ⚠️ This project is not run locally. It is deployed and consumed as a frontend service for the Project Zero chat application.

---

## 🪰 Tech Stack

- **Framework:** Next.js 15
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Animations:** Framer Motion
- **Authentication:** Custom Backend API + OAuth (GitHub, Google)
- **Icons:** Lucide React
- **Cookies Handling:** cookies-next
- **Utilities:** clsx, tailwind-merge

---

## 🔐 Authentication Features

### Supported Authentication Methods:
- **Email/Password**: Traditional username and password authentication
- **GitHub OAuth**: OAuth 2.0 authentication with GitHub
- **Google OAuth**: OAuth 2.0 authentication with Google (placeholder)

### GitHub OAuth Setup
For detailed instructions on setting up GitHub OAuth authentication, see the [GitHub OAuth Setup Guide](./GITHUB_OAUTH_SETUP.md).

Quick setup:
1. Create a GitHub OAuth App in your GitHub Developer Settings
2. Configure environment variables (see `.env.example`)
3. Implement the backend callback endpoint (`/v1/auth/github/callback`)
4. Test the integration

---

## 📁 Project Structure (High-Level)

```
project_zero_fe/
├── app/                    # Next.js App Router
│   ├── auth/              # OAuth callback routes
│   │   └── github/
│   │       └── callback/  # GitHub OAuth callback
│   ├── chat/              # Chat application
│   ├── components/        # UI Components
│   └── page.tsx           # Main authentication page
├── utils/                 # Helper functions
│   └── githubAuth.ts      # GitHub OAuth utilities
├── public/                # Static assets
├── .env.example           # Environment variables template
└── tsconfig.json          # TypeScript configuration
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running (default: `http://127.0.0.1:8000`)

### Installation

```bash
# Clone the repository
git clone https://github.com/Bidipto/project_zero_fe.git
cd project_zero_fe

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env.local

# Configure your environment variables in .env.local
# See GITHUB_OAUTH_SETUP.md for detailed instructions

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Backend URL
BACKEND_URL=http://127.0.0.1:8000

# GitHub OAuth (optional)
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id_here
NEXT_PUBLIC_GITHUB_REDIRECT_URI=http://localhost:3000/auth/github/callback
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

## 📆 Scripts

| Command              | Description                 |
| -------------------- | --------------------------- |
| `npm run dev`        | Start dev server            |
| `npm run build`      | Build for production        |
| `npm run start`      | Start built app             |
| `npm run lint`       | Run ESLint checks           |
| `npm run type-check` | Run TypeScript type checker |

---

## 🔧 Backend API Requirements

The frontend expects the following backend API endpoints:

### Authentication Endpoints
- `POST /v1/user/login` - Email/password login
- `POST /v1/user/register` - User registration
- `POST /v1/auth/github/callback` - GitHub OAuth callback

### Chat Endpoints
- `GET /v1/chatlist` - Get user's chat list
- `GET /v1/{chatId}/messages` - Get messages for a specific chat

See the [GitHub OAuth Setup Guide](./GITHUB_OAUTH_SETUP.md) for detailed API specifications.

---

## 📄 License

Licensed under [MIT](LICENSE)

---

## ✨ Maintainers

- [@Bidipto](https://github.com/Bidipto)
- [@Biswaraj](https://github.com/Biswarajace)
- [@Anubhav](https://github.com/anubhav126)

---

## 📌 Notes

- The application uses OAuth 2.0 for secure third-party authentication
- All OAuth flows include CSRF protection via state parameters
- JWT tokens are used for session management
- The frontend is designed to work with a custom backend API
