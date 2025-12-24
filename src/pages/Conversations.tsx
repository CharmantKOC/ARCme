import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Search, Loader2, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingAIButton from "@/components/FloatingAIButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ConversationWithProfile {
  id: string;
  participant_one: string;
  participant_two: string;
  updated_at: string;
  other_user: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
  last_message: {
    content: string;
    created_at: string;
    sender_id: string;
  } | null;
  unread_count: number;
}

const Conversations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      fetchConversations();
      subscribeToConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch all conversations where user is a participant
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      // For each conversation, fetch the other user's profile and last message
      const conversationsWithDetails = await Promise.all(
        (convData || []).map(async (conv) => {
          const otherUserId = conv.participant_one === user.id 
            ? conv.participant_two 
            : conv.participant_one;

          // Fetch other user's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url, email')
            .eq('user_id', otherUserId)
            .single();

          // Fetch last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Count unread messages (messages not from current user and not read)
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .is('read_at', null);

          return {
            ...conv,
            other_user: profile,
            last_message: lastMsg,
            unread_count: unreadCount || 0
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error("Erreur lors du chargement des conversations");
    } finally {
      setLoading(false);
    }
  };

  const subscribeToConversations = () => {
    if (!user) return;

    // Subscribe to new messages in any conversation
    const channel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchConversations(); // Refresh on any message change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleConversationClick = (conv: ConversationWithProfile) => {
    if (conv.other_user) {
      navigate(`/messagerie/${conv.other_user.user_id}`);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "À l'instant";
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
    if (seconds < 172800) return "Hier";
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const filteredConversations = conversations.filter(conv => 
    conv.other_user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.other_user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <MessageSquare className="w-8 h-8 text-primary" />
                  Messagerie
                </h1>
                <p className="text-muted-foreground mt-2">
                  {totalUnread > 0 
                    ? `${totalUnread} message${totalUnread > 1 ? 's' : ''} non lu${totalUnread > 1 ? 's' : ''}`
                    : 'Aucun nouveau message'
                  }
                </p>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
              </Badge>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Rechercher une conversation..." 
                className="pl-10 h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Conversations List */}
          {!loading && filteredConversations.length > 0 && (
            <div className="space-y-2">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleConversationClick(conv)}
                  className={`w-full bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-soft transition-all duration-200 ${
                    conv.unread_count > 0 ? 'border-primary/20 bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      {conv.other_user?.avatar_url ? (
                        <AvatarImage src={conv.other_user.avatar_url} />
                      ) : (
                        <AvatarFallback>
                          {conv.other_user?.full_name?.charAt(0) || conv.other_user?.email?.charAt(0) || '?'}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold truncate ${
                          conv.unread_count > 0 ? 'text-foreground' : 'text-foreground/80'
                        }`}>
                          {conv.other_user?.full_name || conv.other_user?.email || 'Utilisateur inconnu'}
                        </h3>
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {conv.last_message ? getTimeAgo(conv.last_message.created_at) : getTimeAgo(conv.updated_at)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${
                          conv.unread_count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                        }`}>
                          {conv.last_message ? (
                            <>
                              {conv.last_message.sender_id === user?.id && 'Vous: '}
                              {conv.last_message.content}
                            </>
                          ) : (
                            'Aucun message'
                          )}
                        </p>
                        {conv.unread_count > 0 && (
                          <Badge className="ml-2 flex-shrink-0 bg-primary text-primary-foreground">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredConversations.length === 0 && (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {conversations.length === 0 ? "Aucune conversation" : "Aucun résultat"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {conversations.length === 0 
                  ? "Commencez à échanger avec les alumni depuis la page Alumni"
                  : "Essayez de modifier votre recherche"}
              </p>
              {conversations.length === 0 && (
                <Button 
                  variant="hero"
                  onClick={() => navigate('/alumni')}
                >
                  Voir les Alumni
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Conversations;
