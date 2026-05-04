import type { NotePost, PostVisibility } from '@/app/components/NoteCard';

type FeedTab = 'hot' | 'new' | 'top';

interface NotesFeedFilters {
  courseIds: number[];
  semesterIds: number[];
  visibility: PostVisibility[];
}

export function applyFeedFilters(
  posts: NotePost[],
  searchQuery: string,
  filters: NotesFeedFilters
): NotePost[] {
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
  });}

export function sortPosts(posts: NotePost[], tab: FeedTab): NotePost[] {
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