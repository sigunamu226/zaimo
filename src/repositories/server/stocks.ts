"use server";

import { Stock } from "@/common/interface/stock";
import { createClient } from "@/common/supabase/server";

export const fetchStocks = async (): Promise<Stock[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("stocks").select("*");
  if (error) {
    console.error("Error fetching stocks:", error);
    return [];
  }
  return data;
};
