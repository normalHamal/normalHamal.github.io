title: 如何利用Travis CI来自动化测试并部署你的github项目
author: normalHamal
tags:
  - Travis CI
  - SSH
  - 部署
categories:
  - 服务器部署
date: 2019-01-23 14:56:00
---
![](https://static.normalhamal.online/20190122195019.png?imageMogr2/auto-orient/thumbnail/!50p/interlace/1/blur/1x0/quality/60%7Cimageslim)

> 编写代码只是软件开发的一小部分，更多的时间往往花在构建（build）和测试（test）。

### 什么是Travis CI

**Test and Deploy with Confidence - Travis 官网描述**

要知道什么是**Travis CI**，我们就要先了解啥是**CI**。

<!-- more -->

**CI**是**Continuous Integration**的缩写，也叫做持续集成。

> 持续集成是一种软件开发实践，即团队开发成员经常集成他们的工作，通常每个成员每天至少集成一次，也就意味着每天可能会发生多次集成。每次集成都通过自动化的构建（包括编译，发布，自动化测试）来验证，从而尽早地发现集成错误。

上面是**大师Martin Fowler**对持续集成的一个解释，简单的讲就是只要你的项目代码有改动，就会自动运行你的构建程序以及测试程序，然后反馈当前运行的结果，当确定符合预期结果之后，再将改动后的新代码集成到主分支。

**Travis CI**就是提供了持续集成服务的服务商，并且它还可以和你的代码托管平台**github**账号进行绑定。

既然是服务商，那当然是要恰饭的嘛。但是！它对于开源项目所提供的持续集成服务是免费的！那么它拿啥吃饭啊？对于**github**上的私有项目它还是要收费滴。（它同**github**一样包含教育福利：**edu**邮箱免费）

### 怎么在我的github项目上使用Travis CI

1. 首先你需要去**Travis CI**的[官网](https://travis-ci.org)注册然后登录，当然这不会很麻烦，因为你可以用你的**github**账号授权登录。
2. 一旦你登陆之后，你可以点击左边的`+`去到你的**profile**页面，这里你可以看到所有你的**public**项目（如果你想管理你的**private**项目的话，你需要去[这个地方](https://travis-ci.com/)）。
3. 你可以点击每个项目后面的激活按钮来激活你的**github**项目。
4. 为了让Travis CI可以更好地构建你的项目，你需要添加一个`.travis.yml`配置文件到你的项目根目录下，这个配置文件将告诉Travis CI如何构建以及测试你的整个项目源码。（如果你的项目下面没有`.travis.yml`这个文件或者这个文件并不是一个有效的**YAML**，**Travis CI**将会忽略你的项目）
5. 最后，你只需要`commit`你的代码然后`push`到**github**上，你就可以在**Travis CI**上触发你的**first build**。

官方给出的步骤说明：

![](https://static.normalhamal.online/20190122213906.png)

### 测试原理

这个地方我用一般的**JavaScript**项目举例

比如你的配置文件内容为：

```yaml
language: node_js
node_js:
- 8
```

默认是隐藏了以下配置参数：

```yaml
install:
 - npm install
script:
 - npm test
```

也就是说，默认会执行`npm test`来测试你的项目源码，当然你也可以自己定义你的测试脚本。测试程序一般是在配置好你的项目所需要的环境以及依赖之后执行。你可以查看下面大致情况下Travis CI的构建日志来进一步了解：

![](https://static.normalhamal.online/20190123105450.png)

对于一般的**JavaScript**项目我们可能会有单元测试、功能测试甚至整合测试，也可能你仅仅只是想要做个代码规范检查（**ESLint**）测试，比如上面那张图。

### 自动部署原理

原理其实也很简单，**Travis CI**提供了一个**hooks: after_success**来给予开发者配置当构建完成之后想要运行的命令或者脚本。

如果你曾经用过**git** 的**hooks**，那么你可能会对此感到非常地相似，因为它们都是用来在特定的事件发生之前或者之后执行特定脚本的。

所以其实你也可以利用**git**的**hooks**来进行自动化部署，当然这不在这篇文章中作简述。

继续上面所说，有了这个钩子，你就可以在构建完成后

1. 连接你的服务器
2. 拉取你的最新代码
3. 重新部署你的服务

上面的步骤其实可以缩减为两步，连接服务器 -> 执行部署脚本，脚本里面可以写上你所想要在你的服务器上执行的一切操作。

这样便达到了自动部署的要求。

### 一切开始之前

虽然在前面我们已经介绍过自动化部署的原理以及步骤了，可是机智的你早就发现了一个问题，**怎么保证连接服务器的安全？**因为我们的项目可能是公开的，所有文件都是公开透明的，包括`.travis.yml`

当然**Travis CI**官方早就帮你想到并提供了解决方案：[Encrypting Files](https://docs.travis-ci.com/user/encrypting-files/)

要了解这个方案大致的原理，你首先需要了解下什么是**ssh**，以及如何实现免密登录服务器。当然，如果你早就知道并实际操作过，那么你可以跳过以下两个说明。

#### 什么是ssh

Secure Shell（安全外壳协议，简称**SSH**）是一种加密的网络传输协议，可在不安全的网络中为网络服务提供安全的传输环境。 **SSH**通过在网络中建立安全隧道来实现**SSH**客户端与服务器之间的连接。

虽然任何网络服务都可以通过**SSH**实现安全传输，比如利用**SCP**或者**SFTP**来传输文件，但是**SSH**最常见的用途还是远程登录系统。

**SSH**有2种方式实现身份验证，它们都是以**非对称加密**算法为基础来进行的。

一种是使用自动生成的公钥-私钥对来简单地加密网络连接，随后使用**密码**认证进行登录。一种是人工生成一对公钥和私钥，通过生成的密钥进行认证，而这一种就是下面要说到的免密登录了。

第一种，知道帐号和密码，就可以登录到远程主机，并且所有传输的数据都会被加密。但是，可能会有别的服务器在冒充真正的服务器，无法避免被“**中间人**”攻击。

第二种，需要依靠密钥，也就是你必须为自己创建一对密钥，并把公有密钥放在需要访问的服务器上。客户端软件会向服务器发出请求，请求用你的密钥进行安全验证。服务器收到请求之后，先在你在该服务器的用户根目录下寻找你的公有密钥，然后把它和你发送过来的公有密钥进行比较。如果两个密钥一致，服务器就用公有密钥加密一个**随机数据**并把它发送给客户端软件，这个**随机数据**只能通过私有密钥解密，客户端将解密后的信息发还给服务器，服务器验证正确后即确认客户端是可信任的，从而建立起一条安全的信息通道。从而避免被“**中间人**”攻击。

> 认证过程基于生成出来的私钥，但整个认证过程中私钥本身不会传输到网络中。

#### 如何实现免密连接服务器

上面说过**SSH** 有一种身份验证方式是基于人工生成的一对公钥和私钥，而且只要将生成的公钥放在待访问的计算机中，对应的私钥放在用户本机上，就可以实现免密连接服务器了。

首先介绍一个生成密钥的工具[ssh-keygen](https://en.wikipedia.org/wiki/ssh-keygen)，输入以下命令，你就可以开始生成你自己的公钥和私钥了。中间有一个会询问你是否需要输入密码的步骤，**wiki**上的说明是：

> to provide for unattended operation, the passphrase can be left empty, at increased risk
>
> 为了无人操作的方便性，这个密码可以留空，但是会增加一点风险

也就是说如果你设置了密码，那么以后每次都要输入密码，你可以选择性的不设置也可以。

```bash
$ ssh-keygen -t rsa -C "test"
Generating public/private rsa key pair.
Enter file in which to save the key (/c/Users/john/.ssh/id_rsa): test
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in test.
Your public key has been saved in test.pub.
The key fingerprint is:
SHA256:r9o378GmH7Ej+3/qYx03xKupAL8moyd4HFvd7Itr6y4 john@DESKTOP-4KOBSHP
The key's randomart image is:
+---[RSA 2048]----+
|                 |
|                 |
|              .  |
|               o |
|       .S o . . .|
|     . .oo + o +.|
|    o +  o+ B o.+|
|   . = E +** *o o|
|    ..=.@O=OB+++ |
+----[SHA256]-----+
```

执行完上述命令后，你就可以在你的当前目录下看到两个新增的文件，它们分别就是私钥和公钥了。

```bash
$ ls
test     # 私钥
test.pub # 公钥
```

上述命令中的参数`-C`是用来声明以及区分之后放在你服务器上的所有公钥的。比如假设下面的文件就是之后用来存放公钥的文件`authorized_keys`，一般它都存放在`~/.ssh/authorized_keys`，你可以看到不同的公钥后面都加上了一个字符串，用来标识自己。

```
ssh-rsa ... test
ssh-rsa ... test2
ssh-rsa ... test3
```

当你生成了公钥之后，你就需要把它放到你的服务器上，在类Unix系统中，已许可登录的公钥通常保存在用户 `/home` 目录的 `~/.ssh/authorized_keys` 文件中，该文件只由SSH使用。

你可以手动登录你的服务器并将生成的公钥文件内容复制追加到你的`authorized_keys`文件中，当然你也可以通过`ssh-copy-id`这个命令来直接完成以上操作：

```bash
$ ssh-copy-id -i ./test.pub user@IP
```

需要注意的是，**SSH**默认使用和保存的私钥位置一般是`~/.ssh`，如果你想使用指定位置的私钥，你可以使用命令行参数`-i`。

```bash
$ ssh -i ./test user@IP
Last login: Wed Jan 23 12:26:35 2019 from ***.***.**.**
[root@VM_221_0_centos ~]# 
```

#### 最后的解决方案

总的流程还是

1. push代码到github上
2. Travis CI开始构建并测试
3. 构建和测试成功后免密连接服务器
4. 运行服务器上的自动拉取和部署的脚本

那么既然还是免密登录,那就得在Travis服务器上也存在一个私钥，并且你的服务器上也要保存好对应的公钥。

那么这个私钥怎么传上Travis服务器呢,因为我们知道Travis CI并不是给你的每一个项目分配一个固定的服务器，所以我们不能在一开始就把私钥给传上Travis服务器上去。

Travis CI给出的解决方案就是,利用官方自己给出的命令行工具[Travis Client](https://github.com/travis-ci/travis.rb#readme)来加密你的私钥文件，它使用对称加密（AES-256）来加密文件并且将密钥保存在一个安全变量中，最后在`before install`中使用**openssl**来解密文件。

加密文件一般以`.enc`作为后缀，解密的密钥所存在的安全变量最终是保存在你的Travis CI控制台里的，所以你不用担心它会发生泄露的问题。

![](https://static.normalhamal.online/20190123131107.png)

### 安装The Travis Client

确定你的机器上已经安装了最新的**Ruby**（推荐安装 2.6.x）

你可以查看你的Ruby版本通过运行命令`ruby -v`

```bash
$ ruby -v
ruby 2.6.0p0 (2018-12-25 revision 66547) [x64-mingw32]
```

设置gem镜像为国内的镜像并且删除原先国外的镜像源

```bash
$ gem sources --add https://gems.ruby-china.com/ --remove https://rubygems.org/
https://gems.ruby-china.com/ added to sources
https://rubygems.org/ removed from sources
```

然后运行：

```bash
$ gem install travis
Successfully installed travis-1.8.9
Parsing documentation for travis-1.8.9
Done installing documentation for travis after 1 seconds
1 gem installed
```

现在你可以看看**Travis Client**是不是安装成功了：

```bash
$ travis version
1.8.9
```

如果你的机器上并没有安装**Ruby**，那么你可以尝试以下方法进行安装：

1. Mac OS X via Homebrew

   ```bash
   $ brew install ruby
   ```

2. Windows via official website

   打开官网[RubyInstaller](https://rubyinstaller.org/)，进去之后点击**download**，你会发现可供下载的软件源分为两种，**WITH DEVKIT**和**WITHOUT DEVKIT**。你可以选择任意一种软件源下面的安装包。

   加上Devkit之后，你的ruby中便具有了一个mingw32的本地编译环境，而且这个本地编译环境是自动调用的。只有在你要安装的gem需要本地编译时，才会调用devkit。 

   > The DevKit is a toolkit that makes it easy to build and use native C/C++ extensions such as RDiscount and RedCloth for Ruby on Windows.

### 安装完成后

安装完**Travis Client**后，使用**github**账号登录**travis**，如果你使用的是**travis-ci.org**，那么你可以加上`--org`，如果你使用的是**travis-ci.com**，那么你需要加上`--com`。

```bash
$ travis login --com
We need your GitHub login to identify you.
This information will not be sent to Travis CI, only to api.github.com.
The password will not be displayed.

Try running with --github-token or --auto if you don't want to enter your password anyway.

Username: normalHamal
Password for normalHamal: ************
Successfully logged in as normalHamal!
```

目录切换到仓库根目录，生成加密文件`id_rsa.enc`（**前提**：你已经按照上述所述在本地创建了自己的私钥，并且把公钥上传到了你的服务器上，同时下面的`~/.ssh/id_rsa`就是私钥的文件位置，你可以把它改成你自己的私钥地址）

```bash
$ travis encrypt-file ~/.ssh/id_rsa --add
encrypting C:/Users/john/.ssh/id_rsa for normalHamal/***
storing result as id_rsa.enc
storing secure env variables for decryption

Make sure to add id_rsa.enc to the git repository.
Make sure not to add C:/Users/john/.ssh/id_rsa to the git repository.
Commit all changes to your .travis.yml.
```

并且在根目录下的**.travis.yml**文件添加如下解密内容（以下部分是`--add`自动生成的，部分是需要自行添加的）：

```yaml
before_install:
- openssl aes-256-cbc -K $encrypted_******c_key -iv $encrypted_******c_iv
  -in id_rsa.enc -out ~/.ssh/id_rsa -d
  # -in 参数指定待解密的文件
  # -out 参数指定解密后的密钥存放在Travis服务器的什么位置
- chmod 600 ~/.ssh/id_rsa # 给私钥文件加权限
addons:
  ssh_known_hosts: ***.***.***.*** # 你服务器的IP，这个配置可以免去SSH信任主机的一个询问，通常你需要输入yes以进入下一步，这个配置就相当于帮助你输入了yes。
after_success:
- ssh ***@***.***.***.*** "/root/deploy.sh" # 构建成功之后连接服务器执行部署脚本
```

~~由于不会写bash脚本，所以就粗略写了写大致的拉取和重启服务的脚本代码：(/root/deploy.sh)~~

因为不会写bash脚本，所以叫朋友给帮忙写了下[@qjp](https://blog.inlow.online/)：


```bash
#! /bin/bash                                             
# go to dir: /var/www/myPic                          
cd /var/www/myPic                                            
# ensure your local repository has not been changed  
git reset --hard HEAD                                
# fetch & merge the lastest version                  
git pull -f origin master                                     
#install dependencies                                
npm i                                                        
# restart mongodb if it not launched                 
if [ 0 == `ps -e | grep [m]ongod | wc -l` ]          
then                                                 
    echo Need Restart, Waiting...                    
    mongod --config /etc/mongod.conf                 
else                                                 
    echo MongoDB has Launched                        
fi                                                   
# Hot Reload application                             
npm run deploy                                   
```

### 最后

#### 给你的README加上CI构建结果

在你的项目说明文档README中可以在开头添加这么一行：

```markdown
[![Build Status](https://travis-ci.org/用户名/项目名.svg?branch=master)](https://travis-ci.org/用户名/项目名)
```

私有项目可能需要加上token：

```markdown
[![Build Status](https://travis-ci.com/用户名/项目名.svg?token=***&branch=master)](https://travis-ci.org/用户名/项目名)
```

最终就会显示这么一个标志：

![](https://static.normalhamal.online/20190123144222.png)

或者构建失败的时候：

![](https://static.normalhamal.online/20190123202733.png)

构建出现问题的时候：

![](https://static.normalhamal.online/20190123144325.png)

上面说的私有项目的token你可以这么拿到：

1. 打开网页：https://travis-ci.com/用户名/项目名

2. ![](http://static.normalhamal.online/result-1.gif?imageView2/0/format/webp/q/75|imageslim)

#### 最终的配置文件.travis.yml

```yaml
language: node_js
node_js:
- node
- '8'
cache:
  directories:
  - node_modules
before_install:
- openssl aes-256-cbc -K $encrypted_5077b6c6366c_key -iv $encrypted_5077b6c6366c_iv
  -in id_rsa.enc -out ~/.ssh/id_rsa -d
- chmod 600 ~/.ssh/id_rsa
addons:
  ssh_known_hosts: serverIP
after_success:
- ssh user@serverIP "/root/deploy.sh"
```

#### Windows上可能会出现的问题

如果你按照上面的步骤一步一步的集成你的项目，最终，你发现在Travis CI的控制台上出现了如下的错误，导致你的项目构建失败。

![](https://static.normalhamal.online/20190123161455.png)

**bad decrypt**

起初我以为是我可能哪些步骤出现了问题，并且进行了多次重复性地操作，最终无一能逃过**bad decrypt**的魔咒。

最后我开始去官方的**github**上查看是否有相同的问题出现并寻求解决方案，然后我[在这](https://github.com/travis-ci/travis-ci/issues/4746)发现了非常多出现了和我一样问题的用户。这个讨论最后得出的解决方法就是。。。换个**操作系统**去加密你的文件。。。

反正最后我是换了个linux系统才解决的。

> 参考文章
>
> [关于Ruby DevKit](https://blog.csdn.net/huang9012/article/details/13094659)
>
> [Travis-ci远程部署到服务器](https://blog.csdn.net/sp1206/article/details/80430493)
>
> [Travis CI 系列：自动化部署博客](https://segmentfault.com/a/1190000011218410)
>
> [维基百科SSH](https://zh.wikipedia.org/wiki/Secure_Shell)