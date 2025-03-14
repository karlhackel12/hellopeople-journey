
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import AILessonForm from '../AILessonForm';
import { LessonFormValues } from '../lesson-ai/hooks/useAIGeneration';

interface LessonContentTabsProps {
  form: UseFormReturn<LessonFormValues>;
  lessonId?: string;
  isEditMode: boolean;
}

const LessonContentTabs: React.FC<LessonContentTabsProps> = ({
  form,
  lessonId,
  isEditMode
}) => {
  return (
    <div className="mt-6">
      <AILessonForm form={form} title={form.watch('title')} />
    </div>
  );
};

export default LessonContentTabs;
