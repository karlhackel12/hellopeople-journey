
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays } from 'date-fns';

const inviteSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface EmailInviteFormProps {
  onSuccess: () => void;
}

const EmailInviteForm: React.FC<EmailInviteFormProps> = ({ onSuccess }) => {
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: InviteFormValues) => {
    try {
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Authentication error', {
          description: 'You must be logged in to invite students',
        });
        return;
      }

      // Get user profile to get the teacher's name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userData.user.id)
        .single();

      // Set expiration date (7 days from now)
      const expiresAt = addDays(new Date(), 7).toISOString();

      // Insert invitation - note that invitation_code is automatically generated by a trigger
      const { data, error } = await supabase
        .from('student_invitations')
        .insert({
          email: values.email,
          invited_by: userData.user.id,
          expires_at: expiresAt,
          status: 'pending',
          // The invitation_code field is generated via a trigger in the database
          invitation_code: 'PENDING' // This value will be overwritten by the trigger
        })
        .select();

      if (error) {
        if (error.code === '23505') {
          toast.error('Invitation already sent', {
            description: 'You have already invited this student',
          });
        } else {
          throw error;
        }
        return;
      }

      // Get the generated invitation code from the returned data
      const invitation = data[0];
      
      // Format teacher name for the email
      const teacherName = profileData
        ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()
        : 'Your teacher';

      // Send the invitation email using our edge function
      const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          email: values.email,
          invitation_code: invitation.invitation_code,
          teacher_name: teacherName
        }
      });

      if (emailError) {
        console.error('Error sending invitation email:', emailError);
        toast.warning('Invitation created but email delivery failed', {
          description: 'The invitation was created but we could not send the email. The student can still use the invitation code.',
        });
      } else {
        toast.success('Invitation sent', {
          description: `An invitation has been sent to ${values.email}`,
        });
      }
      
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation', {
        description: error.message,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student Email</FormLabel>
              <FormControl>
                <Input placeholder="student@example.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Sending...' : 'Send Invitation'}
        </Button>
        
        <Alert>
          <AlertDescription>
            An email will be sent to the student with instructions to join the platform.
          </AlertDescription>
        </Alert>
      </form>
    </Form>
  );
};

export default EmailInviteForm;
