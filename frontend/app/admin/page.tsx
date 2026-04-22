'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import ModerationPostCard from '../components/ModerationPostCard';
import {
  INITIAL_BANNED_USERS_BY_CLASS,
  MOCK_CURRENT_USER_ID,
  getAdminClasses,
  getPostsForAdmin,
} from '../lib/adminMockData';

export default function AdminPage() {
  const [posts, setPosts] = useState(() => getPostsForAdmin(MOCK_CURRENT_USER_ID));
  const [bannedUsersByClass, setBannedUsersByClass] = useState<Record<number, string[]>>(INITIAL_BANNED_USERS_BY_CLASS);

  const adminClasses = useMemo(() => getAdminClasses(MOCK_CURRENT_USER_ID), []);

  const reportedPosts = useMemo(
    () =>
      posts
        .filter((post) => post.is_report)
        .sort((a, b) => {
          if (b.reportCount !== a.reportCount) return b.reportCount - a.reportCount;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }),
    [posts],
  );

  const classModerationStats = useMemo(
    () =>
      adminClasses.map((courseClass) => {
        const classPosts = posts.filter((post) => post.course_id === courseClass.id);
        const classReported = classPosts.filter((post) => post.is_report).length;
        return {
          ...courseClass,
          postCount: classPosts.length,
          reportedCount: classReported,
        };
      }),
    [adminClasses, posts],
  );

  const updatePost = (postId: number, updates: { title: string; body: string }) => {
    setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, ...updates } : post)));
  };

  const deletePost = (postId: number) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  const banUser = (classId: number, userId: string) => {
    setBannedUsersByClass((prev) => {
      const existing = prev[classId] ?? [];
      if (existing.includes(userId)) return prev;
      return {
        ...prev,
        [classId]: [...existing, userId],
      };
    });
  };

  const unbanUser = (classId: number, userId: string) => {
    setBannedUsersByClass((prev) => ({
      ...prev,
      [classId]: (prev[classId] ?? []).filter((currentUserId) => currentUserId !== userId),
    }));
  };

  if (adminClasses.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-100 px-6">
        <div className="max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-800">No Admin Classes Assigned</h1>
          <p className="text-zinc-600">
            Your account currently has no class moderation scope. Once class admin mappings are configured,
            your dashboard will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-100">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 lg:px-8">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Admin</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-800">Moderation Dashboard</h1>
          <p className="mt-2 text-zinc-600">Hardcoded for now.</p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-800">Reported Posts</h2>
            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
              {reportedPosts.length} open reports
            </span>
          </div>

          {reportedPosts.length > 0 ? (
            <div className="space-y-4">
              {reportedPosts.map((post) => (
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
              No reported posts in your admin classes.
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-800">Your Admin Classes</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classModerationStats.map((courseClass) => (
              <Link
                key={courseClass.id}
                href={`/admin/classes/${courseClass.id}`}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-sm font-semibold text-zinc-500">{courseClass.code}</p>
                <h3 className="mt-1 text-xl font-bold text-zinc-800">{courseClass.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{courseClass.semesterLabel}</p>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="rounded-full bg-zinc-100 px-3 py-1 font-semibold text-zinc-700">
                    {courseClass.postCount} posts
                  </span>
                  <span className="rounded-full bg-red-100 px-3 py-1 font-semibold text-red-700">
                    {courseClass.reportedCount} reported
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
