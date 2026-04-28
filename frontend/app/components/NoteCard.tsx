"use client";

import {
  Paperclip,
  ArrowDown,
  ArrowUp,
  Flag,
  MessageSquare,
  Pencil,
  Share2,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type PostVisibility = "public" | "private";

export interface NotePost {
  id: number;
  created_at: string;
  author_id: string;
  title: string;
  body: string;
  purpose: string | null;
  visibility: PostVisibility;
  group_id: number | null;
  tags: string[];
  votes: number;
  updated_at: string;
  is_deleted: boolean;
  course_id: number | null;
  semester_id: number | null;
  is_report: boolean;
  attachment_url?: string | null;
  author_name: string;
  author_email: string;
  course_label: string;
  semester_label: string;
  comments_count: number;
}

interface NoteCardProps {
  post: NotePost;
  currentUserId?: string;
  userVote?: 1 | -1 | null;
  onVote?: (postId: number, value: 1 | -1) => Promise<void>;
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

type ShareState = "idle" | "copied" | "error";

function formatRelativeTime(timestamp: string): string {
  const deltaMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(deltaMs / (1000 * 60));

  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NoteCard({ post, userVote = null, onVote }: NoteCardProps) {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentCount, setCommentCount] = useState(post.comments_count);
  const [commentDraft, setCommentDraft] = useState("");
  const [currentSessionUserId, setCurrentSessionUserId] = useState<string | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [shareState, setShareState] = useState<ShareState>("idle");

  const reportQuery = new URLSearchParams({
    postId: String(post.id),
    postTitle: post.title,
    courseName: post.course_label,
    semesterName: post.semester_label,
    authorName: post.author_name || post.author_email,
    authorEmail: post.author_email,
  }).toString();

  const visibilityClasses =
    post.visibility === "private"
      ? "bg-violet-100 text-violet-700"
      : "bg-emerald-100 text-emerald-700";
  const authorLabel = post.author_name || post.author_email || "Unknown";
  const attachmentName = post.attachment_url
    ? decodeURIComponent(post.attachment_url.split("/").pop()?.split("?")[0] || "attachment")
    : null;

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setCurrentSessionUserId(session?.user?.id ?? null);
    };

    void loadSession();
  }, [supabase]);

  useEffect(() => {
    if (shareState === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShareState("idle");
    }, 2200);

    return () => window.clearTimeout(timeoutId);
  }, [shareState]);

  const loadComments = async () => {
    setCommentsLoading(true);
    setCommentsError(null);

    const { data, error } = await supabase
      .from("Comments")
      .select("id, body, created_at, author_id")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });

    if (error) {
      setCommentsError("Failed to load comments.");
      setCommentsLoading(false);
      return;
    }

    const authorIds = Array.from(
      new Set(
        ((data || []) as CommentRow[])
          .map((comment) => comment.author_id)
          .filter((authorId): authorId is string => Boolean(authorId)),
      ),
    );

    const authorsById = new Map<string, CommentAuthorRow>();

    if (authorIds.length > 0) {
      const { data: authorRows, error: authorsError } = await supabase
        .from("Users")
        .select("author_id, name, email")
        .in("author_id", authorIds);

      if (!authorsError) {
        for (const author of (authorRows || []) as CommentAuthorRow[]) {
          authorsById.set(author.author_id, author);
        }
      }
    }

    const mappedComments = ((data || []) as CommentRow[]).map((comment) => {
      const user = authorsById.get(comment.author_id);

      return {
        id: comment.id,
        body: comment.body,
        createdAt: comment.created_at,
        authorId: comment.author_id,
        authorName: user?.name ?? "Unknown",
        authorEmail: user?.email ?? "",
      };
    });

    setComments(mappedComments);
    setCommentCount(mappedComments.length);
    setCommentsLoaded(true);
    setCommentsLoading(false);
  };

  const handleToggleComments = async () => {
    const nextIsOpen = !isCommentsOpen;
    setIsCommentsOpen(nextIsOpen);

    if (nextIsOpen && !commentsLoaded) {
      await loadComments();
    }
  };

  const handleSubmitComment = async () => {
    const body = commentDraft.trim();
    if (!body) {
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setCommentsError("Please sign in before commenting.");
      return;
    }

    setIsSubmittingComment(true);
    setCommentsError(null);

    const { error } = await supabase.from("Comments").insert({
      post_id: post.id,
      author_id: session.user.id,
      body,
    });

    if (error) {
      setCommentsError(error.message || "Failed to post comment.");
      setIsSubmittingComment(false);
      return;
    }

    const authorName =
      session.user.user_metadata?.full_name ||
      session.user.user_metadata?.name ||
      session.user.email?.split("@")[0] ||
      "You";

    const authorEmail = session.user.email ?? "";

    setComments((prev) => [
      ...prev,
      {
        id: Date.now(),
        body,
        createdAt: new Date().toISOString(),
        authorId: session.user.id,
        authorName,
        authorEmail,
      },
    ]);
    setCommentCount((prev) => prev + 1);
    setCommentDraft("");
    setCommentsLoaded(true);
    setCurrentSessionUserId(session.user.id);
    setIsSubmittingComment(false);
  };

  const handleShare = async () => {
    if (typeof window === "undefined") {
      return;
    }

    const shareUrl = new URL(window.location.href);
    shareUrl.hash = `post-${post.id}`;

    const shareData = {
      title: post.title,
      text: `${post.title} · ${post.course_label}`,
      url: shareUrl.toString(),
    };

    try {
      if (typeof navigator.share === "function") {
        await navigator.share(shareData);
        setShareState("copied");
        return;
      }

      await navigator.clipboard.writeText(shareData.url);
      setShareState("copied");
    } catch {
      try {
        await navigator.clipboard.writeText(shareData.url);
        setShareState("copied");
      } catch {
        setShareState("error");
      }
    }
  };

  return (
    <article
      id={`post-${post.id}`}
      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5"
    >
      <div className="flex gap-4">
        <div className="hidden min-w-10 flex-col items-center text-zinc-400 sm:flex">
          <button
            type="button"
            onClick={() => onVote?.(post.id, 1)}
            disabled={!onVote}
            className={`rounded p-1 transition hover:bg-zinc-100 ${
              userVote === 1 ? "text-orange-500" : "hover:text-zinc-700"
            }`}
            aria-label="Upvote"
            aria-pressed={userVote === 1}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <span className="my-1 text-lg font-semibold text-orange-500">{post.votes}</span>
          <button
            type="button"
            onClick={() => onVote?.(post.id, -1)}
            disabled={!onVote}
            className={`rounded p-1 transition hover:bg-zinc-100 ${
              userVote === -1 ? "text-blue-500" : "hover:text-zinc-700"
            }`}
            aria-label="Downvote"
            aria-pressed={userVote === -1}
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <span className="rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-700">
              {post.course_label}
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-700">
              {post.semester_label}
            </span>
            <span className={`rounded-full px-3 py-1 font-medium ${visibilityClasses}`}>
              {post.visibility === "private" ? "Private" : "Public"}
            </span>
            <span>
              Posted by{" "}
              <Link
                href={`/profile/${post.author_id}`}
                className="font-medium text-zinc-700 underline-offset-4 transition hover:text-zinc-900 hover:underline"
              >
                {authorLabel}
              </Link>{" "}
              · {formatRelativeTime(post.created_at)}
            </span>
          </div>

          <h2 className="mb-2 text-2xl font-bold tracking-tight text-zinc-800">{post.title}</h2>
          <p className="mb-4 whitespace-pre-wrap text-[1.03rem] leading-relaxed text-zinc-700">
            {post.body}
          </p>

          {post.attachment_url && (
            <div className="mb-4">
              <a
                href={post.attachment_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900"
              >
                <Paperclip className="h-4 w-4" />
                <span className="max-w-[20rem] truncate">{attachmentName || "View attachment"}</span>
              </a>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-zinc-600">
            <button
              type="button"
              onClick={() => void handleToggleComments()}
              className="inline-flex items-center gap-1.5 font-medium transition hover:text-zinc-900"
              aria-expanded={isCommentsOpen}
            >
              <MessageSquare className="h-4 w-4" />
              <span>{commentCount} Comments</span>
            </button>
            <button
              type="button"
              onClick={() => void handleShare()}
              className="inline-flex items-center gap-1.5 font-medium transition hover:text-zinc-900"
            >
              <Share2 className="h-4 w-4" />
              <span>{shareState === "copied" ? "Link Copied" : "Share"}</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 font-medium transition hover:text-zinc-900"
            >
              <Pencil className="h-4 w-4" />
              <span>Suggest Edit</span>
            </button>
            <Link
              href={`/report-post?${reportQuery}`}
              className="inline-flex items-center gap-1.5 font-medium text-red-700 transition hover:text-red-900"
            >
              <Flag className="h-4 w-4" />
              <span>Report</span>
            </Link>
          </div>

          {shareState === "error" && (
            <p className="mt-3 text-sm text-red-600">Unable to share this post right now.</p>
          )}

          {isCommentsOpen && (
            <section className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-500">
                  Discussion
                </h3>
                <span className="text-xs font-medium text-zinc-400">{commentCount} total</span>
              </div>

              <div className="space-y-3">
                {commentsLoading && (
                  <p className="text-sm text-zinc-500">Loading comments...</p>
                )}

                {!commentsLoading &&
                  comments.map((comment) => {
                    const commenterLabel =
                      comment.authorName || comment.authorEmail || "Unknown";

                    return (
                      <article
                        key={comment.id}
                        className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                          <Link
                            href={`/profile/${comment.authorId}`}
                            className="font-semibold text-zinc-800 underline-offset-4 transition hover:text-zinc-950 hover:underline"
                          >
                            {commenterLabel}
                          </Link>
                          {currentSessionUserId === comment.authorId && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                              You
                            </span>
                          )}
                          <span className="text-zinc-400">·</span>
                          <span className="text-zinc-500">
                            {formatRelativeTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                          {comment.body}
                        </p>
                      </article>
                    );
                  })}
              </div>

              <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
                <label htmlFor={`comment-${post.id}`} className="mb-2 block text-sm font-semibold text-zinc-700">
                  Add a comment
                </label>
                <textarea
                  id={`comment-${post.id}`}
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="Share a helpful clarification, answer, or follow-up."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-red-700 focus:bg-white"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-zinc-400">
                    Commenters can be viewed from their profile.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleSubmitComment()}
                    disabled={isSubmittingComment || commentDraft.trim().length === 0}
                    className="rounded-full bg-[#7A1F1F] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5e1717] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmittingComment ? "Posting..." : "Post Comment"}
                  </button>
                </div>
              </div>

              {commentsError && (
                <p className="mt-3 text-sm text-red-600">{commentsError}</p>
              )}
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
