import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { createSession, getUserSessions, ResearchSession } from "@/lib/sessionHelpers";

const NouvelleSession = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessionName, setSessionName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentSessions, setRecentSessions] = useState<ResearchSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecentSessions();
    }
  }, [user]);

  const fetchRecentSessions = async () => {
    if (!user) return;
    
    try {
      const sessions = await getUserSessions(user.id);
      setRecentSessions(sessions.slice(0, 5)); // Only show last 5
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await createSession(user.id, sessionName);
      toast.success("Session créée avec succès !");
      navigate("/consultation", { state: { sessionId: session.id } });
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error("Erreur lors de la création de la session");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenSession = (sessionId: string) => {
    navigate("/consultation", { state: { sessionId } });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)} semaine(s)`;
    return `Il y a ${Math.floor(days / 30)} mois`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center mb-4 mx-auto">
              <Search className="w-8 h-8 text-background" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Nouvelle session de recherche
            </h1>
            <p className="text-muted-foreground">
              Nommez votre recherche pour la retrouver facilement dans votre historique
            </p>
          </div>

          {/* New Session Form */}
          <form onSubmit={handleSubmit} className="mb-10">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session-name" className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Nom de la session
                  </Label>
                  <Input
                    id="session-name"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="Ex: Recherche sur l'impact de l'IA dans la santé"
                    required
                  />
                </div>

                <Button type="submit" variant="hero" className="w-full gap-2" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isSubmitting ? "Création..." : "Commencer la recherche"}
                  {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </form>

          {/* Recent Sessions */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : recentSessions.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Sessions récentes
              </h2>
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleOpenSession(session.id)}
                    className="w-full bg-card hover:bg-secondary/50 rounded-lg border border-border p-4 text-left transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Search className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{session.title}</p>
                        <p className="text-sm text-muted-foreground">{getTimeAgo(session.updated_at)}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NouvelleSession;
