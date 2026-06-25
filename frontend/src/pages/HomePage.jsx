import { useState } from 'react'
 import { Link } from 'react-router-dom';

function HomePage({ buttonClicked, setButtonClicked }) {
//   const [hasPGBeenClicked, setHasPGBeenClicked] = useState(false) 

//   const setButtonStates = () => {
//     setHasPGBeenClicked((!hasPGBeenClicked))
//     setButtonClicked(!buttonClicked)
//   }

  return (
    <>
      <h1>GeoTug</h1>   
      <h2>A best-of-7 tug-of-war flag guessing game</h2>
      <div className="button-wrapper">
        <button disabled>
            Matchmaking
            </button>
        <div className="private-game-button-wrapper">
          <button 
            type="button" 
            onClick={() => setButtonClicked(!buttonClicked)}>
              Private Game
          </button>
            {buttonClicked && (
              <div className="create-join-wrapper">
                <Link to="/createGame">
                    <button>Create Game</button>
                </Link>
                <Link to="/joinGame">
                  <button type="button">Join Game</button>
                </Link>
                </div>
            )}
        </div>
        
      </div>
    </>
  )
}

export default HomePage
