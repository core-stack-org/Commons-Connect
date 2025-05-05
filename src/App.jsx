import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import './App.css'
import Homepage from './pages/Homepage';
import MapComponent from "./components/MapComponent";
import ResourceMapping from "./pages/ResourceMapping";
import Bottomsheet from "./components/BottomSheet";

function App() {
  
  return (
    <>
    <Toaster/>
    <div className="absolute z-30">
      <Bottomsheet/>
    </div>
    <div className="relative w-screen h-screen overflow-hidden z-0">
       <div className="absolute inset-0 z-0">
         <MapComponent />
       </div>
       <div className="absolute inset-0 z-10 pointer-events-none">
         <div className="pointer-events-auto">
           <BrowserRouter>
             <Routes>
               <Route path="/" element={<Homepage />} />
               <Route path="/resourcemapping" element={<ResourceMapping />} />
             </Routes>
           </BrowserRouter>
         </div>
       </div>
    </div>
    </>
  )
}

export default App