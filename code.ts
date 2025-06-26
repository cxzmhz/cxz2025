type DeepPartial<T extends object> = {
  [key in keyof T]?: T[key] extends object ? DeepPartial<T[key]> : T[key];
};

const debounce = (fn: (params: any) => any, config: { wait: number }) => {
  const { wait } = config;
  let timeId: number | null = null;
  let rejectTmp;
  const run = (...param) => {
    if (timeId !== null) {
      clearTimeout(timeId as number);
    }
    return new Promise((resolve, reject) => {
      rejectTmp = reject;
      timeId = setTimeout(() => {
        const res = fn.call(this, ...param);
        resolve(res);
      }, wait);
    });
  };
  const cancel = () => {
    if (timeId !== null) {
      clearTimeout(timeId);
      if (rejectTmp) {
        rejectTmp();
      }
    }
  };
  return { run, cancel };
};
