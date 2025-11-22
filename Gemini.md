# Gemini Project Overview: sitesafe-dashboard

This document provides a comprehensive overview of the `sitesafe-dashboard` project, designed to help developers understand its structure, technologies, and conventions.

## 1. Project Description

`sitesafe-dashboard` is a web application built to facilitate safety talks and crew management. It appears to have two main user roles: "owners" and "foremen," each with a distinct set of permissions and views. The application allows for managing safety topics, crew members, and locations, as well as conducting and recording safety talks.

## 2. Core Technologies

- **Framework:** [React](https://reactjs.org/) (v19) with TypeScript
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Routing:** [React Router](https://reactrouter.com/) (v7) using `HashRouter`
- **Styling:** The project seems to use a utility-first CSS approach, likely Tailwind CSS, given the class names in the code, but this is not explicitly defined in the dependencies.
- **State Management:** A custom hook-based context provider pattern is used for state management (e.g., `useAuth`, `useTalkRecords`).

## 3. Project Structure

The project follows a feature-oriented structure, with components, pages, hooks, and constants organized into logical directories.

```
/
├─── src/
│    ├─── components/      # Reusable UI components
│    ├─── constants/       # Application-wide constants
│    ├─── hooks/           # Custom React hooks for state and logic
│    ├─── pages/           # Top-level page components for each route
│    │    ├─── admin/      # Pages for owner-specific administrative tasks
│    │    └─── foreman/    # Pages for foreman-specific workflows
│    └─── utils/           # Utility functions
├─── public/              # Static assets
├─── package.json         # Project dependencies and scripts
├─── vite.config.ts       # Vite configuration
└─── tsconfig.json        # TypeScript configuration
```

## 4. Getting Started

To get the project up and running locally, follow these steps:

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## 5. Key Commands

- `npm run dev`: Starts the development server with hot-reloading.
- `npm run build`: Builds the application for production.
- `npm run preview`: Serves the production build locally for testing.

## 6. Coding Conventions

- **Path Aliases:** The project uses the `@` alias for the root directory (e.g., `import Component from '@/components/Component'`).
- **State Management:** State is managed through React's Context API, exposed via custom hooks. Each "provider" (e.g., `CrewMembersProvider`) encapsulates a slice of the application's state.
- **Routing:** Routes are defined in `App.tsx` using `react-router-dom`. Protected routes are handled by a custom `ProtectedRoute` component that checks for user authentication and role.
- **Component Naming:** Components are named using PascalCase (e.g., `MyComponent`).
- **File Naming:** Files are named using PascalCase for components and camelCase for other files (e.g., `useAuth.ts`).
- **Styling:** Utility-first CSS classes are used for styling, which is consistent with frameworks like Tailwind CSS.
