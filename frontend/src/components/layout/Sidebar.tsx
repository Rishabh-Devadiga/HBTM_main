import { Link } from "react-router-dom";

import { SaarthiLogo } from "@/components/common/SaarthiLogo";
import { SidebarFooter } from "@/components/layout/SidebarFooter";
import { SidebarItem } from "@/components/layout/SidebarItem";
import { activeDomain } from "@/domain";

type SidebarProps = {
  onNavigate?: () => void;
};

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col bg-white p-4 text-slate-950">
      <div className="pb-6 pt-1">
        <Link
          className="group flex items-center gap-3 rounded-[8px] px-1 py-2 transition hover:bg-slate-100"
          onClick={onNavigate}
          to="/"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-slate-950 text-white">
            <SaarthiLogo className="h-6 w-7" />
          </span>
          <span>
            <span className="block text-lg font-semibold tracking-tight text-slate-950">
              {activeDomain.application.name}
            </span>
            <span className="block text-xs font-medium text-slate-500">
              {activeDomain.application.workspaceName}
            </span>
          </span>
        </Link>
      </div>

      <p className="px-2 pb-2 text-[11px] font-semibold uppercase text-slate-400">
        Menu
      </p>
      <nav
        className="space-y-1"
        aria-label={activeDomain.navigation.ariaLabel}
      >
        {activeDomain.navigation.items.map((item) => (
          <SidebarItem
            icon={item.icon}
            key={`${item.label}-${item.path}`}
            label={item.label}
            onClick={onNavigate}
            to={item.path}
          />
        ))}
      </nav>

      <SidebarFooter />
    </aside>
  );
}
