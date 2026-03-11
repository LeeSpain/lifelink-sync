import { Link } from "react-router-dom";
import { Bell, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageCurrencySelector from "@/components/LanguageCurrencySelector";

export function MobileDashboardHeader() {
  const { t } = useTranslation();

  return (
    <header
      className="fixed top-0 inset-x-0 z-40 h-12 bg-background/95 backdrop-blur border-b flex items-center px-3 gap-2"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {/* Left: avatar link to profile */}
      <Link
        to="/member-dashboard/profile"
        className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0"
      >
        <Shield className="h-4 w-4 text-primary" />
      </Link>

      {/* Center: brand */}
      <div className="flex-1 text-center">
        <span className="text-sm font-bold tracking-tight">LifeLink Sync</span>
      </div>

      {/* Right: notifications + language */}
      <Link
        to="/member-dashboard/notifications"
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors shrink-0"
      >
        <Bell className="h-4 w-4" />
      </Link>
      <LanguageCurrencySelector compact />
    </header>
  );
}
