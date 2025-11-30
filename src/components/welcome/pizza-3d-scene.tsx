'use client';
import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, PresentationControls, Float, Environment, Html, useProgress } from '@react-three/drei';

function Loader() {
    const { progress } = useProgress();
    return <Html center><span style={{ color: 'white' }}>{progress.toFixed(0)}% loaded</span></Html>;
}

function Model(props: any) {
    const { scene } = useGLTF('/pizza-model.glb');
    return <primitive object={scene} {...props} />
}

export default function Pizza3DScene() {
    const [scale, setScale] = useState(3.0);

    useEffect(() => {
        const handleResize = () => {
            setScale(window.innerWidth < 768 ? 1.9 : 3.0);
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="w-full h-full" style={{ touchAction: 'none' }}>
            <Canvas dpr={[1, 2]} camera={{ fov: 45, position: [0, 0, 5] }} gl={{ alpha: true }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'transparent' }}>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                <Suspense fallback={<Loader />}>
                    <PresentationControls
                        speed={1.5}
                        zoom={1}
                        polar={[-Math.PI, Math.PI]}
                        azimuth={[-Math.PI, Math.PI]}
                    >
                        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                            <Model scale={scale} />
                        </Float>
                    </PresentationControls>
                    <Environment preset="city" />
                </Suspense>
            </Canvas>
        </div>
    );
}
