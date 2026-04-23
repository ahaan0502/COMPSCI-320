'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import NoteCard, { type NotePost, type PostVisibility } from '../../components/NoteCard';

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-16 w-16">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

interface UserProfileState {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

interface SupabasePostRow {
  post_id: number;
  created_at: string;
  author_id: string;
  title: string | null;
  body: string | null;
  purpose: string | null;
  visibility: PostVisibility;
  group_id: number | null;
  tags: string[] | null;
  votes: number | null;
  updated_at: string | null;
  course_id: number | null;
  semester_id: number | null;
  is_report: boolean | null;
  attachment_url: string | null;
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

const supabase = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

function firstRelation<T>(value: T[] | T | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default function AuthorProfilePage() {
  const params = useParams<{ authorId: string }>();
  const router = useRouter();
  const authorId = params.authorId;
  const [profile, setProfile] = useState<UserProfileState | null>(null);
  const [posts, setPosts] = useState<NotePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const client = supabase();

      const { data: profileRow, error: profileError } = await client
        .from('Users')
        .select('author_id, name, email, avatar_url')
        .eq('author_id', authorId)
        .maybeSingle();

      if (profileError) {
        console.error('Failed to load author profile:', profileError);
        setError('Failed to load profile.');
        setLoading(false);
        return;
      }

      if (!profileRow?.email) {
        setProfile(null);
        setPosts([]);
        setLoading(false);
        return;
      }

      setProfile({
        id: profileRow.author_id,
        name: profileRow.name || profileRow.email.split('@')[0],
        email: profileRow.email,
        avatarUrl: profileRow.avatar_url || null,
      });

      const { data: postsData, error: postsError } = await client
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
          attachment_url,
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
        .eq('author_id', authorId)
        .eq('is_report', false)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Failed to load author posts:', postsError);
        setError('Failed to load posts.');
        setLoading(false);
        return;
      }

      const mappedPosts: NotePost[] = ((postsData || []) as SupabasePostRow[]).map((post) => {
        const user = firstRelation(post.Users);
        const course = firstRelation(post.Courses);
        const semester = firstRelation(post.Semesters);

        return {
          id: post.post_id,
          created_at: post.created_at,
          author_id: post.author_id,
          title: post.title ?? '',
          body: post.body ?? '',
          purpose: post.purpose,
          visibility: post.visibility,
          group_id: post.group_id,
          tags: post.tags ?? [],
          votes: post.votes ?? 0,
          updated_at: post.updated_at ?? post.created_at,
          is_deleted: false,
          course_id: post.course_id,
          semester_id: post.semester_id,
          is_report: post.is_report ?? false,
          attachment_url: post.attachment_url,
          author_name: user?.name ?? profileRow.name ?? profileRow.email,
          author_email: user?.email ?? profileRow.email,
          course_label: `${course?.course_number ?? ''}${course?.title ? ` - ${course.title}` : ''}`.trim(),
          semester_label: `${semester?.term ?? ''} ${semester?.year ?? ''}`.trim(),
          comments_count: 0,
        };
      });

      setPosts(mappedPosts);
      setLoading(false);
    };

    loadProfile();
  }, [authorId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-500">Loading profile...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="mb-2 text-2xl font-extrabold text-gray-900">Profile not found</h1>
          <button
            type="button"
            onClick={() => router.push('/notes')}
            className="mt-4 rounded-lg bg-[#7A1F1F] px-5 py-3 font-bold text-white transition hover:bg-[#5a1616]"
          >
            Back to Notes
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#f5e8e8] text-[#7A1F1F] shadow-md">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <UserIcon />
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="mb-1 text-3xl font-extrabold tracking-tight text-gray-900">{profile.name}</h1>
              <p className="text-sm font-medium text-gray-500">{profile.email}</p>
              <p className="mt-3 text-sm text-gray-400">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'} shared
              </p>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Posts</h2>
          {posts.length > 0 ? (
            posts.map((post) => <NoteCard key={post.id} post={post} />)
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-20 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">No posts shared.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
