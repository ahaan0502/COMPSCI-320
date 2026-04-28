'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import NoteCard, { type NotePost, type PostVisibility } from '../components/NoteCard';

type FeedTab = 'hot' | 'new' | 'top';

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
  Users: {
    name: string | null;
    email: string | null;
  }[] | {
    name: string | null;
    email: string | null;
  } | null;
  Courses: {
    department_id: number | null;
    course_number: string | null;
    title: string | null;
  }[] | {
    department_id: number | null;
    course_number: string | null;
    title: string | null;
  } | null;
  Semesters: {
    term: string | null;
    year: string | null;
  }[] | {
    term: string | null;
    year: string | null;
  } | null;
}

const FEED_TABS: FeedTab[] = ['hot', 'new', 'top'];

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
    case 'hot':
      return [...posts].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
    case 'new':
      return [...posts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case 'top':
      return [...posts].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
    default:
      return posts;
  }
}

function FiltersPlaceholder() {
  return (
    <aside className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="mb-6 text-3xl font-bold tracking-tight text-zinc-800">Filters</h2>
      <div className="space-y-6 text-zinc-700">
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Course</h3>
          <div className="space-y-2 text-base">
            <p>CS 220 - Programming Methodology</p>
            <p>CS 240 - Reasoning Under Uncertainty</p>
            <p>CS 311 - Algorithms</p>
            <p>MATH 235 - Linear Algebra</p>
          </div>
        </section>
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Semester</h3>
          <div className="space-y-2 text-base">
            <p>Spring 2026</p>
            <p>Fall 2025</p>
            <p>Spring 2025</p>
          </div>
        </section>
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Visibility</h3>
          <div className="space-y-2 text-base">
            <p>Public Posts</p>
            <p>Private Posts</p>
          </div>
        </section>
      </div>
      <p className="mt-6 rounded-lg bg-zinc-100 p-3 text-sm text-zinc-600">
        This component to be replaced by actual filter component.
      </p>
    </aside>
  );
}

function NotesPageContent() {
  const searchParams = useSearchParams();
  const selectedClassId = searchParams.get('classId');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FeedTab>('hot');
  const [posts, setPosts] = useState<NotePost[]>([]);
  const [userVotes, setUserVotes] = useState<Record<number, 1 | -1>>({});
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emptyReason, setEmptyReason] = useState<string | null>(null);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    [],
  );

  const sidebarFilters = SIDEBAR_FILTERS_FROM_COMPONENT;

  useEffect(() => {
    const fetchPosts = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError('Not logged in');
        setLoading(false);
        return;
      }

      setCurrentUserId(session.user.id);

      const { data: enrolledData, error: enrolledError } = await supabase
        .from('Student_Enrolled_Courses')
        .select('course_id')
        .eq('author_id', session.user.id);

      if (enrolledError) {
        console.error('Enrolled courses error:', enrolledError);
        setError('Failed to load enrolled courses');
        setLoading(false);
        return;
      }

      let enrolledCourseIds = (enrolledData || []).map((row: { course_id: number }) => row.course_id);

      if (selectedClassId) {
        const classId = Number(selectedClassId);
        enrolledCourseIds = enrolledCourseIds.filter((courseId) => courseId === classId);

        if (enrolledCourseIds.length === 0) {
          setEmptyReason('That class is not in My Classes.');
          setPosts([]);
          setLoading(false);
          return;
        }
      }

      if (enrolledCourseIds.length === 0) {
        setEmptyReason('Add a class before browsing notes.');
        setPosts([]);
        setLoading(false);
        return;
      }

      const { data: postsData, error: postsError } = await supabase
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
        `)
        .in('course_id', enrolledCourseIds)
        .eq('is_report', false)
        .eq('visibility', 'public');

      if (postsError) {
        console.error('Posts error:', postsError);
        setError('Failed to load posts');
        setLoading(false);
        return;
      }

      const mapped: NotePost[] = ((postsData || []) as SupabasePostRow[]).map((post) => {
        const user = Array.isArray(post.Users) ? post.Users[0] : post.Users;
        const course = Array.isArray(post.Courses) ? post.Courses[0] : post.Courses;
        const semester = Array.isArray(post.Semesters) ? post.Semesters[0] : post.Semesters;

        return {
          id: post.post_id,
          created_at: post.created_at,
          author_id: post.author_id,
          title: post.title ?? '',
          body: post.body ?? '',
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
          author_name: user?.name ?? 'Unknown',
          author_email: user?.email ?? '',
          course_label: `${course?.course_number ?? ''} - ${course?.title ?? ''}`,
          semester_label: `${semester?.term ?? ''} ${semester?.year ?? ''}`,
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
            .from('Post_Votes')
            .select('post_id, value')
            .eq('user_id', session.user.id)
            .in('post_id', postIds),
          supabase.from('Comments').select('post_id').in('post_id', postIds),
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
            if (typeof row.post_id !== 'number') continue;
            commentsCountByPost.set(row.post_id, (commentsCountByPost.get(row.post_id) ?? 0) + 1);
          }

          for (const post of mapped) {
            post.comments_count = commentsCountByPost.get(post.id) ?? 0;
          }
        }
      }

      setPosts(mapped);
      setEmptyReason(mapped.length === 0 ? 'No notes have been posted for these classes yet.' : null);

      setLoading(false);
    };

    fetchPosts();
  }, [selectedClassId, supabase]);

  const handleVote = async (postId: number, value: 1 | -1) => {
    const existingVote = userVotes[postId] ?? null;

    // Optimistically update UI
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        let delta = 0;
        if (existingVote === value) {
          // Clicking same direction = undo vote
          delta = -value;
        } else if (existingVote !== null) {
          // Switching direction: ±2
          delta = value * 2;
        } else {
          // Fresh vote
          delta = value;
        }

        return { ...p, votes: p.votes + delta };
      })
    );

    setUserVotes((prev) => {
      if (prev[postId] === value) {
        // Undo vote
        const next = { ...prev };
        delete next[postId];
        return next;
      }
      return { ...prev, [postId]: value };
    });

    // Persist to Supabase
    try {
      if (existingVote === value) {
        // Remove vote
        await supabase
          .from('Post_Votes')
          .delete()
          .eq('user_id', currentUserId)
          .eq('post_id', postId);

        await supabase.rpc('increment_votes', { post_id: postId, delta: -value });
      } else if (existingVote !== null) {
        // Switch direction
        await supabase
          .from('Post_Votes')
          .update({ value })
          .eq('user_id', currentUserId)
          .eq('post_id', postId);

        await supabase.rpc('increment_votes', { post_id: postId, delta: value * 2 });
      } else {
        // New vote
        await supabase
          .from('Post_Votes')
          .insert({ user_id: currentUserId, post_id: postId, value });

        await supabase.rpc('increment_votes', { post_id: postId, delta: value });
      }
    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  const filteredPosts = useMemo(
    () => sortPosts(applyFeedFilters(posts, searchQuery, sidebarFilters), activeTab),
    [searchQuery, sidebarFilters, posts, activeTab],
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-zinc-500">Loading posts...</p>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-red-500">{error}</p>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-100">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-8">
        <div className="hidden lg:block">
          <FiltersPlaceholder />
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
                      isActive ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
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
              />
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500">
              <p>{searchQuery ? 'No posts match your search.' : emptyReason ?? 'No notes found.'}</p>
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
