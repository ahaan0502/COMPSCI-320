"use client";
import { useState } from "react";

export default function ReportPost() {
  const [isOpen, setIsOpen] = useState(true);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex h-screen w-full items-center justify-center bg-gray-100 backdrop-blur-sm font-sans">
      <div className="relative max-w-xl w-[60vw] h-auto rounded-2xl border-4 border-black bg-white p-6 shadow-2xl">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          x
        </button>
        <h2 className="text-3xl font-bold text-black mb-9">Report Post</h2>
        <h1 className="text-2xl font-medium text-black">Post Title</h1>
        <input
          type="text"
          name="postTitle"
          placeholder="Post title autofilled"
          className="mt-1 block w-full rounded px-2 py-2 border-3 border-[rgb(125,38,34)] text-black focus:outline-none focus:border-[rgb(125,38,34)] focus:ring-[rgb(125,38,34)] bg-[rgb(217,217,217)]"
        />
        <div className="flex gap-4 mt-4 mb-15">
          <div className="w-1/2">
            <label className="block text-2xl font-medium text-black">
              Course
            </label>
            <input
              type="text"
              name="courseName"
              placeholder="Course name autofilled"
              className="mt-1 block w-full rounded px-2 py-2 border-3 border-[rgb(125,38,34)] text-black focus:outline-none focus:border-[rgb(125,38,34)] focus:ring-[rgb(125,38,34)] bg-[rgb(217,217,217)]"
            />
          </div>
          <div className="w-1/2">
            <label className="block text-2xl font-medium text-black">
              Semester
            </label>
            <input
              type="text"
              name="semesterName"
              placeholder="Semester name autofilled"
              className="mt-1 block w-full rounded px-2 py-2 border-3 border-[rgb(125,38,34)] text-black focus:outline-none focus:border-[rgb(125,38,34)] focus:ring-[rgb(125,38,34)] bg-[rgb(217,217,217)]"
            />
          </div>
        </div>
        <h1 className="text-2xl font-medium text-black">
          What&apos;s wrong with this post?
        </h1>

        <div className="mt-4">
          <fieldset className="space-y-3">
            <legend className="sr-only">Report reason</legend>

            <div className="flex items-center">
              <input
                id="reason-rude"
                name="reportReason"
                type="radio"
                value="spam"
                className="h-4 w-4 text-[rgb(125,38,34)] focus:ring-[rgb(125,38,34)]"
              />
              <label htmlFor="reason-spam" className="ml-2 text-black">
                It&apos;s rude, vulgar, or uses bad language.
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="reason-inaccurate"
                name="reportReason"
                type="radio"
                value="harassment"
                className="h-4 w-4 text-[rgb(125,38,34)] focus:ring-[rgb(125,38,34)]"
              />
              <label htmlFor="reason-harassment" className="ml-2 text-black">
                The content in this post is inaccurate with course content.
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="reason-academic-policy"
                name="reportReason"
                type="radio"
                value="inaccurate"
                className="h-4 w-4 text-[rgb(125,38,34)] focus:ring-[rgb(125,38,34)]"
              />
              <label htmlFor="reason-inaccurate" className="ml-2 text-black">
                This post breaks academic policy.
              </label>
            </div>

            {/*<div className="flex items-center">
              <input
                id="reason-other"
                name="reportReason"
                type="radio"
                value="other"
                className="h-4 w-4 text-[rgb(125,38,34)] focus:ring-[rgb(125,38,34)]"
              />
              <label htmlFor="reason-other" className="ml-2 text-black">
                Other
              </label>
            </div>*/}
          </fieldset>

          {/*<label
            htmlFor="report-details"
            className="block mt-3 text-sm text-gray-600"
          >
            More details (optional)
          </label>
          <textarea
            id="report-details"
            name="reportDetails"
            rows={4}
            className="mt-1 w-full rounded border border-gray-300 px-2 py-2 text-black"
            placeholder="Add any additional information that will help reviewers..."
          />*/}
        </div>

        <div className="mt-6 flex gap-4 justify-end">
          <button className="bg-[rgb(180,180,180)] font-semibold text-xl text-black px-6 py-2 rounded-lg">
            Cancel
          </button>
          <button className="bg-[rgb(125,38,34)] font-semibold text-xl text-white px-8 py-2 rounded-lg">
            Report Post
          </button>
        </div>
      </div>
    </div>
  );
}
