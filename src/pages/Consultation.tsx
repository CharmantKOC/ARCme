import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  FileText, Send, Share2, User, Calendar, Tag, ChevronRight, Sparkles,
  MessageSquare, Loader2, Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import PDFViewer from "@/components/PDFViewer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Document {
  id: string;
  title: string;
  author: string | null;
  year: number | null;
  category: string | null;
  keywords: string[] | null;
  description: string | null;
  file_url: string | null;
  user_id: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const Consultation = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const documentId = location.state?.documentId;

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (documentId && documents.length > 0) {
      const doc = documents.find(d => d.id === documentId);
      if (doc) {
        handleDocumentSelect(doc);
      }
    } else if (documents.length > 0 && !selectedDocument) {
      handleDocumentSelect(documents[0]);
    }
  }, [documentId, documents]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error("Erreur lors du chargement des documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDocumentSelect = async (doc: Document) => {
    setSelectedDocument(doc);
    setMessages([]); // Reset conversation when changing document
    
    // Generate a signed URL for the PDF if file_url exists
    if (doc.file_url) {
      try {
        const urlParts = doc.file_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const userId = urlParts[urlParts.length - 2];
        const filePath = `${userId}/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(filePath, 3600); // 1 hour expiry
        
        if (data?.signedUrl) {
          // Update the document with signed URL for viewing
          setSelectedDocument({ ...doc, file_url: data.signedUrl });
        }
      } catch (error) {
        console.error('Error generating signed URL:', error);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedDocument || sending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setSending(true);

    try {
      // Simulate AI response (replace with actual AI call later)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Je suis là pour vous aider à analyser "${selectedDocument.title}". Que souhaitez-vous savoir ?`,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setSending(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "Il y a quelques secondes";
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
    return `Il y a ${Math.floor(seconds / 86400)} j`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!selectedDocument) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aucun document disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 h-screen">
          <div className="flex h-[calc(100vh-4rem)]">
            {/* Left Panel - Document Viewer */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Document Header */}
              <div className="p-4 border-b border-border bg-secondary/30 flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-foreground">{selectedDocument.title}</h1>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {selectedDocument.author && (
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {selectedDocument.author}
                        </span>
                      )}
                      {selectedDocument.year && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {selectedDocument.year}
                        </span>
                      )}
                      {selectedDocument.category && (
                        <span className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          {selectedDocument.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link to={`/messagerie/${selectedDocument.user_id}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <User className="w-4 h-4" />
                      Contacter l'auteur
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Document Content - PDF Viewer */}
              <div className="flex-1 overflow-hidden">
                {selectedDocument.file_url ? (
                  <PDFViewer 
                    fileUrl={selectedDocument.file_url} 
                    title={selectedDocument.title}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucun fichier PDF disponible</p>
                      {selectedDocument.description && (
                        <div className="mt-6 max-w-xl mx-auto">
                          <h3 className="font-semibold text-foreground mb-2">Résumé</h3>
                          <p className="text-sm text-muted-foreground">{selectedDocument.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - AI Chat */}
            <div className="w-[480px] border-l border-border bg-card flex flex-col">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Assistant IA
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Posez vos questions sur le document</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Bot className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">Commencez une conversation</p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      Posez des questions sur le document, demandez des résumés ou des explications
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-foreground'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {getTimeAgo(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Posez votre question..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="min-h-[60px] max-h-[120px] resize-none text-sm"
                    disabled={sending}
                  />
                  <Button 
                    size="sm" 
                    className="gradient-primary self-end"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || sending}
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
    </div>
  );
};

export default Consultation;
