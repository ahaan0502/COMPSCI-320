'use client';

import Link from 'next/link';
import { BookOpen, Bookmark, Plus, User } from 'lucide-react';

export default function Navbar() {
  return (
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
        <button className="flex items-center gap-2 bg-red-900 text-white px-4 py-2 rounded-lg hover:bg-red-950 transition-colors">
          <Plus size={20} />
          <span>Post Notes</span>
        </button>
        <button className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full text-gray-700 hover:bg-gray-300 transition-colors">
          <User size={20} />
        </button>
      </div>
    </nav>
  );
}
