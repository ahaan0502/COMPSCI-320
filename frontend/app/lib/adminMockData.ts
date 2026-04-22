import type { NotePost } from '../components/NoteCard';

export interface AdminClass {
  id: number;
  code: string;
  title: string;
  semesterLabel: string;
  adminUserIds: string[];
}

export interface AdminPost extends NotePost {
  reportCount: number;
  reportReason?: string;
}

export const MOCK_CURRENT_USER_ID = 'admin-1';

export const INITIAL_BANNED_USERS_BY_CLASS: Record<number, string[]> = {
  320: ['student-6'],
  233: [],
};

const MOCK_ADMIN_CLASSES: AdminClass[] = [
  {
    id: 320,
    code: 'COMPSCI 320',
    title: 'Software Engineering',
    semesterLabel: 'Spring 2026',
    adminUserIds: ['admin-1'],
  },
  {
    id: 233,
    code: 'MATH 233',
    title: 'Multivariate Calculus',
    semesterLabel: 'Spring 2026',
    adminUserIds: ['admin-1', 'admin-2'],
  },
  {
    id: 515,
    code: 'STAT 515',
    title: 'Statistics I',
    semesterLabel: 'Spring 2026',
    adminUserIds: ['admin-2'],
  },
];

const MOCK_ADMIN_POSTS: AdminPost[] = [
  {
    id: 9001,
    created_at: '2026-04-20T14:40:00.000Z',
    author_id: 'student-1',
    title: 'COMPSCI 320 sprint notes',
    body: 'Sprint planning notes and acceptance criteria checklist.',
    purpose: 'Weekly summary',
    visibility: 'public',
    group_id: null,
    tags: ['sprint', 'agile'],
    votes: 14,
    updated_at: '2026-04-20T16:00:00.000Z',
    is_deleted: false,
    course_id: 320,
    semester_id: 1,
    is_report: true,
    author_name: 'Student One',
    author_email: 'student1@umass.edu',
    course_label: 'COMPSCI 320 - Software Engineering',
    semester_label: 'Spring 2026',
    comments_count: 4,
    reportCount: 6,
    reportReason: 'May violate course academic policy.',
  },
  {
    id: 9002,
    created_at: '2026-04-21T02:15:00.000Z',
    author_id: 'student-2',
    title: 'MATH 233 exam prep guide',
    body: 'A quick review sheet with chain rule and gradient examples.',
    purpose: null,
    visibility: 'public',
    group_id: null,
    tags: ['exam', 'review'],
    votes: 8,
    updated_at: '2026-04-21T02:15:00.000Z',
    is_deleted: false,
    course_id: 233,
    semester_id: 1,
    is_report: true,
    author_name: 'Student Two',
    author_email: 'student2@umass.edu',
    course_label: 'MATH 233 - Multivariate Calculus',
    semester_label: 'Spring 2026',
    comments_count: 2,
    reportCount: 3,
    reportReason: 'Contains unverified answer key claims.',
  },
  {
    id: 9003,
    created_at: '2026-04-19T18:25:00.000Z',
    author_id: 'student-3',
    title: 'COMPSCI 320 architecture notes',
    body: 'Domain model and service boundary notes from lecture.',
    purpose: null,
    visibility: 'public',
    group_id: null,
    tags: ['architecture'],
    votes: 11,
    updated_at: '2026-04-19T19:00:00.000Z',
    is_deleted: false,
    course_id: 320,
    semester_id: 1,
    is_report: false,
    author_name: 'Student Three',
    author_email: 'student3@umass.edu',
    course_label: 'COMPSCI 320 - Software Engineering',
    semester_label: 'Spring 2026',
    comments_count: 5,
    reportCount: 0,
  },
  {
    id: 9004,
    created_at: '2026-04-18T09:10:00.000Z',
    author_id: 'student-4',
    title: 'MATH 233 vector field walkthrough',
    body: 'Example problems and directional derivative intuition.',
    purpose: 'Practice',
    visibility: 'private',
    group_id: 10,
    tags: ['vectors'],
    votes: 5,
    updated_at: '2026-04-18T09:40:00.000Z',
    is_deleted: false,
    course_id: 233,
    semester_id: 1,
    is_report: false,
    author_name: 'Student Four',
    author_email: 'student4@umass.edu',
    course_label: 'MATH 233 - Multivariate Calculus',
    semester_label: 'Spring 2026',
    comments_count: 1,
    reportCount: 0,
  },
  {
    id: 9005,
    created_at: '2026-04-21T03:40:00.000Z',
    author_id: 'student-6',
    title: 'COMPSCI 320 code quality checklist',
    body: 'Linting, tests, and pre-merge checklist draft.',
    purpose: null,
    visibility: 'public',
    group_id: null,
    tags: ['quality'],
    votes: 2,
    updated_at: '2026-04-21T03:45:00.000Z',
    is_deleted: false,
    course_id: 320,
    semester_id: 1,
    is_report: true,
    author_name: 'Student Six',
    author_email: 'student6@umass.edu',
    course_label: 'COMPSCI 320 - Software Engineering',
    semester_label: 'Spring 2026',
    comments_count: 0,
    reportCount: 1,
    reportReason: 'Possible plagiarism from another class repository.',
  },
];

export function getAdminClasses(userId: string): AdminClass[] {
  return MOCK_ADMIN_CLASSES.filter((courseClass) => courseClass.adminUserIds.includes(userId));
}

export function getPostsForAdmin(userId: string): AdminPost[] {
  const classIds = new Set(getAdminClasses(userId).map((courseClass) => courseClass.id));
  return MOCK_ADMIN_POSTS.filter((post) => post.course_id !== null && classIds.has(post.course_id));
}

export function getPostsForAdminClass(userId: string, classId: number): AdminPost[] {
  const hasAdminAccess = getAdminClasses(userId).some((courseClass) => courseClass.id === classId);
  if (!hasAdminAccess) return [];
  return getPostsForAdmin(userId).filter((post) => post.course_id === classId);
}
