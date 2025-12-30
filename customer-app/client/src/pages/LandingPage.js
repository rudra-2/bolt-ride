import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations, ScrollControls, useScroll, Float, Sparkles, Trail, Ring, Sphere } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Vector3, Color } from "three";
import Navbar from "../components/Navbar";
import { Zap, Bike, Leaf, Wallet, MapPin, Smartphone, Map, QrCode, ChevronRight, Heart, ArrowRight, MousePointer2 } from "lucide-react";

function ParticleSystem({ count = 100 }) {
  const mesh = useRef();
  const [particles] = useState(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        ],
        speed: Math.random() * 0.02 + 0.01,
        rotation: Math.random() * Math.PI * 2
      });
    }
    return temp;
  });

  useFrame((state) => {
    if (mesh.current) {
      const time = state.clock.getElapsedTime();
      mesh.current.rotation.y = time * 0.1;
    }
  });

  return (
    <group ref={mesh}>
      {particles.map((particle, i) => (
        <Sphere key={i} position={particle.position} args={[0.05]} material-color="#00FF94" material-opacity={0.3} material-transparent />
      ))}
    </group>
  );
}

function BikeModel() {
  const { scene, animations } = useGLTF("/models/carbon_frame_bike.glb");
  const { actions, mixer } = useAnimations(animations, scene);
  const scroll = useScroll();
  const actionRef = useRef(null);
  const bikeRef = useRef();
  const trailRef = useRef();

  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const firstAction = actions[Object.keys(actions)[0]];
      firstAction.play();
      actionRef.current = firstAction;
    }
  }, [actions]);

  useFrame((state) => {
    // Animation based on scroll
    if (actionRef.current && mixer) {
      const duration = actionRef.current.getClip().duration;
      mixer.setTime(scroll.offset * duration);
    }

    // Enhanced floating motion and rotation with unique effects
    if (bikeRef.current) {
      const time = state.clock.getElapsedTime();

      // Complex rotation patterns
      bikeRef.current.rotation.y = Math.sin(time * 0.5) * 0.4 + Math.cos(time * 0.3) * 0.1;
      bikeRef.current.rotation.x = Math.sin(time * 0.7) * 0.1;
      bikeRef.current.rotation.z = Math.cos(time * 0.4) * 0.05 + scroll.offset * 0.2;

      // Dynamic floating with figure-8 pattern
      bikeRef.current.position.y = -1.2 + Math.sin(time * 0.8) * 0.3 + Math.sin(time * 1.2) * 0.1;
      bikeRef.current.position.x = Math.sin(time * 0.6) * 0.2;
      bikeRef.current.position.z = Math.cos(time * 0.4) * 0.1;

      // Scale pulsing effect
      const scale = 2.5 + Math.sin(time * 2) * 0.1;
      bikeRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <Float speed={1.8} rotationIntensity={0.8} floatIntensity={0.8}>
      <group>
        {/* Energy rings around bike */}
        <Ring args={[3, 3.2, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
          <meshBasicMaterial color="#00FF94" transparent opacity={0.3} />
        </Ring>
        <Ring args={[2.5, 2.7, 32]} rotation={[Math.PI / 2, 0, Math.PI / 4]} position={[0, -1.2, 0]}>
          <meshBasicMaterial color="#00FF94" transparent opacity={0.2} />
        </Ring>

        {/* Main bike model */}
        <primitive
          ref={bikeRef}
          object={scene}
          scale={2.5}
          position={[0, -1.2, 0]}
        />

        {/* Enhanced sparkles with multiple layers */}
        <Sparkles
          count={80}
          scale={10}
          size={4}
          speed={0.8}
          color="#00FF94"
          opacity={0.7}
        />
        <Sparkles
          count={40}
          scale={6}
          size={2}
          speed={1.2}
          color="#ffffff"
          opacity={0.4}
        />

        {/* Particle system */}
        <ParticleSystem count={50} />
      </group>
    </Float>
  );
} export default function LandingPage() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    setIsDark(savedTheme === "dark");
  }, []);

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <Navbar />

      {/* Hero Section */}
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950 relative overflow-hidden transition-colors duration-500">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-400/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-blue-400/30 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-violet-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
        </div>

        {/* Main Content Container */}
        <div className="container mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left space-y-8">
            <div className="space-y-6">
              <h1 className="text-6xl lg:text-8xl font-black text-gray-800 dark:text-gray-200 leading-tight transition-colors duration-500">
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>R</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>i</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.3s' }}>d</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.4s' }}>e</span>
                <span className="inline-block mx-4"></span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.5s' }}>t</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.6s' }}>h</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.7s' }}>e</span>
                <br />
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center justify-center lg:justify-start gap-3" style={{ animationDelay: '0.8s' }}>
                  Future
                  <Zap className="w-12 h-12 text-indigo-600 animate-pulse" style={{animationDuration: '1.5s'}} />
                </span>
              </h1>

              <div className="relative">
                <h2 className="text-2xl lg:text-3xl font-light text-gray-600 dark:text-gray-400 animate-pulse transition-colors duration-500" style={{ animationDelay: '1s' }}>
                  Eco-friendly bike sharing made simple
                </h2>
                <div className="absolute -bottom-2 left-0 lg:left-0 w-32 h-1 bg-gradient-to-r from-evgreen to-green-400 rounded-full animate-pulse" style={{ animationDelay: '1.2s' }}></div>
              </div>
            </div>

            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed transition-colors duration-500" style={{ animationDelay: '1.4s' }}>
              Experience the future of urban mobility with our
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold"> eco-friendly</span> bike-sharing service.
              <span className="text-purple-600 dark:text-purple-400 font-semibold"> Sustainable</span>,
              <span className="text-blue-600 dark:text-blue-400 font-semibold"> convenient</span>, and
              <span className="text-violet-600 dark:text-violet-400 font-semibold"> affordable</span> transportation.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup" className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <button className="relative px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 shadow-lg flex items-center gap-2">
                  Start Your Journey
                  <Zap className="w-5 h-5 group-hover:animate-pulse" />
                </button>
              </Link>

              <Link to="/login" className="group">
                <button className="px-8 py-4 border-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transform hover:scale-105 transition-all duration-300 shadow-lg backdrop-blur-sm flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center group cursor-pointer transform hover:scale-110 transition-all duration-300">
                <div className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:animate-bounce">50+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Stations</div>
              </div>
              <div className="text-center group cursor-pointer transform hover:scale-110 transition-all duration-300">
                <div className="text-3xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent group-hover:animate-bounce">1000+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Rides</div>
              </div>
              <div className="text-center group cursor-pointer transform hover:scale-110 transition-all duration-300">
                <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:animate-bounce">24/7</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Available</div>
              </div>
            </div>
          </div>

          {/* Right Content - 3D Bike */}
          <div className="flex-1 w-full h-[600px] relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-blue-500/5 rounded-3xl backdrop-blur-sm border border-indigo-200/20 dark:border-indigo-500/20 shadow-2xl"></div>
            <Canvas camera={{ position: [0, 3, 12], fov: 35 }}>
              <ambientLight intensity={1.8} />
              <directionalLight
                position={[5, 5, 5]}
                intensity={2.5}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
              />
              <pointLight position={[-5, -5, -5]} intensity={0.8} color="#00FF94" />
              <pointLight position={[5, -5, 5]} intensity={0.5} color="#ffffff" />
              <ScrollControls pages={3} damping={0.25}>
                <BikeModel />
              </ScrollControls>
            </Canvas>

            {/* Floating UI Elements */}
            <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full border border-indigo-200 dark:border-indigo-500/30 animate-bounce shadow-lg" style={{ animationDelay: '2s' }}>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <MousePointer2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Scroll to explore
              </span>
            </div>

            <div className="absolute bottom-4 left-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full animate-pulse shadow-lg">
              <span className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4" />
                100% Electric
              </span>
            </div>

            <div className="absolute top-1/2 -left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-2 rounded-full border border-green-200 dark:border-green-500/30 animate-pulse shadow-lg" style={{ animationDelay: '1.5s' }}>
              <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                <Leaf className="w-4 h-4" />
                Eco-Friendly
              </span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce" style={{ animationDelay: '3s' }}>
          <div className="w-6 h-10 border-2 border-indigo-600 dark:border-indigo-400 rounded-full flex justify-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-lg">
            <div className="w-1 h-3 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full mt-2 animate-ping"></div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-b from-white via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-indigo-950/30 dark:to-purple-950/30 py-20 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-20 w-64 h-64 bg-indigo-400/40 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 left-20 w-80 h-80 bg-purple-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-5xl font-black text-center text-gray-800 dark:text-gray-100 mb-4">
            Why Choose
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent ml-3">BoltRide?</span>
          </h2>
          <div className="text-center mb-16">
            <div className="w-24 h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-full mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Join thousands of riders who have already made the switch to sustainable transportation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl text-center hover:bg-white dark:hover:bg-gray-800 hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-500 transform hover:-translate-y-2 border border-gray-200 dark:border-gray-700">
              <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Leaf className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Eco-Friendly</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Zero emissions, zero guilt. Join us in making cities greener, one ride at a time.
                Reduce your carbon footprint while exploring the city.
              </p>
              <div className="mt-6 inline-flex items-center text-green-600 dark:text-green-400 font-semibold group-hover:gap-2 transition-all">
                Learn More
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl text-center hover:bg-white dark:hover:bg-gray-800 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 transform hover:-translate-y-2 border border-gray-200 dark:border-gray-700" style={{ animationDelay: '0.2s' }}>
              <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Wallet className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Digital Wallet</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Quick and secure digital payments. Top up your wallet and ride worry-free.
                No cash needed, just seamless transactions.
              </p>
              <div className="mt-6 inline-flex items-center text-indigo-600 dark:text-indigo-400 font-semibold group-hover:gap-2 transition-all">
                Get Started
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl text-center hover:bg-white dark:hover:bg-gray-800 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 transform hover:-translate-y-2 border border-gray-200 dark:border-gray-700" style={{ animationDelay: '0.4s' }}>
              <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <MapPin className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Smart Stations</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Multiple stations across the city with real-time availability tracking.
                Find the nearest station with GPS-enabled smart locating.
              </p>
              <div className="mt-6 inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-2 transition-all">
                Find Stations
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="mt-20 text-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="group cursor-pointer">
                <div className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">99%</div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">Uptime</div>
              </div>
              <div className="group cursor-pointer">
                <div className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">5★</div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">Rating</div>
              </div>
              <div className="group cursor-pointer">
                <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">50K+</div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">Happy Users</div>
              </div>
              <div className="group cursor-pointer">
                <div className="text-4xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">100K+</div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">Rides Completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gradient-to-b from-purple-50/30 via-blue-50/30 to-white dark:from-purple-950/30 dark:via-blue-950/30 dark:to-gray-900 py-20 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-96 h-96 bg-purple-400/40 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-gray-800 dark:text-gray-100 mb-4">
              How It
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent ml-3">Works</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-full mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get started in minutes and join the green revolution
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center group relative">
              {/* Step connector */}
              <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-indigo-400/50 to-transparent z-0"></div>

              <div className="relative z-10 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 transform hover:-translate-y-2 transition-all duration-500 border border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-xl mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">1</div>
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 group-hover:animate-bounce mx-auto">
                  <Smartphone className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Download & Sign Up</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Create your account in minutes with just your email and get verified instantly</p>
                <div className="mt-4 inline-flex items-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm gap-1 group-hover:gap-2 transition-all">
                  Quick Setup
                  <ArrowRight className="w-4 h-4" />
            </div>

            <div className="text-center group relative">
              <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-evgreen/50 to-transparent z-0"></div>
purple-400/50 to-transparent z-0"></div>

              <div className="relative z-10 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:shadow-purple-500/10 transform hover:-translate-y-2 transition-all duration-500 border border-gray-200 dark:border-gray-700" style={{ animationDelay: '0.2s' }}>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-black text-xl mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">2</div>
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-xl bg-purple-100 dark:bg-purple-900/30 group-hover:animate-bounce mx-auto">
                  <Map className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Find a Station</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Locate the nearest station with available bikes using our GPS-enabled map</p>
                <div className="mt-4 inline-flex items-center text-purple-600 dark:text-purple-400 font-semibold text-sm gap-1 group-hover:gap-2 transition-all">
                  View Map
                  <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <div className="text-center group relative">
              <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-blue-400/50 to-transparent z-0"></div>

              <div className="relative z-10 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:shadow-blue-500/10 transform hover:-translate-y-2 transition-all duration-500 border border-gray-200 dark:border-gray-700" style={{ animationDelay: '0.4s' }}>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-black text-xl mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">3</div>
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-xl bg-blue-100 dark:bg-blue-900/30 group-hover:animate-bounce mx-auto">
                  <QrCode className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Scan QR Code</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Unlock your bike instantly by scanning the QR code on the bike</p>
                <div className="mt-4 inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold text-sm gap-1 group-hover:gap-2 transition-all">
                  Instant Access
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="text-center group">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:shadow-green-500/10 transform hover:-translate-y-2 transition-all duration-500 border border-gray-200 dark:border-gray-700" style={{ animationDelay: '0.6s' }}>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-black text-xl mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">4</div>
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-xl bg-green-100 dark:bg-green-900/30 group-hover:animate-bounce mx-auto">
                  <Bike className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Ride & Enjoy</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Hit the road and enjoy your eco-friendly ride through the city</p>
                <div className="mt-4 inline-flex items-center text-green-600 dark:text-green-400 font-semibold text-sm gap-1 group-hover:gap-2 transition-all">
                  Start Riding
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-3xl p-8 text-white shadow-2xl">
              <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
              <p className="text-xl mb-8 opacity-90">Join thousands of riders making cities cleaner, one ride at a time</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup" className="group">
                  <button className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-lg flex items-center gap-2 mx-auto">
                    Sign Up Free
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <Link to="/stations" className="group">
                  <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white hover:text-indigo-600 transform hover:scale-105 transition-all duration-300 flex items-center gap-2 mx-auto">
                    Find Stations
                    <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-indigo-950 to-purple-950 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                BoltRide
                <Zap className="w-6 h-6 text-indigo-400 animate-pulse" /
                BoltRide
                <svg className="w-6 h-6 animate-spin" style={{animationDuration: '2s'}} viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </h3>
              <p className="text-gray-400">
                Making urban transportation sustainable, accessible, and enjoyable for everyone.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/stations" className="text-gray-400 hover:text-indigo-400 transition-colors">Find Stations</Link></li>
                <li><Link to="/rides" className="text-gray-400 hover:text-purple-400 transition-colors">My Rides</Link></li>
                <li><Link to="/buy-passes" className="text-gray-400 hover:text-blue-400 transition-colors">Buy Passes</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Safety Guidelines</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700/50 mt-8 pt-8 text-center">
            <p className="text-gray-400 flex items-center justify-center gap-2">&copy; 2025 BoltRide. All rights reserved. Made with <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" /> for a sustainable future.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
