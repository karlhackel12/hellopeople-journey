import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VoicePracticeSession {
  id: string;
  lesson_id: string | null;
  topic: string;
  difficulty_level: number;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  vocabulary_used?: string[];
  assignment_id?: string | null;
  lesson?: {
    id: string;
    title: string;
    content: string;
  } | null;
}

export interface VoicePracticeFeedback {
  id: string;
  session_id: string;
  feedback_text: string;
  pronunciation_score: number | null;
  grammar_score: number | null;
  fluency_score: number | null;
  created_at: string;
  user_id: string;
}

export interface VoiceConfidenceScore {
  id: string;
  overall_score: number;
  pronunciation_score: number;
  grammar_score: number;
  fluency_score: number;
  recorded_at: string;
}

export interface AssignedLessonForPractice {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  lesson_id: string;
  lesson: {
    id: string;
    title: string;
    content: string;
  } | null;
}

export const useVoicePractice = () => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };
    
    fetchUser();
  }, []);

  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['voice-practice-sessions', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      try {
        const { data, error } = await supabase
          .from('voice_practice_sessions')
          .select(`
            id,
            lesson_id,
            topic,
            difficulty_level,
            started_at,
            completed_at,
            duration_seconds,
            vocabulary_used,
            assignment_id,
            lesson:lessons(
              id,
              title,
              content
            )
          `)
          .eq('user_id', userId)
          .order('started_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching voice practice sessions:', error);
          toast.error('Failed to fetch voice practice sessions');
          return [];
        }
        
        return data || [];
      } catch (err) {
        console.error('Exception fetching voice practice sessions:', err);
        toast.error('Failed to fetch voice practice sessions');
        return [];
      }
    },
    enabled: !!userId
  });

  const { data: assignedLessons, isLoading: isLoadingAssignedLessons } = useQuery({
    queryKey: ['voice-practice-assigned-lessons', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('student_assignments')
        .select(`
          id,
          title,
          description,
          due_date,
          status,
          lesson_id,
          lesson:lessons(
            id,
            title,
            content
          )
        `)
        .eq('student_id', userId)
        .not('lesson_id', 'is', null)
        .in('status', ['not_started', 'in_progress'])
        .order('due_date', { ascending: true });
      
      if (error) {
        toast.error('Failed to fetch assigned lessons for conversation practice');
        throw error;
      }
      
      return data || [];
    },
    enabled: !!userId
  });

  const { data: confidenceScores, isLoading: isLoadingScores } = useQuery({
    queryKey: ['voice-confidence-scores', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('voice_confidence_scores')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false });
      
      if (error) {
        toast.error('Failed to fetch voice confidence scores');
        throw error;
      }
      
      return data || [];
    },
    enabled: !!userId
  });

  const { data: recentFeedback, isLoading: isLoadingFeedback } = useQuery({
    queryKey: ['voice-practice-feedback', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('voice_practice_feedback')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        toast.error('Failed to fetch voice practice feedback');
        throw error;
      }
      
      return data || [];
    },
    enabled: !!userId
  });

  const createSessionMutation = useMutation({
    mutationFn: async ({ 
      lessonId, 
      topic,
      difficultyLevel,
      vocabularyItems = [],
      assignmentId = null
    }: { 
      lessonId?: string,
      topic: string,
      difficultyLevel: number,
      vocabularyItems?: string[],
      assignmentId?: string | null
    }) => {
      if (!userId) throw new Error('User is not authenticated');
      
      const { data, error } = await supabase
        .from('voice_practice_sessions')
        .insert({
          user_id: userId,
          lesson_id: lessonId || null,
          topic,
          difficulty_level: difficultyLevel,
          vocabulary_used: vocabularyItems,
          assignment_id: assignmentId
        })
        .select()
        .single();
      
      if (error) throw error;

      if (assignmentId) {
        await supabase
          .from('student_assignments')
          .update({ status: 'in_progress' })
          .eq('id', assignmentId);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-practice-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['voice-practice-assigned-lessons'] });
    },
    onError: (error) => {
      console.error('Failed to create voice practice session:', error);
      toast.error('Failed to create voice practice session');
    }
  });

  const completeSessionMutation = useMutation({
    mutationFn: async ({ 
      sessionId,
      durationSeconds,
      analyticsData = null
    }: { 
      sessionId: string,
      durationSeconds: number,
      analyticsData?: any
    }) => {
      if (!userId) throw new Error('User is not authenticated');
      
      try {
        const { data: sessionData, error: sessionError } = await supabase
          .from('voice_practice_sessions')
          .select('assignment_id, lesson_id')
          .eq('id', sessionId)
          .single();
          
        if (sessionError) {
          console.error('Error fetching session data:', sessionError);
          throw sessionError;
        }
        
        const assignmentId = sessionData?.assignment_id;
        
        const { data, error } = await supabase
          .from('voice_practice_sessions')
          .update({
            completed_at: new Date().toISOString(),
            duration_seconds: durationSeconds,
            analytics_data: analyticsData
          })
          .eq('id', sessionId)
          .eq('user_id', userId)
          .select()
          .single();
        
        if (error) throw error;
        
        if (assignmentId) {
          await supabase
            .from('student_assignments')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', assignmentId);
        }
        
        if (sessionData?.lesson_id) {
          await updateLessonProgress(sessionData.lesson_id);
        }
        
        return data;
      } catch (error) {
        console.error('Error completing session:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-practice-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['voice-practice-assigned-lessons'] });
    },
    onError: (error) => {
      console.error('Failed to complete voice practice session:', error);
      toast.error('Failed to complete voice practice session');
    }
  });

  const updateLessonProgress = async (lessonId: string) => {
    if (!userId) return;
    
    const { data: existingProgress } = await supabase
      .from('user_lesson_progress')
      .select('id, status')
      .eq('lesson_id', lessonId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (existingProgress) {
      await supabase
        .from('user_lesson_progress')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          practice_completed: true
        })
        .eq('id', existingProgress.id);
    } else {
      await supabase
        .from('user_lesson_progress')
        .insert({
          lesson_id: lessonId,
          user_id: userId,
          status: 'completed',
          completed_at: new Date().toISOString(),
          practice_completed: true,
          is_required: true
        });
    }
  };

  const addFeedbackMutation = useMutation({
    mutationFn: async ({ 
      sessionId,
      feedbackText,
      pronunciationScore,
      grammarScore,
      fluencyScore
    }: { 
      sessionId: string,
      feedbackText: string,
      pronunciationScore?: number,
      grammarScore?: number,
      fluencyScore?: number
    }) => {
      if (!userId) throw new Error('User is not authenticated');
      
      const { data, error } = await supabase
        .from('voice_practice_feedback')
        .insert({
          user_id: userId,
          session_id: sessionId,
          feedback_text: feedbackText,
          pronunciation_score: pronunciationScore || null,
          grammar_score: grammarScore || null,
          fluency_score: fluencyScore || null
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-practice-feedback'] });
    },
    onError: (error) => {
      console.error('Failed to add voice practice feedback:', error);
      toast.error('Failed to add voice practice feedback');
    }
  });

  const recordConfidenceScoreMutation = useMutation({
    mutationFn: async ({ 
      overallScore,
      pronunciationScore,
      grammarScore,
      fluencyScore
    }: { 
      overallScore: number,
      pronunciationScore: number,
      grammarScore: number,
      fluencyScore: number
    }) => {
      if (!userId) throw new Error('User is not authenticated');
      
      const { data, error } = await supabase
        .from('voice_confidence_scores')
        .insert({
          user_id: userId,
          overall_score: overallScore,
          pronunciation_score: pronunciationScore,
          grammar_score: grammarScore,
          fluency_score: fluencyScore
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-confidence-scores'] });
    },
    onError: (error) => {
      console.error('Failed to record voice confidence score:', error);
      toast.error('Failed to record voice confidence score');
    }
  });

  const calculateDetailedStats = () => {
    if (!confidenceScores?.length && !recentFeedback?.length) {
      return {
        overall: 0,
        pronunciation: 0,
        grammar: 0,
        fluency: 0,
        vocabulary: 0
      };
    }
    
    const allGrammarScores = [
      ...confidenceScores?.map(s => s.grammar_score) || [],
      ...recentFeedback?.filter(f => f.grammar_score).map(f => f.grammar_score as number) || []
    ];
    
    const allFluencyScores = [
      ...confidenceScores?.map(s => s.fluency_score) || [],
      ...recentFeedback?.filter(f => f.fluency_score).map(f => f.fluency_score as number) || []
    ];
    
    const allPronunciationScores = [
      ...confidenceScores?.map(s => s.pronunciation_score) || [],
      ...recentFeedback?.filter(f => f.pronunciation_score).map(f => f.pronunciation_score as number) || []
    ];
    
    const grammar = allGrammarScores.length ? 
      parseFloat((allGrammarScores.reduce((sum, score) => sum + score, 0) / allGrammarScores.length).toFixed(1)) : 0;
    
    const fluency = allFluencyScores.length ? 
      parseFloat((allFluencyScores.reduce((sum, score) => sum + score, 0) / allFluencyScores.length).toFixed(1)) : 0;
    
    const pronunciation = allPronunciationScores.length ? 
      parseFloat((allPronunciationScores.reduce((sum, score) => sum + score, 0) / allPronunciationScores.length).toFixed(1)) : 0;
    
    const overall = [grammar, fluency, pronunciation].filter(Boolean).length ? 
      parseFloat(([grammar, fluency, pronunciation].reduce((sum, score) => sum + score, 0) / 
      [grammar, fluency, pronunciation].filter(Boolean).length).toFixed(1)) : 0;
    
    const vocabulary = overall ? parseFloat((overall * 0.9).toFixed(1)) : 0;
    
    return {
      overall,
      pronunciation,
      grammar,
      fluency,
      vocabulary
    };
  };

  const stats = {
    totalSessions: sessions?.length || 0,
    completedSessions: sessions?.filter(session => session.completed_at).length || 0,
    averageDuration: sessions?.filter(session => session.duration_seconds)
      .reduce((sum, session) => sum + (session.duration_seconds || 0), 0) / 
      (sessions?.filter(session => session.duration_seconds).length || 1),
    highestDifficulty: sessions?.reduce((max, session) => Math.max(max, session.difficulty_level), 0) || 0,
    averageScores: calculateDetailedStats(),
    assignedPractices: assignedLessons?.length || 0
  };

  const requiredSessions = sessions
    ?.filter(session => session.lesson && !session.completed_at) || [];

  const assignedLessonsWithoutSessions = sessions ? (assignedLessons?.filter(assignment => 
    assignment.lesson_id && 
    !sessions.some(session => 
      (session.lesson_id === assignment.lesson_id || session.assignment_id === assignment.id) 
      && !session.completed_at
    )
  ) || []) : [];

  return {
    sessions,
    recentFeedback,
    confidenceScores,
    stats,
    requiredSessions,
    assignedLessonsWithoutSessions,
    isLoading: isLoadingSessions || isLoadingScores || isLoadingFeedback || isLoadingAssignedLessons,
    createSession: createSessionMutation.mutateAsync,
    completeSession: completeSessionMutation.mutate,
    addFeedback: addFeedbackMutation.mutate,
    recordConfidenceScore: recordConfidenceScoreMutation.mutate
  };
};
