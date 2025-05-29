// 实现一个 Promise.all()
const all = (...promises) => {
  const result = [];
  let count = 0;
  const n = promises.length;
  return new Promise((resolve, reject) => {
    promises.forEach((item, index) => {
      Promise.resolve(item)
        .then(res => {
          result[index] = res;
          count++;
          if (count === n) {
            resolve(result);
          }
        })
        .catch(reject);
    });
  });
};
