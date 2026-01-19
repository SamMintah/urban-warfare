import * as THREE from 'three';

export class MapBuilder {
  constructor(scene, physicsManager) {
    this.scene = scene;
    this.physicsManager = physicsManager;
    this.mapObjects = []; // Track all map objects for cleanup
  }

  clearMap() {
    // Remove all map objects from scene
    this.mapObjects.forEach(obj => {
      this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    this.mapObjects = [];
    
    // Clear all colliders
    this.physicsManager.colliders = [];
    
    console.log('✓ Map cleared');
  }

  buildMapForLevel(level) {
    this.clearMap();
    
    // Build ground (same for all levels)
    this.createGround();
    
    // Build level-specific map
    switch(level) {
      case 1:
        this.buildLevel1();
        break;
      case 2:
        this.buildLevel2();
        break;
      case 3:
        this.buildLevel3();
        break;
      default:
        this.buildLevel1();
    }
    
    console.log(`✓ Built map for Level ${level}`);
  }

  buildLevel1() {
    // LEVEL 1: SMALL TOWN - Wide streets, simple grid, low buildings
    // COLOR SCHEME: Warm suburban colors (beige, cream, light brown)
    
    // North side - Small shops (cream/beige)
    this.createBuilding(new THREE.Vector3(15, 0, 30), 10, 6, 8, 0xD4C5B9);
    this.createBuilding(new THREE.Vector3(-15, 0, 30), 10, 6, 8, 0xE8DCC4);
    this.createBuilding(new THREE.Vector3(0, 0, 35), 8, 5, 6, 0xC9B8A3);
    
    // South side - Houses (light brown/tan)
    this.createBuilding(new THREE.Vector3(18, 0, -25), 8, 5, 8, 0xB8A58A);
    this.createBuilding(new THREE.Vector3(-18, 0, -25), 8, 5, 8, 0xD4C5B9);
    this.createBuilding(new THREE.Vector3(0, 0, -30), 10, 6, 10, 0xC9B8A3);
    
    // East side - Small buildings (warm beige)
    this.createBuilding(new THREE.Vector3(30, 0, 10), 8, 7, 8, 0xE8DCC4);
    this.createBuilding(new THREE.Vector3(30, 0, -10), 8, 7, 8, 0xD4C5B9);
    
    // West side - Small buildings (light tan)
    this.createBuilding(new THREE.Vector3(-30, 0, 10), 8, 7, 8, 0xB8A58A);
    this.createBuilding(new THREE.Vector3(-30, 0, -10), 8, 7, 8, 0xC9B8A3);
    
    // Center area - Small plaza
    this.createCrate(new THREE.Vector3(5, 0, 5));
    this.createCrate(new THREE.Vector3(-5, 0, 5));
    this.createCrate(new THREE.Vector3(5, 0, -5));
    this.createCrate(new THREE.Vector3(-5, 0, -5));
    
    // Simple walls for cover
    this.createWall(new THREE.Vector3(0, 0, 15), 12, 2, 0.5);
    this.createWall(new THREE.Vector3(15, 0, 0), 0.5, 2, 12);
    this.createWall(new THREE.Vector3(-15, 0, 0), 0.5, 2, 12);
    
    // Parked cars on wide streets
    this.createCar(new THREE.Vector3(10, 0, 20), 0);
    this.createCar(new THREE.Vector3(-10, 0, 20), Math.PI);
    this.createCar(new THREE.Vector3(20, 0, 0), Math.PI / 2);
    this.createCar(new THREE.Vector3(-20, 0, -15), -Math.PI / 4);
    
    // Street lights
    this.createStreetLight(new THREE.Vector3(12, 0, 12));
    this.createStreetLight(new THREE.Vector3(-12, 0, 12));
    this.createStreetLight(new THREE.Vector3(12, 0, -12));
    this.createStreetLight(new THREE.Vector3(-12, 0, -12));
  }

  buildLevel2() {
    // LEVEL 2: MODERN DOWNTOWN - Skyscrapers, medium streets, business district
    // COLOR SCHEME: Modern glass/steel (blue-grey, silver, dark grey)
    
    // Central skyscraper cluster (dark blue-grey)
    this.createBuilding(new THREE.Vector3(0, 0, 0), 12, 25, 12, 0x4A5568); // Center tower
    this.createBuilding(new THREE.Vector3(20, 0, 0), 10, 22, 10, 0x5A6A7A);
    this.createBuilding(new THREE.Vector3(-20, 0, 0), 10, 22, 10, 0x3A4A5A);
    this.createBuilding(new THREE.Vector3(0, 0, 20), 10, 20, 10, 0x6A7A8A);
    this.createBuilding(new THREE.Vector3(0, 0, -20), 10, 20, 10, 0x4A5A6A);
    
    // Corner towers (steel grey)
    this.createBuilding(new THREE.Vector3(35, 0, 35), 14, 28, 14, 0x708090);
    this.createBuilding(new THREE.Vector3(-35, 0, 35), 14, 28, 14, 0x778899);
    this.createBuilding(new THREE.Vector3(35, 0, -35), 14, 28, 14, 0x6A7A8A);
    this.createBuilding(new THREE.Vector3(-35, 0, -35), 14, 28, 14, 0x5A6A7A);
    
    // Mid-rise buildings (lighter grey/blue)
    this.createBuilding(new THREE.Vector3(40, 0, 15), 12, 15, 10, 0x8899AA);
    this.createBuilding(new THREE.Vector3(-40, 0, 15), 12, 15, 10, 0x7788AA);
    this.createBuilding(new THREE.Vector3(40, 0, -15), 12, 15, 10, 0x6A7A9A);
    this.createBuilding(new THREE.Vector3(-40, 0, -15), 12, 15, 10, 0x8899BB);
    this.createBuilding(new THREE.Vector3(15, 0, 40), 10, 15, 12, 0x7788AA);
    this.createBuilding(new THREE.Vector3(-15, 0, 40), 10, 15, 12, 0x6A7A9A);
    this.createBuilding(new THREE.Vector3(15, 0, -40), 10, 15, 12, 0x8899AA);
    this.createBuilding(new THREE.Vector3(-15, 0, -40), 10, 15, 12, 0x5A6A8A);
    
    // Office building walls
    this.createWall(new THREE.Vector3(10, 0, 10), 8, 3, 0.5);
    this.createWall(new THREE.Vector3(-10, 0, 10), 8, 3, 0.5);
    this.createWall(new THREE.Vector3(10, 0, -10), 8, 3, 0.5);
    this.createWall(new THREE.Vector3(-10, 0, -10), 8, 3, 0.5);
    this.createWall(new THREE.Vector3(25, 0, 25), 10, 3, 0.5);
    this.createWall(new THREE.Vector3(-25, 0, -25), 10, 3, 0.5);
    
    // Business district crates/barriers
    this.createCrate(new THREE.Vector3(8, 0, 8));
    this.createCrate(new THREE.Vector3(-8, 0, 8));
    this.createCrate(new THREE.Vector3(8, 0, -8));
    this.createCrate(new THREE.Vector3(-8, 0, -8));
    this.createCrate(new THREE.Vector3(28, 0, 0));
    this.createCrate(new THREE.Vector3(-28, 0, 0));
    this.createCrate(new THREE.Vector3(0, 0, 28));
    this.createCrate(new THREE.Vector3(0, 0, -28));
    
    // Downtown traffic
    this.createCar(new THREE.Vector3(12, 0, 0), 0);
    this.createCar(new THREE.Vector3(-12, 0, 0), Math.PI);
    this.createCar(new THREE.Vector3(0, 0, 12), Math.PI / 2);
    this.createCar(new THREE.Vector3(0, 0, -12), -Math.PI / 2);
    this.createCar(new THREE.Vector3(25, 0, 25), Math.PI / 4);
    this.createCar(new THREE.Vector3(-25, 0, 25), -Math.PI / 4);
    this.createCar(new THREE.Vector3(25, 0, -25), 3 * Math.PI / 4);
    this.createCar(new THREE.Vector3(-25, 0, -25), -3 * Math.PI / 4);
    
    // Modern street lights
    this.createStreetLight(new THREE.Vector3(15, 0, 15));
    this.createStreetLight(new THREE.Vector3(-15, 0, 15));
    this.createStreetLight(new THREE.Vector3(15, 0, -15));
    this.createStreetLight(new THREE.Vector3(-15, 0, -15));
    this.createStreetLight(new THREE.Vector3(30, 0, 30));
    this.createStreetLight(new THREE.Vector3(-30, 0, 30));
    this.createStreetLight(new THREE.Vector3(30, 0, -30));
    this.createStreetLight(new THREE.Vector3(-30, 0, -30));
  }

  buildLevel3() {
    // LEVEL 3: OLD CITY MAZE - Narrow alleys, irregular layout, dense chaos
    // COLOR SCHEME: Ancient/weathered (dark red brick, brown stone, aged colors)
    
    // Irregular cluster - North section (dark red brick)
    this.createBuilding(new THREE.Vector3(8, 0, 25), 8, 12, 12, 0x8B4513);
    this.createBuilding(new THREE.Vector3(-10, 0, 28), 10, 14, 8, 0x9B5523);
    this.createBuilding(new THREE.Vector3(22, 0, 30), 6, 10, 10, 0x7B3F13);
    this.createBuilding(new THREE.Vector3(-25, 0, 22), 12, 16, 6, 0xA0522D);
    this.createBuilding(new THREE.Vector3(5, 0, 42), 8, 11, 8, 0x8B4513);
    this.createBuilding(new THREE.Vector3(-18, 0, 45), 10, 13, 10, 0x9B5523);
    
    // Irregular cluster - South section (brown stone)
    this.createBuilding(new THREE.Vector3(12, 0, -22), 10, 15, 8, 0x6B4423);
    this.createBuilding(new THREE.Vector3(-8, 0, -28), 8, 12, 12, 0x7B5533);
    this.createBuilding(new THREE.Vector3(28, 0, -25), 6, 14, 10, 0x5B3413);
    this.createBuilding(new THREE.Vector3(-22, 0, -30), 12, 10, 8, 0x8B6533);
    this.createBuilding(new THREE.Vector3(8, 0, -45), 10, 16, 6, 0x6B4423);
    this.createBuilding(new THREE.Vector3(-15, 0, -42), 8, 13, 10, 0x7B5533);
    
    // Irregular cluster - East section (aged terracotta)
    this.createBuilding(new THREE.Vector3(35, 0, 8), 8, 14, 10, 0xB8734F);
    this.createBuilding(new THREE.Vector3(42, 0, -5), 10, 12, 8, 0xA8633F);
    this.createBuilding(new THREE.Vector3(38, 0, 20), 6, 16, 12, 0xC8835F);
    this.createBuilding(new THREE.Vector3(50, 0, 12), 12, 11, 8, 0xB8734F);
    this.createBuilding(new THREE.Vector3(45, 0, -18), 8, 15, 10, 0xA8633F);
    
    // Irregular cluster - West section (dark weathered stone)
    this.createBuilding(new THREE.Vector3(-35, 0, 5), 10, 13, 8, 0x5A4A3A);
    this.createBuilding(new THREE.Vector3(-42, 0, -8), 8, 14, 10, 0x6A5A4A);
    this.createBuilding(new THREE.Vector3(-38, 0, 18), 12, 12, 6, 0x4A3A2A);
    this.createBuilding(new THREE.Vector3(-48, 0, -15), 8, 16, 10, 0x7A6A5A);
    this.createBuilding(new THREE.Vector3(-45, 0, 25), 10, 11, 8, 0x5A4A3A);
    
    // Center chaos - Mixed heights (varied old colors)
    this.createBuilding(new THREE.Vector3(5, 0, 5), 6, 8, 8, 0x8B5A3C);
    this.createBuilding(new THREE.Vector3(-8, 0, 8), 8, 10, 6, 0x9B6A4C);
    this.createBuilding(new THREE.Vector3(12, 0, -5), 6, 12, 10, 0x7B4A2C);
    this.createBuilding(new THREE.Vector3(-5, 0, -10), 10, 9, 8, 0xAB7A5C);
    this.createBuilding(new THREE.Vector3(18, 0, 10), 8, 14, 6, 0x8B5A3C);
    this.createBuilding(new THREE.Vector3(-15, 0, -2), 6, 11, 8, 0x9B6A4C);
    
    // Maze walls - Create narrow passages
    this.createWall(new THREE.Vector3(15, 0, 15), 6, 3, 0.5);
    this.createWall(new THREE.Vector3(-15, 0, 15), 6, 3, 0.5);
    this.createWall(new THREE.Vector3(15, 0, -15), 6, 3, 0.5);
    this.createWall(new THREE.Vector3(-15, 0, -15), 6, 3, 0.5);
    this.createWall(new THREE.Vector3(25, 0, 0), 0.5, 3, 8);
    this.createWall(new THREE.Vector3(-25, 0, 0), 0.5, 3, 8);
    this.createWall(new THREE.Vector3(0, 0, 25), 8, 3, 0.5);
    this.createWall(new THREE.Vector3(0, 0, -25), 8, 3, 0.5);
    this.createWall(new THREE.Vector3(32, 0, 32), 10, 3, 0.5);
    this.createWall(new THREE.Vector3(-32, 0, 32), 10, 3, 0.5);
    this.createWall(new THREE.Vector3(32, 0, -32), 10, 3, 0.5);
    this.createWall(new THREE.Vector3(-32, 0, -32), 10, 3, 0.5);
    
    // Scattered obstacles everywhere
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const radius = 15 + Math.random() * 25;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      this.createCrate(new THREE.Vector3(x, 0, z));
    }
    
    // Abandoned vehicles blocking paths
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 10 + Math.random() * 30;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const rot = Math.random() * Math.PI * 2;
      this.createCar(new THREE.Vector3(x, 0, z), rot);
    }
    
    // Dim street lights in maze
    this.createStreetLight(new THREE.Vector3(20, 0, 20));
    this.createStreetLight(new THREE.Vector3(-20, 0, 20));
    this.createStreetLight(new THREE.Vector3(20, 0, -20));
    this.createStreetLight(new THREE.Vector3(-20, 0, -20));
    this.createStreetLight(new THREE.Vector3(35, 0, 0));
    this.createStreetLight(new THREE.Vector3(-35, 0, 0));
    this.createStreetLight(new THREE.Vector3(0, 0, 35));
    this.createStreetLight(new THREE.Vector3(0, 0, -35));
  }

  buildUrbanMap() {
    // Legacy method - now uses buildMapForLevel(1)
    this.buildMapForLevel(1);
  }

  createGround() {
    const groundSize = 200;
    const geometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x555555,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.mapObjects.push(ground); // Track for cleanup

    // Add ground collider
    this.physicsManager.addCollider(ground);

    // Add grid pattern
    const gridHelper = new THREE.GridHelper(groundSize, 50, 0x333333, 0x444444);
    this.scene.add(gridHelper);
    this.mapObjects.push(gridHelper); // Track for cleanup
  }

  createBuilding(position, width, height, depth, color = null) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    
    // Use provided color or default brown
    const buildingColor = color || 0x8B7355;
    
    const material = new THREE.MeshStandardMaterial({ 
      color: buildingColor,
      roughness: 0.8,
      metalness: 0.2
    });
    const building = new THREE.Mesh(geometry, material);
    building.position.copy(position);
    building.position.y = height / 2;
    building.castShadow = true;
    building.receiveShadow = true;
    this.scene.add(building);
    this.mapObjects.push(building); // Track for cleanup

    // Add windows
    this.addWindows(building, width, height, depth);

    // Add collider
    this.physicsManager.addCollider(building);

    return building;
  }

  addWindows(building, width, height, depth) {
    const windowMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a2e,
      emissive: 0x0a0a1e,
      metalness: 0.9,
      roughness: 0.1
    });

    const windowSize = 1.5;
    const windowSpacing = 3;
    const floors = Math.floor(height / windowSpacing);
    const windowsPerSide = Math.floor(width / windowSpacing);

    for (let floor = 1; floor < floors; floor++) {
      for (let i = 0; i < windowsPerSide; i++) {
        // Front windows
        const windowGeometry = new THREE.BoxGeometry(windowSize, windowSize, 0.1);
        const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
        window1.position.set(
          -width / 2 + windowSpacing * (i + 0.5),
          -height / 2 + floor * windowSpacing,
          depth / 2 + 0.05
        );
        building.add(window1);

        // Back windows
        const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
        window2.position.set(
          -width / 2 + windowSpacing * (i + 0.5),
          -height / 2 + floor * windowSpacing,
          -depth / 2 - 0.05
        );
        building.add(window2);
      }
    }
  }

  createWall(position, width, height, depth) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x8B8B8B,
      roughness: 0.9
    });
    const wall = new THREE.Mesh(geometry, material);
    wall.position.copy(position);
    wall.position.y = height / 2;
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.scene.add(wall);
    this.mapObjects.push(wall); // Track for cleanup

    this.physicsManager.addCollider(wall);
    return wall;
  }

  createCar(position, rotation) {
    const group = new THREE.Group();

    // Car body
    const bodyGeometry = new THREE.BoxGeometry(2, 1.2, 4);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: Math.random() > 0.5 ? 0x1a1a1a : 0x8B0000,
      metalness: 0.8,
      roughness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8;
    body.castShadow = true;
    group.add(body);

    // Car roof
    const roofGeometry = new THREE.BoxGeometry(1.8, 0.8, 2);
    const roof = new THREE.Mesh(roofGeometry, bodyMaterial);
    roof.position.y = 1.6;
    roof.position.z = -0.3;
    roof.castShadow = true;
    group.add(roof);

    // Windows
    const windowMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a2e,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.6
    });
    const windowGeometry = new THREE.BoxGeometry(1.7, 0.7, 1.9);
    const windows = new THREE.Mesh(windowGeometry, windowMaterial);
    windows.position.y = 1.6;
    windows.position.z = -0.3;
    group.add(windows);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.3, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a,
      roughness: 0.9
    });
    
    const wheelPositions = [
      [-0.9, 0.3, 1.3],
      [0.9, 0.3, 1.3],
      [-0.9, 0.3, -1.3],
      [0.9, 0.3, -1.3]
    ];

    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(...pos);
      wheel.castShadow = true;
      group.add(wheel);
    });

    group.position.copy(position);
    group.rotation.y = rotation;
    this.scene.add(group);
    this.mapObjects.push(group); // Track for cleanup

    // Add collider for the entire car group (not just body)
    group.updateMatrixWorld(true); // Update world matrix first
    this.physicsManager.addCollider(group);

    return group;
  }

  createCrate(position) {
    const size = 1.5;
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x8B6914,
      roughness: 0.9,
      metalness: 0.1
    });
    const crate = new THREE.Mesh(geometry, material);
    crate.position.copy(position);
    crate.position.y = size / 2;
    crate.castShadow = true;
    crate.receiveShadow = true;
    this.scene.add(crate);
    this.mapObjects.push(crate); // Track for cleanup

    // Add wood texture detail
    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x5a4a0a });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    crate.add(edges);

    this.physicsManager.addCollider(crate);
    return crate;
  }

  createStreetLight(position) {
    const group = new THREE.Group();

    // Pole
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 6, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.3
    });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 3;
    pole.castShadow = true;
    group.add(pole);

    // Light fixture
    const lightGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const lightMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffff99,
      emissive: 0xffff99,
      emissiveIntensity: 0.5
    });
    const lightFixture = new THREE.Mesh(lightGeometry, lightMaterial);
    lightFixture.position.y = 6;
    group.add(lightFixture);

    // Point light
    const pointLight = new THREE.PointLight(0xffff99, 0.5, 20);
    pointLight.position.y = 6;
    pointLight.castShadow = true;
    group.add(pointLight);

    group.position.copy(position);
    this.scene.add(group);
    this.mapObjects.push(group); // Track for cleanup

    this.physicsManager.addCollider(pole);

    return group;
  }
}
