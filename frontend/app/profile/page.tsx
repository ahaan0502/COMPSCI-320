'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import NoteCard, { type NotePost, type PostVisibility } from '../components/NoteCard';

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-16 w-16">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

type TabType = 'posts' | 'liked' | 'comments';

interface CommentItem {
  id: string;
  postTitle: string;
  content: string;
}

interface EnrolledCourseItem {
  id: string;
  label: string;
  semesterLabel: string;
}

interface ProfileState {
  userId: string;
  displayName: string;
  handleOrFallback: string;
  email: string;
  major: string | null;
  avatarUrl: string | null;
  posts: NotePost[];
  likedPosts: NotePost[];
  comments: CommentItem[];
  courses: EnrolledCourseItem[];
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

interface CommentRow {
  id: number;
  body: string;
  post_id: number | null;
  Posts:
    | {
        title: string | null;
      }[]
    | {
        title: string | null;
      }
    | null;
}

interface EnrolledCourseRow {
  course_id: number;
  semester_id: number;
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

function emailLocalPart(email: string) {
  return email.split('@')[0] || 'User';
}

function formatFallbackName(email: string) {
  return emailLocalPart(email)
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDisplayName(name: string | null | undefined, fallbackEmail: string, metadataName?: string | null) {
  const cleanedName = name?.trim();
  if (cleanedName) return cleanedName;

  const cleanedMetadata = metadataName?.trim();
  if (cleanedMetadata) return cleanedMetadata;

  return formatFallbackName(fallbackEmail);
}

function mapPosts(posts: SupabasePostRow[], commentsCountByPost: Map<number, number>): NotePost[] {
  return posts.map((post) => {
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
      visibility: normalizeVisibility(post.visibility),
      group_id: post.group_id,
      tags: normalizeTags(post.tags),
      votes: post.votes ?? 0,
      updated_at: post.updated_at ?? post.created_at,
      is_deleted: false,
      course_id: post.course_id,
      semester_id: post.semester_id,
      is_report: Boolean(post.is_report),
      attachment_url: post.attachment_url,
      author_name: user?.name ?? 'Unknown',
      author_email: user?.email ?? '',
      course_label: `${course?.course_number ?? 'Unknown course'} - ${course?.title ?? 'Untitled course'}`,
      semester_label: `${semester?.term ?? ''} ${semester?.year ?? ''}`.trim() || 'Unknown semester',
      comments_count: commentsCountByPost.get(post.post_id) ?? 0,
    };
  });
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-20 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{message}</p>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempDisplayName, setTempDisplayName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = getClient();

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setError('Please sign in to view your profile.');
          setLoading(false);
          return;
        }

        const email = session.user.email ?? '';
        const metadataName =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          null;

        const { data: userProfile, error: userError } = await supabase
          .from('Users')
          .select('name, email, major, avatar_url')
          .eq('author_id', session.user.id)
          .maybeSingle();

        if (userError) {
          throw userError;
        }

        const [{ data: postsData, error: postsError }, { data: commentCountsData, error: commentCountsError }, { data: votesData, error: votesError }, { data: commentsData, error: commentsError }, { data: coursesData, error: coursesError }] =
          await Promise.all([
            supabase
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
              .eq('author_id', session.user.id)
              .order('created_at', { ascending: false }),
            supabase.from('Comments').select('post_id'),
            supabase.from('Post_Votes').select('post_id').eq('user_id', session.user.id).eq('value', 1),
            supabase
              .from('Comments')
              .select(`
                id,
                body,
                post_id,
                Posts (
                  title
                )
              `)
              .eq('author_id', session.user.id)
              .order('id', { ascending: false }),
            supabase
              .from('Student_Enrolled_Courses')
              .select(`
                course_id,
                semester_id,
                Courses (
                  course_number,
                  title
                ),
                Semesters (
                  term,
                  year
                )
              `)
              .eq('author_id', session.user.id)
              .order('course_id', { ascending: true }),
          ]);

        if (postsError) throw postsError;
        if (commentCountsError) throw commentCountsError;
        if (votesError) throw votesError;
        if (commentsError) throw commentsError;
        if (coursesError) throw coursesError;

        const commentsCountByPost = new Map<number, number>();
        for (const row of (commentCountsData || []) as { post_id: number | null }[]) {
          if (typeof row.post_id !== 'number') continue;
          commentsCountByPost.set(row.post_id, (commentsCountByPost.get(row.post_id) ?? 0) + 1);
        }

        const ownPosts = mapPosts((postsData || []) as SupabasePostRow[], commentsCountByPost);

        const likedPostIds = Array.from(
          new Set(
            ((votesData || []) as { post_id: number }[])
              .map((vote) => vote.post_id)
              .filter((postId): postId is number => typeof postId === 'number'),
          ),
        );

        let likedPosts: NotePost[] = [];
        if (likedPostIds.length > 0) {
          const { data: likedPostsData, error: likedPostsError } = await supabase
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
            .in('post_id', likedPostIds)
            .order('created_at', { ascending: false });

          if (likedPostsError) throw likedPostsError;

          likedPosts = mapPosts((likedPostsData || []) as SupabasePostRow[], commentsCountByPost);
        }

        const displayName = formatDisplayName(userProfile?.name, userProfile?.email || email, metadataName);
        const courses = ((coursesData || []) as EnrolledCourseRow[]).map((row) => {
          const course = firstRelation(row.Courses);
          const semester = firstRelation(row.Semesters);

          return {
            id: `${row.course_id}:${row.semester_id}`,
            label: `${course?.course_number ?? `Course ${row.course_id}`} - ${course?.title ?? 'Untitled course'}`,
            semesterLabel: `${semester?.term ?? ''} ${semester?.year ?? ''}`.trim() || 'Unknown semester',
          };
        });

        const comments = ((commentsData || []) as CommentRow[]).map((comment) => ({
          id: String(comment.id),
          postTitle: firstRelation(comment.Posts)?.title ?? 'Untitled post',
          content: comment.body,
        }));

        setProfile({
          userId: session.user.id,
          displayName,
          handleOrFallback: displayName,
          email: userProfile?.email || email,
          major: userProfile?.major ?? null,
          avatarUrl: userProfile?.avatar_url ?? null,
          posts: ownPosts,
          likedPosts,
          comments,
          courses,
        });
        setTempDisplayName(displayName);
      } catch (loadError) {
        console.error('Profile load failed:', loadError);
        setError(loadError instanceof Error ? loadError.message : 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const handleSaveDisplayName = async () => {
    if (!profile) return;

    const nextName = tempDisplayName.trim();
    if (!nextName) {
      setIsEditModalOpen(false);
      return;
    }

    try {
      const supabase = getClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error('Please sign in to update your profile.');
      }

      const { error: updateError } = await supabase
        .from('Users')
        .update({ name: nextName })
        .eq('author_id', session.user.id);

      if (updateError) throw updateError;

      setProfile({
        ...profile,
        displayName: nextName,
        handleOrFallback: nextName,
      });
      setIsEditModalOpen(false);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update display name.');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Profile picture must be under 5MB.');
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${profile.userId}/${Date.now()}.${extension}`;
    const supabase = getClient();

    setUploading(true);
    setError(null);

    try {
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(path);

      const avatarUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from('Users')
        .update({ avatar_url: avatarUrl })
        .eq('author_id', profile.userId);

      if (updateError) throw updateError;

      setProfile({
        ...profile,
        avatarUrl: `${avatarUrl}?t=${Date.now()}`,
      });
    } catch (uploadError) {
      console.error('Failed to upload profile picture:', uploadError);
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload profile picture.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-500">Loading profile...</p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6">
        <div className="max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-800">Profile Unavailable</h1>
          <p className="text-zinc-600">{error ?? 'Unable to load profile.'}</p>
        </div>
      </main>
    );
  }

  const tabs = [
    { id: 'posts', label: 'My Posts', count: profile.posts.length },
    { id: 'liked', label: 'Liked', count: profile.likedPosts.length },
    { id: 'comments', label: 'Comments', count: profile.comments.length },
  ] as const;

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-8 md:flex-row md:items-start">
            <div className="group relative">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#f5e8e8] text-[#7A1F1F] shadow-md">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <UserIcon />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-[#7A1F1F] p-2 text-white shadow-lg transition-all hover:bg-[#5a1616] disabled:cursor-not-allowed disabled:opacity-60"
                title="Upload a profile photo"
              >
                <CameraIcon />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="mb-1 flex items-center justify-center gap-3 md:justify-start">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{profile.displayName}</h1>
                <button
                  type="button"
                  onClick={() => {
                    setTempDisplayName(profile.displayName);
                    setIsEditModalOpen(true);
                  }}
                  className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-[#f5e8e8] hover:text-[#7A1F1F]"
                >
                  <EditIcon />
                </button>
              </div>
              <p className="mb-3 text-sm font-bold uppercase tracking-widest text-[#7A1F1F]">{profile.handleOrFallback}</p>
              <p className="text-sm font-medium text-gray-500">{profile.email}</p>
              {profile.major && <p className="mt-2 text-sm text-gray-500">{profile.major}</p>}
              <p className="mt-3 text-sm text-gray-400">
                {uploading ? 'Uploading profile picture...' : 'Profile picture changes save automatically.'}
              </p>

              <div className="mt-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">My Classes</p>
                {profile.courses.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                    {profile.courses.map((course) => (
                      <div key={course.id} className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                        {course.label}
                        <span className="ml-2 text-zinc-400">{course.semesterLabel}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No enrolled classes found.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 flex overflow-x-auto border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-6 py-4 text-sm font-bold tracking-tight transition-all ${
                activeTab === tab.id ? 'border-[#7A1F1F] text-[#7A1F1F]' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] ${
                  activeTab === tab.id ? 'bg-[#7A1F1F] text-white' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {activeTab === 'posts' &&
            (profile.posts.length > 0 ? profile.posts.map((post) => <NoteCard key={post.id} post={post} />) : <EmptyState message="No posts shared." />)}

          {activeTab === 'liked' &&
            (profile.likedPosts.length > 0 ? (
              profile.likedPosts.map((post) => <NoteCard key={post.id} post={post} />)
            ) : (
              <EmptyState message="No liked content." />
            ))}

          {activeTab === 'comments' &&
            (profile.comments.length > 0 ? (
              profile.comments.map((comment) => (
                <div key={comment.id} className="rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-[#7A1F1F]">
                  <div className="mb-2 flex items-start justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#7A1F1F]">On: {comment.postTitle}</span>
                  </div>
                  <p className="py-1 font-medium text-gray-700">&quot;{comment.content}&quot;</p>
                </div>
              ))
            ) : (
              <EmptyState message="No comments yet." />
            ))}
        </div>

        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Update Display Name</h2>
              <input
                type="text"
                value={tempDisplayName}
                onChange={(event) => setTempDisplayName(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold text-gray-900 outline-none focus:border-[#7A1F1F]"
                autoFocus
              />
              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 rounded-xl py-3 font-bold text-gray-400 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveDisplayName()}
                  className="flex-1 rounded-xl bg-[#7A1F1F] py-3 font-bold text-white shadow-lg shadow-[#7A1F1F]/20"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
