import { ChangeEvent, useState } from "react"
import { SupabaseClient } from "@supabase/supabase-js"
import { useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
interface CreatePostProps {
    onSuccess?: () => void;
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

export function CreatePost({onSuccess}: CreatePostProps) {

    // useState is like another way of setting variables
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [course, setCourse] = useState('');
    const [semester, setSemester] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [authorId, setAuthorId] = useState('ace04e8b-7369-4209-9776-7d2457036da4'); 
    const [courseId, setCourseId] = useState('1'); // Hardcoded course ID
    const [semesterId, setSemesterId] = useState('1');

    const uploadFileToStorage = async (file: File, userId: string): Promise<string | null> => {
        try {
            const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );


        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('post-attachments')
            .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('post-attachments')
            .getPublicUrl(filePath);

        return publicUrl;
        } catch (error) {
        console.error("Error uploading file:", error);
        return null;
        }
    };
  
    // Handle file selection and upload to supabase
    const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            setError("File size must be less than 10MB");
        return;
        }

    setSelectedFile(file);
    setError(null);
    }

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

    const createPost = async () => {
        //TODO
        if (!title.trim()) {
        setError("Title is required");
        return;
        }

        if (!content.trim()) {
        setError("Content is required");
        return;
        }

        setIsUploading(true);
        setError(null);
        console.log("before try")
        try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

        let attachmentUrl = null;
        console.log("test");
        console.log(await supabase.auth.getSession());
        
        

      
      if (selectedFile) {
        attachmentUrl = await uploadFileToStorage(selectedFile, authorId);
        if (!attachmentUrl) {
          setError("Failed to upload attachment");
          setIsUploading(false);
          return;
        }
      }

      // Prepare post data matching your exact schema
      const postData = {
        // post_id will auto-generate - don't include it
        created_at: new Date().toISOString(),
        author_id: authorId, // Using hardcoded value
        title: title.trim(),
        body: content.trim(),
        purpose: null, // Not using this field
        visibility: isPublic ? 'public' : 'private', // text field: 'public' or 'private'
        group_id: null, // Not using this field
        tags: ["cics", "notes"], // JSON array
        votes: 0, // int2, starting at 0
        updated_at: new Date().toISOString(),
        course_id: parseInt(courseId), // Convert to int8
        semester_id: parseInt(semesterId), // Convert to int8
        is_report: false, // bool, default false
        attachment_url: attachmentUrl // varchar, can be null
      };

      console.log("Inserting post:", postData);

      const { data, error: insertError } = await supabase
        .from('posts') // Make sure table name is lowercase
        .insert([postData])
        .select();

      if (insertError) {
        console.error("Insert error:", insertError);
        setError(`Failed to create post: ${insertError.message}`);
        return;
      }

      console.log("Post created successfully:", data);
      
      alert("Post created successfully!");
      resetForm();
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err) {
      console.error("Error creating post:", err);
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setIsUploading(false);
    }

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