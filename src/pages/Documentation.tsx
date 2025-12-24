import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Database, Search, Filter, Download, FileText, Calendar, User, Tag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
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
  created_at: string;
}

const Documentation = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, author, year, category, keywords, description, file_url, user_id, created_at')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
      
      // Extract unique categories and years for filters
      const uniqueCategories = [...new Set(data?.map(d => d.category).filter(Boolean) as string[])];
      const uniqueYears = [...new Set(data?.map(d => d.year).filter(Boolean) as number[])].sort((a, b) => b - a);
      
      setCategories(uniqueCategories);
      setYears(uniqueYears);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error("Erreur lors du chargement des documents");
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = searchQuery === "" || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.author && doc.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.keywords && doc.keywords.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesYear = yearFilter === "" || yearFilter === "all" || doc.year?.toString() === yearFilter;
    const matchesCategory = categoryFilter === "" || categoryFilter === "all" || doc.category?.toLowerCase().includes(categoryFilter.toLowerCase());

    return matchesSearch && matchesYear && matchesCategory;
  });

  const handleConsult = (documentId: string) => {
    navigate("/consultation", { state: { documentId } });
  };

  const handleDownload = async (doc: Document) => {
    if (!doc.file_url) {
      toast.error("Ce document n'a pas de fichier associé");
      return;
    }

    try {
      // Since bucket is now public, we can download directly
      const response = await fetch(doc.file_url);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Téléchargement démarré");
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Erreur lors du téléchargement");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-7xl">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Explorez notre collection de mémoires
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Accédez à plus de 10 ans d'archives académiques. Filtrez par année, domaine ou mots-clés pour trouver les travaux qui vous intéressent.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-8 shadow-soft">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher par titre, auteur ou mot-clé..." 
                  className="pl-10 h-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-full md:w-48 h-12">
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les années</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48 h-12">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="h-12 gap-2">
                <Filter className="w-4 h-4" />
                Plus de filtres
              </Button>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">{filteredDocuments.length}</span> mémoires trouvés
            </p>
            <Button variant="ghost" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Exporter les résultats
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Documents Grid */}
          {!loading && (
            <div className="grid gap-4">
              {filteredDocuments.map((doc, index) => (
                <div 
                  key={doc.id}
                  className="group bg-card hover:bg-accent/5 rounded-xl border border-border p-6 transition-all duration-300 hover:shadow-medium hover:border-primary/20 animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                        {doc.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        {doc.author && (
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {doc.author}
                          </span>
                        )}
                        {doc.year && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {doc.year}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {doc.category && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                            {doc.category}
                          </Badge>
                        )}
                        {doc.keywords?.slice(0, 2).map((keyword) => (
                          <Badge key={keyword} variant="outline" className="text-muted-foreground">
                            <Tag className="w-3 h-3 mr-1" />
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-shrink-0"
                        onClick={() => handleConsult(doc.id)}
                      >
                        Consulter
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Aucun mémoire trouvé</h3>
              <p className="text-muted-foreground">
                {documents.length === 0 
                  ? "Aucun document n'a encore été déposé dans la base."
                  : "Aucun document ne correspond à votre recherche."}
              </p>
            </div>
          )}

          {/* Load More */}
          {!loading && filteredDocuments.length > 0 && filteredDocuments.length >= 10 && (
            <div className="text-center mt-8">
              <Button variant="outline" size="lg">
                Charger plus de résultats
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Documentation;