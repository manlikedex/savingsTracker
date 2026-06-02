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
  CalendarDays,
  Trophy,
  Flame,
  BarChart3,
  Target,
  Star,
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

const cardClass =
  "relative overflow-hidden rounded-[2rem] border border-fuchsia-200/30 bg-white/[0.13] shadow-2xl shadow-fuchsia-950/30 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:border-pink-200/60 hover:shadow-[0_0_45px_rgba(244,114,182,0.35)]";

const innerCardClass =
  "relative overflow-hidden rounded-3xl border border-fuchsia-200/25 bg-white/[0.10] shadow-xl shadow-fuchsia-950/20 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-pink-200/60 hover:bg-white/[0.16] hover:shadow-[0_0_35px_rgba(244,114,182,0.28)]";

const inputClass =
  "rounded-2xl border border-fuchsia-200/25 bg-rose-950/60 px-4 py-2.5 text-sm text-white outline-none ring-fuchsia-300/30 placeholder:text-pink-100/45 focus:border-pink-200/60 focus:ring-4";

const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-200 via-pink-300 to-rose-300 px-5 py-2.5 text-sm font-black text-rose-950 shadow-[0_0_28px_rgba(244,114,182,0.45)] transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_0_48px_rgba(244,114,182,0.75)]";

const softButtonClass =
  "rounded-2xl border border-fuchsia-200/25 bg-white/[0.10] px-5 py-2.5 text-sm font-bold text-pink-50 shadow-lg shadow-fuchsia-950/20 transition-all duration-300 hover:scale-[1.03] hover:border-pink-200/60 hover:bg-white/[0.18]";

const glowLineClass =
  "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-200/80 to-transparent opacity-70";

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
        className="h-3 rounded-full bg-gradient-to-r from-pink-200 via-rose-300 to-red-300 shadow-[0_0_22px_rgba(251,113,133,0.55)] transition-all duration-500"
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function statusClass(status: string) {
  switch (status) {
    case "Interested":
      return "border-pink-300/40 bg-pink-300/20 text-pink-50";
    case "Viewing Booked":
      return "border-purple-300/40 bg-purple-300/20 text-purple-50";
    case "Applied":
      return "border-emerald-300/40 bg-emerald-300/20 text-emerald-50";
    case "Rejected":
      return "border-red-300/40 bg-red-300/20 text-red-50";
    case "No Longer Interested":
      return "border-slate-300/25 bg-slate-300/10 text-slate-100";
    default:
      return "border-rose-300/40 bg-rose-300/20 text-rose-50";
  }
}

function getPropertyScore(property: Property) {
  let score = 35;

  if (property.image_url) score += 15;
  if (property.link) score += 10;
  if (property.rent > 0 && property.rent <= 900) score += 20;
  if (property.rent > 900 && property.rent <= 1200) score += 14;
  if (property.deposit > 0 && property.deposit <= property.rent * 1.2) score += 10;

  if (property.status === "Interested") score += 8;
  if (property.status === "Viewing Booked") score += 15;
  if (property.status === "Applied") score += 20;
  if (property.status === "Rejected" || property.status === "No Longer Interested") score -= 25;

  return Math.max(0, Math.min(score, 100));
}

function formatFutureMonth(monthsFromNow: number) {
  if (!monthsFromNow || monthsFromNow <= 0) return "Set monthly target";

  const date = new Date();
  date.setMonth(date.getMonth() + monthsFromNow);

  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(date);
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
  const [savingsStreak, setSavingsStreak] = useState(0);

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
    const savedSavingsStreak = localStorage.getItem("savingsStreak");

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

    if (savedSavingsStreak) {
      setSavingsStreak(Number(savedSavingsStreak));
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

  const predictedMoveInDate = formatFutureMonth(totals.monthsToGoal);
  const bestProperty = properties.length > 0
    ? properties.reduce((best, property) =>
        getPropertyScore(property) > getPropertyScore(best) ? property : best
      )
    : null;
  const monthlyProjection = Array.from({ length: 6 }, (_, index) => ({
    month: index === 0 ? "Now" : `M${index}`,
    amount: totals.totalSaved + jointMonthlyTarget * index,
  }));
  const maxProjection = Math.max(...monthlyProjection.map((item) => item.amount), 1);
  const achievements = [
    { title: "First saving", detail: "Add your first contribution", unlocked: totals.totalSaved > 0, icon: PiggyBank },
    { title: "Monthly plan", detail: "Set a joint monthly target", unlocked: jointMonthlyTarget > 0, icon: Target },
    { title: "Home hunters", detail: "Add a property listing", unlocked: properties.length > 0, icon: Building2 },
    { title: "Nest builders", detail: "Add 3 planner items", unlocked: plannerItems.length >= 3, icon: Sofa },
    { title: "Halfway home", detail: "Reach 50% progress", unlocked: totals.progress >= 50, icon: Trophy },
    { title: "Savings streak", detail: "Keep saving consistently", unlocked: savingsStreak > 0, icon: Flame },
  ];

  function updateSavingsStreak() {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const lastSavedDate = localStorage.getItem("lastSavingsDate");
    const currentStreak = Number(localStorage.getItem("savingsStreak") || "0");

    let nextStreak = currentStreak;

    if (lastSavedDate === today) {
      nextStreak = Math.max(currentStreak, 1);
    } else if (lastSavedDate === yesterday) {
      nextStreak = currentStreak + 1;
    } else {
      nextStreak = 1;
    }

    localStorage.setItem("lastSavingsDate", today);
    localStorage.setItem("savingsStreak", String(nextStreak));
    setSavingsStreak(nextStreak);

    return nextStreak;
  }

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

    sendNotification(
      "Monthly target updated",
      `Jordan and Dannie's joint monthly saving target is now ${formatGBP(target)}.`
    );
    sendMotivation();
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

    const nextStreak = updateSavingsStreak();

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

    if (nextStreak >= 2) {
      await sendNotification(
        "Savings streak 🔥",
        `You're on a ${nextStreak}-day savings streak. Keep the home dream moving.`
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
      `${goal.name} target is now ${formatGBP(newTarget)}.`
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
      "New item added",
      `${newItem.item} has been added to the ${newItem.category} planner.`
    );
  }

  function deletePlannerItem(id: string) {
    const removedItem = plannerItems.find((item) => item.id === id);
    const updatedItems = plannerItems.filter((item) => item.id !== id);
    setPlannerItems(updatedItems);
    localStorage.setItem("plannerItems", JSON.stringify(updatedItems));
    setMessage("Planner item removed.");

    if (removedItem) {
      sendNotification(
        "Planner item removed",
        `${removedItem.item} has been removed from the move-in planner.`
      );
    }
  }

  async function updatePropertyStatus(
    propertyId: string | undefined,
    status: string
  ) {
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

    const changedProperty = properties.find((property) => property.id === propertyId);
    await sendNotification(
      "Property status updated",
      `${changedProperty?.title || "A property"} is now marked as ${status}.`
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
    const messages = [
      "Small steps every week get you closer to your own place.",
      "Keep going — every pound saved gets you closer to moving in.",
      "You and Dannie are building something together. Stay consistent.",
      "Future you will be glad you kept saving today.",
      "Every update is progress. Keep the momentum going.",
      "Love, plans, and consistency — that is how the dream becomes real.",
      "Your first home starts with one smart choice at a time.",
      "Every contribution is another brick in your future home.",
      "You are not just saving money — you are building a life together.",
      "Tiny deposits become big milestones when you keep showing up.",
      "One day this tracker will be a memory from before you moved in.",
      "The sofa, the keys, the first takeaway on the floor — keep going.",
      "Cornwall move-in mission is still alive. Stay focused.",
      "Your future home is getting closer than it feels today.",
      "Consistency beats big one-off saves. Keep the rhythm going.",
      "You two have a plan. That already puts you ahead.",
      "Another step closer to unlocking the front door together.",
      "Keep saving now so moving day feels lighter later.",
      "The little wins count. Log them and celebrate them.",
      "Future Jordan and Dannie are going to thank you for this.",
      "One shared goal. One future home. Keep pushing.",
      "Every pound has a purpose now.",
      "The dream is not far away — it just needs consistency.",
      "You are turning a plan into a place.",
    ];

    const randomMessage =
      messages[Math.floor(Math.random() * messages.length)];

    await sendNotification("Keep going 💪", randomMessage);
    setMessage("Motivation sent.");
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
      "New property added",
      `${propertyTitle} has been added to the Cornwall watchlist at ${formatGBP(rent)} per month.`
    );
    await sendMotivation();
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#21001f] p-4 text-white sm:p-6">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(236,72,153,0.55),transparent_30%),radial-gradient(circle_at_top_right,rgba(217,70,239,0.36),transparent_28%),radial-gradient(circle_at_bottom,rgba(251,113,133,0.42),transparent_42%),linear-gradient(135deg,#21001f_0%,#701a75_40%,#e11d48_100%)]" />
      <div className="fixed left-1/2 top-0 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-pink-300/20 blur-3xl" />
      <div className="pointer-events-none fixed left-8 top-24 -z-10 text-8xl text-pink-200/10">
        ❤
      </div>
      <div className="pointer-events-none fixed bottom-24 right-8 -z-10 text-9xl text-rose-200/10">
        ❤
      </div>

      {!activeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-rose-950/80 p-6 backdrop-blur-2xl">
          <div className="relative w-full max-w-md overflow-hidden rounded-[2.25rem] border border-pink-200/20 bg-white/[0.11] p-7 text-center shadow-2xl shadow-rose-950/50 backdrop-blur-2xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pink-200 via-rose-300 to-red-300" />
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-pink-200 via-rose-300 to-red-300 text-rose-950 shadow-[0_0_35px_rgba(244,114,182,0.45)]">
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

          <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-pink-200/20 bg-white/[0.11] p-8 text-center shadow-2xl shadow-rose-950/60 backdrop-blur-2xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pink-200 via-rose-300 to-red-300" />

            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-pink-200 via-rose-300 to-red-300 text-rose-950 shadow-[0_0_45px_rgba(244,114,182,0.45)]">
              <Heart size={42} fill="currentColor" />
            </div>

            <p className="mt-7 text-sm font-bold uppercase tracking-[0.35em] text-pink-100/80">
              Welcome back
            </p>
            <h2 className="mt-3 bg-gradient-to-r from-pink-100 via-white to-rose-100 bg-clip-text text-6xl font-black tracking-tight text-transparent">
              {activeUser}
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-pink-50/70">
              Your shared Cornwall home savings journey is ready.
            </p>

            <div className="mx-auto mt-7 h-2 w-44 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-pink-200 via-rose-300 to-red-300" />
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-6 pb-24 md:pb-6">
        <header className={`${cardClass} p-6 md:p-8`}>
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-200/25 bg-pink-200/10 px-4 py-2 text-sm font-bold text-pink-50">
                <Heart size={16} fill="currentColor" /> Jordan & Dannie’s future home
              </div>
              <h1 className="mt-5 max-w-4xl bg-gradient-to-r from-pink-100 via-white to-rose-100 bg-clip-text text-4xl font-black tracking-tight text-transparent md:text-6xl">
                Building Our First Home Together
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-pink-50/70">
                A shared place to track savings, Cornwall rentals, furniture,
                appliances, and every little step towards moving in together.
              </p>
            </div>

            <button onClick={switchUser} className={softButtonClass}>
              Switch user
            </button>
          </div>
        </header>

        {(isLoading || message) && (
          <div className="rounded-3xl border border-pink-200/20 bg-white/[0.10] p-4 text-sm font-medium text-pink-50 shadow-xl shadow-rose-950/20 backdrop-blur-xl">
            {isLoading ? "Loading your saved data..." : message}
          </div>
        )}

        <nav className="sticky top-3 z-30 rounded-[1.5rem] border border-fuchsia-200/25 bg-rose-950/70 p-2 shadow-2xl shadow-fuchsia-950/35 backdrop-blur-2xl">
          <div className="grid grid-cols-3 gap-1 text-center text-xs font-black text-pink-50/75 sm:grid-cols-6">
            <a href="#overview" className="rounded-2xl px-3 py-2 transition hover:bg-white/12 hover:text-white">Overview</a>
            <a href="#savings" className="rounded-2xl px-3 py-2 transition hover:bg-white/12 hover:text-white">Savings</a>
            <a href="#properties" className="rounded-2xl px-3 py-2 transition hover:bg-white/12 hover:text-white">Properties</a>
            <a href="#planner" className="rounded-2xl px-3 py-2 transition hover:bg-white/12 hover:text-white">Planner</a>
            <a href="#insights" className="rounded-2xl px-3 py-2 transition hover:bg-white/12 hover:text-white">Insights</a>
            <a href="#achievements" className="rounded-2xl px-3 py-2 transition hover:bg-white/12 hover:text-white">Wins</a>
          </div>
        </nav>

        <section id="overview" className="grid gap-4 md:grid-cols-4">
          <div className={`${innerCardClass} p-5`}>
            <div className="flex items-center gap-3 text-pink-50/75">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-300/15">
                <PiggyBank className="text-pink-100" />
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
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-300/15">
                <WalletCards className="text-pink-100" />
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


        <section id="insights" className="grid gap-6 lg:grid-cols-3">
          <div className={`${cardClass} p-6`}>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-300/15">
                <CalendarDays className="text-fuchsia-100" />
              </div>
              <div>
                <p className="text-sm font-bold text-pink-50/55">Predicted move-in</p>
                <h2 className="mt-1 text-2xl font-black">{predictedMoveInDate}</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-pink-50/60">
              Based on your current remaining amount and monthly target.
            </p>
          </div>

          <div className={`${cardClass} p-6`}>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-300/15">
                <Flame className="text-orange-100" />
              </div>
              <div>
                <p className="text-sm font-bold text-pink-50/55">Savings streak</p>
                <h2 className="mt-1 text-2xl font-black">{savingsStreak} days</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-pink-50/60">
              Add savings on consecutive days to build the streak.
            </p>
          </div>

          <div className={`${cardClass} p-6`}>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-300/15">
                <Star className="text-yellow-100" />
              </div>
              <div>
                <p className="text-sm font-bold text-pink-50/55">Best property score</p>
                <h2 className="mt-1 text-2xl font-black">
                  {bestProperty ? `${getPropertyScore(bestProperty)} / 100` : "Add property"}
                </h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-pink-50/60">
              {bestProperty ? bestProperty.title : "Scores improve with images, links, status and affordability."}
            </p>
          </div>
        </section>

        <section className={`${cardClass} p-6`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-300/15">
              <BarChart3 className="text-pink-100" />
            </div>
            <div>
              <h2 className="text-xl font-black">6-month savings projection</h2>
              <p className="mt-1 text-sm text-pink-50/60">
                A simple forecast using your current saved amount and monthly target.
              </p>
            </div>
          </div>

          <div className="mt-6 flex h-48 items-end gap-3 rounded-3xl border border-pink-200/15 bg-white/[0.06] p-4">
            {monthlyProjection.map((item) => (
              <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
                <div className="text-[10px] font-bold text-pink-50/55">
                  {formatGBP(item.amount)}
                </div>
                <div
                  className="w-full rounded-t-2xl bg-gradient-to-t from-rose-400 via-pink-300 to-fuchsia-200 shadow-[0_0_24px_rgba(244,114,182,0.35)] transition-all duration-500"
                  style={{ height: `${Math.max((item.amount / maxProjection) * 100, 8)}%` }}
                />
                <div className="text-xs font-black text-pink-50/65">{item.month}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={`${cardClass} p-6`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-300/15">
              <Bell className="text-pink-100" />
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
              className="rounded-2xl border border-pink-200/20 bg-pink-200/10 px-5 py-2.5 text-sm font-bold text-pink-50 transition-all duration-300 hover:scale-[1.03] hover:bg-pink-200/15"
            >
              Send motivation
            </button>
          </div>
        </section>

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

        <section className="grid gap-6 lg:grid-cols-2">
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
                    className="rounded-3xl border border-pink-200/15 bg-white/[0.07] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-black">{goal.name}</p>
                        <p className="text-sm text-pink-50/55">
                          {formatGBP(Number(goal.saved))} saved of{" "}
                          {formatGBP(Number(goal.target))}
                        </p>
                      </div>
                      <p className="font-black text-pink-100">{goalProgress}%</p>
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
            <h2 className="text-xl font-black">Add Property</h2>
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

        <section id="properties" className={`${cardClass} p-6`}>
          <h2 className="text-xl font-black">Cornwall Property Watchlist</h2>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {properties.length === 0 && (
              <div className="rounded-3xl border border-pink-200/15 bg-white/[0.07] p-5 text-sm text-pink-50/60 lg:col-span-2">
                No properties added yet. Add properties you and Dannie are interested in.
              </div>
            )}

            {properties.map((property) => (
              <div
                key={property.id || `${property.title}-${property.location}`}
                className="overflow-hidden rounded-[2rem] border border-pink-200/15 bg-white/[0.08] shadow-xl shadow-rose-950/25 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.12] hover:shadow-2xl"
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
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(
                          property.status
                        )}`}
                      >
                        {property.status}
                      </span>
                      <span className="rounded-full border border-fuchsia-200/25 bg-fuchsia-200/10 px-3 py-1 text-xs font-black text-fuchsia-50">
                        Score {getPropertyScore(property)}/100
                      </span>
                    </div>
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
                      className="mt-4 inline-flex items-center gap-2 text-sm font-black text-pink-100 hover:text-white"
                    >
                      <LinkIcon size={16} /> Open listing
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="planner" className={`${cardClass} p-6`}>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-black">Furniture & Appliance Planner</h2>
              <p className="mt-1 text-sm text-pink-50/60">
                Add everything you need for the move and track estimated costs.
              </p>
            </div>
            <div className="rounded-2xl border border-pink-200/20 bg-pink-200/10 px-4 py-3 text-sm font-black text-pink-50">
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
              <div className="rounded-3xl border border-pink-200/15 bg-white/[0.07] p-5 text-sm text-pink-50/60 md:col-span-2 lg:col-span-4">
                No furniture or appliance items added yet.
              </div>
            )}

            {plannerItems.map((plannerItem) => {
              const Icon =
                plannerItem.category === "Appliance" ? WashingMachine : Sofa;

              return (
                <div
                  key={plannerItem.id}
                  className="rounded-3xl border border-pink-200/15 bg-white/[0.08] p-4 shadow-xl shadow-rose-950/20 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.12]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-300/15">
                    <Icon className="text-pink-100" />
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


        <section id="achievements" className={`${cardClass} p-6`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-300/15">
              <Trophy className="text-yellow-100" />
            </div>
            <div>
              <h2 className="text-xl font-black">Couple achievements</h2>
              <p className="mt-1 text-sm text-pink-50/60">
                Little milestones that make the whole journey feel more exciting.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement) => {
              const AchievementIcon = achievement.icon;

              return (
                <div
                  key={achievement.title}
                  className={`rounded-3xl border p-4 transition-all duration-300 ${
                    achievement.unlocked
                      ? "border-yellow-200/35 bg-yellow-200/12 shadow-[0_0_28px_rgba(253,224,71,0.18)]"
                      : "border-pink-200/15 bg-white/[0.06] opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.10]">
                      <AchievementIcon className={achievement.unlocked ? "text-yellow-100" : "text-pink-50/50"} />
                    </div>
                    <span className="rounded-full bg-white/[0.10] px-3 py-1 text-xs font-black text-pink-50/70">
                      {achievement.unlocked ? "Unlocked" : "Locked"}
                    </span>
                  </div>
                  <h3 className="mt-4 font-black">{achievement.title}</h3>
                  <p className="mt-1 text-sm text-pink-50/60">{achievement.detail}</p>
                </div>
              );
            })}
          </div>
        </section>

        <nav className="fixed inset-x-4 bottom-4 z-40 rounded-[1.6rem] border border-pink-200/20 bg-rose-950/80 p-2 shadow-2xl shadow-rose-950/60 backdrop-blur-2xl md:hidden">
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