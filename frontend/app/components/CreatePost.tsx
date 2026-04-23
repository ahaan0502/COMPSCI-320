'use client';

import { type ChangeEvent, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface CreatePostProps {
  onSuccess?: () => void;
}

interface EnrolledCourseRow {
  course_id: number;
  semester_id: number;
  Courses: {
    course_id: number;
    course_number: string;
    title: string;
  }[] | {
    course_id: number;
    course_number: string;
    title: string;
  } | null;
  Semesters: {
    semester_id: number;
    term: string;
    year: number | string;
  }[] | {
    semester_id: number;
    term: string;
    year: number | string;
  } | null;
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
  const [selectedEnrollment, setSelectedEnrollment] = useState('');
  const [enrollments, setEnrollments] = useState<EnrolledCourseRow[]>([]);
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
            semester_id,
            Courses (
              course_id,
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

        if (coursesError) {
          console.error('Error fetching courses:', coursesError);
          setError('Failed to load enrolled courses.');
        } else {
          setEnrollments(((enrolledCourses || []) as EnrolledCourseRow[]).filter((row) => {
            return firstRelation(row.Courses) !== null && firstRelation(row.Semesters) !== null;
          }));
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
    setSelectedEnrollment('');
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

    if (!selectedEnrollment) {
      setError('Class is required.');
      return;
    }

    const [courseId, semesterId] = selectedEnrollment.split(':').map(Number);

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
          course_id: courseId,
          semester_id: semesterId,
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
          Class
        </label>
        <select
          value={selectedEnrollment}
          onChange={(event) => setSelectedEnrollment(event.target.value)}
          disabled={isLoadingOptions}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Select an enrolled class</option>
          {enrollments.map((row) => {
            const course = firstRelation(row.Courses);
            const semester = firstRelation(row.Semesters);

            if (!course || !semester) return null;

            return (
              <option
                key={`${row.course_id}:${row.semester_id}`}
                value={`${row.course_id}:${row.semester_id}`}
              >
                {course.course_number} - {course.title} ({semester.term} {semester.year})
              </option>
            );
          })}
        </select>
        {!isLoadingOptions && enrollments.length === 0 && (
          <p className="mt-2 text-sm text-gray-500">
            Add a class from the Course Catalogue before posting notes.
          </p>
        )}
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
          Reset
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
