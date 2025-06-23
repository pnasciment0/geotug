import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateGame from './pages/CreateGame';
import './App.css'

function App() {
 const [buttonClicked, setButtonClicked] = useState(false)

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage buttonClicked={buttonClicked} setButtonClicked={setButtonClicked}/>} />
        <Route path="/CreateGame" element={< CreateGame/>} />
      </Routes>
    </Router>
  );
}

export default App
