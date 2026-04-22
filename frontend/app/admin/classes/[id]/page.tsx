'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import ModerationPostCard from '../../../components/ModerationPostCard';
import {
  INITIAL_BANNED_USERS_BY_CLASS,
  MOCK_CURRENT_USER_ID,
  getAdminClasses,
  getPostsForAdminClass,
} from '../../../lib/adminMockData';

export default function AdminClassNotesPage() {
  const params = useParams<{ id: string }>();
  const classId = Number(params.id);

  const adminClasses = useMemo(() => getAdminClasses(MOCK_CURRENT_USER_ID), []);
  const selectedClass = useMemo(
    () => adminClasses.find((courseClass) => courseClass.id === classId),
    [adminClasses, classId],
  );

  const [posts, setPosts] = useState(() => getPostsForAdminClass(MOCK_CURRENT_USER_ID, classId));
  const [bannedUsersByClass, setBannedUsersByClass] = useState<Record<number, string[]>>(INITIAL_BANNED_USERS_BY_CLASS);

  const sortedPosts = useMemo(
    () =>
      [...posts].sort((a, b) => {
        if (a.is_report !== b.is_report) return a.is_report ? -1 : 1;
        if (a.is_report && b.is_report && b.reportCount !== a.reportCount) {
          return b.reportCount - a.reportCount;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }),
    [posts],
  );

  const reportedCount = useMemo(() => posts.filter((post) => post.is_report).length, [posts]);

  const updatePost = (postId: number, updates: { title: string; body: string }) => {
    setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, ...updates } : post)));
  };

  const deletePost = (postId: number) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  const banUser = (targetClassId: number, userId: string) => {
    setBannedUsersByClass((prev) => {
      const existing = prev[targetClassId] ?? [];
      if (existing.includes(userId)) return prev;
      return {
        ...prev,
        [targetClassId]: [...existing, userId],
      };
    });
  };

  const unbanUser = (targetClassId: number, userId: string) => {
    setBannedUsersByClass((prev) => ({
      ...prev,
      [targetClassId]: (prev[targetClassId] ?? []).filter((currentUserId) => currentUserId !== userId),
    }));
  };

  if (Number.isNaN(classId) || !selectedClass) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-100 px-6">
        <div className="max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-800">Class Not Found</h1>
          <p className="text-zinc-600">This class is not in your admin scope.</p>
          <Link href="/admin" className="mt-4 inline-block font-semibold text-red-800 hover:underline">
            Back to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-100">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 lg:px-8">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Class Moderation</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-800">{selectedClass.code}</h1>
          <p className="mt-2 text-zinc-600">{selectedClass.title} · {selectedClass.semesterLabel}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-zinc-100 px-3 py-1 font-semibold text-zinc-700">{posts.length} notes</span>
            <span className="rounded-full bg-red-100 px-3 py-1 font-semibold text-red-700">{reportedCount} reported</span>
          </div>
          <Link href="/admin" className="mt-4 inline-block font-semibold text-red-800 hover:underline">
            Back to Admin Dashboard
          </Link>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-800">Class Notes</h2>
            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
              Reported notes are shown first
            </span>
          </div>

          {sortedPosts.length > 0 ? (
            <div className="space-y-4">
              {sortedPosts.map((post) => (
                <ModerationPostCard
                  key={post.id}
                  post={post}
                  isAuthorBanned={post.course_id !== null && (bannedUsersByClass[post.course_id] ?? []).includes(post.author_id)}
                  onSaveEdit={updatePost}
                  onDelete={deletePost}
                  onBanUser={banUser}
                  onUnbanUser={unbanUser}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500">
              No notes available for this class.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
