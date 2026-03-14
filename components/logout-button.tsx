import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

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
      <button
        type="submit"
        className={className}
        aria-label={iconOnly ? "Logout" : undefined}
        title={iconOnly ? "Logout" : undefined}
      >
        <LogOut size={16} />
        {iconOnly ? <span className="sr-only">Logout</span> : <span></span>}
      </button>
    </form>
  );
}
