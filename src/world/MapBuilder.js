import * as THREE from 'three';

export class MapBuilder {
  constructor(scene, physicsManager) {
    this.scene = scene;
    this.physicsManager = physicsManager;
  }

  buildUrbanMap() {
    // Ground
    this.createGround();

    // EXTENDED CITY - More buildings in all directions
    // Central area buildings
    this.createBuilding(new THREE.Vector3(20, 0, 20), 15, 12, 10);
    this.createBuilding(new THREE.Vector3(-25, 0, 25), 12, 15, 12);
    this.createBuilding(new THREE.Vector3(30, 0, -20), 10, 10, 8);
    this.createBuilding(new THREE.Vector3(-20, 0, -25), 18, 8, 15);
    this.createBuilding(new THREE.Vector3(40, 0, 10), 12, 18, 12);
    this.createBuilding(new THREE.Vector3(-35, 0, -10), 14, 10, 14);
    this.createBuilding(new THREE.Vector3(10, 0, -35), 16, 14, 10);
    this.createBuilding(new THREE.Vector3(-15, 0, 40), 10, 12, 16);

    // Extended north area
    this.createBuilding(new THREE.Vector3(50, 0, 45), 14, 16, 12);
    this.createBuilding(new THREE.Vector3(-40, 0, 50), 16, 14, 14);
    this.createBuilding(new THREE.Vector3(0, 0, 55), 12, 20, 10);
    this.createBuilding(new THREE.Vector3(25, 0, 60), 10, 12, 8);
    this.createBuilding(new THREE.Vector3(-25, 0, 65), 18, 10, 12);

    // Extended south area
    this.createBuilding(new THREE.Vector3(45, 0, -50), 12, 14, 10);
    this.createBuilding(new THREE.Vector3(-35, 0, -55), 14, 18, 12);
    this.createBuilding(new THREE.Vector3(0, 0, -60), 16, 12, 14);
    this.createBuilding(new THREE.Vector3(20, 0, -65), 10, 16, 8);
    this.createBuilding(new THREE.Vector3(-50, 0, -45), 12, 10, 16);

    // Extended east area
    this.createBuilding(new THREE.Vector3(60, 0, 20), 14, 15, 12);
    this.createBuilding(new THREE.Vector3(65, 0, -15), 10, 12, 10);
    this.createBuilding(new THREE.Vector3(55, 0, 0), 16, 18, 14);
    this.createBuilding(new THREE.Vector3(70, 0, 35), 12, 14, 8);

    // Extended west area
    this.createBuilding(new THREE.Vector3(-60, 0, 15), 14, 16, 12);
    this.createBuilding(new THREE.Vector3(-65, 0, -20), 12, 12, 10);
    this.createBuilding(new THREE.Vector3(-55, 0, 35), 16, 14, 14);
    this.createBuilding(new THREE.Vector3(-70, 0, 0), 10, 18, 12);

    // Smaller buildings for variety
    this.createBuilding(new THREE.Vector3(35, 0, 35), 8, 8, 8);
    this.createBuilding(new THREE.Vector3(-30, 0, -35), 8, 10, 8);
    this.createBuilding(new THREE.Vector3(50, 0, -30), 8, 12, 8);
    this.createBuilding(new THREE.Vector3(-45, 0, 30), 8, 9, 8);

    // Walls and barriers - create more cover throughout city
    this.createWall(new THREE.Vector3(0, 0, 15), 20, 3, 0.5);
    this.createWall(new THREE.Vector3(10, 0, 0), 0.5, 3, 15);
    this.createWall(new THREE.Vector3(-15, 0, -10), 10, 3, 0.5);
    this.createWall(new THREE.Vector3(25, 0, 5), 15, 3, 0.5);
    this.createWall(new THREE.Vector3(-5, 0, -20), 12, 3, 0.5);
    this.createWall(new THREE.Vector3(-30, 0, 10), 0.5, 3, 20);
    this.createWall(new THREE.Vector3(40, 0, 30), 18, 3, 0.5);
    this.createWall(new THREE.Vector3(-40, 0, -30), 15, 3, 0.5);
    this.createWall(new THREE.Vector3(30, 0, -40), 0.5, 3, 25);
    this.createWall(new THREE.Vector3(-35, 0, 40), 0.5, 3, 20);

    // Cars for cover - spread throughout city
    this.createCar(new THREE.Vector3(5, 0, 10), 0);
    this.createCar(new THREE.Vector3(-10, 0, 5), Math.PI / 4);
    this.createCar(new THREE.Vector3(15, 0, -15), Math.PI / 2);
    this.createCar(new THREE.Vector3(-20, 0, -5), Math.PI / 6);
    this.createCar(new THREE.Vector3(25, 0, 15), -Math.PI / 3);
    this.createCar(new THREE.Vector3(-8, 0, -18), Math.PI / 2);
    this.createCar(new THREE.Vector3(35, 0, 25), Math.PI / 6);
    this.createCar(new THREE.Vector3(-30, 0, 30), -Math.PI / 4);
    this.createCar(new THREE.Vector3(40, 0, -25), Math.PI / 3);
    this.createCar(new THREE.Vector3(-35, 0, -30), 0);
    this.createCar(new THREE.Vector3(50, 0, 10), Math.PI / 2);
    this.createCar(new THREE.Vector3(-45, 0, 20), -Math.PI / 6);

    // Crates and obstacles - more tactical cover
    this.createCrate(new THREE.Vector3(-5, 0, -5));
    this.createCrate(new THREE.Vector3(8, 0, -8));
    this.createCrate(new THREE.Vector3(-12, 0, 12));
    this.createCrate(new THREE.Vector3(18, 0, 8));
    this.createCrate(new THREE.Vector3(-18, 0, -12));
    this.createCrate(new THREE.Vector3(12, 0, 20));
    this.createCrate(new THREE.Vector3(-25, 0, 5));
    this.createCrate(new THREE.Vector3(30, 0, 28));
    this.createCrate(new THREE.Vector3(-28, 0, -25));
    this.createCrate(new THREE.Vector3(38, 0, -18));
    this.createCrate(new THREE.Vector3(-32, 0, 35));
    this.createCrate(new THREE.Vector3(42, 0, 5));
    this.createCrate(new THREE.Vector3(-40, 0, -15));
    
    // Crate stacks for variety
    this.createCrate(new THREE.Vector3(18, 1.5, 8));
    this.createCrate(new THREE.Vector3(-18, 1.5, -12));
    this.createCrate(new THREE.Vector3(30, 1.5, 28));
    this.createCrate(new THREE.Vector3(-32, 1.5, 35));

    // Street lights - better coverage
    this.createStreetLight(new THREE.Vector3(10, 0, 10));
    this.createStreetLight(new THREE.Vector3(-15, 0, -15));
    this.createStreetLight(new THREE.Vector3(20, 0, -10));
    this.createStreetLight(new THREE.Vector3(-20, 0, 15));
    this.createStreetLight(new THREE.Vector3(0, 0, 25));
    this.createStreetLight(new THREE.Vector3(0, 0, -25));
    this.createStreetLight(new THREE.Vector3(35, 0, 35));
    this.createStreetLight(new THREE.Vector3(-35, 0, 35));
    this.createStreetLight(new THREE.Vector3(35, 0, -35));
    this.createStreetLight(new THREE.Vector3(-35, 0, -35));
    this.createStreetLight(new THREE.Vector3(50, 0, 0));
    this.createStreetLight(new THREE.Vector3(-50, 0, 0));
    this.createStreetLight(new THREE.Vector3(0, 0, 50));
    this.createStreetLight(new THREE.Vector3(0, 0, -50));
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

    // Add ground collider
    this.physicsManager.addCollider(ground);

    // Add grid pattern
    const gridHelper = new THREE.GridHelper(groundSize, 50, 0x333333, 0x444444);
    this.scene.add(gridHelper);
  }

  createBuilding(position, width, height, depth) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x8B7355,
      roughness: 0.8,
      metalness: 0.2
    });
    const building = new THREE.Mesh(geometry, material);
    building.position.copy(position);
    building.position.y = height / 2;
    building.castShadow = true;
    building.receiveShadow = true;
    this.scene.add(building);

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

    // Add collider for body
    this.physicsManager.addCollider(body);

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

    this.physicsManager.addCollider(pole);

    return group;
  }
}
