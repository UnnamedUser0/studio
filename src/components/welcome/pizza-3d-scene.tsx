'use client';
import { Suspense } from 'react';
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
    return (
        <div className="w-full h-full">
            <Canvas dpr={[1, 2]} camera={{ fov: 45, position: [0, 0, 5] }} gl={{ alpha: true }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'transparent' }}>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                <Suspense fallback={<Loader />}>
                    <PresentationControls
                        speed={1.5}
                        global
                        zoom={1}
                        polar={[-Math.PI, Math.PI]}
                        azimuth={[-Math.PI, Math.PI]}
                    >
                        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                            <Model scale={4.0} />
                        </Float>
                    </PresentationControls>
                    <Environment preset="city" />
                </Suspense>
            </Canvas>
        </div>
    );
}
