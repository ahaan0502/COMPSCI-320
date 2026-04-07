'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
const ShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const features = [
  {
    icon: <ShareIcon />,
    title: "Share Notes",
    description: "Upload your notes in any format — PDFs, images, or text",
  },
  {
    icon: <SearchIcon />,
    title: "Easy Discovery",
    description: "Filter by course, semester, or search for specific topics",
  },
  {
    icon: <UsersIcon />,
    title: "Study Groups",
    description: "Create private groups and collaborate with your classmates",
  },
  {
    icon: <ShieldIcon />,
    title: "UMass Only",
    description: "Secure community exclusive to verified UMass students",
  },
];

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors font-sans">

      {/*Navigation*/}
      <nav className="bg-[#7A1F1F] dark:bg-[#5A1515] text-white shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/*Logo*/}
          <div className="flex items-center gap-2">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-xl font-bold tracking-tight">UNotes</span>
          </div>

          {/*Desktop nav*/}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/about" className="text-white/80 hover:text-white transition text-sm font-medium">About</Link>
            <Link href="/login" className="text-white/80 hover:text-white transition text-sm font-medium">Sign In</Link>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 hover:bg-white/10 rounded-lg transition"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>

          {/*Mobile controls*/}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 hover:bg-white/10 rounded-lg transition"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/*Mobile Sidebar*/}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 h-full w-64 bg-[#7A1F1F] dark:bg-[#5A1515] text-white shadow-2xl z-50 md:hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <span className="text-xl font-bold">Menu</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-2">
                <Link href="/about" className="block py-3 px-4 hover:bg-white/10 rounded-lg transition" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
                <Link href="/login" className="block py-3 px-4 hover:bg-white/10 rounded-lg transition" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/*Hero*/}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #7A1F1F 0%, #9B2C2C 40%, #6B1A1A 100%)',
          minHeight: '420px',
        }}
      >
        {/*Subtle background texture*/}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-4xl mx-auto px-6 py-24 text-center text-white">
          <div className="flex items-center justify-center gap-3 mb-5">
            <svg className="w-10 h-10 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">UNotes</h1>
          </div>

          <p className="text-lg md:text-xl text-white/85 max-w-2xl mx-auto mb-10 leading-relaxed">
            Share notes, collaborate with classmates, and ace your courses.
            A note-sharing community built exclusively for UMass students.
          </p>

          <div className="flex flex-col items-center gap-3">
            <Link
              href="/auth/google"
              className="inline-flex items-center gap-3 bg-white text-[#7A1F1F] px-8 py-3.5 rounded-lg font-semibold text-base hover:bg-gray-100 transition shadow-lg"
            >
              <GoogleIcon />
              Sign in with UMass Google
            </Link>
            <p className="text-white/60 text-sm">Access restricted to @umass.edu email addresses only</p>
            {error === 'not-umass' && (
            <div className="mt-3 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
              Access is restricted to UMass students. Please sign in with your @umass.edu email address.
            </div>
          )}
          </div>
        </div>
      </section>

      {/*Why UNotes*/}
      <section className="bg-white dark:bg-gray-950 py-20 transition-colors">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-14 transition-colors">
            Why UNotes?
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
            {features.map((f) => (
              <div key={f.title} className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#f5e8e8] dark:bg-[#3a1a1a] flex items-center justify-center text-[#7A1F1F] dark:text-[#e08080] transition-colors">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 transition-colors">{f.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed transition-colors">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*CTA Banner*/}
      <section className="bg-gray-100 dark:bg-gray-900 py-20 transition-colors">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">
            Ready to get started?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg mb-10 transition-colors">
            Join hundreds of UMass students already sharing notes and collaborating on coursework.
          </p>
          <Link
            href="/auth/google"
            className="inline-flex items-center gap-3 bg-[#7A1F1F] hover:bg-[#6B1A1A] text-white px-8 py-3.5 rounded-lg font-semibold text-base transition shadow-md"
          >
            <GoogleIcon />
            Sign in with UMass Google
          </Link>
        </div>
      </section>
    </div>
  );
}