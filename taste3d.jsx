import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ShoppingCart, X, RotateCcw, Smartphone, Plus, Minus, Check, ChevronRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const INK = '#0C0B0A';
const PANEL = '#15130F';
const CREAM = '#F4EEE2';
const EMBER = '#FF5A36';
const COPPER = '#C9873F';
const SAGE = '#8FA07C';

const CATEGORY_META = {
  starters: { label: 'Starters', eyebrow: '01' },
  main: { label: 'Main Course', eyebrow: '02' },
  beverages: { label: 'Beverages', eyebrow: '03' },
  desserts: { label: 'Desserts', eyebrow: '04' },
};

const DISHES = {
  starters: {
    dishKey: 'pizza',
    name: 'Stone-Fired Flatbread',
    tagline: 'Charred sourdough base, San Marzano sauce, cold-pressed olive oil',
    basePrice: 12,
    toggles: [
      { key: 'extraCheese', label: 'Extra Cheese', price: 2 },
      { key: 'pepperoni', label: 'Pepperoni', price: 2.5 },
      { key: 'basil', label: 'Fresh Basil', price: 1 },
      { key: 'mushroom', label: 'Wild Mushroom', price: 2 },
    ],
    defaults: { extraCheese: false, pepperoni: false, basil: true, mushroom: false },
  },
  main: {
    dishKey: 'burger',
    name: 'Smokehouse Burger',
    tagline: 'Dry-aged beef, brioche bun, aged cheddar, oak-smoked bacon',
    basePrice: 16,
    toggles: [
      { key: 'extraPatty', label: 'Extra Patty', price: 4 },
      { key: 'extraCheese', label: 'Aged Cheddar', price: 1.5 },
      { key: 'lettuce', label: 'Butter Lettuce', price: 0 },
      { key: 'tomato', label: 'Heirloom Tomato', price: 0.5 },
    ],
    defaults: { extraPatty: false, extraCheese: true, lettuce: true, tomato: true },
  },
  beverages: {
    dishKey: 'latte',
    name: 'Copper Pour Latte',
    tagline: 'Single-origin espresso, steamed oat milk, house-roasted',
    basePrice: 5.5,
    sizes: [
      { key: 's', label: 'Small', price: 0, scale: 0.82 },
      { key: 'm', label: 'Medium', price: 1, scale: 1 },
      { key: 'l', label: 'Large', price: 2, scale: 1.2 },
    ],
    toggles: [{ key: 'latteArt', label: 'Latte Art', price: 0 }],
    defaults: { size: 'm', latteArt: true },
  },
  desserts: {
    dishKey: 'macaron',
    name: 'French Macaron Trio',
    tagline: 'Almond flour shell, silk ganache filling, made in-house',
    basePrice: 7,
    colors: [
      { key: 'rose', label: 'Rose', hex: 0xe38aae },
      { key: 'pistachio', label: 'Pistachio', hex: 0x9cb380 },
      { key: 'vanilla', label: 'Vanilla', hex: 0xf3e5c3 },
    ],
    toggles: [{ key: 'extraFilling', label: 'Extra Filling', price: 1 }],
    defaults: { color: 'rose', extraFilling: false },
  },
};

// ---------------------------------------------------------------------------
// Three.js dish builders — each returns a THREE.Group with named children
// tagged via userData.name so we can toggle/tint them from React state.
// ---------------------------------------------------------------------------
function tagMesh(mesh, name) {
  mesh.userData.name = name;
  mesh.userData.baseScale = mesh.scale.clone();
  mesh.userData.factor = 1;
  return mesh;
}

function ring(count, radius) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + i * 0.7;
    const r = radius * (0.4 + 0.55 * ((i * 37) % 10) / 10);
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return pts;
}

function buildPizza() {
  const g = new THREE.Group();

  const dough = new THREE.Mesh(
    new THREE.CylinderGeometry(1.65, 1.7, 0.16, 48),
    new THREE.MeshStandardMaterial({ color: 0xd9a763, roughness: 0.75 })
  );
  g.add(dough);

  const sauce = new THREE.Mesh(
    new THREE.CylinderGeometry(1.45, 1.45, 0.05, 48),
    new THREE.MeshStandardMaterial({ color: 0xa8321f, roughness: 0.55 })
  );
  sauce.position.y = 0.1;
  g.add(sauce);

  const cheese = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.4, 0.05, 48),
    new THREE.MeshStandardMaterial({ color: 0xf2c94c, roughness: 0.4 })
  );
  cheese.position.y = 0.135;
  g.add(cheese);

  const extraCheese = new THREE.Mesh(
    new THREE.CylinderGeometry(1.42, 1.42, 0.09, 48),
    new THREE.MeshStandardMaterial({ color: 0xf6d871, roughness: 0.4 })
  );
  extraCheese.position.y = 0.19;
  extraCheese.scale.y = 0;
  tagMesh(extraCheese, 'extraCheese');
  g.add(extraCheese);

  const pepGroup = new THREE.Group();
  const pepMat = new THREE.MeshStandardMaterial({ color: 0x7c1d1d, roughness: 0.5 });
  ring(11, 1.15).forEach(([x, z]) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16), pepMat);
    p.position.set(x, 0.17, z);
    pepGroup.add(p);
  });
  tagMesh(pepGroup, 'pepperoni');
  g.add(pepGroup);

  const mushGroup = new THREE.Group();
  const mushMat = new THREE.MeshStandardMaterial({ color: 0xe8dcc4, roughness: 0.7 });
  ring(8, 1.0).forEach(([x, z]) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), mushMat);
    m.position.set(x, 0.19, z);
    m.scale.y = 0.55;
    mushGroup.add(m);
  });
  tagMesh(mushGroup, 'mushroom');
  g.add(mushGroup);

  const basilGroup = new THREE.Group();
  const basilMat = new THREE.MeshStandardMaterial({ color: 0x3f6b34, roughness: 0.6 });
  ring(9, 1.05).forEach(([x, z], i) => {
    const b = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.03, 8), basilMat);
    b.position.set(x, 0.18, z);
    b.rotation.x = Math.PI / 2;
    b.rotation.z = i;
    basilGroup.add(b);
  });
  tagMesh(basilGroup, 'basil');
  g.add(basilGroup);

  g.rotation.x = 0.35;
  return g;
}

function buildBurger() {
  const g = new THREE.Group();
  const bunMat = new THREE.MeshStandardMaterial({ color: 0xc98a4b, roughness: 0.65 });

  const bottomBun = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 0.35, 32), bunMat);
  bottomBun.position.y = -0.85;
  g.add(bottomBun);

  const patty1 = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.1, 0.3, 32),
    new THREE.MeshStandardMaterial({ color: 0x4a2a1c, roughness: 0.8 })
  );
  patty1.position.y = -0.5;
  g.add(patty1);

  const cheese = new THREE.Mesh(
    new THREE.BoxGeometry(2.35, 0.06, 2.35),
    new THREE.MeshStandardMaterial({ color: 0xf2b134, roughness: 0.35 })
  );
  cheese.position.y = -0.32;
  cheese.rotation.y = 0.4;
  tagMesh(cheese, 'extraCheese');
  g.add(cheese);

  const lettuce = new THREE.Mesh(
    new THREE.TorusGeometry(1.05, 0.16, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0x6f9a4c, roughness: 0.7 })
  );
  lettuce.position.y = -0.18;
  lettuce.rotation.x = Math.PI / 2;
  tagMesh(lettuce, 'lettuce');
  g.add(lettuce);

  const tomato = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 1.0, 0.1, 32),
    new THREE.MeshStandardMaterial({ color: 0xc23b2c, roughness: 0.5 })
  );
  tomato.position.y = -0.08;
  tagMesh(tomato, 'tomato');
  g.add(tomato);

  const patty2 = patty1.clone();
  patty2.position.y = 0.05;
  patty2.scale.y = 0;
  tagMesh(patty2, 'extraPatty');
  g.add(patty2);

  const topBun = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 20, 0, Math.PI * 2, 0, Math.PI / 1.7), bunMat);
  topBun.position.y = 0.35;
  g.add(topBun);

  const seedMat = new THREE.MeshStandardMaterial({ color: 0xf6e6c8, roughness: 0.5 });
  ring(14, 0.85).forEach(([x, z]) => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), seedMat);
    s.position.set(x, 0.78, z);
    topBun.add(s);
  });

  g.rotation.x = 0.15;
  g.position.y = 0.5;
  return g;
}

function buildLatte() {
  const g = new THREE.Group();

  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.65, 1.7, 40, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xece3d3, roughness: 0.4, side: THREE.DoubleSide })
  );
  g.add(cup);

  const cupBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.65, 0.05, 40),
    new THREE.MeshStandardMaterial({ color: 0xece3d3, roughness: 0.4 })
  );
  cupBase.position.y = -0.85;
  g.add(cupBase);

  const coffee = new THREE.Mesh(
    new THREE.CylinderGeometry(0.82, 0.82, 0.08, 40),
    new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.25 })
  );
  coffee.position.y = 0.81;
  g.add(coffee);

  const art = new THREE.Mesh(
    new THREE.TorusGeometry(0.35, 0.05, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0xf4e9d8, roughness: 0.3 })
  );
  art.position.y = 0.86;
  art.rotation.x = Math.PI / 2;
  tagMesh(art, 'latteArt');
  g.add(art);

  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.07, 10, 24, Math.PI * 1.4),
    new THREE.MeshStandardMaterial({ color: 0xece3d3, roughness: 0.4 })
  );
  handle.position.set(0.95, 0, 0);
  handle.rotation.y = Math.PI / 2;
  handle.rotation.z = -0.7;
  g.add(handle);

  g.position.y = -0.2;
  return g;
}

function buildMacaron() {
  const g = new THREE.Group();
  const positions = [
    [-1.3, 0, 0.2],
    [0, 0, -0.3],
    [1.3, 0, 0.2],
  ];
  const shellMat = new THREE.MeshStandardMaterial({ color: 0xe38aae, roughness: 0.55 });
  shellMat.name = 'shellColor';
  const fillMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });

  positions.forEach(([x, y, z], idx) => {
    const macGroup = new THREE.Group();
    macGroup.position.set(x, y, z);

    const top = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), shellMat);
    top.position.y = 0.18;
    macGroup.add(top);

    const bottom = top.clone();
    bottom.rotation.x = Math.PI;
    bottom.position.y = -0.18;
    macGroup.add(bottom);

    const filling = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.16, 24), fillMat);
    filling.userData.isFilling = true;
    macGroup.add(filling);

    macGroup.rotation.y = idx * 0.5;
    g.add(macGroup);
  });

  g.userData.shellMat = shellMat;
  g.userData.fillMat = fillMat;
  g.rotation.x = 0.3;
  return g;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function Taste3D() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const groupsRef = useRef({});
  const activeCategoryRef = useRef('starters');
  const dragRef = useRef({ dragging: false, lastX: 0, lastY: 0 });
  const targetFactorsRef = useRef({});

  const [activeCategory, setActiveCategory] = useState('starters');
  const [customizations, setCustomizations] = useState(() => {
    const init = {};
    Object.keys(DISHES).forEach((k) => (init[k] = { ...DISHES[k].defaults }));
    return init;
  });
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('cart'); // cart | confirmed
  const [toast, setToast] = useState(null);
  const [tilt, setTilt] = useState({});

  activeCategoryRef.current = activeCategory;

  // ---- Three.js setup (runs once) ----
  useEffect(() => {
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.6, 6.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xfff2e0, 0.55);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffd9b0, 1.2);
    key.position.set(3, 4, 4);
    scene.add(key);
    const rim = new THREE.PointLight(0xff5a36, 0.8, 20);
    rim.position.set(-3, 1, -2);
    scene.add(rim);
    const fill = new THREE.PointLight(0xc9873f, 0.4, 20);
    fill.position.set(0, -2, 3);
    scene.add(fill);

    const groups = {
      pizza: buildPizza(),
      burger: buildBurger(),
      latte: buildLatte(),
      macaron: buildMacaron(),
    };
    Object.entries(groups).forEach(([key2, grp]) => {
      grp.visible = key2 === DISHES[activeCategoryRef.current].dishKey;
      scene.add(grp);
    });
    groupsRef.current = groups;
    sceneRef.current = { scene, camera, renderer };

    let raf;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const currentDishKey = DISHES[activeCategoryRef.current].dishKey;
      const activeGrp = groups[currentDishKey];

      if (!dragRef.current.dragging) {
        activeGrp.rotation.y += dt * 0.28;
      }

      // lerp toggle meshes toward their target scale factor
      Object.values(groups).forEach((grp) => {
        grp.traverse((child) => {
          if (child.userData && child.userData.name) {
            const target = targetFactorsRef.current[child.userData.name];
            const t = target === undefined ? child.userData.factor : target;
            child.userData.factor += (t - child.userData.factor) * Math.min(1, dt * 6);
            const bs = child.userData.baseScale;
            const f = Math.max(0.0001, child.userData.factor);
            child.scale.set(bs.x * f, bs.y * f, bs.z * f);
          }
        });
      });

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    const dom = renderer.domElement;
    const onDown = (e) => {
      dragRef.current.dragging = true;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
    };
    const onMove = (e) => {
      if (!dragRef.current.dragging) return;
      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
      const grp = groups[DISHES[activeCategoryRef.current].dishKey];
      grp.rotation.y += dx * 0.008;
      grp.rotation.x = Math.min(0.9, Math.max(-0.5, grp.rotation.x + dy * 0.006));
    };
    const onUp = () => (dragRef.current.dragging = false);
    dom.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    dom.style.cursor = 'grab';

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      dom.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      mount.removeChild(dom);
      renderer.dispose();
    };
  }, []);

  // ---- Sync active dish visibility ----
  useEffect(() => {
    const groups = groupsRef.current;
    if (!groups.pizza) return;
    Object.entries(groups).forEach(([key2, grp]) => {
      grp.visible = key2 === DISHES[activeCategory].dishKey;
    });
  }, [activeCategory]);

  // ---- Sync customization targets into three.js ----
  useEffect(() => {
    const dishDef = DISHES[activeCategory];
    const state = customizations[activeCategory];
    const targets = {};
    (dishDef.toggles || []).forEach((t) => {
      targets[t.key] = state[t.key] ? 1 : 0;
    });
    targetFactorsRef.current = { ...targetFactorsRef.current, ...targets };

    if (dishDef.dishKey === 'burger') {
      targetFactorsRef.current.extraPatty = state.extraPatty ? 1 : 0;
    }
    if (dishDef.dishKey === 'latte') {
      const sizeDef = dishDef.sizes.find((s) => s.key === state.size);
      const grp = groupsRef.current.latte;
      if (grp) grp.scale.setScalar(sizeDef ? sizeDef.scale : 1);
    }
    if (dishDef.dishKey === 'macaron') {
      const grp = groupsRef.current.macaron;
      if (grp) {
        const colorDef = dishDef.colors.find((c) => c.key === state.color);
        if (colorDef) grp.userData.shellMat.color.setHex(colorDef.hex);
        grp.traverse((child) => {
          if (child.userData.isFilling) {
            child.scale.y = state.extraFilling ? 1.8 : 1;
          }
        });
      }
    }
  }, [customizations, activeCategory]);

  const updateToggle = useCallback((key) => {
    setCustomizations((prev) => ({
      ...prev,
      [activeCategory]: { ...prev[activeCategory], [key]: !prev[activeCategory][key] },
    }));
  }, [activeCategory]);

  const updateChoice = useCallback((field, value) => {
    setCustomizations((prev) => ({
      ...prev,
      [activeCategory]: { ...prev[activeCategory], [field]: value },
    }));
  }, [activeCategory]);

  const dishDef = DISHES[activeCategory];
  const state = customizations[activeCategory];

  const computePrice = () => {
    let total = dishDef.basePrice;
    (dishDef.toggles || []).forEach((t) => {
      if (state[t.key]) total += t.price;
    });
    if (dishDef.sizes) {
      const s = dishDef.sizes.find((x) => x.key === state.size);
      if (s) total += s.price;
    }
    return total;
  };

  const addToCart = () => {
    const price = computePrice();
    const parts = [];
    (dishDef.toggles || []).forEach((t) => state[t.key] && parts.push(t.label));
    if (dishDef.sizes) {
      const s = dishDef.sizes.find((x) => x.key === state.size);
      if (s) parts.unshift(s.label);
    }
    if (dishDef.colors) {
      const c = dishDef.colors.find((x) => x.key === state.color);
      if (c) parts.unshift(c.label);
    }
    setCart((prev) => [
      ...prev,
      { id: Date.now(), name: dishDef.name, price, details: parts.join(' · ') || 'Classic' },
    ]);
    setToast('Added to cart');
    setTimeout(() => setToast(null), 1600);
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((i) => i.id !== id));
  const cartTotal = cart.reduce((s, i) => s + i.price, 0);

  const handleTilt = (e, key) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt((t) => ({ ...t, [key]: { x: py * -10, y: px * 12 } }));
  };
  const resetTilt = (key) => setTilt((t) => ({ ...t, [key]: { x: 0, y: 0 } }));

  return (
    <div style={{ background: INK, color: CREAM, fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Inter:wght@400;500;600&display=swap');
        .disp { font-family: 'Fraunces', serif; }
        .glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(16px);
        }
        .ember-glow { box-shadow: 0 0 40px rgba(255,90,54,0.25); }
        .toggle-pill { transition: all 0.2s ease; }
        @keyframes drift {
          0%,100% { transform: translate(0,0); }
          50% { transform: translate(12px,-18px); }
        }
        .blob { position:absolute; border-radius:9999px; filter: blur(60px); opacity:0.35; animation: drift 9s ease-in-out infinite; }
      `}</style>

      {/* HERO */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '72px 24px 40px' }}>
        <div className="blob" style={{ width: 260, height: 260, background: EMBER, top: -40, left: '10%' }} />
        <div className="blob" style={{ width: 220, height: 220, background: COPPER, top: 120, right: '8%', animationDelay: '2s' }} />

        <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, letterSpacing: 3, color: COPPER, marginBottom: 18, textTransform: 'uppercase' }}>
            Ember &amp; Copper — Table-Side, Reimagined
          </div>
          <h1 className="disp" style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 600, lineHeight: 1.05, margin: '0 0 18px' }}>
            Taste the menu<br />before it arrives.
          </h1>
          <p style={{ maxWidth: 560, margin: '0 auto', color: 'rgba(244,238,226,0.7)', fontSize: 16, lineHeight: 1.6 }}>
            Every dish below is a live 3D model. Drag to inspect it, change what's on it,
            and watch the plate update in real time — no app, no download.
          </p>
        </div>

        <div style={{ position: 'relative', display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginTop: 44, maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const t = tilt[key] || { x: 0, y: 0 };
            const isActive = activeCategory === key;
            return (
              <button
                key={key}
                onMouseMove={(e) => handleTilt(e, key)}
                onMouseLeave={() => resetTilt(key)}
                onClick={() => setActiveCategory(key)}
                className="glass"
                style={{
                  width: 170,
                  padding: '22px 18px',
                  borderRadius: 18,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transform: `perspective(600px) rotateX(${t.x}deg) rotateY(${t.y}deg) ${isActive ? 'scale(1.04)' : ''}`,
                  transition: 'transform 0.12s ease, border-color 0.2s ease',
                  borderColor: isActive ? EMBER : 'rgba(255,255,255,0.1)',
                }}
              >
                <div style={{ fontSize: 11, color: COPPER, letterSpacing: 2 }}>{meta.eyebrow}</div>
                <div className="disp" style={{ fontSize: 19, marginTop: 6 }}>{meta.label}</div>
                <div style={{ fontSize: 12, color: 'rgba(244,238,226,0.5)', marginTop: 8 }}>
                  {DISHES[key].name}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* VIEWER */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 80px', display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(280px,0.8fr)', gap: 28 }}>
        <div className="glass ember-glow" style={{ borderRadius: 24, position: 'relative', minHeight: 460, overflow: 'hidden' }}>
          <div ref={mountRef} style={{ width: '100%', height: 460 }} />
          <div style={{ position: 'absolute', top: 18, left: 20, fontSize: 11, letterSpacing: 2, color: 'rgba(244,238,226,0.55)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RotateCcw size={13} /> DRAG TO ROTATE
          </div>
          <button
            onClick={() => { setToast('AR Quick Look opens on supported iOS / Android devices'); setTimeout(() => setToast(null), 2200); }}
            className="glass"
            style={{ position: 'absolute', bottom: 18, right: 18, padding: '9px 14px', borderRadius: 999, fontSize: 12, color: CREAM, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            <Smartphone size={14} /> View in AR
          </button>
        </div>

        <div className="glass" style={{ borderRadius: 24, padding: 26 }}>
          <div style={{ fontSize: 11, color: COPPER, letterSpacing: 2, marginBottom: 6 }}>{CATEGORY_META[activeCategory].label.toUpperCase()}</div>
          <h2 className="disp" style={{ fontSize: 26, margin: '0 0 8px' }}>{dishDef.name}</h2>
          <p style={{ fontSize: 13, color: 'rgba(244,238,226,0.6)', lineHeight: 1.5, marginBottom: 22 }}>{dishDef.tagline}</p>

          {dishDef.sizes && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, letterSpacing: 1.5, color: 'rgba(244,238,226,0.5)', marginBottom: 8 }}>SIZE</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {dishDef.sizes.map((s) => (
                  <button key={s.key} onClick={() => updateChoice('size', s.key)} className="toggle-pill"
                    style={{ flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 12, cursor: 'pointer',
                      background: state.size === s.key ? EMBER : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${state.size === s.key ? EMBER : 'rgba(255,255,255,0.1)'}`,
                      color: state.size === s.key ? INK : CREAM, fontWeight: 600 }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {dishDef.colors && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, letterSpacing: 1.5, color: 'rgba(244,238,226,0.5)', marginBottom: 8 }}>FLAVOR</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {dishDef.colors.map((c) => (
                  <button key={c.key} onClick={() => updateChoice('color', c.key)}
                    title={c.label}
                    style={{ width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
                      background: `#${c.hex.toString(16).padStart(6, '0')}`,
                      border: state.color === c.key ? `3px solid ${EMBER}` : '3px solid rgba(255,255,255,0.15)' }} />
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, color: 'rgba(244,238,226,0.5)', marginBottom: 8 }}>CUSTOMIZE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dishDef.toggles.map((t) => (
                <button key={t.key} onClick={() => updateToggle(t.key)} className="toggle-pill"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px',
                    borderRadius: 12, cursor: 'pointer',
                    background: state[t.key] ? 'rgba(255,90,54,0.14)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${state[t.key] ? EMBER : 'rgba(255,255,255,0.1)'}` }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ width: 16, height: 16, borderRadius: 5, border: `1px solid ${state[t.key] ? EMBER : 'rgba(255,255,255,0.3)'}`,
                      background: state[t.key] ? EMBER : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {state[t.key] && <Check size={11} color={INK} />}
                    </span>
                    {t.label}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(244,238,226,0.5)' }}>{t.price > 0 ? `+$${t.price.toFixed(2)}` : 'incl.'}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(244,238,226,0.5)' }}>TOTAL</div>
              <div className="disp" style={{ fontSize: 22 }}>${computePrice().toFixed(2)}</div>
            </div>
            <button onClick={addToCart}
              style={{ background: EMBER, color: INK, border: 'none', padding: '13px 22px', borderRadius: 12,
                fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              Add to Cart <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* CART FAB */}
      <button onClick={() => { setCartOpen(true); setCheckoutStep('cart'); }}
        style={{ position: 'fixed', bottom: 24, right: 24, background: PANEL, border: `1px solid ${COPPER}`, color: CREAM,
          width: 56, height: 56, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40 }}>
        <ShoppingCart size={20} />
        {cart.length > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, background: EMBER, color: INK, fontSize: 11, fontWeight: 700,
            borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {cart.length}
          </span>
        )}
      </button>

      {/* TOAST */}
      {toast && (
        <div className="glass" style={{ position: 'fixed', bottom: 92, right: 24, padding: '10px 16px', borderRadius: 12, fontSize: 13, zIndex: 50 }}>
          {toast}
        </div>
      )}

      {/* CART DRAWER */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 45, pointerEvents: cartOpen ? 'auto' : 'none' }}>
        <div onClick={() => setCartOpen(false)}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', opacity: cartOpen ? 1 : 0, transition: 'opacity 0.25s' }} />
        <div className="glass" style={{
          position: 'absolute', top: 0, right: 0, height: '100%', width: 360, maxWidth: '90vw',
          background: PANEL, padding: 26, transform: `translateX(${cartOpen ? '0' : '100%'})`, transition: 'transform 0.3s ease',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 className="disp" style={{ fontSize: 20, margin: 0 }}>Your Order</h3>
            <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', color: CREAM, cursor: 'pointer' }}><X size={20} /></button>
          </div>

          {checkoutStep === 'cart' ? (
            <>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cart.length === 0 && <p style={{ color: 'rgba(244,238,226,0.5)', fontSize: 13 }}>Your cart is empty — customize a dish and add it.</p>}
                {cart.map((item) => (
                  <div key={item.id} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="disp" style={{ fontSize: 15 }}>{item.name}</span>
                      <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: 'rgba(244,238,226,0.5)', cursor: 'pointer' }}><Minus size={14} /></button>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(244,238,226,0.5)', margin: '4px 0' }}>{item.details}</div>
                    <div style={{ fontSize: 13, color: COPPER }}>${item.price.toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, color: 'rgba(244,238,226,0.6)' }}>Total</span>
                  <span className="disp" style={{ fontSize: 18 }}>${cartTotal.toFixed(2)}</span>
                </div>
                <button disabled={cart.length === 0} onClick={() => setCheckoutStep('confirmed')}
                  style={{ width: '100%', padding: 13, borderRadius: 12, border: 'none', background: cart.length ? EMBER : 'rgba(255,255,255,0.1)',
                    color: cart.length ? INK : 'rgba(244,238,226,0.4)', fontWeight: 600, cursor: cart.length ? 'pointer' : 'default' }}>
                  Secure Checkout
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ borderRadius: 16, padding: 18, background: `linear-gradient(135deg, ${COPPER}, ${EMBER})`, marginBottom: 20, color: INK }}>
                <div style={{ fontSize: 11, letterSpacing: 1.5, opacity: 0.8 }}>EMBER &amp; COPPER</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, margin: '18px 0 4px', letterSpacing: 2 }}>•••• •••• •••• 4242</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.8 }}>
                  <span>TABLE GUEST</span><span>12/29</span>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 10 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: SAGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check color={INK} />
                </div>
                <div className="disp" style={{ fontSize: 18 }}>Order confirmed</div>
                <p style={{ fontSize: 12, color: 'rgba(244,238,226,0.55)', maxWidth: 240 }}>
                  Your table will be notified. This is a design preview — no payment was processed.
                </p>
                <button onClick={() => { setCart([]); setCheckoutStep('cart'); setCartOpen(false); }}
                  style={{ marginTop: 10, background: 'none', border: `1px solid ${COPPER}`, color: CREAM, padding: '9px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 12 }}>
                  Back to menu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
