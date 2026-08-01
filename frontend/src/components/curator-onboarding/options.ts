import {
  AudioLines,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  CalendarDays,
  Compass,
  Dumbbell,
  Film,
  HeartPulse,
  Lightbulb,
  MessageCircle,
  Moon,
  NotebookPen,
  Palette,
  Rocket,
  Sparkles,
  Sun,
  Target,
  Video,
  Zap,
} from "lucide-react";

import type { CuratorStepId } from "@/components/curator-onboarding/types";

export const curatorSteps: {
  id: CuratorStepId;
  title: string;
  description: string;
}[] = [
  {
    id: 1,
    title: "Basic Identity",
    description: "Start with the essentials Curator should remember.",
  },
  {
    id: 2,
    title: "Interests & Curiosity",
    description: "Choose the areas that naturally pull your attention.",
  },
  {
    id: 3,
    title: "Future Identity & Aspirations",
    description: "Define the version of yourself you are practicing toward.",
  },
  {
    id: 4,
    title: "Time Availability & Habits",
    description: "Set a rhythm that can survive real life.",
  },
  {
    id: 5,
    title: "Preferred Content Types",
    description: "Tell Curator how you like to explore ideas.",
  },
  {
    id: 6,
    title: "Coach Personality & Communication Style",
    description: "Shape how your coach should show up.",
  },
];

export const interestOptions = [
  { label: "Career Growth", icon: BriefcaseBusiness },
  { label: "Creative Practice", icon: Palette },
  { label: "Health & Energy", icon: HeartPulse },
  { label: "Personal Finance", icon: Target },
  { label: "Relationships", icon: MessageCircle },
  { label: "Mindset", icon: Brain },
  { label: "Fitness", icon: Dumbbell },
  { label: "Exploration", icon: Compass },
];

export const horizonOptions = ["30 days", "90 days", "6 months", "1 year"];

export const dayOptions = [
  { label: "Mornings", icon: Sun },
  { label: "Afternoons", icon: Lightbulb },
  { label: "Evenings", icon: Moon },
  { label: "Weekends", icon: CalendarDays },
];

export const contentTypeOptions = [
  { label: "Short reads", icon: BookOpen },
  { label: "Videos", icon: Video },
  { label: "Podcasts", icon: AudioLines },
  { label: "Exercises", icon: NotebookPen },
  { label: "Visual guides", icon: Film },
  { label: "Experiments", icon: Rocket },
];

export const depthOptions = ["Light", "Balanced", "Deep"];

export const coachPersonalityOptions = [
  { label: "Calm", icon: Sparkles },
  { label: "Direct", icon: Zap },
  { label: "Encouraging", icon: HeartPulse },
  { label: "Strategic", icon: Target },
];

export const communicationOptions = [
  "Concise check-ins",
  "Reflective questions",
  "Step-by-step guidance",
  "Challenge me gently",
];

export const frequencyOptions = ["Daily", "Every few days", "Weekly"];
