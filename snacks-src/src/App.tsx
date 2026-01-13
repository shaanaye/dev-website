import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { Snack } from '../data/types'
import { SNACKS } from '../data/snacks'

const K_FACTOR = 32

// ==================== ELO FUNCTIONS ===================

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

function updateRatings(winner: Snack, loser: Snack): [number, number] {
  const expectedWin = expectedScore(winner.rating, loser.rating)
  const expectedLose = expectedScore(loser.rating, winner.rating)
  const newWinnerRating = winner.rating + K_FACTOR * (1 - expectedWin)
  const newLoserRating = loser.rating + K_FACTOR * (0 - expectedLose)
  return [newWinnerRating, newLoserRating]
}

function getRandomMatchup(snacks: Snack[]): [Snack, Snack] {
  const shuffled = [...snacks].sort(() => Math.random() - 0.5)
  return [shuffled[0], shuffled[1]]
}

// ==================== TYPES ====================

type Mode = 'loading' | 'login' | 'host' | 'friend' | 'leaderboard' | 'snack-rankings';

interface LeaderboardEntry {
  id: string
  name: string
  score: number
  total: number
  created_at: string
}

// ==================== MAIN APP ====================

function App() {
  const [mode, setMode] = useState<Mode>('loading')
  const [snacks, setSnacks] = useState<Snack[]>([])
  const [matchup, setMatchup] = useState<[Snack, Snack] | null>(null)
  const [comparisons, setComparisons] = useState(0)
  const [showResults, setShowResults] = useState(false)
  
  // Friend mode state
  const [score, setScore] = useState(0)
  const [totalGuesses, setTotalGuesses] = useState(0)
  const [friendName, setFriendName] = useState('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [submitted, setSubmitted] = useState(false)

  const FRIEND_TOTAL_ROUNDS = 20

  // ==================== INIT ====================

  useEffect(() => {
    initApp()
  }, [])

  async function initApp() {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: dbSnacks, error } = await supabase
      .from('snacks')
      .select('*')

    if (error) {
      console.error('Error loading snacks:', error)
      return
    }

    if (dbSnacks && dbSnacks.length > 0) {
      setSnacks(dbSnacks)
      setMatchup(getRandomMatchup(dbSnacks))
    } else {
      setSnacks(SNACKS)
      setMatchup(getRandomMatchup(SNACKS))
    }

    await loadLeaderboard()
    setMode(user ? 'host' : 'friend')
  }

  async function loadLeaderboard() {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(20)

    if (!error && data) {
      setLeaderboard(data)
    }
  }

  // ==================== AUTH ====================

  async function handleLogin(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert('Login failed: ' + error.message)
      return
    }

    setMode('host')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setMode('friend')
    setScore(0)
    setTotalGuesses(0)
    setSubmitted(false)
    setMatchup(getRandomMatchup(snacks))
  }

  // ==================== HOST MODE ====================

  function handleHostChoice(winner: Snack, loser: Snack) {
    const [newWinnerRating, newLoserRating] = updateRatings(winner, loser)

    const updatedSnacks = snacks.map(s => {
      if (s.id === winner.id) return { ...s, rating: newWinnerRating }
      if (s.id === loser.id) return { ...s, rating: newLoserRating }
      return s
    })

    setSnacks(updatedSnacks)
    setComparisons(prev => prev + 1)
    setMatchup(getRandomMatchup(updatedSnacks))
  }

  async function saveRankings() {
    const updates = snacks.map(snack => ({
      id: snack.id,
      name: snack.name,
      rating: snack.rating,
      updated_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('snacks')
      .upsert(updates)

    if (error) {
      alert('Error saving: ' + error.message)
    } else {
      alert('Rankings saved!')
    }
  }

  async function seedSnacks() {
    const seeds = SNACKS.map(snack => ({
      id: snack.id,
      name: snack.name,
      rating: snack.rating,
      updated_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('snacks')
      .upsert(seeds)

    if (error) {
      alert('Error seeding: ' + error.message)
    } else {
      alert('Snacks seeded to database!')
    }
  }

  // ==================== FRIEND MODE ====================

  function handleFriendChoice(chosen: Snack, other: Snack) {
    const correct = chosen.rating > other.rating
    if (correct) {
      setScore(prev => prev + 1)
    }

    setTotalGuesses(prev => prev + 1)

    if (totalGuesses + 1 >= FRIEND_TOTAL_ROUNDS) {
      return
    }

    setMatchup(getRandomMatchup(snacks))
  }

  async function submitScore() {
    if (!friendName.trim()) {
      alert('Enter your name!')
      return
    }

    const { error } = await supabase
      .from('leaderboard')
      .insert({
        name: friendName.trim(),
        score: score,
        total: FRIEND_TOTAL_ROUNDS
      })

    if (error) {
      alert('Error submitting: ' + error.message)
      return
    }

    setSubmitted(true)
    await loadLeaderboard()
    setMode('leaderboard')
  }

  // ==================== RENDER ====================

  const sortedSnacks = [...snacks].sort((a, b) => b.rating - a.rating)

  if (mode === 'loading') {
    return (
      <div className="container">
        <h1>Loading...</h1>
      </div>
    )
  }

  if (mode === 'login') {
    return <LoginScreen onLogin={handleLogin} onBack={() => setMode('friend')} />
  }

  if (mode === 'leaderboard') {
    return (
      <div className="container">
        <h1>🏆 Leaderboard</h1>
        {submitted && (
          <p className="result-message">
            You got {score}/{FRIEND_TOTAL_ROUNDS} correct! ({Math.round(score/FRIEND_TOTAL_ROUNDS * 100)}%)
          </p>
        )}
        <ol className="rankings">
          {leaderboard.map((entry, index) => (
            <li key={entry.id}>
              <span className="rank">#{index + 1}</span>
              <span className="name">{entry.name}</span>
              <span className="rating">{entry.score}/{entry.total} ({Math.round(entry.score/entry.total * 100)}%)</span>
            </li>
          ))}
        </ol>
        <button className="results-button" onClick={() => {
          setScore(0)
          setTotalGuesses(0)
          setSubmitted(false)
          setMatchup(getRandomMatchup(snacks))
          setMode('friend')
        }}>
          Play Again
        </button>
        <button className="results-button" onClick={() => {
          setMode('snack-rankings')
          setScore(0)
          setTotalGuesses(0)
          setSubmitted(false)
        }}>
          View Snack Rankings
        </button>
      </div>
    )
  }

  if (mode === 'snack-rankings') {
    const challengerEnd = Math.floor(sortedSnacks.length * 0.1);
    const masterEnd = Math.floor(sortedSnacks.length * 0.4);
    const platinumEnd = Math.floor(sortedSnacks.length * 0.7);

    const getTier = (index: number): string => {
      if (index < challengerEnd) return '🏆 Challenger';
      if (index < masterEnd) return '💎 Master';
      if (index < platinumEnd) return '🥈 Platinum';
      return '🥉 Bronze';
    };

    const getTierClass = (index: number): string => {
      if (index < challengerEnd) return 'tier-challenger';
      if (index < masterEnd) return 'tier-master';
      if (index < platinumEnd) return 'tier-platinum';
      return 'tier-bronze';
    };

    return (
      <div className="container">
        <h1>🍿 Shaan's Snack Rankings</h1>
        <ol className="rankings">
          {sortedSnacks.map((snack, index) => (
            <li key={snack.id} className={getTierClass(index)}>
              <span className="rank">#{index + 1}</span>
              <span className="name">{snack.name}</span>
              <span className="tier">{getTier(index)}</span>
              <span className="rating">{Math.round(snack.rating)}</span>
            </li>
          ))}
        </ol>
        <button className="results-button" onClick={() => setMode('leaderboard')}>
          Back to Leaderboard
        </button>
      </div>
    )
  }

  if (mode === 'host' && showResults) {
    return (
      <div className="container">
        <div className="header-row">
          <h1>🍿 Your Rankings</h1>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
        <p>After {comparisons} comparisons</p>
        <ol className="rankings">
          {sortedSnacks.map((snack, index) => (
            <li key={snack.id}>
              <span className="rank">#{index + 1}</span>
              <span className="name">{snack.name}</span>
              <span className="rating">{Math.round(snack.rating)}</span>
            </li>
          ))}
        </ol>
        <div className="button-row">
          <button onClick={() => setShowResults(false)}>Continue Ranking</button>
          <button onClick={saveRankings}>Save to Database</button>
          <button onClick={seedSnacks}>Reset to Defaults</button>
        </div>
      </div>
    )
  }

  if (mode === 'host' && matchup) {
    return (
      <div className="container">
        <div className="header-row">
          <h1>My rankings</h1>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
        <p className="progress">Comparisons: {comparisons}</p>

        <div className="matchup">
          <button
            className="snack-button"
            onClick={() => handleHostChoice(matchup[0], matchup[1])}
          >
            {matchup[0].name}
          </button>
          <span className="vs">vs</span>
          <button
            className="snack-button"
            onClick={() => handleHostChoice(matchup[1], matchup[0])}
          >
            {matchup[1].name}
          </button>
        </div>

        <div className="button-row">
          <button className="results-button" onClick={() => setShowResults(true)}>
            View Rankings
          </button>
          <button className="results-button" onClick={saveRankings}>
            Save
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'friend' && totalGuesses >= FRIEND_TOTAL_ROUNDS) {
    return (
      <div className="container">
        <h1>🎉 Results</h1>
        <p className="result-message">
          You got {score}/{FRIEND_TOTAL_ROUNDS} correct!<br />
          ({Math.round(score/FRIEND_TOTAL_ROUNDS * 100)}% accuracy)
        </p>

        {!submitted ? (
          <div className="submit-form">
            <input
              type="text"
              placeholder="Enter your name"
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              className="name-input"
            />
            <button onClick={submitScore}>Submit to Leaderboard</button>
          </div>
        ) : (
          <button onClick={() => setMode('leaderboard')}>View Leaderboard</button>
        )}
      </div>
    )
  }

  if (mode === 'friend' && matchup) {
    return (
      <div className="container">
        <h1>What would I prefer?</h1>
        <p className="progress">
          Round {totalGuesses + 1}/{FRIEND_TOTAL_ROUNDS} • Score: {score}
        </p>
        <p className="subtitle">
          Choose based on if I had an entire, bag, box, container, etc. of the item in front of me. What would I choose?
          </p>

        <div className="matchup">
          <button
            className="snack-button"
            onClick={() => handleFriendChoice(matchup[0], matchup[1])}
          >
            {matchup[0].name}
          </button>
          <span className="vs">vs</span>
          <button
            className="snack-button"
            onClick={() => handleFriendChoice(matchup[1], matchup[0])}
          >
            {matchup[1].name}
          </button>
        </div>

        <div className="button-row">
          <button className="results-button" onClick={() => setMode('leaderboard')}>
            View Leaderboard
          </button>
          <button className="results-button" onClick={() => setMode('login')}>
            Host Login
          </button>
        </div>
      </div>
    )
  }

  return <div className="container"><h1>Something went wrong</h1></div>
}

// ==================== LOGIN COMPONENT ====================

function LoginScreen({ onLogin, onBack }: { onLogin: (email: string, password: string) => void, onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="container">
      <h1>🔐 Host Login</h1>
      <div className="login-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="name-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="name-input"
        />
        <button onClick={() => onLogin(email, password)}>Login</button>
        <button className="results-button" onClick={onBack}>Back</button>
      </div>
    </div>
  )
}

export default App