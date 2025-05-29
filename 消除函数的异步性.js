function getUser() {
  return fetch("https://my-json-server.typicode.com/typicode/demo/profile");
}
function m1() {
  // other works
  return getUser();
}
function m2() {
  // other works
  return m1();
}

function m3() {
  // other works
  return m2();
}

function main() {
  const user = m3();
  console.log("user", user);
}
function run(func) { 
  let cache = [];
  let i = 0;	
  const _originalFetch = window.fetch;
  window.fetch = (...args) => {	
    if (cache[i]) {	
      if (cache[i].status === "fulfilled") {	
        return cache[i].data;	
      } else if (cache[i].status === "rejected") {	
        throw cache[i].err;	
      }	
    }
    const result = {	
      status: "pending",	
      data: null,	
      err: null,	
    };	
    cache[i++] = result;	
    const prom = _originalFetch(...args)	
      .then((resp) => resp.json())	
      .then(	
        (resp) =>{	
        result.status = "fulfilled";	
        result.data = resp;	
      },(err) => {	
        result.status = "rejected";	
        result.data = err;	
      }
    );
    // 报错	
    // 既然要抛出错误我们就在这里直接抛出一个 throw	，但是fetch还是会在后台默默运行，去发起请求获取数据
    // 那我们在哪再次调用呢?在_originalFetch 的结果里调用是肯定不行的	
    // 那么这时我们可以想到利用try catch机制来捕获执行期间发生的错误	
    // 我们暂时忽略掉抛出的prom的原因，接着往下看。	
    throw prom;	
	};	
	// 所以利用 try catch，我们可以在这里捕获错误	
	try {	
	  func();	
	} catch (err) {	
    // 这里我们要思考一个问题?	
    // 在执行期间可能发生很多错误，比如网络、跨域、请求数据错误等问题，	
    // 并不是所有的错误我们都需要再次请求，	
    // 只有当错误是throw抛出的特点错误时，我才需要重新执行。	
    //而且在这错误中我们还必须要知道什么时候引发的重新执行。	
    // 那么满足这些条件的错误只有_originalFetch 的promise可以满足，	
    // 所以我们才需要抛出prom，这就是我们抛出prom 的原因。	

    // 这时我们判断如果是一个Promise 作为一个错误抛出我们就要重新执行func	
    if (err instanceof Promise) {	
      // 我们声明一个reRun 函数	
      const reRun = () => {	
        // 函数中我们重置i的值和重新调用 func	
        i=0;	
        func();	
      };	
      // 我们执行err，在他正确和错误时都重新执行reRun函数。	
      // 在then中调用，这个时候上面的_originalFetch已经请求并拿回响应数据resolved了
      err.then(reRun,reRun);	

    }	
	}	
}
run(main)






// 以下是react的隐式应用的例子
	const userResource = getUserResource();	

	// 以上代码我们要渲染一个ProfilePage组件	
	function ProfilePage() {	
    return (
    // 这里使用了一个Suspense组件，有点类似于Vue里的Suspense但是原理完全不一样// Suspense里套了一个组件，如果说这个组件正在加载中，我们就渲染fallback 中的内容// 加载完成了我们就渲染套的组件
    // 如果说 Vue 里边的话就必须要要求profileDetails组件返回的是一个Promise
      <Suspense fallback={<h1>Loading profile...</h1>}>	
        <profileDetails />	
      </Suspense>	
    );	
  }
	// 我们看 React 里并没有返回Promise	
	function ProfileDetails() {	
    // 在这里远程去读取用户资源，这是异步，但是这里被当成同步来用	
    // 如果我们在这里输出一个1，那么控制台会输出两次	
    // 就像我们实现的方式一样，函数本身就会被执行两次，自然也会被输出两次	
    console.log(">>>",1);//11	
    // 因为在第一次读取时抛出了一个Promise 的异常，	
    // 换句话说如果我们不让他抛出异常而抛出pending状态的Promise，就不会继续执行	
    // 因为他只有在接到异常后才会去重新执行函数拿到结果	
    // 这就是他的核心原理，和我们实现的是一样的	
    const user = userResource.read();	
    return <h1>{user.name}</h1>;	
  }