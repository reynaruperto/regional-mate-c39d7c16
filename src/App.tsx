import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// General pages
import Index from "./pages/Index";
import LetsBegin from "./pages/LetsBegin";
import RoleSelection from "./pages/RoleSelection";
import NotFound from "./pages/NotFound";

// Employer pages
import EmployerOnboarding from "./pages/EmployerOnboarding";
import EmployerEmailConfirmation from "./pages/EmployerEmailConfirmation";
import EmployerAboutBusiness from "./pages/EmployerAboutBusiness";
import EmployerPhotoUpload from "./pages/EmployerPhotoUpload";
import EmployerAccountConfirmation from "./pages/EmployerAccountConfirmation";
import EmployerDashboard from "./pages/EmployerDashboard";
import EmployerEditProfile from "./pages/EmployerEditProfile";
import EmployerFullProfilePreview from "./pages/EmployerFullProfilePreview";
import EmployerProfile from "./pages/EmployerProfile";
import EmployerJobs from "./pages/EmployerJobs";
import EmployerMatches from "./pages/EmployerMatches";
import EmployerMessages from "./pages/EmployerMessages";
import EmployerNotifications from "./pages/EmployerNotifications";
import EmployerPrivacy from "./pages/EmployerPrivacy";
import EmployerHelpSupport from "./pages/EmployerHelpSupport";
import EmployerSecurity from "./pages/EmployerSecurity";
import EmployerTermsPolicies from "./pages/EmployerTermsPolicies";

// WHV (Working Holiday Maker) pages
import WHVOnboarding from "./pages/WHVOnboarding";
import WHVEmailConfirmation from "./pages/WHVEmailConfirmation";
import WHVAboutYou from "./pages/WHVAboutYou";
import WHVProfileSetup from "./pages/WHVProfileSetup";
import WHVWorkPreferences from "./pages/WHVWorkPreferences";
import WHVWorkExperience from "./pages/WHVWorkExperience";
import WHVPhotoUpload from "./pages/WHVPhotoUpload";
import WHVAccountConfirmation from "./pages/WHVAccountConfirmation";
import WHVDashboard from "./pages/WHVDashboard";
import WHVEditProfile from "./pages/WHVEditProfile";
import WHVProfilePreview from "./components/WHVProfilePreview";
import WHVMatches from "./pages/WHVMatches";
import WHVMessages from "./components/WHVMessages";
import WHVNotifications from "./components/WHVNotifications";
import WHVPrivacy from "./components/WHVPrivacy";
import WHVHelpSupport from "./components/WHVHelpSupport";
import WHVEmployerProfile from "./pages/WHVEmployerProfile";
import WHVEmployerFullProfile from "./pages/WHVEmployerFullProfile";
import WHVEmployerJobs from "./pages/WHVEmployerJobs";
import WHVEmployerJobDetails from "./pages/WHVEmployerJobDetails";
import WHVJobDetails from "./pages/WHVJobDetails";
import WHVBrowseEmployers from "./pages/WHVBrowseEmployers";
import SignInAsModal from "./components/SignInAsModal";

// Shared/misc pages
import ProfileCompletion from "./pages/ProfileCompletion";
import BusinessRegistration from "./pages/BusinessRegistration";
import PhotoUpload from "./pages/PhotoUpload";
import EditProfile from "./pages/EditProfile";
import ProfileCardPreview from "./pages/ProfileCardPreview";
import Security from "./pages/Security";
import EditBusinessProfile from "./pages/EditBusinessProfile";
import Notifications from "./pages/Notifications";
import Privacy from "./pages/Privacy";
import HelpSupport from "./pages/HelpSupport";
import TermsPolicies from "./pages/TermsPolicies";
import PostJobs from "./pages/PostJobs";
import BrowseCandidates from "./pages/BrowseCandidates";
import CandidateProfile from "./pages/CandidateProfile";
import FullCandidateProfile from "./pages/FullCandidateProfile";
import JobDetails from "./pages/JobDetails";
import Messages from "./pages/Messages";
import MutualMatchProfile from "./pages/MutualMatchProfile";
import AccountConfirmation from "./pages/AccountConfirmation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Landing */}
          <Route path="/" element={<Index />} />
          <Route path="/lets-begin" element={<LetsBegin />} />
          <Route path="/sign-in" element={<SignInAsModal />} />
          <Route path="/role-selection" element={<RoleSelection />} />

          {/* Employer flow */}
          <Route path="/employer/onboarding" element={<EmployerOnboarding />} />
          <Route path="/employer/email-confirmation" element={<EmployerEmailConfirmation />} />
          <Route path="/employer/about-business" element={<EmployerAboutBusiness />} />
          <Route path="/employer/photo-upload" element={<EmployerPhotoUpload />} />
          <Route path="/employer/account-confirmation" element={<EmployerAccountConfirmation />} />
          <Route path="/employer/dashboard" element={<EmployerDashboard />} />
          <Route path="/employer/edit-profile" element={<EmployerEditProfile />} />
          <Route path="/employer/full-profile-preview" element={<EmployerFullProfilePreview />} />
          <Route path="/employer/profile/:id" element={<EmployerProfile />} />
          <Route path="/employer/jobs/:employerId" element={<EmployerJobs />} />
          <Route path="/employer/matches" element={<EmployerMatches />} />
          <Route path="/employer/messages" element={<EmployerMessages />} />
          <Route path="/employer/notifications" element={<EmployerNotifications />} />
          <Route path="/employer/privacy" element={<EmployerPrivacy />} />
          <Route path="/employer/help-support" element={<EmployerHelpSupport />} />
          <Route path="/employer/security" element={<EmployerSecurity />} />
          <Route path="/employer/terms-policies" element={<EmployerTermsPolicies />} />

          {/* WHV flow */}
          <Route path="/whv/onboarding" element={<WHVOnboarding />} />
          <Route path="/whv/email-confirmation" element={<WHVEmailConfirmation />} />
          <Route path="/whv/about-you" element={<WHVAboutYou />} />
          <Route path="/whv/profile-setup" element={<WHVProfileSetup />} />
          <Route path="/whv/work-preferences" element={<WHVWorkPreferences />} />
          <Route path="/whv/work-experience" element={<WHVWorkExperience />} />
          <Route path="/whv/photo-upload" element={<WHVPhotoUpload />} />
          <Route path="/whv/account-confirmation" element={<WHVAccountConfirmation />} />
          <Route path="/whv/dashboard" element={<WHVDashboard />} />
          <Route path="/whv/edit-profile" element={<WHVEditProfile />} />
          <Route path="/whv/profile-preview" element={<WHVProfilePreview />} />
          <Route path="/whv/matches" element={<WHVMatches />} />
          <Route path="/whv/messages" element={<WHVMessages />} />
          <Route path="/whv/notifications" element={<WHVNotifications />} />
          <Route path="/whv/privacy" element={<WHVPrivacy />} />
          <Route path="/whv/help-support" element={<WHVHelpSupport />} />
          <Route path="/whv/employer/profile/:id" element={<WHVEmployerProfile />} />
          <Route path="/whv/employer/full-profile/:id" element={<WHVEmployerFullProfile />} />
          <Route path="/whv/employer/jobs/:employerId" element={<WHVEmployerJobs />} />
          <Route path="/whv/employer/job-details/:id" element={<WHVEmployerJobDetails />} />
          <Route path="/whv/job-details/:employerId/:jobId" element={<WHVJobDetails />} />
          <Route path="/whv/browse-employers" element={<WHVBrowseEmployers />} />
          <Route path="/whv/login" element={<Navigate to="/sign-in" replace />} />
          <Route path="/employer/login" element={<Navigate to="/sign-in" replace />} />

          {/* Shared/misc */}
          <Route path="/profile-completion" element={<ProfileCompletion />} />
          <Route path="/business-registration" element={<BusinessRegistration />} />
          <Route path="/photo-upload" element={<PhotoUpload />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/profile-preview" element={<ProfileCardPreview />} />
          <Route path="/security" element={<Security />} />
          <Route path="/edit-business-profile" element={<EditBusinessProfile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/help-support" element={<HelpSupport />} />
          <Route path="/terms-policies" element={<TermsPolicies />} />
          <Route path="/post-jobs" element={<PostJobs />} />
          <Route path="/browse-candidates" element={<BrowseCandidates />} />
          <Route path="/candidate-profile/:id" element={<CandidateProfile />} />
          <Route path="/full-candidate-profile/:id" element={<FullCandidateProfile />} />
          <Route path="/job-details/:employerId/:jobId" element={<JobDetails />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/mutual-match/:id" element={<MutualMatchProfile />} />
          <Route path="/account-confirmation" element={<AccountConfirmation />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

