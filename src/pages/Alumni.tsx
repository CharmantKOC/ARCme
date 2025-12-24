import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MultiSelect } from "@/components/MultiSelect";
import { Users, Search, Linkedin, Mail, MapPin, Briefcase, GraduationCap, Filter, Loader2, FileText, Building, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AlumniProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  institution: string | null;
  department: string | null;
  graduation_year: number | null;
  phone: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  preferred_contact: string | null;
  documents: Array<{
    id: string;
    title: string;
    category: string | null;
  }>;
}

const Alumni = () => {
  const navigate = useNavigate();
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [filteredAlumni, setFilteredAlumni] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchAlumni();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [alumni, searchQuery, yearFilter, departmentFilter, categoryFilters]);

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      // Get all users who have uploaded at least one document (public or private)
      const { data: documentsData, error: docsError } = await supabase
        .from('documents')
        .select('user_id');

      if (docsError) {
        console.error('Error fetching documents:', docsError);
        throw docsError;
      }

      // Get unique user IDs
      const alumniUserIds = [...new Set(documentsData?.map(d => d.user_id) || [])];

      console.log('Found users with documents:', alumniUserIds.length);

      if (alumniUserIds.length === 0) {
        setAlumni([]);
        setFilteredAlumni([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for users with documents
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', alumniUserIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('Found profiles:', profiles?.length);

      // Fetch documents for each alumni
      const alumniWithDocs = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: docs } = await supabase
            .from('documents')
            .select('id, title, category')
            .eq('user_id', profile.user_id);

          return {
            ...profile,
            documents: docs || []
          };
        })
      );

      setAlumni(alumniWithDocs);
      
      // Extract unique years, departments, and categories for filters
      const uniqueYears = [...new Set(
        alumniWithDocs
          .map(a => a.graduation_year)
          .filter(Boolean) as number[]
      )].sort((a, b) => b - a);
      
      const uniqueDepartments = [...new Set(
        alumniWithDocs
          .map(a => a.department)
          .filter(Boolean) as string[]
      )].sort();

      const uniqueCategories = [...new Set(
        alumniWithDocs
          .flatMap(a => a.documents.map(d => d.category))
          .filter(Boolean) as string[]
      )].sort();

      setYears(uniqueYears);
      setDepartments(uniqueDepartments);
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching alumni:', error);
      toast.error("Erreur lors du chargement des alumni");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...alumni];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(a =>
        a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.documents.some(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Year filter
    if (yearFilter && yearFilter !== 'all') {
      filtered = filtered.filter(a => a.graduation_year?.toString() === yearFilter);
    }

    // Department filter
    if (departmentFilter && departmentFilter !== 'all') {
      filtered = filtered.filter(a => a.department?.toLowerCase().includes(departmentFilter.toLowerCase()));
    }

    // Category filters (multi-select)
    if (categoryFilters.length > 0) {
      filtered = filtered.filter(a => 
        a.documents.some(d => d.category && categoryFilters.includes(d.category))
      );
    }

    setFilteredAlumni(filtered);
  };

  const handleContact = (alumniId: string) => {
    navigate(`/messagerie/${alumniId}`);
  };

  const handleViewDocuments = (alumniId: string) => {
    navigate('/documentation', { state: { alumniFilter: alumniId } });
  };
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-7xl">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Connectez-vous avec notre réseau
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Échangez avec les membres du réseau, découvrez leurs parcours professionnels et bénéficiez de leur expertise dans votre domaine de recherche.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="text-center p-6 rounded-xl bg-card border border-border">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{alumni.length}</div>
              <div className="text-sm text-muted-foreground">Membres</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-card border border-border">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{departments.length}</div>
              <div className="text-sm text-muted-foreground">Départements</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-card border border-border">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1">
                {alumni.reduce((sum, a) => sum + a.documents.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Documents</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-card border border-border">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{years.length}</div>
              <div className="text-sm text-muted-foreground">Promotions</div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-8 shadow-soft">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher par nom ou département..." 
                  className="pl-10 h-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-full md:w-48 h-12">
                  <SelectValue placeholder="Promotion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full md:w-48 h-12">
                  <SelectValue placeholder="Département" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <MultiSelect
                options={categories}
                selected={categoryFilters}
                onChange={setCategoryFilters}
                placeholder="Domaines"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Alumni Grid */}
          {!loading && filteredAlumni.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAlumni.map((person, index) => (
                <div
                  key={person.user_id}
                  className="group bg-card rounded-2xl border border-border p-6 hover:shadow-medium hover:border-primary/20 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="w-14 h-14 border-2 border-primary/20">
                      {person.avatar_url ? (
                        <AvatarImage src={person.avatar_url} />
                      ) : (
                        <AvatarFallback className="text-lg">
                          {person.full_name ? person.full_name.split(" ").map(n => n[0]).join("") : "??"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {person.full_name || "Anonyme"}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {person.department || "Non renseigné"}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {person.institution && (
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {person.institution}
                          </span>
                        )}
                        {person.graduation_year && (
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" />
                            {person.graduation_year}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {person.bio && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {person.bio}
                    </p>
                  )}

                  {person.documents.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          {person.documents.length} document(s)
                        </span>
                      </div>
                      <div className="space-y-1">
                        {person.documents.slice(0, 2).map(doc => (
                          <p key={doc.id} className="text-xs text-muted-foreground line-clamp-1">
                            • {doc.title}
                          </p>
                        ))}
                        {person.documents.length > 2 && (
                          <p className="text-xs text-primary">
                            +{person.documents.length - 2} autre(s)
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact Methods */}
                  {(person.phone || person.linkedin_url || person.website_url) && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {person.email && (
                        <Badge variant="secondary" className="text-xs">
                          <Mail className="w-3 h-3 mr-1" />
                          Email
                        </Badge>
                      )}
                      {person.phone && (
                        <Badge variant="secondary" className="text-xs">
                          <Phone className="w-3 h-3 mr-1" />
                          Tél
                        </Badge>
                      )}
                      {person.linkedin_url && (
                        <Badge variant="secondary" className="text-xs">
                          <Linkedin className="w-3 h-3 mr-1" />
                          LinkedIn
                        </Badge>
                      )}
                      {person.website_url && (
                        <Badge variant="secondary" className="text-xs">
                          <Globe className="w-3 h-3 mr-1" />
                          Site web
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleContact(person.user_id)}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Contacter
                    </Button>
                    {person.documents.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocuments(person.user_id)}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredAlumni.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {alumni.length === 0 ? "Aucun alumni trouvé" : "Aucun résultat"}
              </h3>
              <p className="text-muted-foreground">
                {alumni.length === 0 
                  ? "Aucun diplômé n'est encore inscrit sur la plateforme."
                  : "Essayez de modifier vos critères de recherche."}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Alumni;
