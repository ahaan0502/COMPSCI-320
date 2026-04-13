'use client';

import React, { useState } from "react";

/* =========================
   Types
========================= */
interface Post {
  id: string;
  title: string;
  content: string;
  votes: number;
}

/* =========================
   SVG Icons
========================= */
const BookMarkedIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
    <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-3-6 3V4z" />
  </svg>
);

const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-12 h-12">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

/* =========================
   Props
========================= */
interface SavedNotesViewProps {
  savedPosts: Post[];
  onVote: (postId: string, voteType: "up" | "down") => void;
  onComment: (postId: string, comment: string) => void;
  onUnsave?: (postId: string) => void;
}

/* =========================
   Component
========================= */
export function SavedNotesView({
  savedPosts,
  onVote,
  onComment,
  onUnsave,
}: SavedNotesViewProps) {
  return (
    <div className="max-w-5xl mx-auto p-6 bg-white min-h-screen">
      
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-[#f5e8e8] p-3 rounded-lg text-[#7A1F1F]">
            <BookMarkedIcon />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Saved Notes
          </h1>
        </div>
        <p className="text-gray-600">
          Quickly access notes you've bookmarked for later.
        </p>
      </div>

      {/* Content */}
      {savedPosts.length > 0 ? (
        <div className="space-y-5">
          {savedPosts.map((post) => (
            <div
              key={post.id}
              className="border border-gray-200 rounded-xl p-5 bg-white transition-all hover:shadow-md hover:border-[#7A1F1F]"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {post.title}
              </h2>
              <p className="text-gray-600 mb-4">
                {post.content}
              </p>

              <div className="flex items-center justify-between">
                
                {/* Voting */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onVote(post.id, "up")}
                    className="text-sm font-semibold text-gray-500 hover:text-green-600"
                  >
                    ▲
                  </button>
                  <span className="text-sm font-medium text-gray-700">
                    {post.votes}
                  </span>
                  <button
                    onClick={() => onVote(post.id, "down")}
                    className="text-sm font-semibold text-gray-500 hover:text-red-600"
                  >
                    ▼
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => onComment(post.id, "Nice note!")}
                    className="text-sm font-medium text-gray-500 hover:text-[#7A1F1F]"
                  >
                    Comment
                  </button>

                  {onUnsave && (
                    <button
                      onClick={() => onUnsave(post.id)}
                      className="text-sm font-semibold text-[#7A1F1F] hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="text-gray-300 flex justify-center mb-4">
            <FileIcon />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            No saved notes yet
          </h3>
          <p className="text-gray-500 font-medium">
            Save notes by clicking the bookmark icon on posts.
          </p>
        </div>
      )}
    </div>
  );
}

/* =========================
   PAGE (FIXED)
========================= */
export default function Page() {
  const [savedPosts, setSavedPosts] = useState<Post[]>([
    {
      id: "1",
      title: "Binary Trees Explained",
      content: "A binary tree is a hierarchical structure...",
      votes: 12,
    },
    {
      id: "2",
      title: "QuickSort Notes",
      content: "QuickSort uses divide and conquer...",
      votes: 8,
    },
  ]);

  const handleUnsave = (id: string) => {
    setSavedPosts((prev) => prev.filter((post) => post.id !== id));
  };

  const handleVote = (id: string, type: "up" | "down") => {
    setSavedPosts((prev) =>
      prev.map((post) =>
        post.id === id
          ? {
              ...post,
              votes: type === "up" ? post.votes + 1 : post.votes - 1,
            }
          : post
      )
    );
  };

  return (
    <SavedNotesView
      savedPosts={savedPosts}
      onVote={handleVote}
      onComment={(id, comment) => console.log(id, comment)}
      onUnsave={handleUnsave}
    />
  );
}