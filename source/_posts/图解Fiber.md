title: 图解Fiber
author: normalHamal
tags:
  - react
  - fiber
categories:
  - 前端
  - react
date: 2020-06-12 12:25:00
---

![image-20200612112258936](https://static.normalhamal.online/20200612122147.png)

<!-- more -->

## what is React Fiber？


1. 一种数据结构

Fiber翻译为纤维，从整体来看可以理解为这是一根比Thread更细的线，也就是比线程(Thread)控制得更精细的流程控制机制。而从代码设计层面来看Fiber是React内部定义的一种数据结构，是内部Fiber树结构的节点。

2. 一个虚拟的堆栈帧

React Fiber的目的是为了提高在动画、layout（浏览器Render tree和painting中间的layout过程）和手势等领域的性能。主要的特性就是**增量渲染**，把渲染任务分割成若干个小块散布在不同的堆栈帧上执行。

3. 一种崭新的reconciliation（协调）算法

React Fiber是整个React团队耗时2年，对React核心算法的不断重构所得出的产物，是一个崭新的reconcilition algorithm。
## why React Fiber？

搜寻React Fiber的相关资料的过程中，我们总是能发现这么两张图不停地出现在各大博客文章中：![image.png](https://static.normalhamal.online/20200612122148.png)
![image.png](https://static.normalhamal.online/20200612122149.png)
大致的意思都是在说，出现Fiber之前，React在执行reconcilition的时候，React 15及之前的函数调用栈深度会一直维持较深的水平，一直霸占主线程，导致更高优先级的任务（比如动画、用户交互等）无法得到即时处理。原因就是之前的react会在每次组件更新的时候递归地去更新它的所有子组件。
而React Fiber会通过将reconcilition过程拆分为更多精细的Fiber, 可以在每执行完一次Fiber时都回到主线程检查是否有更高优先级的任务，如果有就插队处理。

> react的组件更新一般分为2个阶段，reconciliation/render 和 commit.
> reconciliation/render: 这一阶段主要是对新旧两棵Virtual Dom树进行对比更新，记录相应的effect(对dom的改动操作，fiber版本可打断）
> commit: 这个阶段主要是把上个阶段生成的DOM操作去真正的执行（同步执行，不可打断）。

![image.png](https://static.normalhamal.online/20200612122150.png)
上面的几张图都是出自于Lin Clark在React Conf上的一次演讲，视频地址在：[A Cartoon Intro to Fiber - React Conf 2017](https://www.youtube.com/watch?v=ZCuYPiUIONs)
视频里面也用了一个动态图来向我们展示了加入fiber(并开启异步渲染)后的react app和正常的react app在大量setState时的一个动画流畅性展示：
官方在github上也实现了这么一个demo，链接在此：[React Fiber vs Stack Demo](https://github.com/facebook/react/blob/master/fixtures/fiber-triangle/index.html)
下面是官方三角demo的在线运行状况（来自另一个github仓库：[react-fiber-vs-stack-demo](https://github.com/claudiopro/react-fiber-vs-stack-demo)，代码和官方的一样，官方的仓库里的demo需要本地执行一次build，才能正常预览，这个仓库相当于把build后的js单独拿了出来）：
[fiber demo](https://claudiopro.github.io/react-fiber-vs-stack-demo/fiber.html)![image-20200202170200398.png](https://static.normalhamal.online/20200612122151.png)
[Stack demo](https://claudiopro.github.io/react-fiber-vs-stack-demo/stack.html)
![image-20200202171211976.png](https://static.normalhamal.online/20200612122152.png)
这里说一下这里的demo代码里都干了些什么事情：

1. 在每一帧渲染之前（通过requestAnimationFrame方法）给最外层的div设置一个缩放的transform，也就是让整个div开启一个不停变大缩小的动画。
1. 设置一个定时器，每过1秒钟就改变一次组件的状态，也就是执行一次setState，并且demo中的所有子组件都会受到影响并re-render一次。


最后的结果是：

1. stack的版本，setState的执行操作一直阻塞主线程（从上面的截图可以看出来），导致requestAnimationFrame回调一直得不到执行，所以动画就变得卡顿了起来。
1. fiber的版本，setState的执行操作并未阻塞主线程（从上面的截图可以看出来），因为它将总的执行任务拆分成了一个个小任务单独进行执行，所以requestAnimationFrame回调顺利地在每16ms得到了一次执行，所以动画就变得流畅了起来。


**增量渲染（异步渲染）默认还未启用！**
> We think async rendering is a big deal, and represents the future of React. To make migration to v16.0 as smooth as possible, we’re not enabling any async features yet, but we’re excited to start rolling them out in the coming months. Stay tuned


**手动开启增量渲染的方法**可以通过下面这几个API（部分已废弃）进行启用：

1. unstable_createRoot 开启异步模式
1. unstable_deferredUpdates 设置低优先级，延迟更新
1. unstable_AsyncMode 异步组件


具体演示结果和代码可以移步：[https://github.com/normalHamal/react-fiber-learning](https://github.com/normalHamal/react-fiber-learning)
### 卡顿的原因
看完上面的demo，我们再来说一下为什么会出现卡顿的现象：

> FPS：（每秒传输帧数(Frames Per Second)），也可以理解为浏览器每秒绘制的次数。



从上图我们可以看到，流畅的fiber版本每帧花费的时间大概在16ms左右，而卡顿的Stack版本平均都需要400多ms。所以，如果我们可以让每一帧花费的时间少一点，尽量控制在16ms（60FPS对肉眼来说就已经是很高的刷新率了，并且现在一般的显示器刷新率也是60HZ，16ms ～= 1000ms / 60）左右，那么网页就不会出现卡顿甚至是无响应的状态了。

下面是每一帧的一个生命周期，从这里我们也可以看出来，**只要在paint之前的任何一个步骤执行时间过长**，都会导致后面的paint被阻塞，直观地说就是页面的响应时间过长甚至无响应。

![image.png](https://static.normalhamal.online/20200612122153.png)


### 增量渲染（时间分片）vs 全量渲染

我们再看到下面这个2个例子，这能帮助我们更简单地感受和理解增量渲染地意义：**全量渲染，每在输入框触发一次输入事件，就会一次性往页面添加10000个div节点。**
<iframe height="400" style="width: 100%;" scrolling="no" title="增量渲染" src="https://codepen.io/normalHamal/embed/yLeOPgR?height=265&theme-id=default&default-tab=js,result" frameborder="no" allowtransparency="true" allowfullscreen="true">
  See the Pen <a href='https://codepen.io/normalHamal/pen/yLeOPgR'>增量渲染</a> by normalHamal
  (<a href='https://codepen.io/normalHamal'>@normalHamal</a>) on <a href='https://codepen.io'>CodePen</a>.
</iframe>
**增量渲染，每在输入框触发一次输入事件，就会分100次并且间隔40ms地往页面添加100个div节点，也就是总的还是添加10000个div节点。**

<iframe height="400" style="width: 100%;" scrolling="no" title="setTimeout" src="https://codepen.io/normalHamal/embed/VwearzK?height=265&theme-id=default&default-tab=js,result" frameborder="no" allowtransparency="true" allowfullscreen="true">
  See the Pen <a href='https://codepen.io/normalHamal/pen/VwearzK'>setTimeout</a> by normalHamal
  (<a href='https://codepen.io/normalHamal'>@normalHamal</a>) on <a href='https://codepen.io'>CodePen</a>.
</iframe>

通过上述例子里面的2份代码演示效果对比，明显能感觉到增量渲染的体验更好一点。因为同一帧里执行10000次创建dom元素并且添加到页面上太耗时了，虽然浏览器现在已经做了优化，不会真的渲染10000次，而是会合并到一起再更新，但还是耗时534ms，在这段时间内，页面不会出现带颜色的块，而且输入框也无法输入。

所以到这里我们已经弄清楚了为何需要引入fiber的一个重要原因：实现增量渲染，至于引入fiber之后所带来的其他新特性已经想要实现的主要目标可以看这里：[https://reactjs.org/docs/codebase-overview.html#fiber-reconciler](https://reactjs.org/docs/codebase-overview.html#fiber-reconciler)

## How does it work?
前面有提到react的组件更新一般分为2个阶段，reconciliation/render 和 commit。在reconciliation/render阶段，React 会更新组件的state和props，调用生命周期钩子，比对VirtualDOM，记录effect。所以这整个阶段是无任何副作用的，也就是这一阶段并不会立即去更新dom，所以它是可打断的，如果要实现增量任务或者说异步任务，那就只能在这一阶段进行了。

所以react就将这个阶段的任务进行了分解，在每一帧的生命周期里，尽可能地去执行每个分解后的任务，一旦剩余时间不够了，就立即中止，等到下一次主线程有空闲时间了，再继续执行。并且这里面还涉及到一个优先级的问题，因为就像上面例子所展示的那样，很多时候我们需要优先处理并响应用户的交互事件或者动画，所以这里面需要思考的2个地方就是：

1. 如何分解
1. 如何调度


> 以下代码均基于react@16.12.0且默认为concurrent Mode

### 分解
#### 如何拆分成子任务？
我们先看之前的react是如何执行render和update的：从root组件开始同步递归地进行遍历每个子组件，然后对它们进行VirtualDOM的对比，收集变动信息，最后commit变动到页面上。

既然要拆，那这种同步递归的模型就不适用了，因为这种依赖于调用栈的遍历方式不能随意中断、也很难被恢复, 不利于异步处理。 这种调用栈，不是程序所能控制的， 如果你要恢复递归现场，可能需要从头开始, 恢复到之前的调用栈。

所以我们需要对React现有的数据结构进行调整，模拟函数调用栈, 将之前需要递归进行处理的事情分解成增量的执行单元，将递归转换成迭代。也就是下面的Fiber结构了。

#### Fiber
每一个fiber节点对应一个单独的vDOM Node（替代了原先的vDOM），并且所有的fiber节点，串联起来就是一个链表结构了，每个组件实例和每个DOM节点抽象表示的实例都是一个工作单元。工作循环中，每次处理一个fiber，处理完可以中断/挂起整个工作循环。具体的fiber结构是这么来实现的：**![image.png](https://static.normalhamal.online/20200612122154.png)**
#### Fiber Tree
通过上述的结构（child、sibling、return）我们可以串联出一棵基于fiber node的树形结构：![image.png](https://static.normalhamal.online/20200612122155.png)
#### 虚拟的堆栈帧
可以看到，每个fiber里面存储了大量的可用信息，要知道我们不使用典型的同步递归模型，只是因为我们没法随意控制。所以fiber的出现是为了模拟函数调用栈，做到可随意中断和恢复，它也被称为虚拟栈帧，你可以拿它和函数调用栈类比一下, 两者结构非常像:

|  | 函数调用栈 | Fiber |
| --- | --- | --- |
| 基本单位 | 函数 | Virtual DOM 节点 |
| 输入 | 函数参数 | Props |
| 本地状态 | 本地变量 | State |
| 输出 | 函数返回值 | React Element |
| 下级 | 嵌套函数调用 | 子节点(child) |
| 上级引用 | 返回地址 | 父节点(return) |

### 调度
#### requestIdleCallback
这个方法会将传入的回调函数在事件循环空闲的时候调用。其实也就是上面分析卡顿的原因里面说过：**只要在paint之前的任何一个步骤执行时间过长，都会阻塞渲染。**所以requestIdleCallback的执行时机就是在paint之后的剩余时间里执行。

**Polyfill**requestIdleCallback兼容性很差。所以React 使用了 polyfill 的方案。这里我们看到react@16.12.0版本中用到的scheduler包里的替代方案是：MessageChannel（Dom环境下，非Dom环境下用的setTimeout）。之前有的版本是利用requestAnimationFrame来的模拟的。

**MessageChannel**特性：消息监听的回调函数的调用时机是在一帧的paint完成之后，这样也就保证了回调是在一帧的paint结束后的剩余时间来执行，这和requestIdleCallback的执行时机是类似的，只是它没有超时的逻辑，所以这里需要手动polyfill。
具体polyfill逻辑为（只讲Dom环境下）：

1. 首先创建一个MessageChannel，port2用来发送消息，port1用来监听消息。



```javascript
const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;
```

2. 当开始调度时，port2向port1发送一条空消息，这里不区分消息类型，只要port1监听到有消息过来，就立即开始调度。`port.postMessage(null);`
2. 然后先设置一个**deadline**时间，因为我们不能让每个任务肆无忌惮地执行，我们需要保持每一帧的执行时间维持稳定，这样才能让整个页面的动画和交互显得流畅。这里的`deadline = currentTime + 5ms`。当然这并不是说每隔5ms就中断一次当前正在执行的任务，而是每执行完一个任务单元，就会开始判断是否超过了deadline，一旦超过了**deadline**时间，立马中断执行，将执行权交还给浏览器，同时重新向port1发送一条空消息，如果这个时候浏览器向事件队列插入了一个渲染任务（paint），那么我们就在paint之后开始调度，否则说明还有空闲时间，我们就继续我们的调度。![image.png](https://static.normalhamal.online/20200612122156.png)
#### 调度过程
虽然有了这么一个调度的方法，但是我们还需要考虑一个优先级的问题。上面我们说过动画、layout是高优先级的任务，所以需要优先被执行，那么假设我们程序当中就是会有要比它们更高优先级执行的呢，或者虽然都是render和update，屏幕外的内容和当前视野中的内容就一定是同优先级的么，或者手动创建的需要被优先对待的交互类操作，所以这里就需要一个调度器，来代替浏览器对任务进行调度。

这里react的做法是：把渲染更新过程拆分成多个子任务，每次只做一小部分，做完看是否还有剩余时间，如果有继续下一个"最高优先级"的任务；如果没有，挂起当前任务，将时间控制权交给主线程，等主线程不忙的时候再继续执行。

#### **任务的优先级渲染？**
下面是react现在的任务优先级定义：这里react有一个优先级常量定义，scheduler也有一个对应的常量定义，通过reactPriorityToSchedulerPriority方法进行转换。
**ReactPriorityLevel：**
```javascript
export const ImmediatePriority: ReactPriorityLevel = 99;
export const UserBlockingPriority: ReactPriorityLevel = 98;
export const NormalPriority: ReactPriorityLevel = 97;
export const LowPriority: ReactPriorityLevel = 96;
export const IdlePriority: ReactPriorityLevel = 95;
// NoPriority is the absence of priority. Also React-only.
export const NoPriority: ReactPriorityLevel = 90;
```
**SchedulerPriorityLevel：**
```javascript
export const NoPriority = 0; // 没有优先级，一些任务初始化的时候可能会用到
export const ImmediatePriority = 1; // 这个优先级的任务会同步执行, 或者说要马上执行且不能中断
export const UserBlockingPriority = 2; // 这些任务一般是用户交互的结果, 需要即时得到反馈
export const NormalPriority = 3; // 默认优先级，不需要立即响应的
export const LowPriority = 4; // 可以延迟执行，但是最终必须执行的更新。
export const IdlePriority = 5; // 视情况更新，不是所有场景下都需要执行
```


下面是各优先级对应的timeout时间：

```javascript
// Max 31 bit integer. The max integer size in V8 for 32-bit systems.
// Math.pow(2, 30) - 1
// 0b111111111111111111111111111111
var maxSigned31BitInt = 1073741823;

// Times out immediately
var IMMEDIATE_PRIORITY_TIMEOUT = -1;
// Eventually times out
var USER_BLOCKING_PRIORITY = 250;
var NORMAL_PRIORITY_TIMEOUT = 5000;
var LOW_PRIORITY_TIMEOUT = 10000;
// Never times out
var IDLE_PRIORITY = maxSigned31BitInt;
```


**ExpirationTime:**
```javascript
export const NoWork = 0;
export const Never = 1;
export const Idle = 2;
export const Sync = MAX_SIGNED_31_BIT_INT; // Math.pow(2, 30) - 1
export const Batched = Sync - 1;
```
而expirationTime就是用来区分任务优先级的一个重要属性了：**这里要注意区分，scheduler里面的task的expirationTime是越小优先级越高的，而react fiber里面的每个Update的expirationTime却是越大优先级越高。**![image.png](https://static.normalhamal.online/20200612122157.png)
#### 构建workInProgress tree
![image.png](https://static.normalhamal.online/20200612122158.png)在最开始的时候也就是第一次执行ReactDom.render的时候会生成一颗完整的fiberTree，也就是上图的左边那棵树，也就是前面说过的由每一个vdom节点对应的fiber节点连接而成的。

而右边这棵树，我们叫它workInProgress tree，它是在更新过程也就是reconciliation中根据输入数据以及现有的fiber tree构造出来的新的fiber tree(workInProgress tree)。
既然fiber的出现替代了之前的vdom结构，那么我们可以很容易的看出来构建workInProgress tree的过程其实就是vdom diff的过程。具体的执行过程如下：![image.png](https://static.normalhamal.online/20200612122159.png)
这里需要注意的几个地方就是：在构建workInProgress tree之后，每一个fiber对象的alternate会指向workInProgress tree中对应的workInProgress fiber，而workInProgress fiber的alternate也会指向此对象。这种互相持有引用的目的是为了复用，等到再次创建workInProgress节点时优先取alternate，没有的话再创建新的fiber节点。

当workInProgress tree完全生成好之后，只需要将FiberRoot的current指向workInProgress tree的root，丢掉旧的fiber tree。这里使用到的是双缓冲技术(double buffering)。旧fiber作为新fiber更新的预留空间，新fiber对旧fiber持有引用，以达到复用fiber实例的目的。

如果对这个流程有看不懂的地方，或者说仅仅只想看这整个流程中workInProgress的流向，可以看下这个例子：[打开控制台查看输出日志](https://sdp-9gvztq5o3.now.sh/)
代码如下（在react-dom的代码中埋入了打印workInProgress和nextEffect的代码，感兴趣可以到[这里](https://github.com/normalHamal/react-fiber-learning/blob/debug-for-reconciliation/js/react-dom.development.js#L23679)查看埋入的代码）：
```jsx
const List = (props) => {
  return (
    <React.Fragment>
    {Array.from({ length: props.len }).map((_, i) => (<div key={i}>{i}</div>))}
    </React.Fragment>
  )
}

class App extends React.Component {
  constructor() {
    super();
    this.state = { len: 0 };
  }

  handleClick() {
    this.setState((state) => ({ len: state.len + 1 }));
  }

  onDelete() {
    this.setState((state) => ({ len: state.len - 1 }));
  }

  render() {
    const { len } = this.state;

    return (
      <React.Fragment>
        <div>{len}</div>
        <button onClick={this.handleClick.bind(this)}>increasing</button>
        <button onClick={this.onDelete.bind(this)}>delete</button>
        <List len={len} />
      </React.Fragment>
    );
  }
}

ReactDOM.createRoot(
  document.getElementById('container')
).render(<App />);
```

第一次render：![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2020/png/244554/1586799549039-6d87aea2-cebd-4dac-8971-e5b9ba4f4a3f.png#align=left&display=inline&height=994&margin=%5Bobject%20Object%5D&name=image.png&originHeight=994&originWidth=1146&size=901066&status=done&style=none&width=1146)第一次setState（点击increasing按钮，记得先清空一次控制台再点击按钮，防止第一次render的日志影响分析）:![F24D6681-057D-49D7-8590-4807BEA3ACF2.png](https://static.normalhamal.online/20200612122200.png)
#### **当任务被中断，如何恢复？**
既然说到任务会被中断，那么具体是怎样个中断法，以及任务被中断后，整个reconciliation过程如何恢复？
首先我们需要对**任务**有一个清晰的认知。上面我们说到每一个fiber节点都代表一个工作（任务）单元，但在整个react的调度中，每一次更新的过程都只是一个**大任务**，它是由所有此次更新而需要变更的dom对应的fiber节点代表的子任务组成的。那么在一个react app运行的过程中，可能会出现多个**大任务**同时存在的情况，也就是多次更新同时发生，并且它们还可能会有不同的任务优先级（上面提到的优先级概念）。
我们先看一张大图，也就是整个中断过程会经历的方法或者说路径：![image.png](https://static.normalhamal.online/20200612122201.png)**首先我们所说的任务被中断应该分为2种情况**：

1. 默认分配的时间片到期了，所以任务被中断。
1. 突然插入的高优先级任务打断了正在进行的低优先级，所以低优先级任务被中断。

**第一种情况：**路线图如下：![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2020/png/244554/1591769562185-69bc8ffa-300e-4d57-bd25-7c1996d8b0c5.png#align=left&display=inline&height=931&margin=%5Bobject%20Object%5D&name=image.png&originHeight=931&originWidth=1614&size=348902&status=done&style=none&width=1614)实际运行时的堆栈图如下：![image.png](https://static.normalhamal.online/20200612122202.png)
整个流程就是：

在遍历整个fiber tree时，每当一个fiber节点上的任务被处理完成后，就会调用shouldYield方法来查询一遍当时时间片是否耗尽或者出现了比当前任务优先级更高的任务，这里我们说的第一种情况专指时间片耗尽的情况。然后再判断当前任务是否已完成，已完成则把它pop出整个task队列，否则就中止当前的任务，将主线程的执行权交还给浏览器，并且因为当前任务还未完成，所以我们需要在浏览器空闲后继续恢复执行当前任务，这里的恢复逻辑就是上面所说的MessageChannel实现了，只需要向port1发送一条Message，port1监听到有消息过来，就会立即开始调度，而具体调度的回调则是保存在一个变量scheduledHostCallback中，因为只有在判断当前任务已完成后才会把scheduledHostCallback置为null，所以这里我们取到的scheduledHostCallback还是上一次未完成的任务的callback。并且由于任务并没有被pop出去，所以我们还是可以这个任务重新开始。

那么这个中断恢复对于fiber tree的遍历来说，将会从上次中断的地方重新开始。这里存在一个这样的判断：**如果当前fiberRoot或者expirationTime相对于中断前已经发生了改变，那么将丢弃现有堆栈（workInProgressTree）并准备新的堆栈（workInProgressTree）。 否则，将从中断的地方继续。**而变量workInProgress就是用来帮助我们缓存上一次中断的fiber节点实例对象的。

**第二种情况：**

低优先级任务被抢占后会调用cancelCallback将它的callback设置为null，那么设置为null之后会怎样呢？通过查看workLoop的代码你可以看到，callback为null的task会在轮到它执行时被pop出taskQueue，所以低优先级的任务将会在高优先级任务完成后就这样被踢出任务队列务。那么低优先级的任务就这样被销毁了吗？当然不是，我们上面说过fiber的出现就是为了保证任务被中断后还能再恢复执行。所以从上面的大图你可以看到任务被cancel后，会重新执行unstable_scheduleCallback创建一个新的调度任务，这样就保证了低优先级任务在被抢占后还是能恢复执行的。而重新执行unstable_scheduleCallback便意味着，此次调度将从root重新开始！

具体流程或者说效果，我们可以从这个例子得到验证：例子在此：[打开控制台查看输出日志](https://sdp-c96r20ib8.now.sh/)
这个例子在说明高优先级任务抢占低优先级任务的同时还验证了另一件事情：

> 以下生命周期函数被指出在异步渲染的过程中可能会执行多次：
> - `componentWillMount`
> - `componentWillReceiveProps`
> - `componentWillUpdate`

源码在此：
```jsx
class Low extends React.Component {
  componentWillUpdate(nextProps) {
    console.log('%c componentWillUpdata fired', 'color: #fff;background: #6190e8;', nextProps);
  }

  componentWillMount() {
    console.log('%c componentWillMount fired', 'color: #fff;background: #6190e8;');
  }

  componentWillReceiveProps(args) {
    console.log('%c componentWillReceiveProps fired', 'color: #fff;background: #6190e8;', args);
  }

  render() {
    const { props } = this;

    return (
      <React.Fragment>
      {Array.from({ length: 100 }).map((_, i) => (<div key={i}><h2>{props.text}-{i}</h2></div>))}
      </React.Fragment>
    )
  }
}

class App extends React.Component {
  constructor() {
    super();
    this.state = { text: '' };
  }

  handleClick() {
    Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
      console.log('%c 插入低优先级任务 B', 'color: #fff;background: #898b17;');
      this.setState(state => ({
        text: state.text + 'B'
      }));
    });

    Scheduler.unstable_scheduleCallback(Scheduler.unstable_UserBlockingPriority, () => {
      console.log('%c 插入高优先级任务 A', 'color: #fff;background: #898b17;');
      this.setState(state => ({
        text: state.text + 'A'
      }));
    }, {
      delay: 10
    });
  }

  render() {
    const { text, isShow } = this.state;

    return (
      <React.Fragment>
        <button onClick={this.handleClick.bind(this)}>开始模拟调度</button>
        <Low text={text} />
      </React.Fragment>
    );
  }
}

ReactDOM.createRoot(
  document.getElementById('container')
).render(<App />);
```
控制台输出日志如下：![image.png](https://static.normalhamal.online/20200612122203.png)从打印的日志可以看出，上述2种生命周期钩子都执行了3次，那么从我们上面的大图流程来讲，也就是低优先级任务B在执行的时候，已经执行了render前的2种生命周期钩子函数，但突然被高优先级任务A打断，于是它被取消了，但同时又创建了一个新的调度任务，此时我们开始执行调度任务A，等A执行完后我们还会执行一次由B重新创建的任务。所以生命周期钩子一共执行了3遍。（图中为什么最后结果是BA下面有解析）

那么你可能会问为什么componentWillMount没有执行3遍？那当然是因为它本身就是在挂载之前被调用，所以更新并不会使它执行多次，但是它仍然会在异步渲染的模式下有可能执行多次，比如我们可以试着这样改一下代码：

```jsx
render() {
    const { text, isShow } = this.state;

    return (
      <React.Fragment>
        <button onClick={this.handleClick.bind(this)}>开始模拟调度</button>
 -       <Low text={text} />
 +       <Low text={text} key={text} />
      </React.Fragment>
    );
  }
```
这样你就会看到控制台下componentWillMount里打印的日志被输出来3遍。![image.png](https://static.normalhamal.online/20200612122204.png)

**那么为什么调度任务每次都要从root重新开始调度？**

原因很简单，因为每个fiber的优先级都是随时有可能随着每一次更新而发生变化的，但我们对一颗fiber tree的遍历方式却是固定的，从parent流向child、从child流向sibling、再从child或者sibling流回parent，这里面sibling却是不可能往它左边的兄弟child流的，所以我们只有每次都从root开始重新开始遍历，才能保证不会漏掉任何一次更新。

所以这里我们发现，reconcile这个过程耗费的时间还是很大的，因为我们每次更新都还是需要从root重新开始遍历，而反观vue却是可以做到组件级更新。

既然调度任务是带有优先级的，那么是否会由于优先级的原因而导致组件的最终状态完全无法控制？
答案是：不会的。react最终保证了既让高优先级任务插队, 同时也保证了状态更新的时序，即状态必须按照插入顺序进行计算，但任务可以按优先级顺序执行。

这里举一个例子，这个例子也是react源码里ReactUpdateQueue.js文件的注释内容：

```javascript
// For example:
//
//   Given a base state of '', and the following queue of updates
//
//     A1 - B2 - C1 - D2
//
//   where the number indicates the priority, and the update is applied to the
//   previous state by appending a letter, React will process these updates as
//   two separate renders, one per distinct priority level:
//
//   First render, at priority 1:
//     Base state: ''
//     Updates: [A1, C1]
//     Result state: 'AC'
//
//   Second render, at priority 2:
//     Base state: 'A'            <-  The base state does not include C1,
//                                    because B2 was skipped.
//     Updates: [B2, C1, D2]      <-  C1 was rebased on top of B2
//     Result state: 'ABCD'
```
意思就是：
> 假设有一updateQueue为A1 - B2 - C1 - D2；
> A1、B2等代表一个update，其中字母代表state，数字大小代表优先级，1为高优先级；
> 调度任务按高低优先级依次执行，第一次调度是高优先级任务，从头结点firstUpdate开始处理，processUpdateQueue会跳过低优先级的update；
> 则执行的update为A1 - C1，本次调度得到的最终state为AC，baseState为A，queue的firstUpdate指针指向B2，以供下次调度使用；
> 第二次调度是低优先级任务，此时firstUpdate指向B2，则从B2开始，执行的update为
B2 - C1 - D2，最终state将与baseState：A合并，得到ABCD


看不懂没关系，例子在此：[打开控制台查看输出日志](https://sdp-1a0l8e542.now.sh/)源码在此：
```jsx
const Low = (props) => <h2>{props.text}</h2>

class App extends React.Component {
  constructor() {
    super();
    this.state = { text: '' };
  }

  handleClick() {
    // A1 - B2 - C1 - D2
    Scheduler.unstable_runWithPriority(Scheduler.unstable_UserBlockingPriority, () => {
      console.log('%c Insert Update A1', 'color: #fff;background: #6190e8;');
      this.setState(state => ({
        text: state.text + 'A',
      }));
    });

    Scheduler.unstable_runWithPriority(Scheduler.unstable_NormalPriority, () => {
      console.log('%c Insert Update B2', 'color: #fff;background: #6190e8;');
      this.setState(state => ({
        text: state.text + 'B',
      }));
    });

    Scheduler.unstable_runWithPriority(Scheduler.unstable_UserBlockingPriority, () => {
      console.log('%c Insert Update C1', 'color: #fff;background: #6190e8;');
      this.setState(state => ({
        text: state.text + 'C',
      }));
    });

    Scheduler.unstable_runWithPriority(Scheduler.unstable_NormalPriority, () => {
      console.log('%c Insert Update D2', 'color: #fff;background: #6190e8;');
      this.setState(state => ({
        text: state.text + 'D',
      }));
    });
  }

  render() {
    const { text } = this.state;

    return (
      <React.Fragment>
        <button onClick={this.handleClick.bind(this)}>开始模拟调度</button>
        <Low text={text} />
      </React.Fragment>
    );
  }
}

ReactDOM.createRoot(
  document.getElementById('container')
).render(<App />);
```
控制台输出日志如下，可以看到和react源码注释中的例子是一样的执行流程：![image.png](https://static.normalhamal.online/20200612122205.png)

> 参考：
> [https://juejin.im/post/5c70f044f265da2de4507ab9](https://juejin.im/post/5c70f044f265da2de4507ab9)
> [https://blog.csdn.net/Napoleonxxx/article/details/86568941](https://blog.csdn.net/Napoleonxxx/article/details/86568941)
> [https://gitissue.com/issues/5b5c5757123bf545356d2ff7](https://gitissue.com/issues/5b5c5757123bf545356d2ff7)
> [https://juejin.im/post/5dadc6045188255a270a0f85](https://juejin.im/post/5dadc6045188255a270a0f85)
> [https://zhuanlan.zhihu.com/p/35578843](https://zhuanlan.zhihu.com/p/35578843)
> [https://juejin.im/post/5d12c907f265da1b6d4033c5#heading-7](https://juejin.im/post/5d12c907f265da1b6d4033c5#heading-7)
> [https://react.jokcy.me/book/update/expiration-time.html](https://react.jokcy.me/book/update/expiration-time.html)
> [https://segmentfault.com/a/1190000020736966](https://segmentfault.com/a/1190000020736966)