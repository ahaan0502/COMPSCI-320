/**
 * Unit tests for applyFeedFilters and sortPosts
 * These are extracted from app/notes/page.tsx for testability.
 *
 * Copy these two functions into app/lib/notesUtils.ts and import from there
 * (see instructions at bottom of this file).
 */

import { applyFeedFilters, sortPosts } from '@/app/lib/notesUtils';
import type { NotePost } from '@/app/components/NoteCard';

function makePost(overrides: Partial<NotePost> = {}): NotePost {
  return {
    id: 1,
    created_at: '2024-01-01T00:00:00Z',
    author_id: 'user-1',
    title: 'Test Post',
    body: 'Test body content',
    purpose: null,
    visibility: 'public',
    group_id: null,
    tags: [],
    votes: 0,
    updated_at: '2024-01-01T00:00:00Z',
    is_deleted: false,
    course_id: 101,
    semester_id: 1,
    is_report: false,
    attachment_url: null,
    author_name: 'Alice',
    author_email: 'alice@umass.edu',
    course_label: 'CS101 - Intro to CS',
    semester_label: 'Spring 2024',
    comments_count: 0,
    ...overrides,
  };
}

const noFilters = { courseIds: [], semesterIds: [], visibility: [] };

// ─── applyFeedFilters ────────────────────────────────────────────────────────

describe('applyFeedFilters', () => {
  it('returns all posts when query and filters are empty', () => {
    const posts = [makePost({ id: 1 }), makePost({ id: 2 })];
    expect(applyFeedFilters(posts, '', noFilters)).toHaveLength(2);
  });

  it('excludes deleted posts regardless of other filters', () => {
    const posts = [makePost({ id: 1, is_deleted: true }), makePost({ id: 2 })];
    expect(applyFeedFilters(posts, '', noFilters)).toHaveLength(1);
  });

  it('filters by title search query (case-insensitive)', () => {
    const posts = [
      makePost({ id: 1, title: 'Lecture Notes on Recursion' }),
      makePost({ id: 2, title: 'Exam Review' }),
    ];
    const result = applyFeedFilters(posts, 'recursion', noFilters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('filters by body search query', () => {
    const posts = [
      makePost({ id: 1, body: 'Big O notation is important' }),
      makePost({ id: 2, body: 'Nothing relevant here' }),
    ];
    const result = applyFeedFilters(posts, 'big o', noFilters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('returns nothing when search query matches neither title nor body', () => {
    const posts = [makePost({ title: 'Algorithms', body: 'Graph theory' })];
    expect(applyFeedFilters(posts, 'quantum physics', noFilters)).toHaveLength(0);
  });

  it('filters by courseId when courseIds filter is set', () => {
    const posts = [
      makePost({ id: 1, course_id: 101 }),
      makePost({ id: 2, course_id: 202 }),
    ];
    const result = applyFeedFilters(posts, '', { ...noFilters, courseIds: [101] });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('excludes post with null course_id when courseIds filter is active', () => {
    const posts = [makePost({ id: 1, course_id: null })];
    const result = applyFeedFilters(posts, '', { ...noFilters, courseIds: [101] });
    expect(result).toHaveLength(0);
  });

  it('filters by semesterId', () => {
    const posts = [
      makePost({ id: 1, semester_id: 1 }),
      makePost({ id: 2, semester_id: 2 }),
    ];
    const result = applyFeedFilters(posts, '', { ...noFilters, semesterIds: [2] });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it('filters by visibility', () => {
    const posts = [
      makePost({ id: 1, visibility: 'public' }),
      makePost({ id: 2, visibility: 'private' }),
    ];
    const result = applyFeedFilters(posts, '', { ...noFilters, visibility: ['private'] });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it('applies search and courseId filter simultaneously', () => {
    const posts = [
      makePost({ id: 1, title: 'Recursion', course_id: 101 }),
      makePost({ id: 2, title: 'Recursion', course_id: 202 }),
      makePost({ id: 3, title: 'Sorting', course_id: 101 }),
    ];
    const result = applyFeedFilters(posts, 'recursion', { ...noFilters, courseIds: [101] });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });
});

// ─── sortPosts ───────────────────────────────────────────────────────────────

describe('sortPosts', () => {
  it('sorts by votes descending for "hot" tab', () => {
    const posts = [
      makePost({ id: 1, votes: 5 }),
      makePost({ id: 2, votes: 20 }),
      makePost({ id: 3, votes: 1 }),
    ];
    const sorted = sortPosts(posts, 'hot');
    expect(sorted.map((p) => p.id)).toEqual([2, 1, 3]);
  });

  it('sorts by created_at descending for "new" tab', () => {
    const posts = [
      makePost({ id: 1, created_at: '2024-01-01T00:00:00Z' }),
      makePost({ id: 2, created_at: '2024-03-15T00:00:00Z' }),
      makePost({ id: 3, created_at: '2024-02-10T00:00:00Z' }),
    ];
    const sorted = sortPosts(posts, 'new');
    expect(sorted.map((p) => p.id)).toEqual([2, 3, 1]);
  });

  it('sorts by votes descending for "top" tab', () => {
    const posts = [
      makePost({ id: 1, votes: 3 }),
      makePost({ id: 2, votes: 10 }),
    ];
    const sorted = sortPosts(posts, 'top');
    expect(sorted.map((p) => p.id)).toEqual([2, 1]);
  });

  it('does not mutate the original array', () => {
    const posts = [makePost({ id: 1, votes: 1 }), makePost({ id: 2, votes: 10 })];
    const original = [...posts];
    sortPosts(posts, 'hot');
    expect(posts).toEqual(original);
  });
});

/**
 * ─── SETUP INSTRUCTIONS ────────────────────────────────────────────────────
 *
 * To make these tests work, extract the two functions from notes/page.tsx
 * into a new file: app/lib/notesUtils.ts
 *
 * // app/lib/notesUtils.ts
 * import type { NotePost, PostVisibility } from '@/app/components/NoteCard';
 *
 * type FeedTab = 'hot' | 'new' | 'top';
 * interface NotesFeedFilters {
 *   courseIds: number[];
 *   semesterIds: number[];
 *   visibility: PostVisibility[];
 * }
 *
 * export function applyFeedFilters(...) { ... }
 * export function sortPosts(...) { ... }
 *
 * Then update notes/page.tsx to import from there instead.
 */