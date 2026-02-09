"use server";

import { Stock } from "@/common/interface/stock";
import { createClient } from "@/common/supabase/server";
import { revalidatePath } from "next/cache";

export const fetchStocks = async (): Promise<Stock[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("stocks").select("*");
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
  const supabase = await createClient();
  const { error } = await supabase.from("stocks").insert({
    name: input.name,
    quantity: input.quantity,
    expiration_date: input.expiration_date,
  });
  if (error) {
    console.error("Error adding stock:", error);
    return { error: error.message };
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
  const supabase = await createClient();
  const { error } = await supabase
    .from("stocks")
    .update({
      name: input.name,
      quantity: input.quantity,
      expiration_date: input.expiration_date,
    })
    .eq("id", id);
  if (error) {
    console.error("Error updating stock:", error);
    return { error: error.message };
  }
  revalidatePath("/stocks");
  return {};
};

export const deleteStock = async (id: string): Promise<{ error?: string }> => {
  const supabase = await createClient();
  const { error } = await supabase.from("stocks").delete().eq("id", id);
  if (error) {
    console.error("Error deleting stock:", error);
    return { error: error.message };
  }
  revalidatePath("/stocks");
  return {};
};
