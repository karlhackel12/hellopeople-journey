
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthForm from '@/components/Auth/AuthForm';
import Logo from '@/components/ui/Logo';
import { CheckCircle2 } from 'lucide-react';
import { H1 } from '@/components/ui/typography';

const Register: React.FC = () => {
  const [invitationEmail, setInvitationEmail] = useState<string | null>(null);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is coming from invitation page
    const storedInvitationCode = sessionStorage.getItem('invitationCode');
    const storedEmail = sessionStorage.getItem('invitedEmail');

    if (storedInvitationCode) {
      console.log("Found stored invitation code:", storedInvitationCode);
      setInvitationCode(storedInvitationCode);
    }
    
    if (storedEmail) {
      console.log("Found stored email:", storedEmail);
      setInvitationEmail(storedEmail);
    }
    
    // Also check URL parameters for invitation code
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    
    if (codeParam) {
      console.log("Found invitation code in URL:", codeParam);
      setInvitationCode(codeParam);
      // We'll let the invitation code validation in AuthForm handle filling the email
    }
  }, []);

  const studentBenefits = [
    "Acesso a práticas de conversação com IA",
    "Caminho de aprendizado personalizado baseado em seus objetivos",
    "Acompanhamento de progresso e insights de desempenho",
    "5 lições gratuitas por semana no plano gratuito",
  ];

  const teacherBenefits = [
    "Gerenciar múltiplos grupos de estudantes",
    "Criar materiais de aprendizado personalizados",
    "Acompanhar o progresso dos alunos e análises",
    "Agendar sessões de conversação ao vivo",
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Auth form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 md:px-12 lg:px-16 relative">
        <div className="absolute top-8 left-8">
          <Logo />
        </div>
        
        <div className="w-full max-w-md mx-auto mt-16 md:mt-0">
          <div className="text-center mb-8">
            <H1 className="mb-3">Crie sua conta</H1>
            {invitationCode ? (
              <p className="text-muted-foreground">
                Você foi convidado para se juntar ao HelloPeople!
              </p>
            ) : (
              <p className="text-muted-foreground">
                Junte-se a milhares de estudantes de idiomas alcançando fluência mais rapidamente
              </p>
            )}
          </div>
          
          <AuthForm 
            type="register" 
            invitationData={{
              email: invitationEmail,
              code: invitationCode,
              isInvited: !!invitationCode
            }}
          />
        </div>
      </div>
      
      {/* Right side - Benefits (hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary/5 to-background relative">
        <div className="absolute inset-0 flex flex-col justify-center items-center p-12">
          <div className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-2xl p-8 max-w-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-6 font-display">Comece sua jornada de fluência hoje</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 font-display">Para Estudantes</h3>
                <ul className="space-y-3">
                  {studentBenefits.map((benefit, index) => (
                    <li key={`student-${index}`} className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5 mr-3" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 font-display">Para Professores</h3>
                <ul className="space-y-3">
                  {teacherBenefits.map((benefit, index) => (
                    <li key={`teacher-${index}`} className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5 mr-3" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="bg-primary/10 rounded-lg p-4 mt-6">
              <p className="text-sm">
                "Nossa tecnologia de IA se adapta ao seu estilo e ritmo de aprendizado, oferecendo uma experiência verdadeiramente personalizada que ajuda você a aprender até 3x mais rápido que métodos tradicionais."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
