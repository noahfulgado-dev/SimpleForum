import { Routes, Route } from 'react-router-dom';
import { Landing } from './pages/landing';
import { Login } from './pages/login';
import { Signup } from './pages/signup';
import { Feed } from './pages/feed';

function App() {
  return (
    
    <Routes>
      <Route path="/" element={<Landing/>}/>
      <Route path="/login" element={<Login />} /> 
      <Route path="/signup" element={<Signup />} /> 
      <Route path="/feed" element={<Feed />} /> 
    </Routes>
  );
}

export default App;
