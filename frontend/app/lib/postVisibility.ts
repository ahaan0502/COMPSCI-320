import type { NotePost, PostVisibility } from "@/app/components/NoteCard";

export function isPrivateVisibility(visibility: PostVisibility | string | null) {
  return visibility === "private";
}

export function canViewPost(
  post: Pick<NotePost, "author_id" | "visibility" | "share_token">,
  currentUserId: string | null | undefined,
  sharedToken?: string | null,
) {
  return (
    !isPrivateVisibility(post.visibility) ||
    post.author_id === currentUserId ||
    (!!post.share_token && post.share_token === sharedToken)
  );
}
