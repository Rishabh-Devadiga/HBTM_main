import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useLocation } from "react-router-dom";

import { cn } from "@/utils/cn";

type SidebarItemProps = {
  activePath?: string;
  end?: boolean;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  to: string;
};

export function SidebarItem({
  activePath,
  end = false,
  icon: Icon,
  label,
  onClick,
  to,
}: SidebarItemProps) {
  const location = useLocation();
  const isActive = location.pathname === (activePath ?? to);

  return (
    <NavLink
      className={cn(
        "group flex min-h-10 items-center gap-3 rounded-[8px] px-2 text-sm font-semibold transition-all duration-200",
        isActive
          ? "bg-[#eeeeee] text-slate-950"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 hover:translate-x-0.5"
      )}
      end={end}
      onClick={onClick}
      to={to}
    >
      <Icon
        className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110"
        aria-hidden="true"
      />
      <span>{label}</span>
    </NavLink>
  );
}
