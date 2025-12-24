import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  FileText, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Play,
  RefreshCw
} from 'lucide-react';
import { getRAGService, isRAGEnabled, getRAGMode } from '@/lib/rag';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Document {
  id: string;
  title: string;
  author: string;
  file_path: string;
}

const RAGAdminPanel = () => {
  const [stats, setStats] = useState<any>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentDoc, setCurrentDoc] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les stats RAG
      const ragService = getRAGService({ embeddingProvider: getRAGMode() });
      const ragStats = await ragService.getRAGStats();
      setStats(ragStats);

      // Charger les documents non traités
      const { data: allDocs } = await supabase
        .from('documents')
        .select('id, title, author, file_path');

      const { data: processedDocs } = await supabase
        .from('document_chunks')
        .select('document_id');

      const processedIds = new Set(processedDocs?.map(d => d.document_id) || []);
      const unprocessedDocs = (allDocs || []).filter(d => !processedIds.has(d.id));

      setDocuments(unprocessedDocs);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const processSingleDocument = async (documentId: string, title: string) => {
    try {
      setProcessing(true);
      setCurrentDoc(title);
      
      const ragService = getRAGService({
        embeddingProvider: getRAGMode(),
        openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY
      });

      await ragService.processNewDocument(documentId);
      
      toast.success(`Document traité avec succès: ${title}`);
      await loadData();
    } catch (error) {
      console.error('Error processing document:', error);
      toast.error(`Erreur lors du traitement: ${title}`);
    } finally {
      setProcessing(false);
      setCurrentDoc('');
    }
  };

  const processAllDocuments = async () => {
    if (documents.length === 0) {
      toast.info('Aucun document à traiter');
      return;
    }

    try {
      setProcessing(true);
      setProgress(0);

      const ragService = getRAGService({
        embeddingProvider: getRAGMode(),
        openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY
      });

      await ragService.processAllDocuments((current, total) => {
        const percentage = Math.round((current / total) * 100);
        setProgress(percentage);
      });

      toast.success('Tous les documents ont été traités !');
      await loadData();
    } catch (error) {
      console.error('Error processing all documents:', error);
      toast.error('Erreur lors du traitement en batch');
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Panneau d'Administration RAG</h2>
          <p className="text-muted-foreground">Gestion du système de recherche sémantique</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={isRAGEnabled() ? 'default' : 'secondary'}>
            {isRAGEnabled() ? '✓ RAG Activé' : '○ RAG Désactivé'}
          </Badge>
          <Badge variant="outline">
            {getRAGMode() === 'openai' ? 'OpenAI' : 'Mock Mode'}
          </Badge>
        </div>
      </div>

      {!isRAGEnabled() && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Le système RAG est en mode mock. Ajoutez VITE_OPENAI_API_KEY dans .env.local pour activer OpenAI.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Documents Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{stats?.totalDocuments || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Documents Indexés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-2xl font-bold">{stats?.processedDocuments || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chunks Totaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold">{stats?.totalChunks || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Moyenne Chunks/Doc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="text-2xl font-bold">{stats?.averageChunksPerDocument || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Processing */}
      <Card>
        <CardHeader>
          <CardTitle>Traitement en Batch</CardTitle>
          <CardDescription>
            Traiter tous les documents non indexés ({documents.length} document{documents.length > 1 ? 's' : ''})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {processing && progress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progression</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} />
              {currentDoc && (
                <p className="text-sm text-muted-foreground">
                  Traitement: {currentDoc}
                </p>
              )}
            </div>
          )}
          
          <div className="flex gap-3">
            <Button
              onClick={processAllDocuments}
              disabled={processing || documents.length === 0}
              className="gap-2"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Traiter tous les documents
            </Button>
            
            <Button
              variant="outline"
              onClick={loadData}
              disabled={processing}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Unprocessed Documents List */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documents Non Indexés</CardTitle>
            <CardDescription>
              Documents en attente de traitement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">{doc.author}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => processSingleDocument(doc.id, doc.title)}
                    disabled={processing}
                  >
                    {processing && currentDoc === doc.title ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Traiter'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {documents.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">
              Tous les documents sont indexés !
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Le système RAG est prêt à fonctionner.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RAGAdminPanel;
