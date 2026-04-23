'use client';

import { useState } from "react";
import NoteCard, { type NotePost } from '../components/NoteCard';

export default function SavedNotesPage() {
  const [savedPosts, setSavedPosts] = useState<NotePost[]>([
    {
      id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author_id: "1",
      author_name: "John Doe",
      author_email: "john@example.com",
      title: "Binary Trees Explained",
      body: "A binary tree is a hierarchical structure...",
      purpose: null,
      visibility: "public",
      group_id: null,
      tags: [],
      votes: 12,
      is_deleted: false,
      course_id: 1,
      semester_id: 1,
      is_report: false,
      course_label: "CS101",
      semester_label: "Fall 2025",
      comments_count: 3,
    },
    {
      id: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author_id: "2",
      author_name: "Jane Smith",
      author_email: "jane@example.com",
      title: "QuickSort Notes",
      body: "QuickSort uses divide and conquer...",
      purpose: null,
      visibility: "private",
      group_id: null,
      tags: [],
      votes: 8,
      is_deleted: false,
      course_id: 1,
      semester_id: 1,
      is_report: false,
      course_label: "CS201",
      semester_label: "Spring 2026",
      comments_count: 1,
    },
  ]);

  const handleUnsave = (id: number) => {
    setSavedPosts((prev) => prev.filter((post) => post.id !== id));
  };

  return (
    <main className="min-h-screen w-full bg-gray-50 px-6 py-10">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-zinc-900">
          Saved Notes
        </h1>
        <p className="mt-2 text-zinc-600">
          All the notes you’ve bookmarked in one place.
        </p>
      </div>

      {/* Content */}
      {savedPosts.length > 0 ? (
        <div className="flex flex-col gap-5">
          {savedPosts.map((post) => (
            
            /* Wrapper so we DON'T modify NoteCard */
            <div key={post.id} className="relative">
              
              {/* Unsave Button */}
              <button
                onClick={() => handleUnsave(post.id)}
                className="absolute right-4 top-4 z-10 text-sm font-semibold text-red-600 hover:underline"
              >
                Unsave
              </button>

              <NoteCard post={post} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-20 text-center">
          <p className="text-lg font-semibold text-zinc-800">
            No saved notes yet
          </p>
          <p className="mt-2 text-zinc-500">
            Bookmark notes to see them here.
          </p>
        </div>
      )}
    </main>
  );
}