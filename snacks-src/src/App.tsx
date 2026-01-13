import { useState } from 'react'
import { Snack } from '../data/types';
import { SNACKS } from '../data/snacks';

// Elo rating system constants
// How much ratings change per comparison
const K_FACTOR = 32 


// Elo probability calculation
function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

// Update ratings after a comparison
function updateRatings(winner: Snack, loser: Snack): [number, number] {
  const expectedWin = expectedScore(winner.rating, loser.rating)
  const expectedLose = expectedScore(loser.rating, winner.rating)
  
  const newWinnerRating = winner.rating + K_FACTOR * (1 - expectedWin)
  const newLoserRating = loser.rating + K_FACTOR * (0 - expectedLose)
  
  return [newWinnerRating, newLoserRating]
}

// Pick two snacks for comparison (prioritizes uncertain matchups)
const generateUpset = (): boolean => {
  return Math.random() < 0.2; 
}

function pickMatchup(allRanks: Snack[][]): [Snack, Snack] {
  if (generateUpset()) {
    // Pick two different ranks
    const rankIndex1 = Math.floor(Math.random() * allRanks.length);
    let rankIndex2 = Math.floor(Math.random() * allRanks.length);
    while (rankIndex2 === rankIndex1) {
      rankIndex2 = Math.floor(Math.random() * allRanks.length);
    }
    
    const snack1 = allRanks[rankIndex1][Math.floor(Math.random() * allRanks[rankIndex1].length)];
    const snack2 = allRanks[rankIndex2][Math.floor(Math.random() * allRanks[rankIndex2].length)];
    return [snack1, snack2];
  } else {
    // Pick from same rank
    const rank = allRanks[Math.floor(Math.random() * allRanks.length)];
    return skillBasedMatchMaking(rank);
  }
}

function skillBasedMatchMaking(rank: Snack[]): [Snack, Snack] {
  let firstSnack = rank[Math.floor(Math.random() * (rank.length))]
  let secondSnack = rank[Math.floor(Math.random() * (rank.length))];
  while(firstSnack === secondSnack){
    firstSnack = rank[Math.floor(Math.random() * rank.length)];
  }
  return [firstSnack, secondSnack];
}

function getInitialMatchup(): [Snack, Snack] {
  const shuffled = [...SNACKS].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

function App() {
  const [snacks, setSnacks] = useState<Snack[]>(SNACKS)
  const [matchup, setMatchup] = useState<[Snack, Snack]>(() => getInitialMatchup());
  const [comparisons, setComparisons] = useState(0)
  const [showResults, setShowResults] = useState(false)

  const suggestedComparisons = snacks.length * 4 
  const sortedSnacks = [...snacks].sort((a,b) => b.rating - a.rating);

  const CHALLENGER_SNACKS = sortedSnacks.slice(0, Math.floor(sortedSnacks.length * 0.1));
  const MASTER_SNACKS = sortedSnacks.slice(0, Math.floor(sortedSnacks.length * 0.4)).filter((snack) => !CHALLENGER_SNACKS.includes(snack));
  const PLATINUM_SNACKS = sortedSnacks.slice(0, Math.floor(sortedSnacks.length * 0.7)).filter((snack) =>  !CHALLENGER_SNACKS.includes(snack) && !MASTER_SNACKS.includes(snack));
  const BRONZE_SNACKS = sortedSnacks.slice().filter((snack) => !CHALLENGER_SNACKS.includes(snack) && !MASTER_SNACKS.includes(snack) && !PLATINUM_SNACKS.includes(snack));

  const ALL_RANKS = [CHALLENGER_SNACKS, MASTER_SNACKS, PLATINUM_SNACKS, BRONZE_SNACKS];

  const handleChoice = (winner: Snack, loser: Snack) => {
    const [newWinnerRating, newLoserRating] = updateRatings(winner, loser)
    
    setSnacks(prev => prev.map(s => {
      if (s.id === winner.id) return { ...s, rating: newWinnerRating }
      if (s.id === loser.id) return { ...s, rating: newLoserRating }
      return s
    }))
    
    setComparisons(prev => prev + 1)
    
    setMatchup(pickMatchup(ALL_RANKS));
  }


  if (showResults) {
    return (
      <div className="container">
        <h1>🍿 Final Rankings</h1>
        <p>After {comparisons} comparisons</p>
        <ol className="rankings">
          {sortedSnacks!.map((snack, index) => (
            <li key={snack.id}>
              <span className="rank">#{index + 1}</span>
              <span className="name">{snack.name}</span>
              <span className="rating">{Math.round(snack.rating)}</span>
            </li>
          ))}
        </ol>
        <button onClick={() => setShowResults(false)}>Continue Ranking</button>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>BIG BACK</h1>
      <p className="progress">
        Comparisons: {comparisons} / {suggestedComparisons} suggested
      </p>
      
      <div className="matchup">
        <button 
          className="snack-button"
          onClick={() => 
            handleChoice(matchup[0], matchup[1])}
        >
          {matchup[0].name}
        </button>
        
        <span className="vs">vs</span>
        
        <button 
          className="snack-button"
          onClick={() => handleChoice(matchup[1], matchup[0])}
        >
          {matchup[1].name}
        </button>
      </div>

      <button 
        className="results-button"
        onClick={() => setShowResults(true)}
      >
        View Current Rankings
      </button>
    </div>
  )
}

export default App
