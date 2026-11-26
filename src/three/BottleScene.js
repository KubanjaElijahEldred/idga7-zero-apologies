// ---------------------------------------------------------------------------
// IDGA7 — procedural cinematic bottle scene (vanilla Three.js).
// No model downloads: the bottle, cap, label, wolf emblem and smoke are all
// generated at runtime. Lazy-loaded so it never blocks first paint.
// ---------------------------------------------------------------------------

let THREE = null
const loadThree = async () => {
  if (THREE) return true
  THREE = await import('three')
  return true
}

const makeLabelTexture = (variant) => {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = variant === 'pink' ? '#16060d' : '#07080a'
  ctx.fillRect(0, 0, 512, 256)

  ctx.strokeStyle = variant === 'pink' ? '#ff4f9a' : '#d9dee6'
  ctx.lineWidth = 3
  ctx.strokeRect(14, 14, 484, 228)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 92px Cinzel, Georgia, serif'
  ctx.fillText('IDGA7', 256, 125)
  ctx.fillStyle = variant === 'pink' ? '#ff6fae' : '#c9d0da'
  ctx.font = '500 22px Inter, Arial, sans-serif'
  ctx.letterSpacing = '10px'
  ctx.fillText('ZERO APOLOGIES', 256, 170)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

const makeSmokeTexture = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(64, 64, 2, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(255,255,255,0.28)')
  gradient.addColorStop(0.45, 'rgba(255,255,255,0.09)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

const bottleProfile = () => {
  // x = radius, y = height. Smooth shoulders, long neck, premium proportions.
  return [
    [0.00, -1.30], [0.42, -1.30], [0.46, -1.24], [0.46, -0.86],
    [0.44, -0.74], [0.40, -0.55], [0.28, -0.30], [0.20, -0.10],
    [0.16, 0.18], [0.16, 0.98], [0.19, 1.02], [0.19, 1.12], [0.00, 1.12],
  ].map(([x, y]) => new THREE.Vector2(x, y))
}

export const initBottleScene = async (host, { variant = 'original', hero = false } = {}) => {
  if (!host || typeof window === 'undefined') return () => {}
  try {
    await loadThree()
  } catch {
    host.classList.add('idga7-3d-unavailable')
    return () => {}
  }

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false
  const isPink = variant === 'pink'

  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
  } catch {
    host.classList.add('idga7-3d-unavailable')
    return () => {}
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0x000000, 0)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  renderer.domElement.className = 'idga7-canvas'
  renderer.domElement.setAttribute('aria-hidden', 'true')
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
  camera.position.set(0, 0.1, hero ? 5.6 : 5.2)
  camera.lookAt(0, 0, 0)

  // Cinematic lighting — cold chrome for Original, hot pink for Pink Lemonade.
  scene.add(new THREE.HemisphereLight(0xffffff, 0x101018, 0.75))
  const key = new THREE.DirectionalLight(0xffffff, 3.2)
  key.position.set(2.6, 4, 4)
  key.castShadow = true
  key.shadow.mapSize.set(512, 512)
  key.shadow.camera.left = -3
  key.shadow.camera.right = 3
  key.shadow.camera.top = 3
  key.shadow.camera.bottom = -3
  scene.add(key)
  const rim = new THREE.DirectionalLight(isPink ? 0xff3d8b : 0xcfe4ff, 2.4)
  rim.position.set(-3.5, 1.5, -3)
  scene.add(rim)
  const fill = new THREE.PointLight(isPink ? 0xff6fae : 0x9fb6d4, 1.6, 12)
  fill.position.set(2.5, -1, 2.5)
  scene.add(fill)

  const bottleGroup = new THREE.Group()
  scene.add(bottleGroup)

  const glassMaterial = isPink
    ? new THREE.MeshPhysicalMaterial({
      color: 0xff4f9a, metalness: 0.35, roughness: 0.18,
      clearcoat: 1, clearcoatRoughness: 0.08, transmission: 0.08, transparent: true, opacity: 0.96,
    })
    : new THREE.MeshPhysicalMaterial({
      color: 0xdfe5ee, metalness: 0.92, roughness: 0.14,
      clearcoat: 1, clearcoatRoughness: 0.06,
    })

  const bottle = new THREE.Mesh(new THREE.LatheGeometry(bottleProfile(), 64), glassMaterial)
  bottle.castShadow = true
  bottleGroup.add(bottle)

  // Label band sits on the body of the bottle.
  const labelTexture = makeLabelTexture(variant)
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.468, 0.468, 0.66, 64, 1, true),
    new THREE.MeshStandardMaterial({ map: labelTexture, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide }),
  )
  label.position.y = -0.52
  bottleGroup.add(label)

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.28, 40),
    new THREE.MeshPhysicalMaterial({ color: isPink ? 0x1a0a11 : 0x111418, metalness: 0.85, roughness: 0.22, clearcoat: 1 }),
  )
  cap.position.y = 1.22
  bottleGroup.add(cap)

  const neckRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.185, 0.018, 10, 40),
    new THREE.MeshStandardMaterial({ color: isPink ? 0xff8fc0 : 0xf0f4fa, metalness: 0.95, roughness: 0.18 }),
  )
  neckRing.rotation.x = Math.PI / 2
  neckRing.position.y = 0.96
  bottleGroup.add(neckRing)

  // Wolf emblem emerging through shadow behind the bottle.
  const textureLoader = new THREE.TextureLoader()
  const emblemTexture = textureLoader.load('/assets/emblem.png')
  emblemTexture.colorSpace = THREE.SRGBColorSpace
  const emblem = new THREE.Mesh(
    new THREE.PlaneGeometry(2.9, 2.9),
    new THREE.MeshBasicMaterial({ map: emblemTexture, transparent: true, opacity: 0.32, depthWrite: false }),
  )
  emblem.position.set(0, 0.35, -2.2)
  scene.add(emblem)

  // Smoke / atmosphere particles.
  const smokeTexture = makeSmokeTexture()
  const smokeCount = hero ? 90 : 45
  const smokePositions = new Float32Array(smokeCount * 3)
  for (let i = 0; i < smokeCount; i += 1) {
    smokePositions[i * 3] = (Math.random() - 0.5) * 5
    smokePositions[i * 3 + 1] = (Math.random() - 0.5) * 3.5
    smokePositions[i * 3 + 2] = (Math.random() - 0.5) * 2.5 - 1
  }
  const smokeGeometry = new THREE.BufferGeometry()
  smokeGeometry.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3))
  const smoke = new THREE.Points(
    smokeGeometry,
    new THREE.PointsMaterial({
      map: smokeTexture, transparent: true, opacity: isPink ? 0.16 : 0.12,
      depthWrite: false, blending: THREE.AdditiveBlending, size: 0.85, sizeAttenuation: true,
      color: isPink ? 0xff9ac6 : 0xa9c4e6,
    }),
  )
  scene.add(smoke)

  // Ground reflection strip keeps the bottle grounded without a heavy floor.
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(1.25, 48),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -1.31
  ground.scale.set(1, 0.35, 1)
  scene.add(ground)

  const resize = () => {
    const width = host.clientWidth || 600
    const height = host.clientHeight || 600
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  resize()
  const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
  observer?.observe(host)
  window.addEventListener('resize', resize)

  // Drag to rotate, wheel to zoom.
  const state = { dragging: false, lastX: 0, rotation: 0, targetRotation: 0, zoom: camera.position.z }
  const onPointerDown = (event) => {
    state.dragging = true
    state.lastX = event.clientX
    host.setPointerCapture?.(event.pointerId)
  }
  const onPointerMove = (event) => {
    if (!state.dragging) return
    state.targetRotation += (event.clientX - state.lastX) * 0.012
    state.lastX = event.clientX
  }
  const onPointerUp = () => { state.dragging = false }
  const onWheel = (event) => {
    event.preventDefault()
    state.zoom = Math.max(3.6, Math.min(7.2, state.zoom + event.deltaY * 0.004))
  }
  host.addEventListener('pointerdown', onPointerDown)
  host.addEventListener('pointermove', onPointerMove)
  host.addEventListener('pointerup', onPointerUp)
  host.addEventListener('pointercancel', onPointerUp)
  host.addEventListener('wheel', onWheel, { passive: false })

  const clock = new THREE.Clock()
  let frameId = 0
  let disposed = false
  const animate = () => {
    if (disposed) return
    const t = clock.getElapsedTime()
    if (!state.dragging && !reducedMotion) state.targetRotation += 0.0035
    state.rotation += (state.targetRotation - state.rotation) * 0.08
    bottleGroup.rotation.y = state.rotation
    bottleGroup.position.y = reducedMotion ? 0 : Math.sin(t * 0.7) * 0.035
    camera.position.z += (state.zoom - camera.position.z) * 0.08
    emblem.material.opacity = (reducedMotion ? 0.32 : 0.26 + Math.sin(t * 0.5) * 0.06)
    if (!reducedMotion) {
      const positions = smoke.geometry.attributes.position.array
      for (let i = 0; i < smokeCount; i += 1) {
        positions[i * 3 + 1] += 0.0016 + (i % 5) * 0.0003
        if (positions[i * 3 + 1] > 2) positions[i * 3 + 1] = -2
      }
      smoke.geometry.attributes.position.needsUpdate = true
    }
    renderer.render(scene, camera)
    frameId = window.requestAnimationFrame(animate)
  }
  animate()

  return () => {
    disposed = true
    window.cancelAnimationFrame(frameId)
    observer?.disconnect()
    window.removeEventListener('resize', resize)
    host.removeEventListener('pointerdown', onPointerDown)
    host.removeEventListener('pointermove', onPointerMove)
    host.removeEventListener('pointerup', onPointerUp)
    host.removeEventListener('pointercancel', onPointerUp)
    host.removeEventListener('wheel', onWheel)
    scene.traverse((object) => {
      object.geometry?.dispose?.()
      if (Array.isArray(object.material)) object.material.forEach((m) => m.dispose?.())
      else object.material?.dispose?.()
    })
    labelTexture.dispose()
    smokeTexture.dispose()
    emblemTexture.dispose()
    renderer.dispose()
    renderer.domElement.remove()
  }
}
