import { createBrowserClient } from '@supabase/ssr';
import type { NotePost, PostVisibility } from '../components/NoteCard';

export type ReportReason = 'spam' | 'harassment' | 'inaccurate' | 'academic_policy' | 'other';

export interface AdminPost extends NotePost {
  reportCount: number;
  reportReason?: string;
}

export interface AdminClassSummary {
  id: string;
  courseId: number;
  semesterId: number;
  code: string;
  title: string;
  semesterLabel: string;
  postCount: number;
  reportedCount: number;
}

export interface ModerationData {
  currentUserId: string;
  isAdmin: boolean;
  adminClasses: AdminClassSummary[];
  posts: AdminPost[];
  bannedUsersByCourse: Record<number, string[]>;
}

interface ModerationQueryOptions {
  courseId?: number;
  semesterId?: number;
}

interface SupabasePostRow {
  post_id: number;
  created_at: string;
  author_id: string;
  title: string | null;
  body: string | null;
  purpose: string | null;
  visibility: string | null;
  group_id: number | null;
  tags: unknown;
  votes: number | null;
  updated_at: string | null;
  course_id: number | null;
  semester_id: number | null;
  is_report: boolean | null;
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

interface PostReportRow {
  post_id: number;
  reason: ReportReason;
  details: string | null;
  created_at: string;
}

interface CourseBanRow {
  course_id: number;
  author_id: string;
}

interface CommentRow {
  post_id: number | null;
}

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

function firstRelation<T>(value: T[] | T | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function normalizeVisibility(visibility: string | null): PostVisibility {
  return visibility === 'private' ? 'private' : 'public';
}

function normalizeTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags.filter((value): value is string => typeof value === 'string');
  }

  return [];
}

export function formatReportReason(reason: ReportReason): string {
  switch (reason) {
    case 'spam':
      return 'Spam or abusive content';
    case 'harassment':
      return 'Harassment or rude language';
    case 'inaccurate':
      return 'Inaccurate course content';
    case 'academic_policy':
      return 'Academic policy concern';
    case 'other':
      return 'Other';
    default:
      return reason;
  }
}

function summarizeReports(reports: PostReportRow[]): string | undefined {
  if (reports.length === 0) return undefined;

  const detailedReport = reports.find((report) => report.details && report.details.trim().length > 0);
  if (detailedReport) {
    return detailedReport.details!.trim();
  }

  const counts = new Map<ReportReason, number>();
  for (const report of reports) {
    counts.set(report.reason, (counts.get(report.reason) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => `${formatReportReason(reason)}${count > 1 ? ` x${count}` : ''}`)
    .join(' · ');
}

export async function fetchModerationData(options: ModerationQueryOptions = {}): Promise<ModerationData> {
  const client = getClient();
  const {
    data: { session },
  } = await client.auth.getSession();

  if (!session?.user) {
    throw new Error('Please sign in to view the moderation dashboard.');
  }

  const { data: profile, error: profileError } = await client
    .from('Users')
    .select('is_admin')
    .eq('author_id', session.user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile?.is_admin) {
    return {
      currentUserId: session.user.id,
      isAdmin: false,
      adminClasses: [],
      posts: [],
      bannedUsersByCourse: {},
    };
  }

  let postsQuery = client
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
    .order('created_at', { ascending: false });

  if (typeof options.courseId === 'number') {
    postsQuery = postsQuery.eq('course_id', options.courseId);
  }

  if (typeof options.semesterId === 'number') {
    postsQuery = postsQuery.eq('semester_id', options.semesterId);
  }

  const { data: postsData, error: postsError } = await postsQuery;

  if (postsError) {
    throw new Error(postsError.message);
  }

  const postRows = (postsData || []) as SupabasePostRow[];
  const postIds = postRows.map((post) => post.post_id);
  const courseIds = Array.from(new Set(postRows.map((post) => post.course_id).filter((value): value is number => value !== null)));

  const [{ data: reportsData, error: reportsError }, { data: commentsData, error: commentsError }, { data: bansData, error: bansError }] =
    await Promise.all([
      postIds.length > 0
        ? client
            .from('Post_Reports')
            .select('post_id, reason, details, created_at')
            .in('post_id', postIds)
            .eq('status', 'open')
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      postIds.length > 0
        ? client.from('Comments').select('post_id').in('post_id', postIds)
        : Promise.resolve({ data: [], error: null }),
      courseIds.length > 0
        ? client.from('Course_Bans').select('course_id, author_id').in('course_id', courseIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (reportsError) {
    throw new Error(reportsError.message);
  }

  if (commentsError) {
    throw new Error(commentsError.message);
  }

  if (bansError) {
    throw new Error(bansError.message);
  }

  const reportsByPost = new Map<number, PostReportRow[]>();
  for (const report of ((reportsData || []) as PostReportRow[])) {
    const existing = reportsByPost.get(report.post_id) ?? [];
    existing.push(report);
    reportsByPost.set(report.post_id, existing);
  }

  const commentsCountByPost = new Map<number, number>();
  for (const comment of ((commentsData || []) as CommentRow[])) {
    if (typeof comment.post_id !== 'number') continue;
    commentsCountByPost.set(comment.post_id, (commentsCountByPost.get(comment.post_id) ?? 0) + 1);
  }

  const bannedUsersByCourse: Record<number, string[]> = {};
  for (const ban of ((bansData || []) as CourseBanRow[])) {
    bannedUsersByCourse[ban.course_id] = [...(bannedUsersByCourse[ban.course_id] ?? []), ban.author_id];
  }

  const classMap = new Map<string, AdminClassSummary>();

  const posts: AdminPost[] = postRows.map((post) => {
    const user = firstRelation(post.Users);
    const course = firstRelation(post.Courses);
    const semester = firstRelation(post.Semesters);
    const reports = reportsByPost.get(post.post_id) ?? [];
    const courseId = post.course_id;
    const semesterId = post.semester_id;

    if (typeof courseId === 'number' && typeof semesterId === 'number') {
      const classKey = `${courseId}:${semesterId}`;
      const existing = classMap.get(classKey);
      const semesterLabel = `${semester?.term ?? ''} ${semester?.year ?? ''}`.trim() || 'Unknown semester';

      if (existing) {
        existing.postCount += 1;
        if (reports.length > 0) {
          existing.reportedCount += 1;
        }
      } else {
        classMap.set(classKey, {
          id: classKey,
          courseId,
          semesterId,
          code: course?.course_number ?? `Course ${courseId}`,
          title: course?.title ?? 'Untitled course',
          semesterLabel,
          postCount: 1,
          reportedCount: reports.length > 0 ? 1 : 0,
        });
      }
    }

    return {
      id: post.post_id,
      created_at: post.created_at,
      author_id: post.author_id,
      title: post.title ?? '',
      body: post.body ?? '',
      purpose: post.purpose,
      visibility: normalizeVisibility(post.visibility),
      group_id: post.group_id,
      tags: normalizeTags(post.tags),
      votes: post.votes ?? 0,
      updated_at: post.updated_at ?? post.created_at,
      is_deleted: false,
      course_id: post.course_id,
      semester_id: post.semester_id,
      is_report: reports.length > 0 || Boolean(post.is_report),
      author_name: user?.name ?? 'Unknown',
      author_email: user?.email ?? '',
      course_label: `${course?.course_number ?? 'Unknown course'} - ${course?.title ?? 'Untitled course'}`,
      semester_label: `${semester?.term ?? ''} ${semester?.year ?? ''}`.trim() || 'Unknown semester',
      comments_count: commentsCountByPost.get(post.post_id) ?? 0,
      reportCount: reports.length,
      reportReason: summarizeReports(reports),
    };
  });

  const adminClasses = Array.from(classMap.values()).sort((a, b) => {
    if (b.reportedCount !== a.reportedCount) return b.reportedCount - a.reportedCount;
    if (b.postCount !== a.postCount) return b.postCount - a.postCount;
    return a.code.localeCompare(b.code);
  });

  return {
    currentUserId: session.user.id,
    isAdmin: true,
    adminClasses,
    posts,
    bannedUsersByCourse,
  };
}

export async function saveModerationPost(postId: number, updates: { title: string; body: string }) {
  const client = getClient();
  const { error } = await client
    .from('Posts')
    .update({
      title: updates.title.trim(),
      body: updates.body.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('post_id', postId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function resolveModerationReports(postId: number, resolvedBy: string, status: 'resolved' | 'dismissed' = 'resolved') {
  const client = getClient();
  const resolvedAt = new Date().toISOString();

  const { error: reportsError } = await client
    .from('Post_Reports')
    .update({
      status,
      resolved_at: resolvedAt,
      resolved_by: resolvedBy,
    })
    .eq('post_id', postId)
    .eq('status', 'open');

  if (reportsError) {
    throw new Error(reportsError.message);
  }

  const { error: postError } = await client
    .from('Posts')
    .update({
      is_report: false,
      updated_at: resolvedAt,
    })
    .eq('post_id', postId);

  if (postError) {
    throw new Error(postError.message);
  }
}

export async function deleteModerationPost(postId: number) {
  const client = getClient();

  const { error: reportsError } = await client.from('Post_Reports').delete().eq('post_id', postId);
  if (reportsError) {
    throw new Error(reportsError.message);
  }

  const { error: postError } = await client.from('Posts').delete().eq('post_id', postId);
  if (postError) {
    throw new Error(postError.message);
  }
}

export async function banUserFromCourse(courseId: number, userId: string, adminId: string) {
  const client = getClient();
  const { error } = await client.from('Course_Bans').upsert(
    {
      course_id: courseId,
      author_id: userId,
      banned_by: adminId,
    },
    {
      onConflict: 'course_id,author_id',
      ignoreDuplicates: false,
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function unbanUserFromCourse(courseId: number, userId: string) {
  const client = getClient();
  const { error } = await client.from('Course_Bans').delete().eq('course_id', courseId).eq('author_id', userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function submitPostReport(params: {
  postId: number;
  reporterId: string;
  reason: ReportReason;
  details: string;
}) {
  const client = getClient();

  const { error: reportError } = await client.from('Post_Reports').insert({
    post_id: params.postId,
    reporter_id: params.reporterId,
    reason: params.reason,
    details: params.details.trim() || null,
  });

  if (reportError) {
    throw new Error(reportError.message);
  }

  const { error: postError } = await client
    .from('Posts')
    .update({
      is_report: true,
      updated_at: new Date().toISOString(),
    })
    .eq('post_id', params.postId);

  if (postError) {
    throw new Error(postError.message);
  }
}

export async function isUserBannedFromCourse(courseId: number, userId: string) {
  const client = getClient();
  const { data, error } = await client
    .from('Course_Bans')
    .select('course_id')
    .eq('course_id', courseId)
    .eq('author_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}
