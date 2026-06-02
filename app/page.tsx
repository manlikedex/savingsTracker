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
  Trophy,
  CalendarHeart,
  Target,
  ClipboardList,
  Gift,
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

type AppSection =
  | "overview"
  | "savings"
  | "properties"
  | "planner"
  | "achievements"
  | "notifications";

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
  "relative overflow-hidden rounded-[2rem] border border-fuchsia-200/25 bg-white/[0.11] shadow-2xl shadow-fuchsia-950/30 backdrop-blur-2xl";

const glowCardClass =
  "relative overflow-hidden rounded-[2rem] border border-fuchsia-200/25 bg-white/[0.10] shadow-2xl shadow-fuchsia-950/30 backdrop-blur-2xl before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-r before:from-pink-400/25 before:via-fuchsia-300/10 before:to-red-300/25 before:opacity-80";

const innerCardClass =
  "rounded-3xl border border-fuchsia-100/20 bg-white/[0.08] shadow-xl shadow-fuchsia-950/20 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-pink-200/35 hover:bg-white/[0.13] hover:shadow-2xl";

const inputClass =
  "rounded-2xl border border-pink-100/20 bg-fuchsia-950/55 px-4 py-2.5 text-sm text-white outline-none ring-pink-300/30 placeholder:text-pink-100/45 focus:ring-4";

const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-200 via-fuchsia-300 to-rose-300 px-5 py-2.5 text-sm font-black text-fuchsia-950 shadow-[0_0_30px_rgba(244,114,182,0.42)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_48px_rgba(244,114,182,0.62)]";

const softButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-pink-200/25 bg-white/[0.09] px-5 py-2.5 text-sm font-bold text-pink-50 shadow-lg shadow-fuchsia-950/20 transition-all duration-300 hover:scale-[1.03] hover:bg-white/[0.16]";

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
        className="h-3 rounded-full bg-gradient-to-r from-pink-200 via-fuchsia-300 to-rose-300 shadow-[0_0_24px_rgba(244,114,182,0.65)] transition-all duration-500"
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function statusClass(status: string) {
  switch (status) {
    case "Interested":
      return "border-pink-300/35 bg-pink-300/15 text-pink-100";
    case "Viewing Booked":
      return "border-purple-300/35 bg-purple-300/15 text-purple-100";
    case "Applied":
      return "border-emerald-300/35 bg-emerald-300/15 text-emerald-100";
    case "Rejected":
      return "border-red-300/35 bg-red-300/15 text-red-100";
    case "No Longer Interested":
      return "border-slate-300/25 bg-slate-300/10 text-slate-200";
    default:
      return "border-rose-300/35 bg-rose-300/15 text-rose-100";
  }
}

function propertyScore(property: Property) {
  let score = 40;

  if (property.image_url) score += 10;
  if (property.link) score += 10;
  if (Number(property.rent) > 0 && Number(property.rent) <= 950) score += 15;
  if (Number(property.deposit) > 0 && Number(property.deposit) <= 1200) score += 10;

  if (property.status === "Interested") score += 10;
  if (property.status === "Viewing Booked") score += 20;
  if (property.status === "Applied") score += 25;
  if (property.status === "Rejected" || property.status === "No Longer Interested") score -= 25;

  return Math.max(0, Math.min(score, 100));
}

export default function HomePage() {
  const [activeSection, setActiveSection] = useState<AppSection>("overview");
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
    const savedSection = localStorage.getItem("activeSection") as AppSection | null;

    if (savedSection) {
      setActiveSection(savedSection);
    }

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

  function openSection(section: AppSection) {
    setActiveSection(section);
    localStorage.setItem("activeSection", section);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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

    const predictedDate = new Date();
    predictedDate.setMonth(predictedDate.getMonth() + monthsToGoal);

    return {
      totalTarget,
      totalSaved,
      progress,
      remaining,
      monthsToGoal,
      predictedDate:
        monthsToGoal > 0
          ? predictedDate.toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })
          : "Set target",
    };
  }, [savingsGoals, jointMonthlyTarget]);

  const partnerTotal = partners.reduce(
    (sum, partner) => sum + Number(partner.saved),
    0
  );

  const plannerTotal = plannerItems.reduce(
    (sum, item) => sum + Number(item.estimate),
    0
  );

  const bestProperty = properties
    .slice()
    .sort((a, b) => propertyScore(b) - propertyScore(a))[0];

  const savingsStreak = Math.min(
    30,
    Math.max(0, Math.ceil(totals.totalSaved / 50))
  );

  const achievementList = [
    {
      title: "Started the journey",
      text: "Opened your shared home savings tracker.",
      done: true,
    },
    {
      title: "First saving added",
      text: "Add your first contribution together.",
      done: totals.totalSaved > 0,
    },
    {
      title: "First property saved",
      text: "Add a Cornwall property to the watchlist.",
      done: properties.length > 0,
    },
    {
      title: "Planner started",
      text: "Add furniture or appliances for the move.",
      done: plannerItems.length > 0,
    },
    {
      title: "25% milestone",
      text: "Reach 25% of the total move-in target.",
      done: totals.progress >= 25,
    },
    {
      title: "Halfway home",
      text: "Reach 50% of the total move-in target.",
      done: totals.progress >= 50,
    },
    {
      title: "Almost there",
      text: "Reach 75% of the total move-in target.",
      done: totals.progress >= 75,
    },
    {
      title: "Move-in ready",
      text: "Reach 100% of the total move-in target.",
      done: totals.progress >= 100,
    },
  ];

  const monthlyProjection = useMemo(() => {
    const rows = [];
    for (let i = 0; i <= 5; i++) {
      rows.push({
        month: i === 0 ? "Now" : `+${i}m`,
        amount: totals.totalSaved + jointMonthlyTarget * i,
      });
    }
    return rows;
  }, [totals.totalSaved, jointMonthlyTarget]);

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
      `Your joint monthly saving target is now ${formatGBP(target)}.`
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
      "Savings target updated",
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
      "New planner item added",
      `${newItem.item} has been added to the ${newItem.category} planner.`
    );

    sendMotivation();
  }

  function deletePlannerItem(id: string) {
    const itemToDelete = plannerItems.find((item) => item.id === id);
    const updatedItems = plannerItems.filter((item) => item.id !== id);
    setPlannerItems(updatedItems);
    localStorage.setItem("plannerItems", JSON.stringify(updatedItems));
    setMessage("Planner item removed.");

    sendNotification(
      "Planner item removed",
      `${itemToDelete?.item || "An item"} was removed from your move-in planner.`
    );
  }

  async function updatePropertyStatus(
    propertyId: string | undefined,
    status: string
  ) {
    if (!propertyId) return;

    const property = properties.find((item) => item.id === propertyId);

    const { error } = await supabase
      .from("properties")
      .update({ status })
      .eq("id", propertyId);

    if (error) {
      setMessage("Could not update property status.");
      return;
    }

    setProperties((currentProperties) =>
      currentProperties.map((currentProperty) =>
        currentProperty.id === propertyId
          ? { ...currentProperty, status }
          : currentProperty
      )
    );

    setMessage("Property status updated.");

    await sendNotification(
      "Property status updated",
      `${property?.title || "A property"} is now marked as ${status}.`
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

    await sendNotification(
      "Notifications enabled 💌",
      `${activeUser} enabled shared home saving updates.`
    );
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
      "One contribution at a time. One room at a time. One future together.",
      "The home you are dreaming about starts with the habits you are building now.",
      "You are not just saving money — you are building a shared life.",
      "Even small savings count when the goal is this important.",
      "Stay focused. The keys, the sofa, the first night in — it is all getting closer.",
      "Your future home is getting less imaginary every time you update this.",
      "A little progress today is still progress towards your first place.",
      "Teamwork makes the rent deposit easier.",
      "Keep showing up for the goal. You are closer than when you started.",
      "This is your reminder that consistency beats big one-off efforts.",
      "Every pound has a purpose.",
      "You are building the foundations before you even get the keys.",
      "The Cornwall chapter is loading.",
      "Future Jordan and Dannie are going to be proud of this.",
      "Keep pushing — the move-in day will be worth it.",
      "Savings today, home comforts tomorrow.",
      "You are turning plans into something real.",
      "The first home together is not just a dream. It is a project in progress.",
      "Another step closer to your own front door.",
      "You have got this. Keep the momentum alive.",
    ];

    const randomMessage =
      messages[Math.floor(Math.random() * messages.length)];

    await sendNotification("Keep going 💪", randomMessage);
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
      `${propertyTitle} has been added to the Cornwall watchlist.`
    );

    await sendNotification(
      "Property score ready",
      `${propertyTitle} has been scored so you can compare it against other listings.`
    );
  }

  const navigationItems: {
    id: AppSection;
    label: string;
    icon: typeof Home;
    short: string;
  }[] = [
    { id: "overview", label: "Overview", icon: Home, short: "Home" },
    { id: "savings", label: "Savings", icon: PiggyBank, short: "Save" },
    { id: "properties", label: "Properties", icon: Building2, short: "Homes" },
    { id: "planner", label: "Planner", icon: Sofa, short: "Items" },
    { id: "achievements", label: "Achievements", icon: Trophy, short: "Wins" },
    { id: "notifications", label: "Notifications", icon: Bell, short: "Alerts" },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#250516] p-4 text-white sm:p-6">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(255,89,165,0.55),transparent_30%),radial-gradient(circle_at_top_right,rgba(255,173,214,0.40),transparent_28%),radial-gradient(circle_at_bottom,rgba(225,29,72,0.42),transparent_42%),linear-gradient(135deg,#250516_0%,#6d1238_40%,#be185d_100%)]" />
      <div className="fixed left-1/2 top-0 -z-10 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-fuchsia-300/25 blur-3xl" />
      <div className="pointer-events-none fixed left-8 top-24 -z-10 text-8xl text-pink-200/10">
        ❤
      </div>
      <div className="pointer-events-none fixed bottom-24 right-8 -z-10 text-9xl text-rose-200/10">
        ❤
      </div>

      {!activeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-fuchsia-950/80 p-6 backdrop-blur-2xl">
          <div className="relative w-full max-w-md overflow-hidden rounded-[2.25rem] border border-pink-200/25 bg-white/[0.12] p-7 text-center shadow-2xl shadow-fuchsia-950/60 backdrop-blur-2xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pink-200 via-fuchsia-300 to-rose-300" />
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-pink-200 via-fuchsia-300 to-rose-300 text-fuchsia-950 shadow-[0_0_40px_rgba(244,114,182,0.55)]">
              <Heart size={30} fill="currentColor" />
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-tight">
              Who is checking in?
            </h2>
            <p className="mt-2 text-sm leading-6 text-pink-50/75">
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
                className={softButtonClass}
              >
                Dannie
              </button>
            </div>
          </div>
        </div>
      )}

      {showWelcome && activeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-fuchsia-950/85 p-6 backdrop-blur-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,89,165,0.38),transparent_28%),radial-gradient(circle_at_bottom,rgba(244,114,182,0.30),transparent_35%)]" />
          <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-300/25 blur-3xl" />

          <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-pink-200/25 bg-white/[0.12] p-8 text-center shadow-2xl shadow-fuchsia-950/70 backdrop-blur-2xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pink-200 via-fuchsia-300 to-rose-300" />

            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-pink-200 via-fuchsia-300 to-rose-300 text-fuchsia-950 shadow-[0_0_48px_rgba(244,114,182,0.55)]">
              <Heart size={42} fill="currentColor" />
            </div>

            <p className="mt-7 text-sm font-bold uppercase tracking-[0.35em] text-pink-100/85">
              Welcome back
            </p>
            <h2 className="mt-3 bg-gradient-to-r from-pink-100 via-white to-fuchsia-100 bg-clip-text text-6xl font-black tracking-tight text-transparent">
              {activeUser}
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-pink-50/75">
              Your shared Cornwall home savings journey is ready.
            </p>

            <div className="mx-auto mt-7 h-2 w-44 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-pink-200 via-fuchsia-300 to-rose-300" />
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-5 pb-24 md:pb-6">
        <header className={`${glowCardClass} p-5 md:p-7`}>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-200/25 bg-pink-200/10 px-4 py-2 text-sm font-bold text-pink-50">
                <Heart size={16} fill="currentColor" /> Jordan & Dannie’s future home
              </div>
              <h1 className="mt-4 max-w-4xl bg-gradient-to-r from-pink-100 via-white to-fuchsia-100 bg-clip-text text-4xl font-black tracking-tight text-transparent md:text-6xl">
                Building Our First Home Together
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-pink-50/75">
                A shared app for savings, Cornwall rentals, furniture,
                appliances, achievements and move-in planning.
              </p>
            </div>

            <button onClick={switchUser} className={softButtonClass}>
              Switch user
            </button>
          </div>
        </header>

        <div className="sticky top-3 z-30 rounded-[1.75rem] border border-pink-200/20 bg-fuchsia-950/70 p-2 shadow-2xl shadow-fuchsia-950/50 backdrop-blur-2xl">
          <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => openSection(item.id)}
                  className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-black transition-all duration-300 md:text-sm ${
                    active
                      ? "bg-gradient-to-r from-pink-200 via-fuchsia-300 to-rose-300 text-fuchsia-950 shadow-[0_0_30px_rgba(244,114,182,0.45)]"
                      : "bg-white/[0.06] text-pink-50/70 hover:bg-white/[0.12] hover:text-white"
                  }`}
                >
                  <Icon size={17} />
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.short}</span>
                </button>
              );
            })}
          </div>
        </div>

        {(isLoading || message) && (
          <div className="rounded-3xl border border-pink-200/20 bg-white/[0.10] p-4 text-sm font-medium text-pink-50 shadow-xl shadow-fuchsia-950/20 backdrop-blur-xl">
            {isLoading ? "Loading your saved data..." : message}
          </div>
        )}

        {activeSection === "overview" && (
          <section className="space-y-5">
            <div className="grid gap-4 md:grid-cols-4">
              <div className={`${innerCardClass} p-5`}>
                <div className="flex items-center gap-3 text-pink-50/80">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-300/15">
                    <PiggyBank className="text-pink-100" />
                  </div>
                  <p className="font-bold">Saved so far</p>
                </div>
                <p className="mt-5 text-4xl font-black">
                  {formatGBP(totals.totalSaved)}
                </p>
              </div>

              <div className={`${innerCardClass} p-5`}>
                <div className="flex items-center gap-3 text-pink-50/80">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-300/15">
                    <Target className="text-fuchsia-100" />
                  </div>
                  <p className="font-bold">Move-in target</p>
                </div>
                <p className="mt-5 text-4xl font-black">
                  {formatGBP(totals.totalTarget)}
                </p>
              </div>

              <div className={`${innerCardClass} p-5`}>
                <div className="flex items-center gap-3 text-pink-50/80">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-300/15">
                    <Home className="text-rose-100" />
                  </div>
                  <p className="font-bold">Remaining</p>
                </div>
                <p className="mt-5 text-4xl font-black">
                  {formatGBP(totals.remaining)}
                </p>
              </div>

              <div className={`${innerCardClass} p-5`}>
                <p className="font-bold text-pink-50/80">Together progress</p>
                <p className="mt-4 text-4xl font-black">{totals.progress}%</p>
                <div className="mt-4">
                  <ProgressBar value={totals.progress} />
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <div className={`${cardClass} p-6 lg:col-span-2`}>
                <div className="flex items-center gap-3">
                  <CalendarHeart className="text-pink-100" />
                  <h2 className="text-xl font-black">Move-in prediction</h2>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl bg-white/[0.08] p-4">
                    <p className="text-sm text-pink-50/55">Monthly target</p>
                    <p className="mt-2 text-2xl font-black">
                      {formatGBP(jointMonthlyTarget)}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white/[0.08] p-4">
                    <p className="text-sm text-pink-50/55">Estimated time</p>
                    <p className="mt-2 text-2xl font-black">
                      {totals.monthsToGoal > 0 ? `${totals.monthsToGoal} months` : "Set target"}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white/[0.08] p-4">
                    <p className="text-sm text-pink-50/55">Predicted date</p>
                    <p className="mt-2 text-2xl font-black">
                      {totals.predictedDate}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="mb-3 text-sm font-bold text-pink-50/65">
                    Six-month saving projection
                  </p>
                  <div className="grid grid-cols-6 items-end gap-2 rounded-3xl border border-pink-200/15 bg-white/[0.06] p-4">
                    {monthlyProjection.map((point) => {
                      const max = Math.max(
                        ...monthlyProjection.map((row) => row.amount),
                        1
                      );
                      const height = Math.max(12, Math.round((point.amount / max) * 100));

                      return (
                        <div key={point.month} className="flex flex-col items-center gap-2">
                          <div
                            className="w-full rounded-t-2xl bg-gradient-to-t from-pink-300 via-fuchsia-300 to-rose-200 shadow-[0_0_18px_rgba(244,114,182,0.45)]"
                            style={{ height: `${height}px` }}
                          />
                          <p className="text-[10px] font-bold text-pink-50/60">
                            {point.month}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className={`${cardClass} p-6`}>
                <div className="flex items-center gap-3">
                  <Building2 className="text-pink-100" />
                  <h2 className="text-xl font-black">Best property</h2>
                </div>
                {bestProperty ? (
                  <div className="mt-5">
                    <p className="text-2xl font-black">{bestProperty.title}</p>
                    <p className="mt-1 text-sm text-pink-50/55">
                      {bestProperty.location}
                    </p>
                    <div className="mt-5">
                      <div className="mb-2 flex justify-between text-sm font-bold text-pink-50/70">
                        <span>Property score</span>
                        <span>{propertyScore(bestProperty)}%</span>
                      </div>
                      <ProgressBar value={propertyScore(bestProperty)} />
                    </div>
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-pink-50/60">
                    Add properties to start comparing listings.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {activeSection === "savings" && (
          <section className="space-y-5">
            <div className={`${cardClass} p-6`}>
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
            </div>

            <div className="grid gap-4 md:grid-cols-3">
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
                  <Sparkles className="text-fuchsia-200" />
                </div>
                <p className="mt-4 text-3xl font-black">
                  {formatGBP(partnerTotal)}
                </p>
              </div>
            </div>

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
              <h2 className="text-xl font-black">Joint monthly target</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
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
          </section>
        )}

        {activeSection === "properties" && (
          <section className="space-y-5">
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

            <div className={`${cardClass} p-6`}>
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
                    className="overflow-hidden rounded-[2rem] border border-pink-200/15 bg-white/[0.08] shadow-xl shadow-fuchsia-950/25 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.12] hover:shadow-2xl"
                  >
                    {property.image_url ? (
                      <img
                        src={property.image_url}
                        alt={property.title}
                        className="h-52 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-52 w-full items-center justify-center bg-gradient-to-br from-fuchsia-950 via-pink-950 to-rose-950 text-sm text-pink-50/45">
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

                      <div className="mt-4">
                        <div className="mb-2 flex justify-between text-sm font-bold text-pink-50/70">
                          <span>Property score</span>
                          <span>{propertyScore(property)}%</span>
                        </div>
                        <ProgressBar value={propertyScore(property)} />
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
            </div>
          </section>
        )}

        {activeSection === "planner" && (
          <section className={`${cardClass} p-6`}>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-black">Furniture & Appliance Planner</h2>
                <p className="mt-1 text-sm text-pink-50/60">
                  Add everything you need for the move and track estimated costs.
                </p>
              </div>
              <div className="rounded-2xl border border-pink-200/20 bg-pink-200/10 px-4 py-3 text-sm font-black text-pink-50">
                Total estimate: {formatGBP(plannerTotal)}
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
                    className="rounded-3xl border border-pink-200/15 bg-white/[0.08] p-4 shadow-xl shadow-fuchsia-950/20 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.12]"
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
        )}

        {activeSection === "achievements" && (
          <section className="space-y-5">
            <div className={`${cardClass} p-6`}>
              <div className="flex items-center gap-3">
                <Trophy className="text-pink-100" />
                <h2 className="text-xl font-black">Couple Achievements</h2>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {achievementList.map((achievement) => (
                  <div
                    key={achievement.title}
                    className={`rounded-3xl border p-4 transition-all duration-300 ${
                      achievement.done
                        ? "border-pink-200/30 bg-pink-200/12"
                        : "border-white/10 bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                          achievement.done
                            ? "bg-gradient-to-r from-pink-200 via-fuchsia-300 to-rose-300 text-fuchsia-950"
                            : "bg-white/[0.08] text-pink-50/50"
                        }`}
                      >
                        {achievement.done ? <Trophy size={20} /> : <Gift size={20} />}
                      </div>
                      <div>
                        <h3 className="font-black">{achievement.title}</h3>
                        <p className="mt-1 text-sm text-pink-50/60">
                          {achievement.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div className={`${innerCardClass} p-5`}>
                <p className="text-sm font-bold text-pink-50/55">Savings streak</p>
                <p className="mt-3 text-4xl font-black">{savingsStreak} days</p>
                <p className="mt-2 text-sm text-pink-50/60">
                  Estimated from your total saved progress.
                </p>
              </div>

              <div className={`${innerCardClass} p-5`}>
                <p className="text-sm font-bold text-pink-50/55">Milestones</p>
                <p className="mt-3 text-4xl font-black">
                  {achievementList.filter((item) => item.done).length}/{achievementList.length}
                </p>
                <p className="mt-2 text-sm text-pink-50/60">
                  Shared wins unlocked so far.
                </p>
              </div>

              <div className={`${innerCardClass} p-5`}>
                <p className="text-sm font-bold text-pink-50/55">Home readiness</p>
                <p className="mt-3 text-4xl font-black">{totals.progress}%</p>
                <p className="mt-2 text-sm text-pink-50/60">
                  Based on your savings target.
                </p>
              </div>
            </div>
          </section>
        )}

        {activeSection === "notifications" && (
          <section className={`${cardClass} p-6`}>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-300/15">
                <Bell className="text-pink-100" />
              </div>
              <div>
                <h2 className="text-xl font-black">Notifications</h2>
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
                Motivate us
              </button>
            </div>

            <div className="mt-6 rounded-3xl border border-pink-200/15 bg-white/[0.06] p-5">
              <h3 className="font-black">Notification triggers</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {[
                  "When savings are added",
                  "When monthly target changes",
                  "When a savings target changes",
                  "When a new property is added",
                  "When a property status changes",
                  "When a property is removed",
                  "When planner items are added",
                  "When planner items are removed",
                  "When milestones are reached",
                  "When someone opens the tracker",
                  "Motivational nudges",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-pink-200/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-pink-50/75"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <nav className="fixed inset-x-4 bottom-4 z-40 rounded-[1.6rem] border border-pink-200/20 bg-fuchsia-950/85 p-2 shadow-2xl shadow-fuchsia-950/60 backdrop-blur-2xl md:hidden">
          <div className="grid grid-cols-6 gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => openSection(item.id)}
                  className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-black transition-all duration-300 ${
                    active
                      ? "bg-gradient-to-r from-pink-200 via-fuchsia-300 to-rose-300 text-fuchsia-950"
                      : "text-pink-50/65 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={17} />
                  {item.short}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </main>
  );
}
