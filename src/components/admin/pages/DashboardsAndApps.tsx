import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Monitor,
  Smartphone,
  Tablet,
  LayoutDashboard,
  Brain,
  Globe,
  BookOpen,
  Lock,
  Search,
  ExternalLink,
  Copy,
  Check,
  Chrome,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface AppCard {
  title: string;
  icon: React.ElementType;
  route: string;
  description: string;
  status: "live" | "coming_soon";
  category: string;
}

const APP_CARDS: AppCard[] = [
  // Member Interfaces
  {
    title: "Member Dashboard (Desktop)",
    icon: Monitor,
    route: "/member-dashboard",
    description: "Full sidebar dashboard for laptop/desktop users",
    status: "live",
    category: "Member Interfaces",
  },
  {
    title: "Member Dashboard (Mobile)",
    icon: Smartphone,
    route: "/member-dashboard",
    description: "Bottom nav mobile version with floating SOS",
    status: "live",
    category: "Member Interfaces",
  },
  {
    title: "Tablet Ambient Display",
    icon: Tablet,
    route: "/tablet-dashboard",
    description: "Always-on sideboard display with CLARA voice and vitals",
    status: "live",
    category: "Member Interfaces",
  },
  // Admin Interfaces
  {
    title: "Admin Dashboard",
    icon: LayoutDashboard,
    route: "/admin-dashboard",
    description: "Main admin control centre",
    status: "live",
    category: "Admin Interfaces",
  },
  {
    title: "Riven Marketing AI",
    icon: Brain,
    route: "/admin-dashboard/riven-marketing",
    description: "AI campaign wizard and content engine",
    status: "live",
    category: "Admin Interfaces",
  },
  // Public Pages
  {
    title: "Homepage",
    icon: Globe,
    route: "/",
    description: "Public-facing marketing homepage",
    status: "live",
    category: "Public Pages",
  },
  {
    title: "Blog",
    icon: BookOpen,
    route: "/blog",
    description: "Auto-populated blog from Riven published posts",
    status: "live",
    category: "Public Pages",
  },
  {
    title: "Auth Page",
    icon: Lock,
    route: "/auth",
    description: "Login, register, forgot password, reset password",
    status: "live",
    category: "Public Pages",
  },
  // Future
  {
    title: "iOS App",
    icon: Smartphone,
    route: "#",
    description: "Native iOS app via Capacitor",
    status: "coming_soon",
    category: "Future",
  },
  {
    title: "Android App",
    icon: Smartphone,
    route: "#",
    description: "Native Android app via Capacitor",
    status: "coming_soon",
    category: "Future",
  },
  {
    title: "Chrome Extension",
    icon: Chrome,
    route: "#",
    description: "Browser extension for quick SOS access",
    status: "coming_soon",
    category: "Future",
  },
];

const DashboardsAndApps = () => {
  const [search, setSearch] = useState("");
  const [copiedRoute, setCopiedRoute] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const filtered = APP_CARDS.filter((card) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      card.title.toLowerCase().includes(q) ||
      card.description.toLowerCase().includes(q) ||
      card.category.toLowerCase().includes(q)
    );
  });

  const categories = [...new Set(filtered.map((c) => c.category))];

  const handleCopyLink = async (route: string) => {
    const fullUrl = `${window.location.origin}${route}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopiedRoute(route);
    toast({ title: t('dashboards.linkCopied') });
    setTimeout(() => setCopiedRoute(null), 2000);
  };

  const handleOpen = (route: string) => {
    window.open(route, "_blank");
  };

  return (
    <div className="px-8 py-6 w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('dashboards.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('dashboards.subtitle')}
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('dashboards.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Cards by category */}
      {categories.map((category) => (
        <div key={category}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {category}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered
              .filter((c) => c.category === category)
              .map((card) => {
                const isComingSoon = card.status === "coming_soon";
                return (
                  <Card
                    key={card.title}
                    className={`transition-all duration-200 ${
                      isComingSoon
                        ? "opacity-60"
                        : "hover:shadow-lg hover:-translate-y-0.5"
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <card.icon className="h-5 w-5 text-primary" />
                        </div>
                        <Badge
                          variant={isComingSoon ? "secondary" : "default"}
                          className={
                            isComingSoon
                              ? "text-[10px]"
                              : "text-[10px] bg-green-500/10 text-green-600 border-green-500/20"
                          }
                        >
                          {isComingSoon ? t('dashboards.comingSoon') : t('dashboards.live')}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{card.title}</h3>
                      <p className="text-xs text-muted-foreground mb-4">
                        {card.description}
                      </p>
                      {!isComingSoon && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="text-xs h-7 flex-1"
                            onClick={() => handleOpen(card.route)}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {t('dashboards.open')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => handleCopyLink(card.route)}
                          >
                            {copiedRoute === card.route ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardsAndApps;
