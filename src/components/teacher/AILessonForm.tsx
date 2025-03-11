
import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { LessonFormValues } from './LessonEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LessonPreview } from './LessonPreview';
import GenerationSettingsForm from './lesson-ai/GenerationSettingsForm';
import ContentPreview from './lesson-ai/ContentPreview';
import { useAIGeneration } from './lesson-ai/useAIGeneration';

interface AILessonFormProps {
  form: UseFormReturn<LessonFormValues>;
  title: string;
}

const AILessonForm: React.FC<AILessonFormProps> = ({ form, title }) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'preview' | 'edit'>('generate');
  const [editMode, setEditMode] = useState(false);
  
  const {
    generating,
    generatedContent,
    level,
    setLevel,
    instructions,
    setInstructions,
    handleGenerate
  } = useAIGeneration(form, title);

  // When generation completes, switch to preview tab
  useEffect(() => {
    if (generatedContent && activeTab === 'generate') {
      setActiveTab('preview');
    }
  }, [generatedContent]);

  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (!editMode) {
      form.setValue('contentSource', 'mixed');
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="generate" disabled={generating}>Generation Settings</TabsTrigger>
          <TabsTrigger value="preview" disabled={!generatedContent}>Content Preview</TabsTrigger>
          <TabsTrigger value="edit" disabled={!generatedContent}>Student View</TabsTrigger>
        </TabsList>
        <TabsContent value="generate" className="pt-4">
          <GenerationSettingsForm
            title={title}
            level={level}
            setLevel={setLevel}
            instructions={instructions}
            setInstructions={setInstructions}
            handleGenerate={handleGenerate}
            generating={generating}
          />
        </TabsContent>
        <TabsContent value="preview" className="pt-4">
          {generatedContent && (
            <ContentPreview
              form={form}
              generatedContent={generatedContent}
              editMode={editMode}
              toggleEditMode={toggleEditMode}
            />
          )}
        </TabsContent>
        <TabsContent value="edit" className="pt-4">
          {generatedContent ? (
            <LessonPreview content={form.watch('content')} />
          ) : (
            <div className="text-center py-12 border rounded-md bg-muted">
              <p className="text-muted-foreground">Generate content first to see student view</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AILessonForm;
