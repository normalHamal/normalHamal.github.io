title: vue-devtools无法inspect子组件的问题
author: normalHamal
tags:
  - vue
categories:
  - vue
date: 2020-05-13 19:48:00
---
# vue-devtools无法inspect子组件的问题

![image.png](https://cdn.normalhamal.online/20200513194232.png)

<!-- more -->

## 场景复现
具体场景这里写了这么一个demo：

<iframe height="665" style="width: 100%;" scrolling="no" title="XWmMpEb" src="https://codepen.io/normalHamal/embed/XWmMpEb?height=265&theme-id=light&default-tab=js,result" frameborder="no" allowtransparency="true" allowfullscreen="true">
</iframe>

<br />打开预览页面：<br />![image.png]( https://oss.normalhamal.online/blog/20200513194231.png)
<br />
<br />![image.png]( https://oss.normalhamal.online/blog/20200513194232.png)
<br />只有一个App组件展示在我们的vue-devtools中，我们无法通过vue-devtools来调试我们后挂载的组件Child。

## 如何解决
简单的做法：<br />![image.png]( https://oss.normalhamal.online/blog/20200513194233.png)
<br />发现这个方法的途径是从vue-devtools的issues中发现了有人提出过同样的问题，最终LinusBorg给出了这样的解决方法：[https://github.com/vuejs/vue-devtools/issues/739#issuecomment-412684177](https://github.com/vuejs/vue-devtools/issues/739#issuecomment-412684177)<br />![image.png]( https://oss.normalhamal.online/blog/20200513194234.png)

## 为何？
首先我们看一下vue-devtools是如何检测页面中的vue组件的：<br />[https://github.com/vuejs/vue-devtools/blob/v5.3.3/packages/app-backend/src/index.js#L232](https://github.com/vuejs/vue-devtools/blob/v5.3.3/packages/app-backend/src/index.js#L232)<br />

### 收集根实例
![image.png]( https://oss.normalhamal.online/blog/20200513194235.png)<br />这里的inFragment我们先不管，因为默认值为false，只有在当某一个vue组件实例的_isFragment属性为true时才会去设置它为true。并且当它的值为true之后，遍历dom的时候就会自动跳过它的字节点了。而这个属性我只在vue1.x的版本中搜到它，也就是后面的版本中已经没有这个属性了。<br />
这个walk函数的作用很简单，就是深度优先遍历Dom节点，从上面的代码可以看到是从document开始的：<br />![image.png]( https://oss.normalhamal.online/blog/20200513194236.png)<br />**那么遍历的边界条件是什么呢？**<br /><br />先说一下这个遍历的目的就是为了从整个dom tree上面找到所有的vue根实例对象，像我们经常写spa应用通常只会初始化一个根实例并将其挂载到body下面的第一个div节点。<br />所以，当我们发现当前遍历到的dom节点就是一个由vue实例渲染出来的时候，我们就可以立刻停止往下遍历了，因为我们只找寻根实例。<br />
这里的processInstance方法就简单贴一下代码，逻辑很简单就是收集根实例对象，在这里会判断下devtools这个开关是否打开：<br />![image.png]( https://oss.normalhamal.online/blog/20200513194237.png)

### 收集子组件
当收集完根实例之后，我们可以看到下面立即执行了一个flush方法，这个flush方法呢就是把当前inspect到的组件详情+当前收集完的所有根实例和其对应的下面所有children构造出来的tree发送到我们的开发者工具中的vue-devtools进行展示。<br />
这里我们只关注它如何收集子组件的：<br />![image.png]( https://oss.normalhamal.online/blog/20200513194238.png)<br />这里的map里面执行的capture方法其实也是我们截图出来的这一段代码所在的地方，也就是这里又是一个递归，而递归的衔接点就是$children。

### 后挂载的组件难道没有成为根组件所构造出来的组件tree中的一员吗？
答案肯定是：是的。<br />原因就是，在组件实例化时，我们都知道会执行initLifecycle、initEvents等操作，那么我们打开initLifecycle的源码：

```javascript
export function initLifecycle (vm: Component) {
  const options = vm.$options

  // locate first non-abstract parent
  let parent = options.parent
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent
    }
    parent.$children.push(vm)
  }

  vm.$parent = parent
  vm.$root = parent ? parent.$root : vm

  vm.$children = []
  vm.$refs = {}

  vm._watcher = null
  vm._inactive = null
  vm._directInactive = false
  vm._isMounted = false
  vm._isDestroyed = false
  vm._isBeingDestroyed = false
}
```

是的，在这一阶段会通过options中传入的parent参数来链接到父组件，并且通过父组件来链接根组件的实例。<br />
**所以，我们到这里已经得到了为什么在文章的最开头给出的demo里面，后挂载的组件为什么在vue-devtools中无法被inspect到的原因。**<br />那么这时候我们又想问了，难道在组件内引入的components就不需要手动设置parent参数了吗？<br />答案肯定是：是的。<br />我们看下被引入的组件是如何初始化并push到父组件的$children数组内的：<br />
首先看到这里，子组件实例化的开始：<br />[https://github.com/vuejs/vue/blob/dev/src/core/vdom/create-component.js#L47](https://github.com/vuejs/vue/blob/dev/src/core/vdom/create-component.js#L47)<br />

```javascript
const child = vnode.componentInstance = createComponentInstanceForVnode(
  vnode,
  activeInstance
)
child.$mount(hydrating ? vnode.elm : undefined, hydrating)
```
这里的activeInstance就是你父组件的实例对象了，然后在createComponentInstanceForVnode里面：<br />

```javascript
export function createComponentInstanceForVnode (
  vnode: any, // we know it's MountedComponentVNode but flow doesn't
  parent: any, // activeInstance in lifecycle state
): Component {
  const options: InternalComponentOptions = {
    _isComponent: true,
    _parentVnode: vnode,
    parent
  }
	...
  return new vnode.componentOptions.Ctor(options)
}
```
这里的Ctor就是在Vue.extend中定义的组件构造函数VueComponent，在这里直接就传入了parent的参数，最后在initInternalComponent中将其转为我们上面讲到的initLifecycle中所需要的$option里面的parent参数，并且在initLifecycle中完成链接父组件、并且通过父组件来链接根组件的实例等操作。

## 额外的东西
首先来一个经典的微前端场景，这里我们假设我们的微前端框架为icestark，我们根据官网的指示，执行以下命令，尝试运行一个demo：<br />

```bash
npm init ice ice-app @icedesign/stark-layout-scaffold
cd ice-app
npm install
npm start
```

当我们成功运行起来我们的主应用，并且打开基于Vue的子应用时：<br />![image.png]( http://oss.normalhamal.online/blog/20200513194239.png)<br />
是的，无法利用vue-devtools来调试我们的子应用，也就是你只能在子应用单独开发的时候使用devtools进行调试，无法在mount进主应用后使用devtools？

no！这里我们可以进行以下步骤进行vue-devtools的强制开启：

1. 在开发者工具中选中我们Vue程序挂载的根节点：

![image.png]( https://oss.normalhamal.online/blog/20200513194240.png)<br />你会发现选中后右边有一个提示 `== $0` ，这意味者你可以在console中直接通过$0来拿到选中的dom节点的引用。

2. 然后打开console，输入以下语句：



```javascript
app = $0.__vue__ // 获取Vue 实例
Vue = app.constructor // 获取vue实例的构造函数(可能是Vue、也可能是VueComponent)
while (Vue.super) { Vue = Vue.super } // 获取 `Vue` 基类，只有基类上有 `Vue.config` 属性
Vue.config.devtools = true // 开启devtools
__VUE_DEVTOOLS_GLOBAL_HOOK__.Vue = Vue
```

这些部分语句你可以从vue-devtools的[官方仓库的README](https://github.com/vuejs/vue-devtools#force-enable-the-devtools)中找到，为什么是部分呢？因为官方给出的语句只是为了让我们强制开启devtools，但是我们这里还需要拿到全局的Vue对象。

3. 输入执行完毕后，关闭开发者工具，然后重新打开开发者工具，你就会发现我们的开发者工具中已经出现Vue的tab标签了：

![image.png]( https://oss.normalhamal.online/blog/20200513194241.png)<br />

`if (Vue.super) { Vue = Vue.super }` 这里为什么要这样写去获取相当于我们 `import Vue from 'vue'` 这样写拿到的Vue对象呢？<br />看代码：[https://github.com/vuejs/vue/blob/v2.6.11/src/core/global-api/extend.js#L33](https://github.com/vuejs/vue/blob/v2.6.11/src/core/global-api/extend.js#L33)<br />

```javascript
Vue.extend = function (extendOptions: Object): Function {
    extendOptions = extendOptions || {}
    const Super = this
		...

    const Sub = function VueComponent (options) { // 这里才是组件实例化时用到的构造函数
      this._init(options)
    }
    Sub.prototype = Object.create(Super.prototype)
    Sub.prototype.constructor = Sub
    Sub.cid = cid++
    Sub.options = mergeOptions(
      Super.options,
      extendOptions
    )
    Sub['super'] = Super // 这里通过super可以拿到Vue
		...
    return Sub
  }
```

**组件的构造函数是：VueComponent，根组件的构造函数才是Vue。只有Vue上面才可以通过打开开关来启动vue-devtools。**<br />这里的if判断是因为，根组件实例的构造器就是Vue，所以假设你一开始选取的就是根组件挂载的dom元素，那对应的构造器函数就是Vue。<br />那么除了通过super去拿到Vue，我们也可以直接通过$root拿到根组件的实例，然后通过它的构造函数去拿到Vue对象。<br />

```javascript
app = $0.__vue__ // 获取Vue 实例
Vue = app.$root.constructor // 获取 `Vue` 基类
Vue.config.devtools = true // 开启devtools
__VUE_DEVTOOLS_GLOBAL_HOOK__.Vue = Vue
```


> 这种方式同样适用于线上环境