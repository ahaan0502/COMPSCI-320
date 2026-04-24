'use client';

import { useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, CircleCheck, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import type { AdminPost } from '../lib/moderation';

interface ModerationPostCardProps {
  post: AdminPost;
  isAuthorBanned: boolean;
  onSaveEdit: (postId: number, updates: { title: string; body: string }) => Promise<void> | void;
  onDelete: (postId: number) => Promise<void> | void;
  onResolveReports: (postId: number) => Promise<void> | void;
  onBanUser: (classId: number, userId: string) => Promise<void> | void;
  onUnbanUser: (classId: number, userId: string) => Promise<void> | void;
}

export default function ModerationPostCard({
  post,
  isAuthorBanned,
  onSaveEdit,
  onDelete,
  onResolveReports,
  onBanUser,
  onUnbanUser,
}: ModerationPostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(post.title);
  const [bodyDraft, setBodyDraft] = useState(post.body);

  const handleSave = async () => {
    const nextTitle = titleDraft.trim() || post.title;
    const nextBody = bodyDraft.trim() || post.body;
    try {
      await onSaveEdit(post.id, { title: nextTitle, body: nextBody });
      setIsEditing(false);
    } catch {
      // Parent handles surfaced moderation errors.
    }
  };

  const canModerateAuthor = post.course_id !== null;

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex gap-4">
        <div className="hidden min-w-10 flex-col items-center text-zinc-400 sm:flex">
          <button type="button" className="rounded p-1 transition hover:bg-zinc-100 hover:text-zinc-700" aria-label="Upvote">
            <ArrowUp className="h-4 w-4" />
          </button>
          <span className="my-1 text-lg font-semibold text-orange-500">{post.votes}</span>
          <button type="button" className="rounded p-1 transition hover:bg-zinc-100 hover:text-zinc-700" aria-label="Downvote">
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
            {post.is_report && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 font-semibold text-red-700">
                <AlertTriangle className="h-4 w-4" />
                Reported x{post.reportCount}
              </span>
            )}
            <span className="rounded-full bg-zinc-100 px-3 py-1 font-semibold text-zinc-700">{post.course_label}</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 font-semibold text-zinc-700">{post.semester_label}</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
              {post.visibility === 'private' ? 'Private' : 'Public'}
            </span>
            <span>Posted by {post.author_email}</span>
          </div>

          {post.is_report && post.reportReason && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-zinc-700">
              <p>
                <span className="font-semibold text-red-700">Report reason:</span> {post.reportReason}
              </p>
            </div>
          )}

          {isAuthorBanned && (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-zinc-700">
              <p className="font-semibold text-amber-700">This user is currently banned from posting in this class.</p>
            </div>
          )}

          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800 outline-none focus:border-red-700"
              />
              <textarea
                value={bodyDraft}
                onChange={(event) => setBodyDraft(event.target.value)}
                className="h-32 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800 outline-none focus:border-red-700"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-lg bg-red-800 px-4 py-2 text-sm font-semibold text-white hover:bg-red-900"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTitleDraft(post.title);
                    setBodyDraft(post.body);
                    setIsEditing(false);
                  }}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-zinc-800">{post.title}</h3>
              <p className="mt-2 whitespace-pre-wrap text-zinc-700">{post.body}</p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-zinc-600">
              <MessageSquare className="h-4 w-4" />
              <span>{post.comments_count} Comments</span>
            </span>

            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                <Pencil className="h-4 w-4" />
                Edit Post
              </button>
            )}

            <button
              type="button"
              onClick={() => onDelete(post.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
              Delete Post
            </button>

            {post.reportCount > 0 && (
              <button
                type="button"
                onClick={() => onResolveReports(post.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                <CircleCheck className="h-4 w-4" />
                Resolve Reports
              </button>
            )}

            {canModerateAuthor && !isAuthorBanned && (
              <button
                type="button"
                onClick={() => onBanUser(post.course_id!, post.author_id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100"
              >
                <AlertTriangle className="h-4 w-4" />
                Ban User
              </button>
            )}

            {canModerateAuthor && isAuthorBanned && (
              <button
                type="button"
                onClick={() => onUnbanUser(post.course_id!, post.author_id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                <CircleCheck className="h-4 w-4" />
                Unban User
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
