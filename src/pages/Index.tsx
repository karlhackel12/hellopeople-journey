
import React from 'react';
import { Helmet } from 'react-helmet';
import Hero from '@/components/home/Hero';
import Benefits from '@/components/home/Benefits';
import HowItWorks from '@/components/home/HowItWorks';
import Features from '@/components/home/Features';
import Testimonials from '@/components/home/Testimonials';
import Pricing from '@/components/home/Pricing';
import Faq from '@/components/home/Faq';
import CtaSection from '@/components/home/CtaSection';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';

const Index: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>HelloPeople - Revolucione Suas Aulas de Inglês com IA</title>
        <meta name="description" content="Economize horas de preparação, melhore os resultados dos alunos e aumente sua renda mensal com HelloPeople - plataforma de IA para professores de inglês." />
        <meta name="keywords" content="professores de inglês, ensino com IA, ferramentas para professores de inglês, IA para ensino de inglês" />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Hero />
          <Benefits />
          <HowItWorks />
          <Features />
          <Testimonials />
          <Pricing />
          <Faq />
          <CtaSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
