// // App.jsx
// import { Canvas } from "@react-three/fiber";
// import { OrbitControls, useGLTF } from "@react-three/drei";
// import { Suspense } from "react";

// function BikeModel(props) {
//   const { scene } = useGLTF("/models/carbon_frame_bike.glb");

//   return (
//     <primitive
//       object={scene}
//       scale={4.5}             // make slightly larger
//       position={[0, -2, 0]} // lower so wheels touch ground
//       rotation={[0, Math.PI, 0]} // face camera
//       {...props}
//     />
//   );
// }

// export default function App() {
//   return (
//     <div className="h-screen w-screen bg-gradient-to-b from-black to-green-900">
//   {/* Overlay text */}
//   <div className="absolute top-1/3 w-full text-center text-white z-10">
//     <h1 className="text-5xl font-bold text-green-400 drop-shadow-lg">
//       BoltRide
//     </h1>
//     <p className="text-xl text-green-200 mt-2">Redefining EV Rides</p>
//   </div>

//   {/* 3D Scene */}
//   <div className="w-screen" style={{ height: "150vh" }}>
// <Canvas
//     camera={{ position: [0, 3, 15], fov: 40 }}
//     className="absolute top-0 left-0 h-full w-full"
//   >
//     <ambientLight intensity={1.5} />
//     <directionalLight position={[5, 5, 5]} intensity={2} />
//     <BikeModel />
//     <OrbitControls enableZoom={true} />
//   </Canvas>
// </div>

// </div>

//   );
// }


// import { Canvas, useFrame } from "@react-three/fiber";
// import { ScrollControls, useScroll, OrbitControls, useGLTF, useAnimations } from "@react-three/drei";
// import { useEffect, useRef } from "react";

// function BikeModel() {
//   const { scene, animations } = useGLTF("/models/carbon_frame_bike.glb");
//   const { actions, mixer } = useAnimations(animations, scene);
//   const scroll = useScroll();
//   const actionRef = useRef(null);

//   useEffect(() => {
//     if (actions && Object.keys(actions).length > 0) {
//       const firstAction = actions[Object.keys(actions)[0]];
//       firstAction.play();
//       actionRef.current = firstAction;
//     }
//   }, [actions]);

//   useFrame(() => {
//     if (actionRef.current && mixer) {
//       const duration = actionRef.current.getClip().duration;
//       // scroll.offset is [0..1] across total pages
//       mixer.setTime(scroll.offset * duration);
//     }
//   });

//   return (
//     <primitive 
//       object={scene} 
//       scale={2.5} 
//       position={[0, -2, 0]} 
//       rotation={[0, Math.PI, 0]} 
//     />
//   );
// }

// export default function LandingPage() {
//   return (
//     <div className="w-screen h-screen" style={{ height: "150vh" }}>
//       <Canvas camera={{ position: [0, 3, 12], fov: 35 }}>
//         <ambientLight intensity={1.5} />
//         <directionalLight position={[5, 5, 5]} intensity={1.5} />

//         {/* 2 scrollable pages */}
//         <ScrollControls pages={2} damping={0.25}>
//           <BikeModel />
//         </ScrollControls>

//         <OrbitControls enableZoom={false} />
//       </Canvas>
//     </div>
//   );
// }

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Stations from "./pages/Stations";
import Wallet from "./pages/Wallet";
import Rides from "./pages/Rides";
import BuyPasses from "./pages/BuyPasses";
import NewActiveRide from "./pages/NewActiveRide";
import UnlockVehicle from "./pages/UnlockVehicle";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/stations" element={<Stations />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/rides" element={<Rides />} />
        <Route path="/buy-passes" element={<BuyPasses />} />
        <Route path="/active-ride" element={<NewActiveRide />} />
        <Route path="/unlock-vehicle" element={<UnlockVehicle />} />
      </Routes>
    </Router>
  );
}
