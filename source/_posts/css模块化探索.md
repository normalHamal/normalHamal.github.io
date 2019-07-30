title: css模块化探索
author: normalHamal
tags:
  - css
  - BEM
  - OOCSS
  - CSS Modules
categories:
  - 前端
date: 2019-02-13 19:28:00
---
![](http://static.qvjunping.me/20190213193241.png)

# css模块化探索

> "There are only two hard things in Computer Science: cache invalidation and naming things" - Phil Karlton

计算科学中最难的两件事就是命名和缓存失效。所以对于如何构建可维护性和可读性极强的css，一直以来在碰见大型网站或者说网站交互以及样式较为丰富的时候都是需要被考虑到的。

<!-- more -->

幸运的是，如今前端生态较为良好，业界也给出了许多解决方案，像**BEM**、**OOCSS**、**SMACSS**、**CSS Modules**等。

下面我们就来一一探索这些解决方案，看看它们究竟是如何解决了计算科学中最难的命名问题。

# BEM

什么是**BEM**？

**B**（block）**E**（element）**M**（modifier）就是使用类选择器来编写你的样式，同时选择器的命名必须遵循一定的规则`B--E__M`。

下面我将使用**Bootstrap**文档中使用的示例来学习如何使用**BEM**。

## B（block）

一个块就是一个组件，或者说就是一个容器元素，它可以是一个块级元素也可以是一个行内元素。

上面说BEM使用类选择器定义一种样式的原因就是因为**类允许无限的可重复性**，即使是最基本的元素也可能会改变样式。

什么叫可重复性，就是说假设你定义一个类选择器为`button`，然后在里面写上你想设置的css属性，最后你可以在任意一个`button`或者是其它标签上添加类选择器`button`就可以继承它的样式了。你所需要做的仅仅只是加一个`class='button'`或者不加。

## E（element）

元素是块的子节点。为了表明某个东西是一个元素，并且指出它包含在哪个容器中，你需要在块名后面添加`__element`。比如你看到一个类选择器名为`form__row`，你将立即知道`.form`块中有一个`row`元素，并且它位于`.form`内。

例如你或许在**Bootstrap**上看到过这样的代码：

![](http://static.qvjunping.me/carbon2.png)

上面的例子用BEM来写可能会是下面这个样子：

![](http://static.qvjunping.me/carbon3.png)

## M（modifier）

修饰符是指追加在块之后的样式。要使用修饰符，你可以添加`--modifier`到类选择器后面。例如你或许在**Bootstrap**上看到过这样的代码：

![](http://static.qvjunping.me/carbon.png)

上面的`btn`就是指块`button`的基本样式而类似`btn-primary`这样的就相当于对基本的`btn`样式再追加一点修饰。而在**BEM**中，可能就会写成这样：

![](http://static.qvjunping.me/carbon1.png)

## 总结

1. **永远不应该链式命名 BEM 元素**。 如果你的 `class` 最终像这样 `.form__row__input`，你做的事情是非常错误的，因为你完全可以通过再添加一个块来解决。
2. 虽然你看起来**BEM**的写法可能会让你觉得丑陋，就像**prettier**的代码样式刚开始也不被大家所认可的那样，但是它的强大之处在于它能让你的结构更加整齐明朗。
3. 冗长的类选择器命名可以帮组你避免如下麻烦：

```html
<header>
  <div class="logo"></div>
</header>
<footer>
  <div class="logo"></div>
</footer>
```

   如上所述，你在`header`里面有一个logo，在`footer`里面同样有一个logo，但是它们的背景图片却并不相同，所以你可能就得分别对他们编写样式，写出如下的css：

```css
 header .logo { background-image: ... }
 footer .logo { background-image: ... }
```

   但如果你用BEM来写可能就只需要写成这个样子：

```html
<header class="header">
  <div class="header__logo"></div>
</header>
<footer class="footer">
  <div class="footer__logo"></div>
</footer>
```

# OOCSS

什么是**OOCSS**？

O（Object）O（Oriented）CSS就是面向对象的css。**OOCSS**不是一个框架，也不是一种技术，更不是一种新的语言，他只不过是一种方法，一种书写方法，换句话说OOCSS其核心就是用最简单的方式编写最整洁，最于净的CSS代码，从而使代码更具重用性，可维护性和可扩展性。

引用**OOCSS**之父**Nicole Sullivan**话来说， 面向对象的CSS有两个原则：

- 独立的结构和样式
- 独立的容器和内容

其实我们在平常的css编写中也用到过这种方法，只是没有完全地、系统地为我们的网站应用。例如像下面这种代码：

```html
<div class="title"></div>
<div class="content"></div>
<style>
.title {
  margin: 5px;
  font-size: 16px;
  background: red;
  border-bottom: 1px solid black;
}
.content {
  margin: 5px;
  font-size: 14px;
  border-bottom: 1px solid black;
}
</style>
```

我们可能会注意到其中两个类选择器的样式有相同的部分，然后独立出一个`class`：

```html
<div class="title bottom_line"></div>
<div class="content bottom_line"></div>
<style>
.bottom_line {
  border-bottom: 1px solid black;
}
.title {
  margin: 5px;
  font-size: 16px;
  background: red;
}
.content {
  margin: 5px;
  font-size: 14px;
}
</style>
```

但是用**OOCSS**的思想来写一次可能就会写出这样的代码：

```html
<div class="bgred f16 bb1 m5"></div>
<div class="f14 bb1 m5"></div>
<style>
  .bgred { background: red; }
  .f16 { font-size: 16px; }
  .f14 { font-size: 14px; }
  .bb1 { border-bottom: 1px solid black; }
  .m5 { margin: 5px; }
</style>
```

反正就是**独立**出来，结构和样式要分离依赖，容器和内容也要分离依赖，像这种的代码就是不容许出现的：

```css
.container .title { ... }
```

反而会推荐你去使用：

```css
.title { ... }
```

# SMACSS

**SMACSS**代表可伸缩的模块化的CSS结构体系。SMACSS 把 CSS 样式规则分成若干个不同的类别：

**基本(base)：**可以用来定义默认的css样式，比如`reset.css`

**布局(Layout):**  定义页面布局相关的css样式

**模块(Module)：**定义可以复用的模块css样式

**状态(State):**  元素的不同状态。比如不同屏幕尺寸下、点击hover、显示隐藏等状态下的不同样式。

**主题(Them)：**直接全局改变整个布局和模块的样式

对于不同类别的 CSS 样式，SMACSS 有不同的命名规则。基础类别中样式一般使用元素类型选择器，用来规范元素的初始样式。布局类别中的样式一般使用“l-”作为前缀。状态类别中的样式一般使用“is-”作为前缀。而对于不同的模块，则使用模块的名称作为前缀。

# CSS Modules

什么是**CSS Modules**？

所有的class的名称和**动画**的名称默认属于本地作用域的CSS文件。 所以CSS Modules不是一个官方的规范，也不是浏览器的一种机制，它是一种构建步骤中的一个进程。（构建通常需要webpack或者browserify的帮助）。通过构建工具的帮助，可以将class的名字或者选择器的名字作用域化。（类似命名空间化。）

**原理**

通过对不同的类名和**动画**名称进行hash算法，得到独一无二的编译后的类名，例如`webpack`的`css-loader`插件默认的哈希算法是`[hash:base64]`，假设你有这样一个css文件：

```css style.css
.title { color: red; }
```

一个React组件：

```javascript App.js
import React from 'react';
import style from './style.css';

export default () => {
  return (
    <h1 className={style.title}>
      Hello World
    </h1>
  );
};
```

使用webpack打包后：

```html
<h1 class="_3zyde4l1yATCOkgn-DBWEL">
  Hello World
</h1>
```

```css style.css
._3zyde4l1yATCOkgn-DBWEL {
  color: red;
}
```

# 探索得出的结论

**首先，为什么要提倡css模块化？**

浏览器层面上并没什么特性来支持css模块化，对于浏览器来说，css的规则都是全局的，虽然选择器有所谓的权重之分，但是就好像`function`内部也可以定义局部变量一样，`function`的`name`还是会有发生冲突的可能，所以`js`也提倡模块化，理由是一样的，**解决冲突和污染**。

**上面所述的几种css模块化有什么本质区别？**

**BEM**、**OOCSS**、**SMACSS**属于在命名上来规范css，就像开头所说的那样 *“计算科学中最难的两件事就是命名和缓存失效。”*。而**CSS Modules**属于用`js`来管理css的命名，使其具备模块化的能力。

**除了以上几种从命名和动态编译命名的方式外，还有其它方式来玩转css吗？**

有，`CSS in JS`，还没研究过，听说直接放弃了css，用`js`来制定css规则。



以上只是探索，并没有涉及详细使用教程，因为在我看来，没有什么解决方案是最完美的，只有最适合哪个项目的，所以探索的本质就是广度遍历一下，当真正投入使用时再深入。



> 参考文章
>
> [OOCSS——概念篇](https://www.w3cplus.com/css/oocss-concept)
>
> [oocss wiki](https://github.com/stubbornella/oocss/wiki)
>
> [BEM入门](https://www.w3cplus.com/css/css-architecture-1.html)
>
> [CSS Modules 用法教程](http://www.ruanyifeng.com/blog/2016/06/css_modules.html)