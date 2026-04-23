'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import NoteCard, { NotePost } from '../components/NoteCard';

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

type TabType = 'posts' | 'saved' | 'liked' | 'comments';

interface Comment {
  id: string;
  postTitle: string;
  content: string;
  date: string;
}

interface UserProfileState {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

const supabase = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

const mockPosts: NotePost[] = [
  {
    id: 1,
    created_at: new Date().toISOString(),
    author_id: '1',
    title: 'CS 240 - Probability Summary',
    body: 'Summary of key concepts.',
    purpose: 'Study',
    visibility: 'public',
    group_id: null,
    tags: [],
    votes: 32,
    updated_at: new Date().toISOString(),
    is_deleted: false,
    course_id: 1,
    semester_id: 1,
    is_report: false,
    author_name: 'You',
    author_email: 'you@umass.edu',
    course_label: 'CS 240',
    semester_label: 'Spring 2026',
    comments_count: 0,
  },
];

const mockComments: Comment[] = [];

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-20 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{message}</p>
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfileState | null>(null);
  const [username, setUsername] = useState('NewUser');
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempUsername, setTempUsername] = useState(username);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savedPosts: NotePost[] = [];
  const likedPosts: NotePost[] = [];
  const userComments = mockComments;

  useEffect(() => {
    const loadProfile = async () => {
      const client = supabase();
      const { data: { user } } = await client.auth.getUser();

      if (!user?.email) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const fallbackName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email.split('@')[0] ||
        'User';

      const { data: userRow, error: profileError } = await client
        .from('Users')
        .select('name, email, avatar_url')
        .eq('author_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Failed to load profile:', profileError);
        setError('Failed to load profile.');
        setLoading(false);
        return;
      }

      const resolvedName = userRow?.name || fallbackName;
      setProfile({
        id: user.id,
        email: userRow?.email || user.email,
        name: resolvedName,
        avatarUrl: userRow?.avatar_url || null,
      });
      setUsername(resolvedName.replace(/\s+/g, '').toLowerCase());
      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleSaveUsername = () => {
    setUsername(tempUsername);
    setIsEditModalOpen(false);
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
    const path = `${profile.id}/${Date.now()}.${extension}`;
    const client = supabase();

    setUploading(true);
    setError(null);

    try {
      const { error: uploadError } = await client.storage
        .from('profile-pictures')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = client.storage
        .from('profile-pictures')
        .getPublicUrl(path);

      const avatarUrl = publicUrlData.publicUrl;

      const { error: updateError } = await client
        .from('Users')
        .update({ avatar_url: avatarUrl })
        .eq('author_id', profile.id);

      if (updateError) {
        throw updateError;
      }

      setProfile((current) => current ? { ...current, avatarUrl: `${avatarUrl}?t=${Date.now()}` } : current);
    } catch (uploadError) {
      console.error('Failed to upload profile picture:', uploadError);
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload profile picture.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const tabs = [
    { id: 'posts', label: 'My Posts', count: mockPosts.length },
    { id: 'saved', label: 'Saved', count: savedPosts.length },
    { id: 'liked', label: 'Liked', count: likedPosts.length },
    { id: 'comments', label: 'Comments', count: userComments.length },
  ];

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-500">Loading profile...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="mb-2 text-2xl font-extrabold text-gray-900">Sign in to view your profile</h1>
          <p className="mb-6 text-gray-600">Your profile picture is tied to your UNotes account.</p>
          <button
            type="button"
            onClick={() => router.push('/auth/google')}
            className="rounded-lg bg-[#7A1F1F] px-5 py-3 font-bold text-white transition hover:bg-[#5a1616]"
          >
            Sign In
          </button>
        </div>
      </main>
    );
  }

  const realName = profile.name || profile.email.split('@')[0];

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl p-6">
        {error && (
          <div className="mb-6 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
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
              >
                <CameraIcon />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="mb-1 flex items-center justify-center gap-3 md:justify-start">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{realName}</h1>
                <button
                  type="button"
                  onClick={() => {
                    setTempUsername(username);
                    setIsEditModalOpen(true);
                  }}
                  className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-[#f5e8e8] hover:text-[#7A1F1F]"
                >
                  <EditIcon />
                </button>
              </div>
              <p className="mb-4 text-sm font-bold uppercase tracking-widest text-[#7A1F1F]">@{username}</p>
              <p className="text-sm font-medium text-gray-500">{profile.email}</p>
              <p className="mt-3 text-sm text-gray-400">
                {uploading ? 'Uploading profile picture...' : 'Profile picture changes save automatically.'}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 flex overflow-x-auto border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-6 py-4 text-sm font-bold tracking-tight transition-all ${
                activeTab === tab.id
                  ? 'border-[#7A1F1F] text-[#7A1F1F]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                activeTab === tab.id ? 'bg-[#7A1F1F] text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {activeTab === 'posts' && (
            mockPosts.length > 0 ? mockPosts.map((post) => <NoteCard key={post.id} post={post} />) : <EmptyState message="No posts shared." />
          )}

          {activeTab === 'saved' && (
            savedPosts.length > 0 ? savedPosts.map((post) => <NoteCard key={post.id} post={post} />) : <EmptyState message="No saved notes." />
          )}

          {activeTab === 'liked' && (
            likedPosts.length > 0 ? likedPosts.map((post) => <NoteCard key={post.id} post={post} />) : <EmptyState message="No liked content." />
          )}

          {activeTab === 'comments' && (
            userComments.length > 0 ? (
              userComments.map((comment) => (
                <div key={comment.id} className="rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-[#7A1F1F]">
                  <div className="mb-2 flex justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#7A1F1F]">On: {comment.postTitle}</span>
                  </div>
                  <p className="py-1 font-medium text-gray-700">&quot;{comment.content}&quot;</p>
                  <p className="mt-2 text-[10px] font-bold text-gray-400">{comment.date}</p>
                </div>
              ))
            ) : <EmptyState message="No comments yet." />
          )}
        </div>

        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Update Profile Handle</h2>
              <input
                type="text"
                value={tempUsername}
                onChange={(event) => setTempUsername(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold text-gray-900 outline-none focus:border-[#7A1F1F]"
                autoFocus
              />
              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 rounded-xl py-3 font-bold text-gray-400 transition-colors hover:bg-gray-50">
                  Cancel
                </button>
                <button type="button" onClick={handleSaveUsername} className="flex-1 rounded-xl bg-[#7A1F1F] py-3 font-bold text-white shadow-lg shadow-[#7A1F1F]/20">
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
