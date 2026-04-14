'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import NoteCard, { type NotePost, type PostVisibility } from '../components/NoteCard';

type FeedTab = 'hot' | 'new' | 'top';

interface NotesFeedFilters {
  courseIds: number[];
  semesterIds: number[];
  visibility: PostVisibility[];
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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FeedTab>('hot');
  const [posts, setPosts] = useState<NotePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sidebarFilters = SIDEBAR_FILTERS_FROM_COMPONENT;

  useEffect(() => {
    const fetchPosts = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError('Not logged in');
        setLoading(false);
        return;
      }

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

      const enrolledCourseIds = (enrolledData || []).map((row: { course_id: number }) => row.course_id);

      if (enrolledCourseIds.length === 0) {
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
            dept,
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
        .eq('is_report', false);

      if (postsError) {
        console.error('Posts error:', postsError);
        setError('Failed to load posts');
        setLoading(false);
        return;
      }

      const mapped: NotePost[] = (postsData || []).map((post: any) => ({
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
        author_name: post.Users?.name ?? 'Unknown',
        author_email: post.Users?.email ?? '',
        course_label: `${post.Courses?.dept} ${post.Courses?.course_number} - ${post.Courses?.title}`,
        semester_label: `${post.Semesters?.term} ${post.Semesters?.year}`,
        comments_count: 0,
      }));

      setPosts(mapped);
      setLoading(false);
    };

    fetchPosts();   
  }, []);

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
              <NoteCard key={post.id} post={post} />
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500">
              No posts match your search.
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
