# git

- git checkout -b branch_name // 创建新分支

- git push --set-upstream origin branch_name // 提交新分支到远程并关联本地新建的这个分支

- git config --global push.default current // 配置当前分支直接绑定远程对应名字的分支，执行这条命令后，就不用再执行 git push --set-upstream origin branch_name 这条命令了，有新分支，直接执行 git push 就可以了

- git reset HEAD -- . // 撤销暂存操作

- git checkout -- <filename> // 撤销对所有文件的修改

## git rebase 冲突处理：

```git
  1.git fetch（下载所有分支的最新的代码）

  2.git rebase origin/master(以origin/master分支为基线，合入master分支的修改到origin/master)此时会提示冲突文件

  3.对冲突文件进行修改

  4.git add .

  5.git commit

  6.git rebase --continue(继续合并。合并的过程中，还有可能产生冲突。解决方法同上。)

  7.git push -f(冲突解决完之后。推送到远端服务器)

```

- git reset --soft 上一个提交 id （撤销 commit，让修改回到暂存区）

- git reset --hard HEAD^ // 本地代码回到上一个 commit

- git branch -D feature_planWork_sprint5 // 删除分支

## git cherry-pick 处理：

```git
git cherry-pick commitID

// 如果没有冲突
git push

// 如果有冲突
// 先解决冲突，然后
git add .
git cherry-pick --continue

// 如果中途不想pick了，通过abort中断
git cherry-pick --abort

```

## git 合并提交记录

1. git rebase -i <开始 commitID> <结束 commitID> // 这个开始 commitID 是当前所有要合并的 commit 的**前一个 commit**的 id，表示这个 id 后面的所有 commit 都要合并，这个结束 commitID 表示要合并的 commit 到哪一个为止，如果是要一直到最新的提交，则结束 commitID 可以不填
2. 在出现的编辑窗里，pick 表示要保留的 commit，squash（可以简写为 s）表示要合并的 commit，至少要有一个 pick
3. 编辑完后使用 `:x` 命令保存
4. 在第二个编辑窗口里编辑合并后的提交信息，编辑完后使用 `:x` 命令保存
5. 最后使用 `git push --force` 强制推送

## git 撤销某个提交

1. 通过 revert 来撤销某个提交

```bash
git revert HEAD # 撤销前一次的commit
git revert HEAD^ # 撤销前前一次的commit
git revert <commitID> # 撤销某个指定的commit，git会生成一个新的commit，将指定的commit的内容反转来达成撤销
git revert -n commitIDA^..commitIDD # 如果想revert多个commit，则使用^来表示，比如git revert commitIDA^...commitIDD，例如commit序列：A->B->C->D；加个参数 -n 可以使revert后不会生成commitId，用户可以自己添加一个commit
git commit -m "revert commitIDA到commitIDD" # 之后提交的时候只需要增加一条commit就可以了

```

如果 revert 的 commit 是 merge 的 commit，参考链接： https://blog.csdn.net/allanGold/article/details/111372750

```bash
git revert -m 1 commitIDA # 指定需要保留的主分支
```

```bash
git remote set-url origin https://gitlab.crc.com.cn/crmixclifestyle-mixh-fe/joy-admin.git # 设置远程仓库地址
```

2. 使用 rebase 来撤销某个提交
   在上文 git 合并提交记录的流程里，第二步里面可以通过 drop 来删除想要撤销的 commit

git 提交规范：

feat: 新功能（feature）
fix: 修补 bug
docs: 文档（documentation）
style: 格式（不影响代码运行的变动）
refactor: 重构（即不是新增功能，也不是修改 bug 的代码变动）
chore: 构建过程或辅助工具的变动
revert: 撤销，版本回退
perf: 性能优化
test：测试
improvement: 改进
build: 打包
ci: 持续集成

git 获取用户名和邮箱
git config user.name
git config user.email

## git 如何在一个文件夹下初始化并绑定远程仓库

1. 先在 github 中创建远程仓库
2. 在本地文件夹下执行

```bash
git init
git add .
git commit -m "init"
git branch -m master // 这一步是将当前分支重命名为 master
git remote add origin https://github.com/xxxxx.git
git push -u origin master

```

## git SSH 公钥拉取代码（使用及配置）

1. 查看是否已经有了`SSH key`

```bash
ls -alF ~/.ssh
```

2. 生成 SSH key

```bash
ssh-keygen -t rsa -C "chenxuezhong@xiaoice.cn"
```

> 后面直接一直按回车就可以了
> 完成后可以再执行第一步看是否已经生成成功了 3. 使用 SSH key
> 输出公钥信息

```bash
cat ~/.ssh/id_rsa.pub
```

> 把输出的所有内容都要复制出来，然后粘贴到对应仓库的`SSH keys`里面就可以了

# pnpm

```bash
npm install -g pnpm       # 通过 npm 安装
brew install pnpm        # macOS 通过 Homebrew 安装[7,9](@ref)
pnpm config set registry https://registry.npmmirror.com  # 切换国内镜像源[7,9](@ref)

pnpm install              # 安装所有依赖
pnpm add <package>       # 添加生产依赖
pnpm add -D <package>    # 添加开发依赖[3,8](@ref)
pnpm remove <package>    # 移除依赖
pnpm -F <package> add <dependency>  # 为指定子包添加依赖[6](@ref)
pnpm store path          # 显示全局存储位置（默认：系统特定目录）[5,9](@ref)
```

# npm

npm config set registry https://registry.npmmirror.com //设置成阿里的 npm 源
npm config set registry https://registry.npmjs.org //原生的源

http://nexus.mixcapp.cn/repository/npm-hosted/ // 华润的 npm 源

npm install --registry=https://registry.npmmirror.com // 单次安装

npm config get registry

npm link 是将当前目录包链接到全局
npm remove -g pka-name 是将全局的链接的 pkg-name 包移除
npm unlink pka-name 是将当前项目中软链接的包移除

npm list -g 查看当前所有的公共依赖包

## npm version

```
npm version 常用命令

prerelease
  npm version prerelease
  package.json 中的版本号1.0.0变为 1.0.1-0
  再次执行 npm version prerelease
  package.json 中的版本号1.0.1-0变为 1.0.1-1
  操作说明 当执行npm version prerelease时，如果没有预发布号，则增加minor，同时prerelease 设为0；
  如果有prerelease， 则prerelease 增加1。

prepatch
npm version prepatch
package.json 中的版本号1.0.1-1变为 1.0.2-0
prepatch - 直接升级小号，增加预发布号为0。

preminor
npm version preminor
package.json 中的版本号1.0.2-0变为 1.1.0-0
preminor - 直接升级中号，小号置为0，增加预发布号为0。

npm version premajor
package.json 中的版本号1.1.0-0变为 2.0.0-0
premajor - 直接升级大号，中号、小号置为0，增加预发布号为0。

patch: 主要目的升级patch
npm version patch
package.json 中的版本号2.0.0-0变为 2.0.0;
再次执行npm version patch
package.json 中的版本号2.0.0变为 2.0.1;
10,11 操作说明，patch：如果有prerelease ，则去掉prerelease ，其他保持不变；
如果没有prerelease ，则升级minor.

minor： 主要目的升级minor
npm version minor
package.json 中的版本号2.0.1变为 2.1.0;
如果没有prerelease，直接升级minor， 同时patch设置为0；

npm version premajor 2.1.0–> 3.0.0-0;
npm version minor 3.0.0-0–> 3.0.0;
npm version prepatch 3.0.0–>3.0.1-0;
npm version minor 3.0.1-0–>3.1.0;
如果有prerelease， 首先需要去掉prerelease；如果patch为0，则不升级minor：如14；
如果patch不为0， 则升级minor，同时patch设为0，如16。

major ：主要目的升级major
npm version major : 3.1.0 -->4.0.0
如果没有prelease，则直接升级major，其他位都置为0；

npm version premajor: 4.0.0 --> 5.0.0-0;
如果有预发布号： minor和patch都为0，则不升级major，只将prerelease 去掉。

npm version preminor : 5.0.0-0–> 5.1.0-0
npm version major : 5.1.0-0 -->6.0.0
如果有预发布号：且minor和patch有任意一个不是0，则升级一位major，其他位都置为0，并去掉prerelease。
```
