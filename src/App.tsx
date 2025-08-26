
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import LetsBegin from "./pages/LetsBegin";
import EmployerOnboarding from "./pages/EmployerOnboarding";
import EmployerSecurity from "./pages/EmployerSecurity";
import EmployerTermsPolicies from "./pages/EmployerTermsPolicies";
import EmployerSignIn from "./pages/EmployerSignIn";
import ProfileCompletion from "./pages/ProfileCompletion";
import BusinessRegistration from "./pages/BusinessRegistration";
import BusinessOnboarding from "./pages/BusinessOnboarding";
import BusinessAddress from "./pages/BusinessAddress";
import PhotoUpload from "./pages/PhotoUpload";
import EmployerDashboard from "./pages/EmployerDashboard";
import WHVDashboard from "./pages/WHVDashboard";
import EditProfile from "./pages/EditProfile";
import EmployerEditProfile from "./pages/EmployerEditProfile";
import WHVEditProfile from "./pages/WHVEditProfile";
import ProfileCardPreview from "./pages/ProfileCardPreview";
import WHVProfilePreview from "./components/WHVProfilePreview";
import Security from "./pages/Security";
import EditBusinessProfile from "./pages/EditBusinessProfile";
import Notifications from "./pages/Notifications";
import Privacy from "./pages/Privacy";
import HelpSupport from "./pages/HelpSupport";
import TermsPolicies from "./pages/TermsPolicies";
import PostJobs from "./pages/PostJobs";
import BrowseCandidates from "./pages/BrowseCandidates";
import CandidateProfile from "./pages/CandidateProfile";
import EmployerProfile from "./pages/EmployerProfile";
import FullCandidateProfile from "./pages/FullCandidateProfile";
import EmployerJobs from "./pages/EmployerJobs";
import JobDetails from "./pages/JobDetails";
import Matches from "./pages/Matches";
import MutualMatchProfile from "./pages/MutualMatchProfile";
import Messages from "./pages/Messages";
import EmployerMatches from "./pages/EmployerMatches";
import EmployerMessages from "./pages/EmployerMessages";
import EmployerNotifications from "./pages/EmployerNotifications";
import EmployerPrivacy from "./pages/EmployerPrivacy";
import EmployerHelpSupport from "./pages/EmployerHelpSupport";
import WHVMatches from "./pages/WHVMatches";
import WHVMessages from "./components/WHVMessages";
import WHVNotifications from "./components/WHVNotifications";
import WHVPrivacy from "./components/WHVPrivacy";
import WHVHelpSupport from "./components/WHVHelpSupport";
import EmployerPhotoUpload from "./pages/EmployerPhotoUpload";
import EmployerAccountConfirmation from "./pages/EmployerAccountConfirmation";
import EmployerEmailConfirmation from "./pages/EmployerEmailConfirmation";
import WHVEmailConfirmation from "./pages/WHVEmailConfirmation";
import EmployerAboutBusiness from "./pages/EmployerAboutBusiness";
import WHVAboutYou from "./pages/WHVAboutYou";
import WHVOnboarding from "./pages/WHVOnboarding";
import WHVProfileSetup from "./pages/WHVProfileSetup";
import WHVCurrentAddress from "./pages/WHVCurrentAddress";
import WHVWorkExperience from "./pages/WHVWorkExperience";
import WHVPhotoUpload from "./pages/WHVPhotoUpload";
import WHVLogin from "./pages/WHVLogin";
import WHVAccountConfirmation from "./pages/WHVAccountConfirmation";
import WHVBrowseEmployers from "./pages/WHVBrowseEmployers";
import WHVEmployerProfile from "./pages/WHVEmployerProfile";
import WHVEmployerFullProfile from "./pages/WHVEmployerFullProfile";
import WHVEmployerJobs from "./pages/WHVEmployerJobs";
import WHVEmployerJobDetails from "./pages/WHVEmployerJobDetails";
import WHVJobDetails from "./pages/WHVJobDetails";
import AccountConfirmation from "./pages/AccountConfirmation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/lets-begin" element={<LetsBegin />} />
          <Route path="/employer/onboarding" element={<EmployerOnboarding />} />
          <Route path="/employer/email-confirmation" element={<EmployerEmailConfirmation />} />
          <Route path="/business-registration" element={<BusinessRegistration />} />
          <Route path="/profile-completion" element={<ProfileCompletion />} />
          <Route path="/employer/sign-in" element={<EmployerSignIn />} />
          <Route path="/business-onboarding" element={<Navigate to="/employer/about-business" replace />} />
          <Route path="/business-address" element={<Navigate to="/employer/about-business" replace />} />
          <Route path="/employer/about-business" element={<EmployerAboutBusiness />} />
          <Route path="/employer/photo-upload" element={<EmployerPhotoUpload />} />
          <Route path="/employer/account-confirmation" element={<EmployerAccountConfirmation />} />
          <Route path="/photo-upload" element={<PhotoUpload />} />
          <Route path="/employer/dashboard" element={<EmployerDashboard />} />
          <Route path="/whv/dashboard" element={<WHVDashboard />} />
          <Route path="/whv/profile-edit" element={<EditProfile />} />
          <Route path="/employer/edit-profile" element={<EmployerEditProfile />} />
          <Route path="/whv/edit-WHVdetails" element={<WHVEditProfile />} />
          <Route path="/whv/profile-preview" element={<WHVProfilePreview />} />
          <Route path="/employer/profile-preview" element={<ProfileCardPreview />} />
          <Route path="/security" element={<Security />} />
          <Route path="/whv/security" element={<Security />} />
          <Route path="/employer/security" element={<EmployerSecurity />} />
          <Route path="/edit-business-profile" element={<Navigate to="/employer/edit-business-profile" replace />} />
          <Route path="/employer/edit-business-profile" element={<EditBusinessProfile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/help-support" element={<HelpSupport />} />
          <Route path="/terms-policies" element={<TermsPolicies />} />
          <Route path="/whv/terms-policies" element={<TermsPolicies />} />
          <Route path="/employer/terms-policies" element={<EmployerTermsPolicies />} />
          <Route path="/post-jobs" element={<PostJobs />} />
          <Route path="/browse-candidates" element={<BrowseCandidates />} />
          <Route path="/employer/profile/:id" element={<EmployerProfile />} />
          <Route path="/full-candidate-profile/:id" element={<MutualMatchProfile />} />
          <Route path="/employer/jobs/:employerId" element={<EmployerJobs />} />
          <Route path="/job-details/:employerId/:jobId" element={<JobDetails />} />
          <Route path="/candidate-profile/:id" element={<CandidateProfile />} />
          <Route path="/short-candidate-profile/:id" element={<FullCandidateProfile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/employer/matches" element={<EmployerMatches />} />
          <Route path="/employer/messages" element={<EmployerMessages />} />
          <Route path="/employer/notifications" element={<EmployerNotifications />} />
          <Route path="/employer/privacy" element={<EmployerPrivacy />} />
          <Route path="/employer/help-support" element={<EmployerHelpSupport />} />
          <Route path="/whv/matches" element={<WHVMatches />} />
          <Route path="/whv/messages" element={<WHVMessages />} />
          <Route path="/whv/notifications" element={<WHVNotifications />} />
          <Route path="/whv/privacy" element={<WHVPrivacy />} />
          <Route path="/whv/help-support" element={<WHVHelpSupport />} />
          <Route path="/whv/onboarding" element={<WHVOnboarding />} />
          <Route path="/whv/email-confirmation" element={<WHVEmailConfirmation />} />
          <Route path="/whv/about-you" element={<WHVAboutYou />} />
        <Route path="/whv/profile-setup" element={<WHVProfileSetup />} />
        <Route path="/whv/current-address" element={<WHVCurrentAddress />} />
        <Route path="/whv/work-experience" element={<WHVWorkExperience />} />
        <Route path="/whv/photo-upload" element={<WHVPhotoUpload />} />
        <Route path="/whv/login" element={<WHVLogin />} />
        <Route path="/whv/account-confirmation" element={<WHVAccountConfirmation />} />
          <Route path="/whv-employer-short-profile/:id" element={<WHVEmployerProfile />} />
          <Route path="/whv/employer/profile/:id" element={<WHVEmployerProfile />} />
          <Route path="/whv/employer/full-profile/:id" element={<WHVEmployerFullProfile />} />
          <Route path="/whv/employer/jobs/:employerId" element={<WHVEmployerJobs />} />
          <Route path="/whv/employer/job-details/:id" element={<WHVEmployerJobDetails />} />
          <Route path="/whv/job-details/:employerId/:jobId" element={<WHVJobDetails />} />
          <Route path="/whv/browse-employers" element={<WHVBrowseEmployers />} />
          <Route path="/account-confirmation" element={<AccountConfirmation />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
