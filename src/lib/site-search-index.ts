import type { IconName } from "@/components/ui/Icon";

export interface SearchEntry {
  title: string;
  description: string;
  href: string;
  icon: IconName;
  keywords: string[];
}

/** Static index for the Cmd+K search — small site, no need for a real search backend. */
export const SITE_SEARCH_INDEX: SearchEntry[] = [
  { title: "Home", description: "Start a game or find one in progress", href: "/", icon: "mask", keywords: ["home", "start"] },
  { title: "Play local", description: "Pass-and-play on one device", href: "/local/setup", icon: "dice", keywords: ["local", "offline", "pass and play", "setup"] },
  { title: "Online rooms", description: "Browse or create an online room", href: "/rooms", icon: "chair", keywords: ["online", "multiplayer", "rooms", "lobby"] },
  { title: "Leaderboard", description: "Top players and win rates", href: "/leaderboard", icon: "trophy", keywords: ["leaderboard", "ranking", "stats", "wins"] },
  { title: "Premium", description: "Unlock exclusive topic packs", href: "/pricing", icon: "crown", keywords: ["premium", "pricing", "upgrade", "subscription", "billing"] },
  { title: "Your profile", description: "Edit your username, avatar, and bio", href: "/profile", icon: "shield", keywords: ["profile", "account", "avatar", "username", "bio", "settings"] },
  { title: "FAQ", description: "Answers to common questions", href: "/faq", icon: "chat", keywords: ["faq", "help", "questions", "how to play"] },
  { title: "Contact", description: "Send feedback or get support", href: "/contact", icon: "send", keywords: ["contact", "support", "feedback", "bug", "email"] },
  { title: "Terms of service", description: "The rules for using Impostor", href: "/terms", icon: "lock", keywords: ["terms", "tos", "legal", "rules"] },
  { title: "Privacy policy", description: "What data we collect and why", href: "/privacy", icon: "lock", keywords: ["privacy", "data", "legal"] },
  { title: "Cookie policy", description: "How we use cookies", href: "/cookies", icon: "lock", keywords: ["cookies", "tracking", "legal"] },
];
