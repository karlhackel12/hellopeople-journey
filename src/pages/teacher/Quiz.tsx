
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import TeacherLayout from '@/components/layout/TeacherLayout';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileQuestion, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Quiz = {
  id: string;
  title: string;
  is_published: boolean;
  created_at: string;
  lesson_id?: string;
};

const TeacherQuiz: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('created_by', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to load quizzes',
      });
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = () => {
    navigate('/teacher/quiz/create');
  };

  const filteredQuizzes = quizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <TeacherLayout>
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Quizzes</h1>
            <p className="text-muted-foreground mt-1">Create and manage your quizzes</p>
          </div>
          <Button onClick={handleCreateQuiz} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Create Quiz
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quizzes..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center my-12">
            <p>Loading quizzes...</p>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="bg-muted p-8 rounded-lg text-center">
            <div className="flex justify-center mb-4">
              <FileQuestion className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium mb-2">No quizzes found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try a different search term or' : 'Start creating quizzes to assess student understanding.'}
            </p>
            <Button onClick={handleCreateQuiz}>Create Your First Quiz</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} onUpdate={fetchQuizzes} />
            ))}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

interface QuizCardProps {
  quiz: Quiz;
  onUpdate: () => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, onUpdate }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (quiz.lesson_id) {
      navigate(`/teacher/lessons/quiz/${quiz.lesson_id}`);
    } else {
      navigate(`/teacher/quiz/${quiz.id}/edit`);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer border border-border/40 hover:border-primary/20" onClick={handleClick}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-medium text-lg line-clamp-2">{quiz.title}</h3>
            <p className="text-sm text-muted-foreground">
              {new Date(quiz.created_at).toLocaleDateString()}
            </p>
          </div>
          {quiz.is_published ? (
            <div className="bg-primary/10 text-primary text-xs font-medium py-1 px-2 rounded-full">
              Published
            </div>
          ) : (
            <div className="bg-muted text-muted-foreground text-xs font-medium py-1 px-2 rounded-full">
              Draft
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={(e) => {
            e.stopPropagation();
            if (quiz.lesson_id) {
              navigate(`/teacher/lessons/quiz/${quiz.lesson_id}`);
            } else {
              navigate(`/teacher/quiz/${quiz.id}/edit`);
            }
          }}>
            Edit Quiz
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeacherQuiz;
