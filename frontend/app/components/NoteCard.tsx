import {
  ArrowDown,
  ArrowUp,
  Flag,
  MessageSquare,
  Pencil,
  Share2,
} from "lucide-react";
import Link from "next/link";

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
  author_name: string;
  author_email: string;
  course_label: string;
  semester_label: string;
  comments_count: number;
}

interface NoteCardProps {
  post: NotePost;
}

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

export default function NoteCard({ post }: NoteCardProps) {
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

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
      <div className="flex gap-4">
        <div className="hidden min-w-10 flex-col items-center text-zinc-400 sm:flex">
          <button
            type="button"
            className="rounded p-1 transition hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Upvote"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <span className="my-1 text-lg font-semibold text-orange-500">{post.votes}</span>
          <button
            type="button"
            className="rounded p-1 transition hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Downvote"
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
              Posted by {post.author_email} · {formatRelativeTime(post.created_at)}
            </span>
          </div>

          <h2 className="mb-2 text-2xl font-bold tracking-tight text-zinc-800">{post.title}</h2>
          <p className="mb-4 whitespace-pre-wrap text-[1.03rem] leading-relaxed text-zinc-700">
            {post.body}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-zinc-600">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 font-medium transition hover:text-zinc-900"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{post.comments_count} Comments</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 font-medium transition hover:text-zinc-900"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
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
        </div>
      </div>
    </article>
  );
}
