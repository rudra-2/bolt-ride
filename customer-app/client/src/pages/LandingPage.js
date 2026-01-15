import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations, Float, Sparkles, Trail, Ring, Sphere } from "@react-three/drei";
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

function BikeModel({ scrollProgress }) {
  const { scene, animations } = useGLTF("/models/carbon_frame_bike.glb");
  const { actions, mixer } = useAnimations(animations, scene);
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
      mixer.setTime(scrollProgress * duration);
    }

    // Enhanced floating motion with unique effects
    if (bikeRef.current) {
      const time = state.clock.getElapsedTime();

      // Gentle floating rotation (no scroll-based rotation)
      bikeRef.current.rotation.y = Math.sin(time * 0.3) * 0.15;
      bikeRef.current.rotation.x = Math.sin(time * 0.5) * 0.05;
      bikeRef.current.rotation.z = Math.cos(time * 0.4) * 0.03;

      // Dynamic floating with gentle movement
      bikeRef.current.position.y = -1.2 + Math.sin(time * 0.8) * 0.2;
      bikeRef.current.position.x = Math.sin(time * 0.6) * 0.1;
      bikeRef.current.position.z = Math.cos(time * 0.4) * 0.1;

      // Scale based on scroll progress - bike gets slightly larger as you scroll
      const baseScale = 2.5;
      const scrollScale = scrollProgress * 0.3;
      const pulseScale = Math.sin(time * 2) * 0.05;
      const scale = baseScale + scrollScale + pulseScale;
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
  const [scrollProgress, setScrollProgress] = useState(0);
  const [animationComplete, setAnimationComplete] = useState(false);
  const heroRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const accumulatedScroll = useRef(0);
  const targetProgress = useRef(0);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    setIsDark(savedTheme === "dark");
  }, []);

  // Smooth animation loop using requestAnimationFrame
  useEffect(() => {
    const animate = () => {
      // Lerp (linear interpolation) for smooth transition
      const currentProgress = scrollProgress;
      const target = targetProgress.current;
      const diff = target - currentProgress;
      
      if (Math.abs(diff) > 0.001) {
        // Slightly faster in middle section
        const smoothFactor = (currentProgress >= 0.3 && currentProgress <= 0.7) ? 0.14 : 0.12;
        const newProgress = currentProgress + diff * smoothFactor;
        setScrollProgress(newProgress);
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scrollProgress]);

  // Scroll hijacking for bike animation - page only scrolls after animation completes
  useEffect(() => {
    const scrollThreshold = 1500; // Increased - more scroll needed for smoother animation
    
    const handleWheel = (e) => {
      // If animation is not complete, hijack scroll
      if (!animationComplete && heroRef.current) {
        const heroRect = heroRef.current.getBoundingClientRect();
        
        // Only hijack if we're in the hero section
        if (heroRect.top >= -10) {
          e.preventDefault();
          
          // Accumulate scroll delta with dampening for smoother feel
          const dampening = 0.5; // Reduce scroll sensitivity
          accumulatedScroll.current += e.deltaY * dampening;
          accumulatedScroll.current = Math.max(0, Math.min(scrollThreshold, accumulatedScroll.current));
          
          // Set target progress (actual progress will lerp to this)
          targetProgress.current = accumulatedScroll.current / scrollThreshold;
          
          // When animation completes, allow normal scrolling
          if (targetProgress.current >= 0.98) {
            targetProgress.current = 1;
            setAnimationComplete(true);
          }
        }
      }
      
      // If scrolling back up and we're at the top, reset
      if (animationComplete && window.scrollY <= 0 && e.deltaY < 0) {
        setAnimationComplete(false);
        accumulatedScroll.current = scrollThreshold;
        targetProgress.current = 1;
      }
    };

    // Handle scroll for when user scrolls back up
    const handleScroll = () => {
      // If user scrolled back up past hero, reset animation
      if (heroRef.current) {
        const heroRect = heroRef.current.getBoundingClientRect();
        if (heroRect.top > 50 && accumulatedScroll.current > 0) {
          accumulatedScroll.current = Math.max(0, accumulatedScroll.current - 30);
          targetProgress.current = accumulatedScroll.current / 1500;
          if (accumulatedScroll.current <= 0) {
            setAnimationComplete(false);
          }
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [animationComplete]);

  return (
    <div ref={scrollContainerRef} className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <Navbar />

      {/* Hero Section */}
      <div ref={heroRef} className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-evgreen/10 dark:from-gray-900 dark:via-gray-800 dark:to-evgreen/20 relative overflow-hidden transition-colors duration-500">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-evgreen/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-evgreen/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-evgreen/25 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-green-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
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
                <span className="text-evgreen bg-gradient-to-r from-evgreen to-green-400 bg-clip-text text-transparent animate-pulse inline-flex items-center gap-2" style={{ animationDelay: '0.8s' }}>
                  Future <Zap className="w-10 h-10 text-evgreen animate-pulse" />
                </span>
              </h1>

              <div className="relative">
                <h2 className="text-2xl lg:text-3xl font-light text-gray-600 dark:text-gray-400 animate-pulse transition-colors duration-500" style={{ animationDelay: '1s' }}>
                  Eco-friendly bike sharing made simple
                </h2>
                <div className="absolute -bottom-2 left-0 lg:left-0 w-32 h-1 bg-gradient-to-r from-evgreen to-green-400 rounded-full animate-pulse" style={{ animationDelay: '1.2s' }}></div>
              </div>
            </div>

            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed animate-pulse transition-colors duration-500" style={{ animationDelay: '1.4s' }}>
              Experience the future of urban mobility with our
              <span className="text-evgreen font-semibold"> eco-friendly</span> bike-sharing service.
              <span className="text-evgreen font-semibold"> Sustainable</span>,
              <span className="text-evgreen font-semibold"> convenient</span>, and
              <span className="text-evgreen font-semibold"> affordable</span> transportation.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup" className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-evgreen to-green-400 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <button className="relative px-8 py-4 bg-evgreen text-white font-bold rounded-xl hover:bg-green-500 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-evgreen/25 hover:shadow-2xl flex items-center gap-2">
                  Start Your Journey
                  <Zap className="w-5 h-5" />
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>

              <Link to="/login" className="group">
                <button className="px-8 py-4 border-2 border-evgreen text-evgreen font-bold rounded-xl hover:bg-evgreen hover:text-white transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-evgreen/25 hover:shadow-2xl backdrop-blur-sm flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center group cursor-pointer transform hover:scale-110 transition-all duration-300">
                <div className="text-3xl font-black text-evgreen group-hover:animate-bounce">50+</div>
                <div className="text-sm text-gray-500 font-medium">Stations</div>
              </div>
              <div className="text-center group cursor-pointer transform hover:scale-110 transition-all duration-300">
                <div className="text-3xl font-black text-evgreen group-hover:animate-bounce">1000+</div>
                <div className="text-sm text-gray-500 font-medium">Rides</div>
              </div>
              <div className="text-center group cursor-pointer transform hover:scale-110 transition-all duration-300">
                <div className="text-3xl font-black text-evgreen group-hover:animate-bounce">24/7</div>
                <div className="text-sm text-gray-500 font-medium">Available</div>
              </div>
            </div>
          </div>

          {/* Right Content - 3D Bike */}
          <div className="flex-1 w-full h-[600px] relative">
            <div className="absolute inset-0 bg-gradient-to-br from-evgreen/5 to-green-400/5 rounded-3xl backdrop-blur-sm border border-evgreen/10 shadow-2xl"></div>
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
              <BikeModel scrollProgress={scrollProgress} />
            </Canvas>

            {/* Floating UI Elements */}
            <div className="absolute bottom-4 left-4 bg-evgreen text-white px-4 py-2 rounded-full animate-pulse shadow-lg">
              <span className="text-sm font-medium flex items-center gap-1"><Zap className="w-4 h-4" /> 100% Electric</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-b from-white to-gray-50 py-20 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-64 h-64 bg-evgreen rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 left-20 w-80 h-80 bg-green-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-5xl font-black text-center text-gray-800 mb-4">
            Why Choose
            <span className="text-evgreen ml-3">BoltRide?</span>
          </h2>
          <div className="text-center mb-16">
            <div className="w-24 h-1 bg-gradient-to-r from-evgreen to-green-400 rounded-full mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of riders who have already made the switch to sustainable transportation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl text-center hover:bg-white hover:shadow-2xl hover:shadow-evgreen/10 transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
              <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-evgreen/10 group-hover:scale-110 transition-transform duration-300 group-hover:animate-bounce"><Leaf className="w-10 h-10 text-evgreen" /></div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-evgreen transition-colors">Eco-Friendly</h3>
              <p className="text-gray-600 leading-relaxed">
                Zero emissions, zero guilt. Join us in making cities greener, one ride at a time.
                Reduce your carbon footprint while exploring the city.
              </p>
              <div className="mt-6 inline-flex items-center text-evgreen font-semibold group-hover:translate-x-2 transition-transform gap-1">
                Learn More <ChevronRight className="w-5 h-5" />
              </div>
            </div>

            <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl text-center hover:bg-white hover:shadow-2xl hover:shadow-evgreen/10 transition-all duration-500 transform hover:-translate-y-2 border border-gray-100" style={{ animationDelay: '0.2s' }}>
              <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-evgreen/10 group-hover:scale-110 transition-transform duration-300 group-hover:animate-bounce"><Wallet className="w-10 h-10 text-evgreen" /></div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-evgreen transition-colors">Digital Wallet</h3>
              <p className="text-gray-600 leading-relaxed">
                Quick and secure digital payments. Top up your wallet and ride worry-free.
                No cash needed, just seamless transactions.
              </p>
              <div className="mt-6 inline-flex items-center text-evgreen font-semibold group-hover:translate-x-2 transition-transform gap-1">
                Get Started <ChevronRight className="w-5 h-5" />
              </div>
            </div>

            <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl text-center hover:bg-white hover:shadow-2xl hover:shadow-evgreen/10 transition-all duration-500 transform hover:-translate-y-2 border border-gray-100" style={{ animationDelay: '0.4s' }}>
              <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-evgreen/10 group-hover:scale-110 transition-transform duration-300 group-hover:animate-bounce"><MapPin className="w-10 h-10 text-evgreen" /></div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-evgreen transition-colors">Smart Stations</h3>
              <p className="text-gray-600 leading-relaxed">
                Multiple stations across the city with real-time availability tracking.
                Find the nearest station with GPS-enabled smart locating.
              </p>
              <div className="mt-6 inline-flex items-center text-evgreen font-semibold group-hover:translate-x-2 transition-transform gap-1">
                Find Stations <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="mt-20 text-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="group cursor-pointer">
                <div className="text-4xl font-black text-evgreen mb-2 group-hover:scale-110 transition-transform">99%</div>
                <div className="text-gray-600 font-medium">Uptime</div>
              </div>
              <div className="group cursor-pointer">
                <div className="text-4xl font-black text-evgreen mb-2 group-hover:scale-110 transition-transform">5★</div>
                <div className="text-gray-600 font-medium">Rating</div>
              </div>
              <div className="group cursor-pointer">
                <div className="text-4xl font-black text-evgreen mb-2 group-hover:scale-110 transition-transform">50K+</div>
                <div className="text-gray-600 font-medium">Happy Users</div>
              </div>
              <div className="group cursor-pointer">
                <div className="text-4xl font-black text-evgreen mb-2 group-hover:scale-110 transition-transform">100K+</div>
                <div className="text-gray-600 font-medium">Rides Completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-20 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-96 h-96 bg-evgreen rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-green-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-gray-800 mb-4">
              How It
              <span className="text-evgreen ml-3">Works</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-evgreen to-green-400 rounded-full mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes and join the green revolution
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center group relative">
              {/* Step connector */}
              <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-evgreen/50 to-transparent z-0"></div>

              <div className="relative z-10 bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:shadow-evgreen/10 transform hover:-translate-y-2 transition-all duration-500 border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-evgreen to-green-400 rounded-full flex items-center justify-center text-white font-black text-xl mx-auto mb-6 group-hover:scale-110 transition-transform">1</div>
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-xl bg-evgreen/10 group-hover:animate-bounce"><Smartphone className="w-8 h-8 text-evgreen" /></div>
                <h3 className="text-xl font-bold mb-4 text-gray-800 group-hover:text-evgreen transition-colors">Download & Sign Up</h3>
                <p className="text-gray-600 leading-relaxed">Create your account in minutes with just your email and get verified instantly</p>
                <div className="mt-4 inline-flex items-center text-evgreen font-semibold text-sm group-hover:translate-x-1 transition-transform gap-1">
                  Quick Setup <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="text-center group relative">
              <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-evgreen/50 to-transparent z-0"></div>

              <div className="relative z-10 bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:shadow-evgreen/10 transform hover:-translate-y-2 transition-all duration-500 border border-gray-100" style={{ animationDelay: '0.2s' }}>
                <div className="w-16 h-16 bg-gradient-to-br from-evgreen to-green-400 rounded-full flex items-center justify-center text-white font-black text-xl mx-auto mb-6 group-hover:scale-110 transition-transform">2</div>
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-xl bg-evgreen/10 group-hover:animate-bounce"><Map className="w-8 h-8 text-evgreen" /></div>
                <h3 className="text-xl font-bold mb-4 text-gray-800 group-hover:text-evgreen transition-colors">Find a Station</h3>
                <p className="text-gray-600 leading-relaxed">Locate the nearest station with available bikes using our GPS-enabled map</p>
                <div className="mt-4 inline-flex items-center text-evgreen font-semibold text-sm group-hover:translate-x-1 transition-transform gap-1">
                  View Map <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="text-center group relative">
              <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-evgreen/50 to-transparent z-0"></div>

              <div className="relative z-10 bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:shadow-evgreen/10 transform hover:-translate-y-2 transition-all duration-500 border border-gray-100" style={{ animationDelay: '0.4s' }}>
                <div className="w-16 h-16 bg-gradient-to-br from-evgreen to-green-400 rounded-full flex items-center justify-center text-white font-black text-xl mx-auto mb-6 group-hover:scale-110 transition-transform">3</div>
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-xl bg-evgreen/10 group-hover:animate-bounce"><QrCode className="w-8 h-8 text-evgreen" /></div>
                <h3 className="text-xl font-bold mb-4 text-gray-800 group-hover:text-evgreen transition-colors">Scan QR Code</h3>
                <p className="text-gray-600 leading-relaxed">Unlock your bike instantly by scanning the QR code on the bike</p>
                <div className="mt-4 inline-flex items-center text-evgreen font-semibold text-sm group-hover:translate-x-1 transition-transform gap-1">
                  Instant Access <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="text-center group">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:shadow-evgreen/10 transform hover:-translate-y-2 transition-all duration-500 border border-gray-100" style={{ animationDelay: '0.6s' }}>
                <div className="w-16 h-16 bg-gradient-to-br from-evgreen to-green-400 rounded-full flex items-center justify-center text-white font-black text-xl mx-auto mb-6 group-hover:scale-110 transition-transform">4</div>
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-xl bg-evgreen/10 group-hover:animate-bounce"><Bike className="w-8 h-8 text-evgreen" /></div>
                <h3 className="text-xl font-bold mb-4 text-gray-800 group-hover:text-evgreen transition-colors">Ride & Enjoy</h3>
                <p className="text-gray-600 leading-relaxed">Hit the road and enjoy your eco-friendly ride through the city</p>
                <div className="mt-4 inline-flex items-center text-evgreen font-semibold text-sm group-hover:translate-x-1 transition-transform gap-1">
                  Start Riding <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-evgreen to-green-400 rounded-3xl p-8 text-white shadow-2xl">
              <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
              <p className="text-xl mb-8 opacity-90">Join thousands of riders making cities cleaner, one ride at a time</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup" className="group">
                  <button className="bg-white text-evgreen px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-lg flex items-center gap-2">
                    Sign Up Free
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <Link to="/stations" className="group">
                  <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white hover:text-evgreen transform hover:scale-105 transition-all duration-300 flex items-center gap-2">
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
      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-evgreen mb-4 flex items-center gap-2">BoltRide <Zap className="w-6 h-6 text-evgreen animate-pulse" /></h3>
              <p className="text-gray-400">
                Making urban transportation sustainable, accessible, and enjoyable for everyone.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/stations" className="text-gray-400 hover:text-evgreen transition-colors">Find Stations</Link></li>
                <li><Link to="/rides" className="text-gray-400 hover:text-evgreen transition-colors">My Rides</Link></li>
                <li><Link to="/buy-passes" className="text-gray-400 hover:text-evgreen transition-colors">Buy Passes</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-evgreen transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-evgreen transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-evgreen transition-colors">Safety Guidelines</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-evgreen transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-evgreen transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-evgreen transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400 flex items-center justify-center gap-1">&copy; 2025-26 BoltRide. All rights reserved. Made with <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" /> for a sustainable future.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
