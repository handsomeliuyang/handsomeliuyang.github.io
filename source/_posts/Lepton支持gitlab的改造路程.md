---
title: Lepton支持gitlab的改造路程
date: 2019-06-05 09:46:31
categories: 前端
tags: [electron,前端]
---

# 背景
在一套成熟的App框架里，有非常丰富的基础库，中间件等等模块。新的需求都是基于这些基础能力来开发的，RD在开发时，大部分都是Copy再做二次开发，容易产生如下问题：
1. Copy的是有问题的代码：如老的网络请求代码
2. 缺少必须文档，Copy后理解不到位，改动时容易出现Bug
3. 代码融合了特定的业务逻辑，需要删除成本

除了必要的文档外，希望有相应的代码片段库，同时具有分类，搜索等等功能。

调研后的结果是：Github Gists + Lepton，由于是公司级的片段库，希望的组合是：GitLab Snippets + Lepton

# Github Gists 与 Gitlab Snippets
对应的Api文档：
1. [Github Gists的Api文档](https://developer.github.com/v3/gists/)
2. [Gitlab Snippets的Api文档](https://docs.gitlab.com/ee/user/snippets.html)

差异：
1. Gist是以用户纬度，Snippets是以项目为维度
2. 每个Gist支持多个文件，Snippet只支持一个文件
2. Gist详情Api里，同时会返回文件内容，Snippet不会，还要单独请求

# Lepton简介
> lepton详情：https://github.com/hackjutsu/Lepton

Lepton简介：
1. Framework: Electron
2. Library: React, Redux, Redux Thunk, Redux Form

所有与github相关的请求的逻辑都在：Lepton/app/utilities/githubApi/index.js

# 方案
整体方案：抽象接口层，转换Gitlab Snippets Api的数据。

![](/Lepton支持gitlab的改造路程/抽象结构.png)

抽象接口层：
```javascript
'use strict'

import { remote } from 'electron'
import githubApi from './githubApi'
import gitlabApi from './gitlabApi'

const conf = remote.getGlobal('conf')
const logger = remote.getGlobal('logger')

let api = githubApi
if (conf) {
  if (conf.get('gitlab:enable')) {
    api = gitlabApi
  }
}

export const EXCHANGE_ACCESS_TOKEN = 'EXCHANGE_ACCESS_TOKEN'
export const GET_ALL_GISTS = 'GET_ALL_GISTS'
export const GET_ALL_GISTS_V1 = 'GET_ALL_GISTS_V1'
export const GET_SINGLE_GIST = 'GET_SINGLE_GIST'
export const GET_USER_PROFILE = 'GET_USER_PROFILE'
export const CREATE_SINGLE_GIST = 'CREATE_SINGLE_GIST'
export const EDIT_SINGLE_GIST = 'EDIT_SINGLE_GIST'
export const DELETE_SINGLE_GIST = 'DELETE_SINGLE_GIST'

export function getGitHubApi (selection) {
  switch (selection) {
    case EXCHANGE_ACCESS_TOKEN:
      return api.exchangeAccessToken
    case GET_ALL_GISTS:
      return api.getAllGistsV2
    case GET_ALL_GISTS_V1:
      return api.getAllGistsV1
    case GET_SINGLE_GIST:
      return api.getSingleGist
    case GET_USER_PROFILE:
      return api.getUserProfile
    case CREATE_SINGLE_GIST:
      return api.createSingleGist
    case EDIT_SINGLE_GIST:
      return api.editSingleGist
    case DELETE_SINGLE_GIST:
      return api.deleteSingleGist
    default:
      logger.debug('GitApi Not implemented yet.')
  }
}
```

解决gitlab的一个snippet只支持一个文件的方案：
1. 使用多个snippet来合并为一个gist的结构
2. 通过设置相同的title名称，来归类多个snippet
3. 对应关系表：
    1. md5(gist.description) ---> snippet.title
    2. gist.description      ---> snippet.description
    2. gist.files            ---> 多个snippet.file

# 接口层具体实现

## 登录与获取token接口
解决方案：
1. 去掉账号登录，与获取token过程
2. 通过配置文件.leptonrc直接获取

.leptonrc扩展内容：
```json
"gitlab": {
    "enable": false,
    "host": "",
    "token": "",
    "avatarUrl": "",
    "group":"",
    "name":""
}
```

获取Api：
```javascript
import { remote } from 'electron'
const conf = remote.getGlobal('conf')

if (conf.get('gitlab:enable')) {
    token = conf.get('gitlab:token')
}
```

## getUserProfile（获取用户简介接口）
接口作用：
1. github：获取username，请求gist的必要参数
2. gitlab：获取username和projectid
    1. username：用于显示
    2. projectid：请求snippet的必要参数

```javascript
function getUserProfile (token) {
    const result = {}
    return ReqPromise({
        uri: `http://${hostApi}/user`,
        agent: proxyAgent,
        headers: {
            'User-Agent': userAgent,
        },
        method: 'GET',
        qs: {
            private_token: token
        },
        json: true,
        timeout: 2 * kTimeoutUnit
    }).then((profile) => {
        result.login = profile.username
        // 请求ProjectId
        return getProjectId(token, group, name)
    }).then((projectId) => {
        result.projectId = projectId
        return result
    })
}
```

## getAllGistsV2（获取所有片段）
作用：请求所有的片段，用于统计所有的TAG，语言等等

由于snippet只支持一个file，此接口需添加转换逻辑：
1. 请求所有的snippets，分页请求，请求完所有的页面
2. 通过title对snippets排序
3. 通过相同的title，对snippets归类
4. 按gist的json格式，添加必要信息，如updated_at，created_at，html_url，user

```javascript
function getAllGistsV2 (token, userId, projectId) {
    const snippetsList = []
    return requestGists(token, 1, snippetsList, projectId)
        .then(res => {
      const maxPage = res.headers['x-total-pages']
      logger.debug(TAG + `The max page number for gist is ${maxPage}`)

      const requests = []
      for (let i = 2; i <= maxPage; ++i) { requests.push(requestGists(token, i, snippetsList, projectId)) }
      return Promise.all(requests)
        .then(() => {
          return snippetsList.sort((g1, g2) => g2.title.localeCompare(g1.title))
        })
    })
    .then(() => {
      let gistList = []
      let map = {}

      for (let i = 0; i < snippetsList.length; i++) {
        let snippet = snippetsList[i]
        let gist = map[snippet.title]

        if (!gist) {
          gist = {}
          map[snippet.title] = gist
          gistList.push(gist)
        }

        gist.files = gist.files || {}
        gist.files[snippet['file_name']] = snippet
        snippet['language'] = judgeLanguage(snippet['file_name'])
        snippet['filename'] = snippet['file_name']

        gist.description = snippet['description']
        gist.id = snippet['title']
        gist['updated_at'] = snippet['updated_at']
        gist['created_at'] = snippet['created_at']
        gist['html_url'] = snippet['web_url']
        gist['user'] = snippet['author']['username']
        gist['project_id'] = snippet['project_id']
      }

      console.log('gistList=', gistList)
      // 做归类处理
      return gistList
    })
    .catch((err) => {
      logger.debug(TAG + `[V2] Something wrong happens ${err}. Falling back to [V1]...`)
      // return getAllGistsV1(token, userId)
    })
}
```

## getSingleGist（获取片段详情）
作用：主要返回file内容

gitlab的处理逻辑：
1. 遍历请求所有files的内容
2. 按gist的格式添加到content字段里

```javascript
function getSingleGist (token, gistId, oldGist) {
    const requests = []
    for (let filename in oldGist.brief.files) {
        requests.push(requestSnippetContent(oldGist.brief.files[filename], token, oldGist.brief.project_id))
    }
    return Promise.all(requests)
        .then(() => {
            return oldGist.brief
        })
}

function requestSnippetContent (snippet, token, projectId) {
    const SINGLE_GIST_URI = `http://${hostApi}/projects/${projectId}/snippets/${snippet.id}/raw`
    return ReqPromise({
        uri: SINGLE_GIST_URI,
        agent: proxyAgent,
        headers: {
        'User-Agent': userAgent
        },
        method: 'GET',
        qs: {
            private_token: token
        },
        json: true, // Automatically parses the JSON string in the response
        timeout: 2 * kTimeoutUnit
    }).then(res => {
        snippet.content = res
        return snippet
    })
}
```

## createSingleGist（创建片段）
作用：创建片段

gitlab的逻辑：
1. 按转换方案，分成多个snippet创建
2. 创建成功后，按转换方案，合并成一个gist对象

```javascript
function createSingleGist (token, description, files, isPublic, projectId) {
    // 通过description，生成其md5值，当作title
    const title = md5(description)
    const requests = []
    for (let filename in files) {
        requests.push(createSingleSnippet(token, title, description, filename, files[filename].content, false, projectId))
    }
    return Promise.all(requests)
        .then((res) => {
            console.log('create res', res)
            // 转换所有的结果
            const gist = {}

            let isInit = false
            gist.files = {}
            for (let i = 0; i < res.length; i++) {
                let snippet = res[i]

                if (!isInit) {
                    isInit = true
                    gist.description = snippet['description']
                    gist.id = snippet['title']
                    gist['updated_at'] = snippet['updated_at']
                    gist['created_at'] = snippet['created_at']
                    gist['html_url'] = snippet['web_url']
                    gist['user'] = snippet['author']['username']
                    gist['project_id'] = snippet['project_id']
                }
                gist.files[snippet['file_name']] = snippet
                snippet['language'] = judgeLanguage(snippet['file_name'])
                snippet['filename'] = snippet['file_name']
            }

            console.log('createSingleGist', gist)
            return gist
        })
}
```

## editSingleGist（编辑片段）
作用：修改片段

gitlab的逻辑：按file名称，比较修改后updategist与原gist，规则如下：
1. 文件名相同：更新操作
2. 新增文件名：创建操作
3. 删除文件名：删除操作

**核心代码如下：**
```javascript
function editSingleGist (token, gistId, updatedDescription, updatedFiles, gist) {
    const requests = []
    for (let filename in updatedFiles) {
        let file = gist.brief.files[filename]
        if (file) {
            if (updatedFiles[filename] == null) {
                // 删除
                requests.push(deleteSingleSnippet(token, gist.brief.files[filename].id, gist.brief.project_id))
            } else {
                // 更新
                requests.push(updateSingleSnippet(token, file.id, file.title, updatedDescription, filename, updatedFiles[filename].content, gist.brief.project_id))
            }
        } else {
            // 创建
            requests.push(createSingleSnippet(token, gist.brief.id, updatedDescription, filename, updatedFiles[filename].content, false, gist.brief.project_id))
        }
    }
}
```

## deleteSingleGist（删除片段）
作用：删除片段

gitlab的逻辑：遍历files，逐一删除snippet

```javascript
function deleteSingleGist (token, gistId, gist) {
    const requests = []
    for (let filename in gist.brief.files) {
        requests.push(deleteSingleSnippet(token, gist.brief.files[filename].id, gist.brief.project_id))
    }
    return Promise.all(requests)
}
```

# 源码及使用文档
**源码：**
* github地址：https://github.com/handsomeliuyang/Lepton
* 分支：f-gitlab-ly

**Lepton-Gitlab软件下载：**链接:https://pan.baidu.com/s/17GSxKzEuP9ItYm11NgJRgw  密码:btq0

**使用文档**
1. 在gitlab上创建一个Project用于存储代码片段，如group/project
2. 配置.leptonrc文件，新增如下配置：[更多参考](https://gist.github.com/hackjutsu/1ad7e4968eb64d881ec9dedd6c0f400b)
    ```json
    {
        "gitlab": {
            "enable": true,
            "host": "gitlab的服务器host",
            "token": "xxx",
            "avatarUrl":"https://img.icons8.com/color/480/000000/gitlab.png",
            "group":"xxx",
            "name":"xxx"
        }
    }
    ```
    字段说明：
    1. enable：打开使用gitlab开关
    2. host：gitlab的host
    3. token：gitlab账号的token，登录gitlab，【setting】->【Access Tokens】
    4. avatarUrl：头像图标地址
    5. group：读取Snippets的Project的group
    6. name：读取Snippets的Project的name

# 参考
1. [GitHub API](https://developer.github.com/v3/)
2. [GitLab API](https://docs.gitlab.com/ee/api/)
3. [hackjutsu/Lepton](https://github.com/hackjutsu/Lepton)

