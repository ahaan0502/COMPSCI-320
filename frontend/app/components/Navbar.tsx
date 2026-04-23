'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { BookOpen, Bookmark, Plus, Shield, User } from "lucide-react";

type AuthUser = {
	name: string;
	email: string | null;
};

export default function Navbar() {
	const [user, setUser] = useState<AuthUser | null>(null);
	const pathname = usePathname();
	const homeHref = user ? "/classes" : "/";
	const displayName = user?.name?.trim() || "Profile";
	const navLinkClass = (isActive: boolean) =>
		`relative inline-flex items-center gap-2 py-5 text-[18px] font-medium transition after:absolute after:bottom-3 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-red-800 after:transition ${
			isActive
				? "text-zinc-950 after:opacity-100"
				: "text-zinc-600 after:opacity-0 hover:text-zinc-900 hover:after:opacity-100"
		}`;
	const isClassesActive = pathname === "/classes";
	const isSavedNotesActive = pathname === "/savednotes";
	const isAdminActive = pathname === "/admin" || pathname.startsWith("/admin/");


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
		<>
			<header className="sticky top-0 z-40 border-b border-zinc-200 bg-zinc-100/95 backdrop-blur">
				<nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
					<Link
						href={homeHref}
						className="text-3xl font-semibold tracking-tight text-zinc-800 transition hover:text-zinc-950"
					>
						UNotes
					</Link>

					<div className="hidden items-center gap-7 md:flex">
						<Link
							href="/classes"
							className={navLinkClass(isClassesActive)}
							aria-current={isClassesActive ? "page" : undefined}
						>
							<BookOpen className="h-4.5 w-4.5" aria-hidden="true" />
							<span>My Classes</span>
						</Link>
						<Link
							href="/notes"
							className={navLinkClass(isSavedNotesActive)}
							aria-current={isSavedNotesActive ? "page" : undefined}
						>
							<Bookmark className="h-4.5 w-4.5" aria-hidden="true" />
							<span>Saved Notes</span>
						</Link>
						{user && (
							<Link
								href="/admin"
								className={navLinkClass(isAdminActive)}
								aria-current={isAdminActive ? "page" : undefined}
							>
								<Shield className="h-4.5 w-4.5" aria-hidden="true" />
								<span>Admin</span>
							</Link>
						)}
					</div>

					<div className="flex items-center gap-3">
						{user ? (
							<>
								<Link
									href="/admin"
									className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition md:hidden ${
										isAdminActive
											? "border-red-200 bg-white text-red-800 shadow-sm"
											: "border-zinc-300 text-zinc-700 hover:bg-white hover:text-zinc-900"
									}`}
									aria-current={isAdminActive ? "page" : undefined}
								>
									<Shield className="h-4 w-4" aria-hidden="true" />
									<span>Admin</span>
								</Link>

								<Link
									href="/notes"
									className="inline-flex items-center gap-2 rounded-lg bg-red-800 px-4 py-2 text-base font-semibold text-white transition hover:bg-red-900"
								>
									<Plus className="h-4.5 w-4.5" aria-hidden="true" />
									<span className="hidden sm:inline">Post Notes</span>
								</Link>

								<Link
									href="/profile"
									aria-label={`Profile for ${displayName}`}
									className="inline-flex h-10 items-center gap-2 rounded-full border border-zinc-300 px-3 text-zinc-600 transition hover:bg-white hover:text-zinc-900"
								>
									<User className="h-5 w-5" aria-hidden="true" />
									<span className="hidden max-w-28 truncate text-sm font-medium sm:inline">
										{displayName}
									</span>
								</Link>
							</>
						) : (
							<Link
								href="/auth/google"
								className="inline-flex items-center rounded-lg bg-red-800 px-4 py-2 text-base font-semibold text-white transition hover:bg-red-900"
							>
								Sign In
							</Link>
						)}
					</div>
				</nav>
			</header>
		</>
	);
}
