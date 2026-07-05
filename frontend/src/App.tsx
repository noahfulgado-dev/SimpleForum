import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Landing } from './pages/landing';
import { Login } from './pages/login';
import { Signup } from './pages/signup';

function App() {
  return (
    
    <Routes>
      <Route path="/" element={<Landing/>}/>
      <Route path="/login" element={<Login />} /> 
      <Route path="/signup" element={<Signup />} /> 
    </Routes>
  );
}

export default App;
