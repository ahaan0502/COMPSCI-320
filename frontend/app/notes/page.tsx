'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
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

const MOCK_POSTS: NotePost[] = [
  {
    id: 1,
    created_at: '2026-04-07T13:00:00.000Z',
    author_id: '7f86f886-75f7-46f3-a43d-53f0b40c2ca1',
    title: 'Question about Dynamic Programming',
    body: "Can someone explain the intuition behind the knapsack problem? I understand the recursive formula but I'm struggling to see why it works. Any help would be appreciated!",
    purpose: 'question',
    visibility: 'public',
    group_id: null,
    tags: ['algorithms', 'dynamic-programming', 'knapsack'],
    votes: 22,
    updated_at: '2026-04-07T13:00:00.000Z',
    is_deleted: false,
    course_id: 311,
    semester_id: 20261,
    is_report: false,
    author_name: 'Emma Smith',
    author_email: 'emma.smith@umass.edu',
    course_label: 'CS 311 - Algorithms',
    semester_label: 'Spring 2026',
    comments_count: 8,
  },
  {
    id: 2,
    created_at: '2026-04-07T06:00:00.000Z',
    author_id: '644521fb-a43f-431f-9ab3-e83e3899f89c',
    title: 'Study Group - Probability Review Session',
    body: "Our study group is meeting this Thursday at 6pm in the library to review probability concepts. We'll go over conditional probability, Bayes theorem, and practice problems. DM me if you want to join!",
    purpose: 'study-group',
    visibility: 'private',
    group_id: 19,
    tags: ['probability', 'bayes-theorem', 'review'],
    votes: 31,
    updated_at: '2026-04-07T06:00:00.000Z',
    is_deleted: false,
    course_id: 240,
    semester_id: 20261,
    is_report: false,
    author_name: 'Lisa Chen',
    author_email: 'lisa.chen@umass.edu',
    course_label: 'CS 240 - Reasoning Under Uncertainty',
    semester_label: 'Spring 2026',
    comments_count: 6,
  },
  {
    id: 3,
    created_at: '2026-04-06T18:00:00.000Z',
    author_id: '4e0ca2ca-8d16-4892-81a1-3f6488f60f8b',
    title: 'Linear Algebra Midterm Cheat Sheet',
    body: 'I put together a one-page summary for eigenvalues, diagonalization, and orthogonality. Sharing this in case it helps anyone preparing for the midterm this week.',
    purpose: 'resource',
    visibility: 'public',
    group_id: null,
    tags: ['linear-algebra', 'midterm', 'cheatsheet'],
    votes: 17,
    updated_at: '2026-04-06T18:00:00.000Z',
    is_deleted: false,
    course_id: 235,
    semester_id: 20261,
    is_report: false,
    author_name: 'Mike Johnson',
    author_email: 'mike.johnson@umass.edu',
    course_label: 'MATH 235 - Linear Algebra',
    semester_label: 'Spring 2026',
    comments_count: 4,
  },
];

function applyFeedFilters(posts: NotePost[], searchQuery: string, filters: NotesFeedFilters): NotePost[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return posts.filter((post) => {
    if (post.is_deleted) {
      return false;
    }

    if (normalizedQuery.length > 0) {
      const inTitle = post.title.toLowerCase().includes(normalizedQuery);
      const inBody = post.body.toLowerCase().includes(normalizedQuery);
      if (!inTitle && !inBody) {
        return false;
      }
    }

    if (filters.courseIds.length > 0 && (post.course_id === null || !filters.courseIds.includes(post.course_id))) {
      return false;
    }

    if (
      filters.semesterIds.length > 0
      && (post.semester_id === null || !filters.semesterIds.includes(post.semester_id))
    ) {
      return false;
    }

    if (filters.visibility.length > 0 && !filters.visibility.includes(post.visibility)) {
      return false;
    }

    return true;
  });
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
        This component to be replaced by actual filter component (to be built by Althan I believe).
      </p>
    </aside>
  );
}

export default function NotesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FeedTab>('hot');

  // Keep this as a separate input object so sidebar component integration is a direct swap later.
  const sidebarFilters = SIDEBAR_FILTERS_FROM_COMPONENT;

  const filteredPosts = useMemo(
    () => applyFeedFilters(MOCK_POSTS, searchQuery, sidebarFilters),
    [searchQuery, sidebarFilters],
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