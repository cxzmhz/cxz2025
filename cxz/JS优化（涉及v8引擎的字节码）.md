
# 字节码缓存

在文章的最开始，请先思考哪种方式执行js的速度更快，是 内联脚本 还是 外联脚本？是将 js合并成一个文件，还是 拆成多个文件？解答这两个问题，需要先了解js的执行机制。

## JIT即时编译

JIT (just in time) Compilation 即时编译 包含两种执行模式：解释执行 和 编译优化执行。

javascript 是一种 动态类型 语言，在定义变量时不需要声明类型，在运行时 解释器 一边根据赋值推导出类型并编译成字节码，一边把字节码编译成机器码并执行，这就是 解释执行。

在编译成字节码的过程中，解释器 监视代码的执行次数，调用 编译器 将执行次数较多的 热点代码 编译成机器码，后续执行 热点代码 时可以跳过编译直接执行，提升代码的执行速度，这就是编译优化执行。下面是 chrome v8引擎 的 JIT 编译流程：

1. 解析器 Parser 将 js代码 转成 ast
2. 解释器 Ignition 将 ast 一边编译成 字节码，一边编译成机器码并执行
3. 解释器 Ignition 监视执行情况，调用 编译器 TurboFan 将热点字节码编译成机器码

编译优化执行与字节码缓存无关，文章不展开介绍。

javascript 是一种跨平台语言，需要根据操作系统编译成中间代码 字节码，并且 字节码 的设计会根据CPU的计算模型，所以字节码 编译成 机器码 效率会更高。

为了减少 js 编译成 字节码 的耗时，提高 js 的执行效率，v8 引入了 字节码缓存。

---

![字节码缓存](attachment://字节码缓存.png)

---

# 字节码缓存

chrome 有两级缓存，isolate(memory) cache 和 disk(共享) cache，isolate cache 只作用于同一个tab，而 disk cache 可以在不同tab中共享，它们都可用于缓存字节码，流程如下：

## code run

首次执行 js，chrome 从网络上下载代码提供给 v8 编译，并将代码缓存起来。

下图是使用performance工具记录code run的行为，编译缓存状态是【脚本不符合条件】。

---

![字节码缓存](attachment://字节码缓存1.png)

---

# warm run

第二次执行 js，chrome 从缓存中获取代码再次提供给 v8 编译，并将编译结果由 v8序列化 后，作为 元数据 附加到该 代码的缓存。

warm run阶段，编译缓存状态还是【脚本不符合条件】，编译脚本多了两个步骤【编译代码】和【缓存脚本代码】，【编译代码】是指从缓存中加载脚本代码编译成字节码，【缓存脚本代码】是指将字节码序列化成元数据并附加到代码缓存中。

---

![Warmrun](attachment://Warmrun.png)

---

# hot run

第三次执行 js，chrome 从缓存中获取代码和元数据，并把两者交给 v8。v8反序列化元数据后，可以跳过编译直接执行。

---

![hot run](attachment://hot run.png)

---

hot run阶段，跳过编译，直接执行字节码，编译缓存状态是【已从缓存加载脚本】。


综上，字节码缓存至少需要在第三次执行时才可能生效。

官方文档提到，在同一tab中，第一次执行js会将字节码缓存放在key为代码的hashtable中，第二次执行js如果在hashtable中找到编译好的字节码，就可以直接跳过编译，也就是在同一个tab第二次进入相同页面，就可以利用字节码缓存。但是在验证时，也至少要三次才能利用字节码缓存。并且官方文档用tracing工具跟踪缓存，也没有展示在isolate cache的表现。如果有理解不正确的地方请帮忙指出。

## 缓存策略

字节码缓存是浏览器的默认行为，开发者需要怎么组织代码，才能充分利用呢？可以参考以下策略：

1. 请求地址与请求内容不变
2. js文件必须大于 1kb
3. 不能是 内联脚本
4. ```只有相同文件的代码才会缓存```
5. 执行过的函数才可能被缓存
7. 异步调用的函数无法缓存

第一点和网络缓存策略基本一致，第二、第三点也比较好理解，重点解释一下最后三点。

---

![字节码缓存](attachment://字节码缓存2.png)

---

# 只有相同文件的代码才会缓存

可以理解为，函数的定义与调用如果在不同的js文件，调用部分无法缓存字节码

```javascript
// 假设页面中先后同步加载1.js和2.js
// 1.js
function Module() {
    // 一些耗时操作
}

// 2.js
// 调用1.js文件中的function，无法利用字节码缓存，每次执行都需要重新编译
Module()
```
上图中，在2.js中调用1.js定义的Module函数，无法缓存字节码，需要重新编译。


# 首次执行的代码才被缓存

由于函数只在运行期间编译，当代码中存在一些逻辑分支时，只缓存首次执行的那一个分支，另一个分支在后续执行时需要重新编译。

```javascript
function ModuleA(){
    // 一些耗时操作
}

function ModuleB(){
    // 一些耗时操作
}

const enable = location.search.includes('enable=1')
if(enable) {
    // 假如首次执行ModuleA，后续执行该分支都可以利用字节码缓存
    ModuleA()
} else {
    // 假如首次不执行ModuleB，后续执行该分支需要重新编译字节码
    ModuleB()
}
```

---

![首次执行的代码才被缓存](attachment://首次执行的代码才被缓存.png)

---

上图是ModuleA()已经缓存字节码，调用ModuleB()的表现。首次执行url带上enable=1参数，命中条件执行ModuleA()并缓存了字节码，后续执行ModuleB()时没有字节码缓存，需要重新编译。

# 无法缓存宏任务

```javascript
// 1.js
function Module() {
    // 一些耗时操作
}

// 宏任务：定时器调用Module
setTimeout(Module)
```

---

![无法缓存宏任务](attachment://无法缓存宏任务.png)

---

在定时器宏任务中调用Module()无法缓存字节码，需要重新编译。在实际验证中，微任务是可以缓存字节码的，这点与官方文档描述不一致，推测是文档编写的时间较早，后续Chrome已经做了支持。

# 最佳实践

只有相同文件的代码才会缓存，可能与业界比较主流的做法相违背，包括webpack4的splitChunksPlugin，默认会把node_modules 打成一个vendor chunk 文件，剩下的 业务modules 打成一个文件。因为 node_modules 的改动频率较小，相对 业务modules 更加稳定，当项目发版时，如果 node_modules 没有修改，构建后 vendor chunk 的 hash 值与上一个版本保持一致，提高了缓存命中率，从而提升网络加载速度。但在实践过程中，由于 node_modules 和 业务modules 封装在不同的 js 文件，业务modules 调用 node_modules 的方法，无法利用字节码缓存，从而影响了js 的执行速度，两者合并后整体的性能数据有所下降。

比较推荐的做法，是把首屏初始化流程，这种高优先级的代码合并成一个首屏js，一些优先级较低的逻辑，比如非首屏渣染交互、数据上报的代码可以做成动态import，这样首屏js既可以控制包体积，又可以优先加载执行，让页面尽快地响应交互，提升用户体验。

不过浏览器对每个js的缓存体积是有限制的，通过本机测试，memory cache 大概是 377M，disk cache 大概是 25M，这两个数据并不精确，仅供参考。

![最佳实践](attachment://最佳实践.png)

## 最后

回答最开始的问题，由于内联脚本、拆分成多个js，这两种方式都无法利用字节码缓存，相反外联脚本、合并js执行速度更快。

参考文档：
- [https://v8.js.cn/blog/code-caching-for-devs](https://v8.js.cn/blog/code-caching-for-devs)
- [https://medium.com/dailyjs/understanding-v8s-bytecode-317d46c94775](https://medium.com/dailyjs/understanding-v8s-bytecode-317d46c94775)

---