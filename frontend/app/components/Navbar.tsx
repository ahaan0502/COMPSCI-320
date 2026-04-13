'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { BookOpen, Bookmark, Plus, User } from "lucide-react";

type AuthUser = {
	name: string;
	email: string | null;
};

export default function Navbar() {
	const [user, setUser] = useState<AuthUser | null>(null);

	useEffect(() => {
		const supabase = createBrowserClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
		);

		const loadUser = async () => {
			const { data: { user: authUser } } = await supabase.auth.getUser();

			if (!authUser) {
				setUser(null);
				return;
			}

			const fallbackName =
				authUser.user_metadata?.full_name ||
				authUser.user_metadata?.name ||
				authUser.email?.split("@")[0] ||
				"User";

			const { data: profile } = await supabase
				.from("Users")
				.select("name, email")
				.eq("author_id", authUser.id)
				.maybeSingle();

			setUser({
				name: profile?.name || fallbackName,
				email: profile?.email || authUser.email || null,
			});
		};

		loadUser();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(() => {
			loadUser();
		});

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	return (
		<header className="sticky top-0 z-40 border-b border-zinc-200 bg-zinc-100/95 backdrop-blur">
			<nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
				<Link
					href="/"
					className="text-3xl font-semibold tracking-tight text-zinc-800 transition hover:text-zinc-950"
				>
					UNotes
				</Link>

				<div className="hidden items-center gap-7 md:flex">
					<Link
						href="/classes"
						className="inline-flex items-center gap-2 text-[18px] font-medium text-zinc-600 transition hover:text-zinc-900"
					>
						<BookOpen className="h-4.5 w-4.5" aria-hidden="true" />
						<span>My Classes</span>
					</Link>
					<Link
						href="/notes"
						className="inline-flex items-center gap-2 text-[18px] font-medium text-zinc-600 transition hover:text-zinc-900"
					>
						<Bookmark className="h-4.5 w-4.5" aria-hidden="true" />
						<span>Saved Notes</span>
					</Link>
				</div>

				<div className="flex items-center gap-3">
					{user ? (
						<>
							<Link
								href="/notes"
								className="inline-flex items-center gap-2 rounded-lg bg-red-800 px-4 py-2 text-base font-semibold text-white transition hover:bg-red-900"
							>
								<Plus className="h-4.5 w-4.5" aria-hidden="true" />
								<span className="hidden sm:inline">Post Notes</span>
							</Link>

							<Link
								href="/profile"
								aria-label="Profile"
								className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 text-zinc-600 transition hover:bg-white hover:text-zinc-900"
							>
								<User className="h-5 w-5" aria-hidden="true" />
							</Link>
						</>
					) : (
						<Link
							href="/auth/google"
							className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-base font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900"
						>
							<User className="h-4.5 w-4.5" aria-hidden="true" />
							<span>Sign in</span>
						</Link>
					)}
				</div>
			</nav>
		</header>
	);
}
