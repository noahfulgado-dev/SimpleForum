import { Routes, Route } from 'react-router-dom';
import { Landing } from './pages/landing';
import { Login } from './pages/login';
import { Signup } from './pages/signup';
import { Feed } from './pages/feed';
import { Profile } from './pages/profile';
import { Bookmarks } from './pages/bookmarks';
import { TopicDetail } from './pages/topic_detail';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    
    <Routes>
      <Route path="/" element={<Landing/>}/>
      <Route path="/login" element={<Login />} /> 
      <Route path="/signup" element={<Signup />} /> 
      <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} /> 
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} /> 
      <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} /> 
      <Route path="/topic/:id" element={<ProtectedRoute><TopicDetail /></ProtectedRoute>} /> 
    </Routes>
  );
}

export default App;
