// let arr = [1];
// // Array.prototype.join = function () {
// //   return 'aaa';
// // };
// // console.log(Number(arr));
// let obj = { a: 1 };
// // console.log(arr.valueOf());

// let aa = 'ss';
// let ss = Symbol(aa);
// // console.log(ss);

// // console.log(obj.constructor);

// const arr1 = [1, 2];
// const obj1 = {};
// obj1[arr1] = 1;

// script start => async1 start => async2 => promise1 => script end => asyunc1 end => promise2 => settimeout

const request = function (config) {
  const { url, method, data } = config;
  const xhr = new XMLHttpRequest();
  xhr.open(url, method, true);
  xhr.onload = function () {
    console.log(xhr.responseText);
  };
  xhr.send(data);
};

// react 的 compose，作用是组合高阶组件, compose(HOC1, HOC2)(Component)
const compose = (...func) => {
  return Component => {
    return func.reduce((Component, func) => {
      return func(Component);
    }, Component);
  };
};

const strReplace = (str, reg, realVal) => {
  return str.replace(reg, function (s) {
    return realVal;
  });
};

// const res = strReplace('xxxxxsxxxxx', /x/g, 'a');

// 测试promise
const f1 = () => {
  const p = new Promise((resolve, reject) => {
    resolve('f1');
  }).then((res)=>{
    console.log(res)
  });

  throw p;

  // p.then((res)=>{
  //   console.log(res);
  // })
}

const f2 = ()=>{
  try{
    f1()
  }catch(err) {
    console.log('f2')
    err.then(res=>{
      console.log(res);
    })
  }
}

f2();
