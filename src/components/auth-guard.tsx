import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function AuthGuard({ children }: { children: React.ReactNode }) {
 const { user, isPending } = useCurrentUserState();
 if (isPending) {
 return (
 <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-3 bg-bg px-4 py-8">
 <div className="h-10 w-40 animate-pulse bg-elevated" />
 <div className="h-36 animate-pulse bg-surface" />
 <div className="h-24 animate-pulse bg-surface" />
 </div>
 );
 }
 if (!user) return <RedirectToSignIn to="/login" />;
 return children;
}
