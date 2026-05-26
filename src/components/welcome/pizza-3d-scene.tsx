'use client';
import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Html, useProgress } from '@react-three/drei';

function Loader() {
    const { progress } = useProgress();
    return <Html center><span style={{ color: 'white', fontFamily: 'sans-serif', fontWeight: 'bold' }}>{progress.toFixed(0)}% loaded</span></Html>;
}

function Model(props: any) {
    const { scene } = useGLTF('/pizza-model.glb');
    return <primitive object={scene} {...props} />
}

export default function Pizza3DScene() {
    const [scale, setScale] = useState(3.0);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setIsMobile(width < 768);
            setScale(width < 768 ? 1.9 : 3.0);
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="w-full h-full" style={{ touchAction: 'none' }}>
            <Canvas
                dpr={isMobile ? 1 : [1, 1.5]}
                performance={{ min: 0.5 }}
                camera={{ fov: 45, position: [0, 1, 5] }}
                gl={{ 
                    alpha: true, 
                    antialias: !isMobile, 
                    powerPreference: "high-performance",
                    precision: isMobile ? "mediump" : "highp"
                }}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'transparent' }}
            >
                {/* Dynamic Lighting: Reduced shader overhead on Mobile */}
                {isMobile ? (
                    <>
                        <ambientLight intensity={0.9} />
                        <directionalLight position={[2, 5, 2]} intensity={1.5} />
                    </>
                ) : (
                    <>
                        {/* Premium Studio Lighting for Desktop */}
                        <ambientLight intensity={0.7} />
                        <directionalLight position={[5, 8, 5]} intensity={1.8} />
                        <directionalLight position={[-5, 5, -5]} intensity={0.6} />
                        <pointLight position={[0, -4, 3]} intensity={0.8} />
                        <spotLight position={[0, 10, 0]} intensity={1.5} angle={0.6} penumbra={0.8} />
                    </>
                )}

                <Suspense fallback={null}>
                    <Environment preset="city" />
                </Suspense>
                
                <Suspense fallback={<Loader />}>
                    <Model scale={scale} position={[0, -0.2, 0]} />
                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        enableDamping={true}
                        dampingFactor={0.08}
                        autoRotate={true}
                        autoRotateSpeed={2.5}
                        makeDefault
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}

useGLTF.preload('/pizza-model.glb');


