'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

interface Department {
  department_id: number;
  department_name: string;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function DepartmentsPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('Departments')
        .select('department_id, department_name')
        .order('department_name', { ascending: true });

      if (error) {
        console.error('Departments error:', error);
        setError('Failed to load departments');
        setLoading(false);
        return;
      }

      setDepartments(data || []);
      setLoading(false);
    };

    fetchDepartments();
  }, []);

  // Get letters that actually have departments
  const lettersWithDepts = new Set(
    departments.map((d) => d.department_name[0].toUpperCase())
  );

  const filtered = activeLetter
    ? departments.filter((d) => d.department_name[0].toUpperCase() === activeLetter)
    : departments;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Loading departments...</p>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-red-500">{error}</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
          Course Catalogue
        </h1>
        <p className="text-gray-500">
          Browse all departments at UMass Amherst. Select a department to view its courses.
        </p>
      </div>

      {/* Alphabet Filter */}
      <div className="flex flex-wrap gap-1.5 mb-8">
        <button
          onClick={() => setActiveLetter(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
            activeLetter === null
              ? 'bg-[#7A1F1F] text-white'
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
              onClick={() => hasItems ? setActiveLetter(letter) : null}
              className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${
                activeLetter === letter
                  ? 'bg-[#7A1F1F] text-white'
                  : hasItems
                  ? 'bg-gray-100 text-gray-700 hover:bg-[#f5e8e8] hover:text-[#7A1F1F]'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-400 mb-6">
        {filtered.length} {filtered.length === 1 ? 'department' : 'departments'} 
        {activeLetter ? ` starting with "${activeLetter}"` : ' total'}
      </p>

      {/* Department Grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map((dept) => (
          <button
            key={dept.department_id}
            onClick={() => router.push(`/catalogue/courses/${dept.department_id}`)}
            className="text-left bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-[#7A1F1F] hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-800 group-hover:text-[#7A1F1F] transition-colors leading-snug">
                {dept.department_name}
              </span>
              <svg
                className="w-4 h-4 text-gray-300 group-hover:text-[#7A1F1F] transition-colors shrink-0 ml-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-medium">No departments found for &quot;{activeLetter}&quot;</p>
        </div>
      )}
    </div>
  );
}