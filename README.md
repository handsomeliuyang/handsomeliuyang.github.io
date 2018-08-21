# build

```shell
# 清理
hexo clean

# 生成
hexo g

# 本地server
hexo s

# 发布到github
hexo d
```


# 问题修复

1. throw error "Cannot find module './build/Release/DTraceProviderBindings'？
    ```java
    $ npm install hexo --no-optional
    if it doesn't work
    try
    $ npm uninstall hexo-cli -g
    $ npm install hexo-cli -g
 
    ```
