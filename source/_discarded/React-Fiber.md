title: React Fiber
author: normalHamal
date: 2020-03-03 16:43:36
tags:
---
种数据结构，是内部Fiber树结构的节点。

React Fiber是整个React团队耗时2年，对React核心算法的不断重构所得出的产物，是一个崭新的reconcilition algorithm。

React Fiber的目的是为了提高在动画、layout（浏览器Render tree和painting中间的layout过程）和手势等领域的性能。主要的特性就是**增量渲染**，把渲染任务分割成若干个小块散布在不同的堆栈帧上执行。

其他关键的特性包括将渲染分割成多个事务，更新的时候根据事务优先级来调度执行顺序，以及为了实现调度功能，构造了个虚拟栈(virtual stack)，栈的执行顺序能定制，调度、暂停、终止、复用事务等操作。

## why React Fiber？

搜寻React Fiber的相关资料的过程中，我们总是能发现这么两张图不停地出现在各大博客文章中：

![image-20200126162622909](/Users/wangcong/Documents/Fiber.assets/image-20200126162622909.png)

![image-20200126162642630](/Users/wangcong/Documents/Fiber.assets/image-20200126162642630.png)

大致的意思都是在说，出现Fiber之前，React在执行reconcilition的时候，React 15及之前的函数调用栈深度会一直维持较深的水平，一直霸占主线程，导致更高优先级的任务（比如动画、用户交互等）无法得到https://zhuanlan.zhihu.com/p/98295862

## what is React Fiber？

Fiber翻译为纤维，从整体来看可以理解为这是一根比Thread更细的线，也就是比线程(Thread)控制得更精细的流程控制机制。而从代码设计层面来看Fiber是React内部定义的一即时处理。

而React Fiber会通过将reconcilition过程拆分为更多精细的Fiber, 可以在每执行完一次Fiber时都回到主线程检查是否有更高优先级的任务，如果有就插队处理。

> react的组件更新一般分为2个阶段，reconciliation/render 和 commit.
>
> reconciliation/render: 这一阶段主要是对新旧两棵Virtual Dom树进行对比更新，记录相应的effect(对dom的改动操作，fiber版本可打断）
>
> commit: 这个阶段主要是把上个阶段生成的DOM操作去真正的执行（同步执行，不可打断）。

这个图呢，是出自于Lin Clark在React Conf上的一次演讲，视频地址在：[A Cartoon Intro to Fiber - React Conf 2017](https://www.youtube.com/watch?v=ZCuYPiUIONs)

视频中为了更形象地说明这一现象，还在一开头就用了一个demo来向我们展示正常的react app和react with fiber在复杂应用中的表现（右边是使用了fiber后的react app）：

![Kapture 2020-01-27 at 14.25.28](/Users/wangcong/Documents/Fiber.assets/Kapture 2020-01-27 at 14.25.28.gif)                                                                                                                                                                                                                                                                                                                                                                                                                                    

可以看到右边的动画明显比左边的更流畅。

官方在github上也实现了这么一个demo，链接在此：[React Fiber vs Stack Demo](https://github.com/facebook/react/blob/master/fixtures/fiber-triangle/index.html)，那么下面就这个demo的代码我们开始进一步地探索（官方的demo即使本地执行完依赖安装和build后已经不能用来对比了，因为unstable_deferredUpdates这个方法已经在16.5.0版本中被删除（https://github.com/facebook/react/issues/13488），当然，你只需要把分支切到16.5.0版本之前，然后重新build一下，就可以了）：


我们对比fiber和stack的代码，发现二者的差异只有这么关键[一段代码](https://github.com/facebook/react/blob/master/fixtures/fiber-triangle/index.html#L141)：

```javascript
tick() {
  if (this.state.useTimeSlicing) {
    // Update is time-sliced.
    ReactDOM.unstable_deferredUpdates(() => {
      this.setState(state => ({ seconds: (state.seconds % 10) + 1 }));
    });
  } else {
    // Update is not time-sliced. Causes demo to stutter.
    this.setState(state => ({ seconds: (state.seconds % 10) + 1 }));
  }
}
```

可以看到，fiber的代码相对于stack的代码只是把简单的调用setState改成使用一个匿名函数包含传给unstable_deferredUpdates调用。

而这个unstable_deferredUpdates做了一件事情，就是将传给它的更新任务的优先级设置为NormalPriority：

![image-20200202180952318](/Users/wangcong/Documents/Fiber.assets/image-20200202180952318.png)

```javascript
// ReactDOM
unstable_deferredUpdates: DOMRenderer.deferredUpdates,
// DOMRenderer.deferredUpdates的定义
export function deferredUpdates<A>(fn: () => A): A {
  // TODO: Remove in favor of Scheduler.next
  return runWithPriority(NormalPriority, fn);
}
```

**Fiber Vs Stack Reconciliation**

下面是官方三角demo的在线运行截图（来自另一个github仓库：[react-fiber-vs-stack-demo](https://github.com/claudiopro/react-fiber-vs-stack-demo)，代码和官方的一样，官方的仓库里的demo需要本地执行一次build，才能正常预览，这个仓库相当于把build后的js单独拿了出来）：

[fiber demo](https://claudiopro.github.io/react-fiber-vs-stack-demo/fiber.html)

![image-20200202170200398](/Users/wangcong/Documents/Fiber.assets/image-20200202170200398.png)

[Stack demo](https://claudiopro.github.io/react-fiber-vs-stack-demo/stack.html)

![image-20200202172229728](/Users/wangcong/Documents/Fiber.assets/image-20200202172229728.png)

**延续（探究其它开启异步渲染的方法）**

在看到上述的被废弃之后，我就想那后面的版本就没有能手动开启异步渲染的方式了吗？（默认直到现在，react@16.12.0还未默认开启异步渲染模式）

于是我找到了这篇文章：https://gitissue.com/issues/5b5c5757123bf545356d2ff7

1. unstable_createRoot 开启异步模式
2. unstable_deferredUpdates 设置低优先级，延迟更新
3. unstable_AsyncMode 异步组件

具体验证结果和代码演示可以移步：https://github.com/normalHamal/react-fiber-learning

## How it works？


## last

**增量渲染（异步渲染）还没默认启用！**

> We think async rendering is a big deal, and represents the future of React. To make migration to v16.0 as smooth as possible, we’re not enabling any async features yet, but we’re excited to start rolling them out in the coming months. Stay tuned!



> 参考：
>
> https://github.com/acdlite/react-fiber-architecture
>
> https://reactjs.org/docs/reconciliation.html
>
> https://github.com/claudiopro/react-fiber-vs-stack-demo
>
> https://zhuanlan.zhihu.com/p/84952196
>
> http://www.que01.top/2019/08/28/v16-Scheduling-in-React/
>
> https://www.jishuwen.com/d/2UnE
>
> https://blog.csdn.net/Napoleonxxx/article/details/86568941
>
> https://gitissue.com/issues/5b5c5757123bf545356d2ff7