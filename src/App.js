//==============// React imports //=================//
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
//==============// Auth imports //=================//
import Login from "./AnA/Login";
import Register from "./AnA/Register";
import AuthRoute from "./AnA/AuthRoute";
//==============// Admin imports //==============//
import AdminDashboard from "./Admin/Admin";
import AdminRoute from "./Admin/AdminRoute";
import AdminSettings from "./Admin/AdminSettings.jsx";
import AdminNavigationDrawer from "./Admin/AdminNavigationDrawer";
import AdminMembers from "./Admin/AdminMembers";
import AdminCourses from "./Admin/AdminCourses";
import AdminAssessments from "./Admin/AdminAssessments";
import TutorialManagement from "./Admin/TutorialManagement.jsx";
import AdminTreasury from "./Admin/AdminTreasury.jsx";
//==============// Member imports //==============//
import MemberDashboard from "./Members/MainInter.jsx";
import CourseViewer from "./Members/CourseViewer.jsx";
import CoursePageDisplay from "./Members/CoursesPage.jsx";
import AssessmentDisplay from "./Members/past_papers.jsx";
import MemberSettings from "./Members/MemberSettings.jsx";
import TutorialPage from "./Members/TutorialPage.jsx";
//=============// Viewer Routes //==============//
import ViewerDashboard from "./Viewers/MainInter.jsx";
//============// Tests //====================//
import FirebaseRulesTester from './Tests/FirebaseRulesTester.jsx';
import OnlineCompiler from "./Members/Compiler.jsx";
import MathSolvers from "./Math/MathSolver.jsx";
//===========// System utils //==============//
import NavigationDrawer from "./System/MemberNavigation.jsx";
import Loading from "./components/loading.jsx";
//===========// pages //===============//
import HomePage from "./Home";

//======== AI ===========//
import AIStudy from "./Ai/AIStudy";
import QuizPlayer from "./Ai/QuizPlayer";





//==============// Tutor imports //==============//
import TutorDashboard from "./Tutors/TutorDashboard";
import TutorCourses from "./Tutors/TutorCourses";
import TutorTutorials from "./Tutors/TutorTutorials";
import TutorAssessments from "./Tutors/TutorAssessments";
import TutorSettings from "./Tutors/TutorSettings";
import TutorNavigationDrawer from "./Tutors/TutorNav";
import TutorRoute from "./Tutors/TutorRoute";

// Helper component to wrap tutor routes with TutorNavigationDrawer
const TutorRouteWrapper = ({ children }) => (
  <TutorRoute>
    <TutorNavigationDrawer>
      {children}
    </TutorNavigationDrawer>
  </TutorRoute>
);






const App = () => {
  // Helper component to wrap member routes with NavigationDrawer
  const MemberRoute = ({ children }) => (
    <AuthRoute>
      <NavigationDrawer>
        {children}
      </NavigationDrawer>
    </AuthRoute>
  );
  
  // Helper component to wrap admin routes with AdminNavigationDrawer
  const AdminRouteWrapper = ({ children }) => (
    <AdminRoute>
      <AdminNavigationDrawer>
        {children}
      </AdminNavigationDrawer>
    </AdminRoute>
  );
  
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/viewer" element={<ViewerDashboard />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/test" element={<FirebaseRulesTester />}/>
        
        {/* Protected member routes with NavigationDrawer */}
        <Route
          path="/dashboard"
          element={
            <MemberRoute>
              <MemberDashboard />
            </MemberRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <MemberRoute>
              <CoursePageDisplay />
            </MemberRoute>
          }
        />
        <Route
          path="/papers"
          element={
            <MemberRoute>
              <AssessmentDisplay />
            </MemberRoute>
          }
        />
        <Route
          path="/course/:courseId"
          element={
            <MemberRoute>
               <CourseViewer />
            </MemberRoute>
          }
        />
        <Route
          path="/compiler"
          element={
            <MemberRoute>
              <OnlineCompiler />
            </MemberRoute>
          }
        />
        
        <Route
  path="/ai-study"
  element={
    <MemberRoute>
      <AIStudy />
    </MemberRoute>
  }
/>
<Route
  path="/quiz/:quizId"
  element={
    <MemberRoute>
      <QuizPlayer />
    </MemberRoute>
  }
/>


<Route
  path="/tutor"
  element={
    <TutorRouteWrapper>
      <TutorDashboard />
    </TutorRouteWrapper>
  }
/>
<Route
  path="/tutor/courses"
  element={
    <TutorRouteWrapper>
      <TutorCourses />
    </TutorRouteWrapper>
  }
/>
<Route
  path="/tutor/tutorials"
  element={
    <TutorRouteWrapper>
      <TutorTutorials />
    </TutorRouteWrapper>
  }
/>
<Route
  path="/tutor/assessments"
  element={
    <TutorRouteWrapper>
      <TutorAssessments />
    </TutorRouteWrapper>
  }
/>
<Route
  path="/tutor/settings"
  element={
    <TutorRouteWrapper>
      <TutorSettings />
    </TutorRouteWrapper>
  }
/>




        
        <Route
          path="/tuitions"
          element={
            <MemberRoute>
              <TutorialPage />
            </MemberRoute>
          }
        />
        
        <Route
          path="/settings"
          element={
            <MemberRoute>
              <MemberSettings />
            </MemberRoute>
          }
        />
        <Route
          path="/math-solver"
          element={
            <MemberRoute>
              <MathSolvers />
            </MemberRoute>
          }
        />
        
        {/* Protected admin routes with AdminNavigationDrawer */}
        <Route
          path="/admin"
          element={
            <AdminRouteWrapper>
              <AdminDashboard />
            </AdminRouteWrapper>
          }
        />
        <Route
          path="/admin/members"
          element={
            <AdminRouteWrapper>
              <AdminMembers />
            </AdminRouteWrapper>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <AdminRouteWrapper>
              <AdminCourses />
            </AdminRouteWrapper>
          }
        />
        <Route
          path="/admin/assessments"
          element={
            <AdminRouteWrapper>
              <AdminAssessments />
            </AdminRouteWrapper>
          }
        />
        <Route
          path="/admin/treasury"
          element={
            <AdminRouteWrapper>
              <AdminTreasury />
            </AdminRouteWrapper>
          }
        />
        <Route
          path="/admin/live"
          element={
            <AdminRouteWrapper>
              <TutorialManagement />
            </AdminRouteWrapper>
          }
        />
        <Route
          path="/adminSettings"
          element={
            <AdminRouteWrapper>
              <AdminSettings />
            </AdminRouteWrapper>
          }
        />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
