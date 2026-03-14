import React from 'react'
import { Header } from './components/Layout/Header'
import { Sidebar } from './components/Layout/Sidebar'
import { StatusBar } from './components/Layout/StatusBar'
import { Viewport3D } from './components/Viewport/Viewport3D'
import { ToastContainer } from './components/UI/Toast'

export default function App() {
  return (
    <div className="app-layout">
      <Header />
      <div className="app-content">
        <Sidebar />
        <Viewport3D />
      </div>
      <StatusBar />
      <ToastContainer />
    </div>
  )
}
