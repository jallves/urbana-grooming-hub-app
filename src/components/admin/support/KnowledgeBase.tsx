
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, MessageSquare, Info, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Article {
  id: number | string;
  title: string;
  views: number;
  content?: string;
  category_id: number;
}

interface ArticleCategory {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
  articles: Article[];
}

const KnowledgeBase: React.FC = () => {
  const [articleCategories, setArticleCategories] = useState<ArticleCategory[]>([]);
  
  // Fetch knowledge base articles
  const { data: articles, isLoading } = useQuery({
    queryKey: ['knowledgeBase'],
    queryFn: async () => {
      try {
        // Here you would normally fetch actual data from your Supabase tables
        // For now, we'll use the mock data but in a real implementation you would:
        // const { data, error } = await supabase.from('knowledge_articles').select('*');
        
        // Mock data - would be replaced with actual database data
        const mockCategories = [
          {
            id: 1,
            name: 'Tutoriais',
            icon: <FileText className="h-5 w-5" />,
            description: 'Guias passo a passo para usar os recursos do sistema',
            articles: [
              { id: 1, title: 'Como fazer agendamentos', views: 245, category_id: 1 },
              { id: 2, title: 'Gerenciando seu perfil', views: 186, category_id: 1 },
              { id: 3, title: 'Acesso ao sistema de pagamento', views: 120, category_id: 1 },
            ]
          },
          {
            id: 2,
            name: 'FAQ',
            icon: <MessageSquare className="h-5 w-5" />,
            description: 'Perguntas frequentes e suas respostas',
            articles: [
              { id: 4, title: 'Política de cancelamento', views: 312, category_id: 2 },
              { id: 5, title: 'Dúvidas sobre pagamentos', views: 278, category_id: 2 },
              { id: 6, title: 'Horários de funcionamento', views: 195, category_id: 2 },
            ]
          },
          {
            id: 3,
            name: 'Suporte Técnico',
            icon: <Search className="h-5 w-5" />,
            description: 'Resolução de problemas técnicos',
            articles: [
              { id: 7, title: 'Problemas com login', views: 189, category_id: 3 },
              { id: 8, title: 'Erros no carregamento da página', views: 142, category_id: 3 },
              { id: 9, title: 'Restauração de senha', views: 201, category_id: 3 },
            ]
          },
          {
            id: 4,
            name: 'Informações Gerais',
            icon: <Info className="h-5 w-5" />,
            description: 'Informações sobre a empresa e serviços',
            articles: [
              { id: 10, title: 'Sobre a Urbana Barbearia', views: 147, category_id: 4 },
              { id: 11, title: 'Termos de serviço', views: 89, category_id: 4 },
              { id: 12, title: 'Política de privacidade', views: 112, category_id: 4 },
            ]
          },
        ];

        return mockCategories;
      } catch (error) {
        console.error('Error fetching knowledge base:', error);
        throw error;
      }
    }
  });

  useEffect(() => {
    if (articles) {
      setArticleCategories(articles);
    }
  }, [articles]);

  // Set up real-time subscription for articles
  useEffect(() => {
    // This would connect to your actual articles table in production
    const channel = supabase
      .channel('knowledge-base-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'support_tickets' // placeholder, would be 'knowledge_articles' in production
        },
        (payload) => {
          // In a real implementation, we would update the articles based on the payload
          toast.info('Base de conhecimento atualizada');
          // For now we're just showing a toast notification
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Get popular articles across all categories
  const getPopularArticles = () => {
    return articleCategories
      .flatMap(category => category.articles)
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  };

  const handleNewArticle = () => {
    // This would open a form to create a new article
    toast.info('Funcionalidade em desenvolvimento');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Base de Conhecimento</h3>
          <p className="text-sm text-muted-foreground">
            Tutoriais e artigos para clientes e funcionários
          </p>
        </div>
        <Button onClick={handleNewArticle}>Novo Artigo</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articleCategories.map((category) => (
          <Card key={category.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-2">
                {category.icon}
                <div>
                  <CardTitle>{category.name}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <ul className="space-y-2">
                {category.articles.map((article) => (
                  <li key={article.id} className="flex items-center justify-between">
                    <span className="text-sm hover:underline cursor-pointer">
                      {article.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {article.views} views
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">
                Ver todos
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Artigos Populares</CardTitle>
          <CardDescription>Os artigos mais visualizados na base de conhecimento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getPopularArticles().map((article) => (
              <div key={article.id} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{article.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {article.views} visualizações
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeBase;
