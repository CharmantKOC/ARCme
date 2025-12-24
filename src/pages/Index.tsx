import { useNavigate } from "react-router-dom";
import { BookOpen, Upload, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const handleAddDocument = () => {
    if (!user) {
      navigate("/auth", { state: { from: { pathname: "/ajouter-document" } } });
    } else {
      navigate("/ajouter-document");
    }
  };

  const handleConsultDocuments = () => {
    if (!user) {
      navigate("/auth", { state: { from: { pathname: "/documentation" } } });
    } else {
      navigate("/documentation");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header minimal sans navigation */}
      <header className="py-6 px-6">
        <div className="container mx-auto max-w-6xl flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary" />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full gradient-primary flex items-center justify-center">
                <Sparkles className="w-2 h-2 text-primary-foreground" />
              </div>
            </div>
            <span className="text-2xl font-bold tracking-tight">
              ARC-<span className="text-primary">Mémoires</span>
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-6 text-center">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Ne cherchez plus, <span className="text-primary">dialoguez</span> avec le savoir
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Accédez à 10 ans de mémoires universitaires via notre assistant IA. 
            Déposez vos travaux ou explorez les archives intelligemment.
          </p>
        </div>
      </section>

      {/* Two Column Split */}
      <main className="flex-1 px-6 pb-12">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-card-hover">
            {/* Left Column - Add Document */}
            <div 
              onClick={handleAddDocument}
              className="group relative bg-secondary/50 p-12 flex flex-col items-center justify-center text-center min-h-[400px] transition-all duration-300 hover:bg-secondary cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 mx-auto shadow-glow group-hover:scale-110 transition-transform">
                  <Upload className="w-10 h-10 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  Ajouter un document
                </h2>
                <p className="text-muted-foreground max-w-xs">
                  Déposez votre mémoire pour le rendre accessible à la communauté universitaire
                </p>
                <div className="mt-6">
                  <Button variant="hero" className="gap-2 pointer-events-none">
                    <Upload className="w-4 h-4" />
                    Déposer un mémoire
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column - Consult Documents */}
            <div 
              onClick={handleConsultDocuments}
              className="group relative bg-card p-12 flex flex-col items-center justify-center text-center min-h-[400px] transition-all duration-300 hover:bg-card/80 border-l border-border/50 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-bl from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-foreground flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                  <Search className="w-10 h-10 text-background" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  Consulter les documents
                </h2>
                <p className="text-muted-foreground max-w-xs">
                  Explorez les mémoires existants avec l'aide de notre assistant IA
                </p>
                <div className="mt-6">
                  <Button variant="outline" className="gap-2 border-foreground text-foreground hover:bg-foreground hover:text-background pointer-events-none">
                    <Search className="w-4 h-4" />
                    Explorer les archives
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="py-6 px-6 border-t border-border/50">
        <div className="container mx-auto max-w-5xl flex items-center justify-center">
          <button 
            onClick={() => navigate("/contact")}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Contacter le support
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Index;