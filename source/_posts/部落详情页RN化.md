---
title: 部落详情页RN化（ReactNative实现高度不确定的评论类列表）
date: 2019-07-28 11:17:46
categories: 前端
tags: [ReactNative]
---
# 问题及思路

<iframe height= 520 width= 100% src="/2019/07/28/部落详情页RN化/tridedetail_native.mp4" frameborder=0 allowfullscreen></iframe>

如上视频所示，上述效果里，有很多的无法确定字体数量及高度的回复类消息，此类列表消息，通过FlatList等控件，实现后的效果会很差。

针对此问题的优化思路：
1. 使用recyclerlistview控件替换flatlist控件，实现对Item的复用
2. 提前通过Native计算Text的高度

# 具体实现过程
## 框架搭建
框架结构：
1. 依据官方文档，基于0.57.8创建ReactNative项目
2. 安装依赖库：
    1. 状态管理：（注意：要安装对应版本，不能安装最新版本）
        1. redux-3.7.2（4.0.1不会起效果）
        2. react-redux-5.0.7（6.0.0，7.0.0会报错）
        3. 中间件：
            1. 异步：redux-thunk
            2. 日志：redux-logger
    2. 路由：react-navigation
    3. Prop类型：prop-types
3. 目录结构，并实现基础框架能力：入口，Route，Redux，中间件等等。

## recyclerlistview
详情页整体是一个列表，可选择的列表控件有：ListView，FlatList，RecyclerListView。其中RecylerListView的性能最好，其灵感来源于Android-RecyclerView和iOS-UICollectionView的实现思路。

recyclerlistview的使用很简单，主要是三个属性：
1. dataProvider：数据源
2. layoutProvider：指定Item的type，同时指定对应Item的width和height
2. rowRenderer：具体Item的render

recyclerlistview高性能的原因：
1. 对View的复用
2. 通过提前得到的Item宽度和高度，当快速滑动时，只绘制显示区域的内容

对于无法提前准确预估Item高度的情况下，通过forceNonDeterministicRendering=true，会通过实际高度进行纠正，当预估值与实现值差距较大时，对性能影响很大。

具体的代码：
```javascript
export default class BaseDetail extends PureComponent {

  constructor(props, forceNonDeterministicRendering){
    super(props);
    this._forceNonDeterministicRendering = forceNonDeterministicRendering;

    // 获取屏幕的宽度
    let { width } = Dimensions.get("window");
    let dataProvider = new DataProvider((r1, r2) => {
      return r1 !== r2;
    });

    // create the layout provider
    // First method: given an index return the type of item
    // Second: Given a type and object, set the height and width for that type on given object
    this._layoutProvider = new LayoutProvider(
      index => {
        let data = this.state.dataProvider.getDataForIndex(index);
        // 返回对应index的VIEW_TYPE
        //if(data.user){
        //  return UserInfo.VIEW_TYPE;
        //}
        return "EMPTY";
      },
      (type, dim, index) => {
        let data = this.state.dataProvider.getDataForIndex(index);
        
        switch (type) {
          // 返回对应view的预估高度和宽度
          // case UserInfo.VIEW_TYPE:
          //  dim.width = width;
          //  dim.height = UserInfo.ITEM_HEIGHT;
          //  break;
          default:
            dim.width = 0;
            dim.height = 0;
        }
      }
    );

    this._rowRenderer = this._rowRenderer.bind(this);

    this.state = {
      dataProvider: dataProvider.cloneWithRows([])
    };
  }

  _rowRenderer(type, data) {
    let { width } = Dimensions.get("window");
    switch (type) {
      // 返回具体的View
      // case UserInfo.VIEW_TYPE:
      //  return (
      //    <UserInfo url={data.user.avator} name={data.user.name} tag={data.user.time}/>
      //  );
      default:
        return null;
    }
  }

  render() {
    const {fetchMoreAnswerList, tribeDetail} = this.props;

    // 下一页的loading
    let renderFooter;
    if(this.state.dataProvider.getSize() === 0){
      renderFooter = <View></View>;
    } else {
      renderFooter = <LoadingMore loadingStatus={ tribeDetail.loadingStatus || 0 }/>;
    }

    return (
      <View style={{backgroundColor: '#ffffff', flex: 1}}>
        <RecyclerListView
          layoutProvider={this._layoutProvider}
          dataProvider={this.state.dataProvider}
          rowRenderer={this._rowRenderer}
          forceNonDeterministicRendering={this._forceNonDeterministicRendering}
          onEndReachedThreshold={30}
          onEndReached={() => {
            fetchMoreAnswerList();
          }}
          renderFooter={()=>{
            return renderFooter;
          }}/>
      </View>
    );
  }
}
```

对应Item组件的模板代码：
```javascript
import React, {PureComponent} from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';

export default class XXXX extends PureComponent {
  // 常量，指定当前View的预估高度和VIEW_TYPE
  static ITEM_HEIGHT = 74;
  static VIEW_TYPE = 'XXXX';

  static defaultProps = {
    ...
  };
  static propTypes = {
    ...
  };

  render(){
    const {...} = this.props;

    return (
      <View style={styles.container}>
          ...
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex:1, // 最外层的布局需要添加，使width达到fill_parent效果
    height: UserInfo.ITEM_HEIGHT,
  },
});
```

## Item: UserInfo
**数据**

```json
{
	"user": {
		"action": "...",
		"avator": "https://pic7.58cdn.com.cn/m1/bigimage/n_v279754383953a416b9d5ede99694d806e.jpg?t=1",
		"name": "荣光依旧",
		"time": "7月10日",
	}
},
```

**效果**

![](/部落详情页RN化/userinfo.png)

**实现**

通过Item模板，创建UserInfo组件类，通过Flexbox布局即可实现，注意两个细节：
1. 圆角图片：通过css属性roundAsCircle即可实现
2. 按钮：ReactNative的Button组件的定制能力很差

具体代码：
```javascript
import React, {PureComponent} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Button
} from 'react-native';
import PropTypes from 'prop-types';

export default class UserInfo extends PureComponent {

  static ITEM_HEIGHT = 74;
  static VIEW_TYPE = 'UserInfo';

  static defaultProps = {
    url: '',
    name: '',
    tag: ''
  };

  static propTypes = {
    url: PropTypes.string,
    name: PropTypes.string,
    tag: PropTypes.string
  };

  render(){
    const {url, name, tag} = this.props;

    return (
      <View style={styles.container}>
        <Image
          style={styles.image}
          roundAsCircle={true}
          source={{uri: url}}/>
        <View style={styles.content}>
          <Text style={{color:'#071A1D', fontSize: 14}}>{name}</Text>
          <Text style={{color: '#858688', fontSize: 11}}>{tag}</Text>
        </View>
        <View style={styles.button}>
          <Button
            title='+ 关注'
            color='#FFCE06'
            onPress={()=>alert('click 关注')}/>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    flexDirection: 'row',
    alignItems: 'center',
    height: UserInfo.ITEM_HEIGHT,
    backgroundColor: '#ffffff'
  },
  image: {
    width: 36,
    height: 36,
    marginLeft: 15,
    borderRadius: 35
  },
  button: {
    height: 27,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 8
  }
});
```

## 图文混排控件：FacialText
**数据**
```json
{
    "content": "许多人，活着没有选择的权利，只有干[努力]，无论怎样的环境，怎样的境遇，扛着的是家，担着的是责任[你最棒]"
}
```

**效果**

![](/部落详情页RN化/FacialText.png)

**实现**

在RN实现图文混排，主要是通过Text里的嵌套功能：
```jsx
<Text>
    许多人，活首没有选择的权利，只有干
    <Image srouce={努力} style={{width: fontSize, heigth: fontSize}}/>
    ...
</Text>
```

主要的工作量是在对传入的文本进行转换处理，把传入的文本字符串，转换为数组，具体代码如下：
```javascript
import React, {PureComponent} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';

export default class FacialText extends PureComponent {
  // 支持的表情
  static FACIAL_IMAGES = {
    ...
    '[努力]': require('./tribe_facial_25.png'),
    ...
  };

  static defalutProps = {
    facialText: null,
    content: '',
    fontSize: 12,
    color: '#000000',
    onLayout: ()=>{}
  };
  static propTypes = {
    facialText: PropTypes.object,
    content: PropTypes.string,
    fontSize: PropTypes.number,
    color: PropTypes.string,
    onLayout: PropTypes.func,
  };
  // 对文本转换
  static handleFacial(content){
    const spanArray = [];
    var computerHeightText = '';
    var imageCount = 0;

    var span = null;
    for(var index=0; index < content.length; index++){
      var char = content[index];

      if(!span) {
        span = {
          type: char === '['?'image':'text',
          start: index
        };
      }

      if(char === '[') {
        if(span && span.type==='text') {
          span.end = index-1;
          const text = content.substring(span.start, span.end+1);
          span.content = text;
          spanArray.push(span);
          computerHeightText += text;

          span = {
            type: 'image',
            start: index
          };
        }
      } else if(char === ']'){
        span.end = index;
        const text = content.substring(span.start, span.end+1);
        var facialImage = FacialText.FACIAL_IMAGES[text];
        if(facialImage) {
          span.content = facialImage;
          imageCount++;
          computerHeightText += '图';
        }else {
          span.content = text;
          span.type = 'text';
          computerHeightText += text;
        }
        spanArray.push(span);

        span = null;
      }
    }
    if(span){
      span.end = content.length-1;
      const text = content.substring(span.start, span.end+1);
      span.content = text;
      spanArray.push(span);
      computerHeightText += text;
    }

    return {
      spanArray: spanArray,
      computerHeightText: computerHeightText,
      imageCount: imageCount,
    };
  }

  render(){
    const {content, fontSize, color, onLayout} = this.props;
    var {facialText} = this.props;

    // 提前计算高度时，会提前对文本串进行处理，不用重复处理
    facialText = facialText || FacialText.handleFacial(content);

    return (
      <Text style={{fontSize: fontSize, color: color}} onLayout={onLayout}>
        {
          facialText.spanArray.map((value, index)=>{
            if(value.type === 'image'){
              return <Image key={index} source={value.content} style={{width: fontSize, height: fontSize}}/>;
            } else {
              return value.content;
            }
          })
        }
      </Text>
    );
  }
}
```

## Item: Content
**数据**
```json
{
    "content": {
        "text": "白天平均温度36°，真佩服工地里的建筑工人们，在这里大大的给他们一个赞。"
    }
}
```

**效果**

![](/部落详情页RN化/Content.png)

**实现**

此文本控件非常简单，注意点：
1. 需要在文本控件上嵌套一层View，原因：用于使用onLayout时，获取的是其实际高度。
2. 预估的高度很不准确，改进思路：
    1. 通过js的方式，通过文本预估实际高度
    2. 通过module，由native提前预估实际高度

```javascript
import React, {PureComponent} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';
import FacialText from '../facialIcon/facialText';

export default class ContentText extends PureComponent {

  static ITEM_HEIGHT = 100; // 这个值很不准备
  static VIEW_TYPE = 'ContentText';

  static defaultProps = {
    facialText: null,
    content: '',
    onLayout: null
  };

  static propTypes = {
    facialText: PropTypes.object,
    content: PropTypes.string,
    onLayout: PropTypes.func
  };

  constructor(props){
    super(props);
  }

  render() {
    const {content, onLayout, facialText} = this.props;

    return (
      <View style={{flex:1, marginRight: 15, marginLeft: 15}}>
        <FacialText facialText={facialText} onLayout={onLayout} content={content} fontSize={17} color='#57595BFF'/>
      </View>
    );
  }
}
```

## Item: PictureArea
**数据**
```json
{
    "picture_area": {
        "height": 1080,
        "pic": "https://pic8.58cdn.com.cn/mobile/big/n_v2bda58b4d3d464ec4b9b104c7a7c744bb.jpg?t=1",
        "width": 1440
    }
}
```
**效果**

![](/部落详情页RN化/PictureArea.png)

**实现**

图片控件的布局很简单，关键点：
1. 通过图片的长宽比，屏幕的宽度，计算出实际高度
2. 图片的圆角，通过css的borderRadius属性实现

```javascript
import React, {PureComponent} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';

export default class PictureArea extends PureComponent {

  static VIEW_TYPE = 'PictureArea';

  static defaultProps = {
    uri: '',
    width: 0,
    height: 0
  };

  static propTypes = {
    uri: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number
  };

  render() {
    const {uri, width, height} = this.props;

    return (
      <Image
        source={{uri: uri}}
        style={{
          flex: 1,
          width: width,
          height: height,
          marginLeft: 15,
          marginRight: 15,
          borderRadius: 5,
          marginTop: 10
        }}/>
    );
  }
}
```

## Item: Related
**数据**

```json
{
    "related": {
        "cbd": {
            "action": "...",
            "id": ...,
            "name": "建筑工基地"
        },
        "location": {
            "icon": "https://a.58cdn.com.cn/app58/icons/buluo/Rectangle1122@3x.png",
            "text": "大庆 其他"
        }
    }
}
```

**效果**

![](/部落详情页RN化/Related.png)

**实现**

此控件实现非常简单，直接上代码：

```javascript
import React, {PureComponent} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';

export default class Related extends PureComponent {

  static ITEM_HEIGHT = 50;
  static VIEW_TYPE = 'Related';

  static defaultProps = {
    locationicon: '',
    location: '',
    cbdname: '',
    width: 0
  };

  static propTypes = {
    locationicon: PropTypes.string,
    location: PropTypes.string,
    cbdname: PropTypes.string,
    width: PropTypes.number
  };

  render() {
    const {locationicon, location, cbdname, width} = this.props;

    return (
      <View style={styles.container}>
        <Image source={{uri:locationicon}} style={styles.image}/>
        <Text style={styles.location}>{location}</Text>
        <View style={{flex: 1}}/>
        <Text style={styles.cbdfrom}>来自</Text>
        <Text style={styles.cbdname}>{cbdname}</Text>
      </View>
    );
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 15,
    paddingRight: 15,
    height: Related.ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 16,
    height: 16
  },
  location: {
    color: '#585C5D',
    fontSize: 13
  },
  cbdfrom: {
    color: '#585C5D',
    fontSize: 13
  },
  cbdname: {
    color: '#FFBD03',
    fontSize: 13
  }
});
```

## Item: Interactive
**数据**

```json
{
    "interactive": {
        "like_users": {
            "total": 798, 
            "users": [
                {
                    "avator": "https://pic7.58cdn.com.cn/m1/bigimage/n_v27275ddfd821d4962baaa52f50450f4c0.jpg?t=1",
                }, 
                {
                    "avator": "https://pic5.58cdn.com.cn/m1/bigimage/n_v2572c4e76c66d4ceea964e381fa17360d.jpg?t=1", 
                }, 
                {
                    "avator": "https://pic6.58cdn.com.cn/m1/bigimage/n_v25847dcf051e04cb29fb746c5833489b8.jpg?t=1", 
                }, 
                {
                    "avator": "https://pic6.58cdn.com.cn/m1/bigimage/n_v27c8a2a1c51a8428799fd59ed79dfab79.jpg?t=1",
                }, 
                {
                    "avator": "https://pic1.58cdn.com.cn/m1/bigimage/n_19781820677644.jpg?t=1", 
                }, 
                {
                    "avator": "https://pic1.58cdn.com.cn/m1/bigimage/n_v2341a33e689c0477ead4674ca8aafedd6.jpg?t=1", 
                }, 
                {
                    "avator": "https://pic4.58cdn.com.cn/m1/bigimage/n_v2ce8072ad0635446ba708b8f4c9f70d89.jpg?t=1", 
                }, 
                {
                    "avator": "https://pic3.58cdn.com.cn/m1/bigimage/n_v232f07077747642efa41308a0cf03db5f.jpg?t=1", 
                }, 
                {
                    "avator": "https://pic7.58cdn.com.cn/m1/bigimage/n_v23cd90550c2904669ad72af0b0e549db6.jpg?t=1", 
                }, 
                {
                    "avator": "https://pic1.58cdn.com.cn/m1/bigimage/n_v2f34d5473ebf4419483d7bcada829f83e.jpg?t=1", 
                }, 
                {
                    "avator": "https://pic1.58cdn.com.cn/m1/bigimage/n_v2e5b7cc2f976245768bd3248572466eac.jpg?t=1", 
                }, 
                {
                    "avator": "https://pic5.58cdn.com.cn/m1/bigimage/n_v24eb6218a11f34d6bb0eea50e1da20d9d.jpg?t=1", 
                }, 
                {
                    "avator": "https://pic7.58cdn.com.cn/m1/bigimage/n_v2cea9a16d8abd464f8db80111352fce00.jpg?t=1", 
                }
            ]
        }
    }
}
```

**效果**

![](/部落详情页RN化/Interactive.png)

**实现**

关键点：
1. 叠加布局的实现（相当于Android里的相对布局）：
    1. 通过position:'absolute'，实现叠加
    2. 通过相对于parent的top, bottom, left, right来实现定位
2. Android里的Shape的属性stoke和corners的实现方案：使用css的borderWidth，borderColor，borderRadius属性

```javascript
import React, {PureComponent} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';

export default class Interactive extends PureComponent {

  static ITEM_HEIGHT = 250;
  static VIEW_TYPE = "Interactive";

  static defaultProps = {
    likeTotal: 0,
    users: []
  };

  static propTypes = {
    likeTotal: PropTypes.number,
    users: PropTypes.array
  };

  render() {
    const {likeTotal, users} = this.props;

    // 数据进行转换处理，转换为两行显示
    let firstUsers = [];
    let secondUsers = [];
    for(var i=0; i<7; i++){
      if(i < users.length) {
        firstUsers.push(users[i].avator);
      } else {
        firstUsers.push('');
      }
      if((i+7) < users.length) {
        secondUsers.push(users[i+7].avator);
      } else {
        secondUsers.push('');
      }
    }

    return (
      <View style={styles.container}>
        <View style={styles.firstRow}>
          <View style={styles.shareBtn}>
            <Image
              source={require('./tribe_detail_share_icon.png')}
              style={{width: 22, height: 22, marginRight: 3}}/>
            <Text style={{fontSize: 13, color: '#06191C'}}>
              分享
            </Text>
            <Image
              source={require('./tribe_coin.png')}
              style={{width: 16, height: 16, position: 'absolute', bottom:1, left: 25}}/>
          </View>
          <View style={styles.likeBtn}>
            <Image
              source={require('./tribe_detail_liked_icon.png')}
              style={{width: 22, height: 22, marginRight: 3}}/>
            <Text style={{fontSize: 13, color: '#06191C'}}>
              {likeTotal}
            </Text>
          </View>
        </View>

        <Text style={styles.likeText}>{likeTotal}人已点赞</Text>

        <View style={styles.iconRow}>
          <View style={styles.iconLine1}>
            {
              firstUsers.map((user, index)=>{
                return (
                  <Image
                    key={index}
                    style={styles.icon}
                    source={{uri: user}}/>
                );
              })
            }
          </View>
          <View style={styles.iconLine1}>
            {
              secondUsers.map((user, index)=>{
                return (
                  <Image
                    key={index}
                    style={styles.icon}
                    source={{uri: user}}/>
                );
              })
            }
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    height: Interactive.ITEM_HEIGHT,
  },
  firstRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 96,
    marginLeft: 25,
    marginRight: 25,
  },
  shareBtn: {
    width: 110,
    height: 36,
    borderWidth: 1,
    borderColor: '#E9EEEF',
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeBtn: {
    width: 110,
    height: 36,
    borderWidth: 1,
    borderColor: '#FED40D',
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeText: {
    fontSize: 12,
    color: '#84898B',
    marginBottom: 20,
    alignSelf: 'center'
  },
  iconRow: {
    flexDirection: 'column',
    marginLeft: 21.5,
    marginRight: 12.5,
    marginBottom: 30
  },
  iconLine1: {
    flexDirection: 'row',
    height: 46,
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  icon: {
    flex: 1,
    marginRight: 5,
    marginLeft: 5,
    height: 40,
    borderRadius: 35
  }
});
```

## Item: SectionGap
**数据**

```json
{
    "section_gap": {
        "color": "#F7F7F7",
        "height": 6
    }
}
```

**效果**

![](/部落详情页RN化/SectionGap.png)

**实现**

实现非常简单，高度由数据控制：
```javascript
import React, {PureComponent} from 'react';
import {
  View
} from 'react-native';
import PropTypes from 'prop-types';

export default class SectionGap extends PureComponent {

  static VIEW_TYPE = 'SectionGap';

  static defaultProps = {
    height: 0,
    color: '#ffffff'
  };
  static propTypes = {
    height: PropTypes.number,
    color: PropTypes.string
  };

  render(){
    const {height, color} = this.props;
    return (
      <View style={{flex:1, height: height, backgroundColor: color}}/>
    );
  }
}
```

## Item: ReplyTitle
**数据**

```json
{
    "reply_title": {
        "replytype": 1,
        "total": 2,
        "text": "热门回复"
    }
}
```

**效果**

![](/部落详情页RN化/ReplyTitle.png)

**实现**

效果简单，直接帖代码：
```javascript
import React, {PureComponent} from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';

export default class ReplyTitle extends PureComponent {

  static ITEM_HEIGHT = 52;
  static VIEW_TYPE = 'ReplyTitle';

  static defaultProps = {
    text: '',
    total: 0,
  };
  static propTypes = {
    text: PropTypes.string,
    total: PropTypes.number
  };

  render(){
    const {text, total} = this.props;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>{text}</Text>
        <Text style={styles.num}>({total}条)</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    paddingBottom: 15,
    paddingTop: 20,
    paddingLeft: 16,
    alignItems: 'center',
    height: ReplyTitle.ITEM_HEIGHT
  },
  title: {
    fontSize: 16,
    color: '#06191C',
    fontWeight: 'bold'
  },
  num: {
    fontSize: 11,
    color: '#06191C',
  }
});
```

## Item: Replay
**数据**
```json
{
    "reply": {
        "avatar": "https://pic1.58cdn.com.cn/m1/bigimage/n_v1bl2lwkibms4fmhw2fica.jpg?t=1", 
        "content": "许多人，活着没有选择的权利，只有干[努力]，无论怎样的环境，怎样的境遇，扛着的是家，担着的是责任[你最棒]", 
        "like_count": 66, 
        "name": "康安佳", 
        "sub_reply_list": [
            {
                "content": "说的太好了", 
                "name": "专业培训", 
                "time": "7月13日", 
            }, 
            {
                "content": "这是化工企业吧", 
                "name": "时675***", 
                "time": "7月14日", 
            }, 
            {
                "content": "赞同", 
                "name": "中国公民", 
                "time": "7月14日", 
            }
        ], 
        "time": "7月13日"
    }
}
```

**效果**

![](/部落详情页RN化/Replay.png)

**实现**

此控件的效果实现不难，由于回复文字高度不确定，无法提前预估整理高度，其实现代码：
```javascript
import React, {PureComponent} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';
import FacialText from '../facialIcon/facialText';

export default class Reply extends PureComponent {

  static ITEM_HEIGHT = 450;
  static VIEW_TYPE = 'Reply';

  static defaultProps = {
    avatar: '',
    username: '',
    likeNum: 0,
    content: '',
    facialText: null,
    postData: '',
    subReplyList: [],
    onLayout: null
  };
  static propTypes = {
    avatar: PropTypes.string,
    username: PropTypes.string,
    likeNum: PropTypes.number,
    content: PropTypes.string,
    facialText: PropTypes.object,
    postData: PropTypes.string,
    subReplyList: PropTypes.array,
    onLayout: PropTypes.func,
  };

  render(){
    const {avatar, username, likeNum, facialText, content, postData, subReplyList, onLayout} = this.props;

    let subReplyView;
    if(subReplyList.length > 0){
      subReplyView = (
        <View style={{flexDirection: 'column', paddingLeft: 10, paddingRight: 10, paddingTop: 15, paddingBottom: 2,
          backgroundColor: '#F8F9FB', borderRadius: 4, marginBottom: 16}}>
          {
            subReplyList.map((item, index)=>{
              return (
                <Text key={index} style={{fontSize: 14, color: '#27C2E4', paddingBottom: 14}}>{item.name}：{item.content}</Text>
              );
            })
          }
        </View>
      );
    }

    return (
      <View style={{flex: 1}}>
        <View style={styles.container} onLayout={onLayout}>
          <View style={styles.reply}>
            <Image
              source={{uri: avatar}}
              style={styles.avatar}/>

            <View style={styles.content}>
              <View style={styles.first}>
                <Text style={styles.username}>{username}</Text>
                <View style={{flexDirection:'row', alignItems: 'center'}}>
                  <Image source={require('./tribe_reply_unlike.png')} style={{width:17, height:17}}/>
                  <Text style={{color:'#585C5D', fontSize: 12}}>{likeNum}</Text>
                </View>
              </View>

              <FacialText facialText={facialText} content={content} fontSize={16} color='#06191C'/>

              <View style={{flexDirection: 'row', marginTop: 16, marginBottom: 16, alignItems: 'center'}}>
                <Text style={{fontSize: 12, color: '#84898B'}}>{postData}</Text>
                <View style={{width: 2, height: 2, backgroundColor: '#84898B', marginLeft: 6, marginRight: 6}}/>
                <Text style={{fontSize: 12, color: '#06191C'}}>回复Ta</Text>
              </View>

              {subReplyView}
            </View>
          </View>

          <View style={styles.sectionLine}/>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    paddingTop: 15,
  },
  reply: {
    flexDirection: 'row',
    marginRight: 15,
    marginLeft: 15,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 35
  },
  content: {
    flexDirection: 'column',
    flex: 1,
  },
  username: {
    color: '#84898B',
    fontSize: 14,
  },
  first: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 33,
    marginLeft: 10
  },
  sectionLine: {
    height: 1,
    backgroundColor: '#ECECEC'
  },
  loadMore: {
    height: 80,
    marginTop: 8,
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#E6E6FA',
    borderRadius: 50,
    backgroundColor: '#F6F7F7'
  }
});
```

## RecyclerListView自动纠错

上面的代码实现完后，有两个问题：
1. Content组件的高度无法正解预估
2. Reply组件的高度无法正解预估

利用RecyclerListView的forceNonDeterministicRendering=true属性，可以实现实际渲染后，自动纠正。

使用forceNonDeterministicRendering=true的注意点：
1. 默认Item的width不是fill_parent，需添加flex:1
2. 预估值可以通过实际绘制成功后，通过onLayout回调纠正预估值 ----- 经测试后，作用不大，无法纠正首次显示

```javascript
import React from 'react';

import { connect } from 'react-redux';
import { fetchTribeDetail, fetchMoreAnswerList } from '../../actions/index';

import BaseDetail from './baseDetail';

class Detail extends BaseDetail {

  static navigationOptions = {
    title: '详情页-非强制指定高度'
  };

  constructor(props){
    super(props, true);
  }

  componentDidMount(): void {
    const { fetchTribeDetail } = this.props;
    fetchTribeDetail();
  }

  componentWillReceiveProps(nextProps: Readonly<P>, nextContext: any): void {
    const {tribeDetail} = nextProps;

    let list = [];
    if(tribeDetail && tribeDetail.data && tribeDetail.data.list){
      list = tribeDetail.data.list;
    }

    this.setState({
      dataProvider: this.state.dataProvider.cloneWithRows(list)
    })
  }
}

const mapStateToProps = (state) => {
  return {
    tribeDetail: state.tribeDetail
  }
};
const mapDispatchToProps = { fetchTribeDetail, fetchMoreAnswerList };
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Detail)
```
<iframe height= 520 width= 100% src="/2019/07/28/部落详情页RN化/non_height.mp4" frameborder=0 allowfullscreen></iframe>

## 提前计算Text的高度

提前计算Text的高度有两种方案：
1. Js计算
2. 通过Native计算

这里主要通过Native计算的方式：
1. 安装开源库[react-native-text-size](https://github.com/aMarCruz/react-native-text-size)，添加计算Module
2. 在给recyclerlistview设置数据之前，遍历计算data里的text的高度，并保持到data里
3. 图文混排的文本计算方式：因为图片的显示大小与单个汉字的显示大小一样，只需要把表情符替换为一个汉字就行

整体效果还是很不错，但还是有两个问题：
1. 预处理数据，导致白屏时间较长
2. Native计算的结果与实现的绘制还是有一些误差，误差比较，在接受范围内
3. 针对误差的改进办法：利用onLayout的回调，纠正提前预估值。经测试，此方法不推荐，原因如下：
    1. 要超过一定的范围时，才进行纠正，不然滑动其间会有抖动
    2. 极速滑动时，onLayout的回调结果也不一致 ---- 这个无法解决

<iframe height= 520 width= 100% src="/2019/07/28/部落详情页RN化/precomputer_height.mp4" frameborder=0 allowfullscreen></iframe>


```javascript
import React from 'react';
import {
  Dimensions,
  NativeModules
} from 'react-native';

import { connect } from 'react-redux';
import { fetchTribeDetail, fetchMoreAnswerList } from '../../actions/index';

import BaseDetail from './baseDetail';
import FacialText from './facialIcon/facialText';
import Reply from "./reply";

class Detail extends BaseDetail {

  static navigationOptions = {
    title: '详情页-提前计算Text高度（Native）'
  };

  constructor(props){
    super(props, false);
    this.updateData = this.updateData.bind(this);
  }

  componentDidMount(): void {
    const { fetchTribeDetail } = this.props;
    fetchTribeDetail();
  }

  componentWillReceiveProps(nextProps: Readonly<P>, nextContext: any): void {
    const {tribeDetail} = nextProps;

    let list = [];
    if(tribeDetail && tribeDetail.data && tribeDetail.data.list){
      list = tribeDetail.data.list;
    }

    this.updateData(list);
  }

  async updateData(list):void {
    const width = Dimensions.get('window').width;

    for(var i in list){
      var item = list[i];

      if(item.content){
        // 已经计算过了，就直接跳过
        if(item.content.height) {
          continue;
        }

        item.content.facialText = FacialText.handleFacial(item.content.text);

        const size = await NativeModules.RNTextSize.measure({
          text: item.content.facialText.computerHeightText,            // text to measure, can include symbols
          width: width - 30,            // max-width of the "virtual" container
          fontSize: 17,     // RN font specification
        });
        item.content.height = size.height;
      }
      else if(item.reply){
        // 已经计算过了，就直接跳过
        if(item.reply.replyHeight){
          continue;
        }

        item.reply.facialText = FacialText.handleFacial(item.reply.content);

        const replyContentSize = await NativeModules.RNTextSize.measure({
          text: item.reply.facialText.computerHeightText,             // text to measure, can include symbols
          width: width - (34+15*2),            // max-width of the "virtual" container
          fontSize: 16,     // RN font specification
        });

        var subReplyHeight = 0;
        if(item.reply.sub_reply_list){
          for(var j in item.reply.sub_reply_list){
            var subReply = item.reply.sub_reply_list[j];

            const subReplyContentSize = await NativeModules.RNTextSize.measure({
              text: subReply.name+'：'+subReply.content,             // text to measure, can include symbols
              width: width - (34+15*2) - 20,            // max-width of the "virtual" container
              fontSize: 16,     // RN font specification
            });

            subReplyHeight += subReplyContentSize.height + 14;
          }

          if(subReplyHeight > 0) {
            subReplyHeight += 15 + 2 + 16;
          }
        }

        item.reply.replyHeight = 92 + replyContentSize.height + subReplyHeight;
      }
    }

    this.setState({
      dataProvider: this.state.dataProvider.cloneWithRows(list)
    })
  }
}

const mapStateToProps = (state) => {
  return {
    tribeDetail: state.tribeDetail
  }
};
const mapDispatchToProps = { fetchTribeDetail, fetchMoreAnswerList };
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Detail)
```

# 总结
## 开发中遇到的问题
1. 每次重新加载，都需要拿起来摇一摇
2. 只有调试状态，才能看到console.log的日志
3. 调试时，需要把ip地址改为localhost
4. 基于0.57.8的ReactNative项目，依赖第三方库时，要选择对应版本，不能直接通过npm install xxx安装
5. 颜色区别：Android里是ARGB，RN里是RGBA，不能直接复制android的颜色值

## 性能上遇到的问题
1. 当非常快速滑动时，虽然会快速显示出内容，但还是会看到白屏，无法与纯Native开发的效果对比
2. 当js与native通过jsbridge频繁交互时（如通过native埋点交互），js的帧率会下降的很快

## 思考
1. 为了提升发性能，应尽量减少js与native的交互，如减少交互频率，交互数据量等等
2. 对开发效率与性能问题应整体思考：
    1. 学习Expo，完善脚手架：
        1. 提前包含第三方的依赖库，解决依赖版本的问题
        2. 支持状态管理，路由支持，Prop类型支持
        3. Component的模板
    2. 学习Expo，实现界面化开发工具，具备如下功能：
        1. 显示关键信息：
            1. 自动显示issues信息
            2. 非调试模试下，显示console.log()的日志
            3. 显示metro的编译信息
            4. 显示测试手机信息
        2. 通过二维码扫描，打开RN页面，不用手动查IP再输入
        3. 可切换到生产模式，方便测试生产模式的效果
        4. 直接与发布平台对接，可直接进行发布，同时发布时，自动把图片等资源上传到CDN（通过固定资源的目录，如assets目录实现）
    5. 学习Expo，实现手机的工具功能（iOS-工具页面，android-通知栏）：
        1. 通知栏支持Reload与当前的bundle项目名称
        2. 同步显示bundle的编译进度，同时显示编译结果
        3. 提供Module与ReactNative原生组件与自定义组件的Demo页面
    6. 学习Expo，优化文档平台和跨平台
        1. 文档融合ReactNative对应版本的文档，如Module，View等等
        2. 文档上的Demo，可支持二维码扫描后，直接运行
        3. 实现支持跨平台的基础组件，高级组件由基础组件实现
    7. 学习Expo，支持两套ReactNative版本，减少版本升级的影响，实现平稳过渡
    8. 学习Expo的异常处理流程：
        1. dev状态：出错后，直接显示红色的出错页面
        2. prod状态：
            1. JS使用Sentry来捕获js的异常 ---- 重点
            2. 重大js异常：出错后，重新reload；reload还出错，显示出错页面，让用户手动reload

结论：
1. 要追求极致体验，还是Native最合适，只有当ReactNative像Flutter一样，真正改变交互方式，不要过渡依赖jsbridge，才会有比较大的改善
2. ReactNative的开发效率比Native要快很多，基于MVVM的组件化开发，比Native的开发方式更加合理

# 参考
1. [Getting to know Expo](https://docs.expo.io/versions/latest/)
2. [react-native项目中从零开始使用redux](https://www.jianshu.com/p/8fb7df931eea)
3. [解读redux工作原理](http://zhenhua-lee.github.io/react/redux.html)