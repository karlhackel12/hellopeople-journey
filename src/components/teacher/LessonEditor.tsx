
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import TeacherLayout from '@/components/layout/TeacherLayout';
import { ArrowLeft, Clock, Save } from 'lucide-react';
import MediaAttachmentsTab from './MediaAttachmentsTab';
import QuizTab from './QuizTab';
import LessonTypeSelector from './LessonTypeSelector';
import ManualLessonForm from './ManualLessonForm';
import AILessonForm from './AILessonForm';

// Define form validation schema
const lessonFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  content: z.string().min(10, { message: "Content must be at least 10 characters" }),
  estimated_minutes: z.coerce.number().int().min(1).optional(),
  is_published: z.boolean().default(false),
  contentSource: z.enum(['manual', 'ai_generated', 'mixed']).default('manual'),
  structuredContent: z.any().optional(),
  generationMetadata: z.any().optional(),
});

export type LessonFormValues = z.infer<typeof lessonFormSchema>;

const LessonEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [lessonType, setLessonType] = useState<'manual' | 'ai'>('manual');
  const isEditMode = !!id;

  // Initialize form
  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      title: '',
      content: '',
      estimated_minutes: 15,
      is_published: false,
      contentSource: 'manual',
      structuredContent: null,
      generationMetadata: null,
    },
  });

  // Detect if content was AI-generated when loading an existing lesson
  useEffect(() => {
    const contentSource = form.watch('contentSource');
    if (contentSource === 'ai_generated' || contentSource === 'mixed') {
      setLessonType('ai');
    } else {
      setLessonType('manual');
    }
  }, [form.watch('contentSource')]);

  // Load existing lesson if in edit mode
  useEffect(() => {
    const fetchLesson = async () => {
      if (!isEditMode) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          // Fix for type error: ensure contentSource is one of the expected values
          const contentSource = data.content_source as string;
          let validContentSource: 'manual' | 'ai_generated' | 'mixed' = 'manual';
          
          if (contentSource === 'ai_generated' || contentSource === 'mixed') {
            validContentSource = contentSource;
          }
          
          form.reset({
            title: data.title,
            content: data.content || '',
            estimated_minutes: data.estimated_minutes || 15,
            is_published: data.is_published,
            contentSource: validContentSource,
            structuredContent: data.structured_content,
            generationMetadata: data.generation_metadata,
          });
          
          // Set the lesson type based on the content source
          if (validContentSource === 'ai_generated' || validContentSource === 'mixed') {
            setLessonType('ai');
          }
        }
      } catch (error) {
        console.error('Error fetching lesson:', error);
        toast.error('Error', {
          description: 'Failed to load lesson',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [id, navigate, form, isEditMode]);

  // Handle lesson type change
  const handleLessonTypeChange = (type: 'manual' | 'ai') => {
    setLessonType(type);
    
    // Update content source based on type
    if (type === 'manual') {
      form.setValue('contentSource', 'manual');
    }
    // For AI type, the content source will be set when content is actually generated
  };

  // Save lesson
  const onSubmit = async (values: LessonFormValues) => {
    setSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        navigate('/login');
        return;
      }

      if (isEditMode) {
        // Update existing lesson
        const { error } = await supabase
          .from('lessons')
          .update({
            title: values.title,
            content: values.content,
            estimated_minutes: values.estimated_minutes,
            is_published: values.is_published,
            content_source: values.contentSource,
            structured_content: values.structuredContent,
            generation_metadata: values.generationMetadata,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) throw error;
        
        toast.success('Lesson updated', {
          description: 'Your lesson has been successfully updated',
        });
      } else {
        // Create new lesson
        const { data, error } = await supabase
          .from('lessons')
          .insert({
            title: values.title,
            content: values.content,
            estimated_minutes: values.estimated_minutes,
            is_published: values.is_published,
            content_source: values.contentSource,
            structured_content: values.structuredContent,
            generation_metadata: values.generationMetadata,
            created_by: user.user.id,
            order_index: 0, // Default order, can be adjusted later
          })
          .select();

        if (error) throw error;
        
        toast.success('Lesson created', {
          description: 'Your lesson has been successfully created',
        });

        // Navigate to edit mode with the new lesson ID
        if (data && data.length > 0) {
          navigate(`/teacher/lessons/edit/${data[0].id}`);
        } else {
          navigate('/teacher/lessons');
        }
      }
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error('Error', {
        description: 'Failed to save lesson',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/teacher/lessons');
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="container mx-auto p-8 flex justify-center">
          <p>Loading lesson...</p>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="container mx-auto p-4 md:p-8">
        <Button variant="ghost" className="mb-4" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lessons
        </Button>
        
        <h1 className="text-3xl font-bold mb-6">
          {isEditMode ? 'Edit Lesson' : 'Create New Lesson'}
        </h1>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter lesson title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                
              <FormField
                control={form.control}
                name="estimated_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Duration (minutes)</FormLabel>
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="is_published"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel>Publish Lesson</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Make this lesson visible to students
                    </p>
                  </div>
                </FormItem>
              )}
            />
            
            {!isEditMode && (
              <div className="mt-6">
                <h2 className="text-lg font-medium mb-4">How would you like to create this lesson?</h2>
                <LessonTypeSelector 
                  selectedType={lessonType} 
                  onSelectType={handleLessonTypeChange} 
                />
              </div>
            )}
              
            <Tabs defaultValue="content" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3">
                <TabsTrigger value="content">Lesson Content</TabsTrigger>
                <TabsTrigger value="media">Media Attachments</TabsTrigger>
                <TabsTrigger value="quiz">Quiz</TabsTrigger>
              </TabsList>
              <TabsContent value="content" className="mt-6">
                {lessonType === 'manual' ? (
                  <ManualLessonForm form={form} />
                ) : (
                  <AILessonForm 
                    form={form}
                    title={form.watch('title')}
                  />
                )}
              </TabsContent>
              <TabsContent value="media" className="mt-6">
                <MediaAttachmentsTab lessonId={id} isEditMode={isEditMode} />
              </TabsContent>
              <TabsContent value="quiz" className="mt-6">
                <QuizTab lessonId={id} isEditMode={isEditMode} />
              </TabsContent>
            </Tabs>
              
            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="w-full md:w-auto gap-2">
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Lesson'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </TeacherLayout>
  );
};

export default LessonEditor;
