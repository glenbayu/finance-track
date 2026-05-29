"use server";

import { revalidatePath } from "next/cache";
import {
  QUICK_ADD_TEMPLATE_NAME_MAX,
  QUICK_ADD_TEMPLATE_NOTE_MAX,
  normalizeTemplateAmount,
  normalizeTemplateCategoryId,
  normalizeTemplateColor,
  normalizeTemplateIcon,
  normalizeTemplateName,
  normalizeTemplateNote,
  normalizeTemplateType,
  type QuickAddTemplateType,
} from "@/lib/quick-add";
import { requireUser } from "@/lib/supabase/auth";

type TemplatePayload = {
  templateId: string | null;
  name: string;
  type: QuickAddTemplateType;
  categoryId: string | null;
  amount: number | null;
  note: string | null;
  icon: string;
  color: string;
  isActive: boolean;
};

function revalidateTemplatePaths() {
  revalidatePath("/settings/templates");
  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/transactions/new");
}

function parseTemplatePayload(formData: FormData): TemplatePayload {
  const templateId = String(formData.get("template_id") ?? "").trim() || null;
  const name = normalizeTemplateName(formData.get("name"));
  const type = normalizeTemplateType(formData.get("type"));
  const categoryId = normalizeTemplateCategoryId(formData.get("category_id"));
  const amount = normalizeTemplateAmount(formData.get("amount"));
  const note = normalizeTemplateNote(formData.get("note"));
  const icon = normalizeTemplateIcon(formData.get("icon"));
  const color = normalizeTemplateColor(formData.get("color"));
  const isActive = String(formData.get("is_active") ?? "").toLowerCase() === "on";

  if (!name) {
    throw new Error("Nama template wajib diisi.");
  }
  if (name.length > QUICK_ADD_TEMPLATE_NAME_MAX) {
    throw new Error("Nama template maksimal 40 karakter.");
  }
  if (note && note.length > QUICK_ADD_TEMPLATE_NOTE_MAX) {
    throw new Error("Catatan template maksimal 120 karakter.");
  }
  if (amount !== null && (!Number.isFinite(amount) || amount <= 0)) {
    throw new Error("Nominal template harus lebih dari 0.");
  }

  return {
    templateId,
    name,
    type,
    categoryId,
    amount,
    note,
    icon,
    color,
    isActive,
  };
}

async function validateCategoryOwnership(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
  categoryId: string | null,
  type: QuickAddTemplateType,
) {
  if (!categoryId) return null;

  const { data: category, error } = await supabase
    .from("categories")
    .select("id, type")
    .eq("id", categoryId)
    .or(`user_id.eq.${userId},user_id.is.null`)
    .is("archived_at", null)
    .single();

  if (error || !category) {
    throw new Error("Kategori template tidak valid.");
  }
  if (category.type !== type) {
    throw new Error("Tipe kategori tidak sesuai dengan tipe template.");
  }

  return category.id;
}

export async function createQuickAddTemplate(formData: FormData) {
  const { supabase, user } = await requireUser();
  const payload = parseTemplatePayload(formData);

  await validateCategoryOwnership(supabase, user.id, payload.categoryId, payload.type);

  const { data: latest, error: latestError } = await supabase
    .from("quick_add_templates")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (latestError) {
    throw new Error(latestError.message);
  }

  const nextSortOrder = (latest?.[0]?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("quick_add_templates").insert({
    user_id: user.id,
    name: payload.name,
    type: payload.type,
    category_id: payload.categoryId,
    amount: payload.amount,
    note: payload.note,
    icon: payload.icon,
    color: payload.color,
    is_active: payload.isActive,
    sort_order: nextSortOrder,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateTemplatePaths();
}

export async function updateQuickAddTemplate(formData: FormData) {
  const { supabase, user } = await requireUser();
  const payload = parseTemplatePayload(formData);

  if (!payload.templateId) {
    throw new Error("Template tidak valid.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("quick_add_templates")
    .select("id")
    .eq("id", payload.templateId)
    .eq("user_id", user.id)
    .single();

  if (existingError || !existing) {
    throw new Error("Template tidak ditemukan.");
  }

  await validateCategoryOwnership(supabase, user.id, payload.categoryId, payload.type);

  const { error } = await supabase
    .from("quick_add_templates")
    .update({
      name: payload.name,
      type: payload.type,
      category_id: payload.categoryId,
      amount: payload.amount,
      note: payload.note,
      icon: payload.icon,
      color: payload.color,
      is_active: payload.isActive,
    })
    .eq("id", payload.templateId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateTemplatePaths();
}

export async function deleteQuickAddTemplate(formData: FormData) {
  const { supabase, user } = await requireUser();
  const templateId = String(formData.get("template_id") ?? "").trim();

  if (!templateId) {
    throw new Error("Template tidak valid.");
  }

  const { data: existing, error: readError } = await supabase
    .from("quick_add_templates")
    .select("id")
    .eq("id", templateId)
    .eq("user_id", user.id)
    .single();

  if (readError || !existing) {
    throw new Error("Template tidak ditemukan.");
  }

  const { error } = await supabase
    .from("quick_add_templates")
    .delete()
    .eq("id", templateId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateTemplatePaths();
}

export async function toggleQuickAddTemplate(formData: FormData) {
  const { supabase, user } = await requireUser();
  const templateId = String(formData.get("template_id") ?? "").trim();
  const nextActive = String(formData.get("next_active") ?? "").toLowerCase() === "true";

  if (!templateId) {
    throw new Error("Template tidak valid.");
  }

  const { data: existing, error: readError } = await supabase
    .from("quick_add_templates")
    .select("id")
    .eq("id", templateId)
    .eq("user_id", user.id)
    .single();

  if (readError || !existing) {
    throw new Error("Template tidak ditemukan.");
  }

  const { error } = await supabase
    .from("quick_add_templates")
    .update({ is_active: nextActive })
    .eq("id", templateId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateTemplatePaths();
}

export async function reorderQuickAddTemplate(formData: FormData) {
  const { supabase, user } = await requireUser();
  const templateId = String(formData.get("template_id") ?? "").trim();
  const direction = String(formData.get("direction") ?? "").trim();

  if (!templateId || (direction !== "up" && direction !== "down")) {
    throw new Error("Aksi urutan template tidak valid.");
  }

  const { data: templates, error: readError } = await supabase
    .from("quick_add_templates")
    .select("id, sort_order, created_at")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (readError) {
    throw new Error(readError.message);
  }

  const list = templates ?? [];
  const currentIndex = list.findIndex((item) => item.id === templateId);
  if (currentIndex < 0) {
    throw new Error("Template tidak ditemukan.");
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= list.length) {
    return;
  }

  const current = list[currentIndex];
  const target = list[targetIndex];

  const { error: firstError } = await supabase
    .from("quick_add_templates")
    .update({ sort_order: -999999 })
    .eq("id", target.id)
    .eq("user_id", user.id);
  if (firstError) {
    throw new Error(firstError.message);
  }

  const { error: secondError } = await supabase
    .from("quick_add_templates")
    .update({ sort_order: target.sort_order })
    .eq("id", current.id)
    .eq("user_id", user.id);
  if (secondError) {
    throw new Error(secondError.message);
  }

  const { error: thirdError } = await supabase
    .from("quick_add_templates")
    .update({ sort_order: current.sort_order })
    .eq("id", target.id)
    .eq("user_id", user.id);
  if (thirdError) {
    throw new Error(thirdError.message);
  }

  revalidateTemplatePaths();
}
