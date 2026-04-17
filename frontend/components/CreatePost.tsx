import { ChangeEvent, useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr";
interface CreatePostProps {
    onSuccess?: () => void;
}
interface Course {
  course_id: number;
  course_number: string;
  title: string;
}
interface Semester {
  semester_id: number;
  term: string;
  year: number;
}
interface EnrolledCourseRow {
  course_id: number;
  Courses: Course | null;
}
interface EnrolledSemesterRow {
  semester_id: number;
  Semesters: Semester | null;
}

export function CreatePost({onSuccess}: CreatePostProps) {

    // useState is like another way of setting variables
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [authorId, setAuthorId] = useState('');
    const [courseId, setCourseId] = useState(''); 
    const [semesterId, setSemesterId] = useState(''); 
    const [courses, setCourses] = useState<Course[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(true);

    useEffect(() => {
        const fetchEnrolledData = async () => {
            const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const userId = session.user.id;

            // Fetch enrolled courses with their details 
            const { data: enrolledCourses, error: coursesError } = await supabase
            .from('Student_Enrolled_Courses')
            .select(`
                course_id,
                Courses (
                course_id,
                course_number,
                title
                )
            `)
            .eq('author_id', userId);


            if (coursesError) {
            console.error("Error fetching courses:", coursesError);
            } else {
            // Courses
            const courseList = (enrolledCourses as unknown as EnrolledCourseRow[])
                .map((row) => row.Courses ?? null)
                .filter((c): c is Course => c !== null);
            setCourses(courseList);
            }


            // Fetch enrolled semesters with their details via join
            const { data: enrolledSemesters, error: semestersError } = await supabase
            .from('Student_Enrolled_Courses')
            .select(`
                semester_id,
                Semesters (
                semester_id,
                term,
                year
                )
            `)
            .eq('author_id', userId);


            console.log(enrolledCourses);
            console.log(enrolledSemesters);
            if (semestersError) {
            console.error("Error fetching semesters:", semestersError);
            } else {
            // Deduplicate semesters since a user may have multiple courses in the same semester
            const seen = new Set<number>();
            const semesterList = (enrolledSemesters as unknown as EnrolledSemesterRow[])
            .map((row) => row.Semesters ?? null)
            .filter((s): s is Semester => {
                if (!s || seen.has(s.semester_id)) return false;
                seen.add(s.semester_id);
                return true;
            });
            setSemesters(semesterList);
            }

            setIsLoadingOptions(false);
        };

        fetchEnrolledData();
        }, []);

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
        setCourseId('');
        setSemesterId('');
        setIsPublic(true);
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    // handles canceling the form -- clears it
    const handleCancel = () => {
        resetForm();
    };

    // creates post
    const createPost = async () => {
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

            const { data: { session } } = await supabase.auth.getSession();

            if(!session?.user) {
                // failed
                return;
            }
            const userId = session.user.id;
            setAuthorId(userId);
            let attachmentUrl = null;
           
            if (selectedFile) {
                attachmentUrl = await uploadFileToStorage(selectedFile, authorId);
                if (!attachmentUrl) {
                setError("Failed to upload attachment");
                setIsUploading(false);
                return;
                }
            }

            // Prepare post data
            const postData = {
                // post_id will auto-generate
                created_at: new Date().toISOString(),
                author_id: userId,
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
            .from('Posts')
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
                    className="w-full px-3 py-2 border text-gray-700 border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                />
            </div>
            {/* Course Dropdown */}
            <div className="mb-4">
                <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 text-left">
                    Course
                </label>
                <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    disabled={isLoadingOptions}
                    className="w-full px-3 py-2 border text-gray-400 border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                >
                    <option value="">Select a course</option>
                    {courses.map((c) => (
                        <option key={c.course_id} value={String(c.course_id)}>
                            {c.course_number} - {c.title}
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
                    value={semesterId}
                    onChange={(e) => setSemesterId(e.target.value)}
                    disabled={isLoadingOptions}
                    className="w-full px-3 py-2 border text-gray-400 border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                >
                    <option value="">Select a semester</option>
                    {semesters.map((s) => (
                        <option key={s.semester_id} value={String(s.semester_id)}>
                            {s.term} {s.year}
                        </option>
                    ))}
                </select>
            </div>
            {/* Text area */}
            <div className="mb-3">
                <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 text-left">
                    Content
                </label>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your notes here..."
                    rows={2}
                    className="w-full px-3 py-2 border text-gray-700 border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white resize-y"
                />
            </div>
           
            <div className="mb-3">
                <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 text-left">
                    Add Attachment - File must be less than 10MB
                </label>
                <input
                    type="file"
                    onChange={handleFileUpload}
                    multiple
                    accept=".pdf, .jpg, .jpeg, .png, .txt, .doc, .docx  "
                    className="w-full px-3 py-2 border text-gray-400 border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                />  
                {selectedFile && (
                    <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                        Selected: {selectedFile.name}
                    </p>
                )}
            </div>

            {/* isPublic */}
            <div className="mb-4">
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
                    disabled={isUploading}
                >
                    Post
                </button>
            </div>
        </div>
    )
}