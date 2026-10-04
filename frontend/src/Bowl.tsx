import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
function Food() {
  const group = useRef<THREE.Group>(null);
  const steam = useRef<THREE.Points>(null);
  const grains = useMemo(
    () =>
      Array.from({ length: 180 }, (_, i) => {
        const angle = i * 2.39996;
        const r = Math.sqrt(i / 180) * 1.57;
        return {
          x: Math.cos(angle) * r,
          z: Math.sin(angle) * r,
          y: 0.3 + Math.sqrt(Math.max(0, 1 - (r * r) / 3)) * 0.25,
          rotation: angle,
          color: ["#efc561", "#fbdf93", "#f1ece0", "#d69731"][i % 4],
        };
      }),
    [],
  );
  const particles = useMemo(
    () =>
      new Float32Array(
        Array.from({ length: 90 }, (_, i) =>
          i % 3 === 1 ? 1 + (i % 9) * 0.12 : Math.sin(i * 4.7) * 0.65,
        ),
      ),
    [],
  );
  useFrame(({ clock, pointer }) => {
    if (group.current) {
      group.current.rotation.y = clock.elapsedTime * 0.07 + pointer.x * 0.12;
      group.current.rotation.z = pointer.y * 0.025;
    }
    if (steam.current) {
      steam.current.position.y = (clock.elapsedTime * 0.08) % 0.4;
      steam.current.rotation.y = clock.elapsedTime * 0.04;
    }
  });
  const shape = useMemo(
    () => [
      new THREE.Vector2(0, -0.8),
      new THREE.Vector2(0.65, -0.8),
      new THREE.Vector2(1.3, -0.45),
      new THREE.Vector2(1.7, 0.22),
      new THREE.Vector2(1.72, 0.32),
      new THREE.Vector2(1.62, 0.34),
      new THREE.Vector2(1.4, -0.25),
      new THREE.Vector2(0.7, -0.65),
      new THREE.Vector2(0, -0.65),
    ],
    [],
  );
  return (
    <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.4}>
      <group ref={group} rotation={[0.25, 0, 0]}>
        <mesh castShadow>
          <latheGeometry args={[shape, 64]} />
          <meshStandardMaterial
            color="#325247"
            roughness={0.5}
            metalness={0.15}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.28, 0]}>
          <circleGeometry args={[1.6, 48]} />
          <meshStandardMaterial color="#cb9342" />
        </mesh>
        {grains.map((g, i) => (
          <mesh
            key={i}
            position={[g.x, g.y, g.z]}
            rotation={[0, g.rotation, 0.25]}
            scale={[0.07, 0.035, 0.17]}
          >
            <sphereGeometry args={[1, 5, 4]} />
            <meshStandardMaterial color={g.color} roughness={0.85} />
          </mesh>
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <group
            key={i}
            position={[Math.sin(i * 2) * 1, 0.55, Math.cos(i * 2) * 1]}
            rotation={[0, i, 0]}
          >
            <mesh scale={[0.29, 0.17, 0.24]}>
              <icosahedronGeometry args={[1, 1]} />
              <meshStandardMaterial color="#a74f21" roughness={0.9} />
            </mesh>
            <mesh
              position={[0.1, 0.19, 0]}
              rotation={[0, 0, 0.5]}
              scale={[0.19, 0.02, 0.09]}
            >
              <sphereGeometry args={[1, 8, 4]} />
              <meshStandardMaterial color="#51712d" />
            </mesh>
          </group>
        ))}
        <points ref={steam}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[particles, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            color="#fff7e5"
            size={0.075}
            transparent
            opacity={0.35}
            depthWrite={false}
          />
        </points>
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            position={[
              Math.sin(i * 2 + 1) * 2.1,
              0.8 + i * 0.3,
              Math.cos(i * 3) * 1.2,
            ]}
            rotation={[i, i, 0.7]}
            scale={[0.08, 0.28, 0.08]}
          >
            <capsuleGeometry args={[1, 1, 4, 8]} />
            <meshStandardMaterial color={i === 1 ? "#7f3021" : "#567241"} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}
export default function Bowl({ onFailure }: { onFailure: () => void }) {
  return (
    <Canvas
      aria-label="Gently floating 3D bowl of biryani"
      role="img"
      dpr={[1, 1.5]}
      camera={{ position: [0, 3.4, 6.5], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", () => {
          onFailure();
        });
      }}
    >
      <ambientLight intensity={1.8} />
      <directionalLight position={[3, 6, 4]} intensity={3} />
      <directionalLight position={[-3, 2, 0]} intensity={1} color="#ffe4b2" />
      <Food />
      <ContactShadows
        position={[0, -1.35, 0]}
        opacity={0.3}
        scale={10}
        blur={2.8}
        far={4}
        resolution={128}
        frames={1}
      />
    </Canvas>
  );
}
