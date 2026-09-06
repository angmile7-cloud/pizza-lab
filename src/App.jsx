import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { GameProvider } from './game/GameContext'
import StatusBar from './components/StatusBar'
import WelcomeScreen from './pages/WelcomeScreen'
import QuestionScreen from './pages/QuestionScreen'
import LevelResultScreen from './pages/LevelResultScreen'
import PizzaBuilderScreen from './pages/PizzaBuilderScreen'

export default function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <main>
          <StatusBar />
          <Routes>
            <Route path="/" element={<WelcomeScreen />} />
            <Route path="/nivel/:levelId" element={<QuestionScreen />} />
            <Route path="/nivel/:levelId/resultado" element={<LevelResultScreen />} />
            <Route path="/nivel/:levelId/pizza" element={<PizzaBuilderScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </GameProvider>
  )
}
