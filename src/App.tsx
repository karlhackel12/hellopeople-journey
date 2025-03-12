
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import TeacherDashboard from "./pages/teacher/Dashboard";
import LessonEditor from "./components/teacher/LessonEditor";
import Invitations from "./pages/teacher/Invitations";
import Students from "./pages/teacher/Students";
import Assignments from "./pages/teacher/Assignments";
import Lessons from "./pages/teacher/Lessons";
import Settings from "./pages/teacher/Settings";
import LessonPreviewPage from "./pages/teacher/LessonPreviewPage";
import SidebarDemoPage from "./pages/SidebarDemo";
import InvitationAcceptancePage from "./pages/InvitationAcceptance";
import { OnboardingProvider } from "./components/student/OnboardingContext";

// Student Pages
import StudentDashboard from "./pages/student/Dashboard";
import StudentLessons from "./pages/student/Lessons";
import StudentSettings from "./pages/student/Settings";
import LessonView from "./pages/student/LessonView";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <OnboardingProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sidebar-demo" element={<SidebarDemoPage />} />
            
            {/* Invitation routes - both with and without code parameter */}
            <Route path="/invitation" element={<InvitationAcceptancePage />} />
            <Route path="/invitation/:code" element={<InvitationAcceptancePage />} />
            
            {/* Teacher Routes */}
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/lessons" element={<Lessons />} />
            <Route path="/teacher/lessons/create" element={<LessonEditor />} />
            <Route path="/teacher/lessons/edit/:id" element={<LessonEditor />} />
            <Route path="/teacher/lessons/preview/:id" element={<LessonPreviewPage />} />
            <Route path="/teacher/invitations" element={<Invitations />} />
            <Route path="/teacher/students" element={<Students />} />
            <Route path="/teacher/assignments" element={<Assignments />} />
            <Route path="/teacher/settings" element={<Settings />} />
            
            {/* Student Routes */}
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/lessons" element={<StudentLessons />} />
            <Route path="/student/lessons/view/:lessonId" element={<LessonView />} />
            <Route path="/student/settings" element={<StudentSettings />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </OnboardingProvider>
  </QueryClientProvider>
);

export default App;
