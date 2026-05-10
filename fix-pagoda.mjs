const fs = require('fs');
const path = 'D:\\myweb\\jhfyjxpt\\src\\components\\QPagoda.tsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Add localMouse + dragPlane + dragWorldPos
c = c.replace(
  'const raycaster = new THREE.Raycaster()',
  'const raycaster = new THREE.Raycaster()\n    const dragPlane = new THREE.Plane()\n    const dragWorldPos = new THREE.Vector3()\n    const localMouse = new THREE.Vector3()'
);

// 2. Remove old planeZ line
c = c.replace(
  'const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)\n    ',
  ''
);

// 3. Fix updateMouse3D
c = c.replace(
  'updateMouse3D = () => {\n      raycaster.setFromCamera(mouse, camera)\n      raycaster.ray.intersectPlane(planeZ, mouse3D)\n      // Convert to pagoda local space for correct drag positioning\n      pagodaGroup.worldToLocal(mouse3D)\n    }',
  'updateMouse3D = () => {\n      raycaster.setFromCamera(mouse, camera)\n      raycaster.ray.intersectPlane(dragPlane, mouse3D)\n    }'
);

// 4. Fix onDown piece handler
c = c.replace(
  'if (piece) {\n        updateMouse3D()\n        drag.piece = piece\n        drag.offset.copy(mouse3D).sub(piece.position)\n        drag.active = true',
  'if (piece) {\n        piece.getWorldPosition(dragWorldPos)\n        const camDir = new THREE.Vector3()\n        camera.getWorldDirection(camDir)\n        dragPlane.setFromNormalAndCoplanarPoint(camDir.negate(), dragWorldPos)\n        updateMouse3D()\n        pagodaGroup.worldToLocal(localMouse.copy(mouse3D))\n        drag.offset.copy(localMouse).sub(piece.position)\n        drag.piece = piece\n        drag.active = true'
);

// 5. Fix onMove
c = c.replace(
  'drag.piece.position.copy(mouse3D).sub(drag.offset)',
  'pagodaGroup.worldToLocal(localMouse.copy(mouse3D))\n        drag.piece.position.copy(localMouse).sub(drag.offset)'
);

fs.writeFileSync(path, c, 'utf8');
console.log('Done');
console.log('planeZ remaining:', (c.match(/planeZ/g)||[]).length);
console.log('dragPlane:', (c.match(/dragPlane/g)||[]).length);
console.log('localMouse:', (c.match(/localMouse/g)||[]).length);
