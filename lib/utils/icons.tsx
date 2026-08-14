import { 
  ShoppingBag, 
  Gift, 
  Banknote, 
  Utensils, 
  Car, 
  ArrowLeftRight, 
  Sliders, 
  TrendingUp,
  TrendingDown,
  Tag,
  GraduationCap,
  HeartPulse,
  Home,
  Tv,
  Gamepad2,
  DollarSign
} from "lucide-react";
import type { ReactNode } from "react";

export type CategoryVisuals = {
  icon: ReactNode;
  bg: string;
  colorClass: string;
};

export function getCategoryVisuals(name: string, type: string): CategoryVisuals {
  const cleanName = (name || "").toLowerCase();
  
  if (type === "transfer") {
    return {
      icon: <ArrowLeftRight size={15} className="text-blue-600 dark:text-blue-400" />,
      bg: "bg-blue-50 dark:bg-blue-950/40",
      colorClass: "text-blue-600 dark:text-blue-400"
    };
  }
  
  if (type === "adjustment") {
    return {
      icon: <Sliders size={15} className="text-purple-600 dark:text-purple-400" />,
      bg: "bg-purple-50 dark:bg-purple-950/40",
      colorClass: "text-purple-600 dark:text-purple-400"
    };
  }

  // Common category mapping
  if (cleanName.includes("belanja") || cleanName.includes("kebutuhan") || cleanName.includes("shopping")) {
    return {
      icon: <ShoppingBag size={15} className="text-rose-600 dark:text-rose-400" />,
      bg: "bg-rose-50 dark:bg-rose-950/40",
      colorClass: "text-rose-600 dark:text-rose-400"
    };
  }
  if (cleanName.includes("bonus") || cleanName.includes("hadiah") || cleanName.includes("gift")) {
    return {
      icon: <Gift size={15} className="text-emerald-600 dark:text-emerald-400" />,
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      colorClass: "text-emerald-600 dark:text-emerald-400"
    };
  }
  if (cleanName.includes("gaji") || cleanName.includes("salary") || cleanName.includes("income") || cleanName.includes("upah")) {
    return {
      icon: <Banknote size={15} className="text-emerald-600 dark:text-emerald-400" />,
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      colorClass: "text-emerald-600 dark:text-emerald-400"
    };
  }
  if (cleanName.includes("makan") || cleanName.includes("restoran") || cleanName.includes("kopi") || cleanName.includes("food") || cleanName.includes("cafe")) {
    return {
      icon: <Utensils size={15} className="text-amber-600 dark:text-amber-400" />,
      bg: "bg-amber-50 dark:bg-amber-950/40",
      colorClass: "text-amber-600 dark:text-amber-400"
    };
  }
  if (cleanName.includes("transport") || cleanName.includes("bensin") || cleanName.includes("gojek") || cleanName.includes("grab") || cleanName.includes("car") || cleanName.includes("motor")) {
    return {
      icon: <Car size={15} className="text-sky-600 dark:text-sky-400" />,
      bg: "bg-sky-50 dark:bg-sky-950/40",
      colorClass: "text-sky-600 dark:text-sky-400"
    };
  }
  if (cleanName.includes("sekolah") || cleanName.includes("kuliah") || cleanName.includes("edukasi") || cleanName.includes("buku") || cleanName.includes("education")) {
    return {
      icon: <GraduationCap size={15} className="text-indigo-600 dark:text-indigo-400" />,
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
      colorClass: "text-indigo-600 dark:text-indigo-400"
    };
  }
  if (cleanName.includes("sehat") || cleanName.includes("obat") || cleanName.includes("dokter") || cleanName.includes("klinik") || cleanName.includes("health")) {
    return {
      icon: <HeartPulse size={15} className="text-red-600 dark:text-red-400" />,
      bg: "bg-red-50 dark:bg-red-950/40",
      colorClass: "text-red-600 dark:text-red-400"
    };
  }
  if (cleanName.includes("rumah") || cleanName.includes("kos") || cleanName.includes("listrik") || cleanName.includes("air") || cleanName.includes("home")) {
    return {
      icon: <Home size={15} className="text-teal-600 dark:text-teal-400" />,
      bg: "bg-teal-50 dark:bg-teal-950/40",
      colorClass: "text-teal-600 dark:text-teal-400"
    };
  }
  if (cleanName.includes("hiburan") || cleanName.includes("nonton") || cleanName.includes("netflix") || cleanName.includes("cinema") || cleanName.includes("entertainment")) {
    return {
      icon: <Tv size={15} className="text-violet-600 dark:text-violet-400" />,
      bg: "bg-violet-50 dark:bg-violet-950/40",
      colorClass: "text-violet-600 dark:text-violet-400"
    };
  }
  if (cleanName.includes("game") || cleanName.includes("main") || cleanName.includes("play")) {
    return {
      icon: <Gamepad2 size={15} className="text-fuchsia-600 dark:text-fuchsia-400" />,
      bg: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
      colorClass: "text-fuchsia-600 dark:text-fuchsia-400"
    };
  }
  if (cleanName.includes("investasi") || cleanName.includes("saham") || cleanName.includes("reksa") || cleanName.includes("crypto") || cleanName.includes("investment")) {
    return {
      icon: <DollarSign size={15} className="text-cyan-600 dark:text-cyan-400" />,
      bg: "bg-cyan-50 dark:bg-cyan-950/40",
      colorClass: "text-cyan-600 dark:text-cyan-400"
    };
  }

  // Fallback based on type
  if (type === "income") {
    return {
      icon: <TrendingUp size={15} className="text-emerald-600 dark:text-emerald-400" />,
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      colorClass: "text-emerald-600 dark:text-emerald-400"
    };
  }
  if (type === "expense") {
    return {
      icon: <TrendingDown size={15} className="text-rose-600 dark:text-rose-400" />,
      bg: "bg-rose-50 dark:bg-rose-950/40",
      colorClass: "text-rose-600 dark:text-rose-400"
    };
  }

  return {
    icon: <Tag size={15} className="text-slate-600 dark:text-slate-400" />,
    bg: "bg-slate-50 dark:bg-slate-800/40",
    colorClass: "text-slate-600 dark:text-slate-400"
  };
}
