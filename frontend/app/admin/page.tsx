'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ModerationPostCard from '../components/ModerationPostCard';
import type { AdminClassSummary, AdminPost } from '../lib/moderation';
import {
  banUserFromCourse,
  deleteModerationPost,
  fetchModerationData,
  resolveModerationReports,
  saveModerationPost,
  unbanUserFromCourse,
} from '../lib/moderation';

export default function AdminPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [adminClasses, setAdminClasses] = useState<AdminClassSummary[]>([]);
  const [bannedUsersByCourse, setBannedUsersByCourse] = useState<Record<number, string[]>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const moderationData = await fetchModerationData();
      setCurrentUserId(moderationData.currentUserId);
      setIsAdmin(moderationData.isAdmin);
      setPosts(moderationData.posts);
      setAdminClasses(moderationData.adminClasses);
      setBannedUsersByCourse(moderationData.bannedUsersByCourse);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load moderation dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const reportedPosts = useMemo(
    () =>
      posts
        .filter((post) => post.reportCount > 0)
        .sort((a, b) => {
          if (b.reportCount !== a.reportCount) return b.reportCount - a.reportCount;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }),
    [posts],
  );

  const refreshAfterAction = async (action: () => Promise<void> | void) => {
    try {
      setError(null);
      await action();
      await loadDashboard();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Moderation action failed.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-100 px-6">
        <p className="text-zinc-500">Loading moderation dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-100 px-6">
        <div className="max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-800">Admin Dashboard Unavailable</h1>
          <p className="text-zinc-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-100 px-6">
        <div className="max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-800">Admin Access Required</h1>
          <p className="text-zinc-600">
            Your account is signed in, but `Users.is_admin` is not enabled for this user.
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
          <p className="mt-2 text-zinc-600">Live data from Supabase reports, posts, comments, and course bans.</p>
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
                  isAuthorBanned={post.course_id !== null && (bannedUsersByCourse[post.course_id] ?? []).includes(post.author_id)}
                  onSaveEdit={(postId, updates) => refreshAfterAction(() => saveModerationPost(postId, updates))}
                  onDelete={(postId) => refreshAfterAction(() => deleteModerationPost(postId))}
                  onResolveReports={(postId) =>
                    refreshAfterAction(async () => {
                      if (!currentUserId) throw new Error('Missing current admin user.');
                      await resolveModerationReports(postId, currentUserId);
                    })
                  }
                  onBanUser={(courseId, userId) =>
                    refreshAfterAction(async () => {
                      if (!currentUserId) throw new Error('Missing current admin user.');
                      await banUserFromCourse(courseId, userId, currentUserId);
                    })
                  }
                  onUnbanUser={(courseId, userId) => refreshAfterAction(() => unbanUserFromCourse(courseId, userId))}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500">
              No open reports right now.
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-800">Your Admin Classes</h2>
          {adminClasses.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {adminClasses.map((courseClass) => (
                <Link
                  key={courseClass.id}
                  href={`/admin/classes/${courseClass.courseId}?semester=${courseClass.semesterId}`}
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
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500">
              No classes with posts yet.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
