// Bead catalog. Each bead maps to a MeshPhysicalMaterial recipe in bracelet-scene.js.
// `color` doubles as the CSS swatch base color in the palette UI.

export const SLOT_COUNT = 18;
export const UNIT_PRICE = 4.99;

export const CATEGORIES = [
  { id: 'metallic', label: 'Metallic' },
  { id: 'pearly', label: 'Pearly' },
  { id: 'kaleidoscopic', label: 'Kaleidoscopic' },
  { id: 'solid', label: 'Solid' },
];

export const BEADS = [
  // Metallic — mirror-bright, low roughness
  { id: 'gold', name: 'Gold', category: 'metallic', color: '#D4A845', mat: { metalness: 1, roughness: 0.18 } },
  { id: 'silver', name: 'Silver', category: 'metallic', color: '#C4C6CC', mat: { metalness: 1, roughness: 0.14 } },
  { id: 'copper', name: 'Copper', category: 'metallic', color: '#B4713E', mat: { metalness: 1, roughness: 0.22 } },
  { id: 'rose-gold', name: 'Rose gold', category: 'metallic', color: '#C58A87', mat: { metalness: 1, roughness: 0.2 } },
  { id: 'gunmetal', name: 'Gunmetal', category: 'metallic', color: '#4E535D', mat: { metalness: 1, roughness: 0.28 } },
  { id: 'bronze', name: 'Bronze', category: 'metallic', color: '#8C6A3F', mat: { metalness: 1, roughness: 0.3 } },

  // Pearly — clearcoat sheen, faint iridescence
  { id: 'ivory-pearl', name: 'Ivory pearl', category: 'pearly', color: '#F3EDE0', mat: { roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.18, sheen: 0.6, iridescence: 0.3 } },
  { id: 'blush-pearl', name: 'Blush pearl', category: 'pearly', color: '#EFD3D6', mat: { roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.18, sheen: 0.6, iridescence: 0.3 } },
  { id: 'mist-pearl', name: 'Mist pearl', category: 'pearly', color: '#D6E0E4', mat: { roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.18, sheen: 0.6, iridescence: 0.3 } },
  { id: 'champagne-pearl', name: 'Champagne', category: 'pearly', color: '#E8DCBE', mat: { roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.18, sheen: 0.6, iridescence: 0.3 } },
  { id: 'lilac-pearl', name: 'Lilac pearl', category: 'pearly', color: '#DCD2E8', mat: { roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.18, sheen: 0.6, iridescence: 0.3 } },
  { id: 'seafoam-pearl', name: 'Seafoam pearl', category: 'pearly', color: '#D0E4DA', mat: { roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.18, sheen: 0.6, iridescence: 0.3 } },

  // Kaleidoscopic — full thin-film iridescence, oil-slick shimmer
  { id: 'oil-slick', name: 'Oil slick', category: 'kaleidoscopic', color: '#2E3A55', mat: { metalness: 0.35, roughness: 0.2, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [100, 800] } },
  { id: 'aurora', name: 'Aurora', category: 'kaleidoscopic', color: '#4E8C74', mat: { metalness: 0.3, roughness: 0.22, iridescence: 1, iridescenceIOR: 1.5, iridescenceThicknessRange: [200, 700] } },
  { id: 'nebula', name: 'Nebula', category: 'kaleidoscopic', color: '#5E4177', mat: { metalness: 0.35, roughness: 0.2, iridescence: 1, iridescenceIOR: 1.7, iridescenceThicknessRange: [150, 900] } },
  { id: 'peacock', name: 'Peacock', category: 'kaleidoscopic', color: '#1E5F6B', mat: { metalness: 0.35, roughness: 0.18, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [300, 850] } },
  { id: 'magma', name: 'Magma', category: 'kaleidoscopic', color: '#84392B', mat: { metalness: 0.3, roughness: 0.24, iridescence: 1, iridescenceIOR: 1.5, iridescenceThicknessRange: [100, 600] } },
  { id: 'prism', name: 'Prism', category: 'kaleidoscopic', color: '#9BA0B4', mat: { metalness: 0.4, roughness: 0.15, iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [100, 1000] } },

  // Solid — matte candy
  { id: 'garnet', name: 'Garnet', category: 'solid', color: '#7C2136', mat: { roughness: 0.85 } },
  { id: 'ink', name: 'Ink', category: 'solid', color: '#1B1A17', mat: { roughness: 0.85 } },
  { id: 'honey', name: 'Honey', category: 'solid', color: '#D9A441', mat: { roughness: 0.85 } },
  { id: 'fern', name: 'Fern', category: 'solid', color: '#5A7052', mat: { roughness: 0.85 } },
  { id: 'cornflower', name: 'Cornflower', category: 'solid', color: '#5B7AA6', mat: { roughness: 0.85 } },
  { id: 'chalk', name: 'Chalk', category: 'solid', color: '#E9E5DA', mat: { roughness: 0.9 } },
];

export const BEADS_BY_ID = Object.fromEntries(BEADS.map((b) => [b.id, b]));

// The arrangement shown in the hero and used as the builder's starting design.
export const DEFAULT_DESIGN = [
  'gold', 'ivory-pearl', 'garnet', 'ivory-pearl', 'gold', 'ivory-pearl',
  'oil-slick', 'ivory-pearl', 'gold', 'ivory-pearl', 'garnet', 'ivory-pearl',
  'gold', 'ivory-pearl', 'oil-slick', 'ivory-pearl', 'gold', 'ivory-pearl',
];
