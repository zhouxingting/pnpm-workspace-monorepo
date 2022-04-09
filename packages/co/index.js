/** 简易版的co函数 */

const request = function request(value) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ name: value });
    }, 1000);
  });
};

/** co函数
 * next方法可以带一个参数，代表上一个yield的返回值
 */
function* generatorFunc() {
  const res = yield request();
  // console.log(res, "ssssssssss");
}

function coSimple(gen) {
  const genFunc = gen();
  const promise = genFunc.next().value;
  promise.then((res) => {
    genFunc.next(res);
    console.log(genFunc);
  });
}

coSimple(generatorFunc);

/** co简易第二版
 */

function* generatorFunc2(value) {
  const res = yield request();
  console.log(res, "ssssssssss");
  const res1 = yield request();
  console.log(res1, "mmm");
}

function coSimple2(gen) {
  // arguments.slice(1);
  // const a = [];
  /** 因为arguments是一个数组，但是原型链上并没有slice对象 */
  const args = Array.prototype.slice.call(arguments, 1);
  const genFunc = gen(args);

  const promise = genFunc.next().value;
  promise.then((res) => {
    const promise1 = genFunc.next(res).value;
    promise1.then((res) => {
      genFunc.next(res);
    });
  });
}

// coSimple2(generatorFunc2, "我是谁");

/** 简易版第三版
 *
 */
function* generatorFunc3(suffix = "") {
  const res = yield request();
  console.log(res, "generatorFunc-res" + suffix);
  const res2 = yield request();
  console.log(res2, "generatorFunc-res-2" + suffix);
  const res3 = yield request();
  console.log(res3, "generatorFunc-res-3" + suffix);
  const res4 = yield request();
  console.log(res4, "generatorFunc-res-4" + suffix);
}

// function coSimple3(gen) {
//   const args = Array.prototype.slice.call(arguments, 1);
//   const genFunc = gen(args);

//   let next = genFunc.next();

//   while (!next.done) {
//     next = genFunc.next();
//     let promise = next.value;
//     if (promise) {
//       promise.then((res) => {
//         next = genFunc.next(res);
//       });
//     }
//   }
// }

function coSimple3(gen) {
  const ctx = this;
  const args = Array.prototype.slice.call(arguments, 1);

  const genFunc = gen.apply(ctx, args);

  return new Promise((resolve, rejects) => {
    onFulfilled();

    function onFulfilled(res) {
      let ret = genFunc.next(res);
      next(ret);
    }

    function next(ret) {
      if (ret.done) {
        return resolve(ret.value);
      }
      let value = toPromise(ret.value);
      value.then(onFulfilled);
    }
  });
}

function toPromise(obj) {
  if (!obj) return obj;
  if (typeof obj.then === "function") return obj;
  if (obj.constructor && obj.constructor.name === "GeneratorFunction") {
    return coSimple3(obj);
  }
  if (typeof obj === "function") {
    return new Promise((resolve, rejects) => {
      obj((res, err) => {
        console.log("res, err: ", res, err);
        if (err) {
          return rejects(err);
        }
        resolve(res);
      });
    });
  }
}

function sleep(ms) {
  return function (done) {
    setTimeout(done, ms);
  };
}

function* work() {
  yield sleep(50);
  return "yay";
}

function* iterator() {
  var a = yield work;
  console.log("a: ", a);
}

coSimple3(generatorFunc3, "哎呀，我真的是后缀");
coSimple3(iterator, "哎呀，我真的是后缀");
