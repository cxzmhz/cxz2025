// 添加 loadFBX 方法
  // atten 目前的fbx模型无法在threejs中使用，不支持所有动作的合并
  loadFBX = (path: string, name: string): Promise<THREE.Group> => {
    name = name || path.split('/').slice(-1)[0];
    return new Promise((resolve, reject) => {
      this.mManager?.register(path);
      
      if (!this.fbxLoader) {
        debug.error('FBX loader not initialized');
        reject(new Error('FBX loader not initialized'));
        return;
      }
      
      const perfMonitor = PerformanceMonitor.getInstance();
      perfMonitor.startMeasure('调用threejs的api解析并加载fbx模型数据耗时');
      
      this.fbxLoader.load(
        path,
        (object) => {
          perfMonitor.endMeasure('调用threejs的api解析并加载fbx模型数据耗时');
          
          // 处理材质
          object.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              
              // 确保阴影
              if (this.configuration.shadow) {
                mesh.castShadow = true;
                mesh.receiveShadow = true;
              }
              
              // 如果有材质
              if (mesh.material) {
                // 处理材质属性
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach(mat => {
                    mat.needsUpdate = true;
                  });
                } else {
                  mesh.material.needsUpdate = true;
                }
              }
            }
          });
          
          // 添加日志
          debug.log(`FBX模型 "${name}" 加载成功`);
          
          // 创建一个包装对象，使其结构与GLTF相似，便于与现有代码兼容
          const fbxWrapper = {
            scene: object,
            animations: object.animations || []
          };
          
          resolve(fbxWrapper as any);
          this.mManager?.setSuccess();
        },
        (progress) => {
          this.mManager?.set(path, progress.loaded, progress.total);
          this.emit(['progress', name], progress.loaded, progress.total);
        },
        (error) => {
          debug.error(`加载FBX模型失败: ${error}`);
          reject(error);
          this.mManager?.setFailed();
        }
      );
    });
  };