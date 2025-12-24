import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Zap, 
  Database, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { processNewDocument, processAllDocuments, getRAGStatistics } from '@/lib/rag';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  title: string;
  file_path: string | null;
  file_url: string | null;
  file_type: string | null;
  category: string | null;
  created_at: string;
}

interface RAGStats {
  totalDocuments: number;
  processedDocuments: number;
  totalChunks: number;
  averageChunksPerDocument: number;
}

export default function AdminRAG() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<RAGStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentDoc, setCurrentDoc] = useState<string>('');
  const { toast } = useToast();

  // Charger les documents non traités et les stats
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger tous les documents
      const { data: allDocs, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (docsError) throw docsError;

      // Charger les documents déjà traités
      const { data: processedDocs, error: processedError } = await supabase
        .from('document_chunks')
        .select('document_id');

      if (processedError) throw processedError;

      const processedIds = new Set(processedDocs?.map(d => d.document_id) || []);
      const unprocessedDocs = (allDocs || []).filter(d => !processedIds.has(d.id));

      setDocuments(unprocessedDocs);

      // Charger les statistiques
      const statistics = await getRAGStatistics();
      setStats(statistics);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Traiter un seul document
  const handleProcessDocument = async (documentId: string) => {
    setProcessing(true);
    setCurrentDoc(documentId);
    
    try {
      await processNewDocument(documentId);
      
      toast({
        title: 'Succès',
        description: 'Document traité avec succès',
      });
      
      // Recharger les données
      await loadData();
      
    } catch (error) {
      console.error('Error processing document:', error);
      toast({
        title: 'Erreur',
        description: `Échec du traitement: ${error}`,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
      setCurrentDoc('');
    }
  };

  // Traiter tous les documents
  const handleProcessAll = async () => {
    if (documents.length === 0) {
      toast({
        title: 'Info',
        description: 'Aucun document à traiter',
      });
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      for (let i = 0; i < documents.length; i++) {
        setCurrentDoc(documents[i].title);
        await processNewDocument(documents[i].id);
        setProgress(((i + 1) / documents.length) * 100);
      }

      toast({
        title: 'Succès',
        description: `${documents.length} documents traités avec succès`,
      });

      await loadData();

    } catch (error) {
      console.error('Error processing documents:', error);
      toast({
        title: 'Erreur',
        description: `Échec du traitement: ${error}`,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
      setProgress(0);
      setCurrentDoc('');
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administration RAG</h1>
          <p className="text-muted-foreground">
            Gestion du système de recherche sémantique
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Documents
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">
                Documents dans la base
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Documents Traités
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.processedDocuments}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.processedDocuments / stats.totalDocuments) * 100).toFixed(0)}% du total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Chunks Générés
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalChunks}</div>
              <p className="text-xs text-muted-foreground">
                ~{stats.averageChunksPerDocument} par document
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Embedding Provider
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {import.meta.env.VITE_OPENAI_API_KEY ? 'OpenAI' : 'Mock'}
              </div>
              <p className="text-xs text-muted-foreground">
                Mode actif
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Processing Status */}
      {processing && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            <div className="space-y-2">
              <p>Traitement en cours : {currentDoc}</p>
              {progress > 0 && (
                <Progress value={progress} className="w-full" />
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="unprocessed" className="w-full">
        <TabsList>
          <TabsTrigger value="unprocessed">
            À Traiter ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="batch">
            Traitement en Lot
          </TabsTrigger>
          <TabsTrigger value="settings">
            Configuration
          </TabsTrigger>
        </TabsList>

        {/* Unprocessed Documents */}
        <TabsContent value="unprocessed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents Non Traités</CardTitle>
              <CardDescription>
                Ces documents n'ont pas encore été vectorisés pour la recherche sémantique
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>Tous les documents sont traités !</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-medium">{doc.title}</h3>
                          <Badge variant="outline">{doc.file_type || 'PDF'}</Badge>
                          {doc.category && (
                            <Badge variant="secondary">{doc.category}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Ajouté le {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleProcessDocument(doc.id)}
                        disabled={processing}
                        size="sm"
                      >
                        {processing && currentDoc === doc.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4 mr-2" />
                        )}
                        Traiter
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batch Processing */}
        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traitement en Lot</CardTitle>
              <CardDescription>
                Traiter plusieurs documents à la fois pour accélérer le processus
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Le traitement en lot peut prendre plusieurs minutes selon le nombre
                  de documents. Ne fermez pas cette page pendant le traitement.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Documents à traiter</p>
                    <p className="text-sm text-muted-foreground">
                      {documents.length} documents non vectorisés
                    </p>
                  </div>
                  <Button
                    onClick={handleProcessAll}
                    disabled={processing || documents.length === 0}
                    size="lg"
                  >
                    {processing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    Tout Traiter
                  </Button>
                </div>
              </div>

              {processing && progress > 0 && (
                <div className="space-y-2 pt-4">
                  <div className="flex justify-between text-sm">
                    <span>Progression</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration du RAG</CardTitle>
              <CardDescription>
                Paramètres du système de recherche sémantique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Mode d'Embeddings</h4>
                <p className="text-sm text-muted-foreground">
                  Actuellement : {import.meta.env.VITE_OPENAI_API_KEY ? 'OpenAI' : 'Mock'}
                </p>
                <Alert>
                  <AlertDescription>
                    {import.meta.env.VITE_OPENAI_API_KEY ? (
                      <>
                        ✅ Utilisation des embeddings OpenAI pour une recherche précise
                      </>
                    ) : (
                      <>
                        ⚠️ Mode Mock activé. Ajoutez VITE_OPENAI_API_KEY dans .env.local
                        pour utiliser de vrais embeddings
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Paramètres Actuels</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Taille des chunks</p>
                    <p className="font-medium">1000 caractères</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Overlap</p>
                    <p className="font-medium">200 caractères</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Modèle embedding</p>
                    <p className="font-medium">text-embedding-3-small</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Dimensions</p>
                    <p className="font-medium">1536</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
