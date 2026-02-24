"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidNiche } from "@/lib/constants";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    redirect("/error?message=" + encodeURIComponent(error.message));
  }

  if (data.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("niche")
      .eq("id", data.user.id)
      .single();

    const niche = profile?.niche?.toLowerCase();
    if (niche && isValidNiche(niche)) {
      revalidatePath("/", "layout");
      redirect(`/dashboard/${niche}`);
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
