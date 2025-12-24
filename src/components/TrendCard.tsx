import { ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrendBubble {
  label: string;
  growth: string;
  size: "sm" | "md" | "lg";
  position: { top: string; left: string };
}

const trends: TrendBubble[] = [
  { label: "IA Éthique", growth: "+40%", size: "lg", position: { top: "15%", left: "35%" } },
  { label: "RSE", growth: "+28%", size: "md", position: { top: "45%", left: "15%" } },
  { label: "Fintech", growth: "+35%", size: "md", position: { top: "55%", left: "60%" } },
  { label: "Green IT", growth: "+22%", size: "sm", position: { top: "25%", left: "70%" } },
  { label: "Data Privacy", growth: "+18%", size: "sm", position: { top: "70%", left: "35%" } },
  { label: "E-commerce", growth: "+15%", size: "sm", position: { top: "35%", left: "5%" } },
];

const sizeClasses = {
  sm: "w-20 h-20 text-xs",
  md: "w-28 h-28 text-sm",
  lg: "w-36 h-36 text-base",
};

const TrendCard = () => {
  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Sujets Émergents</h3>
            <p className="text-sm text-muted-foreground">Trend Mapping</p>
          </div>
        </div>
      </div>

      {/* Bubble Chart */}
      <div className="relative flex-1 min-h-[280px] p-4">
        {trends.map((trend, index) => (
          <div
            key={trend.label}
            className={`absolute ${sizeClasses[trend.size]} rounded-full flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-110 cursor-pointer animate-float`}
            style={{
              top: trend.position.top,
              left: trend.position.left,
              animationDelay: `${index * 0.2}s`,
              background: `linear-gradient(135deg, hsl(${239 + index * 15} 84% ${67 + index * 3}%) 0%, hsl(${260 + index * 10} 75% ${60 + index * 3}%) 100%)`,
            }}
          >
            <span className="font-semibold text-primary-foreground leading-tight px-2">{trend.label}</span>
            <span className="text-primary-foreground/80 font-medium mt-0.5">{trend.growth}</span>
          </div>
        ))}

        {/* Connection lines (decorative) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <line x1="45%" y1="35%" x2="25%" y2="55%" stroke="currentColor" strokeWidth="1" className="text-primary" strokeDasharray="4 4" />
          <line x1="55%" y1="35%" x2="70%" y2="65%" stroke="currentColor" strokeWidth="1" className="text-primary" strokeDasharray="4 4" />
          <line x1="25%" y1="55%" x2="45%" y2="80%" stroke="currentColor" strokeWidth="1" className="text-primary" strokeDasharray="4 4" />
        </svg>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        <Button variant="ghost" className="w-full justify-between group">
          <span>Voir la cartographie complète</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  );
};

export default TrendCard;
