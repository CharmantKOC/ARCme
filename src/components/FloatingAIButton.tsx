import { useState } from "react";
import { Sparkles, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingAIButtonProps {
  children: React.ReactNode;
}

const FloatingAIButton = ({ children }: FloatingAIButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className={cn(
        "flex-1 transition-all duration-300",
        isOpen ? "w-3/4" : "w-full"
      )}>
        {children}
      </div>

      {/* AI Panel */}
      <div className={cn(
        "fixed right-0 top-16 bottom-0 bg-card border-l border-border shadow-xl transition-all duration-300 flex flex-col",
        isOpen ? "w-1/4 min-w-[320px]" : "w-0 overflow-hidden"
      )}>
        {/* Panel Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Assistant IA</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                Bonjour ! Je suis votre assistant IA. Comment puis-je vous aider dans votre recherche ?
              </p>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Posez votre question..."
              className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button size="sm" className="gradient-primary">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full gradient-primary shadow-glow hover:scale-110 transition-transform z-50"
        >
          <Sparkles className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
};

export default FloatingAIButton;
