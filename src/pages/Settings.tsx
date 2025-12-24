import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Bell, Moon, Sun, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/hooks/useNotifications";

const Settings = () => {
  const { theme, setTheme, effectiveTheme } = useTheme();
  const { isEnabled, requestPermission, disableNotifications, permission } = useNotifications();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Paramètres</h1>
            <p className="text-muted-foreground">
              Personnalisez votre expérience ARC-Mémoires
            </p>
          </div>

          <div className="space-y-6">
            {/* Theme Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {effectiveTheme === "dark" ? (
                    <Moon className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )}
                  Apparence
                </CardTitle>
                <CardDescription>
                  Choisissez le thème de l'interface
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => setTheme("light")}
                    className="w-full"
                  >
                    <Sun className="w-4 h-4 mr-2" />
                    Clair
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => setTheme("dark")}
                    className="w-full"
                  >
                    <Moon className="w-4 h-4 mr-2" />
                    Sombre
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    onClick={() => setTheme("system")}
                    className="w-full"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Système
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Thème actuel : <span className="font-medium">{effectiveTheme === "dark" ? "Sombre" : "Clair"}</span>
                </p>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Gérez vos préférences de notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="notifications" className="text-base">
                      Notifications de messages
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des notifications pour les nouveaux messages
                    </p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={isEnabled}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        requestPermission();
                      } else {
                        disableNotifications();
                      }
                    }}
                  />
                </div>

                {permission === "denied" && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-sm text-destructive">
                      Les notifications sont bloquées par votre navigateur. 
                      Veuillez les autoriser dans les paramètres de votre navigateur.
                    </p>
                  </div>
                )}

                {permission === "default" && !isEnabled && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <p className="text-sm text-foreground">
                      Activez les notifications pour ne manquer aucun message important.
                    </p>
                  </div>
                )}

                {isEnabled && permission === "granted" && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <p className="text-sm text-foreground flex items-center gap-2">
                      <Bell className="w-4 h-4 text-primary" />
                      Notifications activées - Vous recevrez des alertes pour les nouveaux messages
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>À propos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dernière mise à jour</span>
                  <span className="font-medium">Décembre 2025</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
