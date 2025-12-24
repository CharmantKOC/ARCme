import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  User, Mail, Building, Calendar, Upload, Save, 
  Search, MessageSquare, BarChart3, Clock, ChevronRight,
  FileText, TrendingUp, Loader2, Phone, Linkedin, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getUserSessions, ResearchSession } from "@/lib/sessionHelpers";

interface Profile {
  full_name: string | null;
  email: string | null;
  institution: string | null;
  department: string | null;
  bio: string | null;
  avatar_url: string | null;
  graduation_year: number | null;
  phone: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  preferred_contact: string | null;
}

interface Stats {
  sessionsCount: number;
  documentsRead: number;
  documentsUploaded: number;
  conversationsCount: number;
}

const Profil = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    email: '',
    institution: '',
    department: '',
    bio: '',
    avatar_url: '',
    graduation_year: null,
    phone: null,
    linkedin_url: null,
    website_url: null,
    preferred_contact: 'email'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [stats, setStats] = useState<Stats>({
    sessionsCount: 0,
    documentsRead: 0,
    documentsUploaded: 0,
    conversationsCount: 0
  });
  const [recentSessions, setRecentSessions] = useState<ResearchSession[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
      fetchRecentSessions();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          full_name: data.full_name,
          email: data.email,
          institution: data.institution,
          department: data.department,
          bio: data.bio,
          avatar_url: data.avatar_url,
          graduation_year: data.graduation_year,
          phone: data.phone,
          linkedin_url: data.linkedin_url,
          website_url: data.website_url,
          preferred_contact: data.preferred_contact || 'email'
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Count sessions
      const { count: sessionsCount } = await supabase
        .from('research_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Count documents uploaded
      const { count: documentsUploaded } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Count conversations
      const { count: conversationsCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`);

      setStats({
        sessionsCount: sessionsCount || 0,
        documentsRead: 0, // Would need to track this separately
        documentsUploaded: documentsUploaded || 0,
        conversationsCount: conversationsCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentSessions = async () => {
    if (!user) return;

    try {
      const sessions = await getUserSessions(user.id);
      setRecentSessions(sessions.slice(0, 5));
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          institution: profile.institution,
          department: profile.department,
          bio: profile.bio,
          graduation_year: profile.graduation_year,
          phone: profile.phone,
          linkedin_url: profile.linkedin_url,
          website_url: profile.website_url,
          preferred_contact: profile.preferred_contact
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success("Profil mis à jour avec succès !");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Erreur lors de la mise à jour du profil");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    setUploadingAvatar(true);

    try {
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      
      // Déclencher un événement personnalisé pour notifier le Header
      window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { avatarUrl: publicUrl } }));
      
      toast.success("Avatar mis à jour !");
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error("Erreur lors du téléchargement de l'avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-5xl">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" />
                Profil
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <Clock className="w-4 h-4" />
                Historique
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Insights
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Mon Profil</h2>
                
                {/* Avatar Upload */}
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      {profile.avatar_url ? (
                        <AvatarImage src={profile.avatar_url} />
                      ) : (
                        <AvatarFallback className="text-2xl">
                          {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <label 
                      htmlFor="avatar-upload"
                      className={`absolute bottom-0 right-0 w-8 h-8 rounded-full gradient-primary flex items-center justify-center cursor-pointer ${uploadingAvatar ? 'opacity-50' : ''}`}
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 text-primary-foreground" />
                      )}
                      <input 
                        type="file" 
                        id="avatar-upload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                      />
                    </label>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{profile.full_name || user?.email}</p>
                    <p className="text-sm text-muted-foreground">{profile.department || 'Non renseigné'}</p>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      Nom complet
                    </Label>
                    <Input
                      id="full_name"
                      value={profile.full_name || ''}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email || user?.email || ''}
                      disabled
                      className="bg-secondary"
                    />
                    <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="institution" className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-primary" />
                        Institution
                      </Label>
                      <Input
                        id="institution"
                        value={profile.institution || ''}
                        onChange={(e) => setProfile({ ...profile, institution: e.target.value })}
                        placeholder="Ex: Université Paris-Dauphine"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Département</Label>
                      <Input
                        id="department"
                        value={profile.department || ''}
                        onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                        placeholder="Ex: Sciences de Gestion"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="graduation_year" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      Année de diplomation
                    </Label>
                    <Input
                      id="graduation_year"
                      type="number"
                      value={profile.graduation_year || ''}
                      onChange={(e) => setProfile({ ...profile, graduation_year: parseInt(e.target.value) || null })}
                      placeholder="2024"
                      min="2000"
                      max="2030"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio || ''}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      rows={3}
                      placeholder="Parlez de vous, votre parcours, vos intérêts..."
                    />
                  </div>

                  {/* Contact Information Section */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      Informations de contact
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-primary" />
                          Téléphone
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={profile.phone || ''}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          placeholder="+33 6 12 34 56 78"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                          <Linkedin className="w-4 h-4 text-primary" />
                          LinkedIn
                        </Label>
                        <Input
                          id="linkedin_url"
                          type="url"
                          value={profile.linkedin_url || ''}
                          onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                          placeholder="https://linkedin.com/in/votre-profil"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website_url" className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        Site web personnel
                      </Label>
                      <Input
                        id="website_url"
                        type="url"
                        value={profile.website_url || ''}
                        onChange={(e) => setProfile({ ...profile, website_url: e.target.value })}
                        placeholder="https://votre-site.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preferred_contact">Moyen de contact préféré</Label>
                      <select
                        id="preferred_contact"
                        value={profile.preferred_contact || 'email'}
                        onChange={(e) => setProfile({ ...profile, preferred_contact: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="email">Email</option>
                        <option value="phone">Téléphone</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="website">Site web</option>
                      </select>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Ces informations seront visibles par les autres utilisateurs dans la section Réseau
                    </p>
                  </div>

                  <Button onClick={handleSave} variant="hero" className="gap-2" disabled={saving}>
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? "Sauvegarde..." : "Sauvegarder"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Research Sessions */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-primary" />
                    Sessions de recherche
                  </h2>
                  {recentSessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Aucune session pour le moment</p>
                  ) : (
                    <div className="space-y-3">
                      {recentSessions.map((session) => (
                        <Link
                          key={session.id}
                          to="/consultation"
                          state={{ sessionId: session.id }}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{session.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {session.document_ids?.length || 0} documents • {getTimeAgo(session.updated_at)}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Documents Uploaded */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Mes documents
                  </h2>
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-3xl font-bold text-foreground mb-1">{stats.documentsUploaded}</p>
                    <p className="text-sm text-muted-foreground">Document(s) déposé(s)</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Mes Statistiques</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-secondary/50 rounded-xl p-5 text-center">
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center mx-auto mb-3">
                      <Search className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">{stats.sessionsCount}</p>
                    <p className="text-sm text-muted-foreground">Sessions</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-5 text-center">
                    <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 text-background" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">{stats.documentsUploaded}</p>
                    <p className="text-sm text-muted-foreground">Documents déposés</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-5 text-center">
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center mx-auto mb-3">
                      <User className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">{stats.conversationsCount}</p>
                    <p className="text-sm text-muted-foreground">Conversations</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-5 text-center">
                    <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 text-background" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">{stats.documentsRead}</p>
                    <p className="text-sm text-muted-foreground">Documents consultés</p>
                  </div>
                </div>

                {/* Usage Chart Placeholder */}
                <div className="mt-8">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Activité récente
                  </h3>
                  <div className="bg-secondary/30 rounded-xl p-8 text-center">
                    <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Graphique d'activité à venir...</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profil;
