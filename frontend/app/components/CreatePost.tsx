'use client';

import { type ChangeEvent, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface CreatePostProps {
  onSuccess?: () => void;
}

interface Course {
  course_id: number;
  course_number: string;
  title: string;
}

interface Semester {
  semester_id: number;
  term: string;
  year: number | string;
}

interface EnrolledCourseRow {
  course_id: number;
  Courses: Course[] | Course | null;
}

interface EnrolledSemesterRow {
  semester_id: number;
  Semesters: Semester[] | Semester | null;
}

const supabase = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

function firstRelation<T>(value: T[] | T | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function CreatePost({ onSuccess }: CreatePostProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  useEffect(() => {
    const fetchEnrolledData = async () => {
      const client = supabase();

      try {
        const { data: { session } } = await client.auth.getSession();

        if (!session?.user) {
          setError('Please sign in before creating a post.');
          return;
        }

        const { data: enrolledCourses, error: coursesError } = await client
          .from('Student_Enrolled_Courses')
          .select(`
            course_id,
            Courses (
              course_id,
              course_number,
              title
            )
          `)
          .eq('author_id', session.user.id);

        if (coursesError) {
          console.error('Error fetching courses:', coursesError);
          setError('Failed to load enrolled courses.');
        } else {
          const courseList = ((enrolledCourses || []) as EnrolledCourseRow[])
            .map((row) => firstRelation(row.Courses))
            .filter((course): course is Course => course !== null);
          setCourses(courseList);
        }

        const { data: enrolledSemesters, error: semestersError } = await client
          .from('Student_Enrolled_Courses')
          .select(`
            semester_id,
            Semesters (
              semester_id,
              term,
              year
            )
          `)
          .eq('author_id', session.user.id);

        if (semestersError) {
          console.error('Error fetching semesters:', semestersError);
          setError('Failed to load enrolled semesters.');
        } else {
          const seen = new Set<number>();
          const semesterList = ((enrolledSemesters || []) as EnrolledSemesterRow[])
            .map((row) => firstRelation(row.Semesters))
            .filter((semester): semester is Semester => {
              if (!semester || seen.has(semester.semester_id)) return false;
              seen.add(semester.semester_id);
              return true;
            });
          setSemesters(semesterList);
        }
      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchEnrolledData();
  }, []);

  const uploadFileToStorage = async (file: File, userId: string): Promise<string | null> => {
    try {
      const client = supabase();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await client.storage
        .from('post-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = client.storage
        .from('post-attachments')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCourseId('');
    setSemesterId('');
    setIsPublic(true);
    setSelectedFile(null);

    const fileInput = document.getElementById('file-upload') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
  };

  const createPost = async () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    if (!content.trim()) {
      setError('Content is required.');
      return;
    }

    if (!courseId || !semesterId) {
      setError('Course and semester are required.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const client = supabase();
      const { data: { session } } = await client.auth.getSession();

      if (!session?.user) {
        setError('Please sign in before creating a post.');
        return;
      }

      let attachmentUrl: string | null = null;

      if (selectedFile) {
        attachmentUrl = await uploadFileToStorage(selectedFile, session.user.id);
        if (!attachmentUrl) {
          setError('Failed to upload attachment.');
          return;
        }
      }

      const { error: insertError } = await client
        .from('Posts')
        .insert([{
          created_at: new Date().toISOString(),
          author_id: session.user.id,
          title: title.trim(),
          body: content.trim(),
          purpose: null,
          visibility: isPublic ? 'public' : 'private',
          group_id: null,
          tags: ['cics', 'notes'],
          votes: 0,
          updated_at: new Date().toISOString(),
          course_id: Number(courseId),
          semester_id: Number(semesterId),
          is_report: false,
          attachment_url: attachmentUrl,
        }]);

      if (insertError) {
        console.error('Insert error:', insertError);
        setError(`Failed to create post: ${insertError.message}`);
        return;
      }

      resetForm();
      onSuccess?.();
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border-2 border-gray-300 rounded-lg bg-white p-4 dark:bg-gray-800">
      {error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mb-4">
        <label className="mb-1 block text-left text-lg font-medium text-gray-700 dark:text-gray-300">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter title"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-left text-lg font-medium text-gray-700 dark:text-gray-300">
          Course
        </label>
        <select
          value={courseId}
          onChange={(event) => setCourseId(event.target.value)}
          disabled={isLoadingOptions}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Select a course</option>
          {courses.map((course) => (
            <option key={course.course_id} value={String(course.course_id)}>
              {course.course_number} - {course.title}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-left text-lg font-medium text-gray-700 dark:text-gray-300">
          Semester
        </label>
        <select
          value={semesterId}
          onChange={(event) => setSemesterId(event.target.value)}
          disabled={isLoadingOptions}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Select a semester</option>
          {semesters.map((semester) => (
            <option key={semester.semester_id} value={String(semester.semester_id)}>
              {semester.term} {semester.year}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-left text-lg font-medium text-gray-700 dark:text-gray-300">
          Content
        </label>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write your notes here..."
          rows={4}
          className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-left text-lg font-medium text-gray-700 dark:text-gray-300">
          Add Attachment - file must be less than 10MB
        </label>
        <input
          id="file-upload"
          type="file"
          onChange={handleFileUpload}
          accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        {selectedFile && (
          <p className="mt-2 text-sm text-green-600 dark:text-green-400">
            Selected: {selectedFile.name}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Public Post
          </span>
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          onClick={resetForm}
        >
          Cancel
        </button>
        <button
          type="button"
          className="rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
          onClick={createPost}
          disabled={isUploading}
        >
          {isUploading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
}
