import { useState } from "react";
import { Sparkles, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSearch = () => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  return (
    <section className="pt-32 pb-16 px-6 gradient-hero">
      <div className="container mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
          <Sparkles className="w-4 h-4" />
          <span>Propulsé par l'Intelligence Artificielle</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          Ne cherchez plus,{" "}
          <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            dialoguez avec le savoir
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          Accédez à <span className="font-semibold text-foreground">10 ans de mémoires</span> via notre assistant IA et découvrez les tendances de recherche académique.
        </p>

        {/* Search Bar */}
        <div 
          className={`relative max-w-3xl mx-auto animate-fade-in-up ${isFocused ? 'animate-pulse-glow' : ''}`}
          style={{ animationDelay: "0.3s" }}
        >
          <div className="search-bar-glow bg-card rounded-2xl border border-border/50 p-2">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 pl-4">
                <Search className="w-5 h-5 text-muted-foreground" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Posez votre question de recherche (ex: 'Synthétise les défis de la logistique urbaine dans les mémoires de 2020 à 2023')..."
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none py-3 text-base"
              />
              <Button variant="hero" size="lg" className="flex-shrink-0 gap-2">
                <Sparkles className="w-5 h-5" />
                <span className="hidden sm:inline">Lancer l'analyse IA</span>
                <ArrowRight className="w-5 h-5 sm:hidden" />
              </Button>
            </div>
          </div>

          {/* Suggestions */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <span className="text-sm text-muted-foreground">Essayez :</span>
            {["RSE en entreprise", "IA et santé", "Blockchain finance"].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setQuery(suggestion)}
                className="px-3 py-1 text-sm rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 mt-12 pt-8 border-t border-border/50 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          {[
            { value: "12,450+", label: "Mémoires indexés" },
            { value: "85+", label: "Domaines de recherche" },
            { value: "98%", label: "Satisfaction utilisateurs" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSearch;
