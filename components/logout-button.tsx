import { redirect } from "next/navigation";
import { LoaderCircle, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SubmitButton from "@/components/submit-button";

type LogoutButtonProps = {
  className?: string;
  iconOnly?: boolean;
};

async function logout() {
  "use server";

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default function LogoutButton({
  className = "btn-secondary",
  iconOnly = false,
}: LogoutButtonProps) {
  return (
    <form action={logout}>
      <SubmitButton
        className={className}
        pendingContent={
          iconOnly ? (
            <span className="inline-flex items-center justify-center">
              <LoaderCircle size={16} className="animate-spin" />
              <span className="sr-only">Logout...</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle size={16} className="animate-spin" />
              Logout...
            </span>
          )
        }
      >
        <span className="inline-flex items-center gap-2">
          <LogOut size={16} />
          {iconOnly ? <span className="sr-only">Logout</span> : <span>Logout</span>}
        </span>
      </SubmitButton>
    </form>
  );
}
