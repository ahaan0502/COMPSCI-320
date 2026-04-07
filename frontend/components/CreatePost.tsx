import { useState } from "react"
import { SupabaseClient } from "@supabase/supabase-js"
interface Props {
    title: string,
    content: string,
    course: string,
    semester: string,
    isPublic: boolean
    file?: File
}

// Will have to change based on how we want to filter courses
const courses = [
    "CS220 - Programming Methodology",
    "CS230 - Computer Systems Principles",
    "CS240 - Reasoning Under Uncertainty",
    "CS250 - Discrete Math",
    "CS311 - Algorithms"
]

const semesters = [
    "Fall 2026",
    "Spring 2025",
]

export function CreatePost() {

    // useState is like another way of setting variables
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [course, setCourse] = useState('');
    const [semester, setSemester] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Handle file selection and upload to supabase
    const handleFileUpload = async () => {
        //TODO
    };

    const resetForm = () => {
        setTitle('');
        setContent('');
        setCourse('');
        setSemester('');
        setIsPublic(true);
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleCancel = () => {
        resetForm();
    };

    const createPost = () => {
        //TODO
    }
    
    return (
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-white dark:bg-gray-800 mb-5">
            {/* Title Input */}
            <div className="mb-4 ">
                <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 text-left">
                    Title
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter title"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                />
            </div>

            {/* Course Dropdown */}
            <div className="mb-4">
                <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 text-left">
                    Course
                </label>
                <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                >
                    {/* Will have to adjust for our database*/}
                    <option>Select a course</option>
                    {courses.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
            </div>

            {/* Semester Dropdown */}
            <div className="mb-4">
                <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 text-left">
                    Semester
                </label>
                <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                >
                    <option value="">Select a semester</option>
                        {semesters.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                </select>
            </div>

            {/* Text area */}
            <div className="mb-4">
                <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 text-left">
                    Content
                </label>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your notes here..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white resize-y"
                />
            </div>
            
            <div className="mb-4 ">
                <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 text-left">
                    Add Attachment
                </label>
                <input
                    type="file"
                    onChange={handleFileUpload /* this isn't implemented yet */}
                    multiple
                    accept=".pdf, .jpg, .jpeg, .png, .txt, .doc, .docx  "
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                />  
                {selectedFile && (
                    <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                        Selected: {selectedFile.name}
                    </p>
                )}
            </div>


            {/* isPublic */}
            <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        Public Post
                    </span>
                </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
                <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={handleCancel}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                    onClick={createPost}
                    
                >
                    Post
                </button>
            </div>
        </div>
    )
}