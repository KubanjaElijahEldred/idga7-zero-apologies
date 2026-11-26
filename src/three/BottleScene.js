// ---------------------------------------------------------------------------
// IDGA7 — image-driven cinematic 3D scene.
// The 3D object is built from the supplied bottle photography itself: the
// image is mapped onto a gently curved, subdivided surface with brightness
// relief, layered over a parallax backdrop with smoke and a neon ring.
// ---------------------------------------------------------------------------

let THREE = null
const loadThree = async () => {
  if (THREE) return true
  THREE = await import('three')
  return true
}

const makeSmokeTexture = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(64, 64, 2, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(255,255,255,0.3)')
  gradient.addColorStop(0.45, 'rgba(255,255,255,0.09)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

// Bow a flat plane towards the camera so a flat photograph gains real depth.
const bowGeometry = (width, height, segments = 48, bow = 0.42) => {
  const geometry = new THREE.PlaneGeometry(width, height, segments, segments)
  const positions = geometry.attributes.position
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i)
    const y = positions.getY(i)
    const nx = x / (width / 2)
    const ny = y / (height / 2)
    const z = bow * (1 - nx * nx) * (1 - ny * ny * 0.35)
    positions.setZ(i, z)
  }
  positions.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
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
  const bottleImage = isPink ? '/assets/bottle-pink.jpg' : '/assets/bottle-original.jpg'
  const backdropImage = isPink ? '/assets/hero.jpg' : '/assets/story.jpg'
  const accent = isPink ? 0xff4f9a : 0xd9dee6

  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
  } catch {
    host.classList.add('idga7-3d-unavailable')
    return () => {}
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.domElement.className = 'idga7-canvas'
  renderer.domElement.setAttribute('aria-hidden', 'true')
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
  camera.position.set(0, 0, hero ? 5.4 : 5.0)
  camera.lookAt(0, 0, 0)

  scene.add(new THREE.HemisphereLight(0xffffff, 0x08080c, 1.4))
  const key = new THREE.DirectionalLight(0xffffff, 2.4)
  key.position.set(2.5, 4, 5)
  scene.add(key)
  const rim = new THREE.DirectionalLight(accent, 2.0)
  rim.position.set(-3, 1.5, -2)
  scene.add(rim)
  const glowLight = new THREE.PointLight(accent, 1.6, 12)
  glowLight.position.set(0, -1.4, 1.6)
  scene.add(glowLight)

  const loader = new THREE.TextureLoader()
  const bottleTexture = loader.load(bottleImage)
  bottleTexture.colorSpace = THREE.SRGBColorSpace
  bottleTexture.anisotropy = renderer.capabilities.getMaxAnisotropy?.() || 1
  const backdropTexture = loader.load(backdropImage)
  backdropTexture.colorSpace = THREE.SRGBColorSpace

  const world = new THREE.Group()
  scene.add(world)

  // Parallax backdrop from the supplied lifestyle imagery.
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 7),
    new THREE.MeshBasicMaterial({ map: backdropTexture, transparent: true, opacity: 0.22, depthWrite: false }),
  )
  backdrop.position.set(0, 0, -3.2)
  scene.add(backdrop)

  // The bottle photograph itself becomes the 3D surface. Using the same map
  // as a displacement map lifts the bright bottle/smoke out of the black.
  const surface = new THREE.Mesh(
    bowGeometry(hero ? 3.7 : 3.4, hero ? 3.7 : 3.4),
    new THREE.MeshStandardMaterial({
      map: bottleTexture,
      displacementMap: bottleTexture,
      displacementScale: 0.1,
      displacementBias: -0.045,
      roughness: 0.82,
      metalness: 0.06,
      side: THREE.DoubleSide,
      transparent: true,
    }),
  )
  world.add(surface)

  // A soft duplicate behind the surface adds parallax depth on rotation.
  const echo = new THREE.Mesh(
    bowGeometry(3.8, 3.8, 32, 0.3),
    new THREE.MeshBasicMaterial({ map: bottleTexture, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide }),
  )
  echo.position.z = -0.45
  world.add(echo)

  // Neon ring from the photography, rebuilt as emissive geometry.
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.18, 0.018, 10, 72),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.85 }),
  )
  ring.rotation.x = Math.PI / 2
  ring.position.y = -1.55
  world.add(ring)

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(1.18, 0.12, 10, 72),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.12, depthWrite: false }),
  )
  halo.rotation.x = Math.PI / 2
  halo.position.y = -1.55
  world.add(halo)

  // Smoke particles drifting over the image.
  const smokeTexture = makeSmokeTexture()
  const smokeCount = hero ? 90 : 45
  const smokePositions = new Float32Array(smokeCount * 3)
  for (let i = 0; i < smokeCount; i += 1) {
    smokePositions[i * 3] = (Math.random() - 0.5) * 5
    smokePositions[i * 3 + 1] = (Math.random() - 0.5) * 4
    smokePositions[i * 3 + 2] = (Math.random() - 0.5) * 1.5
  }
  const smokeGeometry = new THREE.BufferGeometry()
  smokeGeometry.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3))
  const smoke = new THREE.Points(
    smokeGeometry,
    new THREE.PointsMaterial({
      map: smokeTexture, transparent: true, opacity: isPink ? 0.18 : 0.14,
      depthWrite: false, blending: THREE.AdditiveBlending, size: 0.9,
      sizeAttenuation: true, color: isPink ? 0xff9ac6 : 0xbcd0e8,
    }),
  )
  scene.add(smoke)

  const resize = () => {
    const width = host.clientWidth || 700
    const height = host.clientHeight || 700
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  resize()
  const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
  observer?.observe(host)
  window.addEventListener('resize', resize)

  // Drag rotates the image-based 3D card; wheel zooms.
  const state = { dragging: false, lastX: 0, lastY: 0, rotY: 0, targetY: 0, rotX: 0, targetX: 0, zoom: camera.position.z }
  const onDown = (event) => {
    state.dragging = true
    state.lastX = event.clientX
    state.lastY = event.clientY
    host.setPointerCapture?.(event.pointerId)
  }
  const onMove = (event) => {
    if (!state.dragging) return
    state.targetY = THREE.MathUtils.clamp(state.targetY + (event.clientX - state.lastX) * 0.005, -0.75, 0.75)
    state.targetX = THREE.MathUtils.clamp(state.targetX + (event.clientY - state.lastY) * 0.003, -0.35, 0.35)
    state.lastX = event.clientX
    state.lastY = event.clientY
  }
  const onUp = () => { state.dragging = false }
  const onWheel = (event) => {
    event.preventDefault()
    state.zoom = Math.max(3.8, Math.min(7.5, state.zoom + event.deltaY * 0.004))
  }
  host.addEventListener('pointerdown', onDown)
  host.addEventListener('pointermove', onMove)
  host.addEventListener('pointerup', onUp)
  host.addEventListener('pointercancel', onUp)
  host.addEventListener('wheel', onWheel, { passive: false })

  const clock = new THREE.Clock()
  let frameId = 0
  let disposed = false
  const animate = () => {
    if (disposed) return
    const t = clock.getElapsedTime()
    const sway = reducedMotion ? 0 : Math.sin(t * 0.45) * 0.07
    state.rotY += (state.targetY + sway - state.rotY) * 0.06
    state.rotX += (state.targetX - state.rotX) * 0.06
    world.rotation.y = state.rotY
    world.rotation.x = state.rotX
    world.position.y = reducedMotion ? 0 : Math.sin(t * 0.7) * 0.04
    echo.position.x = Math.sin(t * 0.35) * 0.08
    backdrop.position.x = Math.sin(t * 0.2) * 0.2
    ring.material.opacity = 0.7 + Math.sin(t * 1.6) * 0.15
    camera.position.z += (state.zoom - camera.position.z) * 0.08
    if (!reducedMotion) {
      const positions = smoke.geometry.attributes.position.array
      for (let i = 0; i < smokeCount; i += 1) {
        positions[i * 3 + 1] += 0.002 + (i % 5) * 0.0004
        if (positions[i * 3 + 1] > 2.2) positions[i * 3 + 1] = -2.2
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
    host.removeEventListener('pointerdown', onDown)
    host.removeEventListener('pointermove', onMove)
    host.removeEventListener('pointerup', onUp)
    host.removeEventListener('pointercancel', onUp)
    host.removeEventListener('wheel', onWheel)
    scene.traverse((object) => {
      object.geometry?.dispose?.()
      if (Array.isArray(object.material)) object.material.forEach((m) => m.dispose?.())
      else object.material?.dispose?.()
    })
    bottleTexture.dispose()
    backdropTexture.dispose()
    smokeTexture.dispose()
    renderer.dispose()
    renderer.domElement.remove()
  }
}
