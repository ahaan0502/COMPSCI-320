'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  Flag,
  MessageSquare,
  Paperclip,
  Share2,
} from 'lucide-react';
import { type NotePost, type PostVisibility } from '../../components/NoteCard';
import { deleteModerationComment, isUserBannedFromCourse } from '../../lib/moderation';

interface SupabasePostRow {
  post_id: number;
  created_at: string;
  author_id: string;
  title: string | null;
  body: string | null;
  purpose: string | null;
  visibility: PostVisibility;
  group_id: number | null;
  tags: string[] | null;
  votes: number | null;
  updated_at: string | null;
  course_id: number | null;
  semester_id: number | null;
  is_report: boolean | null;
  attachment_url: string | null;
  Users:
    | { name: string | null; email: string | null }[]
    | { name: string | null; email: string | null }
    | null;
  Courses:
    | { course_number: string | null; title: string | null }[]
    | { course_number: string | null; title: string | null }
    | null;
  Semesters:
    | { term: string | null; year: string | null }[]
    | { term: string | null; year: string | null }
    | null;
}

interface CommentRow {
  id: number;
  body: string;
  created_at: string;
  author_id: string;
}

interface CommentAuthorRow {
  author_id: string;
  name: string | null;
  email: string | null;
}

interface CommentItem {
  id: number;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
}

type ShareState = 'idle' | 'copied' | 'error';

function firstRelation<T>(value: T[] | T | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatRelativeTime(timestamp: string): string {
  const deltaMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(deltaMs / (1000 * 60));

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getAttachmentName(url: string) {
  return decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'attachment');
}

function getAttachmentKind(url: string): 'image' | 'pdf' | 'other' {
  const lower = url.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/.test(lower)) return 'image';
  if (/\.pdf(\?|#|$)/.test(lower)) return 'pdf';
  return 'other';
}

export default function PostDetailPage() {
  const params = useParams<{ postId: string }>();
  const router = useRouter();
  const postId = Number(Array.isArray(params.postId) ? params.postId[0] : params.postId);

  const client = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  const [post, setPost] = useState<NotePost | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userVote, setUserVote] = useState<1 | -1 | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [commentDraft, setCommentDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [shareState, setShareState] = useState<ShareState>('idle');
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      if (!Number.isFinite(postId)) {
        setError('Invalid post id.');
        setLoading(false);
        return;
      }

      const {
        data: { session },
      } = await client.auth.getSession();

      const userId = session?.user?.id ?? '';
      setCurrentUserId(userId);

      if (userId) {
        const { data: profile } = await client
          .from('Users')
          .select('is_admin')
          .eq('author_id', userId)
          .maybeSingle();

        setIsCurrentUserAdmin(profile?.is_admin === true);
      } else {
        setIsCurrentUserAdmin(false);
      }

      const { data: postData, error: postError } = await client
        .from('Posts')
        .select(`
          post_id,
          created_at,
          author_id,
          title,
          body,
          purpose,
          visibility,
          group_id,
          tags,
          votes,
          updated_at,
          course_id,
          semester_id,
          is_report,
          attachment_url,
          Users (
            name,
            email
          ),
          Courses (
            course_number,
            title
          ),
          Semesters (
            term,
            year
          )
        `)
        .eq('post_id', postId)
        .eq('is_report', false)
        .maybeSingle();

      if (postError) {
        setError('Failed to load post.');
        setLoading(false);
        return;
      }

      if (!postData) {
        setError('Post not found.');
        setLoading(false);
        return;
      }

      const row = postData as SupabasePostRow;
      const user = firstRelation(row.Users);
      const course = firstRelation(row.Courses);
      const semester = firstRelation(row.Semesters);

      setPost({
        id: row.post_id,
        created_at: row.created_at,
        author_id: row.author_id,
        title: row.title ?? '',
        body: row.body ?? '',
        purpose: row.purpose,
        visibility: row.visibility,
        group_id: row.group_id,
        tags: row.tags ?? [],
        votes: row.votes ?? 0,
        updated_at: row.updated_at ?? row.created_at,
        is_deleted: false,
        course_id: row.course_id,
        semester_id: row.semester_id,
        is_report: row.is_report ?? false,
        attachment_url: row.attachment_url,
        author_name: user?.name ?? user?.email ?? 'Unknown',
        author_email: user?.email ?? '',
        course_label: `${course?.course_number ?? ''}${course?.title ? ` - ${course.title}` : ''}`.trim() || 'Unknown course',
        semester_label: `${semester?.term ?? ''} ${semester?.year ?? ''}`.trim() || 'Unknown semester',
        comments_count: 0,
      });

      if (session?.user) {
        const { data: voteRow } = await client
          .from('Post_Votes')
          .select('value')
          .eq('user_id', session.user.id)
          .eq('post_id', postId)
          .maybeSingle();

        setUserVote((voteRow as { value: 1 | -1 } | null)?.value ?? null);
      }

      setCommentsLoading(true);
      const { data: commentsData, error: commentsFetchError } = await client
        .from('Comments')
        .select('id, body, created_at, author_id')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsFetchError) {
        setCommentsError('Failed to load comments.');
        setCommentsLoading(false);
      } else {
        const authorIds = Array.from(
          new Set(
            ((commentsData || []) as CommentRow[])
              .map((comment) => comment.author_id)
              .filter((authorId): authorId is string => Boolean(authorId)),
          ),
        );

        const authorsById = new Map<string, CommentAuthorRow>();
        if (authorIds.length > 0) {
          const { data: authorRows } = await client
            .from('Users')
            .select('author_id, name, email')
            .in('author_id', authorIds);

          for (const author of (authorRows || []) as CommentAuthorRow[]) {
            authorsById.set(author.author_id, author);
          }
        }

        const mappedComments = ((commentsData || []) as CommentRow[]).map((comment) => {
          const commenter = authorsById.get(comment.author_id);
          return {
            id: comment.id,
            body: comment.body,
            createdAt: comment.created_at,
            authorId: comment.author_id,
            authorName: commenter?.name ?? 'Unknown',
            authorEmail: commenter?.email ?? '',
          };
        });

        setComments(mappedComments);
        setCommentCount(mappedComments.length);
        setCommentsLoading(false);
      }

      setLoading(false);
    };

    void loadPost();
  }, [client, postId]);

  useEffect(() => {
    if (shareState === 'idle') return;
    const timeoutId = window.setTimeout(() => setShareState('idle'), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [shareState]);

  const handleVote = async (value: 1 | -1) => {
    if (!post || !currentUserId) return;

    const existingVote = userVote;
    const isSameVote = existingVote === value;
    const delta = isSameVote ? -value : existingVote !== null ? value * 2 : value;

    setPost((current) => (current ? { ...current, votes: current.votes + delta } : current));
    setUserVote(isSameVote ? null : value);

    if (isSameVote) {
      await client.from('Post_Votes').delete().eq('user_id', currentUserId).eq('post_id', post.id);
    } else if (existingVote !== null) {
      await client.from('Post_Votes').update({ value }).eq('user_id', currentUserId).eq('post_id', post.id);
    } else {
      await client.from('Post_Votes').insert({ user_id: currentUserId, post_id: post.id, value });
    }

    await client.from('Posts').update({ votes: post.votes + delta }).eq('post_id', post.id);
  };

  const handleShare = async () => {
    if (typeof window === 'undefined' || !post) return;

    const shareUrl = new URL(`/notes/${post.id}`, window.location.origin);
    const shareData = {
      title: post.title,
      text: `${post.title} · ${post.course_label}`,
      url: shareUrl.toString(),
    };

    try {
      if (typeof navigator.share === 'function') {
        await navigator.share(shareData);
        setShareState('copied');
        return;
      }

      await navigator.clipboard.writeText(shareData.url);
      setShareState('copied');
    } catch {
      try {
        await navigator.clipboard.writeText(shareData.url);
        setShareState('copied');
      } catch {
        setShareState('error');
      }
    }
  };

  const handleSubmitComment = async () => {
    if (!post) return;

    const body = commentDraft.trim();
    if (!body || !currentUserId) return;

    if (post.course_id !== null && (await isUserBannedFromCourse(post.course_id, currentUserId))) {
      setCommentsError('You are banned from commenting in this class.');
      return;
    }

    setIsSubmittingComment(true);
    setCommentsError(null);

    const { error: commentError } = await client.from('Comments').insert({
      post_id: post.id,
      author_id: currentUserId,
      body,
    });

    if (commentError) {
      setCommentsError(commentError.message || 'Failed to post comment.');
      setIsSubmittingComment(false);
      return;
    }

    const {
      data: { session },
    } = await client.auth.getSession();

    const authorName =
      session?.user?.user_metadata?.full_name ||
      session?.user?.user_metadata?.name ||
      session?.user?.email?.split('@')[0] ||
      'You';

    setComments((prev) => [
      ...prev,
      {
        id: Date.now(),
        body,
        createdAt: new Date().toISOString(),
        authorId: currentUserId,
        authorName,
        authorEmail: session?.user?.email ?? '',
      },
    ]);
    setCommentCount((prev) => prev + 1);
    setCommentDraft('');
    setIsSubmittingComment(false);
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!isCurrentUserAdmin) return;

    try {
      await deleteModerationComment(commentId);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      setCommentCount((prev) => Math.max(prev - 1, 0));
    } catch (deleteError) {
      setCommentsError(deleteError instanceof Error ? deleteError.message : 'Failed to delete comment.');
    }
  };

  const handleAttachmentOpen = async (url: string) => {
    window.open(url, '_blank', 'noreferrer');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-600 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-12 shadow-sm">
          <p className="text-2xl font-bold text-zinc-800">Loading post...</p>
          <p className="mt-2 text-sm text-zinc-500">Preparing the discussion thread.</p>
        </div>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-zinc-900">{error || 'Post not found.'}</p>
          <button
            type="button"
            onClick={() => router.push('/notes')}
            className="mt-4 rounded-full bg-[#7A1F1F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5e1717]"
          >
            Back to Notes
          </button>
        </div>
      </main>
    );
  }

  const attachmentKind = post.attachment_url ? getAttachmentKind(post.attachment_url) : 'other';
  const reportQuery = new URLSearchParams({
    postId: String(post.id),
    postTitle: post.title,
    courseName: post.course_label,
    semesterName: post.semester_label,
    authorName: post.author_name || post.author_email,
    authorEmail: post.author_email,
  }).toString();

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.push('/notes')}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-100"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Notes
        </button>

        <article className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-stretch">
            <aside className="flex w-18 shrink-0 flex-col items-center border-r border-zinc-200 px-2 py-5">
              <button
                type="button"
                onClick={() => void handleVote(1)}
                className={`rounded-full p-2 transition hover:bg-zinc-100 ${
                  userVote === 1 ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-800'
                }`}
                aria-label="Upvote"
                aria-pressed={userVote === 1}
                disabled={!currentUserId}
              >
                <ArrowUp className="h-5 w-5" />
              </button>
              <span className="px-3 py-2 text-xl font-bold text-orange-500">{post.votes}</span>
              <button
                type="button"
                onClick={() => void handleVote(-1)}
                className={`rounded-full p-2 transition hover:bg-zinc-100 ${
                  userVote === -1 ? 'text-blue-500' : 'text-zinc-500 hover:text-zinc-800'
                }`}
                aria-label="Downvote"
                aria-pressed={userVote === -1}
                disabled={!currentUserId}
              >
                <ArrowDown className="h-5 w-5" />
              </button>
            </aside>

            <div className="flex-1 p-5 sm:p-6 lg:p-8">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">{post.course_label}</span>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">{post.semester_label}</span>
                <span className={`rounded-full px-3 py-1 ${post.visibility === 'private' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {post.visibility === 'private' ? 'Private' : 'Public'}
                </span>
                {post.purpose && <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">{post.purpose}</span>}
              </div>

              <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">{post.title}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                    <span>
                      Posted by{' '}
                      <Link
                        href={`/profile/${post.author_id}`}
                        className="font-semibold text-zinc-800 underline-offset-4 transition hover:text-zinc-950 hover:underline"
                      >
                        {post.author_name || post.author_email || 'Unknown'}
                      </Link>
                    </span>
                    <span className="text-zinc-300">·</span>
                    <span>{formatRelativeTime(post.created_at)}</span>
                    <span className="text-zinc-300">·</span>
                    <span>{commentCount} comments</span>
                  </div>
                </div>
              </div>

              {post.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-6 whitespace-pre-wrap text-[1.05rem] leading-8 text-zinc-800">{post.body}</div>

              {post.attachment_url && (
                <section className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-zinc-500">
                      <Paperclip className="h-4 w-4" />
                      Attachment
                    </h2>
                    <button
                      type="button"
                      onClick={() => void handleAttachmentOpen(post.attachment_url!)}
                      className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                    >
                      Open file
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                    {attachmentKind === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.attachment_url}
                        alt={getAttachmentName(post.attachment_url)}
                        className="w-full object-contain bg-zinc-950/5"
                        style={{ maxHeight: '36rem' }}
                      />
                    ) : attachmentKind === 'pdf' ? (
                      <iframe
                        title={getAttachmentName(post.attachment_url)}
                        src={post.attachment_url}
                        className="w-full border-0"
                        style={{ height: '36rem' }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center text-zinc-600">
                        <Paperclip className="h-10 w-10 text-zinc-400" />
                        <p className="text-sm font-medium">Preview not available for this file type.</p>
                        <p className="max-w-xl text-sm text-zinc-500">{getAttachmentName(post.attachment_url)}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-4 text-zinc-600">
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 font-medium transition hover:text-zinc-900"
                >
                  <Share2 className="h-4 w-4" />
                  <span>{shareState === 'copied' ? 'Link Copied' : 'Share'}</span>
                </button>
                <Link href={`/report-post?${reportQuery}`} className="inline-flex items-center gap-1.5 font-medium text-red-700 transition hover:text-red-900">
                  <Flag className="h-4 w-4" />
                  <span>Report</span>
                </Link>
                <span className="inline-flex items-center gap-1.5 font-medium text-zinc-500">
                  <MessageSquare className="h-4 w-4" />
                  <span>{commentCount} Comments</span>
                </span>
              </div>

              {shareState === 'error' && <p className="mt-3 text-sm text-red-600">Unable to share this post right now.</p>}
            </div>
          </div>
        </article>

        <section className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-500">Comments</h2>
            <span className="text-xs font-medium text-zinc-400">{commentCount} total</span>
          </div>

          <div className="space-y-3">
            {commentsLoading && <p className="text-sm text-zinc-500">Loading comments...</p>}

            {!commentsLoading &&
              comments.map((comment) => {
                const commenterLabel = comment.authorName || comment.authorEmail || 'Unknown';

                return (
                  <article key={comment.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 shadow-sm">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Link
                          href={`/profile/${comment.authorId}`}
                          className="font-semibold text-zinc-800 underline-offset-4 transition hover:text-zinc-950 hover:underline"
                        >
                          {commenterLabel}
                        </Link>
                        {currentUserId === comment.authorId && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                            You
                          </span>
                        )}
                        <span className="text-zinc-400">·</span>
                        <span className="text-zinc-500">{formatRelativeTime(comment.createdAt)}</span>
                      </div>
                      {isCurrentUserAdmin && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteComment(comment.id)}
                          className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700">{comment.body}</p>
                  </article>
                );
              })}
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <label htmlFor={`comment-${post.id}`} className="mb-2 block text-sm font-semibold text-zinc-700">
              Add a comment
            </label>
            <textarea
              id={`comment-${post.id}`}
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder="Share a helpful clarification, answer, or follow-up."
              rows={4}
              className="w-full resize-none rounded-2xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-red-700 focus:bg-white"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-zinc-400">Commenters can be viewed from their profile.</p>
              <button
                type="button"
                onClick={() => void handleSubmitComment()}
                disabled={isSubmittingComment || commentDraft.trim().length === 0 || !currentUserId}
                className="rounded-full bg-[#7A1F1F] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5e1717] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>

          {commentsError && <p className="mt-3 text-sm text-red-600">{commentsError}</p>}
        </section>
      </div>
    </main>
  );
}
