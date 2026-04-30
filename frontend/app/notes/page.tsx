"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import NoteCard, { type NotePost, type PostVisibility } from "../components/NoteCard";

interface SidebarClassRow {
  course_id: number;
  Courses:
    | {
        course_id: number;
        course_number: string | null;
        title: string | null;
      }[]
    | {
        course_id: number;
        course_number: string | null;
        title: string | null;
      }
    | null;
  Semesters:
    | {
        semester_id: number;
        term: string | null;
        year: string | null;
      }[]
    | {
        semester_id: number;
        term: string | null;
        year: string | null;
      }
    | null;
}

function firstRelation<T>(value: T[] | T | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function SidebarClasses() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeClassId = searchParams.get("classId");
  const activeSemesterId = searchParams.get("semesterId");

  const [classes, setClasses] = useState<
    {
      courseId: number;
      semesterId: number;
      label: string;
      semesterLabel: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        setClasses([]);
        setLoading(false);
        setError("Supabase configuration is missing");
        return;
      }

      const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setClasses([]);
        setLoading(false);
        setError(null);
        return;
      }

      const { data, error: classError } = await supabase
        .from("Student_Enrolled_Courses")
        .select(
          `
          course_id,
          semester_id,
          Courses (
            course_id,
            course_number,
            title
          ),
          Semesters (
            semester_id,
            term,
            year
          )
        `,
        )
        .eq("author_id", session.user.id);

      if (classError) {
        console.error("Sidebar fetch error:", classError);
        setError("Failed to load classes");
        setLoading(false);
        return;
      }

      const rows = (data || []) as SidebarClassRow[];
      const mapped = rows
        .map((row) => {
          const course = firstRelation(row.Courses);
          const semester = firstRelation(row.Semesters);

          if (!course || !semester) return null;

          return {
            courseId: course.course_id,
            semesterId: semester.semester_id,
            label: `${course.course_number ?? ""} - ${course.title ?? ""}`,
            semesterLabel: `${semester.term ?? ""} ${semester.year ?? ""}`,
          };
        })
        .filter(
          (
            value,
          ): value is {
            courseId: number;
            semesterId: number;
            label: string;
            semesterLabel: string;
          } => value !== null,
        );

      setClasses(mapped);
      setLoading(false);
    };

    void fetchClasses();
  }, []);

  if (loading) {
    return (
      <aside className="rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-700 shadow-sm">
        <p className="text-zinc-500">Loading classes...</p>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="rounded-2xl border border-red-100 bg-red-50 p-5 text-zinc-700 shadow-sm">
        <p className="text-red-600">{error}</p>
      </aside>
    );
  }

  if (!classes.length) {
    return (
      <aside className="rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-700 shadow-sm">
        <h2 className="mb-6 text-3xl font-bold tracking-tight text-zinc-800">My Classes</h2>
        <p className="text-zinc-600">
          No classes found.{" "}
          <Link href="/catalogue/departments" className="font-bold text-[#7A1F1F]">
            Browse Course Catalog
          </Link>
        </p>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-700 shadow-sm">
      <h2 className="mb-4 text-2xl font-bold tracking-tight text-zinc-800">My Classes</h2>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => router.push("/notes")}
          className={`w-full rounded-md px-3 py-2 text-left text-sm ${
            !activeClassId ? "bg-zinc-100 font-semibold" : "hover:bg-zinc-50"
          }`}
        >
          All classes
        </button>
        {classes.map((c) => {
          const isActive = String(c.courseId) === activeClassId && String(c.semesterId) === activeSemesterId;
          return (
            <button
              key={`${c.courseId}-${c.semesterId}`}
              type="button"
              onClick={() => router.push(`/notes?classId=${c.courseId}&semesterId=${c.semesterId}`)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                isActive ? "bg-zinc-100 font-semibold" : "hover:bg-zinc-50"
              }`}
            >
              <div className="flex justify-between gap-3">
                <span>{c.label}</span>
                <span className="text-xs text-zinc-400">{c.semesterLabel}</span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

type FeedTab = "hot" | "new" | "top";

interface NotesFeedFilters {
  courseIds: number[];
  semesterIds: number[];
  visibility: PostVisibility[];
}

interface SupabasePostRow {
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
        department_id: number | null;
        course_number: string | null;
        title: string | null;
      }[]
    | {
        department_id: number | null;
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

const FEED_TABS: FeedTab[] = ["hot", "new", "top"];

const SIDEBAR_FILTERS_FROM_COMPONENT: NotesFeedFilters = {
  courseIds: [],
  semesterIds: [],
  visibility: [],
};

function applyFeedFilters(posts: NotePost[], searchQuery: string, filters: NotesFeedFilters): NotePost[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return posts.filter((post) => {
    if (post.is_deleted) return false;

    if (normalizedQuery.length > 0) {
      const inTitle = post.title.toLowerCase().includes(normalizedQuery);
      const inBody = post.body.toLowerCase().includes(normalizedQuery);
      if (!inTitle && !inBody) return false;
    }

    if (filters.courseIds.length > 0 && (post.course_id === null || !filters.courseIds.includes(post.course_id))) {
      return false;
    }

    if (filters.semesterIds.length > 0 && (post.semester_id === null || !filters.semesterIds.includes(post.semester_id))) {
      return false;
    }

    if (filters.visibility.length > 0 && !filters.visibility.includes(post.visibility)) {
      return false;
    }

    return true;
  });
}

function sortPosts(posts: NotePost[], tab: FeedTab): NotePost[] {
  switch (tab) {
    case "hot":
      return [...posts].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
    case "new":
      return [...posts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case "top":
      return [...posts].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
    default:
      return posts;
  }
}

function NotesPageContent() {
  const searchParams = useSearchParams();
  const selectedClassId = searchParams.get("classId");
  const selectedSemesterId = searchParams.get("semesterId");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FeedTab>("hot");
  const [posts, setPosts] = useState<NotePost[]>([]);
  const [userVotes, setUserVotes] = useState<Record<number, 1 | -1>>({});
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emptyReason, setEmptyReason] = useState<string | null>(null);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  const sidebarFilters = SIDEBAR_FILTERS_FROM_COMPONENT;

  useEffect(() => {
    const fetchPosts = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setError("Not logged in");
        setLoading(false);
        return;
      }

      setCurrentUserId(session.user.id);

      const { data: enrolledData, error: enrolledError } = await supabase
        .from("Student_Enrolled_Courses")
        .select("course_id, semester_id")
        .eq("author_id", session.user.id);

      if (enrolledError) {
        console.error("Enrolled courses error:", enrolledError);
        setError("Failed to load enrolled courses");
        setLoading(false);
        return;
      }

      let enrolledOfferings = (enrolledData || []) as { course_id: number; semester_id: number }[];

      if (selectedClassId) {
        const classId = Number(selectedClassId);
        const semesterId = selectedSemesterId ? Number(selectedSemesterId) : null;

        enrolledOfferings = enrolledOfferings.filter((offering) => {
          if (offering.course_id !== classId) return false;
          return semesterId === null || offering.semester_id === semesterId;
        });

        if (enrolledOfferings.length === 0) {
          setEmptyReason("That class is not in My Classes.");
          setPosts([]);
          setLoading(false);
          return;
        }
      }

      if (enrolledOfferings.length === 0) {
        setEmptyReason("Add a class before browsing notes.");
        setPosts([]);
        setLoading(false);
        return;
      }

      const enrolledOfferingKeys = new Set(
        enrolledOfferings.map((offering) => `${offering.course_id}:${offering.semester_id}`),
      );
      const enrolledCourseIds = Array.from(new Set(enrolledOfferings.map((offering) => offering.course_id)));
      const enrolledSemesterIds = Array.from(new Set(enrolledOfferings.map((offering) => offering.semester_id)));

      const { data: postsData, error: postsError } = await supabase
        .from("Posts")
        .select(
          `
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
            course_id,
            department_id,
            course_number,
            title
          ),
          Semesters (
            semester_id,
            term,
            year
          )
        `,
        )
        .in("course_id", enrolledCourseIds)
        .in("semester_id", enrolledSemesterIds)
        .eq("is_report", false);

      if (postsError) {
        console.error("Posts error:", postsError);
        setError("Failed to load posts");
        setLoading(false);
        return;
      }

      const mapped: NotePost[] = ((postsData || []) as SupabasePostRow[])
        .filter((post) => {
          if (typeof post.course_id !== "number" || typeof post.semester_id !== "number") return false;
          return enrolledOfferingKeys.has(`${post.course_id}:${post.semester_id}`);
        })
        .map((post) => {
          const user = Array.isArray(post.Users) ? post.Users[0] : post.Users;
          const course = Array.isArray(post.Courses) ? post.Courses[0] : post.Courses;
          const semester = Array.isArray(post.Semesters) ? post.Semesters[0] : post.Semesters;

          return {
            id: post.post_id,
            created_at: post.created_at,
            author_id: post.author_id,
            title: post.title ?? "",
            body: post.body ?? "",
            purpose: post.purpose,
            visibility: post.visibility as PostVisibility,
            group_id: post.group_id,
            tags: post.tags,
            votes: post.votes ?? 0,
            updated_at: post.updated_at,
            is_deleted: false,
            course_id: post.course_id,
            semester_id: post.semester_id,
            is_report: post.is_report ?? false,
            attachment_url: post.attachment_url,
            author_name: user?.name ?? "Unknown",
            author_email: user?.email ?? "",
            course_label: `${course?.course_number ?? ""} - ${course?.title ?? ""}`,
            semester_label: `${semester?.term ?? ""} ${semester?.year ?? ""}`,
            comments_count: 0,
          };
        });
      const postIds = mapped.map((p) => p.id);

      if (postIds.length > 0) {
        const [
          { data: votesData, error: votesError },
          { data: commentsData, error: commentsError },
        ] = await Promise.all([
          supabase
            .from("Post_Votes")
            .select("post_id, value")
            .eq("user_id", session.user.id)
            .in("post_id", postIds),
          supabase.from("Comments").select("post_id").in("post_id", postIds),
        ]);

        if (!votesError && votesData) {
          const votesMap: Record<number, 1 | -1> = {};
          for (const row of votesData as { post_id: number; value: 1 | -1 }[]) {
            votesMap[row.post_id] = row.value;
          }
          setUserVotes(votesMap);
        }

        if (!commentsError && commentsData) {
          const commentsCountByPost = new Map<number, number>();

          for (const row of commentsData as { post_id: number | null }[]) {
            if (typeof row.post_id !== "number") continue;
            commentsCountByPost.set(row.post_id, (commentsCountByPost.get(row.post_id) ?? 0) + 1);
          }

          for (const post of mapped) {
            post.comments_count = commentsCountByPost.get(post.id) ?? 0;
          }
        }
      }

      setPosts(mapped);
      setEmptyReason(mapped.length === 0 ? "No notes have been posted for these classes yet." : null);
      setLoading(false);
    };

    void fetchPosts();
  }, [selectedClassId, selectedSemesterId, supabase]);

  const handleVote = async (postId: number, value: 1 | -1) => {
    const existingVote = userVotes[postId] ?? null;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        let delta = 0;
        if (existingVote === value) {
          delta = -value;
        } else if (existingVote !== null) {
          delta = value * 2;
        } else {
          delta = value;
        }

        return { ...p, votes: p.votes + delta };
      }),
    );

    setUserVotes((prev) => {
      if (prev[postId] === value) {
        const next = { ...prev };
        delete next[postId];
        return next;
      }

      return { ...prev, [postId]: value };
    });

    try {
      if (existingVote === value) {
        await supabase.from("Post_Votes").delete().eq("user_id", currentUserId).eq("post_id", postId);
        await supabase.rpc("increment_votes", { post_id: postId, delta: -value });
      } else if (existingVote !== null) {
        await supabase
          .from("Post_Votes")
          .update({ value })
          .eq("user_id", currentUserId)
          .eq("post_id", postId);
        await supabase.rpc("increment_votes", { post_id: postId, delta: value * 2 });
      } else {
        await supabase.from("Post_Votes").insert({ user_id: currentUserId, post_id: postId, value });
        await supabase.rpc("increment_votes", { post_id: postId, delta: value });
      }
    } catch (err) {
      console.error("Vote error:", err);
    }
  };

  const handleUpdatePost = async (postId: number, updates: { title: string; body: string }) => {
    if (!currentUserId) {
      throw new Error("Please sign in to edit this post.");
    }

    const updatedAt = new Date().toISOString();
    const { data, error: updateError } = await supabase
      .from("Posts")
      .update({
        title: updates.title,
        body: updates.body,
        updated_at: updatedAt,
      })
      .eq("post_id", postId)
      .eq("author_id", currentUserId)
      .select("post_id, title, body, updated_at")
      .maybeSingle();

    if (updateError) {
      throw updateError;
    }

    if (!data) {
      throw new Error("You can only edit your own posts.");
    }

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              title: data.title ?? updates.title,
              body: data.body ?? updates.body,
              updated_at: data.updated_at ?? updatedAt,
            }
          : post,
      ),
    );
  };

  const filteredPosts = useMemo(
    () => sortPosts(applyFeedFilters(posts, searchQuery, sidebarFilters), activeTab),
    [searchQuery, sidebarFilters, posts, activeTab],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Loading posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-100">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-8">
        <div className="hidden lg:block">
          <SidebarClasses />
        </div>

        <main className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search notes, courses, or topics..."
                className="w-full rounded-xl border border-zinc-300 bg-zinc-50 py-3 pl-10 pr-4 text-base text-zinc-800 outline-none transition focus:border-red-700 focus:bg-white"
              />
            </div>

            <div className="mt-4 flex items-center gap-2">
              {FEED_TABS.map((tab) => {
                const isActive = tab === activeTab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                      isActive ? "bg-zinc-200 text-zinc-900" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                    }`}
                    aria-pressed={isActive}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <NoteCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                userVote={userVotes[post.id] ?? null}
                onVote={handleVote}
                onUpdatePost={handleUpdatePost}
              />
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500">
              <p>{searchQuery ? "No posts match your search." : emptyReason ?? "No notes found."}</p>
              {emptyReason && (
                <Link href="/catalogue/departments" className="mt-4 inline-block font-bold text-[#7A1F1F] hover:underline">
                  Browse Course Catalog
                </Link>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] bg-zinc-100" />}>
      <NotesPageContent />
    </Suspense>
  );
}
