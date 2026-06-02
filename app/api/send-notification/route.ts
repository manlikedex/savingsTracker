import { NextResponse } from "next/server";
import webpush from "web-push";
import { supabase } from "@/lib/supabase";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
  const { title, body } = await request.json();

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("subscription");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await Promise.allSettled(
    data.map((row) =>
      webpush.sendNotification(
        row.subscription,
        JSON.stringify({
          title: title || "Home Saving Tracker",
          body: body || "Time to update your savings tracker.",
        })
      )
    )
  );

  return NextResponse.json({ success: true });
}