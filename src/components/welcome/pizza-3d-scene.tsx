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

interface Pizza3DSceneProps {
    scale?: number;
    fov?: number;
    rotationSpeed?: number;
}

export default function Pizza3DScene({
    scale: propScale,
    fov: propFov,
    rotationSpeed = 2.0
}: Pizza3DSceneProps) {
    const [defaultScale, setDefaultScale] = useState(3.0);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const mobile = width < 768;
            setIsMobile(mobile);
            setDefaultScale(mobile ? 3.2 : 3.0);
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const effectiveScale = propScale !== undefined ? propScale : defaultScale;
    const effectiveFov = propFov !== undefined ? propFov : (isMobile ? 42 : 45);

    return (
        <div className="w-full h-full flex items-center justify-center relative select-none" style={{ touchAction: 'none' }}>
            <Canvas
                key={`canvas-fov-${effectiveFov}`}
                dpr={[1, 2]}
                performance={{ min: 0.5 }}
                camera={{ fov: effectiveFov, position: [0, 0.6, 4.3] }}
                gl={{ 
                    alpha: true, 
                    antialias: true, 
                    powerPreference: "high-performance",
                    precision: "highp"
                }}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'transparent' }}
            >
                {/* Premium Studio Lighting */}
                <ambientLight intensity={0.75} />
                <directionalLight position={[5, 8, 5]} intensity={1.8} />
                <directionalLight position={[-5, 5, -5]} intensity={0.7} />
                <pointLight position={[0, -4, 3]} intensity={0.8} />
                <spotLight position={[0, 10, 0]} intensity={1.5} angle={0.6} penumbra={0.8} />

                <Suspense fallback={null}>
                    <Environment preset="city" />
                </Suspense>
                
                <Suspense fallback={<Loader />}>
                    <Model
                        scale={effectiveScale}
                        position={[0, 0, 0]}
                    />
                    <OrbitControls
                        target={[0, 0, 0]}
                        enableZoom={false}
                        enablePan={false}
                        enableDamping={true}
                        dampingFactor={0.05}
                        autoRotate={rotationSpeed > 0}
                        autoRotateSpeed={rotationSpeed}
                        minPolarAngle={0}
                        maxPolarAngle={Math.PI}
                        makeDefault
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}

useGLTF.preload('/pizza-model.glb');


