import {
  AudioLines,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  Compass,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Lightbulb,
  Megaphone,
  MessageCircle,
  Moon,
  NotebookPen,
  Palette,
  PenLine,
  Rocket,
  Sparkles,
  Sun,
  Target,
  Users,
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
  { label: "AI", icon: Sparkles },
  { label: "Software Development", icon: Compass },
  { label: "Data Science", icon: ChartNoAxesCombined },
  { label: "Business", icon: BriefcaseBusiness },
  { label: "Entrepreneurship", icon: Rocket },
  { label: "Finance", icon: Target },
  { label: "Design", icon: Palette },
  { label: "Leadership", icon: Users },
  { label: "Productivity", icon: Zap },
  { label: "Health & Fitness", icon: Dumbbell },
  { label: "Communication", icon: MessageCircle },
  { label: "Psychology", icon: Brain },
  { label: "Writing", icon: PenLine },
  { label: "Public Speaking", icon: Megaphone },
];

export const ageOptions = [
  { label: "Under 18", value: "17" },
  { label: "18-24", value: "22" },
  { label: "25-34", value: "29" },
  { label: "35-44", value: "39" },
  { label: "45+", value: "45" },
];

export const professionOptions = [
  "Student",
  "Software Engineer",
  "Designer",
  "Product Manager",
  "Entrepreneur",
  "Marketing",
  "Finance",
  "Healthcare",
  "Educator",
  "Researcher",
  "Other",
];

export const curiosityGoalOptions = [
  "Learn a new skill",
  "Switch careers",
  "Become more productive",
  "Build better habits",
  "Stay updated in my field",
  "Start a business",
  "Improve communication",
  "Become a better leader",
];

export const futureIdentityOptions = [
  {
    label: "Technical Expert",
    value: "Technical Expert",
    aspiration: "Build deep expertise and apply it to meaningful work.",
  },
  {
    label: "Team Leader",
    value: "Team Leader",
    aspiration: "Lead people with clarity, consistency, and better decisions.",
  },
  {
    label: "Entrepreneur",
    value: "Entrepreneur",
    aspiration: "Create a useful business and learn through practical action.",
  },
  {
    label: "Creator",
    value: "Creator building a consistent body of work",
    aspiration: "Publish useful work consistently and improve through feedback.",
  },
  {
    label: "Researcher",
    value: "Researcher",
    aspiration: "Investigate important questions with depth and discipline.",
  },
  {
    label: "Lifelong Learner",
    value: "Lifelong Learner",
    aspiration: "Keep learning intentionally and turn curiosity into growth.",
  },
  {
    label: "Industry Specialist",
    value: "Industry Specialist",
    aspiration: "Develop recognized expertise in a focused professional area.",
  },
];

export const horizonOptions = ["1 Month", "3 Months", "6 Months", "1 Year", "3 Years"];

export const weeklyHourOptions = [
  { label: "2-3", value: 3 },
  { label: "4-6", value: 5 },
  { label: "7-10", value: 8 },
  { label: "10+", value: 12 },
];

export const dayOptions = [
  { label: "Morning", icon: Sun },
  { label: "Afternoon", icon: Lightbulb },
  { label: "Evening", icon: CalendarDays },
  { label: "Night", icon: Moon },
];

export const habitAnchorOptions = [
  "After Breakfast",
  "After Lunch",
  "After Dinner",
  "Before Bed",
  "During Commute",
  "During Work Break",
];

export const contentTypeOptions = [
  { label: "YouTube", icon: Video },
  { label: "Articles", icon: BookOpen },
  { label: "Books", icon: BookOpen },
  { label: "Podcasts", icon: AudioLines },
  { label: "Courses", icon: GraduationCap },
  { label: "Newsletters", icon: NotebookPen },
];

export const depthOptions = ["Beginner", "Balanced", "Advanced"];

export const coachPersonalityOptions = [
  { label: "Friendly", icon: MessageCircle },
  { label: "Motivational", icon: HeartPulse },
  { label: "Strict", icon: Target },
  { label: "Calm", icon: Sparkles },
  { label: "Analytical", icon: Brain },
];

export const communicationOptions = [
  "Short Check-ins",
  "Detailed Guidance",
  "Action-Oriented",
  "Encouraging",
];

export const frequencyOptions = ["Daily", "Every 3 Days", "Weekly"];
