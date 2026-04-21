'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface Department {
  department_id: number;
  department_name: string;
}

interface Course {
  course_id: number;
  course_number: string;
  title: string;
}

interface Semester {
  semester_id: number;
  term: string;
  year: string;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function DepartmentsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [enrolledKeys, setEnrolledKeys] = useState<Set<string>>(new Set());
  const [courseSearch, setCourseSearch] = useState('');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [addingCourseId, setAddingCourseId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user.id ?? null);

      const { data: departmentsData, error: departmentsError } = await supabase
        .from('Departments')
        .select('department_id, department_name')
        .order('department_name', { ascending: true });

      if (departmentsError) {
        console.error('Departments error:', departmentsError);
        setError('Failed to load departments');
        setLoading(false);
        return;
      }

      const { data: semestersData, error: semestersError } = await supabase
        .from('Semesters')
        .select('semester_id, term, year')
        .order('year', { ascending: false })
        .order('semester_id', { ascending: false });

      if (semestersError) {
        console.error('Semesters error:', semestersError);
        setError('Failed to load semesters');
        setLoading(false);
        return;
      }

      if (session?.user) {
        const { data: enrolledData, error: enrolledError } = await supabase
          .from('Student_Enrolled_Courses')
          .select('course_id, semester_id')
          .eq('author_id', session.user.id);

        if (enrolledError) {
          console.error('Enrolled courses error:', enrolledError);
          setError('Failed to load your enrolled classes');
          setLoading(false);
          return;
        }

        setEnrolledKeys(new Set((enrolledData || []).map((row) => `${row.course_id}:${row.semester_id}`)));
      }

      setDepartments(departmentsData || []);
      setSemesters(semestersData || []);
      setSelectedSemesterId(semestersData?.[0] ? String(semestersData[0].semester_id) : '');
      setLoading(false);
    };

    fetchInitialData();
  }, []);

  const loadCourses = async (department: Department) => {
    setSelectedDepartment(department);
    setCourses([]);
    setCoursesError(null);
    setActionMessage(null);
    setCourseSearch('');
    setCoursesLoading(true);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('Courses')
      .select('course_id, course_number, title')
      .eq('department_id', department.department_id)
      .order('course_number', { ascending: true });

    if (error) {
      console.error('Courses error:', error);
      setCoursesError(`Failed to load courses for ${department.department_name}`);
      setCoursesLoading(false);
      return;
    }

    setCourses(data || []);
    setCoursesLoading(false);
  };

  const addCourse = async (course: Course) => {
    if (!userId) {
      setActionMessage('Please sign in before adding a class.');
      return;
    }

    if (!selectedSemesterId) {
      setActionMessage('Choose a semester before adding a class.');
      return;
    }

    const enrollmentKey = `${course.course_id}:${selectedSemesterId}`;

    if (enrolledKeys.has(enrollmentKey)) {
      setActionMessage(`${course.course_number} is already in My Classes for that semester.`);
      return;
    }

    setAddingCourseId(course.course_id);
    setActionMessage(null);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase
      .from('Student_Enrolled_Courses')
      .insert({
        author_id: userId,
        course_id: course.course_id,
        semester_id: Number(selectedSemesterId),
      });

    setAddingCourseId(null);

    if (error) {
      console.error('Add class error:', error);
      setActionMessage(error.code === '23505' ? 'That class is already in My Classes.' : 'Failed to add class.');
      return;
    }

    setEnrolledKeys((prev) => new Set(prev).add(enrollmentKey));
    setActionMessage(`${course.course_number} was added to My Classes.`);
  };

  const lettersWithDepts = new Set(
    departments.map((d) => d.department_name[0].toUpperCase())
  );

  const filtered = activeLetter
    ? departments.filter((d) => d.department_name[0].toUpperCase() === activeLetter)
    : departments;

  const visibleCourses = courseSearch.trim()
    ? courses.filter((course) => {
        const query = courseSearch.trim().toLowerCase();
        return (
          course.course_number.toLowerCase().includes(query) ||
          course.title.toLowerCase().includes(query)
        );
      })
    : courses;

  if (loading) return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <p className="text-gray-500">Loading departments...</p>
    </main>
  );

  if (error) return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <p className="text-red-500">{error}</p>
    </main>
  );

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* Header */}
        <section className="mb-8 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-red-50/50 px-6 py-7 shadow-sm">
          <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-gray-950">
            Course Catalogue
          </h1>
          <p className="max-w-2xl text-base leading-7 text-gray-600">
            Browse all departments at UMass Amherst. Select a department to view its courses.
          </p>
        </section>

        {/* Alphabet Filter */}
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-950">Departments</h2>
              <p className="text-sm text-gray-500">
                {filtered.length} {filtered.length === 1 ? 'department' : 'departments'}
                {activeLetter ? ` starting with ${activeLetter}` : ' total'}
              </p>
            </div>
            {activeLetter && (
              <button
                onClick={() => setActiveLetter(null)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 transition hover:border-[#7A1F1F] hover:text-[#7A1F1F]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveLetter(null)}
              className={`h-10 rounded-lg px-4 text-sm font-bold transition ${
                activeLetter === null
                  ? 'bg-[#7A1F1F] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {ALPHABET.map((letter) => {
              const hasItems = lettersWithDepts.has(letter);
              return (
                <button
                  key={letter}
                  onClick={() => hasItems && setActiveLetter(letter)}
                  disabled={!hasItems}
                  className={`h-10 w-10 rounded-lg text-sm font-bold transition ${
                    activeLetter === letter
                      ? 'bg-[#7A1F1F] text-white shadow-sm'
                      : hasItems
                      ? 'bg-gray-100 text-gray-700 hover:bg-[#f5e8e8] hover:text-[#7A1F1F]'
                      : 'cursor-not-allowed bg-gray-50 text-gray-300'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          {/* Department Grid */}
          <section>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((dept) => {
                const isSelected = selectedDepartment?.department_id === dept.department_id;

                return (
                  <button
                    key={dept.department_id}
                    onClick={() => loadCourses(dept)}
                    className={`min-h-24 text-left rounded-xl border bg-white px-5 py-4 shadow-sm transition-all group ${
                      isSelected
                        ? 'border-[#7A1F1F] ring-2 ring-[#7A1F1F]/10'
                        : 'border-gray-200 hover:border-[#7A1F1F] hover:shadow-md'
                    }`}
                  >
                    <div className="flex h-full items-center justify-between gap-4">
                      <span
                        className={`font-bold leading-snug transition-colors ${
                          isSelected ? 'text-[#7A1F1F]' : 'text-gray-800 group-hover:text-[#7A1F1F]'
                        }`}
                      >
                        {dept.department_name}
                      </span>
                      <svg
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isSelected ? 'text-[#7A1F1F]' : 'text-gray-300 group-hover:text-[#7A1F1F]'
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="mt-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-20 text-center">
                <p className="font-medium text-gray-400">No departments found for &quot;{activeLetter}&quot;</p>
              </div>
            )}
          </section>

          {/* Course List */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 p-5">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#7A1F1F]">
                  Courses
                </p>
                <h2 className="text-2xl font-extrabold tracking-tight text-gray-950">
                  {selectedDepartment ? selectedDepartment.department_name : 'Select a subject'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {selectedDepartment
                    ? coursesLoading
                      ? 'Loading UMass Amherst courses...'
                      : `${visibleCourses.length} ${visibleCourses.length === 1 ? 'course' : 'courses'} found`
                    : 'Choose a department to view its course list.'}
                </p>
              </div>

              <div className="max-h-[640px] overflow-y-auto p-4">
                {!selectedDepartment && (
                  <div className="rounded-xl bg-gray-50 p-5 text-sm leading-6 text-gray-500">
                    Select a UMass Amherst department to load its course list.
                  </div>
                )}

                {selectedDepartment && !coursesLoading && (
                  <div className="mb-4 space-y-3">
                    <input
                      type="search"
                      value={courseSearch}
                      onChange={(event) => setCourseSearch(event.target.value)}
                      placeholder="Search this subject..."
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-[#7A1F1F]"
                    />

                    <select
                      value={selectedSemesterId}
                      onChange={(event) => setSelectedSemesterId(event.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 outline-none transition focus:border-[#7A1F1F]"
                    >
                      <option value="">Choose a semester</option>
                      {semesters.map((semester) => (
                        <option key={semester.semester_id} value={String(semester.semester_id)}>
                          {semester.term} {semester.year}
                        </option>
                      ))}
                    </select>

                    {!userId && (
                      <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                        <Link href="/auth/google" className="font-bold text-[#7A1F1F] hover:underline">
                          Sign in
                        </Link>{' '}
                        to add classes.
                      </p>
                    )}

                    {actionMessage && (
                      <p className="rounded-lg bg-[#f5e8e8] p-3 text-sm font-semibold text-[#7A1F1F]">
                        {actionMessage}
                      </p>
                    )}
                  </div>
                )}

                {coursesLoading && (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="h-20 animate-pulse rounded-xl bg-gray-100" />
                    ))}
                  </div>
                )}

                {coursesError && (
                  <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
                    {coursesError}
                  </div>
                )}

                {selectedDepartment && !coursesLoading && !coursesError && visibleCourses.length === 0 && (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm leading-6 text-gray-500">
                    No courses match this subject/search.
                  </div>
                )}

                {visibleCourses.length > 0 && !coursesLoading && (
                  <div className="space-y-3">
                    {visibleCourses.map((course) => {
                      const isEnrolled = selectedSemesterId
                        ? enrolledKeys.has(`${course.course_id}:${selectedSemesterId}`)
                        : false;

                      return (
                      <div
                        key={course.course_id}
                        className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-[#7A1F1F] hover:shadow-sm"
                      >
                        <p className="text-sm font-extrabold uppercase tracking-wide text-[#7A1F1F]">
                          {course.course_number}
                        </p>
                        <h3 className="mt-1 font-bold leading-snug text-gray-900">
                          {course.title}
                        </h3>
                        <button
                          type="button"
                          onClick={() => addCourse(course)}
                          disabled={!userId || !selectedSemesterId || isEnrolled || addingCourseId === course.course_id}
                          className="mt-4 w-full rounded-lg border border-[#7A1F1F] px-3 py-2 text-sm font-bold text-[#7A1F1F] transition hover:bg-[#7A1F1F] hover:text-white disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          {addingCourseId === course.course_id
                            ? 'Adding...'
                            : isEnrolled
                            ? 'Added'
                            : 'Add to My Classes'}
                        </button>
                      </div>
                    );
                    })}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
