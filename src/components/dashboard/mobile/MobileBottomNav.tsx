import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Map, Activity, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { MobileMoreSheet } from "./MobileMoreSheet";

const NAV_ITEMS = [
  { key: "home", icon: LayoutDashboard, route: "/member-dashboard", end: true },
  { key: "family", icon: Users, route: "/member-dashboard/connections", end: false },
  { key: "map", icon: Map, route: "/member-dashboard/live-map", end: false },
  { key: "activity", icon: Activity, route: "/member-dashboard/activity", end: false },
] as const;

export function MobileBottomNav() {
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  const labels: Record<string, string> = {
    home: t("mobile.nav.home", { defaultValue: "Home" }),
    family: t("mobile.nav.family", { defaultValue: "Family" }),
    map: t("mobile.nav.map", { defaultValue: "Map" }),
    activity: t("mobile.nav.activity", { defaultValue: "Activity" }),
  };

  const isMoreActive = ![
    "/member-dashboard",
    "/member-dashboard/connections",
    "/member-dashboard/live-map",
    "/member-dashboard/activity",
  ].some((r) =>
    r === "/member-dashboard"
      ? location.pathname === r
      : location.pathname.startsWith(r)
  );

  return (
    <>
      <nav
        className="fixed bottom-0 inset-x-0 z-40 h-16 bg-background/95 backdrop-blur border-t flex items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.key}
            to={item.route}
            end={item.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">
              {labels[item.key]}
            </span>
          </NavLink>
        ))}

        {/* More tab */}
        <button
          onClick={() => setMoreOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors ${
            isMoreActive ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">
            {t("mobile.nav.more", { defaultValue: "More" })}
          </span>
        </button>
      </nav>

      <MobileMoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}
