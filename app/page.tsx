"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Home,
  PiggyBank,
  Sofa,
  WashingMachine,
  Link as LinkIcon,
  TrendingUp,
  Heart,
  WalletCards,
  Plus,
  Bell,
  Building2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type SavingsGoal = {
  id?: string;
  name: string;
  target: number;
  saved: number;
};

type Partner = {
  id?: string;
  name: string;
  saved: number;
  monthly_target?: number;
};

type Property = {
  id?: string;
  title: string;
  rent: number;
  deposit: number;
  location: string;
  status: string;
  link: string | null;
  image_url?: string | null;
};

type PlannerItem = {
  id: string;
  item: string;
  category: string;
  estimate: number;
  priority: string;
};

const starterSavingsGoals: SavingsGoal[] = [
  { name: "Rental Deposit", target: 0, saved: 0 },
  { name: "First Month Rent", target: 0, saved: 0 },
  { name: "Furniture", target: 0, saved: 0 },
  { name: "Appliances", target: 0, saved: 0 },
  { name: "Moving Costs", target: 0, saved: 0 },
  { name: "Emergency Buffer", target: 0, saved: 0 },
];

const starterPartners: Partner[] = [
  { name: "Jordan", saved: 0, monthly_target: 0 },
  { name: "Dannie", saved: 0, monthly_target: 0 },
];

const starterProperties: Property[] = [];
const starterPlannerItems: PlannerItem[] = [];

const motivationalMessages = [
  "Every pound saved is one step closer to your own front door.",
  "You are not just saving money — you are building a future together.",
  "Small consistent wins become life-changing progress.",
  "The dream home starts with little deposits like this.",
  "Keep going. Future Jordan and Dannie will thank you.",
  "Another update, another step closer to moving in.",
  "Your first home together is getting closer.",
  "Consistency beats big bursts. You are doing this properly.",
  "One day this tracker will be a memory of how it all started.",
  "Saving together now means relaxing together later.",
  "The little sacrifices now are building something beautiful.",
  "Every update proves you are serious about the future.",
  "You are building more than savings — you are building stability.",
  "Keep showing up. The results will follow.",
  "Imagine unlocking the door to your first place together.",
  "This is what teamwork looks like.",
  "Future cosy nights start with today’s savings.",
  "Every goal filled is another piece of the home coming together.",
  "Stay patient. The plan is working.",
  "Love, planning, and consistency — that is the formula.",
  "This is your shared journey, and every step counts.",
  "You are closer than you were yesterday.",
  "Keep pushing. The move-in day will be worth it.",
  "Tiny progress is still progress.",
  "Your home fund is growing because you are staying committed.",
  "One contribution at a time, one room at a time, one dream at a time.",
  "The sofa, the keys, the first food shop — it all starts here.",
  "You two are turning a plan into real life.",
  "Every saving update is a promise to your future selves.",
  "Cornwall home loading… keep going.",
];

const cardClass =
  "relative overflow-hidden rounded-[2.25rem] border border-fuchsia-200/30 bg-gradient-to-br from-white/[0.18] via-fuchsia-200/[0.10] to-rose-300/[0.08] shadow-2xl shadow-black/35 backdrop-blur-2xl ring-1 ring-white/10 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-fuchsia-200/25 before:content-[''] before:animate-pulse";

const innerCardClass =
  "relative overflow-hidden rounded-[2rem] border border-fuchsia-200/25 bg-gradient-to-br from-white/[0.14] via-pink-200/[0.08] to-purple-300/[0.06] shadow-xl shadow-black/25 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-100/50 hover:bg-white/[0.18] hover:shadow-2xl hover:shadow-fuchsia-950/30 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-fuchsia-200/20 before:content-[''] before:animate-pulse";

const inputClass =
  "rounded-2xl border border-fuchsia-200/20 bg-black/25 px-4 py-3 text-sm text-white outline-none ring-fuchsia-300/30 placeholder:text-fuchsia-100/50 transition-all duration-300 focus:border-fuchsia-100/50 focus:bg-black/35 focus:ring-4";

const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-200 via-pink-300 to-rose-300 px-5 py-3 text-sm font-black text-rose-950 shadow-[0_0_30px_rgba(244,114,182,0.45)] transition-all duration-300 hover:scale-[1.04] hover:from-fuchsia-100 hover:via-pink-200 hover:to-rose-200 hover:shadow-[0_0_55px_rgba(244,114,182,0.75)] active:scale-[0.98]";

const softButtonClass =
  "rounded-2xl border border-fuchsia-200/25 bg-white/[0.11] px-5 py-3 text-sm font-bold text-pink-50 shadow-lg shadow-black/20 transition-all duration-300 hover:scale-[1.03] hover:border-fuchsia-100/50 hover:bg-white/[0.18] hover:shadow-[0_0_30px_rgba(217,70,239,0.25)]";

function formatGBP(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-3 rounded-full bg-gradient-to-r from-fuchsia-200 via-pink-300 to-rose-300 shadow-[0_0_22px_rgba(251,113,133,0.55)] transition-all duration-500"
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function statusClass(status: string) {
  switch (status) {
    case "Interested":
      return "border-pink-300/30 bg-fuchsia-300/15 text-fuchsia-100";
    case "Viewing Booked":
      return "border-purple-300/30 bg-purple-300/15 text-purple-100";
    case "Applied":
      return "border-emerald-300/30 bg-emerald-300/15 text-emerald-100";
    case "Rejected":
      return "border-red-300/30 bg-red-300/15 text-red-100";
    case "No Longer Interested":
      return "border-slate-300/20 bg-slate-300/10 text-slate-200";
    default:
      return "border-rose-300/30 bg-rose-300/15 text-rose-100";
  }
}

export default function HomePage() {
  const [activeUser, setActiveUser] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [savingsGoals, setSavingsGoals] =
    useState<SavingsGoal[]>(starterSavingsGoals);
  const [partners, setPartners] = useState<Partner[]>(starterPartners);
  const [properties, setProperties] = useState<Property[]>(starterProperties);
  const [jointMonthlyTarget, setJointMonthlyTarget] = useState(0);
  const [jointMonthlyTargetInput, setJointMonthlyTargetInput] = useState("");
  const [plannerItems, setPlannerItems] = useState<PlannerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [pushEnabled, setPushEnabled] = useState(false);

  const [contributionName, setContributionName] = useState("Jordan");
  const [contributionGoal, setContributionGoal] = useState("Rental Deposit");
  const [contributionAmount, setContributionAmount] = useState("");

  const [propertyTitle, setPropertyTitle] = useState("");
  const [propertyLocation, setPropertyLocation] = useState("");
  const [propertyRent, setPropertyRent] = useState("");
  const [propertyDeposit, setPropertyDeposit] = useState("");
  const [propertyLink, setPropertyLink] = useState("");
  const [propertyImageUrl, setPropertyImageUrl] = useState("");
  const [editingTargets, setEditingTargets] = useState<Record<string, string>>(
    {}
  );
  const [plannerItemName, setPlannerItemName] = useState("");
  const [plannerItemCategory, setPlannerItemCategory] = useState("Furniture");
  const [plannerItemEstimate, setPlannerItemEstimate] = useState("");
  const [plannerItemPriority, setPlannerItemPriority] = useState("High");

  useEffect(() => {
    const savedUser = localStorage.getItem("activeUser");
    const savedJointMonthlyTarget = localStorage.getItem("jointMonthlyTarget");
    const savedPushEnabled = localStorage.getItem("pushEnabled");
    const savedPlannerItems = localStorage.getItem("plannerItems");

    if (savedUser) {
      setActiveUser(savedUser);
      setContributionName(savedUser);
      setShowWelcome(true);

      setTimeout(() => {
        setShowWelcome(false);
      }, 2200);
    }

    if (savedJointMonthlyTarget) {
      setJointMonthlyTarget(Number(savedJointMonthlyTarget));
    }

    if (savedPushEnabled === "true") {
      setPushEnabled(true);
    }

    if (savedPlannerItems) {
      setPlannerItems(JSON.parse(savedPlannerItems));
    } else {
      setPlannerItems(starterPlannerItems);
    }

    loadData();

    if (savedUser) {
      setTimeout(() => {
        sendNotification(
          "Tracker opened",
          `${savedUser} opened the home savings tracker.`
        );
      }, 1200);
    }
  }, []);

  function chooseUser(name: string) {
    setActiveUser(name);
    setContributionName(name);
    localStorage.setItem("activeUser", name);
    setShowWelcome(true);

    setTimeout(() => {
      setShowWelcome(false);
    }, 2200);

    setTimeout(() => {
      sendNotification(
        "Tracker opened",
        `${name} opened the home savings tracker.`
      );
    }, 1200);
  }

  function switchUser() {
    localStorage.removeItem("activeUser");
    setActiveUser("");
    setShowWelcome(false);
  }

  async function loadData() {
    setIsLoading(true);
    setMessage("");

    const { data: savingsData, error: savingsError } = await supabase
      .from("savings_goals")
      .select("id, name, target, saved")
      .order("created_at", { ascending: true });

    const { data: partnerData, error: partnerError } = await supabase
      .from("partners")
      .select("id, name, saved, monthly_target")
      .order("created_at", { ascending: true });

    const { data: propertyData, error: propertyError } = await supabase
      .from("properties")
      .select("id, title, location, rent, deposit, status, link, image_url")
      .order("created_at", { ascending: false });

    if (savingsError || partnerError || propertyError) {
      setMessage(
        "Could not load Supabase data. Check your tables and .env.local file."
      );
      setIsLoading(false);
      return;
    }

    if (savingsData && savingsData.length > 0) {
      setSavingsGoals(savingsData as SavingsGoal[]);
    } else {
      await supabase.from("savings_goals").insert(starterSavingsGoals);
      setSavingsGoals(starterSavingsGoals);
    }

    if (partnerData && partnerData.length > 0) {
      setPartners(partnerData as Partner[]);
    } else {
      await supabase.from("partners").insert(starterPartners);
      setPartners(starterPartners);
    }

    if (propertyData && propertyData.length > 0) {
      setProperties(propertyData as Property[]);
    } else {
      setProperties(starterProperties);
    }

    setIsLoading(false);
  }

  const totals = useMemo(() => {
    const totalTarget = savingsGoals.reduce(
      (sum, goal) => sum + Number(goal.target),
      0
    );
    const totalSaved = savingsGoals.reduce(
      (sum, goal) => sum + Number(goal.saved),
      0
    );
    const progress =
      totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
    const remaining = Math.max(totalTarget - totalSaved, 0);
    const monthsToGoal =
      jointMonthlyTarget > 0 && remaining > 0
        ? Math.ceil(remaining / jointMonthlyTarget)
        : 0;

    return { totalTarget, totalSaved, progress, remaining, monthsToGoal };
  }, [savingsGoals, jointMonthlyTarget]);

  const partnerTotal = partners.reduce(
    (sum, partner) => sum + Number(partner.saved),
    0
  );

  async function saveJointMonthlyTarget() {
    const target = Number(jointMonthlyTargetInput);

    if (!target || target <= 0) {
      setMessage("Enter a valid joint monthly saving target.");
      return;
    }

    setJointMonthlyTarget(target);
    localStorage.setItem("jointMonthlyTarget", String(target));
    setJointMonthlyTargetInput("");
    setMessage(`Joint monthly target updated to ${formatGBP(target)}.`);

    await sendNotification(
      "Monthly target updated 💕",
      `${activeUser || "Someone"} set your joint monthly saving target to ${formatGBP(target)}.`
    );

    await sendMotivation();
  }

  async function addContribution() {
    const amount = Number(contributionAmount);

    if (!amount || amount <= 0) {
      setMessage("Enter a valid saving amount.");
      return;
    }

    const selectedGoal = savingsGoals.find(
      (goal) => goal.name === contributionGoal
    );
    const selectedPartner = partners.find(
      (partner) => partner.name === contributionName
    );

    if (!selectedGoal || !selectedPartner) {
      setMessage("Could not find the selected person or savings pot.");
      return;
    }

    const updatedGoalSaved = Number(selectedGoal.saved) + amount;
    const updatedPartnerSaved = Number(selectedPartner.saved) + amount;

    if (selectedGoal.id) {
      const { error } = await supabase
        .from("savings_goals")
        .update({ saved: updatedGoalSaved })
        .eq("id", selectedGoal.id);

      if (error) {
        setMessage("Could not save contribution to savings pot.");
        return;
      }
    }

    if (selectedPartner.id) {
      const { error } = await supabase
        .from("partners")
        .update({ saved: updatedPartnerSaved })
        .eq("id", selectedPartner.id);

      if (error) {
        setMessage("Could not save contribution to partner total.");
        return;
      }
    }

    setSavingsGoals((currentGoals) =>
      currentGoals.map((goal) =>
        goal.name === contributionGoal
          ? { ...goal, saved: updatedGoalSaved }
          : goal
      )
    );

    setPartners((currentPartners) =>
      currentPartners.map((partner) =>
        partner.name === contributionName
          ? { ...partner, saved: updatedPartnerSaved }
          : partner
      )
    );

    const previousTotalTarget = savingsGoals.reduce(
      (sum, goal) => sum + Number(goal.target),
      0
    );
    const previousTotalSaved = savingsGoals.reduce(
      (sum, goal) => sum + Number(goal.saved),
      0
    );
    const previousProgress =
      previousTotalTarget > 0
        ? Math.floor((previousTotalSaved / previousTotalTarget) * 100)
        : 0;
    const newProgress =
      previousTotalTarget > 0
        ? Math.floor(
            ((previousTotalSaved + amount) / previousTotalTarget) * 100
          )
        : 0;

    setContributionAmount("");
    setMessage(`Added ${formatGBP(amount)} for ${contributionName}.`);

    await sendNotification(
      "Savings added",
      `${contributionName} added ${formatGBP(amount)} towards ${contributionGoal}.`
    );

    const milestones = [25, 50, 75, 100];
    const reachedMilestone = milestones.find(
      (milestone) => previousProgress < milestone && newProgress >= milestone
    );

    if (reachedMilestone) {
      await sendNotification(
        "Milestone reached 🎉",
        `You have reached ${reachedMilestone}% of your move-in savings target.`
      );
    }

    await sendMotivation();
  }

  async function updateSavingsTarget(goal: SavingsGoal) {
    const editKey = goal.id || goal.name;
    const newTarget = Number(editingTargets[editKey]);

    if (!newTarget || newTarget <= 0) {
      setMessage("Enter a valid target amount.");
      return;
    }

    if (goal.id) {
      const { error } = await supabase
        .from("savings_goals")
        .update({ target: newTarget })
        .eq("id", goal.id);

      if (error) {
        setMessage("Could not update savings target.");
        return;
      }
    }

    setSavingsGoals((currentGoals) =>
      currentGoals.map((currentGoal) =>
        (currentGoal.id || currentGoal.name) === editKey
          ? { ...currentGoal, target: newTarget }
          : currentGoal
      )
    );

    setEditingTargets((current) => ({ ...current, [editKey]: "" }));
    setMessage(`${goal.name} target updated to ${formatGBP(newTarget)}.`);

    await sendNotification(
      "Savings pot target updated",
      `${goal.name} now has a target of ${formatGBP(newTarget)}.`
    );
  }

  function addPlannerItem() {
    const estimate = Number(plannerItemEstimate);

    if (!plannerItemName || !estimate || estimate < 0) {
      setMessage("Enter an item name and estimated cost.");
      return;
    }

    const newItem: PlannerItem = {
      id: crypto.randomUUID(),
      item: plannerItemName,
      category: plannerItemCategory,
      estimate,
      priority: plannerItemPriority,
    };

    const updatedItems = [newItem, ...plannerItems];
    setPlannerItems(updatedItems);
    localStorage.setItem("plannerItems", JSON.stringify(updatedItems));

    setPlannerItemName("");
    setPlannerItemEstimate("");
    setMessage(`${newItem.item} added to your planner.`);

    sendNotification(
      "New home item added 🛋️",
      `${newItem.item} has been added to the ${newItem.category} planner.`
    );

    sendMotivation();
  }

  async function deletePlannerItem(id: string) {
    const itemToDelete = plannerItems.find((item) => item.id === id);
    const updatedItems = plannerItems.filter((item) => item.id !== id);
    setPlannerItems(updatedItems);
    localStorage.setItem("plannerItems", JSON.stringify(updatedItems));
    setMessage("Planner item removed.");

    await sendNotification(
      "Planner item removed",
      `${itemToDelete?.item || "An item"} has been removed from your home planner.`
    );
  }

  async function updatePropertyStatus(
    propertyId: string | undefined,
    status: string
  ) {
    if (!propertyId) return;

    const propertyToUpdate = properties.find((property) => property.id === propertyId);

    const { error } = await supabase
      .from("properties")
      .update({ status })
      .eq("id", propertyId);

    if (error) {
      setMessage("Could not update property status.");
      return;
    }

    setProperties((currentProperties) =>
      currentProperties.map((property) =>
        property.id === propertyId ? { ...property, status } : property
      )
    );

    setMessage("Property status updated.");

    await sendNotification(
      "Property status changed 🏡",
      `${propertyToUpdate?.title || "A property"} is now marked as ${status}.`
    );
  }

  async function deleteProperty(propertyId: string | undefined) {
    if (!propertyId) return;

    const propertyToDelete = properties.find(
      (property) => property.id === propertyId
    );

    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", propertyId);

    if (error) {
      setMessage("Could not delete property.");
      return;
    }

    setProperties((currentProperties) =>
      currentProperties.filter((property) => property.id !== propertyId)
    );

    setMessage("Property removed from watchlist.");

    await sendNotification(
      "Property removed",
      `${propertyToDelete?.title || "A property"} has been removed from the watchlist.`
    );
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);

    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  }

  async function enablePushNotifications() {
    if (!activeUser) {
      setMessage("Choose Jordan or Dannie first.");
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setMessage("Push notifications are not supported on this browser.");
      return;
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      setMessage("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY.");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      setMessage("Notifications were not enabled.");
      return;
    }

    const registration = await navigator.serviceWorker.register("/sw.js");

    const subscription =
      (await registration.pushManager.getSubscription()) ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      }));

    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userName: activeUser,
        subscription,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      setMessage(
        `Could not save push subscription: ${data.error || "Unknown error"}`
      );
      return;
    }

    setPushEnabled(true);
    localStorage.setItem("pushEnabled", "true");
    setMessage("Push notifications enabled.");
  }

  async function sendNotification(title: string, body: string) {
    try {
      await fetch("/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, body }),
      });
    } catch {
      // Keep main app actions working even if notifications fail.
    }
  }

  async function sendMotivation() {
  const randomMessage =
    motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  await sendNotification("Keep going 💖", randomMessage);
}

  async function addProperty() {
    const rent = Number(propertyRent);
    const deposit = Number(propertyDeposit);

    if (!propertyTitle.trim()) {
      setMessage("Enter a property title.");
      return;
    }

    if (!propertyLocation.trim()) {
      setMessage("Enter a property location.");
      return;
    }

    if (isNaN(rent)) {
      setMessage("Enter a valid monthly rent.");
      return;
    }

    if (isNaN(deposit)) {
      setMessage("Enter a valid deposit amount.");
      return;
    }

    const newProperty = {
      title: propertyTitle,
      location: propertyLocation,
      rent,
      deposit,
      link: propertyLink || null,
      image_url: propertyImageUrl || null,
      status: "Watching",
    };

    const { data, error } = await supabase
      .from("properties")
      .insert(newProperty)
      .select()
      .single();

    if (error) {
      setMessage(`Could not save property: ${error.message}`);
      return;
    }

    setProperties((currentProperties) => [data as Property, ...currentProperties]);

    setPropertyTitle("");
    setPropertyLocation("");
    setPropertyRent("");
    setPropertyDeposit("");
    setPropertyLink("");
    setPropertyImageUrl("");

    setMessage("Property added to your watchlist.");

    await sendNotification(
      "New property added 🏡",
      `${propertyTitle} in ${propertyLocation} has been added to the Cornwall watchlist. Rent: ${formatGBP(rent)}. Deposit: ${formatGBP(deposit)}.`
    );

    await sendMotivation();
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#14000b] p-4 text-white sm:p-6">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(236,72,153,0.40),transparent_28%),radial-gradient(circle_at_top_right,rgba(251,113,133,0.34),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.22),transparent_36%),radial-gradient(circle_at_bottom,rgba(190,24,93,0.35),transparent_45%),linear-gradient(135deg,#14000b_0%,#3b0820_38%,#831843_72%,#be123c_100%)]" />
      <div className="fixed left-1/2 top-0 -z-10 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-fuchsia-300/20 blur-3xl" />
      <div className="fixed right-10 top-1/3 -z-10 h-72 w-72 rounded-full bg-rose-400/15 blur-3xl" />
      <div className="pointer-events-none fixed left-8 top-24 -z-10 text-8xl text-pink-200/10">
        ❤
      </div>
      <div className="pointer-events-none fixed bottom-24 right-8 -z-10 text-9xl text-rose-200/10">
        ❤
      </div>

      {!activeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-rose-950/80 p-6 backdrop-blur-2xl">
          <div className="relative w-full max-w-md overflow-hidden rounded-[2.25rem] border border-fuchsia-200/25 bg-white/[0.11] p-7 text-center shadow-2xl shadow-rose-950/50 backdrop-blur-2xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fuchsia-200 via-pink-300 to-rose-300" />
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-fuchsia-200 via-pink-300 to-rose-300 text-rose-950 shadow-[0_0_35px_rgba(244,114,182,0.45)]">
              <Heart size={30} fill="currentColor" />
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-tight">
              Who is checking in?
            </h2>
            <p className="mt-2 text-sm leading-6 text-pink-50/70">
              Choose who is using the tracker so savings and updates are added
              under the right person.
            </p>

            <div className="mt-7 grid gap-3">
              <button
                onClick={() => chooseUser("Jordan")}
                className={primaryButtonClass}
              >
                Jordan
              </button>
              <button
                onClick={() => chooseUser("Dannie")}
                className="rounded-2xl border border-pink-200/25 bg-white/[0.10] px-5 py-3 text-sm font-black text-pink-50 shadow-lg shadow-rose-950/20 transition-all duration-300 hover:scale-[1.03] hover:bg-white/[0.16]"
              >
                Dannie
              </button>
            </div>
          </div>
        </div>
      )}

      {showWelcome && activeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-rose-950/85 p-6 backdrop-blur-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,113,133,0.32),transparent_28%),radial-gradient(circle_at_bottom,rgba(244,114,182,0.25),transparent_35%)]" />
          <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-300/20 blur-3xl" />

          <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-fuchsia-200/25 bg-white/[0.11] p-8 text-center shadow-2xl shadow-rose-950/60 backdrop-blur-2xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fuchsia-200 via-pink-300 to-rose-300" />

            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-fuchsia-200 via-pink-300 to-rose-300 text-rose-950 shadow-[0_0_45px_rgba(244,114,182,0.45)]">
              <Heart size={42} fill="currentColor" />
            </div>

            <p className="mt-7 text-sm font-bold uppercase tracking-[0.35em] text-fuchsia-100/80">
              Welcome back
            </p>
            <h2 className="mt-3 bg-gradient-to-r from-fuchsia-100 via-white to-pink-100 bg-clip-text text-6xl font-black tracking-tight text-transparent">
              {activeUser}
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-pink-50/70">
              Your shared Cornwall home savings journey is ready.
            </p>

            <div className="mx-auto mt-7 h-2 w-44 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-fuchsia-200 via-pink-300 to-rose-300" />
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-6 pb-24 md:pb-6">
        <header className={`${cardClass} p-6 md:p-8`}>
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-200/25 bg-pink-200/10 px-4 py-2 text-sm font-bold text-pink-50">
                <Heart size={16} fill="currentColor" /> Jordan & Dannie’s love nest
              </div>
              <h1 className="mt-5 max-w-4xl bg-gradient-to-r from-fuchsia-100 via-white to-pink-100 bg-clip-text text-4xl font-black tracking-tight text-transparent md:text-6xl">
                Our Dream Home Fund
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-pink-50/70">
                A beautiful shared tracker for savings, Cornwall rentals, furniture,
                appliances, reminders, and every step towards your future home.
              </p>
            </div>

            <button onClick={switchUser} className={softButtonClass}>
              Switch user
            </button>
          </div>
        </header>

        {(isLoading || message) && (
          <div className="rounded-3xl border border-fuchsia-200/25 bg-white/[0.10] p-4 text-sm font-medium text-pink-50 shadow-xl shadow-rose-950/20 backdrop-blur-xl">
            {isLoading ? "Loading your saved data..." : message}
          </div>
        )}

        <section className={`${cardClass} p-4`}>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["#overview", "Overview"],
              ["#savings", "Savings"],
              ["#pots", "Pots"],
              ["#properties", "Properties"],
              ["#planner", "Planner"],
              ["#notifications", "Alerts"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-2xl border border-fuchsia-200/20 bg-white/[0.08] px-4 py-3 text-center text-sm font-black text-pink-50/80 transition-all duration-300 hover:-translate-y-0.5 hover:border-fuchsia-100/50 hover:bg-white/[0.16] hover:text-white hover:shadow-[0_0_24px_rgba(217,70,239,0.25)]"
              >
                {label}
              </a>
            ))}
          </div>
        </section>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-fuchsia-100/60">Section 01</p>
            <h2 className="mt-2 text-2xl font-black md:text-3xl">Overview</h2>
          </div>
          <div className="hidden h-px flex-1 bg-gradient-to-r from-fuchsia-200/40 to-transparent sm:block" />
        </div>

        <section id="overview" className="grid gap-4 md:grid-cols-4">
          <div className={`${innerCardClass} p-5`}>
            <div className="flex items-center gap-3 text-pink-50/75">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-300/15">
                <PiggyBank className="text-fuchsia-100" />
              </div>
              <p className="font-bold">Saved so far</p>
            </div>
            <p className="mt-5 text-4xl font-black">{formatGBP(totals.totalSaved)}</p>
          </div>

          <div className={`${innerCardClass} p-5`}>
            <div className="flex items-center gap-3 text-pink-50/75">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-300/15">
                <TrendingUp className="text-rose-100" />
              </div>
              <p className="font-bold">Move-in target</p>
            </div>
            <p className="mt-5 text-4xl font-black">{formatGBP(totals.totalTarget)}</p>
          </div>

          <div className={`${innerCardClass} p-5`}>
            <div className="flex items-center gap-3 text-pink-50/75">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-300/15">
                <Home className="text-red-100" />
              </div>
              <p className="font-bold">Remaining</p>
            </div>
            <p className="mt-5 text-4xl font-black">{formatGBP(totals.remaining)}</p>
          </div>

          <div className={`${innerCardClass} p-5`}>
            <p className="font-bold text-pink-50/75">Together progress</p>
            <p className="mt-4 text-4xl font-black">{totals.progress}%</p>
            <div className="mt-4">
              <ProgressBar value={totals.progress} />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {partners.map((partner) => (
            <div key={partner.name} className={`${innerCardClass} p-5`}>
              <p className="text-sm font-bold text-pink-50/55">Saved by</p>
              <div className="mt-2 flex items-center justify-between">
                <h2 className="text-2xl font-black">{partner.name}</h2>
                <Heart className="text-pink-200" fill="currentColor" />
              </div>
              <p className="mt-4 text-3xl font-black">
                {formatGBP(Number(partner.saved))}
              </p>
            </div>
          ))}

          <div className={`${innerCardClass} p-5`}>
            <p className="text-sm font-bold text-pink-50/55">Together</p>
            <div className="mt-2 flex items-center justify-between">
              <h2 className="text-2xl font-black">Joint total</h2>
              <Sparkles className="text-rose-200" />
            </div>
            <p className="mt-4 text-3xl font-black">{formatGBP(partnerTotal)}</p>
          </div>
        </section>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-fuchsia-100/60">Section 02</p>
            <h2 className="mt-2 text-2xl font-black md:text-3xl">Monthly plan</h2>
          </div>
          <div className="hidden h-px flex-1 bg-gradient-to-r from-fuchsia-200/40 to-transparent sm:block" />
        </div>

        <section id="monthly" className="grid gap-6 lg:grid-cols-3">
          <div className={`${cardClass} p-6 lg:col-span-2`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-pink-50/55">
                  Joint monthly goal
                </p>
                <h2 className="mt-2 text-4xl font-black">
                  {formatGBP(jointMonthlyTarget)}
                </h2>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-300/15">
                <WalletCards className="text-fuchsia-100" />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                value={jointMonthlyTargetInput}
                onChange={(event) => setJointMonthlyTargetInput(event.target.value)}
                type="number"
                min="0"
                placeholder="Set joint monthly saving target"
                className={inputClass}
              />
              <button onClick={saveJointMonthlyTarget} className={primaryButtonClass}>
                Save monthly target
              </button>
            </div>
          </div>

          <div className={`${cardClass} p-6`}>
            <p className="text-sm font-bold text-pink-50/55">Estimated time left</p>
            <h2 className="mt-3 text-4xl font-black">
              {totals.monthsToGoal > 0 ? `${totals.monthsToGoal} months` : "Set target"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-pink-50/60">
              Based on your joint monthly target and remaining amount.
            </p>
          </div>
        </section>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-fuchsia-100/60">Section 06</p>
            <h2 className="mt-2 text-2xl font-black md:text-3xl">Alerts & motivation</h2>
          </div>
          <div className="hidden h-px flex-1 bg-gradient-to-r from-fuchsia-200/40 to-transparent sm:block" />
        </div>

        <section id="notifications" className={`${cardClass} p-6`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-300/15">
              <Bell className="text-fuchsia-100" />
            </div>
            <div>
              <h2 className="text-xl font-black">Push Notifications</h2>
              <p className="mt-1 text-sm text-pink-50/60">
                Shared updates when savings, properties and planner items change.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button onClick={enablePushNotifications} className={primaryButtonClass}>
              {pushEnabled ? "Notifications enabled" : "Enable notifications"}
            </button>

            <button
              onClick={sendMotivation}
              className="rounded-2xl border border-fuchsia-200/25 bg-pink-200/10 px-5 py-3 text-sm font-bold text-pink-50 transition-all duration-300 hover:scale-[1.03] hover:bg-pink-200/15"
            >
              Send motivation
            </button>
          </div>
        </section>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-fuchsia-100/60">Section 03</p>
            <h2 className="mt-2 text-2xl font-black md:text-3xl">Savings & contributions</h2>
          </div>
          <div className="hidden h-px flex-1 bg-gradient-to-r from-fuchsia-200/40 to-transparent sm:block" />
        </div>

        <section id="savings" className={`${cardClass} p-6`}>
          <h2 className="text-xl font-black">Add Savings Contribution</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <select
              value={contributionName}
              onChange={(event) => setContributionName(event.target.value)}
              className={inputClass}
            >
              {partners.map((partner) => (
                <option key={partner.name} value={partner.name}>
                  {partner.name}
                </option>
              ))}
            </select>

            <select
              value={contributionGoal}
              onChange={(event) => setContributionGoal(event.target.value)}
              className={inputClass}
            >
              {savingsGoals.map((goal) => (
                <option key={goal.name} value={goal.name}>
                  {goal.name}
                </option>
              ))}
            </select>

            <input
              value={contributionAmount}
              onChange={(event) => setContributionAmount(event.target.value)}
              type="number"
              min="0"
              placeholder="Amount saved"
              className={inputClass}
            />

            <button onClick={addContribution} className={primaryButtonClass}>
              <Plus size={18} /> Add saving
            </button>
          </div>
        </section>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-fuchsia-100/60">Section 04</p>
            <h2 className="mt-2 text-2xl font-black md:text-3xl">Pots & property adding</h2>
          </div>
          <div className="hidden h-px flex-1 bg-gradient-to-r from-fuchsia-200/40 to-transparent sm:block" />
        </div>

        <section id="pots" className="grid gap-6 lg:grid-cols-2">
          <div className={`${cardClass} p-6`}>
            <h2 className="text-xl font-black">Savings Pots</h2>
            <div className="mt-5 space-y-4">
              {savingsGoals.map((goal) => {
                const goalProgress =
                  Number(goal.target) > 0
                    ? Math.round((Number(goal.saved) / Number(goal.target)) * 100)
                    : 0;

                return (
                  <div
                    key={goal.name}
                    className="rounded-3xl border border-fuchsia-200/20 bg-white/[0.07] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-black">{goal.name}</p>
                        <p className="text-sm text-pink-50/55">
                          {formatGBP(Number(goal.saved))} saved of{" "}
                          {formatGBP(Number(goal.target))}
                        </p>
                      </div>
                      <p className="font-black text-fuchsia-100">{goalProgress}%</p>
                    </div>

                    <ProgressBar value={goalProgress} />

                    <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                      <input
                        value={editingTargets[goal.id || goal.name] || ""}
                        onChange={(event) =>
                          setEditingTargets((current) => ({
                            ...current,
                            [goal.id || goal.name]: event.target.value,
                          }))
                        }
                        type="number"
                        min="0"
                        placeholder={`New target: ${formatGBP(Number(goal.target))}`}
                        className={inputClass}
                      />
                      <button
                        onClick={() => updateSavingsTarget(goal)}
                        className={softButtonClass}
                      >
                        Save target
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`${cardClass} p-6`}>
            <h2 className="text-xl font-black">Add Property Listing</h2>
            <div className="mt-4 grid gap-3">
              <input
                value={propertyTitle}
                onChange={(event) => setPropertyTitle(event.target.value)}
                placeholder="Property title, e.g. 2 Bed House - Truro"
                className={inputClass}
              />
              <input
                value={propertyLocation}
                onChange={(event) => setPropertyLocation(event.target.value)}
                placeholder="Location"
                className={inputClass}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={propertyRent}
                  onChange={(event) => setPropertyRent(event.target.value)}
                  type="number"
                  min="0"
                  placeholder="Monthly rent"
                  className={inputClass}
                />
                <input
                  value={propertyDeposit}
                  onChange={(event) => setPropertyDeposit(event.target.value)}
                  type="number"
                  min="0"
                  placeholder="Deposit"
                  className={inputClass}
                />
              </div>
              <input
                value={propertyLink}
                onChange={(event) => setPropertyLink(event.target.value)}
                placeholder="Rightmove, Zoopla, OpenRent or agent link"
                className={inputClass}
              />
              <input
                value={propertyImageUrl}
                onChange={(event) => setPropertyImageUrl(event.target.value)}
                placeholder="Image URL for preview"
                className={inputClass}
              />
              <button onClick={addProperty} className={primaryButtonClass}>
                <Plus size={18} /> Add property
              </button>
            </div>
          </div>
        </section>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-fuchsia-100/60">Section 05</p>
            <h2 className="mt-2 text-2xl font-black md:text-3xl">Property watchlist</h2>
          </div>
          <div className="hidden h-px flex-1 bg-gradient-to-r from-fuchsia-200/40 to-transparent sm:block" />
        </div>

        <section id="properties" className={`${cardClass} p-6`}>
          <h2 className="text-xl font-black">Cornwall Love Nest Watchlist</h2>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {properties.length === 0 && (
              <div className="rounded-3xl border border-fuchsia-200/20 bg-white/[0.07] p-5 text-sm text-pink-50/60 lg:col-span-2">
                No properties added yet. Add properties you and Dannie are interested in.
              </div>
            )}

            {properties.map((property) => (
              <div
                key={property.id || `${property.title}-${property.location}`}
                className="overflow-hidden rounded-[2rem] border border-fuchsia-200/20 bg-white/[0.08] shadow-xl shadow-rose-950/25 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.12] hover:shadow-2xl"
              >
                {property.image_url ? (
                  <img
                    src={property.image_url}
                    alt={property.title}
                    className="h-52 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-52 w-full items-center justify-center bg-gradient-to-br from-rose-950 via-pink-950 to-red-950 text-sm text-pink-50/45">
                    No image preview added
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black">{property.title}</h3>
                      <p className="text-sm text-pink-50/55">{property.location}</p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(
                        property.status
                      )}`}
                    >
                      {property.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-white/[0.08] p-3">
                      <p className="text-pink-50/50">Monthly rent</p>
                      <p className="font-black">{formatGBP(Number(property.rent))}</p>
                    </div>
                    <div className="rounded-2xl bg-white/[0.08] p-3">
                      <p className="text-pink-50/50">Deposit</p>
                      <p className="font-black">{formatGBP(Number(property.deposit))}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <select
                      value={property.status}
                      onChange={(event) =>
                        updatePropertyStatus(property.id, event.target.value)
                      }
                      className={inputClass}
                    >
                      <option>Watching</option>
                      <option>Interested</option>
                      <option>Viewing Booked</option>
                      <option>Applied</option>
                      <option>Rejected</option>
                      <option>No Longer Interested</option>
                    </select>

                    <button
                      onClick={() => deleteProperty(property.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm font-black text-red-100 transition-all duration-300 hover:scale-[1.03] hover:bg-red-400/15"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>

                  {property.link && (
                    <a
                      href={property.link}
                      target="_blank"
                      className="mt-4 inline-flex items-center gap-2 text-sm font-black text-fuchsia-100 hover:text-white"
                    >
                      <LinkIcon size={16} /> Open listing
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-fuchsia-100/60">Section 06</p>
            <h2 className="mt-2 text-2xl font-black md:text-3xl">Furniture & appliances</h2>
          </div>
          <div className="hidden h-px flex-1 bg-gradient-to-r from-fuchsia-200/40 to-transparent sm:block" />
        </div>

        <section id="planner" className={`${cardClass} p-6`}>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-black">Furniture & Appliance Planner</h2>
              <p className="mt-1 text-sm text-pink-50/60">
                Add everything you need for the move and track estimated costs.
              </p>
            </div>
            <div className="rounded-2xl border border-fuchsia-200/25 bg-pink-200/10 px-4 py-3 text-sm font-black text-pink-50">
              Total estimate:{" "}
              {formatGBP(
                plannerItems.reduce(
                  (sum, item) => sum + Number(item.estimate),
                  0
                )
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_160px_140px_auto]">
            <input
              value={plannerItemName}
              onChange={(event) => setPlannerItemName(event.target.value)}
              placeholder="Item name, e.g. Sofa, TV, Kettle"
              className={inputClass}
            />

            <select
              value={plannerItemCategory}
              onChange={(event) => setPlannerItemCategory(event.target.value)}
              className={inputClass}
            >
              <option>Furniture</option>
              <option>Appliance</option>
              <option>Kitchen</option>
              <option>Bedroom</option>
              <option>Bathroom</option>
              <option>Decor</option>
              <option>Other</option>
            </select>

            <input
              value={plannerItemEstimate}
              onChange={(event) => setPlannerItemEstimate(event.target.value)}
              type="number"
              min="0"
              placeholder="Estimate"
              className={inputClass}
            />

            <select
              value={plannerItemPriority}
              onChange={(event) => setPlannerItemPriority(event.target.value)}
              className={inputClass}
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>

            <button onClick={addPlannerItem} className={primaryButtonClass}>
              <Plus size={18} /> Add item
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {plannerItems.length === 0 && (
              <div className="rounded-3xl border border-fuchsia-200/20 bg-white/[0.07] p-5 text-sm text-pink-50/60 md:col-span-2 lg:col-span-4">
                No furniture or appliance items added yet.
              </div>
            )}

            {plannerItems.map((plannerItem) => {
              const Icon =
                plannerItem.category === "Appliance" ? WashingMachine : Sofa;

              return (
                <div
                  key={plannerItem.id}
                  className="rounded-3xl border border-fuchsia-200/20 bg-white/[0.08] p-4 shadow-xl shadow-rose-950/20 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.12]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-fuchsia-300/15">
                    <Icon className="text-fuchsia-100" />
                  </div>
                  <h3 className="mt-3 font-black">{plannerItem.item}</h3>
                  <p className="text-sm text-pink-50/55">{plannerItem.category}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="font-black">
                      {formatGBP(Number(plannerItem.estimate))}
                    </p>
                    <span className="rounded-full bg-white/[0.10] px-3 py-1 text-xs font-black text-pink-50">
                      {plannerItem.priority}
                    </span>
                  </div>
                  <button
                    onClick={() => deletePlannerItem(plannerItem.id)}
                    className="mt-4 w-full rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-2 text-sm font-black text-red-100 transition-all duration-300 hover:scale-[1.03] hover:bg-red-400/15"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <nav className="fixed inset-x-4 bottom-4 z-40 rounded-[1.6rem] border border-fuchsia-200/25 bg-rose-950/80 p-2 shadow-2xl shadow-rose-950/60 backdrop-blur-2xl md:hidden">
          <div className="grid grid-cols-5 gap-1">
            <a
              href="#overview"
              className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black text-pink-50/70 hover:bg-white/10 hover:text-white"
            >
              <Home size={18} />
              Home
            </a>
            <a
              href="#savings"
              className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black text-pink-50/70 hover:bg-white/10 hover:text-white"
            >
              <PiggyBank size={18} />
              Save
            </a>
            <a
              href="#properties"
              className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black text-pink-50/70 hover:bg-white/10 hover:text-white"
            >
              <Building2 size={18} />
              Homes
            </a>
            <a
              href="#planner"
              className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black text-pink-50/70 hover:bg-white/10 hover:text-white"
            >
              <Sofa size={18} />
              Items
            </a>
            <button
              onClick={sendMotivation}
              className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black text-pink-50/70 hover:bg-white/10 hover:text-white"
            >
              <Heart size={18} fill="currentColor" />
              Love
            </button>
          </div>
        </nav>
      </div>
    </main>
  );
}