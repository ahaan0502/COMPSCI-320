"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useMemo, useState } from "react";
import NoteCard, { type NotePost, type PostVisibility } from "../components/NoteCard";
import { canViewPost } from "../lib/postVisibility";

interface SavedPostRow {
  post_id: number;
  created_at: string;
  author_id: string;
  title: string | null;
  body: string | null;
  purpose: string | null;
  visibility: PostVisibility;
  group_id: number | null;
  tags: string[];
  votes: number | null;
  updated_at: string;
  course_id: number | null;
  semester_id: number | null;
  is_report: boolean | null;
  share_token: string | null;
  attachment_url: string | null;
  Users:
    | {
        name: string | null;
        email: string | null;
      }[]
    | {
        name: string | null;
        email: string | null;
      }
    | null;
  Courses:
    | {
        course_number: string | null;
        title: string | null;
      }[]
    | {
        course_number: string | null;
        title: string | null;
      }
    | null;
  Semesters:
    | {
        term: string | null;
        year: string | null;
      }[]
    | {
        term: string | null;
        year: string | null;
      }
    | null;
}

interface SavedNoteRow {
  post_id: number;
  created_at: string;
  Posts:
    | SavedPostRow[]
    | SavedPostRow
    | null;
}

function firstRelation<T>(value: T[] | T | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function mapPost(post: SavedPostRow): NotePost {
  const user = firstRelation(post.Users);
  const course = firstRelation(post.Courses);
  const semester = firstRelation(post.Semesters);

  return {
    id: post.post_id,
    created_at: post.created_at,
    author_id: post.author_id,
    title: post.title ?? "",
    body: post.body ?? "",
    purpose: post.purpose,
    visibility: post.visibility,
    group_id: post.group_id,
    tags: post.tags ?? [],
    votes: post.votes ?? 0,
    updated_at: post.updated_at,
    is_deleted: false,
    course_id: post.course_id,
    semester_id: post.semester_id,
    is_report: post.is_report ?? false,
    share_token: post.share_token,
    attachment_url: post.attachment_url,
    author_name: user?.name ?? "Unknown",
    author_email: user?.email ?? "",
    course_label: `${course?.course_number ?? "Unknown course"} - ${course?.title ?? "Untitled course"}`,
    semester_label: `${semester?.term ?? ""} ${semester?.year ?? ""}`.trim() || "Unknown semester",
    comments_count: 0,
  };
}

export default function SavedNotesPage() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  const [savedPosts, setSavedPosts] = useState<NotePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSavedNotes = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        if (!cancelled) {
          setError("Please sign in to view saved notes.");
          setLoading(false);
        }
        return;
      }

      const { data: savedRows, error: savedError } = await supabase
        .from("savednotes")
        .select(
          `
        post_id,
        created_at,
        Posts (
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
          share_token,
          attachment_url,
          Users!posts_author_id_fkey (
            name,
            email
          ),
          Courses!Posts_course_id_fkey (
            course_number,
            title
          ),
          Semesters!Posts_semester_id_fkey (
            term,
            year
          )
        )
      `,
        )
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (savedError) {
        if (!cancelled) {
          setError("Failed to load saved notes.");
          setLoading(false);
        }
        return;
      }

      const mapped = ((savedRows || []) as SavedNoteRow[])
        .map((row) => {
          const post = firstRelation(row.Posts);
          if (!post || post.is_report) return null;
          const mappedPost = mapPost(post);
          return canViewPost(mappedPost, session.user.id) ? mappedPost : null;
        })
        .filter((post): post is NotePost => post !== null);

      if (!cancelled) {
        setSavedPosts(mapped);
        setLoading(false);
      }
    };

    void loadSavedNotes();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const handleUnsave = (postId: number) => {
    setSavedPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <p className="text-zinc-500">Loading saved notes...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-gray-50 px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-zinc-900">Saved Notes</h1>
        <p className="mt-2 text-zinc-600">All the notes you’ve bookmarked in one place.</p>
      </div>

      {savedPosts.length > 0 ? (
        <div className="flex flex-col gap-5">
          {savedPosts.map((post) => (
            <NoteCard
              key={post.id}
              post={post}
              onSavedChange={(_, isSaved) => {
                if (!isSaved) handleUnsave(post.id);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-20 text-center">
          <p className="text-lg font-semibold text-zinc-800">No saved notes yet</p>
          <p className="mt-2 text-zinc-500">Bookmark notes to see them here.</p>
        </div>
      )}
    </main>
  );
}
