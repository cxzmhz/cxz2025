/**
 * @param {string} s
 * @return {string[][]}
 */
const partitionHui = function (s) {
  const path = [];
  const ans = [];
  const n = s.length;

  const isHui = str => {
    let l = 0;
    let r = str.length - 1;
    while (l <= r) {
      if (str[l] !== str[r]) {
        return false;
      }
      l++;
      r--;
    }
    return true;
  };

  // "aab"
  const dfs = (i, last) => {
    if (i === n) {
      path.length && last === n && ans.push([...path]);
      return;
    }

    dfs(i + 1, last);
    const s1 = s.substring(last, i + 1);
    if (isHui(s1)) {
      path.push(s1);
      dfs(i + 1, i + 1);
      path.pop();
    }
  };

  // const dfs = (i) => {
  //   if(i === n) {
  //     ans.push([...path]);
  //     return;
  //   }

  //   for(let j=i; j<n; j++) {
  //     const s1 = s.substring(i,j+1);
  //     if(isHui(s1)) {
  //       path.push(s1);
  //       dfs(j+1);
  //       path.pop();
  //     }
  //   }
  // }
  dfs(0, 0);
  return ans;
};

// 有效三角形的个数
/**
 * @param {number[]} nums
 * @return {number}
 */
// [46,48,61,66,75,94]
// [3,19,22,24,35,82,84]
var triangleNumber = function (nums) {
  const n = nums.length;
  let ans = 0;

  nums.sort((a, b) => a - b);

  for (let i = 0; i < n; i++) {
    let k = i;
    for (let j = i + 1; j < n; j++) {
      while (k + 1 < n && nums[i] + nums[j] > nums[k + 1]) {
        ++k;
      }
      ans = ans + Math.max(k - j, 0);
    }
  }

  // for(let i=n-1;i>=2;i--) {
  //   // 在0 ~ i-1里面查找所有2个数相加大于nums[i]的组合
  //   for(let j=i-1;j>=1;j--) {
  //     let left = 0;
  //     let right = j-1;
  //     while(left <= right && left>=0 && right >= 0) {
  //       const mid = Math.floor((left + right) / 2);
  //       if(nums[mid] + nums[j] > nums[i]) {
  //         ans = ans + (right - mid + 1);
  //         right = mid - 1;
  //       }else {
  //         left = mid + 1;
  //       }
  //     }
  //   }
  // }

  // for(let i=0; i<n; i++){
  //   for(let j=i+1; j<n; j++) {
  //     for(let k=j+1; k<n; k++) {
  //       if(nums[i] + nums[j] > nums[k] && nums[i] + nums[k] > nums[j] && nums[j] + nums[k] > nums[i]) {
  //         ans++;
  //       }
  //     }
  //   }
  // }
  return ans;
};

// 零钱兑换
/**
 * @param {number[]} coins
 * @param {number} amount
 * @return {number}
 */
var coinChange = function (coins, amount) {
  const n = coins.length;

  const f = new Array(amount + 1).fill(Infinity);
  f[0] = 0;
  for (let i = n - 1; i >= 0; i--) {
    for (let j = coins[i]; j <= amount; j++) {
      f[j] = Math.min(f[j - coins[i]] + 1, f[j]);
      // 这里如果j从coins[i]开始枚举的话，这个if(j>=coins[i])就不用写了
      // if(j>=coins[i]) {}
    }
  }

  return f[amount] === Infinity ? -1 : f[amount];

  // const f = new Array(n+1).fill(Infinity).map(()=>new Array(amount+1).fill(Infinity))
  // f[n][0] = 0;
  // for(let i=n-1;i>=0;i--){
  //   for(let j=0;j<=amount;j++){
  //     if(j<coins[i]) {
  //       f[i][j] = f[i+1][j];
  //     }else {
  //       f[i][j] = Math.min(f[i][j-coins[i]]+1, f[i+1][j]);
  //     }
  //   }
  // }

  // return f[0][amount] === Infinity ? -1 : f[0][amount];

  // const dfs = (i, sum)=>{
  //   if(i>=n) {
  //     if(sum === 0) return 0;
  //     return Infinity
  //   }
  //   if(sum < coins[i]) {
  //     return dfs(i+1, sum);
  //   }
  //   const res = Math.min(dfs(i, sum - coins[i]) + 1, dfs(i+1, sum))
  //   return res
  // }

  // const res = dfs(0, amount)
  // return res === Infinity ? -1 : res;
};

// console.log(coinChange([1,2,5], 11));

// 冒泡排序
const bubbleSort = arr => {
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
};

// 快速排序
const partition = (arr, low, high) => {
  const pivot = arr[high];
  let i = low - 1;

  for (let j = low; j < high; j++) {
    if (arr[j] < pivot) {
      i++;
      // 确保每次循环结束都能把大于等于基准的数据移到最右侧的位置，i未+1前永远指向的都是已经遍历过的小于基准的最后一个位置
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
};
const quickSortInPlace = (arr, low = 0, high = arr.length - 1) => {
  if (low < high) {
    const pivotIndex = partition(arr, low, high);
    quickSortInPlace(arr, low, pivotIndex - 1);
    quickSortInPlace(arr, pivotIndex + 1, high);
  }
  return arr;
};
// console.log(quickSortInPlace([2, 1, 4, 5])); // 输出: [1, 2, 4, 5]

// 快速排序好记的方式，不过空间复杂度会更大
const quickSort = arr => {
  if (arr.length <= 1) return arr;
  // 这个基准取哪个index的其实都可以
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = [];
  const right = [];
  const equal = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] < pivot) {
      left.push(arr[i]);
    } else if (arr[i] > pivot) {
      right.push(arr[i]);
    } else {
      equal.push(arr[i]);
    }
  }
  return [...quickSort(left), ...equal, ...quickSort(right)];
};
// console.log(quickSort([2, 1, 4, 5])); // 输出: [1, 2, 4, 5]

// 归并排序
const merge = (left, right) => {
  let l = 0;
  let r = 0;
  const res = [];
  while (l < left.length && r < right.length) {
    if (left[l] < right[r]) {
      res.push(left[l]);
      l++;
    } else {
      res.push(right[r]);
      r++;
    }
  }
  return res.concat(left.slice(l)).concat(right.slice(r));
};
const mergeSort = arr => {
  if (arr.length <= 1) return arr;
  const n = arr.length;
  const pivot = Math.floor(n / 2);
  const left = arr.slice(0, pivot);
  const right = arr.slice(pivot);
  return merge(mergeSort(left), mergeSort(right));
};

// 防抖
const debounce = (fn, long) => {
  let timer = null;
  return function (...args) {
    const context = this;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(context, args);
    }, long);
  };
};

// 节流
const throttle = (fn, delay) => {
  let isFnIn = false;
  return function (...args) {
    if (!isFnIn) {
      isFnIn = true;
      setTimeout(() => {
        fn.apply(this, args);
        isFnIn = false;
      }, delay);
    }
  };
};

// 模拟new操作符
function createNew(func, ...args) {
  const newObj = {};
  newObj.__proto__ = func.prototype;
  const res = func.apply(newObj, args);
  return res instanceof Object ? res : newObj;
}

// 模拟bind函数
Function.prototype.myBind = function (obj) {
  const arg = [...arguments].slice(1);
  const fn = this;
  return function Fn() {
    return fn.apply(
      this instanceof Fn ? new fn(...arguments) : obj,
      arg.concat(...arguments)
    );
  };
};

// 深克隆(深拷贝)
const deepClone = (obj, cache = new WeakMap()) => {
  if (obj === null) return obj;
  // 复制日期和正则
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj);
  if (typeof obj !== 'object') return obj;
  // 复制函数
  if (typeof obj === 'function') {
    return eval('(' + obj.toString() + ')');
  }
  if (cache.get(obj)) return cache.get(obj);
  const cloneObj = new obj.constructor();
  cache.set(obj, cloneObj);
  // 复制数组
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      cloneObj[i] = deepClone(obj[i], cache);
    }
  } else {
    // 复制对象，包含以symbol作为属性的
    const keys = [...Object.keys(obj), ...Object.getOwnPropertySymbols(obj)];
    for (let key of keys) {
      cloneObj[key] = deepClone(obj[key], cache);
    }
  }
  return cloneObj;
};

const obj11 = {
  a: 1,
  b: function () {
    console.log('1');
  },
  c: undefined,
};

class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
  say() {
    console.log('hi');
  }
}

// 寄生组合继承
function SuperFn(name) {
  this.name = name;
}
SuperFn.prototype.say = function () {
  console.log('hi');
};

// Object.create() 以一个现有对象作为原型，创建一个新对象。
function inheritFn(parent, child) {
  child.prototype = Object.create(parent.prototype);
  child.prototype.constructor = child;
}
function SubFn(name, age) {
  SuperFn.call(this, name);
  this.age = age;
}
inheritFn(SuperFn, SubFn);
SubFn.prototype.getAge = function () {
  console.log(this.age);
  return this.age;
};

// const subObj = new SubFn('joey', 18);
// subObj.getAge();
// -----
// -----
// -----
// -----
// -----

// 求最长递增子序列的长度
var lengthOfLIS = function (nums) {
  // 贪心算法+二分法，时间复杂度为nlogn
  var ans = [];
  for (var i = 0; i < nums.length; i++) {
    var left = 0,
      right = ans.length;
    while (left < right) {
      //二分法
      var mid = (left + right) >> 1;
      if (ans[mid] < nums[i]) left = mid + 1;
      else right = mid;
    }
    if (right >= ans.length)
      ans.push(nums[i]); //如果找不到 在ans最后增加一项nums[i]
    else ans[right] = nums[i];
  }
  return ans.length;

  // 动态规划，时间复杂度为n^2，主要是通过计算在i这个位置，以i为结束节点时的最长递增子序列长度
  // if (nums.length === 0) return 0;
  // let max = 0;
  // let dp = [];
  // for (let i = 0; i < nums.length; i++) {
  //   dp[i] = 1;
  //   for (let j = 0; j < i; j++) {
  //     if (nums[j] < nums[i]) {
  //       dp[i] = Math.max(dp[i], dp[j] + 1);
  //     }
  //   }
  //   max = Math.max(max, dp[i]);
  // }
  // return max;
};

// 最长公共子序列，使用动态规划
const longestCommonSubsequence = function (text1, text2) {
  const m = text1.length;
  const n = text2.length;
  const dp = new Array(m + 1).fill(0).map(() => new Array(n + 1).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (text1[i] === text2[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i][j + 1], dp[i + 1][j]);
      }
    }
  }
  return dp[m][n];
};

// new Function的使用
const functionuse = () => {
  return new Function('a', 'b', 'return a+b')(1, 2);
};

const countSubstrings = function (s) {
  const n = s.length;
  const f = new Array(n).fill(false).map(() => new Array(n).fill(false));
  let ans = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i; j >= 0; j--) {
      if (i - j <= 1 && s[i] === s[j]) {
        ans += 1;
        f[j][i] = true;
      } else if (f[j + 1][i - 1] && s[j] === s[i]) {
        ans += 1;
        f[j][i] = true;
      }
    }
  }

  return ans;
};

const isPalindrome = head => {
  const arr = [];
  let cur = head;
  while (cur !== null) {
    arr.push(cur.val);
    cur = cur.next;
  }
  const isHui = arr => {
    const n = arr.length;
    let left = 0;
    let right = n - 1;
    while (left < right) {
      if (arr[left] !== arr[right]) {
        return false;
      }
      left++;
      right--;
    }
    return true;
  };
  return isHui(arr);
};

const a1 = s => {
  const n = s.length;
  const f = new Array(n).fill(false).map(() => new Array(n).fill(false));
  const ans = [];
  const path = [];
  for (let i = 0; i < n; i++) {
    for (let j = i; j >= 0; j--) {
      if (s[i] === s[j] && (i - j <= 1 || f[j + 1][i - 1])) {
        f[j][i] = true;
      }
    }
  }

  const dfs = i => {
    if (i === n) {
      ans.push([...path]);
    }

    for (let j = i; j < n; j++) {
      if (f[i][j]) {
        path.push(s.substring(i, j + 1));
        dfs(j + 1);
        path.pop();
      }
    }
  };

  dfs(0);
  return ans;
};

// 两数之和
const a2 = (numbers, target) => {
  const n = numbers.length;
  let l = 0;
  let r = n - 1;
  while (l <= r) {
    if (numbers[l] + numbers[r] < target) {
      l++;
    } else if (numbers[l] + numbers[r] > target) {
      r--;
    } else {
      return [l + 1, r + 1];
    }
  }
};

// 三数之和
const a3 = nums => {
  const sn = nums.sort((a, b) => a - b);
  const n = nums.length;
  const ans = [];
  for (let i = 0; i < n - 2; i++) {
    let l = i + 1;
    let r = n - 1;

    if (i > 0 && sn[i] === sn[i - 1]) {
      continue;
    }
    while (l < r) {
      const s = sn[l] + sn[r] + sn[i];
      if (s < 0) {
        l++;
      } else if (s > 0) {
        r--;
      } else {
        ans.push([sn[i], sn[l], sn[r]]);
        l++;
        while (l < r && sn[l] === sn[l - 1]) {
          l++;
        }
        r--;
        while (l < r && sn[r] === sn[r + 1]) {
          r--;
        }
      }
    }
  }
  return ans;
};

// 11. 盛最多水的容器
const a4 = height => {
  const n = height.length;
  let l = 0;
  let r = n - 1;
  let ans = 0;
  while (l < r) {
    const s = Math.min(height[l], height[r]) * (r - l);
    ans = Math.max(ans, s);
    if (height[l] < height[r]) {
      l++;
    } else {
      r--;
    }
  }
  return ans;
};

// 42. 接雨水
const a5 = height => {
  const n = height.length;
  let l = 0;
  let r = n - 1;
  let maxl = 0;
  let maxr = 0;
  let ans = 0;

  while (l < r) {
    maxl = Math.max(height[l], maxl);
    maxr = Math.max(height[r], maxr);
    if (maxl < maxr) {
      ans += maxl - height[l];
      l++;
    } else {
      ans += maxr - height[r];
      r--;
    }
  }
  return ans;
};

// 209. 长度最小的子数组

const a6 = (target, nums) => {
  const n = nums.length;
  let l = 0;
  let ans = n + 1;
  let res = 0;
  for (let r = 0; r < n; r++) {
    res += nums[r];
    while (res >= target) {
      ans = Math.min(ans, r - l + 1);
      res -= nums[l];
      l++;
    }
  }
  return ans > n ? 0 : ans;
};

// 713. 乘积小于k的子数组
const a7 = (nums, k) => {
  if (k <= 1) return 0;
  const n = nums.length;
  let l = 0;
  let res = 1;
  let ans = 0;
  for (let r = 0; r < n; r++) {
    res *= nums[r];
    while (res >= k) {
      res /= nums[l];
      l++;
    }
    ans = ans + (r - l + 1);
  }
  return ans;
};

// 3. 无重复字符的最长子串
const a8 = s => {
  const n = s.length;
  const arr = {};
  let l = 0;
  let ans = 0;
  for (let r = 0; r < n; r++) {
    arr[s[r]] = (arr[s[r]] || 0) + 1;
    while (arr[s[r]] > 1) {
      arr[s[l]] = (arr[s[l]] || 0) - 1;
      l++;
    }
    ans = Math.max(ans, r - l + 1);
  }
  return ans;
};

// 34. 在排序数组中查找元素的第一个和最后一个位置
const a9 = (nums, target) => {
  const n = nums.length;
  const getN = t => {
    let l = 0;
    let r = n - 1;
    let mid = 0;
    while (l <= r) {
      let mid = (l + r) >> 1;
      if (nums[mid] >= t) {
        r = mid - 1;
      } else {
        l = mid + 1;
      }
    }
    return r + 1;
  };
  const left = getN(target);
  const right = getN(target + 1) - 1;
  return left === n || nums[left] !== target ? [-1, -1] : [left, right];
};

// 162. 寻找峰值
const a10 = nums => {
  const n = nums.length;
  let l = 0;
  let r = n - 2; // 因为最后一个数一定是在峰值的右侧，所以不用参与二分，注：二分一定要先确定好二分的范围
  let mid = 0;
  while (l <= r) {
    mid = (l + r) >> 1;
    if (nums[mid] > nums[mid + 1]) {
      r = mid - 1;
    } else {
      l = mid + 1;
    }
  }
  return l;
};

// 153. 寻找旋转排序数组中的最小值
const a11 = nums => {
  const n = nums.length;
  let l = 0;
  let r = n - 2;
  let mid = 0;
  const end = nums[n - 1];
  while (l <= r) {
    mid = (l + r) >> 1;
    if (nums[mid] < end) {
      r = mid - 1;
    } else {
      l = mid + 1;
    }
  }
  return nums[l];
};

// 33. 搜索旋转排序数组
const a12 = (nums, target) => {
  const n = nums.length;
  const end = nums[n - 1];
  const isRightOrEqual = index => {
    if (nums[index] > end) {
      return target > end && nums[index] >= target;
    } else {
      return target > end || nums[index] >= target;
    }
  };
  let l = 0;
  let r = n - 1;
  let mid = 0;
  while (l <= r) {
    mid = (l + r) >> 1;
    if (isRightOrEqual(mid)) {
      r = mid - 1;
    } else {
      l = mid + 1;
    }
  }
  return l === n || nums[l] !== target ? -1 : l;
};

// 77. 组合
const a13 = (n, k) => {
  const ans = [];
  const path = [];
  const dfs = i => {
    const d = k - path.length;
    if (n - i + 1 < d) {
      return;
    }
    if (d <= 0) {
      ans.push([...path]);
      return;
    }
    for (let j = i; j <= n; j++) {
      path.push(j);
      dfs(j + 1);
      path.pop();
    }
  };
  dfs(1);

  return ans;
};

// 46. 全排列
const a14 = nums => {
  const ans = [];
  const n = nums.length;
  const f = new Array(n).fill(false);
  const path = new Array(n).fill(0);

  const dfs = i => {
    if (i === n) {
      ans.push([...path]);
      return;
    }

    for (let j = 0; j < n; j++) {
      if (!f[j]) {
        path[i] = nums[j];
        f[j] = true;
        dfs(i + 1);
        f[j] = false;
      }
    }
  };
  dfs(0);
  return ans;
};

// 51. N皇后
const a15 = n => {
  const ans = [];
  // 判断之前行的哪些格子被使用过了，使用了就设为true
  const f = new Array(n).fill(false);
  // 朝右上方向的斜对角这条线里的格子里的row和col相加的值都是相等的
  const addF = new Array(2n).fill(false);
  // 朝右下方向的斜对角这条线里的格子里的row减去col的值都是相等的，可以根据这个来判断之前行的斜对角的这个格子有没有被选中过
  const subtractF = new Array(2n).fill(false);
  const path = new Array(n).fill(0);
  const genStr = num => {
    const before = new Array(num).fill('.').join('');
    const mid = 'Q';
    const after = new Array(n - num - 1).fill('.').join('');
    return `${before}${mid}${after}`;
  };

  const dfs = row => {
    if (row === n) {
      const arr = [];
      for (let item of path) {
        const str = genStr(item);
        arr.push(str);
      }
      ans.push(arr);
      return;
    }

    for (let col = 0; col < n; col++) {
      if (!f[col] && !addF[row + col] && !subtractF[row - col + n - 1]) {
        path[row] = col;
        subtractF[row - col + n - 1] = addF[row + col] = f[col] = true;
        dfs(row + 1);
        subtractF[row - col + n - 1] = addF[row + col] = f[col] = false;
      }
    }
  };
  dfs(0);
  return ans;
};

// 198. 打家劫舍（递推：使用动态规划）
const a16 = nums => {
  const n = nums.length;
  const f = new Array(n + 2).fill(0);

  for (let i = 0; i < n; i++) {
    f[i + 2] = Math.max(f[i + 1], f[i] + nums[i]);
  }
  return f[n + 1];
};
// 打家劫舍（递归）
const a16_1 = nums => {
  const n = nums.length;
  const cache = new Array(n).fill(-1);

  const dfs = i => {
    if (i < 0) return 0;
    if (cache[i] !== -1) return cache[i];
    const res = Math.max(dfs(i - 1), dfs(i - 2) + nums[i]);
    cache[i] = res;
    return res;
  };
  dfs(n - 1);
  return cache[n - 1];
};

// 494. 目标和
const a17 = (nums, target) => {
  const n = nums.length;
  // 只需要计算所有需要做加法运算的数据的和为(sum + target) / 2 即可
  const sum = nums.reduce((acc, item) => {
    return acc + item;
  }, 0);
  let t = (sum + target) % 2;
  if (sum + target < 0 || t > 0) return 0;
  t = (sum + target) / 2;

  const f = new Array(n + 1).fill(0).map(() => new Array(t + 1).fill(0));
  // nums 遍历完，且剩余target为0的时候则标识这个方式可行，方法数+1
  f[0][0] = 1;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= t; j++) {
      if (j < nums[i]) {
        f[i + 1][j] = f[i][j];
      } else {
        f[i + 1][j] = f[i][j] + f[i][j - nums[i]];
      }
    }
  }
  return f[n][t];
};

// 322. 零钱兑换
const a18 = (coins, amount) => {
  const n = coins.length;
  const f = new Array(n + 1)
    .fill(0)
    .map(() => new Array(amount + 1).fill(Infinity));
  f[0][0] = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= amount; j++) {
      if (j < coins[i]) {
        f[i + 1][j] = f[i][j];
      } else {
        f[i + 1][j] = Math.min(f[i][j], f[i + 1][j - coins[i]] + 1);
      }
    }
  }
  return f[n][amount] === Infinity ? -1 : f[n][amount];
};

// 72. 编辑距离
const a19 = (word1, word2) => {
  const n = word1.length;
  const m = word2.length;

  const f = new Array(n + 1).fill(0).map(() => new Array(m + 1).fill(0));
  f[0] = f[0].map((_, index) => index);
  for (let i = 0; i < n; i++) {
    f[i + 1][0] = i + 1;
    for (let j = 0; j < m; j++) {
      if (word1[i] === word2[j]) {
        f[i + 1][j + 1] = f[i][j];
      } else {
        f[i + 1][j + 1] = Math.min(f[i][j + 1], f[i + 1][j], f[i][j]) + 1;
      }
    }
  }
  return f[n][m];
};

// 1143. 最长公共子序列
const a20 = (text1, text2) => {
  const n = text1.length;
  const m = text2.length;
  const f = new Array(n + 1).fill(0).map(() => new Array(m + 1).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (text1[i] === text2[j]) {
        f[i + 1][j + 1] = f[i][j] + 1;
      } else {
        f[i + 1][j + 1] = Math.max(f[i][j + 1], f[i + 1][j], f[i][j]);
      }
    }
  }
  return f[n][m];
};

// 300. 最长递增子序列
const a21 = nums => {
  const n = nums.length;
  const g = [nums[0]];
  const getDisect = num => {
    let l = 0;
    let r = g.length - 1;
    let mid = 0;
    while (l <= r) {
      mid = (l + r) >> 1;
      if (g[mid] >= num) {
        r = mid - 1;
      } else {
        l = mid + 1;
      }
    }
    return l;
  };
  for (let i = 1; i < n; i++) {
    const index = getDisect(nums[i]);
    if (index === n) {
      g.push(nums[i]);
    } else {
      g[index] = nums[i];
    }
  }
  return g.length;
};

// 122. 买卖股票的最佳时机 II
const a22 = prices => {
  const n = prices.length;
  const cache = new Array(n + 1).fill(0).map(() => new Array(2).fill(false));
  // 这里的0下标里面存储的值是-1天的时候的利润，因为-1天不可能持有股票，所有是负无穷
  cache[0][1] = -Infinity;
  cache[0][0] = 0;
  // has表示这一天结束的时候是否持有股票
  const dfs = (i, has) => {
    if (cache[i + 1][has] !== false) return cache[i + 1][has];
    if (has === 1) {
      cache[i + 1][1] = Math.max(dfs(i - 1, 1), dfs(i - 1, 0) - prices[i]);
    } else {
      cache[i + 1][0] = Math.max(dfs(i - 1, 0), dfs(i - 1, 1) + prices[i]);
    }
    return cache[i + 1][has];
  };
  return dfs(n - 1, 0);
};

// 739. 每日温度
const a24 = temperatures => {
  const n = temperatures.length;
  const ans = new Array(n).fill(0);
  const stack = [];
  for (let i = 0; i < n; i++) {
    while (
      stack.length &&
      temperatures[i] > temperatures[stack[stack.length - 1]]
    ) {
      const index = stack.pop();
      ans[index] = i - index;
    }
    stack.push(i);
  }
  return ans;
};

// 22. 括号生成

const a26 = n => {
  const m = 2 * n;
  const ans = [];
  const path = new Array(2 * n).fill('');

  // openCount表示左括号选了几个
  const dfs = (i, openCount) => {
    if (i === m) {
      ans.push(path.join(''));
      return;
    }

    if (openCount < n) {
      path[i] = '(';
      dfs(i + 1, openCount + 1);
    }
    if (i - openCount < openCount) {
      path[i] = ')';
      dfs(i + 1, openCount);
    }
  };

  dfs(0, 0);
  return ans;
};

// 78. 子集
const a28 = nums => {
  const n = nums.length;
  const ans = [];
  const path = [];

  const dfs = i => {
    if (i === n) {
      ans.push([...path]);
      return;
    }
    dfs(i + 1);
    path.push(nums[i]);
    dfs(i + 1);
    path.pop();
  };
  dfs(0);
  return ans;
};

// 216. 组合总和 III

const a29 = (k, n) => {
  const ans = [];
  const path = [];

  const dfs = (i, data) => {
    if (data > 0) {
      if (i > data || i > 9) {
        return;
      }
    }
    if (data === 0) {
      if (path.length === k) {
        ans.push([...path]);
        return;
      }
      return;
    }
    dfs(i + 1, data);
    path.push(i);
    dfs(i + 1, data - i);
    path.pop();
  };
  dfs(1, n);
  return ans;
};

// 322. 零钱兑换
const a30 = (coins, amount) => {
  const n = coins.length;
  const cache = new Array(n + 1)
    .fill(0)
    .map(() => new Array(amount + 1).fill(false));

  const dfs = (i, data) => {
    if (cache[i][data] !== false) return cache[i][data];
    if (coins[i] > data) {
      cache[i][data] = dfs(i + 1, data);
      return cache[i][data];
    }
    if (data === 0) {
      cache[i][data] = 0;
      return 0;
    }
    if (i === n) {
      cache[i][data] = Infinity;
      return Infinity;
    }
    cache[i][data] = Math.min(dfs(i + 1, data), dfs(i, data - coins[i]) + 1);
    return cache[i][data];
  };
  const res = dfs(0, amount);
  return res < Infinity ? res : -1;
};

// 611. 有效三角形的个数
const a31 = nums => {
  const n = nums.length;
  nums.sort((a, b) => a - b);
  let ans = 0;

  for (let i = 0; i < n - 2; i++) {
    let k = i + 2;
    for (let j = i + 1; j < n - 1; j++) {
      while (k < n && nums[i] + nums[j] > nums[k]) {
        k++;
      }
      ans = ans + Math.max(k - 1 - j, 0);
    }
  }
  return ans;
};

// LCR 100. 三角形最小路径和
const a32 = triangle => {
  const n = triangle.length;
  const f = new Array(n + 1)
    .fill(0)
    .map(() => new Array(triangle[n - 1].length + 1).fill(false));

  const dfs = (row, col) => {
    if (f[row][col] !== false) return f[row][col];
    if (row === n) {
      f[row][col] = 0;
      return 0;
    }
    f[row][col] =
      Math.min(dfs(row + 1, col), dfs(row + 1, col + 1)) + triangle[row][col];
    return f[row][col];
  };

  return dfs(0, 0);
};

// 75. 颜色分类（需要在原先的nums上修改，不可以新建一个数组）
const a33 = nums => {
  const arr = [0, 0, 0];
  const n = nums.length;
  const ans = [];
  for (let i = 0; i < n; i++) {
    arr[nums[i]] += 1;
  }
  for (let a = 0; a < arr[0]; a++) {
    nums[a] = 0;
  }
  for (let b = arr[0]; b < arr[0] + arr[1]; b++) {
    nums[b] = 1;
  }
  for (let c = arr[0] + arr[1]; c < n; c++) {
    nums[c] = 2;
  }
  return nums;
};

// 209
const a34 = (target, nums) => {
  const n = nums.length;
  const res = [];
  let total = 0;
  let ans = n + 1;
  for (let i = 0; i < n; i++) {
    res.push(nums[i]);
    total += nums[i];
    while (total - res[0] >= target) {
      const data = res.shift();
      total -= data;
    }
    if (total >= target) {
      ans = Math.min(ans, res.length);
    }
  }
  return ans > n ? 0 : ans;
};

// 713
const a35 = (nums, k) => {
  let l = 0;
  const n = nums.length;
  let res = 1;
  const ans = [];
  for (let i = 0; i < n; i++) {
    res = res * nums[i];

    while ((res >= k && l < i) || (i === n - 1 && l <= i)) {
      const path = [];
      let rr = 1;
      for (let j = l; j <= i; j++) {
        rr = rr * nums[j];
        if (rr < k) {
          path.push(nums[j]);
          ans.push([...path]);
        } else {
          break;
        }
      }
      res = res / nums[l];
      l++;
    }
  }
  return ans.length;
};

// 1979. 找出数组的最大公约数  [2,5,6,9,10]
const a37 = nums => {
  const n = nums.length;
  let min = Infinity;
  let max = 0;
  let ans = 0;
  for (let i = 0; i < n; i++) {
    const d = nums[i];
    d < min && (min = d);
    d > max && (max = d);
  }
  // for(let j=1;j<=min;j++){
  //   if(min%j === 0 && max % j === 0) {
  //     ans = j
  //   }
  // }
  // return ans;
  function gcd(a, b) {
    let r = a % b;
    return b === 0 ? a : gcd(b, r);
  }
  return gcd(max, min);
};

// 1. 两数之和
const a38 = (nums, target) => {
  const n = nums.length;
  const temp = [...nums];
  temp.sort((a, b) => a - b);
  for (let i = 0; i < n - 1; i++) {
    const leave = target - temp[i];
    let l = i + 1;
    let r = n - 1;
    while (l <= r) {
      const mid = (l + r) >> 1;
      if (temp[mid] >= leave) {
        r = mid - 1;
      } else {
        l = mid + 1;
      }
    }
    if (l < n && temp[l] === leave) {
      console.log(i, l);
      let a, b;
      for (let k = 0; k < n; k++) {
        nums[k] === temp[i] && a === undefined && (a = k);
        nums[k] === temp[l] && k !== a && (b = k);
      }
      return [a, b];
    }
  }
};

// 113. 路径总和II
const a39 = (root, targetSum) => {
  if (root === null) return [];
  const ans = [];
  const path = [];
  let res = 0;

  const dfs = (node, r) => {
    r += node.val;
    path.push(node.val);
    if (node.left === null && node.right === null) {
      if (r === targetSum) {
        ans.push([...path]);
      }
      return;
    }
    if (node.left !== null) {
      dfs(node.left, r);
      path.pop();
    }
    if (node.right !== null) {
      dfs(node.right, r);
      path.pop();
    }
  };

  dfs(root, res);

  return ans;
};

// 复原ip地址
const a40 = s => {
  const path = [];
  const ans = [];
  const n = s.length;

  const dfs = i => {
    if (path.length >= 4) return;
    if (i === n) {
      if (path.length !== 3) return;
      const pre = path.length === 0 ? 0 : path[path.length - 1];
      const tmp = Number(s.substring(pre, i));
      if (tmp <= 255) {
        path.push(n);
        const arr = [];
        for (let j = 0; j < path.length; j++) {
          const preIndex = j === 0 ? 0 : path[j - 1];
          arr.push(s.substring(preIndex, path[j]));
        }
        ans.push(arr.join('.'));
        path.pop();
      }
      return;
    }

    if (s[i - 1] === '0' && (i - 1 === 0 || path[path.length - 1] === i - 1)) {
      path.push(i);
      dfs(i + 1);
      path.pop();
      return;
    }
    const pre = path.length === 0 ? 0 : path[path.length - 1];
    const tmp = Number(s.substring(pre, i));
    if (tmp > 255) return;
    dfs(i + 1);
    path.push(i);
    dfs(i + 1);
    path.pop();
  };
  dfs(1);

  return ans;
};

// 二叉树的层序遍历 II

const a41 = root => {
  if (root === null) return [];
  const ans = [];
  let cur = [root];

  while (cur.length) {
    const vals = [];
    const nxt = [];
    for (let item of cur) {
      vals.push(item.val);
      if (item.left) nxt.push(item.left);
      if (item.right) nxt.push(item.right);
    }
    ans.push(vals);
    cur = nxt;
  }

  ans.reverse();
  return ans;
};

// 99. 恢复二叉搜索树
const a42 = root => {
  let first = null;
  let second = null;
  let pre = -Infinity;
  let firstIndex = -1;
  const list = [];

  const f = node => {
    if (node === null) return;
    f(node.left);
    list.push(node);
    f(node.right);
  };
  f(root);

  for (let i = 0; i < list.length; i++) {
    pre = i === 0 ? -Infinity : list[i - 1].val;
    if (list[i].val < pre) {
      if (first === null) {
        first = list[i - 1];
        firstIndex = i - 1;
      } else {
        second = list[i];
      }
    }
  }

  if (second === null) {
    second = list[firstIndex + 1];
  }
  [first.val, second.val] = [second.val, first.val];
};

const a43 = n => {
  const ans = [];
  const path = new Array(2 * n).fill('');

  const dfs = (i, open) => {
    if (i === 2 * n) {
      ans.push(path.join(''));
      return;
    }

    if (open < n) {
      path[i] = '(';
      dfs(i + 1, open + 1);
    }
    if (i - open < open) {
      path[i] = ')';
      dfs(i + 1, open);
    }
  };
  dfs(0, 0);
  return ans;
};

const a44 = function (num1, num2) {
  if (num1 === '0' || num2 === '0') return '0';
  const n = num1.length;
  const m = num2.length;
  const f = new Array(m + n).fill(0);

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      const mul = num1[i] * num2[j];
      // 进位的那一位
      const jinwei = i + j;
      // 当前的位置
      const cur = i + j + 1;
      // 计算的结果要加上当前位置在上一次计算得到的进位值
      const sum = mul + f[cur];
      f[jinwei] = f[jinwei] + Math.floor(sum / 10);
      f[cur] = sum % 10;
    }
  }
  if (f[0] == 0) f.shift();
  return f.join('');
};

// 106. 从中序与后序遍历序列构造二叉树
const a45 = (inorder, postorder) => {
  const map = new Map();
  const n = inorder.length;
  for (let i = 0; i < n; i++) {
    map.set(inorder[i], i);
  }
  let index = n - 1;

  const dfs = (start, end) => {
    if (start > end) return null;
    const rootVal = postorder[index];
    const mid = map.get(rootVal);
    const root = new TreeNode(rootVal);
    index--;
    root.right = dfs(mid + 1, end);
    root.left = dfs(start, mid - 1);
    return root;
  };
  return dfs(0, n - 1);
};
// 007. 三数之和
const a46 = nums => {
  const ans = [];
  const n = nums.length;
  nums.sort((a, b) => a - b);
  for (let i = 0; i < n - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) {
      continue;
    }
    let l = i + 1;
    let r = n - 1;
    while (l < r) {
      if (l > i + 1 && nums[l] === nums[l - 1]) {
        l++;
        continue;
      }
      if (r < n - 1 && nums[r] === nums[r + 1]) {
        r--;
        continue;
      }
      const res = nums[i] + nums[l] + nums[r];
      if (res === 0) {
        ans.push([nums[i], nums[l], nums[r]]);
        l++;
        r--;
      } else if (res > 0) {
        r--;
      } else {
        l++;
      }
    }
  }
  return ans;
};

// 236. 二叉树的最近公共祖先
const a47 = (root, p, q) => {
  const dfs = (node, p, q) => {
    if (node === null || p === node || q === node) return node;
    const left = dfs(node.left, p, q);
    const right = dfs(node.right, p, q);
    if (left && right) return node;
    if (left) return left;
    return right;
  };
  return dfs(root, p, q);
};

// 235. 二叉树搜索树的最近公共祖先
const a48 = (root, p, q) => {
  const val = root.val;
  if (p.val < val && q.val < val) {
    return a48(root.left, p, q);
  }
  if (p.val > val && q.val > val) {
    return a48(root.right, p, q);
  }
  return root;
};

const a49 = s => {
  const ans = [];
  const path = [];
  const n = s.length;
  const isHui = s => {
    const tmpS = s.split('').reverse().join('');
    return tmpS === s;
  };

  const dfs = (i, pre) => {
    if (i === n) {
      if (path.length && pre === n) {
        ans.push([...path]);
      }
      return;
    }

    dfs(i + 1, pre);
    const str = s.substring(pre, i + 1);
    if (isHui(str)) {
      path.push(str);
      dfs(i + 1, i + 1);
      path.pop();
    }
  };

  dfs(0, 0);

  return ans;
};

// 41. 缺失的第一个正数
const a50 = nums => {
  const n = nums.length;
  // 先将负数处理成一个后面不用理会的数字，比n大就可以，这里处理成了n+1
  for (let i = 0; i < n; i++) {
    if (nums[i] <= 0) {
      nums[i] = n + 1;
    }
  }
  // 将正整数1~n映射到数字0~n-1，如果碰到了，就将对应index的值处理成负数就可以了
  for (let i = 0; i < n; i++) {
    let item = Math.abs(nums[i]);
    if (item >= 1 && item <= n) {
      nums[item - 1] = -Math.abs(nums[item - 1]);
    }
  }
  // 哪一个index的值不是负数，那么就说明上一次的遍历中没有访问到，那么就是有问题的那个数字
  for (let i = 0; i < n; i++) {
    if (nums[i] > 0) return i + 1;
  }
  return n + 1;
};

// 124. 二叉树中的最大路径和
const a51 = root => {
  let ans = -Infinity;
  const dfs = node => {
    if (node === null) return 0;
    const val = node.val;
    const left = dfs(node.left);
    const right = dfs(node.right);
    // 这里计算的这个res是开放的，可以被其父节点连接计算，如果计算了val + left + right，那么就不能被父节点连接计算了
    const res = Math.max(val, val + left, val + right);
    // 这里计算的是所有可能路径下的最大值
    ans = Math.max(res, ans, val + left + right);
    return res;
  };

  dfs(root);
  return ans;
};

// 239. 滑动窗口最大值

const a53 = (nums, k) => {
  const n = nums.length;
  // queue 用来存储当前窗口内的下标，且是递减的顺序，如果有比当前遍历到的下标的值小的下标，会被剔除出去，不属于当前窗口内的下标也会被剔除出去
  const queue = [];
  const ans = [];
  for (let i = 0; i < n; i++) {
    // 比当前遍历到的下标的值小的下标会被剔除出去
    while (queue.length && nums[i] > nums[queue[queue.length - 1]]) {
      queue.pop();
    }
    queue.push(i);
    // 不属于当前窗口内的下标会被剔除出去
    if (i - queue[0] >= k) {
      queue.shift();
    }
    // 从窗口内包含的值大于k个开始存储答案
    if (i > k - 1) {
      ans.push(nums[queue[0]]);
    }
  }
  return ans;
};

// 1143. 最长公共子序列
const a54 = (text1, text2) => {
  const n = text1.length;
  const m = text2.length;
  const f = new Array(n).fill(0).map(() => new Array(m).fill(false));

  const dfs = (i, j) => {
    if (i === n || j === m) {
      return 0;
    }
    if (f[i][j] !== false) return f[i][j];

    if (text1[i] === text2[j]) {
      f[i][j] = dfs(i + 1, j + 1) + 1;
      return f[i][j];
    }
    f[i][j] = Math.max(dfs(i + 1, j), dfs(i, j + 1));
    return f[i][j];
  };

  return dfs(0, 0);
};

// 516. 最长回文子序列
const a55 = s => {
  const n = s.length;
  // f 是用来记录2个下标之间的最长回文子序列的长度
  const f = new Array(n).fill(0).map(() => new Array(n).fill(false));
  const dfs = (i, j) => {
    if (f[i][j] !== false) return f[i][j];
    // 如果起始下标大于结束下标，那么长度为0
    if (i > j) return (f[i][j] = 0);
    // 如果起始下标等于结束下标，那么长度为1
    if (i === j) {
      return (f[i][j] = 1);
    }
    if (s[i] === s[j]) {
      f[i][j] = dfs(i + 1, j - 1) + 2;
    } else {
      f[i][j] = Math.max(dfs(i + 1, j), dfs(i, j - 1));
    }
    return f[i][j];
  };
  return dfs(0, n - 1);
};

// 337. 打家劫舍 III
const a56 = root => {
  // 每次返回的是选和不选当前节点的最大值
  const dfs = node => {
    if (node === null) return [0, 0];
    const [chooseL, notChooseL] = dfs(node.left);
    const [chooseR, notChooseR] = dfs(node.right);
    const val = node.val;
    // 如果选择了当前节点，那么左右节点就都不能选
    const choose = val + notChooseL + notChooseR;
    // 如果没有选择当前节点，那么左右节点可以选也可以不选
    const notChoose = Math.max(
      chooseL + chooseR,
      chooseL + notChooseR,
      notChooseL + chooseR,
      notChooseL + notChooseR
    );
    return [choose, notChoose];
  };
  const [choose, notChoose] = dfs(root);
  return Math.max(choose, notChoose);
};

// 131. 分割回文串
const a57 = s => {
  const n = s.length;
  const ans = [];
  const path = [];

  const isHui = str => {
    const str2 = str.split('').reverse().join('');
    return str === str2;
  };

  const dfs = i => {
    if (i === n && path.length) {
      ans.push([...path]);
      return;
    }

    for (let j = i; j < n; j++) {
      const str = s.substring(i, j + 1);
      if (isHui(str)) {
        path.push(str);
        dfs(j + 1);
        path.pop();
      }
    }
  };

  dfs(0);
  return ans;
};

// 88. 合并两个有序数组
const a58 = function (nums1, m, nums2, n) {
  let p = m + n - 1;
  let p1 = m - 1;
  let p2 = n - 1;
  while (p >= 0) {
    if (p1 < 0 || nums1[p1] < nums2[p2]) {
      nums1[p] = nums2[p2];
      p2--;
    } else {
      nums1[p] = nums1[p1];
      p1--;
    }
    p--;
  }
  return nums1;
};

// 前端实现并发请求数量控制

const concurrencyRequest = (urls, maxNum) => {
  return new Promise(resolve => {
    if (urls.length === 0) {
      resolve([]);
      return;
    }
    const results = [];
    let index = 0; // 下一个请求的下标
    let count = 0; // 当前请求完成的数量

    // 发送请求
    async function request() {
      if (index === urls.length) return;
      const i = index; // 保存序号，使result和urls相对应
      const url = urls[index];
      index++;
      console.log(url);
      try {
        const resp = await fetch(url);
        // resp 加入到results
        results[i] = resp;
      } catch (err) {
        // err 加入到results
        results[i] = err;
      } finally {
        count++;
        // 判断是否所有的请求都已完成
        if (count === urls.length) {
          console.log('完成了');
          resolve(results);
        }
        request();
      }
    }

    // maxNum和urls.length取最小进行调用
    const times = Math.min(maxNum, urls.length);
    for (let i = 0; i < times; i++) {
      request();
    }
  });
};

const a59 = root => {
  const dfs = node => {
    if (!node) return [0, 0];
    const [ncL, cL] = dfs(node.left);
    const [ncR, cR] = dfs(node.right);
    return [
      node.val + ncL + ncR,
      Math.max(ncL + ncR, ncL + cR, cL + ncR, cL + cR),
    ];
  };
  const [chooseCur, notChooseCur] = dfs(root);
  return Math.max(chooseCur, notChooseCur);
};

const a60 = pro => {
  return new Promise((resolve, reject) => {
    const ans = [];
    const n = pro.length;
    for (let i = 0; i < n; i++) {
      pro
        .then(res => {
          ans[i] = res;
          if (ans.length === n) {
            resolve(ans);
          }
        })
        .catch(err => {
          reject(err);
        });
    }
  });
};
