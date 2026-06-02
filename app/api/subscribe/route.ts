import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const { userName, subscription } = await request.json();

  const { error } = await supabase.from("push_subscriptions").insert({
    user_name: userName,
    subscription,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}