'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import ModerationPostCard from '../../../components/ModerationPostCard';
import type { AdminClassSummary, AdminPost } from '../../../lib/moderation';
import {
  banUserFromCourse,
  deleteModerationPost,
  fetchModerationData,
  resolveModerationReports,
  saveModerationPost,
  unbanUserFromCourse,
} from '../../../lib/moderation';

export default function AdminClassNotesPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const classId = Number(params.id);
  const semesterIdParam = searchParams.get('semester');
  const semesterId = semesterIdParam ? Number(semesterIdParam) : undefined;

  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [adminClasses, setAdminClasses] = useState<AdminClassSummary[]>([]);
  const [bannedUsersByCourse, setBannedUsersByCourse] = useState<Record<number, string[]>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClassDashboard = useCallback(async () => {
    if (Number.isNaN(classId)) {
      setLoading(false);
      setError('Invalid class id.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const moderationData = await fetchModerationData({
        courseId: classId,
        semesterId: typeof semesterId === 'number' && !Number.isNaN(semesterId) ? semesterId : undefined,
      });

      setCurrentUserId(moderationData.currentUserId);
      setIsAdmin(moderationData.isAdmin);
      setPosts(moderationData.posts);
      setAdminClasses(moderationData.adminClasses);
      setBannedUsersByCourse(moderationData.bannedUsersByCourse);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load class moderation data.');
    } finally {
      setLoading(false);
    }
  }, [classId, semesterId]);

  useEffect(() => {
    void loadClassDashboard();
  }, [loadClassDashboard]);

  const selectedClass = useMemo(() => {
    if (typeof semesterId === 'number' && !Number.isNaN(semesterId)) {
      return adminClasses.find((courseClass) => courseClass.courseId === classId && courseClass.semesterId === semesterId);
    }

    return adminClasses.find((courseClass) => courseClass.courseId === classId);
  }, [adminClasses, classId, semesterId]);

  const sortedPosts = useMemo(
    () =>
      [...posts].sort((a, b) => {
        if (a.reportCount !== b.reportCount) return b.reportCount - a.reportCount;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }),
    [posts],
  );

  const reportedCount = useMemo(() => posts.filter((post) => post.reportCount > 0).length, [posts]);

  const refreshAfterAction = async (action: () => Promise<void> | void) => {
    try {
      setError(null);
      await action();
      await loadClassDashboard();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Moderation action failed.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-100 px-6">
        <p className="text-zinc-500">Loading class moderation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-100 px-6">
        <div className="max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-800">Class Moderation Unavailable</h1>
          <p className="text-zinc-600">{error}</p>
          <Link href="/admin" className="mt-4 inline-block font-semibold text-red-800 hover:underline">
            Back to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-100 px-6">
        <div className="max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-800">Admin Access Required</h1>
          <p className="text-zinc-600">This page is only available to users with `Users.is_admin = true`.</p>
          <Link href="/admin" className="mt-4 inline-block font-semibold text-red-800 hover:underline">
            Back to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (Number.isNaN(classId) || !selectedClass) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-100 px-6">
        <div className="max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-800">Class Not Found</h1>
          <p className="text-zinc-600">This class does not have moderation data for the selected semester.</p>
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
          <p className="mt-2 text-zinc-600">
            {selectedClass.title} · {selectedClass.semesterLabel}
          </p>
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
              No notes available for this class.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
