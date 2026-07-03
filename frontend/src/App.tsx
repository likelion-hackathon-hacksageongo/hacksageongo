import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PersonalInfoPage from './pages/PersonalInfoPage'
import PersonalityTestPage from './pages/PersonalityTestPage'
import ChatbotPage from './pages/ChatbotPage'
import ActivitiesPage from './pages/ActivitiesPage'
import TimelinePage from './pages/TimelinePage'
import TodoPage from './pages/TodoPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PersonalInfoPage />} />
        <Route path="/personality-test" element={<PersonalityTestPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/todos" element={<TodoPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
