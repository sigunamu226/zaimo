"use server";

import { Stock } from "@/common/interface/stock";
import { createClient } from "@/common/supabase/server";
import { revalidatePath } from "next/cache";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const validateStockInput = (input: {
  name: string;
  quantity: number;
  expiration_date: string;
}): string | null => {
  if (typeof input.name !== "string" || input.name.trim().length === 0) {
    return "商品名を入力してください";
  }
  if (input.name.trim().length > 100) {
    return "商品名は100文字以内で入力してください";
  }
  if (
    typeof input.quantity !== "number" ||
    !Number.isFinite(input.quantity) ||
    !Number.isInteger(input.quantity) ||
    input.quantity < 1 ||
    input.quantity > 999999
  ) {
    return "数量は1〜999,999の整数で入力してください";
  }
  if (
    typeof input.expiration_date !== "string" ||
    !ISO_DATE_REGEX.test(input.expiration_date)
  ) {
    return "消費期限の形式が正しくありません";
  }
  const date = new Date(input.expiration_date);
  if (isNaN(date.getTime())) {
    return "消費期限の日付が不正です";
  }
  return null;
};

const validateId = (id: string): string | null => {
  if (typeof id !== "string" || !UUID_REGEX.test(id)) {
    return "不正なIDです";
  }
  return null;
};

export const fetchStocks = async (): Promise<Stock[]> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }
  const { data, error } = await supabase
    .from("stocks")
    .select("*")
    .eq("user_id", user.id);
  if (error) {
    console.error("Error fetching stocks:", error);
    return [];
  }
  return data;
};

export const addStock = async (input: {
  name: string;
  quantity: number;
  expiration_date: string;
}): Promise<{ error?: string }> => {
  const validationError = validateStockInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "認証されていません" };
  }
  const { error } = await supabase.from("stocks").insert({
    name: input.name.trim(),
    quantity: input.quantity,
    expiration_date: input.expiration_date,
    user_id: user.id,
  });
  if (error) {
    console.error("Error adding stock:", error);
    return { error: "在庫の追加に失敗しました" };
  }
  revalidatePath("/stocks");
  return {};
};

export const updateStock = async (
  id: string,
  input: {
    name: string;
    quantity: number;
    expiration_date: string;
  }
): Promise<{ error?: string }> => {
  const idError = validateId(id);
  if (idError) {
    return { error: idError };
  }
  const validationError = validateStockInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "認証されていません" };
  }
  const { error } = await supabase
    .from("stocks")
    .update({
      name: input.name.trim(),
      quantity: input.quantity,
      expiration_date: input.expiration_date,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    console.error("Error updating stock:", error);
    return { error: "在庫の更新に失敗しました" };
  }
  revalidatePath("/stocks");
  return {};
};

export const deleteStock = async (id: string): Promise<{ error?: string }> => {
  const idError = validateId(id);
  if (idError) {
    return { error: idError };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "認証されていません" };
  }
  const { error } = await supabase
    .from("stocks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    console.error("Error deleting stock:", error);
    return { error: "在庫の削除に失敗しました" };
  }
  revalidatePath("/stocks");
  return {};
};
