'use client';

import React, { useState, useRef } from 'react';

// --- Simplified SVG Icons ---
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-16 h-16">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

// --- Types ---
type TabType = 'posts' | 'liked' | 'comments';

interface Post {
  id: string;
  title: string;
  upvotes: number;
  date: string;
  author?: string;
}

interface Comment {
  id: string;
  postTitle: string;
  content: string;
  date: string;
}

interface ProfileViewProps {
  userEmail: string;
  initialPosts: Post[];
  initialLiked: Post[];
  initialComments: Comment[];
}

export function ProfileView({ userEmail, initialPosts, initialLiked, initialComments }: ProfileViewProps) {
  // State Management
  const [username, setUsername] = useState("NewUser");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  
  // Content State (This only removes from the USER'S view/history)
  const [userPosts, setUserPosts] = useState(initialPosts);
  const [likedPosts, setLikedPosts] = useState(initialLiked);
  const [userComments, setUserComments] = useState(initialComments);

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempUsername, setTempUsername] = useState(username);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const realName = userEmail.split("@")[0];

  // --- Handlers ---
  const handleSaveUsername = () => {
    setUsername(tempUsername);
    setIsEditModalOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePic(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLike = (id: string) => {
    // Logic: This removes the reference from the user's "Liked" list, not the actual post.
    setLikedPosts(prev => prev.filter(p => p.id !== id));
  };

  const handleRemoveComment = (id: string) => {
    // Logic: This removes the comment activity from the user's profile.
    setUserComments(prev => prev.filter(c => c.id !== id));
  };

  const tabs = [
    { id: 'posts', label: 'My Posts', count: userPosts.length },
    { id: 'liked', label: 'Liked', count: likedPosts.length },
    { id: 'comments', label: 'Comments', count: userComments.length },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white min-h-screen">
      
      {/* Profile Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          
          {/* Profile Picture */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-[#f5e8e8] text-[#7A1F1F] flex items-center justify-center border-4 border-white shadow-md">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-[#7A1F1F] text-white p-2 rounded-full border-2 border-white hover:bg-[#5a1616] transition-all shadow-lg"
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
            <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{realName}</h1>
              <button 
                onClick={() => { setTempUsername(username); setIsEditModalOpen(true); }}
                className="p-1.5 text-gray-400 hover:text-[#7A1F1F] hover:bg-[#f5e8e8] rounded-md transition-colors"
              >
                <EditIcon />
              </button>
            </div>
            <p className="text-[#7A1F1F] font-bold text-sm uppercase tracking-widest mb-4">@{username}</p>
            <p className="text-gray-500 font-medium text-sm">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold tracking-tight transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-[#7A1F1F] text-[#7A1F1F]' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === tab.id ? 'bg-[#7A1F1F] text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'posts' && (
          userPosts.length > 0 ? (
            userPosts.map(post => (
              <div key={post.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#7A1F1F] transition-all group">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#7A1F1F] mb-1 block">{post.date}</span>
                <h3 className="text-lg font-bold text-gray-900">{post.title}</h3>
              </div>
            ))
          ) : <EmptyState message="No posts shared." />
        )}

        {activeTab === 'liked' && (
          likedPosts.length > 0 ? (
            likedPosts.map(post => (
              <div key={post.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#7A1F1F] transition-all flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{post.title}</h3>
                  <p className="text-sm text-gray-500 italic">by {post.author}</p>
                </div>
                <button 
                  onClick={() => handleRemoveLike(post.id)}
                  className="text-[11px] font-bold uppercase tracking-wider text-[#7A1F1F] hover:bg-[#f5e8e8] px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-[#7A1F1F]/20"
                >
                  Remove Like
                </button>
              </div>
            ))
          ) : <EmptyState message="No liked content." />
        )}

        {activeTab === 'comments' && (
          userComments.length > 0 ? (
            userComments.map(comment => (
              <div key={comment.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#7A1F1F] transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#7A1F1F]">On: {comment.postTitle}</span>
                  <button 
                    onClick={() => handleRemoveComment(comment.id)}
                    className="text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
                  >
                    Remove Comment
                  </button>
                </div>
                <p className="text-gray-700 font-medium py-1">"{comment.content}"</p>
                <p className="text-[10px] text-gray-400 mt-2 font-bold">{comment.date}</p>
              </div>
            ))
          ) : <EmptyState message="No comments yet." />
        )}
      </div>

      {/* Username Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Update Profile Handle</h2>
            <input 
              type="text" 
              value={tempUsername} 
              onChange={(e) => setTempUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#7A1F1F] outline-none font-bold text-gray-900"
              autoFocus
            />
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 font-bold text-gray-400 hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSaveUsername} className="flex-1 py-3 bg-[#7A1F1F] text-white font-bold rounded-xl shadow-lg shadow-[#7A1F1F]/20">Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">{message}</p>
  </div>
);

export default function Page() {
  const posts: Post[] = [{ id: "1", title: "CS 240 - Probability Summary", upvotes: 32, date: "April 1, 2026" }];
  const liked: Post[] = [{ id: "2", title: "CS 311 - Master Theorem Notes", upvotes: 89, date: "Mar 15, 2026", author: "jdoe23" }];
  const comments: Comment[] = [{ id: "c1", postTitle: "Math 235 Guide", content: "This saved me for the midterm, thanks!", date: "2 days ago" }];

  return (
    <ProfileView 
      userEmail="you@umass.edu" 
      initialPosts={posts} 
      initialLiked={liked} 
      initialComments={comments} 
    />
  );
}