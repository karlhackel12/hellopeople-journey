
import { toast } from 'sonner';
import { UseFormReturn } from 'react-hook-form';
import { LessonFormValues } from '../../lesson-editor/useLessonForm';
import { GenerationParams } from './types';
import { useGenerationApi } from './useGenerationApi';
import { useResponseParser } from './useResponseParser';
import { useContentUpdater } from './useContentUpdater';
import { useValidation } from './useValidation';
import { useErrorHandler } from './useErrorHandler';
import { useGenerationProcess } from './useGenerationProcess';

export const useGenerationHandler = (
  form: UseFormReturn<LessonFormValues>,
  generationState: any,
  updateState: any
) => {
  const { invokeLessonGeneration } = useGenerationApi();
  const { parseAIResponse } = useResponseParser();
  const { updateFormContent } = useContentUpdater(form);
  
  const {
    setGenerating,
    setGeneratedContent,
    setError,
    clearErrors,
    setGenerationStatus,
    setGenerationPhase,
    setProgressPercentage,
    setStatusMessage,
    resetGenerationState
  } = updateState;

  // Use our new focused hooks
  const { validateTitleInput } = useValidation(setGenerating, setGenerationStatus);
  const { handleGenerationError, handleParsingError } = useErrorHandler(setError, setGenerating, setGenerationStatus);
  const { processGeneration } = useGenerationProcess(
    invokeLessonGeneration, 
    parseAIResponse, 
    updateFormContent, 
    setGeneratedContent, 
    handleParsingError
  );

  const handleGenerate = async (
    title: string,
    level: 'beginner' | 'intermediate' | 'advanced',
    instructions: string
  ) => {
    try {
      clearErrors();
      setGenerating(true);
      setGenerationStatus('pending');
      setGenerationPhase('starting');
      setProgressPercentage(10);
      setStatusMessage('Starting lesson generation...');
      
      if (!validateTitleInput(title)) {
        return;
      }
      
      const generationParams: GenerationParams = {
        timestamp: new Date().toISOString(),
        title,
        level,
        language: 'english',
        instructions: instructions.trim() || undefined,
      };
      
      // Set up a timeout to progress to the analyzing phase
      setTimeout(() => {
        if (generationState.generationPhase === 'starting') {
          setGenerationPhase('analyzing');
          setProgressPercentage(20);
        }
      }, 1500);
      
      // Set up a timeout to progress to the generating phase
      setTimeout(() => {
        if (generationState.generationPhase === 'analyzing') {
          setGenerationPhase('generating');
          setProgressPercentage(30);
        }
      }, 3000);
      
      try {
        const result = await processGeneration(generationParams);
        setGenerationPhase('complete');
        setProgressPercentage(100);
        setStatusMessage('Lesson content generated successfully!');
        setGenerating(false);
        setGenerationStatus('completed');
        
        toast.success("Content generated", {
          description: "AI-generated English lesson content is ready for review",
        });
        
        return result;
      } catch (error: any) {
        handleGenerationError(error);
        setGenerationPhase('error');
        return null;
      }
    } catch (error: any) {
      console.error("Error in handleGenerate:", error);
      setError(error?.message || "Unknown error");
      setGenerating(false);
      setGenerationStatus('failed');
      setGenerationPhase('error');
      
      toast.error("Generation failed", {
        description: error?.message || "An unexpected error occurred",
      });
      
      return null;
    }
  };

  const cancelGeneration = () => {
    resetGenerationState();
    toast.info("Generation cancelled", {
      description: "The lesson generation process has been cancelled.",
    });
  };

  const retryGeneration = async (
    title: string,
    level: 'beginner' | 'intermediate' | 'advanced',
    instructions: string
  ) => {
    clearErrors();
    return handleGenerate(title, level, instructions);
  };

  return {
    handleGenerate,
    cancelGeneration,
    retryGeneration
  };
};
