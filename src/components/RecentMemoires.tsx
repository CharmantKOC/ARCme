import { ArrowRight, FileText, Linkedin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Memoire {
  id: number;
  title: string;
  year: number;
  author: string;
  hasLinkedIn: boolean;
  domain: string;
}

const memoires: Memoire[] = [
  {
    id: 1,
    title: "L'impact de l'intelligence artificielle sur la transformation digitale des PME françaises",
    year: 2024,
    author: "Marie Dupont",
    hasLinkedIn: true,
    domain: "Management & IA",
  },
  {
    id: 2,
    title: "Analyse des stratégies RSE dans le secteur bancaire européen post-COVID",
    year: 2023,
    author: "Thomas Martin",
    hasLinkedIn: true,
    domain: "Finance & RSE",
  },
  {
    id: 3,
    title: "Blockchain et traçabilité dans la supply chain agroalimentaire",
    year: 2023,
    author: "Sophie Laurent",
    hasLinkedIn: false,
    domain: "Logistique",
  },
];

const RecentMemoires = () => {
  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Derniers Dépôts & Réseau</h3>
            <p className="text-sm text-muted-foreground">Connectez-vous avec les alumni</p>
          </div>
        </div>
      </div>

      {/* Memoires List */}
      <div className="flex-1 divide-y divide-border/50">
        {memoires.map((memoire) => (
          <div
            key={memoire.id}
            className="p-4 hover:bg-secondary/30 transition-colors cursor-pointer group"
          >
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {memoire.title}
                </h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {memoire.year}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{memoire.domain}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-muted-foreground">{memoire.author}</span>
                  {memoire.hasLinkedIn && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0A66C2]/10 text-[#0A66C2]">
                      <Linkedin className="w-3 h-3" />
                      <span className="text-xs font-medium">Alumni Connecté</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        <Button variant="ghost" className="w-full justify-between group">
          <span>Explorer tous les mémoires</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  );
};

export default RecentMemoires;
