---
title: Linux 常用命令速查手册：从基础到进阶
date: 2026-05-28 09:00:00
tags:
  - Linux
  - 命令行
  - 运维
categories:
  - 运维
---

## 一、文件与目录操作

### 基础操作

```bash
# 列出文件
ls -la          # 详细列表，包含隐藏文件
ls -lhS         # 按文件大小排序
ls -lht         # 按修改时间排序

# 切换目录
cd /path/to/dir # 切换到指定目录
cd ~            # 切换到用户主目录
cd -            # 切换到上一次所在目录
cd ..           # 返回上级目录

# 创建目录
mkdir -p /path/to/dir   # 递归创建多级目录

# 创建文件
touch file.txt           # 创建空文件或更新时间戳

# 复制
cp file.txt backup.txt           # 复制文件
cp -r dir1/ dir2/                # 递归复制目录
cp -a source/ dest/              # 归档复制（保留权限、时间等）

# 移动/重命名
mv old.txt new.txt               # 重命名
mv file.txt /path/to/            # 移动文件

# 删除
rm file.txt                      # 删除文件
rm -rf directory/                 # 强制递归删除目录（慎用！）
```

### 文件查找

```bash
# find - 按条件查找
find / -name "*.log"                    # 按文件名查找
find /var -size +100M                   # 查找大于100M的文件
find /tmp -mtime -7                     # 查找7天内修改的文件
find . -type f -name "*.java" -exec grep -l "TODO" {} \;  # 查找含TODO的Java文件
find . -empty -type d                   # 查找空目录

# locate - 快速查找（基于数据库）
locate nginx.conf
sudo updatedb                          # 更新查找数据库

# which / whereis
which java                             # 查找命令路径
whereis nginx                          # 查找命令、源码、手册路径
```

---

## 二、文本处理

### 查看文件

```bash
cat file.txt                # 输出整个文件
less file.txt               # 分页查看（q退出，/搜索，n下一个）
head -n 20 file.txt         # 查看前20行
tail -n 20 file.txt         # 查看后20行
tail -f /var/log/syslog     # 实时追踪文件末尾
wc -l file.txt              # 统计行数
```

### 文本搜索（grep）

```bash
grep "error" log.txt                  # 搜索包含 error 的行
grep -i "error" log.txt               # 忽略大小写
grep -r "TODO" ./src/                  # 递归搜索目录
grep -n "function" app.js             # 显示行号
grep -c "404" access.log              # 统计匹配行数
grep -v "debug" log.txt               # 反向匹配（排除 debug）
grep -A 3 -B 2 "Exception" log.txt    # 显示匹配行的前后上下文
grep -E "error|warn|fatal" log.txt    # 正则匹配多个关键词
```

### 文本处理（sed / awk）

```bash
# sed - 流编辑器
sed -i 's/old/new/g' file.txt         # 替换文本（直接修改文件）
sed -i '5d' file.txt                  # 删除第5行
sed -n '10,20p' file.txt              # 打印第10-20行
sed '/^#/d' config.txt                # 删除注释行

# awk - 文本分析
awk '{print $1, $3}' file.txt         # 打印第1和第3列
awk -F: '{print $1}' /etc/passwd      # 指定分隔符
awk '$3 > 100' data.txt               # 条件过滤
awk '{sum+=$1} END{print sum}' nums   # 求和
```

### 排序与去重

```bash
sort file.txt                         # 排序
sort -n file.txt                      # 按数值排序
sort -k2 -t: file.txt                 # 按第2列排序
uniq file.txt                         # 去重（需先排序）
sort file.txt | uniq -c | sort -rn    # 统计并按频率排序
```

---

## 三、系统信息

### 系统状态

```bash
uname -a                    # 系统信息
cat /etc/os-release          # 发行版信息
uptime                      # 运行时间和负载
hostname                    # 主机名
date                        # 当前日期时间
timedatectl                 # 时区信息
```

### 硬件信息

```bash
lscpu                       # CPU 信息
free -h                     # 内存使用（人类可读格式）
df -h                       # 磁盘使用
du -sh /path/               # 目录大小
lsblk                       # 块设备列表
lspci                       # PCI 设备
lsusb                       # USB 设备
```

### 进程管理

```bash
ps aux                      # 所有进程
ps aux | grep java          # 查找特定进程
top                         # 实时进程监控
htop                        # 增强版 top
kill PID                    # 终止进程
kill -9 PID                 # 强制终止
pkill -f "python app.py"    # 按名称终止
nohup command &             # 后台运行，不受终端关闭影响
```

---

## 四、网络操作

### 网络配置

```bash
ip addr                     # 查看 IP 地址
ip route                    # 查看路由表
ss -tlnp                    # 查看监听端口
ss -s                       # 连接统计
netstat -tlnp               # 查看端口（旧命令）
```

### 网络诊断

```bash
ping google.com             # 测试连通性
traceroute google.com       # 路由追踪
dig example.com             # DNS 查询
nslookup example.com        # DNS 查询（简版）
curl -I https://example.com # 查看 HTTP 响应头
curl -o file.zip URL        # 下载文件
wget URL                    # 下载文件
```

### SSH

```bash
ssh user@host               # 远程登录
ssh -p 2222 user@host       # 指定端口
scp file.txt user@host:/path/          # 远程复制文件
scp -r dir/ user@host:/path/           # 远程复制目录
rsync -avz source/ user@host:/dest/    # 增量同步
```

---

## 五、权限管理

### 文件权限

```bash
chmod 755 file.txt          # 设置权限（rwxr-xr-x）
chmod u+x script.sh         # 给所有者添加执行权限
chmod -R 644 /path/         # 递归设置权限
chown user:group file.txt   # 修改所有者
chown -R user:group /path/  # 递归修改所有者
```

### 权限说明

```
r (4) = 读
w (2) = 写
x (1) = 执行

所有者 | 用户组 | 其他用户
rwx    r-x     r-x
7      5       5
```

---

## 六、压缩与解压

```bash
# tar
tar -czf archive.tar.gz dir/          # 创建 gzip 压缩包
tar -cjf archive.tar.bz2 dir/         # 创建 bzip2 压缩包
tar -xzf archive.tar.gz               # 解压 gzip
tar -xzf archive.tar.gz -C /path/     # 解压到指定目录
tar -tzf archive.tar.gz               # 查看压缩包内容

# zip / unzip
zip -r archive.zip dir/               # 创建 zip
unzip archive.zip                      # 解压 zip
unzip archive.zip -d /path/            # 解压到指定目录

# gzip / gunzip
gzip file.txt                          # 压缩（原文件被替换）
gunzip file.txt.gz                     # 解压
```

---

## 七、用户管理

```bash
useradd -m username         # 创建用户（-m 创建主目录）
passwd username             # 设置密码
userdel -r username         # 删除用户及主目录
usermod -aG sudo username   # 添加到 sudo 组
groups username             # 查看用户所属组
whoami                      # 当前用户
id username                 # 用户 ID 信息
```

---

## 八、系统服务（systemd）

```bash
systemctl start service      # 启动服务
systemctl stop service       # 停止服务
systemctl restart service    # 重启服务
systemctl reload service     # 重新加载配置
systemctl status service     # 查看状态
systemctl enable service     # 开机自启
systemctl disable service    # 取消开机自启
systemctl list-units --type=service  # 列出所有服务
journalctl -u service -f     # 查看服务日志
```

---

## 九、磁盘管理

```bash
# 分区与格式化
fdisk -l                     # 列出分区
mkfs.ext4 /dev/sdb1          # 格式化为 ext4

# 挂载
mount /dev/sdb1 /mnt/data    # 挂载
umount /mnt/data              # 卸载

# 磁盘使用
df -hT                       # 磁盘使用（含文件系统类型）
du -sh *                     # 当前目录各项大小
ncdu /                       # 交互式磁盘分析（需安装）
```

---

## 十、定时任务（Cron）

```bash
crontab -e                  # 编辑定时任务
crontab -l                  # 查看定时任务
crontab -r                  # 删除所有定时任务
```

### Cron 表达式

```
分  时  日  月  周  命令
*   *   *   *   *   command

# 示例
0 2 * * * /backup.sh           # 每天凌晨2点
*/5 * * * * /check.sh          # 每5分钟
0 9 * * 1 /report.sh           # 每周一上午9点
0 0 1 * * /cleanup.sh          # 每月1号零点
```

---

## 十一、实用技巧

### 管道与重定向

```bash
command1 | command2          # 管道：将1的输出作为2的输入
command > file.txt           # 输出重定向（覆盖）
command >> file.txt          # 输出重定向（追加）
command 2>&1                 # 错误输出合并到标准输出
command &> /dev/null         # 丢弃所有输出
```

### 历史命令

```bash
history                      # 查看历史命令
!100                         # 执行第100条历史命令
!!                           # 执行上一条命令
Ctrl+r                       # 反向搜索历史命令
```

### 后台任务

```bash
command &                    # 后台运行
jobs                         # 查看后台任务
fg %1                        # 将任务调到前台
bg %1                        # 继续在后台运行
```

---

## 总结

熟练掌握 Linux 命令是后端开发和运维的基本功。建议在日常工作中多用命令行，逐步积累。记住：不确定的命令先用 `man command` 或 `command --help` 查看文档，危险操作（尤其是 `rm -rf`）务必三思。
