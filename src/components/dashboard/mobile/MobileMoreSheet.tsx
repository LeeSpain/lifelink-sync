import { NavLink, useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  User,
  Package,
  Smartphone,
  Bluetooth,
  Users,
  Navigation,
  History,
  CreditCard,
  Bell,
  Shield,
  Settings,
  HelpCircle,
  Home,
  LogOut,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

interface MobileMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMoreSheet({ open, onOpenChange }: MobileMoreSheetProps) {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleNav = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  const handleSignOut = async () => {
    onOpenChange(false);
    await signOut();
    navigate("/");
  };

  const sections = [
    {
      label: t("dashboard.overview"),
      items: [
        { icon: User, label: t("dashboard.profile"), url: "/member-dashboard/profile" },
        { icon: Package, label: t("dashboard.myProducts"), url: "/member-dashboard/products" },
        { icon: Smartphone, label: t("dashboard.mobileApp"), url: "/member-dashboard/mobile-app" },
        { icon: Bluetooth, label: t("dashboard.devices", { defaultValue: "Devices" }), url: "/member-dashboard/devices" },
      ],
    },
    {
      label: t("dashboard.familyCircleLabel"),
      items: [
        { icon: Users, label: t("dashboard.myCircles"), url: "/member-dashboard/circles" },
        { icon: Navigation, label: t("dashboard.placesGeofences"), url: "/member-dashboard/places" },
        { icon: History, label: t("dashboard.locationHistory"), url: "/member-dashboard/location-history" },
      ],
    },
    {
      label: t("dashboard.settings"),
      items: [
        { icon: CreditCard, label: t("dashboard.subscription"), url: "/member-dashboard/subscription" },
        { icon: Bell, label: t("dashboard.notifications"), url: "/member-dashboard/notifications" },
        { icon: Shield, label: t("dashboard.security"), url: "/member-dashboard/security" },
        { icon: Settings, label: t("dashboard.settings"), url: "/member-dashboard/settings" },
        { icon: HelpCircle, label: t("dashboard.support"), url: "/member-dashboard/support" },
      ],
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-base">
            {t("mobile.nav.more", { defaultValue: "More" })}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-6">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <button
                    key={item.url}
                    onClick={() => handleNav(item.url)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors min-h-[44px]"
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Footer actions */}
          <div className="border-t pt-3 space-y-0.5">
            <button
              onClick={() => handleNav("/")}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors min-h-[44px]"
            >
              <Home className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t("dashboard.home")}</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors min-h-[44px]"
            >
              <LogOut className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-600">
                {t("dashboard.signOut")}
              </span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
