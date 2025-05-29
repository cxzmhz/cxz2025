
class RequestEventEmitter {
  private event: Record<string, Array<[(params: unknown) => void, (params: unknown) => void]>>;
  private pendingQueue: Set<string>;
  constructor() {
    this.event = {};
    this.pendingQueue = new Set();
  }

  deletePendKey(key: string){
    this.pendingQueue.delete(key);
  }

  addPendKey(key: string){
    this.pendingQueue.add(key);
  }

  hasPendKey(key: string){
    return this.pendingQueue.has(key);
  }

  deleteEventData(key: string) {
    delete this.event[key];
  }

  // 订阅接口请求响应结果，并暂存promise的resolve和reject
  on(type: string, resolveFn: (params: unknown) => void, rejectFn: (params: unknown) => void) {
    if (!this.event[type]) {
      this.event[type] = [[resolveFn, rejectFn]];
    } else {
      this.event[type].push([resolveFn, rejectFn]);
    }
  }

  // 触发响应结果，并根据响应结果调用对应promise处理方法
  emit(type: string, res: AxiosResponse<unknown>, ansType: 'resolve' | 'reject') {
    this.event[type]?.forEach?.(([resolveFn, rejectFn]) => {
      if (ansType === 'resolve') {
        // 每个接口成功响应的时候都要调用handleResponseLoginAuth方法
        resolveFn(res);
      } else {
        rejectFn(res);
      }
    });
  }
}

// 根据请求生成对应的key
const generateReqKey = (config, link) => {
  const {method, url, params, data} = config;
  return [method, url, JSON.stringify(params), JSON.stringify(data), link].join('&');
}

// 判断是否是文件上传
function isFileUploadApi(config) {
  return Object.prototype.toString.call(config.data) === "[object FormData]"
}


export function repeatInterceptors({
  axios,
}: {
  axios: AxiosInstance; // axios实例
}) {
  const ev = new RequestEventEmitter();
  // 添加请求拦截器
  axios.interceptors.request.use(
    async (config) => {
      // 如果是上传文件的请求或 isAllowRepeatRequest 为true，直接返回
      if (isFileUploadApi(config) || config.isAllowRepeatRequest) {
        return config;
      }
      const { href } = location;
      // 生成请求Key
      const pendKey = generateReqKey(config, href);

      if (ev.hasPendKey(pendKey)) {
        // 如果是相同请求,在这里将请求挂起，通过发布订阅来为该请求返回结果
        try {
          // 在这里等待第一次请求的接口响应
          const res = await new Promise((resolve, reject) => {
            ev.on(pendKey, resolve, reject);
            // console.log('.....................目前在监听的重复请求', ev.event);
          });
          // 这里需注意，拿到结果后，无论成功与否，都需要return Promise.reject()来中断这次请求，否则请求会正常发送至服务器
          // eslint-disable-next-line
          return Promise.reject({
            type: 'requestResSuccess',
            val: res
          });
        } catch (err) {
          // 接口报错
          // eslint-disable-next-line
          return Promise.reject({
            type: 'requestResError',
            val: err
          });
        }
      } else {
        // 将请求的key保存在config
        config.pendKey = pendKey;
        ev.addPendKey(pendKey);
      }

      return config;
    },
    function (error) {
      return Promise.reject(error);
    }
  );

  axios.interceptors.response.use(
    (response: AxiosResponse<unknown>) => {
      // 将拿到的结果发布给其他相同的接口
      if(response.config.pendKey && ev.hasPendKey(response.config.pendKey)) {
        const pendKey = response.config.pendKey;
        let existRes = null;
        try {
          existRes = cloneDeep(response);
        } catch (e) {
          existRes = response;
        }
        ev.deletePendKey(pendKey);
        ev.emit(pendKey, existRes, 'resolve');
        ev.deleteEventData(pendKey);
      }
      return response;
    },
    (error) => {
      if (error?.type === 'requestResSuccess') {
        return Promise.resolve(error.val);
        // const cloneRes = cloneDeep(error.val);
        // const res = resResolveInterceptors?.(cloneRes);
        // // 如果调用的函数返回的是promise，则直接返回；如果是undefined，说明无值返回，就将error.val作为正常返回处理；否则就将res resolve后返回
        // return handleCallbackRes(res, cloneRes, 'resolve');
      } else if (error.type && error.type === 'requestResError') {
        return Promise.reject(error.val);
      } else {
        // 请求结果报错或请求的时候就报错就会进入这个分支
        const pendKey = error?.config?.pendKey;
        if (ev.hasPendKey(pendKey)) {
          let existError = null;
          try {
            existError = cloneDeep(error);
          } catch (e) {
            existError = error;
          }
          ev.deletePendKey(pendKey);
          ev.emit(pendKey, existError, 'reject');
          ev.deleteEventData(pendKey);
        }
        return Promise.reject(error);
      }
    }
  );

  return axios;
}