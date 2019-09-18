---
title: PageView滑动进入首页效果
date: 2019-09-18 09:03:35
categories: Android
tags: [Flutter, Android]
---

# 实现后的效果
<iframe height= 520 width= 100% src="screen.mp4" frameborder=0 allowfullscreen></iframe>

# 使用PageView
按官方的文档，PageView的使用非常简单，如下是左右滑动的PageView例子：
```dart
PageView.builder(
    scrollDirection: Axis.horizontal,
    itemCount: itemCount,
    itemBuilder: (BuildContext context, int index){
        return ...;
    },
    onPageChanged: (int index){
        // ...
    },
)
```

通过PageView的源码可得知：
1. PageView是一个StatefulWidget
2. PageView是基于Scrollable来实现的

Flutter与Android的事件类型基本一致，都是down, move, up。但基包装处理类完全不一样。

# Android实现实现此效果的方式
在Android里，实现对fling的拦截处理的方式是：使用GestureDetector，如下所示：
```java
public class FlingableRelativeLayout extends RelativeLayout {
    private static final float FLING_MIN_DISTANCE = 25;
    private static final float FLING_MIN_VELOCITY = 800;
    private GestureDetector mGestureDetector;
    
    private SimpleOnGestureListener mOnGestureListener = new SimpleOnGestureListener() {
        @Override
        public boolean onFling(MotionEvent e1, MotionEvent e2, float velocityX, float velocityY) {
            float distance = e2.getX() - e1.getX();
            if(Math.abs(velocityX) > FLING_MIN_VELOCITY) {
                if(distance > FLING_MIN_DISTANCE) {
                    // 向右fling
                } else if (distance < -1 * FLING_MIN_DISTANCE) {
                    // 向左fling
                }
            }
            return false;
        }
    };
    
    public FlingableRelativeLayout(Context context, AttributeSet attributeSet, int defStyle){
        super(context, attributeSet, defStyle);
        mGestureDetector = new GestureDetector(getContext(), mOnGestureListener);
    }
    
    @Override
    public boolean dispatchTouchEvent(MotionEvent ev) {
        mGestureDetector.onTouchEvent(ev);
        return super.dispatchTouchEvent(ev);
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        mGestureDetector.onTouchEvent(event);
        return true;
    }    
}
```

# Flutter的PageView拦截对应事件
通过对PageView的源码分析发现，Scrollable对事件处理后，通过ScrollPhysics physics属性，对外暴露如下能力：
1. 滑动到min和max的时机
2. 事件up的时机

PageView通过自定义ScrollPhysics来实现up后，smoothscroll到合适的page页面，如下所示：
```dart
class PageScrollPhysics extends ScrollPhysics {
    /// Creates physics for a [PageView].
    const PageScrollPhysics({ ScrollPhysics parent }) : super(parent: parent);
    
    @override
    PageScrollPhysics applyTo(ScrollPhysics ancestor) {
        return PageScrollPhysics(parent: buildParent(ancestor));
    }

    ...

    @override
    Simulation createBallisticSimulation(ScrollMetrics position, double velocity) {
        // If we're out of range and not headed back in range, defer to the parent
        // ballistics, which should put us back in range at a page boundary.
        if ((velocity <= 0.0 && position.pixels <= position.minScrollExtent) ||
        (velocity >= 0.0 && position.pixels >= position.maxScrollExtent)) {
            // 滑动到min或max了，显示阴影效果
            return super.createBallisticSimulation(position, velocity);
        }
        
        // event up后，scroll到合适的page
        final Tolerance tolerance = this.tolerance;
        final double target = _getTargetPixels(position, tolerance, velocity);
        if (target != position.pixels)
            return ScrollSpringSimulation(spring, position.pixels, target, velocity, tolerance: tolerance);
        return null;
    }

    @override
    bool get allowImplicitScrolling => false;
}
```

PageView通过重写createBallisticSimulation()方法，实现回到合适的page与阴影效果

# 实现滑动到Max后，继续滑动进入首页效果

在PageView的PageScrollPhysics基础上，重新createBallisticSimulation()方法，拦截max后的滑动：
```dart
class LeadingPageScrollPhysics extends PageScrollPhysics {

    const LeadingPageScrollPhysics({ ScrollPhysics parent }) : super(parent: parent);

    @override
    PageScrollPhysics applyTo(ScrollPhysics ancestor) {
        return LeadingPageScrollPhysics(parent: ancestor);
    }

    @override
    Simulation createBallisticSimulation(ScrollMetrics position,
        double velocity) {
        // 最后向左滑动
        if (velocity > 0.0 && position.pixels >= position.maxScrollExtent) {
            debugPrint('createBallisticSimulation has left');
            navigatorKey.currentState.pushReplacementNamed('/home');
        }
        return super.createBallisticSimulation(position, velocity);
    }
}
```

再配置PageView的physics属性，如下所示：
```dart
PageView.builder(
    physics: LeadingPageScrollPhysics(),
    scrollDirection: Axis.horizontal,
    itemCount: itemCount,
    itemBuilder: (BuildContext context, int index){
        return ...;
    },
    onPageChanged: (int index){
        // ...
    },
)
```