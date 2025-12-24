import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

// Assistant IA - Version simplifiée et fonctionnelle
interface Message {
  role: "user" | "assistant";
  content: string;
}

const AssistantIA = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const searchAndRespond = async (userQuery: string) => {
    console.log("🔍 Recherche pour:", userQuery);

    // 1. Récupérer TOUS les documents
    const { data: allDocs } = await supabase
      .from('documents')
      .select('*');

    if (!allDocs || allDocs.length === 0) {
      return "Aucun document trouvé dans la base de données.";
    }

    console.log("📚 Total documents:", allDocs.length);

    // 2. Recherche par mots-clés
    const keywords = userQuery.toLowerCase().split(' ').filter(k => k.length > 2);
    console.log("🔑 Mots-clés:", keywords);

    const results = allDocs.filter(doc => {
      const text = `${doc.title} ${doc.author} ${doc.abstract || ''} ${doc.domain}`.toLowerCase();
      return keywords.some(kw => text.includes(kw));
    });

    console.log("✅ Documents trouvés:", results.length);

    // 3. Générer la réponse
    if (results.length === 0) {
      return `Aucun document trouvé pour "${userQuery}".\n\nEssayez avec d'autres mots-clés.`;
    }

    let response = `📚 J'ai trouvé ${results.length} document(s):\n\n`;
    
    results.slice(0, 5).forEach((doc, i) => {
      response += `${i + 1}. **${doc.title}**\n`;
      response += `   Par ${doc.author} (${doc.year})\n`;
      response += `   Domaine: ${doc.domain}\n\n`;
    });

    return response;
  };

  const handleSend = async () => {
    console.log("🚀 Envoi de la question:", query);
    
    if (!query.trim()) {
      console.log("⚠️ Question vide");
      return;
    }

    // Ajouter le message utilisateur
    const userMsg: Message = { role: "user", content: query };
    setMessages(prev => [...prev, userMsg]);
    
    const currentQuery = query;
    setQuery("");
    setLoading(true);

    try {
      // Rechercher et générer la réponse
      const response = await searchAndRespond(currentQuery);
      
      // Ajouter la réponse
      const botMsg: Message = { role: "assistant", content: response };
      setMessages(prev => [...prev, botMsg]);
      
      console.log("✅ Réponse ajoutée");
    } catch (error) {
      console.error("❌ Erreur:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Erreur lors de la recherche." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-24 pb-8">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Assistant IA</span>
              </div>
              <Badge variant="secondary">🆓 100% Gratuit</Badge>
            </div>
            <h1 className="text-3xl font-bold mb-2">Assistant IA - Recherche Intelligente</h1>
            <p className="text-muted-foreground">
              Posez vos questions sur les mémoires académiques
            </p>
          </div>

          {/* Zone de conversation */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-4 min-h-[400px] max-h-[500px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Bot className="w-16 h-16 text-primary/30 mb-4" />
                <p className="text-muted-foreground">
                  Posez une question pour commencer
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="whitespace-pre-line text-sm">{msg.content}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="bg-muted rounded-2xl p-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Zone de saisie */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex gap-3">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Posez votre question..."
                className="min-h-[60px] resize-none"
                disabled={loading}
              />
              <Button
                onClick={handleSend}
                disabled={!query.trim() || loading}
                className="px-6"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AssistantIA;
