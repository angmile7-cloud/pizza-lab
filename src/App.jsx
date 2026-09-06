import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { GameProvider } from './game/GameContext'


import StatusBar from './components/StatusBar'
import WelcomeScreen from './pages/WelcomeScreen'
import AuthScreen from './pages/AuthScreen'
import GameHubScreen from './pages/GameHubScreen'
import QuestionScreen from './pages/QuestionScreen'
import LevelResultScreen from './pages/LevelResultScreen'
import PizzaBuilderScreen from './pages/PizzaBuilderScreen'
import Chat from './pages/Chat'

export default function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <StatusBar />
        <div className="app-main">
          <Routes>
            <Route path="/" element={<WelcomeScreen />} />
            <Route path="/registro" element={<AuthScreen mode="register" />} />
            <Route path="/login" element={<AuthScreen mode="login" />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/jugar" element={<GameHubScreen />} />
            <Route path="/nivel/:levelId" element={<QuestionScreen />} />
            <Route path="/nivel/:levelId/resultado" element={<LevelResultScreen />} />
            <Route path="/nivel/:levelId/pizza" element={<PizzaBuilderScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </GameProvider>
  )
}
