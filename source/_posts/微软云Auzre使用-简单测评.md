title: 微软云Auzre使用-简单测评
author: normalHamal
tags:
  - VPS
  - 服务器
  - Auzre
categories:
  - 服务器部署
date: 2019-06-15 00:44:00
---
![](https://static.normalhamal.online/20190615001748.png?imageMogr2/auto-orient/thumbnail/!50p/interlace/1/blur/1x0/quality/60%7Cimageslim)

<!-- more -->

你可以在[Auzre官网](<https://azure.microsoft.com/zh-cn/free/>)开始注册一个Auzre账户

你可以在[Auzre速度节点检测网站](<http://www.azurespeed.com/>)检测你的IP位置到Azure世界各地的数据中心的网络延迟。

你也可以在[Auzre控制台](https://portal.azure.com/)管理你的Auzre账户

## Auzre 虚拟机上搭建SSR

...此处省略创建虚拟机的步骤

创建完虚拟机后，执行下列命令：

**注意！以下文中出现的脚本或者命令最好使用root用户的身份去执行**

```bash
$ wget --no-check-certificate https://raw.githubusercontent.com/teddysun/shadowsocks_install/master/shadowsocksR.sh && chmod +x shadowsocksR.sh && ./shadowsocksR.sh
```

之后按照提示输入对应的参数即可，或者直接回车使用默认参数。

## Auzre 一键脚本搭建SSR（不需要创建虚拟机）

```bash
$ az group create --name <资源组名称> --location <location>
$ az container create --name <资源名称> --image malaohu/ssr-with-net-speeder --resource-group <资源组名称> --ip-address public --port <ssr端口号> --command-line "/usr/local/bin/entrypoint.sh -s 0.0.0.0 -p <ssr端口号> -k <密码> -m rc4-md5 -o http_simple"
```

**注意：上面的`<location>`决定资源组元数据的存储位置。 可使用“West US”、“North Europe”或“West India”等字符串来指定位置；或者可使用单个同义词，例如 westus、northeurope 或 westindia。**

如果需要查看运行日志的话，可以运行下面的命令：

```bash
$ az container logs --resource-group <资源组名称> --name <资源名称>
```

## 一键开启BBR

```bash
$ wget --no-check-certificate https://github.com/teddysun/across/raw/master/bbr.sh && chmod +x bbr.sh && ./bbr.sh
```

## 网速测评

这里我用的是标准B1S型CentOS，节点选择的是香港。

![](https://static.normalhamal.online/20190614232240.png)



**YouTube 4K视频播放测试**

![](https://static.normalhamal.online/20190615001159.png)

**speedtest-cli测试**

```bash
$ wget -O speedtest-cli https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py && chmod +x speedtest-cli && ./speedtest-cli
```

![](https://static.normalhamal.online/20190614234443.png)

**VPS测试脚本**

- `wget -qO- bench.sh | bash`
- `wget git.io/superbench.sh && chmod +x superbench.sh && ./superbench.sh` 
- `wget https://raw.githubusercontent.com/oooldking/script/master/superspeed.sh && chmod +x superspeed.sh && ./superspeed.sh`

[https://github.com/oooldking/script](https://github.com/oooldking/script)

![](https://static.normalhamal.online/20190616232606.png)

![](https://static.normalhamal.online/20190615004850.png)

![](https://static.normalhamal.online/20190615000039.png)

**国外这种不计带宽、按量收费的云服务商是真的牛！**

## 不用信用卡也可以薅羊毛（学生优惠）

<https://azure.microsoft.com/zh-cn/free/students/>

![](https://static.normalhamal.online/20190615002917.png)

但是！。。。。。。。。。。。。。。。你会发现然并卵。

![](https://static.normalhamal.online/20190617230011.png)

Azure for Students 的可用地区在中国只包含香港和澳门区域：

![](https://static.normalhamal.online/20190617230949.png)

## SSR客户端下载

[windows SSR客户端下载](http://aivpns.oss-cn-hangzhou.aliyuncs.com/shadowsocks_for_win.zip)

[Mac SSR客户端](http://aivpns.oss-cn-hangzhou.aliyuncs.com/ssr-mac.dmg)

[More](https://github.com/teddysun/shadowsocksr#client)