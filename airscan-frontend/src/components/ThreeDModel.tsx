'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ANTHROPOMETRIC_LANDMARKS, MEASURE_DEFINITIONS } from '@/lib/mediapipe';

export function ThreeDModel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId = 0;
    let cleanupFns: (() => void)[] = [];

    (() => {
      const W = container.clientWidth || 400;
      const H = 280;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x0d1f3a, 1);
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(44, W / H, 0.1, 100);
      camera.position.set(0, 0.1, 3.9);

      scene.add(new THREE.AmbientLight(0xffffff, 2));
      const dl = new THREE.DirectionalLight(0xffffff, 3.0);
      dl.position.set(2, 2, 3);
      scene.add(dl);
      const dl2 = new THREE.DirectionalLight(0x1e3a6f, 1.2);
      dl2.position.set(-2, -1, 1);
      scene.add(dl2);

      const group = new THREE.Group();
      scene.add(group);

      const loader = new GLTFLoader();
      loader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb', (gltf) => {
        const avatar = gltf.scene;
        // Scale and align the avatar's head with the existing landmark coordinates
        avatar.scale.set(1.4, 1.4, 1.4);
        avatar.position.set(0, 0, -0.2);
        
        // Traverse and tweak materials to look good with our lighting
        avatar.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            const mesh = node as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.roughness = 0.6;
              mat.metalness = 0.1;
            }
          }
        });

        group.add(avatar);
        setLoading(false);
      }, undefined, (error) => {
        console.error('Failed to load avatar:', error);
        setLoading(false);
      });

      // Landmark spheres + label sprites
      const lmMeshes: Record<string, THREE.Mesh> = {};
      for (const lm of ANTHROPOMETRIC_LANDMARKS) {
        const [x, y, z] = lm.position3d;
        const color = parseInt(lm.color.replace('#', ''), 16);
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 10, 10),
          new THREE.MeshBasicMaterial({ color })
        );
        mesh.position.set(x, y * 1.1, z);
        group.add(mesh);
        lmMeshes[lm.id] = mesh;

        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 72; labelCanvas.height = 24;
        const ctx = labelCanvas.getContext('2d')!;
        ctx.fillStyle = lm.color;
        ctx.font = 'bold 12px monospace';
        ctx.fillText(lm.id, 3, 17);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
          map: new THREE.CanvasTexture(labelCanvas),
          transparent: true, depthTest: false,
        }));
        sprite.position.set(x + (x < 0 ? -0.14 : x > 0 ? 0.14 : 0.01), y * 1.1 + 0.09, z + 0.02);
        sprite.scale.set(0.52, 0.17, 1);
        group.add(sprite);
      }

      // Measurement lines between landmark pairs
      const lineMat = new THREE.LineBasicMaterial({ color: 0x1e5a8a, transparent: true, opacity: 0.5 });
      for (const m of MEASURE_DEFINITIONS) {
        const a = lmMeshes[m.from], b = lmMeshes[m.to];
        if (!a || !b) continue;
        const geo = new THREE.BufferGeometry().setFromPoints([a.position.clone(), b.position.clone()]);
        group.add(new THREE.Line(geo, lineMat));
      }

      // Drag rotation
      let isDragging = false;
      let prev = { x: 0, y: 0 };

      const onMouseDown = (e: MouseEvent) => { isDragging = true; prev = { x: e.clientX, y: e.clientY }; };
      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        group.rotation.y += (e.clientX - prev.x) * 0.012;
        group.rotation.x += (e.clientY - prev.y) * 0.012;
        prev = { x: e.clientX, y: e.clientY };
      };
      const onMouseUp = () => { isDragging = false; };
      const onTouchStart = (e: TouchEvent) => { isDragging = true; prev = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
      const onTouchMove = (e: TouchEvent) => {
        if (!isDragging) return;
        group.rotation.y += (e.touches[0].clientX - prev.x) * 0.012;
        group.rotation.x += (e.touches[0].clientY - prev.y) * 0.012;
        prev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      };
      const onTouchEnd = () => { isDragging = false; };

      renderer.domElement.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true });
      renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: true });
      document.addEventListener('touchend', onTouchEnd);

      const renderLoop = () => {
        animId = requestAnimationFrame(renderLoop);
        if (!isDragging) group.rotation.y += 0.006;
        renderer.render(scene, camera);
      };
      renderLoop();

      cleanupFns.push(() => {
        cancelAnimationFrame(animId);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('touchend', onTouchEnd);
        renderer.domElement.removeEventListener('mousedown', onMouseDown);
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
        renderer.dispose();
      });
    })();

    return () => cleanupFns.forEach(fn => fn());
  }, []);

  return (
    <div>
      <div
        ref={containerRef}
        style={{ width: '100%', height: 280, borderRadius: 8, overflow: 'hidden', cursor: 'grab', background: 'oklch(0.14 0.03 230)', position: 'relative' }}
      >
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(13, 31, 58, 0.8)', zIndex: 10 }}>
            <div style={{ color: 'var(--ink-2)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 16, height: 16, border: '2px solid var(--petrol)', borderTopColor: 'var(--sage)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              Loading avatar…
            </div>
          </div>
        )}
      </div>
      <p style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'center', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
        Drag to rotate · 16 anthropometric landmarks · colored by anatomical group
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 10 }}>
        {[
          { label: 'Cranial', color: '#00c9a7' },
          { label: 'Airway',  color: '#ffa94d' },
          { label: 'Jaw',     color: '#ff5c5c' },
          { label: 'Oral',    color: '#60a5fa' },
          { label: 'Facial',  color: '#c084fc' },
          { label: 'Orbital', color: '#60a5fa' },
        ].map(g => (
          <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ink-3)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: g.color, display: 'inline-block' }} />
            {g.label}
          </div>
        ))}
      </div>
    </div>
  );
}
