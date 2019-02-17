title: Linux命令学习
author: normalHamal
tags:
  - linux
categories:
  - OS
date: 2019-01-21 12:40:00
---
### 删除特殊字符的文件或文件夹

1. when your file named with special charactor, you cannot delete it with `rm`, you can fix in this way.

  first, assume the inode of your file to be `655341`.
  
  then perhaps we can use order `find` to delete: 
 
 ```
  find ./ -inum 655341 -exec rm '{}' \; 
 ```
 
### 查看文件大小或文件夹

```
//查看系统中文件的使用情况
df -h
//查看当前目录下各个文件及目录占用空间大小
du -sh *
```

### cat的用法

```
// 把file_name的内容复制追加到file_name2中
cat {file_name} >> {file_name2}
```

### git强制覆盖更新

```
git fetch --all  
git reset --hard origin/master 
git pull
```