import { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment } from '@react-three/drei';
import * as THREE from 'three';

export type RobotMode = 'idle' | 'thinking' | 'talking' | 'smiling';

// ─── 主角色 ───────────────────────────────────────────────────────────
function XiaoDCharacter({ mode }: { mode: RobotMode }) {
  const headRef = useRef<THREE.Group>(null!);
  const armL    = useRef<THREE.Mesh>(null!);
  const armR    = useRef<THREE.Mesh>(null!);
  const legL    = useRef<THREE.Mesh>(null!);
  const legR    = useRef<THREE.Mesh>(null!);
  // 豆豆眼
  const eyeL    = useRef<THREE.Mesh>(null!);
  const eyeR    = useRef<THREE.Mesh>(null!);

  const [blink, setBlink] = useState(false);
  useEffect(() => {
    const id = setInterval(
      () => { setBlink(true); setTimeout(() => setBlink(false), 110); },
      4000 + Math.random() * 2500,
    );
    return () => clearInterval(id);
  }, []);

  useFrame(({ clock }, delta) => {
    const t  = clock.getElapsedTime();
    const dt = Math.min(delta, 0.1);
    const lp = 5 * dt;
    if (!headRef.current) return;

    // 头部动画
    let ry = Math.sin(t / 2.5) * 0.12;
    let rz = 0;
    let py = Math.sin(t * 1.5) * 0.04;
    if (mode === 'thinking')     { rz = 0.28; py = 0.015; ry = 0; }
    else if (mode === 'talking') { py = Math.sin(t * 11) * 0.05; ry = Math.sin(t*5)*0.07; }
    else if (mode === 'smiling') { py = Math.sin(t * 4) * 0.03; }
    headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, ry, lp);
    headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, rz, lp);
    headRef.current.position.y = THREE.MathUtils.lerp(headRef.current.position.y, py, lp);

    // 豆豆眼动画
    const led = mode==='thinking' ? '#ffcc00' : mode==='smiling' ? '#80ffcc' : '#38beff';
    [eyeL.current, eyeR.current].forEach((eye, i) => {
      if (!eye) return;
      const side = i === 0 ? -1 : 1;
      let tx = side * 0.142;
      let ty = 0.09;
      let sx = 1, sy = 1;

      // idle: 不眨眼，保持圆润豆豆眼
      if (blink && mode !== 'idle') {
        sy = 0.07;                                   // 眨眼 = 压扁
      } else if (mode === 'thinking') {
        tx = side * 0.08;                            // 聚拢向中间，若有所思
      } else if (mode === 'smiling') {
        sx = 1.1; sy = 0.7; ty = 0.08;              // 横向拉宽+压扁 = 弯眼
      } else if (mode === 'talking') {
        sy = 0.82 + Math.abs(Math.sin(t * 11)) * 0.22; // 上下小幅变化
      }

      eye.position.x = THREE.MathUtils.lerp(eye.position.x, tx, lp);
      eye.position.y = THREE.MathUtils.lerp(eye.position.y, ty, lp);
      eye.scale.x    = THREE.MathUtils.lerp(eye.scale.x,    sx, lp);
      eye.scale.y    = THREE.MathUtils.lerp(eye.scale.y,    sy, lp);
      const mat = eye.material as THREE.MeshStandardMaterial;
      mat.color.set(led);
      mat.emissive.set(led);
    });

    // 四肢
    const lm = (m: THREE.Mesh|null, px:number,py_:number,pz:number,rz_:number) => {
      if (!m) return;
      m.position.x = THREE.MathUtils.lerp(m.position.x, px, lp);
      m.position.y = THREE.MathUtils.lerp(m.position.y, py_, lp);
      m.position.z = THREE.MathUtils.lerp(m.position.z, pz, lp);
      m.rotation.z = THREE.MathUtils.lerp(m.rotation.z, rz_, lp);
    };
    const sw = Math.sin(t * 1.8);
    if (mode === 'idle') {
      lm(armL.current,-0.58,-0.22,0.08, sw*0.18-0.3);
      lm(armR.current, 0.58,-0.22,0.08,-sw*0.18+0.3);
      lm(legL.current,-0.28,-0.62,0, sw*0.08);
      lm(legR.current, 0.28,-0.62,0,-sw*0.08);
    } else if (mode === 'thinking') {
      lm(armL.current,-0.42,-0.05,0.3, 0.65);
      lm(armR.current, 0.55,-0.25,0.08, 0.2);
      lm(legL.current,-0.28,-0.62,0, 0.1);
      lm(legR.current, 0.28,-0.62,0,-0.1);
    } else if (mode === 'talking') {
      lm(armL.current,-0.60,-0.15,0.2, Math.sin(t*11)*0.35-0.25);
      lm(armR.current, 0.60,-0.15,0.2,-Math.sin(t*11)*0.35+0.25);
      lm(legL.current,-0.28,-0.6, Math.sin(t*11)*0.06, 0);
      lm(legR.current, 0.28,-0.6,-Math.sin(t*11)*0.06, 0);
    } else if (mode === 'smiling') {
      lm(armL.current,-0.65,-0.08,0.22, 0.62);
      lm(armR.current, 0.65,-0.08,0.22,-0.62);
      lm(legL.current,-0.30,-0.68,0,-0.07);
      lm(legR.current, 0.30,-0.68,0, 0.07);
    }
  });

  const led = mode==='thinking' ? '#ffcc00' : mode==='smiling' ? '#80ffcc' : '#38beff';
  const R = 0.62;

  return (
    <group>
      <Float speed={1.5} rotationIntensity={0.06} floatIntensity={0.55}>
        <group ref={headRef}>

          {/* ── 白色科技头球 ── */}
          <mesh>
            <sphereGeometry args={[R, 56, 56]} />
            <meshStandardMaterial color="#edf5ff" roughness={0.18} metalness={0.1} />
          </mesh>
          {/* 侧面淡蓝渐变膜 */}
          <mesh>
            <sphereGeometry args={[R*1.003, 40, 40]} />
            <meshStandardMaterial color="#88c4f0" roughness={0.3} metalness={0.05} transparent opacity={0.13} />
          </mesh>

          {/* ── 屏幕（比球面稍外）── */}
          <mesh position={[0, 0.03, R*1.03]}>
            <circleGeometry args={[0.38, 56]} />
            <meshStandardMaterial color="#050d1a" roughness={0.95} metalness={0} envMapIntensity={0} />
          </mesh>
          {/* 屏幕边框 */}
          <mesh position={[0, 0.03, R*1.025]}>
            <ringGeometry args={[0.38, 0.41, 56]} />
            <meshStandardMaterial color="#2a7ab8" emissive="#1a5088" emissiveIntensity={0.7}
              roughness={0.15} metalness={0.4} envMapIntensity={0} />
          </mesh>

          {/* ── 豆豆眼 ── */}
          {/* 左眼外圈（深色轮廓）*/}
          <mesh position={[-0.142, 0.09, R*1.06]}>
            <circleGeometry args={[0.098, 28]} />
            <meshStandardMaterial color="#060f1e" roughness={0.9} metalness={0} envMapIntensity={0} />
          </mesh>
          {/* 左眼发光豆豆 */}
          <mesh ref={eyeL} position={[-0.142, 0.09, R*1.068]}>
            <sphereGeometry args={[0.082, 22, 22]} />
            <meshStandardMaterial color={led} emissive={led} emissiveIntensity={2.5} roughness={0.1} metalness={0} />
          </mesh>
          {/* 左眼高光点 */}
          <mesh position={[-0.118, 0.112, R*1.082]}>
            <sphereGeometry args={[0.022, 10, 10]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} roughness={0.1} metalness={0} />
          </mesh>

          {/* 右眼外圈 */}
          <mesh position={[0.142, 0.09, R*1.06]}>
            <circleGeometry args={[0.098, 28]} />
            <meshStandardMaterial color="#060f1e" roughness={0.9} metalness={0} envMapIntensity={0} />
          </mesh>
          {/* 右眼发光豆豆 */}
          <mesh ref={eyeR} position={[0.142, 0.09, R*1.068]}>
            <sphereGeometry args={[0.082, 22, 22]} />
            <meshStandardMaterial color={led} emissive={led} emissiveIntensity={2.5} roughness={0.1} metalness={0} />
          </mesh>
          {/* 右眼高光点 */}
          <mesh position={[0.166, 0.112, R*1.082]}>
            <sphereGeometry args={[0.022, 10, 10]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} roughness={0.1} metalness={0} />
          </mesh>

          {/* ── 天线：从耳侧竖直朝上 ────────────────────────────────
              头球 R=0.62, 耳朵位置约 x=±0.58, y=0.18 处
              天线从球面贴出，向正上方延伸                         */}

          {/* 左天线 */}
          <group position={[-0.58, 0.18, 0]} rotation={[-0.26, 0, 0]}>
            {/* 底部小底座（贴合球面）*/}
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.038, 0.045, 0.08, 10]} />
              <meshStandardMaterial color="#7ab8e0" roughness={0.15} metalness={0.85} />
            </mesh>
            {/* 细杆（向上）*/}
            <mesh position={[0, 0.32, 0]}>
              <cylinderGeometry args={[0.022, 0.028, 0.50, 10]} />
              <meshStandardMaterial color="#c0dff8" roughness={0.1} metalness={0.9} />
            </mesh>
            {/* 中段节点 */}
            <mesh position={[0, 0.22, 0]}>
              <cylinderGeometry args={[0.032, 0.032, 0.06, 10]} />
              <meshStandardMaterial color="#4a9fd0" roughness={0.1} metalness={0.9} />
            </mesh>
            {/* 顶端发光球 */}
            <mesh position={[0, 0.60, 0]}>
              <sphereGeometry args={[0.048, 16, 16]} />
              <meshStandardMaterial color={led} emissive={led} emissiveIntensity={3.5} roughness={0.1} metalness={0} />
            </mesh>
          </group>

          {/* 右天线（镜像）*/}
          <group position={[0.58, 0.18, 0]} rotation={[-0.26, 0, 0]}>
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.038, 0.045, 0.08, 10]} />
              <meshStandardMaterial color="#7ab8e0" roughness={0.15} metalness={0.85} />
            </mesh>
            <mesh position={[0, 0.32, 0]}>
              <cylinderGeometry args={[0.022, 0.028, 0.50, 10]} />
              <meshStandardMaterial color="#c0dff8" roughness={0.1} metalness={0.9} />
            </mesh>
            <mesh position={[0, 0.22, 0]}>
              <cylinderGeometry args={[0.032, 0.032, 0.06, 10]} />
              <meshStandardMaterial color="#4a9fd0" roughness={0.1} metalness={0.9} />
            </mesh>
            <mesh position={[0, 0.60, 0]}>
              <sphereGeometry args={[0.048, 16, 16]} />
              <meshStandardMaterial color={led} emissive={led} emissiveIntensity={3.5} roughness={0.1} metalness={0} />
            </mesh>
          </group>

          {/* ── 四肢 ── */}
          <mesh ref={armL} position={[-0.58, -0.22, 0.08]}>
            <capsuleGeometry args={[0.11, 0.22, 6, 14]} />
            <meshStandardMaterial color="#c5e2f5" roughness={0.2} metalness={0.1} />
          </mesh>
          <mesh ref={armR} position={[0.58, -0.22, 0.08]}>
            <capsuleGeometry args={[0.11, 0.22, 6, 14]} />
            <meshStandardMaterial color="#c5e2f5" roughness={0.2} metalness={0.1} />
          </mesh>
          <mesh ref={legL} position={[-0.28, -0.62, 0]}>
            <capsuleGeometry args={[0.10, 0.18, 6, 14]} />
            <meshStandardMaterial color="#c5e2f5" roughness={0.2} metalness={0.1} />
          </mesh>
          <mesh ref={legR} position={[0.28, -0.62, 0]}>
            <capsuleGeometry args={[0.10, 0.18, 6, 14]} />
            <meshStandardMaterial color="#c5e2f5" roughness={0.2} metalness={0.1} />
          </mesh>
          {([-0.58, 0.58] as const).map(x => (
            <mesh key={x} position={[x, -0.2, 0.1]}>
              <cylinderGeometry args={[0.033, 0.033, 0.04, 8]} />
              <meshStandardMaterial color="#3a78b0" roughness={0.1} metalness={0.9} />
            </mesh>
          ))}

        </group>
      </Float>
    </group>
  );
}

interface XiaoDProps {
  mode?: RobotMode;
  className?: string;
}

const XiaoD = ({ mode = 'idle', className = '' }: XiaoDProps) => (
  <div className={`relative w-full h-full ${className}`}>
    <div className="absolute inset-0 w-full h-full">
      <Canvas camera={{ position: [0, 0, 2.8], fov: 52 }} dpr={[1, 2]} style={{ width: '100%', height: '100%' }}>
        <Suspense fallback={null}>
          <ambientLight intensity={1.3} color="#f0f8ff" />
          <directionalLight position={[2, 4, 5]} intensity={1.8} color="#ffffff" />
          <directionalLight position={[-3, 1, 3]} intensity={0.6} color="#c0e0ff" />
          <pointLight position={[0, 0, 4]} intensity={0.5} color="#6fc8ff" />
          <Environment preset="city" />
          <XiaoDCharacter mode={mode} />
        </Suspense>
      </Canvas>
    </div>
  </div>
);

export default XiaoD;
