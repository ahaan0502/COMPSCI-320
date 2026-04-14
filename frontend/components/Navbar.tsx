'use client';

import Link from 'next/link';
import { BookOpen, Bookmark, Plus, User, X} from 'lucide-react';
import { CreatePost } from './CreatePost';
import { useState } from 'react';

export default function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
    <nav className="flex items-center justify-between bg-white px-6 py-4 shadow-md">
      {/* UNotes on the Left */}
      <div className="text-2xl font-bold text-gray-800">
        UNotes
      </div>

      {/* My Classes and Saved Notes buttons in the middle */}
      <div className="flex items-center gap-6">
        <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
          <BookOpen size={20} />
          <span>My Classes</span>
        </button>
        <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
          <Bookmark size={20} />
          <span>Saved Notes</span>
        </button>
      </div>

      {/* Post Notes and Profile buttons on the right */}
      <div className="flex items-center gap-4">
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-red-900 text-white px-4 py-2 rounded-lg hover:bg-red-950 transition-colors">
          <Plus size={20} />
          <span>Post Notes</span>
        </button>
        <button className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full text-gray-700 hover:bg-gray-300 transition-colors">
          <User size={20} />
        </button>
      </div>
    </nav>
    {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close modal when clicking the backdrop
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Create New Post</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            <CreatePost onSuccess={() => setIsModalOpen(false)} />
          </div>
        </div>
      )}
      </>
  );
}
