import { useTranslation } from "react-i18next";
import { useConnections } from "@/hooks/useConnections";
import { useEmergencySOS } from "@/hooks/useEmergencySOS";
import {
  Phone,
  MapPin,
  ShieldCheck,
  Activity,
  Users,
  Heart,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LiveFamilyStatus } from "@/components/dashboard/LiveFamilyStatus";
import { EmergencyPreparedness } from "@/components/dashboard/EmergencyPreparedness";
import { Link } from "react-router-dom";
import { PWAInstallBanner } from "@/components/dashboard/PWAInstallBanner";

interface MobileDashboardHomeProps {
  profile: any;
  subscription: any;
}

export function MobileDashboardHome({ profile, subscription }: MobileDashboardHomeProps) {
  const { t } = useTranslation();
  const { connections } = useConnections("family_circle");
  const { triggerEmergencySOS, isTriggering } = useEmergencySOS();

  const activeMembers = connections?.filter((c) => c.status === "active").length ?? 0;
  const hasSubscription = !!subscription?.active;

  return (
    <div className="p-3 space-y-4">
      {/* Welcome */}
      <div>
        <h1 className="text-lg font-bold tracking-tight">
          {t("dashboard.welcomeBack", {
            name: profile?.first_name || t("dashboard.memberFallback"),
          })}
        </h1>
        <p className="text-xs text-muted-foreground">
          {t("dashboard.protectionOverview")}
        </p>
      </div>

      <PWAInstallBanner />

      {/* Quick Status Strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3">
        <StatusPill
          icon={<Heart className="h-3.5 w-3.5" />}
          label={t("mobile.status.circleHealth", { defaultValue: "Circle" })}
          value={`${activeMembers}`}
          color="emerald"
        />
        <StatusPill
          icon={<Users className="h-3.5 w-3.5" />}
          label={t("mobile.status.familyOnline", { defaultValue: "Family" })}
          value={`${activeMembers}`}
          color="blue"
        />
        <StatusPill
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          label={t("mobile.status.protection", { defaultValue: "Protection" })}
          value={hasSubscription ? t("mobile.status.active", { defaultValue: "Active" }) : "—"}
          color={hasSubscription ? "emerald" : "amber"}
        />
      </div>

      {/* Quick Actions 2x2 */}
      <div className="grid grid-cols-2 gap-2">
        <ActionButton
          icon={<Phone className="h-5 w-5" />}
          label={t("mobile.actions.emergencyCall", { defaultValue: "Emergency Call" })}
          onClick={triggerEmergencySOS}
          disabled={isTriggering}
          variant="destructive"
        />
        <ActionButton
          icon={<MapPin className="h-5 w-5" />}
          label={t("mobile.actions.shareLocation", { defaultValue: "Share Location" })}
          to="/member-dashboard/live-map"
          variant="blue"
        />
        <ActionButton
          icon={<Users className="h-5 w-5" />}
          label={t("mobile.actions.quickCall", { defaultValue: "Family" })}
          to="/member-dashboard/connections"
          variant="green"
        />
        <ActionButton
          icon={<Activity className="h-5 w-5" />}
          label={t("mobile.actions.systemCheck", { defaultValue: "System Check" })}
          to="/member-dashboard/activity"
          variant="slate"
        />
      </div>

      {/* Family Status — compact */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">
            {t("dashboard.familyCircleLabel", { defaultValue: "Family Circle" })}
          </h2>
          <Link
            to="/member-dashboard/connections"
            className="text-xs text-primary flex items-center gap-0.5"
          >
            {t("dashboard.viewAll", { defaultValue: "View all" })}
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <LiveFamilyStatus />
      </div>

      {/* Emergency Readiness — compact */}
      <EmergencyPreparedness profile={profile} subscription={subscription} />
    </div>
  );
}

// ── Internal sub-components ──

function StatusPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "emerald" | "blue" | "amber";
}) {
  const bg = {
    emerald: "bg-emerald-500/10 text-emerald-600",
    blue: "bg-blue-500/10 text-blue-600",
    amber: "bg-amber-500/10 text-amber-600",
  }[color];

  return (
    <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 shrink-0 ${bg}`}>
      {icon}
      <div className="flex items-baseline gap-1">
        <span className="text-sm font-bold">{value}</span>
        <span className="text-[10px] opacity-70">{label}</span>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  to,
  disabled,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  to?: string;
  disabled?: boolean;
  variant: "destructive" | "blue" | "green" | "slate";
}) {
  const styles = {
    destructive: "bg-red-600 hover:bg-red-700 text-white",
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
    green: "bg-emerald-600 hover:bg-emerald-700 text-white",
    slate: "bg-slate-700 hover:bg-slate-800 text-white",
  }[variant];

  const content = (
    <div className="flex flex-col items-center gap-1.5">
      {icon}
      <span className="text-xs font-medium leading-tight text-center">{label}</span>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className={`rounded-xl min-h-[72px] flex items-center justify-center p-3 transition-colors ${styles}`}>
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl min-h-[72px] flex items-center justify-center p-3 transition-colors disabled:opacity-60 ${styles}`}
    >
      {content}
    </button>
  );
}
