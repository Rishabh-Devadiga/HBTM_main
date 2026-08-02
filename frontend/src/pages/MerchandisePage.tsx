import {
  Award,
  Bookmark,
  Briefcase,
  Check,
  CupSoda,
  Droplets,
  GraduationCap,
  NotebookPen,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/common/Button";
import { useCuratorGrowthJourney } from "@/hooks/useCuratorApi";
import { activeDomain } from "@/domain";
import { cn } from "@/utils/cn";

type MerchandiseCategory = "Apparel" | "Drinkware" | "Stationery" | "Accessories";

type MerchandiseItem = {
  id: string;
  name: string;
  category: MerchandiseCategory;
  price: number;
  quote: string;
  description: string;
  gradient: string;
  icon: typeof Shirt;
};

const categories: Array<"All" | MerchandiseCategory> = [
  "All",
  "Apparel",
  "Drinkware",
  "Stationery",
  "Accessories",
];

const quotes = [
  "Progress over perfection.",
  "Consistency beats intensity.",
  "One focused action at a time.",
  "Your future self says keep going.",
  "Grow intentionally, every day.",
  "Reflect to redirect.",
  "Stay curious. Stay committed.",
  "Small steps compound into big wins.",
  "Build the identity, then the outcome.",
  "Every expert was once a beginner.",
];

const gradients = [
  "from-indigo-500 via-violet-500 to-fuchsia-500",
  "from-sky-500 via-cyan-500 to-teal-500",
  "from-rose-500 via-pink-500 to-orange-400",
  "from-emerald-500 via-teal-500 to-cyan-500",
  "from-amber-500 via-orange-500 to-rose-500",
  "from-slate-700 via-slate-600 to-slate-500",
];

function buildCatalog(career: string, interests: string[]): MerchandiseItem[] {
  const interest = interests[0]?.toLowerCase() ?? "growth";
  const templates: Array<{
    category: MerchandiseCategory;
    name: string;
    price: number;
    description: string;
    icon: MerchandiseItem["icon"];
  }> = [
    {
      category: "Apparel",
      name: `${career} Career Tee`,
      price: 649,
      description: `Premium cotton tee with a motivational ${career} edition print.`,
      icon: Shirt,
    },
    {
      category: "Apparel",
      name: "Momentum Hoodie",
      price: 1299,
      description: "Stay focused through long sessions with this cozy growth hoodie.",
      icon: Shirt,
    },
    {
      category: "Apparel",
      name: "Future-You Cap",
      price: 499,
      description: "Wear the identity you are actively becoming.",
      icon: GraduationCap,
    },
    {
      category: "Drinkware",
      name: "Daily Goal Mug",
      price: 449,
      description: "Start each morning with one clear, focused action.",
      icon: CupSoda,
    },
    {
      category: "Drinkware",
      name: "Hydration Bottle",
      price: 549,
      description: "Stay refreshed while you stay consistent.",
      icon: Droplets,
    },
    {
      category: "Stationery",
      name: "Growth Journal",
      price: 399,
      description: "Capture reflections and redirect your momentum.",
      icon: NotebookPen,
    },
    {
      category: "Stationery",
      name: "Vision Poster",
      price: 299,
      description: "Pin your destination where you can see it daily.",
      icon: StickyNote,
    },
    {
      category: "Stationery",
      name: "Sticker Pack",
      price: 199,
      description: "Motivational stickers themed around ${interest}.",
      icon: Sparkles,
    },
    {
      category: "Accessories",
      name: "Mission Tote",
      price: 599,
      description: "Carry your goals, books, and laptop in style.",
      icon: ShoppingBag,
    },
    {
      category: "Accessories",
      name: "Coach Phone Case",
      price: 499,
      description: "A daily reminder to stay curious and committed.",
      icon: Smartphone,
    },
    {
      category: "Accessories",
      name: "Focus Laptop Sleeve",
      price: 899,
      description: "Protect your tool of creation and your focus time.",
      icon: Briefcase,
    },
    {
      category: "Accessories",
      name: "Momentum Wristband",
      price: 249,
      description: "A subtle nudge to take one more focused step.",
      icon: Award,
    },
  ];

  return templates.map((template, index) => ({
    id: `merchandise-${index}`,
    category: template.category,
    name: template.name.replace("${interest}", interest),
    price: template.price,
    quote: quotes[index % quotes.length],
    description: template.description.replace("${interest}", interest),
    gradient: gradients[index % gradients.length],
    icon: template.icon,
  }));
}

function extractCareer(
  currentIdentity: string | undefined,
  interests: string[] = []
): string {
  const text = currentIdentity ?? "";
  const careerMatch = text.match(/\bis (?:a|an)\s+([^.,;]+)/i);
  if (careerMatch?.[1]) {
    const career = careerMatch[1]
      .replace(
        /\b(?:currently|who|which|that|and|with|at|in|for|from|building|exploring|learning|working|passionate|committed|focused)\b.*$/i,
        ""
      )
      .replace(/\s{2,}/g, " ")
      .trim();
    if (career) {
      return toTitleCase(career);
    }
  }
  if (interests[0]) {
    return toTitleCase(interests[0]);
  }
  return "Personal Growth";
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => {
      if (!word) {
        return word;
      }
      if (/^[A-Z0-9]+(?:[.-][A-Z0-9]+)*$/.test(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

export function MerchandisePage() {
  const journeyQuery = useCuratorGrowthJourney();
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [cart, setCart] = useState<string[]>([]);

  const journey = journeyQuery.data?.data ?? null;
  const career = useMemo(
    () =>
      extractCareer(
        journey?.identityProfile.current_identity,
        journey?.identityProfile.core_interests ?? []
      ),
    [journey?.identityProfile.current_identity, journey?.identityProfile.core_interests]
  );
  const items = useMemo(
    () => buildCatalog(career, journey?.identityProfile.core_interests ?? []),
    [career, journey?.identityProfile.core_interests]
  );

  const filteredItems = useMemo(
    () =>
      category === "All"
        ? items
        : items.filter((item) => item.category === category),
    [category, items]
  );

  function handleToggleCart(itemId: string) {
    setCart((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId]
    );
  }

  return (
    <div className="space-y-5">
      <section className="glass-panel rounded-[8px] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="glass-control mb-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-slate-600">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {activeDomain.application.assistantName} merchandise for {career}
            </div>
            <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
              Merchandise
            </h1>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
              Motivational gear built around your {career} journey. Every product
              is designed to keep your next focused action in sight and your
              growth identity within reach.
            </p>
          </div>
          <div className="glass-control inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-slate-700">
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            {cart.length === 0
              ? "Your cart is empty"
              : `${cart.length} item${cart.length === 1 ? "" : "s"} added`}
          </div>
        </div>
      </section>

      {journeyQuery.isLoading ? (
        <div className="space-y-5">
          <div className="metric-card h-44 animate-pulse" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="metric-card h-80 animate-pulse" />
            <div className="metric-card h-80 animate-pulse" />
            <div className="metric-card h-80 animate-pulse" />
          </div>
        </div>
      ) : (
        <>
          <section className="metric-card p-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((item) => (
                <button
                  className={cn(
                    "inline-flex min-h-10 shrink-0 items-center justify-center rounded-full px-4 text-sm font-semibold transition",
                    category === item
                      ? "blue-pill"
                      : "glass-control text-slate-600 hover:text-slate-950"
                  )}
                  key={item}
                  onClick={() => setCategory(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          {filteredItems.length === 0 ? (
            <section className="metric-card p-8 text-center">
              <h2 className="text-base font-semibold text-slate-950">
                No merchandise found
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-600">
                Try another category to explore motivational gear.
              </p>
            </section>
          ) : (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => {
                const inCart = cart.includes(item.id);
                return (
                  <MerchandiseCard
                    inCart={inCart}
                    item={item}
                    key={item.id}
                    onToggle={() => handleToggleCart(item.id)}
                  />
                );
              })}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function MerchandiseCard({
  inCart,
  item,
  onToggle,
}: {
  inCart: boolean;
  item: MerchandiseItem;
  onToggle: () => void;
}) {
  const Icon = item.icon;
  return (
    <article className="metric-card flex min-h-[380px] flex-col p-5 transition hover:-translate-y-0.5">
      <div
        className={cn(
          "relative flex h-44 items-center justify-center overflow-hidden rounded-[8px] bg-gradient-to-br text-white",
          item.gradient
        )}
      >
        <span className="absolute left-3 top-3 rounded-full bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-wide">
          {item.category}
        </span>
        <Icon className="h-20 w-20 drop-shadow-lg" aria-hidden="true" />
        <span className="absolute bottom-3 left-1/2 w-4/5 -translate-x-1/2 text-center text-sm font-bold leading-5 drop-shadow">
          {item.quote}
        </span>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-6 text-slate-950">
            {item.name}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {formatPrice(item.price)}
          </p>
        </div>
        <button
          aria-label={
            inCart ? `Remove ${item.name} from cart` : `Add ${item.name} to cart`
          }
          className={cn(
            "glass-control inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            inCart ? "text-slate-950" : "text-slate-500"
          )}
          onClick={onToggle}
          type="button"
        >
          <Bookmark
            className={cn("h-5 w-5", inCart && "fill-current")}
            aria-hidden="true"
          />
        </button>
      </div>

      <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
        {item.description}
      </p>

      <div className="mt-auto flex flex-col gap-2 pt-5">
        <Button onClick={onToggle} variant={inCart ? "secondary" : "default"}>
          {inCart ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              In cart
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              Add to cart
            </>
          )}
        </Button>
      </div>
    </article>
  );
}
