import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { GameProvider } from './game/GameContext'
import { useGame } from './game/useGame'


import StatusBar from './components/StatusBar'
import WelcomeScreen from './pages/WelcomeScreen'
import ChefProfileScreen from './pages/ChefProfileScreen'
import GameHubScreen from './pages/GameHubScreen'
import QuestionScreen from './pages/QuestionScreen'
import LevelResultScreen from './pages/LevelResultScreen'
import PizzaBuilderScreen from './pages/PizzaBuilderScreen'
import OrderScreen from './pages/OrderScreen'
import Chat from './pages/Chat'
import OrdersModeScreen from './pages/OrdersModeScreen'
import OrdersShiftsScreen from './pages/OrdersShiftsScreen'
import RewardsScreen from './pages/RewardsScreen'
import CommunityScreen from './pages/CommunityScreen'

function RequireChef() {
  const { userName } = useGame()
  return userName ? <Outlet /> : <Navigate to="/" replace />
}

export default function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <StatusBar />
        <div className="app-main">
          <Routes>
            <Route path="/" element={<WelcomeScreen />} />
            <Route path="/chef" element={<ChefProfileScreen />} />
            <Route element={<RequireChef />}>
              <Route path="/chat" element={<Chat />} />
              <Route path="/jugar" element={<GameHubScreen />} />
              <Route path="/recompensas" element={<RewardsScreen />} />
              <Route path="/comunidad" element={<CommunityScreen />} />
              <Route path="/pedidos" element={<OrdersShiftsScreen />} />
              <Route path="/pedidos/:stage" element={<OrdersModeScreen />} />
              <Route path="/nivel/:levelId" element={<QuestionScreen />} />
              <Route path="/nivel/:levelId/resultado" element={<LevelResultScreen />} />
              <Route path="/nivel/:levelId/pizza" element={<PizzaBuilderScreen />} />
              <Route path="/nivel/:levelId/pedido" element={<OrderScreen />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </GameProvider>
  )
}
