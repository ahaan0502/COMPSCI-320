"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { formatReportReason, submitPostReport, type ReportReason } from "../lib/moderation";

const REPORT_REASONS: ReportReason[] = [
  "spam",
  "harassment",
  "inaccurate",
  "academic_policy",
  "other",
];

export default function ReportPost() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [details, setDetails] = useState("");
  const [customOtherReason, setCustomOtherReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const postId = searchParams.get("postId") ?? "";
  const postTitle = searchParams.get("postTitle") ?? "";
  const courseName = searchParams.get("courseName") ?? "";
  const semesterName = searchParams.get("semesterName") ?? "";
  const authorName = searchParams.get("authorName") ?? "";
  const authorEmail = searchParams.get("authorEmail") ?? "";

  const defaultReason = useMemo(() => {
    const reason = searchParams.get("reportReason");
    return REPORT_REASONS.includes(reason as ReportReason) ? (reason as ReportReason) : "inaccurate";
  }, [searchParams]);

  const [selectedReason, setSelectedReason] = useState<ReportReason>(defaultReason);

  const closeModal = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/notes");
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericPostId = Number(postId);
    if (Number.isNaN(numericPostId)) {
      setError("Missing post id for this report.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error("Please sign in before reporting a post.");
      }

      await submitPostReport({
        postId: numericPostId,
        reporterId: session.user.id,
        reason: selectedReason,
        details: selectedReason === "other" && customOtherReason ? `${customOtherReason}\n${details}`.trim() : details,
      });

      router.push("/notes?reported=1");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit report.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto bg-zinc-100/90 px-4 py-8 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-3 top-3 text-zinc-400 transition hover:text-zinc-700"
          aria-label="Close report form"
        >
          x
        </button>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900">Report Post</h2>
            <p className="mt-2 text-sm text-zinc-500">This sends the post into the admin moderation queue.</p>
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <input type="hidden" name="postId" value={postId} />

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold uppercase tracking-wide text-zinc-500">Post</label>
              <input
                type="text"
                value={postTitle}
                readOnly
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-zinc-800"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold uppercase tracking-wide text-zinc-500">Author</label>
              <input
                type="text"
                value={authorEmail || authorName}
                readOnly
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-zinc-800"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold uppercase tracking-wide text-zinc-500">Course</label>
                <input
                  type="text"
                  value={courseName}
                  readOnly
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-zinc-800"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold uppercase tracking-wide text-zinc-500">Semester</label>
                <input
                  type="text"
                  value={semesterName}
                  readOnly
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-zinc-800"
                />
              </div>
            </div>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-lg font-semibold text-zinc-900">What&apos;s wrong with this post?</legend>

            {REPORT_REASONS.map((reason) => (
              <label key={reason} className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2">
                <input
                  type="radio"
                  name="reportReason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                  className="h-4 w-4 text-red-800 focus:ring-red-700"
                />
                <span className="text-zinc-800">{formatReportReason(reason)}</span>
              </label>
            ))}
          </fieldset>

          {selectedReason === "other" && (
            <div>
              <label htmlFor="other-reason" className="block text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Please describe the issue
              </label>
              <input
                id="other-reason"
                type="text"
                value={customOtherReason}
                onChange={(event) => setCustomOtherReason(event.target.value)}
                placeholder="What's wrong with this post?"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800 outline-none focus:border-red-700"
              />
            </div>
          )}

          <div>
            <label htmlFor="report-details" className="block text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Extra details
            </label>
            <textarea
              id="report-details"
              name="reportDetails"
              rows={4}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800 outline-none focus:border-red-700"
              placeholder="Add any details that help the admin review this report."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-zinc-300 px-5 py-2 font-semibold text-zinc-700 transition hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-red-800 px-6 py-2 font-semibold text-white transition hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Report Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
