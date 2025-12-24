import { Link, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, ChevronDown, Database, Users, TrendingUp, User, Menu, X, Sparkles, LogOut, LogIn, Settings, MessageSquare, Upload, Moon, Sun, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { href: "/documentation", label: "Documentation", icon: Database },
  { href: "/visualisation", label: "Visualisation", icon: TrendingUp },
  { href: "/alumni", label: "Réseau", icon: Users },
  { href: "/conversations", label: "Messagerie", icon: MessageSquare },
];

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const { theme, setTheme, effectiveTheme } = useTheme();
  const { permission, isEnabled, requestPermission, disableNotifications } = useNotifications();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserAvatar();
      
      // Écouter les mises à jour d'avatar
      const handleAvatarUpdate = (e: CustomEvent) => {
        setAvatarUrl(e.detail.avatarUrl);
      };
      
      window.addEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
      
      return () => {
        window.removeEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
      };
    }
  }, [user]);

  const fetchUserAvatar = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Error fetching avatar:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Déconnexion réussie",
      description: "À bientôt !",
    });
    navigate("/");
  };

  const getUserInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const handleToggleNotifications = async () => {
    if (isEnabled) {
      disableNotifications();
    } else {
      await requestPermission();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full gradient-primary flex items-center justify-center">
              <Sparkles className="w-1.5 h-1.5 text-primary-foreground" />
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight">
            ARC-<span className="text-primary">Mémoires</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.href} to={item.href}>
              <Button 
                variant="nav" 
                size="sm" 
                className={cn(
                  "gap-2",
                  location.pathname === item.href && "bg-primary/10 text-primary"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(effectiveTheme === "dark" ? "light" : "dark")}
            className="w-9 h-9 p-0"
          >
            {effectiveTheme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>

          {/* Notifications Toggle (only for logged in users) */}
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleNotifications}
              className={cn(
                "w-9 h-9 p-0",
                isEnabled && "text-primary"
              )}
              title={isEnabled ? "Désactiver les notifications" : "Activer les notifications"}
            >
              {isEnabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </Button>
          )}

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm text-muted-foreground truncate">
                  {user.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profil" className="gap-2 cursor-pointer">
                    <User className="w-4 h-4" />
                    Mon Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/ajouter-document" className="gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Ajouter un document
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" />
                    Paramètres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="gap-2 text-destructive cursor-pointer"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button variant="default" size="sm" className="gap-2">
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Connexion</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <nav className="container mx-auto px-6 py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button 
                  variant="ghost" 
                  className={cn(
                    "w-full justify-start gap-3",
                    location.pathname === item.href && "bg-primary/10 text-primary"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Button>
              </Link>
            ))}
            {!user && (
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="default" className="w-full gap-2 mt-2">
                  <LogIn className="w-5 h-5" />
                  Connexion
                </Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
