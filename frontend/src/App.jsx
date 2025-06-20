import { useState } from 'react'
import './App.css'

function App() {
  const [hasPGBeenClicked, setHasPGBeenClicked] = useState(false) 

  return (
    <>
      <h1>GeoTug</h1>
      <h2>A best-of-7 tug-of-war flag guessing game</h2>
      <div className="button-wrapper">
        <button disabled>Matchmaking</button>
        <div className="private-game-button-wrapper">
          <button 
            type="button" 
            onClick={() => setHasPGBeenClicked(!hasPGBeenClicked)}>
              Private Game
          </button>
            {hasPGBeenClicked && (
              <div className="create-join-wrapper">
                <button>Create Game</button>
                <button>Join Game</button>
              </div>
            )}
        </div>
        
      </div>
    </>
  )
}

export default App
