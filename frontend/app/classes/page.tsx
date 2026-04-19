'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

// Simplified SVG Icons
const BookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-12 h-12">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const UsersSmallIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

interface ClassData {
  courseId: number;
  semesterId: number;
  code: string;
  name: string;
  semester: string;
  noteCount: number;
  memberCount: number;
}

interface ClassesViewProps {
  onClassSelect: (classId: number) => void;
}

interface CourseRecord {
  course_id: number;
  department_id: number;
  course_number: string;
  title: string;
}

interface SemesterRecord {
  semester_id: number;
  term: string;
  year: string;
}

interface EnrolledCourseRow {
  course_id: number;
  Courses: CourseRecord[] | CourseRecord | null;
  Semesters: SemesterRecord[] | SemesterRecord | null;
}

const demoClasses: ClassData[] = [
  {
    courseId: 320,
    semesterId: 1,
    code: 'COMPSCI 320',
    name: 'Software Engineering',
    semester: 'Spring 2026',
    noteCount: 18,
    memberCount: 64,
  },
  {
    courseId: 233,
    semesterId: 1,
    code: 'MATH 233',
    name: 'Multivariate Calculus',
    semester: 'Spring 2026',
    noteCount: 11,
    memberCount: 52,
  },
  {
    courseId: 515,
    semesterId: 1,
    code: 'STAT 515',
    name: 'Statistics I',
    semester: 'Spring 2026',
    noteCount: 9,
    memberCount: 47,
  },
];

export function ClassesView({ onClassSelect }: ClassesViewProps) {
  const [enrolledClasses, setEnrolledClasses] = useState<ClassData[]>([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        setEnrolledClasses(demoClasses);
        setUserName('');
        setLoading(false);
        return;
      }

      const supabase = createBrowserClient(
        supabaseUrl,
        supabaseAnonKey
      );

      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setUserId(null);
        setEnrolledClasses([]);
        setUserName('');
        setLoading(false);
        return;
      }

      setUserId(session.user.id);

      const fallbackName =
        session.user.user_metadata?.name ||
        session.user.user_metadata?.full_name ||
        session.user.email?.split('@')[0] ||
        '';

      const { data: profile } = await supabase
        .from('Users')
        .select('name')
        .eq('author_id', session.user.id)
        .maybeSingle();

      setUserName(profile?.name || fallbackName);

      // Fetch enrolled courses with course and semester info
      const { data, error } = await supabase
        .from('Student_Enrolled_Courses')
        .select(`
          course_id,
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
        .eq('author_id', session.user.id);

      if (error) {
        console.error('Fetch error:', error);
        setError('Failed to load your classes.');
        setLoading(false);
        return;
      }

      // Get note and member counts per course
      const rows = (data || []) as EnrolledCourseRow[];

      const classes = await Promise.all(rows.map(async (row) => {
        const course = Array.isArray(row.Courses) ? row.Courses[0] : row.Courses;
        const semester = Array.isArray(row.Semesters) ? row.Semesters[0] : row.Semesters;

        if (!course || !semester) {
          return null;
        }

        // Count notes for this course
        const { count: noteCount } = await supabase
          .from('Posts')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', course.course_id);

        // Count enrolled students for this course
        const { count: memberCount } = await supabase
          .from('Student_Enrolled_Courses')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', course.course_id);

        return {
          courseId: course.course_id,
          semesterId: semester.semester_id,
          code: `${course.course_number}`,
          name: course.title,
          semester: `${semester.term} ${semester.year}`,
          noteCount: noteCount || 0,
          memberCount: memberCount || 0,
        };
      }));

      setEnrolledClasses(classes.filter((course): course is ClassData => course !== null));
      setLoading(false);

    };

    fetchClasses();
  }, []);

  const router = useRouter();

  const removeClass = async (courseId: number, semesterId: number) => {
    if (!userId) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase
      .from('Student_Enrolled_Courses')
      .delete()
      .eq('author_id', userId)
      .eq('course_id', courseId)
      .eq('semester_id', semesterId);

    if (error) {
      console.error('Remove class error:', error);
      setError('Failed to remove class.');
      return;
    }

    setEnrolledClasses((prev) =>
      prev.filter((course) => !(course.courseId === courseId && course.semesterId === semesterId))
    );
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <p className="text-gray-500">Loading your classes...</p>
    </div>
  );

  if (!userId) return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-4 flex justify-center text-gray-300">
          <BookIcon />
        </div>
        <h1 className="mb-2 text-2xl font-extrabold text-gray-900">Sign in to view your classes</h1>
        <p className="mb-6 text-gray-600">Your class list is saved to your UMass notes account.</p>
        <button
          type="button"
          onClick={() => router.push('/auth/google')}
          className="rounded-lg bg-[#7A1F1F] px-5 py-3 font-bold text-white transition hover:bg-[#5a1616]"
        >
          Sign In
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-white px-6 py-6">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
            My Classes
          </h1>
          <p className="text-gray-600">
            {userName ? `Welcome, ${userName}. ` : ''}Access shared notes and collaborative materials for your UMass courses.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/catalogue/departments')}
          className="w-fit rounded-lg bg-[#7A1F1F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#5a1616]"
        >
          Add Classes
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {enrolledClasses.map((course) => (
          <div
            key={`${course.courseId}-${course.semesterId}`}
            onClick={() => onClassSelect(course.courseId)}
            className="group cursor-pointer bg-white border border-gray-200 rounded-xl p-6 transition-all hover:shadow-lg hover:border-[#7A1F1F]"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#7A1F1F] mb-1 block">
                  {course.semester}
                </span>
                <h2 className="text-2xl font-bold text-gray-900 group-hover:text-[#7A1F1F] transition-colors">
                  {course.code}
                </h2>
              </div>
              <div className="bg-[#f5e8e8] p-2.5 rounded-lg text-[#7A1F1F]">
                <FileIcon />
              </div>
            </div>

            <p className="text-gray-600 mb-6 font-medium leading-snug">
              {course.name}
            </p>

            <div className="flex items-center gap-5 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                <FileIcon />
                <span>{course.noteCount} notes</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                <UsersSmallIcon />
                <span>{course.memberCount} students</span>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  removeClass(course.courseId, course.semesterId);
                }}
                className="ml-auto text-sm font-bold text-gray-400 transition hover:text-[#7A1F1F]"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {enrolledClasses.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="text-gray-300 flex justify-center mb-4">
            <BookIcon />
          </div>
          <p className="text-gray-500 font-medium">
            No classes found. Time to join some study groups!
          </p>
          <button onClick={() => router.push('/catalogue/departments')}
          className="mt-4 text-[#7A1F1F] font-bold hover:underline">
            Browse Course Catalog
          </button>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  const router = useRouter();

  return (
    <ClassesView
      onClassSelect={(classId) => {
        router.push(`/notes?classId=${classId}`);
      }}
    />
  );
}
