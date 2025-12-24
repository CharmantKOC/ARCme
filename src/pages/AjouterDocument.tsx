import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, Calendar, User, Tag, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 Mo

const AjouterDocument = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    year: "",
    department: "",
    keywords: "",
    abstract: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Vous devez être connecté pour soumettre un document");
      return;
    }

    if (!file) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Le fichier ne doit pas dépasser 50 Mo");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🚀 Début de l\'upload...');
      
      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      console.log('📤 Upload du fichier:', fileName);
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        toast.error("Erreur lors du téléchargement du fichier: " + uploadError.message);
        setIsSubmitting(false);
        return;
      }

      console.log('✅ Fichier uploadé:', uploadData);

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      console.log('🔗 URL publique:', publicUrl);

      // 3. Save document metadata to database
      const keywordsArray = formData.keywords.split(',').map(k => k.trim()).filter(k => k);
      
      console.log('💾 Enregistrement des métadonnées...');
      const { error: dbError, data: docData } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          title: formData.title,
          author: formData.author,
          year: parseInt(formData.year),
          category: formData.department,
          keywords: keywordsArray,
          description: formData.abstract,
          file_url: publicUrl,
          file_type: 'application/pdf',
          is_public: true
        })
        .select();

      if (dbError) {
        console.error('❌ Database error:', dbError);
        toast.error("Erreur lors de l'enregistrement: " + dbError.message);
        setIsSubmitting(false);
        return;
      }

      console.log('✅ Document enregistré:', docData);

      // 4. Assign alumni role to user
      console.log('👤 Attribution du rôle alumni...');
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: user.id, 
          role: 'alumni' as const
        }, { 
          onConflict: 'user_id,role' 
        });

      if (roleError) {
        console.error('⚠️ Error assigning alumni role:', roleError);
        // On continue même si le rôle échoue
      }

      // 5. Update profile with graduation info
      console.log('📝 Mise à jour du profil...');
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          institution: formData.department,
          graduation_year: parseInt(formData.year)
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('⚠️ Error updating profile:', profileError);
        // On continue même si la mise à jour échoue
      }

      console.log('🎉 Upload terminé avec succès!');
      toast.success("Document soumis avec succès ! Vous êtes maintenant un alumni.");
      
      // Redirection avec un petit délai pour laisser le toast s'afficher
      setTimeout(() => {
        navigate("/documentation");
      }, 1000);
      
    } catch (error) {
      console.error('❌ Submission error:', error);
      toast.error("Erreur lors de la soumission du document");
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (selectedFile.size > MAX_FILE_SIZE) {
        setFileError("Le fichier ne doit pas dépasser 50 Mo");
        setFile(null);
        e.target.value = '';
        return;
      }
      
      setFile(selectedFile);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4 mx-auto">
              <Upload className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Déposer un mémoire
            </h1>
            <p className="text-muted-foreground">
              Partagez votre travail avec la communauté universitaire
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 space-y-5">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Titre du mémoire
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: L'impact de l'IA sur la logistique urbaine"
                  required
                />
              </div>

              {/* Author & Year */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="author" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Auteur
                  </Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Votre nom complet"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Année
                  </Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="2024"
                    min="2000"
                    max="2030"
                    required
                  />
                </div>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department" className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Département / Filière
                </Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Ex: Sciences de Gestion"
                  required
                />
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <Label htmlFor="keywords" className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Mots-clés
                </Label>
                <Input
                  id="keywords"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="Séparés par des virgules (ex: IA, logistique, supply chain)"
                  required
                />
              </div>

              {/* Abstract */}
              <div className="space-y-2">
                <Label htmlFor="abstract" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Résumé
                </Label>
                <Textarea
                  id="abstract"
                  value={formData.abstract}
                  onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                  placeholder="Décrivez brièvement votre travail de recherche..."
                  rows={4}
                  required
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary" />
                  Document PDF
                </Label>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  fileError ? 'border-destructive bg-destructive/5' : 'border-border hover:border-primary/50'
                }`}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    required
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className={`w-10 h-10 mx-auto mb-3 ${fileError ? 'text-destructive' : 'text-muted-foreground'}`} />
                    {file ? (
                      <div>
                        <p className="text-foreground font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {(file.size / (1024 * 1024)).toFixed(2)} Mo
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-foreground font-medium">Cliquez pour sélectionner un fichier</p>
                        <p className="text-sm text-muted-foreground mt-1">PDF uniquement, max 50 Mo</p>
                      </>
                    )}
                  </label>
                </div>
                {fileError && (
                  <p className="text-sm text-destructive">{fileError}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" variant="hero" className="w-full gap-2" disabled={isSubmitting || !!fileError}>
              <Upload className="w-4 h-4" />
              {isSubmitting ? "Soumission en cours..." : "Soumettre le mémoire"}
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AjouterDocument;
