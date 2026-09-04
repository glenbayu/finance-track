import { redirect } from "next/navigation";
import { LoaderCircle, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SubmitButton from "@/components/ui/submit-button";

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
    <form action={logout} style={{ display: "contents" }}>
      <SubmitButton
        className={className}
        pendingContent={
          iconOnly ? (
            <span className="inline-flex items-center justify-center">
              <LoaderCircle size={16} className="animate-spin" />
              <span className="sr-only">Keluar...</span>
            </span>
          ) : (
            <>
              <LoaderCircle size={16} className="animate-spin" />
              <span>Keluar...</span>
            </>
          )
        }
      >
        <LogOut size={16} />
        {iconOnly ? <span className="sr-only">Keluar</span> : <span>Keluar</span>}
      </SubmitButton>
    </form>
  );
}
