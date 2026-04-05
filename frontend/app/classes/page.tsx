'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

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
  id: string;
  code: string;
  name: string;
  semester: string;
  noteCount: number;
  memberCount: number;
}

interface ClassesViewProps {
  onClassSelect: (courseCode: string) => void;
}

interface EnrolledCourseRow {
  course_id: number;
  Courses: {
    id: number;
    dept: string;
    course_number: string;
    title: string;
  };
  Semesters: {
    id: number;
    term: string;
    year: string;
  };
}

export function ClassesView({ onClassSelect }: ClassesViewProps) {
  const [enrolledClasses, setEnrolledClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError('Not logged in');
        setLoading(false);
        return;
      }

      // Fetch enrolled courses with course and semester info
      const { data, error } = await supabase
        .from('Student_Enrolled_Courses')
        .select(`
          course_id,
          Courses (
            id,
            dept,
            course_number,
            title
          ),
          Semesters (
            id,
            term,
            year
          )
        `)
        .eq('user_id', session.user.id);

        console.log('Session user ID:', session.user.id);
        console.log('Raw data:', data);
        console.log('Fetch error:', error);

      if (error) {
        console.error('Fetch error:', error);
        setError('Failed to load classes');
        setLoading(false);
        return;
      }

      // Get note and member counts per course
      console.log('Data before mapping:', data);

      const classes = await Promise.all((data || []).map(async (row: EnrolledCourseRow) => {
        const course = row.Courses as any;
        const semester = row.Semesters as any;

        console.log('Processing row:', row);
        console.log('Course:', course);
        console.log('Semester:', semester);

        // Count notes for this course
        const { count: noteCount } = await supabase
          .from('Posts')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', course.id);

        // Count enrolled students for this course
        const { count: memberCount } = await supabase
          .from('Student_Enrolled_Courses')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', course.id);

        return {
          id: String(course.id),
          code: `${course.dept} ${course.course_number}`,
          name: course.title,
          semester: `${semester.term} ${semester.year}`,
          noteCount: noteCount || 0,
          memberCount: memberCount || 0,
        };
      }));

      setEnrolledClasses(classes);
      setLoading(false);
    };

    fetchClasses();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Loading your classes...</p>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-red-500">{error}</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white min-h-screen">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
          My Classes
        </h1>
        <p className="text-gray-600">
          Access shared notes and collaborative materials for your UMass courses.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {enrolledClasses.map((course) => (
          <div
            key={course.id}
            onClick={() => onClassSelect(`${course.code} - ${course.name}`)}
            className="group cursor-pointer bg-white border border-gray-200 rounded-xl p-6 transition-all hover:shadow-lg hover:border-[#7A1F1F]"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7A1F1F] mb-1 block">
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
          <button className="mt-4 text-[#7A1F1F] font-bold hover:underline">
            Browse Course Catalog
          </button>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <ClassesView
      onClassSelect={(course) => {
        console.log('Selected course:', course);
      }}
    />
  );
}