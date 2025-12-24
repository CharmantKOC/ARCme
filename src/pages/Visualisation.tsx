import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TrendingUp, Filter, Download, Info, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TopicData {
  name: string;
  count: number;
  growth?: number;
}

interface YearlyData {
  year: string;
  count: number;
}

interface DomainData {
  name: string;
  percentage: number;
  count: number;
}

const COLORS = ['#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#6366F1', '#14B8A6', '#F97316'];

const Visualisation = () => {
  const [loading, setLoading] = useState(true);
  const [yearlyData, setYearlyData] = useState<YearlyData[]>([]);
  const [domainData, setDomainData] = useState<DomainData[]>([]);
  const [topicData, setTopicData] = useState<TopicData[]>([]);
  const [totalDocuments, setTotalDocuments] = useState(0);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch all documents
      const { data: documents, error } = await supabase
        .from('documents')
        .select('year, category, keywords, created_at')
        .eq('is_public', true);

      if (error) throw error;

      setTotalDocuments(documents?.length || 0);

      // Process yearly data
      const yearCounts: Record<string, number> = {};
      documents?.forEach(doc => {
        if (doc.year) {
          yearCounts[doc.year] = (yearCounts[doc.year] || 0) + 1;
        }
      });
      const yearlyChartData = Object.entries(yearCounts)
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => parseInt(a.year) - parseInt(b.year));
      setYearlyData(yearlyChartData);

      // Process domain/category data
      const categoryCounts: Record<string, number> = {};
      documents?.forEach(doc => {
        if (doc.category) {
          categoryCounts[doc.category] = (categoryCounts[doc.category] || 0) + 1;
        }
      });
      const total = documents?.length || 1;
      const domainChartData = Object.entries(categoryCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / total) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
      setDomainData(domainChartData);

      // Process keywords/topics data
      const keywordCounts: Record<string, number> = {};
      documents?.forEach(doc => {
        doc.keywords?.forEach(keyword => {
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        });
      });
      const topicChartData = Object.entries(keywordCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setTopicData(topicChartData);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
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
              Cartographie du savoir académique
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explorez les tendances de recherche, identifiez les sujets émergents et découvrez les domaines les plus étudiés au fil des années.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="text-sm text-muted-foreground">
              {totalDocuments} documents analysés
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exporter
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Main Grid */}
          {!loading && (
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              {/* Trending Topics - Bar Chart */}
              <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Mots-clés populaires</h3>
                    <p className="text-sm text-muted-foreground">Top 10 des sujets de recherche</p>
                  </div>
                </div>
                {topicData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topicData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={12}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))' 
                        }}
                      />
                      <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Aucune donnée disponible
                  </div>
                )}
              </div>

              {/* Domain Distribution - Pie Chart */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-foreground">Distribution par domaine</h3>
                  <p className="text-sm text-muted-foreground">Répartition des catégories</p>
                </div>
                {domainData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={domainData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="count"
                        >
                          {domainData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))' 
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-4">
                      {domainData.map((domain, index) => (
                        <div key={domain.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-foreground">{domain.name}</span>
                          </div>
                          <span className="font-semibold text-foreground">{domain.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    Aucune donnée disponible
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Yearly Evolution - Line Chart */}
          {!loading && yearlyData.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground">Évolution annuelle</h3>
                <p className="text-sm text-muted-foreground">Nombre de mémoires déposés par année</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="year" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="Documents"
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Visualisation;
