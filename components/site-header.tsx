"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  File as FileIcon,
  FileText,
  Presentation as LayoutPresentation,
  Mail as MailIcon,
  Menu,
  LogOut,
  Sparkles,
  Zap,
  DollarSign,
  Workflow,
  User,
  History,
  Coins,
  Crown,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { PWAInstallButton } from "@/components/pwa-install-button";
import { SimpleThemeToggle } from "@/components/simple-theme-toggle";
import { useAuth } from "@/components/auth-provider";
import { TooltipWithShortcut } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { UpgradeModal, useCredits } from "@/components/upgrade-modal";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const { credits, loading: creditsLoading, refetch: refetchCredits } = useCredits();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleNavClick = () => {
    setIsSheetOpen(false);
  };

  // Note: Removed redundant refetchCredits on user change - 
  // useCredits already fetches on mount and has debouncing built-in

  return (
    <header className="sticky top-0 z-50 w-full nav-professional">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-8">
            {/* Logo with tooltip for desktop only */}
            <TooltipWithShortcut
              content="Return to homepage"
              disabled={typeof window !== "undefined" && window.innerWidth < 768}
            >
              <Link
                href="/"
                className="flex items-center space-x-2 group min-w-0"
              >
                <div className="relative">
                  <FileText className="h-6 w-6 sm:h-7 sm:w-7 bolt-gradient-text group-hover:scale-110 transition-transform duration-300" />
                  <Sparkles className="absolute -top-1 -right-1 h-2 w-2 sm:h-3 sm:w-3 text-yellow-500 animate-pulse" />
                </div>
                <span className="font-bold text-lg sm:text-xl bolt-gradient-text hidden xs:block truncate max-w-[80px] sm:max-w-none">
                  DraftDeckAI
                </span>
              </Link>
            </TooltipWithShortcut>

            {/* Mobile Navigation Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden bg-background/95 backdrop-blur-sm border-border/40 hover:bg-accent hover:text-accent-foreground h-8 w-8 sm:h-9 sm:w-9 transition-all duration-200"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[280px] sm:w-[320px] bg-background/95 backdrop-blur-xl border-border/50"
              >
                <SheetHeader className="text-left pb-4 border-b border-border/20">
                  <SheetTitle className="flex items-center gap-2 text-lg">
                    <div className="relative">
                      <FileText className="h-5 w-5 bolt-gradient-text" />
                      <Sparkles className="absolute -top-0.5 -right-0.5 h-2 w-2 text-yellow-500 animate-pulse" />
                    </div>
                    DraftDeckAI
                  </SheetTitle>
                  <SheetDescription className="text-sm text-muted-foreground">
                    Access all document creation tools
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {/* Navigation Items */}
                  <nav className="space-y-1">
                    {navItems.map((item) => (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          onClick={handleNavClick}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent/50 hover:text-accent-foreground group w-full",
                            pathname === item.href
                              ? "bg-accent text-accent-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <span
                            className={cn(
                              "transition-colors duration-200",
                              pathname === item.href
                                ? "text-yellow-600"
                                : "group-hover:text-yellow-500"
                            )}
                          >
                            {item.icon}
                          </span>
                          <span className="font-medium">{item.label}</span>
                          {pathname === item.href && (
                            <div className="ml-auto">
                              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            </div>
                          )}
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>

                  {/* User Section in Mobile */}
                  {user && (
                    <div className="pt-4 border-t border-border/20">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/20">
                        <Avatar className="h-10 w-10 ring-2 ring-yellow-400/30">
                          <AvatarImage src={user.user_metadata?.avatar_url} />
                          <AvatarFallback className="bolt-gradient text-white text-sm font-semibold">
                            {(
                              user.user_metadata?.name?.[0] ||
                              user.email?.[0] ||
                              "U"
                            ).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.user_metadata?.name || "User"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1 mt-3">
                        <SheetClose asChild>
                          <Link
                            href="/profile"
                            className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-accent/50 hover:text-accent-foreground transition-colors w-full"
                          >
                            <User className="h-4 w-4 text-muted-foreground" />
                            Profile
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link
                            href="/settings"
                            className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-accent/50 hover:text-accent-foreground transition-colors w-full"
                          >
                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                            Settings
                          </Link>
                        </SheetClose>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSignOut}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-red-50 hover:text-red-600 w-full justify-start transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Sign In Button for Mobile */}
                  {!user && (
                    <div className="pt-4 border-t border-border/20">
                      <SheetClose asChild>
                        <Button
                          asChild
                          className="w-full bolt-gradient text-white font-semibold hover:scale-105 transition-all duration-300"
                        >
                          <Link
                            href="/auth/signin"
                            className="flex items-center gap-2"
                          >
                            <Zap className="h-4 w-4" />
                            Sign In to DraftDeckAI
                          </Link>
                        </Button>
                      </SheetClose>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Navigation with Tooltips */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-6 xl:gap-8">
              {navItems.map((item) => (
                <TooltipWithShortcut key={item.href} content={item.tooltip}>
                  <Link
                    href={item.href}
                    className={cn(
                      "text-sm lg:text-base font-medium transition-all duration-300 hover:bolt-gradient-text hover:scale-105 flex items-center gap-2 relative group whitespace-nowrap",
                      pathname === item.href
                        ? "bolt-gradient-text"
                        : "text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "transition-transform duration-200",
                        "group-hover:scale-110"
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="hidden lg:inline">{item.label}</span>
                    {pathname === item.href && (
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-0.5 rounded-full bg-yellow-500"></div>
                    )}
                  </Link>
                </TooltipWithShortcut>
              ))}
            </nav>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* PWA Install Button */}
            <TooltipWithShortcut content="Install DraftDeckAI as an app on your device">
              <PWAInstallButton variant="ghost" size="sm" showText={false} />
            </TooltipWithShortcut>

            {/* Theme Toggle - Simple version for testing */}
            <SimpleThemeToggle />

            {/* Credits Badge - Desktop Only */}
            {user && !creditsLoading && credits && (
              <TooltipWithShortcut content={`${credits.creditsRemaining} credits remaining. Click to upgrade.`}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUpgradeModalOpen(true)}
                  className={cn(
                    "hidden md:flex items-center gap-1.5 px-2.5 h-8 rounded-full transition-all",
                    credits.creditsRemaining < 3
                      ? "bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400"
                      : "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                  )}
                >
                  <Coins className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">{credits.creditsRemaining}</span>
                  {credits.tier !== 'free' && (
                    <Crown className="h-3 w-3 text-yellow-500" />
                  )}
                </Button>
              </TooltipWithShortcut>
            )}

            {/* Desktop User Menu */}
            {loading ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse hidden md:flex"></div>
            ) : user ? (
              <DropdownMenu>
                <TooltipWithShortcut content="View account settings and profile">
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full hidden md:flex"
                    >
                      <Avatar className="h-8 w-8 ring-2 ring-yellow-400/20 hover:ring-yellow-400/40 transition-all duration-200">
                        <AvatarImage
                          src={user.user_metadata?.avatar_url}
                          alt={user.user_metadata?.name || user.email}
                        />
                        <AvatarFallback className="bolt-gradient text-white font-semibold text-xs">
                          {(
                            user.user_metadata?.name?.[0] ||
                            user.email?.[0] ||
                            "U"
                          ).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipWithShortcut>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-background/95 backdrop-blur-xl border-border/50"
                >
                  <div className="flex items-center gap-2 p-2 border-b border-border/20">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="bolt-gradient text-white text-xs">
                        {(
                          user.user_metadata?.name?.[0] ||
                          user.email?.[0] ||
                          "U"
                        ).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.user_metadata?.name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/settings" className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {/* Credits & Upgrade Section */}
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {credits ? (
                      <div className="flex items-center justify-between">
                        <span>Credits: {credits.creditsRemaining}/{credits.creditsTotal}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {credits.tier}
                        </Badge>
                      </div>
                    ) : (
                      <span>Loading credits...</span>
                    )}
                  </div>
                  <DropdownMenuItem
                    onClick={() => setUpgradeModalOpen(true)}
                    className="cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                  >
                    <Crown className="mr-2 h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Upgrade Plan</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20">
                    <Link href="/profile#referral" className="flex items-center">
                      <Gift className="mr-2 h-4 w-4 text-green-500" />
                      <span className="font-medium">Refer & Earn Credits</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="hover:bg-red-50 hover:text-red-600 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Desktop Sign In Button */
              <TooltipWithShortcut content="Sign in to save and manage your documents">
                <Link href="/auth/signin">
                  <Button className="bolt-gradient text-white font-semibold hover:scale-105 transition-all duration-300 text-sm px-4 h-9 hidden md:flex">
                    <Zap className="h-4 w-4" />
                    <span>Sign In</span>
                  </Button>
                </Link>
              </TooltipWithShortcut>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        creditsInfo={credits}
      />
    </header>
  );
}

const navItems = [
  {
    href: "/resume",
    label: "Resume",
    icon: <FileIcon className="h-4 w-4" />,
    tooltip: "Create professional resumes with AI assistance",
  },
  {
    href: "/presentation",
    label: "Presentation",
    icon: <LayoutPresentation className="h-4 w-4" />,
    tooltip: "Generate stunning slide presentations instantly",
  },
  {
    href: "/letter",
    label: "Letter",
    icon: <MailIcon className="h-4 w-4" />,
    tooltip: "Write professional letters and cover letters",
  },
  {
    href: "/diagram",
    label: "Diagram",
    icon: <Workflow className="h-4 w-4" />,
    tooltip: "Create flowcharts, architectures, and Mermaid diagrams",
  },
  {
    href: "/dashboard/history",
    label: "History",
    icon: <History className="h-4 w-4" />,
    tooltip: "View all your created documents with previews",
  },
  {
    href: "/pricing",
    label: "Pricing",
    icon: <DollarSign className="h-4 w-4" />,
    tooltip: "View pricing plans and upgrade options",
  },
];
