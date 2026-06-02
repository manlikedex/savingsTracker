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
        className="h-3 rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-300 shadow-[0_0_18px_rgba(52,211,153,0.45)] transition-all"
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

export default function HomePage() {
  const [activeUser, setActiveUser] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(starterSavingsGoals);
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
  const [editingTargets, setEditingTargets] = useState<Record<string, string>>({});
  const [plannerItemName, setPlannerItemName] = useState("");
  const [plannerItemCategory, setPlannerItemCategory] = useState("Furniture");
  const [plannerItemEstimate, setPlannerItemEstimate] = useState("");
  const [plannerItemPriority, setPlannerItemPriority] = useState("High");

  useEffect(() => {
    const savedUser = localStorage.getItem("activeUser");
    const savedJointMonthlyTarget = localStorage.getItem("jointMonthlyTarget");
    const savedPushEnabled = localStorage.getItem("pushEnabled");

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

    const savedPlannerItems = localStorage.getItem("plannerItems");

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
      setMessage("Could not load Supabase data. Check your tables and .env.local file.");
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
    const totalTarget = savingsGoals.reduce((sum, goal) => sum + Number(goal.target), 0);
    const totalSaved = savingsGoals.reduce((sum, goal) => sum + Number(goal.saved), 0);
    const progress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
    const remaining = Math.max(totalTarget - totalSaved, 0);
    const monthsToGoal = jointMonthlyTarget > 0 && remaining > 0 ? Math.ceil(remaining / jointMonthlyTarget) : 0;

    return { totalTarget, totalSaved, progress, remaining, monthsToGoal };
  }, [savingsGoals, jointMonthlyTarget]);

  function saveJointMonthlyTarget() {
    const target = Number(jointMonthlyTargetInput);

    if (!target || target <= 0) {
      setMessage("Enter a valid joint monthly saving target.");
      return;
    }

    setJointMonthlyTarget(target);
    localStorage.setItem("jointMonthlyTarget", String(target));
    setJointMonthlyTargetInput("");
    setMessage(`Joint monthly target updated to ${formatGBP(target)}.`);
  }

  async function addContribution() {
    const amount = Number(contributionAmount);

    if (!amount || amount <= 0) {
      setMessage("Enter a valid saving amount.");
      return;
    }

    const selectedGoal = savingsGoals.find((goal) => goal.name === contributionGoal);
    const selectedPartner = partners.find((partner) => partner.name === contributionName);

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
        goal.name === contributionGoal ? { ...goal, saved: updatedGoalSaved } : goal
      )
    );

    setPartners((currentPartners) =>
      currentPartners.map((partner) =>
        partner.name === contributionName ? { ...partner, saved: updatedPartnerSaved } : partner
      )
    );

    const previousTotalTarget = savingsGoals.reduce((sum, goal) => sum + Number(goal.target), 0);
    const previousTotalSaved = savingsGoals.reduce((sum, goal) => sum + Number(goal.saved), 0);
    const previousProgress =
      previousTotalTarget > 0 ? Math.floor((previousTotalSaved / previousTotalTarget) * 100) : 0;
    const newProgress =
      previousTotalTarget > 0 ? Math.floor(((previousTotalSaved + amount) / previousTotalTarget) * 100) : 0;

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
      "New item added",
      `${newItem.item} has been added to the ${newItem.category} planner.`
    );
  }

  function deletePlannerItem(id: string) {
    const updatedItems = plannerItems.filter((item) => item.id !== id);
    setPlannerItems(updatedItems);
    localStorage.setItem("plannerItems", JSON.stringify(updatedItems));
    setMessage("Planner item removed.");
  }

  async function updatePropertyStatus(propertyId: string | undefined, status: string) {
    if (!propertyId) return;

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
  }

  async function deleteProperty(propertyId: string | undefined) {
    if (!propertyId) return;

    const propertyToDelete = properties.find((property) => property.id === propertyId);

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

  return Uint8Array.from(
    [...rawData].map((char) => char.charCodeAt(0))
  );
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
    setMessage("Could not save push subscription.");
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
    // Keeps the main app action working even if notifications fail.
  }
}

async function sendMotivation() {
  const messages = [
    "Small steps every week get you closer to your own place.",
    "Keep going — every pound saved gets you closer to moving in.",
    "You and Dannie are building something together. Stay consistent.",
    "Future you will be glad you kept saving today.",
    "Every update is progress. Keep the momentum going.",
  ];

  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  await sendNotification("Keep going 💪", randomMessage);
}

async function sendTestNotification() {
  await sendNotification(
    "Test notification",
    "Notifications are working for your home savings tracker."
  );

  setMessage("Test notification sent.");
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

    setProperties((currentProperties) => [
      data as Property,
      ...currentProperties,
    ]);

    setPropertyTitle("");
    setPropertyLocation("");
    setPropertyRent("");
    setPropertyDeposit("");
    setPropertyLink("");
    setPropertyImageUrl("");

    setMessage("Property added to your watchlist.");

    await sendNotification(
      "New property added",
      `${propertyTitle} has been added to the Cornwall watchlist.`
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 p-6 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_34%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.20),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_45%,#111827_100%)]" />
      <div className="fixed left-1/2 top-0 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

      {!activeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6 backdrop-blur-xl">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.08] p-6 text-center shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950">
              <Heart size={26} />
            </div>
            <h2 className="mt-5 text-2xl font-bold">Who’s using the tracker?</h2>
            <p className="mt-2 text-sm text-slate-300">
              Select your name so contributions are added under the right person.
            </p>

            <div className="mt-6 grid gap-3">
              <button
                onClick={() => chooseUser("Jordan")}
                className="rounded-2xl border border-cyan-300/20 bg-gradient-to-r from-cyan-400/20 to-emerald-400/20 px-5 py-4 text-base font-bold text-cyan-100 transition hover:scale-[1.02] hover:border-cyan-300/40"
              >
                Jordan
              </button>
              <button
                onClick={() => chooseUser("Dannie")}
                className="rounded-2xl border border-emerald-300/20 bg-gradient-to-r from-emerald-400/20 to-lime-400/20 px-5 py-4 text-base font-bold text-emerald-100 transition hover:scale-[1.02] hover:border-emerald-300/40"
              >
                Dannie
              </button>
            </div>
          </div>
        </div>
      )}

      {showWelcome && activeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/85 p-6 backdrop-blur-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.20),transparent_28%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.18),transparent_32%)]" />
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/20 blur-3xl" />

          <div className="relative w-full max-w-lg overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.08] p-8 text-center shadow-2xl shadow-black/50 backdrop-blur-2xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-300" />

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-cyan-300 via-emerald-300 to-lime-300 text-slate-950 shadow-2xl shadow-emerald-950/50">
              <Heart size={36} fill="currentColor" />
            </div>

            <p className="mt-7 text-sm font-semibold uppercase tracking-[0.35em] text-emerald-200">
              Welcome back
            </p>
            <h2 className="mt-3 bg-gradient-to-r from-cyan-200 via-white to-emerald-200 bg-clip-text text-5xl font-black tracking-tight text-transparent">
              {activeUser}
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-slate-300">
              Your Cornwall move-in savings tracker is ready. Contributions will be added under your name.
            </p>

            <div className="mx-auto mt-7 h-2 w-40 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200">
                <Heart size={16} /> Jordan & Dannie’s private savings tracker
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
                Cornwall move-in savings plan
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Track your joint savings, rental options, furniture, appliances, and everything needed before moving into your first rented place together.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={switchUser}
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-slate-200 shadow-lg shadow-black/20 transition hover:scale-[1.02] hover:border-white/20"
              >
                Switch user
              </button>
              
            </div>
          </div>
        </header>

        {(isLoading || message) && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm text-slate-200 backdrop-blur-xl">
            {isLoading ? "Loading your saved data..." : message}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
            <div className="flex items-center gap-3 text-slate-300">
              <PiggyBank className="text-emerald-300" />
              <p className="font-medium">Saved so far</p>
            </div>
            <p className="mt-4 text-3xl font-bold">{formatGBP(totals.totalSaved)}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
            <div className="flex items-center gap-3 text-slate-300">
              <TrendingUp className="text-cyan-300" />
              <p className="font-medium">Move-in target</p>
            </div>
            <p className="mt-4 text-3xl font-bold">{formatGBP(totals.totalTarget)}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
            <div className="flex items-center gap-3 text-slate-300">
              <Home className="text-lime-300" />
              <p className="font-medium">Remaining</p>
            </div>
            <p className="mt-4 text-3xl font-bold">{formatGBP(totals.remaining)}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
            <p className="font-medium text-slate-300">Overall progress</p>
            <p className="mt-4 text-3xl font-bold">{totals.progress}%</p>
            <div className="mt-3">
              <ProgressBar value={totals.progress} />
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-black/20 backdrop-blur-xl lg:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">Joint monthly goal</p>
                <h2 className="text-2xl font-bold">{formatGBP(jointMonthlyTarget)}</h2>
              </div>
              <WalletCards className="text-emerald-300" />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                value={jointMonthlyTargetInput}
                onChange={(event) => setJointMonthlyTargetInput(event.target.value)}
                type="number"
                min="0"
                placeholder="Set joint monthly saving target"
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm outline-none ring-emerald-300/30 placeholder:text-slate-500 focus:ring-4"
              />
              <button
                onClick={saveJointMonthlyTarget}
                className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-5 py-3 text-sm font-bold text-emerald-100 transition hover:scale-[1.02] hover:border-emerald-300/40"
              >
                Save monthly target
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-black/20 backdrop-blur-xl">
            <p className="text-sm text-slate-400">Estimated time left</p>
            <h2 className="mt-2 text-3xl font-bold">
              {totals.monthsToGoal > 0 ? `${totals.monthsToGoal} months` : "Set target"}
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Based on your joint monthly target and remaining amount.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-black/20 backdrop-blur-xl">
  <div className="flex items-center gap-3">
    <Bell className="text-emerald-300" />
    <h2 className="text-xl font-bold">Push Notifications</h2>
  </div>

  <p className="mt-2 text-sm text-slate-400">
    Enable reminders and shared updates when savings, properties, and planner items change.
  </p>

  <div className="mt-5 grid gap-3 sm:grid-cols-3">
    <button
      onClick={enablePushNotifications}
      className="rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:scale-[1.02]"
    >
      {pushEnabled ? "Notifications enabled" : "Enable notifications"}
    </button>

    <button
      onClick={sendTestNotification}
      className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-bold text-slate-200 transition hover:scale-[1.02] hover:border-white/20"
    >
      Send test
    </button>

    <button
      onClick={sendMotivation}
      className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-5 py-2.5 text-sm font-bold text-emerald-100 transition hover:scale-[1.02] hover:border-emerald-300/40"
    >
      Motivate us
    </button>
  </div>
</section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-black/20 backdrop-blur-xl">
          <h2 className="text-xl font-bold">Add Savings Contribution</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <select
              value={contributionName}
              onChange={(event) => setContributionName(event.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none ring-emerald-300/30 focus:ring-4"
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
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none ring-emerald-300/30 focus:ring-4"
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
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm outline-none ring-emerald-300/30 placeholder:text-slate-500 focus:ring-4"
            />

            <button
              onClick={addContribution}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:scale-[1.02]"
            >
              <Plus size={18} /> Add saving
            </button>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-black/20 backdrop-blur-xl">
            <h2 className="text-xl font-bold">Savings Pots</h2>
            <div className="mt-5 space-y-5">
              {savingsGoals.map((goal) => {
                const goalProgress = Number(goal.target) > 0 ? Math.round((Number(goal.saved) / Number(goal.target)) * 100) : 0;

                return (
                  <div key={goal.name} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold">{goal.name}</p>
                        <p className="text-sm text-slate-400">
                          {formatGBP(Number(goal.saved))} saved of {formatGBP(Number(goal.target))}
                        </p>
                      </div>
                      <p className="font-bold text-emerald-300">{goalProgress}%</p>
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
                        className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm outline-none ring-emerald-300/30 placeholder:text-slate-500 focus:ring-4"
                      />
                      <button
                        onClick={() => updateSavingsTarget(goal)}
                        className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm font-bold text-emerald-100 transition hover:scale-[1.02] hover:border-emerald-300/40"
                      >
                        Save target
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-black/20 backdrop-blur-xl">
            <h2 className="text-xl font-bold">Add Property</h2>
            <div className="mt-4 grid gap-2">
              <input
                value={propertyTitle}
                onChange={(event) => setPropertyTitle(event.target.value)}
                placeholder="Property title, e.g. 2 Bed House - Truro"
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm outline-none ring-emerald-300/30 placeholder:text-slate-500 focus:ring-4"
              />
              <input
                value={propertyLocation}
                onChange={(event) => setPropertyLocation(event.target.value)}
                placeholder="Location"
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm outline-none ring-emerald-300/30 placeholder:text-slate-500 focus:ring-4"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={propertyRent}
                  onChange={(event) => setPropertyRent(event.target.value)}
                  type="number"
                  min="0"
                  placeholder="Monthly rent"
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm outline-none ring-emerald-300/30 placeholder:text-slate-500 focus:ring-4"
                />
                <input
                  value={propertyDeposit}
                  onChange={(event) => setPropertyDeposit(event.target.value)}
                  type="number"
                  min="0"
                  placeholder="Deposit"
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm outline-none ring-emerald-300/30 placeholder:text-slate-500 focus:ring-4"
                />
              </div>
              <input
                value={propertyLink}
                onChange={(event) => setPropertyLink(event.target.value)}
                placeholder="Rightmove, Zoopla, OpenRent or agent link"
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm outline-none ring-emerald-300/30 placeholder:text-slate-500 focus:ring-4"
              />
              <input
                value={propertyImageUrl}
                onChange={(event) => setPropertyImageUrl(event.target.value)}
                placeholder="Image URL for preview"
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm outline-none ring-emerald-300/30 placeholder:text-slate-500 focus:ring-4"
              />
              <button
                onClick={addProperty}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:scale-[1.02]"
              >
                <Plus size={18} /> Add property
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-black/20 backdrop-blur-xl">
          <h2 className="text-xl font-bold">Cornwall Property Watchlist</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {properties.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-400 lg:col-span-2">
                No properties added yet. Add properties you and Dannie are interested in.
              </div>
            )}

            {properties.map((property) => (
              <div key={property.id || `${property.title}-${property.location}`} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05]">
                {property.image_url ? (
                  <img
                    src={property.image_url}
                    alt={property.title}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950/40 text-sm text-slate-400">
                    No image preview added
                  </div>
                )}

                <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold">{property.title}</h3>
                    <p className="text-sm text-slate-400">{property.location}</p>
                  </div>
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                    {property.status}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-white/[0.06] p-3">
                    <p className="text-slate-400">Monthly rent</p>
                    <p className="font-bold">{formatGBP(Number(property.rent))}</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.06] p-3">
                    <p className="text-slate-400">Deposit</p>
                    <p className="font-bold">{formatGBP(Number(property.deposit))}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <select
                    value={property.status}
                    onChange={(event) => updatePropertyStatus(property.id, event.target.value)}
                    className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none ring-emerald-300/30 focus:ring-4"
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
                    className="rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-100 transition hover:scale-[1.02] hover:border-red-300/40"
                  >
                    Delete
                  </button>
                </div>

                {property.link && (
                  <a
                    href={property.link}
                    target="_blank"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-cyan-100"
                  >
                    <LinkIcon size={16} /> Open listing
                  </a>
                )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-bold">Furniture & Appliance Planner</h2>
              <p className="mt-1 text-sm text-slate-400">
                Add everything you need for the move and track estimated costs.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm font-bold text-emerald-100">
              Total estimate: {formatGBP(plannerItems.reduce((sum, item) => sum + Number(item.estimate), 0))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_160px_140px_auto]">
            <input
              value={plannerItemName}
              onChange={(event) => setPlannerItemName(event.target.value)}
              placeholder="Item name, e.g. Sofa, TV, Kettle"
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm outline-none ring-emerald-300/30 placeholder:text-slate-500 focus:ring-4"
            />

            <select
              value={plannerItemCategory}
              onChange={(event) => setPlannerItemCategory(event.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none ring-emerald-300/30 focus:ring-4"
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
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm outline-none ring-emerald-300/30 placeholder:text-slate-500 focus:ring-4"
            />

            <select
              value={plannerItemPriority}
              onChange={(event) => setPlannerItemPriority(event.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none ring-emerald-300/30 focus:ring-4"
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>

            <button
              onClick={addPlannerItem}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:scale-[1.02]"
            >
              <Plus size={18} /> Add item
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {plannerItems.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-400 md:col-span-2 lg:col-span-4">
                No furniture or appliance items added yet.
              </div>
            )}

            {plannerItems.map((plannerItem) => (
              <div key={plannerItem.id} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <Sofa className="text-emerald-300" />
                <h3 className="mt-3 font-bold">{plannerItem.item}</h3>
                <p className="text-sm text-slate-400">{plannerItem.category}</p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="font-bold">{formatGBP(Number(plannerItem.estimate))}</p>
                  <span className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-semibold text-slate-200">
                    {plannerItem.priority}
                  </span>
                </div>
                <button
                  onClick={() => deletePlannerItem(plannerItem.id)}
                  className="mt-4 w-full rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-100 transition hover:scale-[1.02] hover:border-red-300/40"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
