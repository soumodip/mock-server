# Code Documentation

Generated on: 2025-11-12T20:02:40.657Z

Total files: 29

---

## README.md

```md
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

```

---

## app/dashboard/crud/page.tsx

```tsx
'use client';

import { useState, useMemo } from 'react';
import { useCrudStore } from '@/stores/crud';
import { Modal, CrudItem } from '@/types';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import CreateModal from '@/components/modals/crud/CreateModal';
import EditModal from '@/components/modals/crud/EditModal';
import DeleteModal from '@/components/modals/crud/DeleteModal';
import InfoModal from '@/components/modals/InfoModal';
import { Plus, Search, Eye, Pencil, Trash2, FolderOpen } from 'lucide-react';

export default function CrudPage() {
  const items = useCrudStore((state) => state.items);
  const [modal, setModal] = useState<Modal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }

    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        item.status.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const openModal = (type: string, data?: any) => {
    setModal({ type, data });
  };

  const closeModal = () => {
    setModal(null);
  };

  const openCreateModal = () => {
    openModal('create');
  };

  const openEditModal = (item: CrudItem) => {
    openModal('edit', item);
  };

  const openViewModal = (item: CrudItem) => {
    openModal('view', item);
  };

  const confirmDelete = (item: CrudItem) => {
    openModal('delete', item);
  };

  return (
    <DashboardLayout>
      <div>
        {/* Page Header */}
        <div className="flex flex-row items-start justify-between">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-white mb-1">All projects</h1>
            <p className="text-sm text-gray-400">Manage your projects and their deployments</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors duration-200"
          >
            <Plus className="text-lg" size={18} />
            <span>New Project</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-4 flex justify-end">
          <div className="relative w-64">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="text"
              placeholder="Search projects..."
              className="w-full px-4 py-2 pr-10 bg-[#0f1419] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" size={20} />
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#1a2332] rounded-lg border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0f1419] border-b border-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#0f1419] transition">
                    <td className="px-6 py-2.5 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-white">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-2.5 whitespace-nowrap">
                      <span className="text-sm text-gray-400">{item.email}</span>
                    </td>
                    <td className="px-6 py-2.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          item.status === 'Active'
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-gray-500/10 text-gray-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            item.status === 'Active' ? 'bg-green-400' : 'bg-gray-400'
                          }`}
                        ></span>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-2.5 whitespace-nowrap text-sm text-gray-400">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-6 py-2.5 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openViewModal(item)}
                          className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all duration-200"
                          title="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all duration-200"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => confirmDelete(item)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <FolderOpen className="text-gray-600 text-5xl mb-4 mx-auto" size={48} />
              <p className="text-gray-400 text-sm">
                {searchQuery ? 'No matching projects found' : 'No projects yet'}
              </p>
            </div>
          )}
        </div>

        {/* Modals */}
        {modal?.type === 'create' && <CreateModal onClose={closeModal} />}
        {modal?.type === 'edit' && modal.data && <EditModal item={modal.data} onClose={closeModal} />}
        {modal?.type === 'delete' && modal.data && <DeleteModal item={modal.data} onClose={closeModal} />}
        {modal?.type === 'view' && modal.data && <InfoModal item={modal.data} onClose={closeModal} />}
      </div>
    </DashboardLayout>
  );
}

```

---

## app/error.tsx

```tsx
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-[#0f1419]">
      <div className="flex flex-row justify-center gap-8">
        <p className="flex items-center text-[10rem] font-bold tracking-tight m-0 text-white">500</p>
        <div className="flex flex-col justify-center max-w-[400px]">
          <p className="text-[24px] font-bold text-white">Internal Server Error</p>
          <p className="text-[16px] text-gray-400">
            We&apos;ve encountered an unexpected issue. Please try again later.
          </p>
          <button
            onClick={reset}
            className="mt-4 text-[16px] text-indigo-400 hover:text-indigo-300 underline"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

```

---

## app/favicon.ico

*Binary file (content not displayed)*

---

## app/globals.css

```css
@import "tailwindcss";

@layer base {
  * {
    @apply m-0 p-0 box-border;
  }

  html {
    @apply h-full w-full m-0 p-0;
  }

  body {
    @apply h-full w-full m-0 p-0 bg-[#0f1419] text-white antialiased;
    font-family: var(--font-poppins), 'Poppins', sans-serif;
  }

  /* Hide browser extension attributes */
  body[cz-shortcut-listen],
  html[cz-shortcut-listen] {
    /* Browser extension attributes - ignore */
  }

  #__next {
    @apply h-full w-full;
  }

  /* Ensure smooth transitions for interactive elements */
  button {
    @apply transition-all duration-200 ease-in-out cursor-pointer;
  }

  button:disabled {
    @apply cursor-not-allowed;
  }

  input,
  select,
  textarea {
    @apply transition-all duration-200 ease-in-out;
  }

  select {
    @apply cursor-pointer;
  }

  a {
    @apply cursor-pointer;
  }
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes fadeOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInDown {
  0% {
    opacity: 0;
    transform: translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

```

---

## app/layout.tsx

```tsx
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Admin dashboard for managing projects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} font-poppins m-0 p-0 antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

```

---

## app/not-found.tsx

```tsx
export default function NotFound() {
  return (
    <div className="flex items-center justify-center w-screen h-screen bg-[#0f1419]">
      <div className="flex flex-row justify-center gap-8">
        <p className="flex items-center text-[10rem] font-bold tracking-tight m-0 text-white">404</p>
        <div className="flex flex-col justify-center max-w-[400px]">
          <p className="text-[24px] font-bold text-white">Page Not Found</p>
          <p className="text-[16px] text-gray-400">
            Sorry, the page you are looking for doesn&apos;t exist or has been moved.
          </p>
          <a href="/" className="mt-4 text-[16px] text-indigo-400 hover:text-indigo-300 underline">
            Go back home
          </a>
        </div>
      </div>
    </div>
  );
}

```

---

## app/page.tsx

```tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { Layers, ChevronRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);

      if (success) {
        router.push('/dashboard/crud');
      } else {
        setError('Invalid email or password');
      }
    } catch (e) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen justify-center items-center bg-[#0f1419]">
      <div className="w-full max-w-md px-8">
        {/* Login Form */}
        <div className="bg-[#1a2332] rounded-2xl p-8 shadow-xl border border-gray-800">
          <h1 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <Layers className="text-white" size={18} />
            Admin Panel
          </h1>
          <p className="text-sm text-gray-400 mb-6">Sign in to your dashboard.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Error Message */}
            {error && <div className="text-red-400 text-xs">{error}</div>}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm flex flex-row justify-between items-center font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
            >
              {loading ? 'Signing in...' : 'Submit'}
              <ChevronRight className="text-white" size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

```

---

## components/layouts/DashboardLayout.tsx

```tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { FolderOpen, Settings, Power, Layers } from 'lucide-react';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

  const userEmail = user?.email || 'User';
  const userInitials = user?.email?.charAt(0).toUpperCase() || 'U';

  const isActive = (path: string) => pathname === path;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-[#0f1419] font-poppins">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a2332] border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <Layers className="text-white" size={20} />
            <span className="text-white font-semibold text-lg">Admin Panel</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-3">Navigation</p>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/dashboard/crud"
                  className={`flex items-center space-x-3 px-3 py-2.5 text-sm rounded-lg transition hover:bg-[#0f1419] ${
                    isActive('/dashboard/crud') ? 'bg-[#0f1419] text-white' : 'text-gray-400'
                  }`}
                >
                  <FolderOpen className="text-lg" size={18} />
                  <span>Projects</span>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-400 rounded-lg transition hover:bg-[#0f1419]"
                >
                  <Settings className="text-lg" size={18} />
                  <span>Settings</span>
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-medium">{userInitials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{userEmail}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-white hover:bg-[#0f1419] p-1 rounded-lg transition-all duration-200 flex-shrink-0 mt-1"
              title="Logout"
            >
              <Power className="text-lg" size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

```

---

## components/layouts/DefaultLayout.tsx

```tsx
import { ReactNode } from 'react';

export default function DefaultLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full h-full font-poppins p-0 m-0 antialiased">
      {children}
    </div>
  );
}

```

---

## components/modals/InfoModal.tsx

```tsx
'use client';

import { CrudItem } from '@/types';
import { X, Folder, Info } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

interface InfoModalProps {
  item: CrudItem | null;
  onClose: () => void;
}

export default function InfoModal({ item, onClose }: InfoModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1a2332] rounded-xl border border-gray-800 w-full max-w-lg mx-4 shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Project Details</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-[#0f1419] rounded-lg transition-all duration-200"
          >
            <X className="text-xl" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Project Icon & Name */}
          <div className="flex items-center space-x-4 pb-4 border-b border-gray-800">
            <div className="w-16 h-16 bg-indigo-600/20 rounded-xl flex items-center justify-center">
              <Folder className="text-indigo-400 text-3xl" size={32} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">{item?.name}</h3>
              <p className="text-sm text-gray-400">{item?.email}</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-400">Status</span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  item?.status === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    item?.status === 'Active' ? 'bg-green-400' : 'bg-gray-400'
                  }`}
                ></span>
                {item?.status}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-400">Created Date</span>
              <span className="text-sm text-white">{formatDate(item?.createdAt)}</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-400">Project ID</span>
              <span className="text-sm text-white font-mono">#{item?.id}</span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-[#0f1419] rounded-lg p-4 border border-gray-800">
            <div className="flex items-start space-x-3">
              <Info className="text-indigo-400 text-lg mt-0.5" size={18} />
              <div>
                <h4 className="text-sm font-medium text-white mb-1">Project Information</h4>
                <p className="text-xs text-gray-400">
                  This project is managed through the admin panel. You can edit or delete this project from the main dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

```

---

## components/modals/crud/CreateModal.tsx

```tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useCrudStore } from '@/stores/crud';
import { X, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';

interface CreateModalProps {
  onClose: () => void;
}

export default function CreateModal({ onClose }: CreateModalProps) {
  const [mounted, setMounted] = useState(false);
  const addItem = useCrudStore((state) => state.addItem);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    status: 'Active',
    createdAt: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    addItem(formData);
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1a2332] rounded-xl border border-gray-800 w-full max-w-md mx-4 shadow-xl">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Create New Project</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white hover:bg-[#0f1419] rounded-lg transition-all duration-200">
            <X className="text-xl" size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              type="text"
              required
              placeholder="Project name"
              className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              type="email"
              required
              placeholder="email@example.com"
              className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <div className="relative">
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#0f1419] rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

```

---

## components/modals/crud/DeleteModal.tsx

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useCrudStore } from '@/stores/crud';
import { CrudItem } from '@/types';
import { X, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DeleteModalProps {
  item: CrudItem;
  onClose: () => void;
}

export default function DeleteModal({ item, onClose }: DeleteModalProps) {
  const [mounted, setMounted] = useState(false);
  const deleteItem = useCrudStore((state) => state.deleteItem);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDelete = () => {
    deleteItem(item.id);
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1a2332] rounded-xl border border-gray-800 w-full max-w-sm mx-4 shadow-xl">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10">
              <AlertCircle className="text-red-400 text-2xl" size={24} />
            </div>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-white hover:bg-[#0f1419] rounded-lg transition-all duration-200">
              <X className="text-xl" size={20} />
            </button>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Delete Project</h3>
          <p className="text-sm text-gray-400 mb-6">
            Are you sure you want to delete <span className="text-white font-medium">{item.name}</span>? This
            action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#0f1419] rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

```

---

## components/modals/crud/EditModal.tsx

```tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useCrudStore } from '@/stores/crud';
import { CrudItem } from '@/types';
import { X, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';

interface EditModalProps {
  item: CrudItem;
  onClose: () => void;
}

export default function EditModal({ item, onClose }: EditModalProps) {
  const [mounted, setMounted] = useState(false);
  const updateItem = useCrudStore((state) => state.updateItem);
  const [formData, setFormData] = useState({ ...item });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateItem(item.id, formData);
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1a2332] rounded-xl border border-gray-800 w-full max-w-md mx-4 shadow-xl">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Edit Project</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white hover:bg-[#0f1419] rounded-lg transition-all duration-200">
            <X className="text-xl" size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              type="text"
              required
              placeholder="Project name"
              className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              type="email"
              required
              placeholder="email@example.com"
              className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <div className="relative">
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#0f1419] rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

```

---

## eslint.config.mjs

```mjs
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

```

---

## next-env.d.ts

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
import "./.next/dev/types/routes.js";

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.

```

---

## next.config.ts

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

```

---

## package.json

```json
{
  "name": "admin-frontend-next",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "lucide-react": "^0.546.0",
    "next": "16.0.0",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "zustand": "^5.0.8"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20.19.24",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.0.0",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}

```

---

## postcss.config.mjs

```mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;

```

---

## public/file.svg

```svg
<svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M14.5 13.5V5.41a1 1 0 0 0-.3-.7L9.8.29A1 1 0 0 0 9.08 0H1.5v13.5A2.5 2.5 0 0 0 4 16h8a2.5 2.5 0 0 0 2.5-2.5m-1.5 0v-7H8v-5H3v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1M9.5 5V2.12L12.38 5zM5.13 5h-.62v1.25h2.12V5zm-.62 3h7.12v1.25H4.5zm.62 3h-.62v1.25h7.12V11z" clip-rule="evenodd" fill="#666" fill-rule="evenodd"/></svg>
```

---

## public/globe.svg

```svg
<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><g clip-path="url(#a)"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.27 14.1a6.5 6.5 0 0 0 3.67-3.45q-1.24.21-2.7.34-.31 1.83-.97 3.1M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.48-1.52a7 7 0 0 1-.96 0H7.5a4 4 0 0 1-.84-1.32q-.38-.89-.63-2.08a40 40 0 0 0 3.92 0q-.25 1.2-.63 2.08a4 4 0 0 1-.84 1.31zm2.94-4.76q1.66-.15 2.95-.43a7 7 0 0 0 0-2.58q-1.3-.27-2.95-.43a18 18 0 0 1 0 3.44m-1.27-3.54a17 17 0 0 1 0 3.64 39 39 0 0 1-4.3 0 17 17 0 0 1 0-3.64 39 39 0 0 1 4.3 0m1.1-1.17q1.45.13 2.69.34a6.5 6.5 0 0 0-3.67-3.44q.65 1.26.98 3.1M8.48 1.5l.01.02q.41.37.84 1.31.38.89.63 2.08a40 40 0 0 0-3.92 0q.25-1.2.63-2.08a4 4 0 0 1 .85-1.32 7 7 0 0 1 .96 0m-2.75.4a6.5 6.5 0 0 0-3.67 3.44 29 29 0 0 1 2.7-.34q.31-1.83.97-3.1M4.58 6.28q-1.66.16-2.95.43a7 7 0 0 0 0 2.58q1.3.27 2.95.43a18 18 0 0 1 0-3.44m.17 4.71q-1.45-.12-2.69-.34a6.5 6.5 0 0 0 3.67 3.44q-.65-1.27-.98-3.1" fill="#666"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h16v16H0z"/></clipPath></defs></svg>
```

---

## public/next.svg

```svg
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 394 80"><path fill="#000" d="M262 0h68.5v12.7h-27.2v66.6h-13.6V12.7H262V0ZM149 0v12.7H94v20.4h44.3v12.6H94v21h55v12.6H80.5V0h68.7zm34.3 0h-17.8l63.8 79.4h17.9l-32-39.7 32-39.6h-17.9l-23 28.6-23-28.6zm18.3 56.7-9-11-27.1 33.7h17.8l18.3-22.7z"/><path fill="#000" d="M81 79.3 17 0H0v79.3h13.6V17l50.2 62.3H81Zm252.6-.4c-1 0-1.8-.4-2.5-1s-1.1-1.6-1.1-2.6.3-1.8 1-2.5 1.6-1 2.6-1 1.8.3 2.5 1a3.4 3.4 0 0 1 .6 4.3 3.7 3.7 0 0 1-3 1.8zm23.2-33.5h6v23.3c0 2.1-.4 4-1.3 5.5a9.1 9.1 0 0 1-3.8 3.5c-1.6.8-3.5 1.3-5.7 1.3-2 0-3.7-.4-5.3-1s-2.8-1.8-3.7-3.2c-.9-1.3-1.4-3-1.4-5h6c.1.8.3 1.6.7 2.2s1 1.2 1.6 1.5c.7.4 1.5.5 2.4.5 1 0 1.8-.2 2.4-.6a4 4 0 0 0 1.6-1.8c.3-.8.5-1.8.5-3V45.5zm30.9 9.1a4.4 4.4 0 0 0-2-3.3 7.5 7.5 0 0 0-4.3-1.1c-1.3 0-2.4.2-3.3.5-.9.4-1.6 1-2 1.6a3.5 3.5 0 0 0-.3 4c.3.5.7.9 1.3 1.2l1.8 1 2 .5 3.2.8c1.3.3 2.5.7 3.7 1.2a13 13 0 0 1 3.2 1.8 8.1 8.1 0 0 1 3 6.5c0 2-.5 3.7-1.5 5.1a10 10 0 0 1-4.4 3.5c-1.8.8-4.1 1.2-6.8 1.2-2.6 0-4.9-.4-6.8-1.2-2-.8-3.4-2-4.5-3.5a10 10 0 0 1-1.7-5.6h6a5 5 0 0 0 3.5 4.6c1 .4 2.2.6 3.4.6 1.3 0 2.5-.2 3.5-.6 1-.4 1.8-1 2.4-1.7a4 4 0 0 0 .8-2.4c0-.9-.2-1.6-.7-2.2a11 11 0 0 0-2.1-1.4l-3.2-1-3.8-1c-2.8-.7-5-1.7-6.6-3.2a7.2 7.2 0 0 1-2.4-5.7 8 8 0 0 1 1.7-5 10 10 0 0 1 4.3-3.5c2-.8 4-1.2 6.4-1.2 2.3 0 4.4.4 6.2 1.2 1.8.8 3.2 2 4.3 3.4 1 1.4 1.5 3 1.5 5h-5.8z"/></svg>
```

---

## public/vercel.svg

```svg
<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1155 1000"><path d="m577.3 0 577.4 1000H0z" fill="#fff"/></svg>
```

---

## public/window.svg

```svg
<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.5 2.5h13v10a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1zM0 1h16v11.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 0 12.5zm3.75 4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5M7 4.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m1.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5" fill="#666"/></svg>
```

---

## stores/app.ts

```ts
import { create } from 'zustand';

interface AppState {
  // Add app-level state here if needed
}

export const useAppStore = create<AppState>(() => ({}));

```

---

## stores/auth.ts

```ts
import { create } from 'zustand';

interface AuthState {
  user: { email: string } | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      // Mock login - replace with actual API call
      if (email && password) {
        set({ user: { email }, isAuthenticated: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
}));

```

---

## stores/crud.ts

```ts
import { create } from 'zustand';
import { CrudItem } from '@/types';

interface CrudState {
  items: CrudItem[];
  addItem: (item: Omit<CrudItem, 'id'>) => void;
  updateItem: (id: number, updatedItem: Partial<CrudItem>) => void;
  deleteItem: (id: number) => void;
  getItem: (id: number) => CrudItem | undefined;
}

export const useCrudStore = create<CrudState>((set, get) => ({
  items: [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active', createdAt: '2025-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive', createdAt: '2025-01-16' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active', createdAt: '2025-01-17' },
  ],

  addItem: (item) => {
    const newId = Math.max(...get().items.map(i => i.id), 0) + 1;
    set((state) => ({
      items: [...state.items, { ...item, id: newId }],
    }));
  },

  updateItem: (id, updatedItem) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updatedItem } : item
      ),
    }));
  },

  deleteItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },

  getItem: (id) => {
    return get().items.find((item) => item.id === id);
  },
}));

```

---

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}

```

---

## types/index.ts

```ts
export interface Modal {
  type: string;
  data?: any;
}

export interface CrudItem {
  id: number;
  name: string;
  email: string;
  status: string;
  createdAt: string;
}

```

---

