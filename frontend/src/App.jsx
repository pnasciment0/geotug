import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateGame from './pages/CreateGame';
import GamePage from './pages/GamePage';
import JoinGame from './pages/JoinGame';
import './App.css'

function App() {
 const [buttonClicked, setButtonClicked] = useState(false)

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage buttonClicked={buttonClicked} setButtonClicked={setButtonClicked}/>} />
        <Route path="/createGame" element={< CreateGame/>} />
        <Route path="/game/:id" element={<GamePage/>} />
        <Route path="/joinGame" element={<JoinGame/> }/>
      </Routes>
    </Router>
  );
}

export default App
