import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import './App.css'

import MapComponent from "./components/MapComponent";
import Bottomsheet from "./components/BottomSheet";

import Homepage from './pages/Homepage';
import ResourceMapping from "./pages/ResourceMapping";
import Groundwater from "./pages/Groundwater";
import SurfaceWaterBodies from "./pages/SurfaceWaterbodies";
import Agriculture from "./pages/Agriculture";
import Livelihood from "./pages/Livelihood";
import InfoBox from "./components/InfoBox";

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
           <InfoBox/>
             <Routes>
               <Route path="/maps" element={<Homepage />} />
               <Route path="/resourcemapping" element={<ResourceMapping />} />
               <Route path="/groundwater" element={<Groundwater />} />
               <Route path="/surfaceWater" element={<SurfaceWaterBodies />} />
               <Route path="/agriculture" element={<Agriculture />} />
               <Route path="/livelihood" element={<Livelihood />} />
             </Routes>
           </BrowserRouter>
         </div>
       </div>
    </div>
    </>
  )
}

export default App