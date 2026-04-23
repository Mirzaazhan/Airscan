'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ANTHROPOMETRIC_LANDMARKS, MEASURE_DEFINITIONS } from '@/lib/mediapipe';

export function ThreeDModel() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId = 0;
    let cleanupFns: (() => void)[] = [];

    (() => { // synchronous — THREE is a top-level import ('use client' = no SSR)

      const W = container.clientWidth || 400;
      const H = 280;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x0d1f3a, 1);
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(44, W / H, 0.1, 100);
      camera.position.set(0, 0.1, 3.9);

      scene.add(new THREE.AmbientLight(0x0a1830, 3));
      const dl = new THREE.DirectionalLight(0x00c9a7, 1.8);
      dl.position.set(2, 2, 3);
      scene.add(dl);
      const dl2 = new THREE.DirectionalLight(0x1e3a6f, 1.2);
      dl2.position.set(-2, -1, 1);
      scene.add(dl2);

      const group = new THREE.Group();
      scene.add(group);

      // Deformed sphere head
      const headGeo = new THREE.SphereGeometry(1, 52, 52);
      const pos = headGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const jt = y < -0.15 ? Math.max(0.62, 1 + (y + 0.15) * 0.55) : 1;
        pos.setX(i, pos.getX(i) * 0.82 * jt);
        pos.setY(i, y * 1.22);
        pos.setZ(i, pos.getZ(i) * 0.78);
      }
      pos.needsUpdate = true;
      headGeo.computeVertexNormals();

      group.add(new THREE.Mesh(headGeo, new THREE.MeshPhongMaterial({ color: 0x0a1e3a, specular: 0x1e3a5f, shininess: 30, transparent: true, opacity: 0.88 })));
      group.add(new THREE.Mesh(headGeo, new THREE.MeshBasicMaterial({ color: 0x1e4a7a, wireframe: true, transparent: true, opacity: 0.32 })));

      // Neck
      const nkGeo = new THREE.CylinderGeometry(0.30, 0.36, 0.52, 16);
      const nkSolid = new THREE.Mesh(nkGeo, new THREE.MeshPhongMaterial({ color: 0x0a1e3a, transparent: true, opacity: 0.88 }));
      nkSolid.position.set(0, -1.43, -0.06);
      group.add(nkSolid);
      const nkWire = new THREE.Mesh(nkGeo, new THREE.MeshBasicMaterial({ color: 0x1e4a7a, wireframe: true, transparent: true, opacity: 0.32 }));
      nkWire.position.copy(nkSolid.position);
      group.add(nkWire);

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
        headGeo.dispose();
        nkGeo.dispose();
      });
    })();

    return () => cleanupFns.forEach(fn => fn());
  }, []);

  return (
    <div>
      <div
        ref={containerRef}
        style={{ width: '100%', height: 280, borderRadius: 8, overflow: 'hidden', cursor: 'grab', background: 'oklch(0.14 0.03 230)' }}
      />
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
