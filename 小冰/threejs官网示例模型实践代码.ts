renderTmp = ()=>{
  this.rendererTmp.render(this.sceneTmp, this.cameraTmp);
}

loadGLTFTmp = ()=>{
  const container = document.createElement('div');
  document.body.appendChild(container);

  this.cameraTmp = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
  this.cameraTmp.position.set(- 1.8, 0.6, 2.7);

  this.sceneTmp = new THREE.Scene();
  this.hdrLoader.load('/royal_esplanade_1k.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    this.sceneTmp.background = texture;
    this.sceneTmp.environment = texture;
    this.renderTmp();
    this.gltfLoader.load('/glTF/DamagedHelmet.gltf', async (gltf) => {

        const model = gltf.scene;

        // wait until the model can be added to the scene without blocking due to shader compilation

        await this.rendererTmp.compileAsync(model, this.cameraTmp, this.sceneTmp);

        this.sceneTmp.add(model);

        this.renderTmp();

    });

  })
  this.rendererTmp = new THREE.WebGLRenderer({ antialias: true });
  this.rendererTmp.setPixelRatio(window.devicePixelRatio);
  this.rendererTmp.setSize(window.innerWidth, window.innerHeight);
  this.rendererTmp.toneMapping = THREE.ACESFilmicToneMapping;
  this.rendererTmp.toneMappingExposure = 1;
  container.appendChild(this.rendererTmp.domElement);

  const controls = new OrbitControls(this.cameraTmp, this.rendererTmp.domElement);
  controls.addEventListener('change', this.renderTmp); // use if there is no animation loop
  controls.minDistance = 2;
  controls.maxDistance = 10;
  controls.target.set(0, 0, - 0.2);
  controls.update();
  window.addEventListener('resize', ()=>{
    this.cameraTmp.aspect = window.innerWidth / window.innerHeight;
    this.cameraTmp.updateProjectionMatrix();

    this.rendererTmp.setSize(window.innerWidth, window.innerHeight);

    this.renderTmp();
  });
};