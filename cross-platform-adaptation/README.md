# 跨平台适配方案

一套完整的 React + TypeScript 跨平台适配解决方案，支持电脑应用、网页、手机、平板等各平台。

## 特性

- **平台检测**: 自动识别 Desktop、Mobile、Tablet、Web 平台
- **响应式布局**: 灵活的网格、Flex、堆叠、侧边栏等布局系统
- **交互适配**: 智能处理触摸、鼠标、键盘等不同输入方式
- **组件库**: 提供自适应的 Button、Card、Layout 等常用组件
- **TypeScript**: 完整的类型支持
- **无障碍**: 支持键盘导航、屏幕阅读器等辅助功能

## 安装

```bash
npm install cross-platform-adaptation
# 或
yarn add cross-platform-adaptation
```

## 快速开始

```tsx
import React from 'react';
import { 
  usePlatform, 
  AdaptiveButton, 
  AdaptiveLayout, 
  AdaptiveCard 
} from 'cross-platform-adaptation';

function App() {
  const { platform, isMobile, isTouchDevice } = usePlatform();

  return (
    <div>
      <h1>当前平台: {platform}</h1>
      
      <AdaptiveLayout layout="grid" columns={{ xs: 1, md: 2 }} gap={16}>
        <AdaptiveCard>
          <h3>卡片标题</h3>
          <p>卡片内容</p>
        </AdaptiveCard>
        
        <AdaptiveButton 
          variant="primary" 
          onClick={() => console.log('点击')}
        >
          点击我
        </AdaptiveButton>
      </AdaptiveLayout>
    </div>
  );
}
```

## Hooks

### usePlatform

检测当前平台信息和设备特性。

```tsx
const device = usePlatform();

// device 包含以下属性:
// - platform: 'desktop' | 'mobile' | 'tablet' | 'web'
// - isDesktop, isMobile, isTablet, isWeb: boolean
// - isTouchDevice: boolean
// - inputType: 'mouse' | 'touch' | 'keyboard' | 'hybrid'
// - screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
// - isLandscape: boolean
// - pixelRatio: number
// - hasHover: boolean
// - hasPointer: boolean
```

### usePlatformCondition

根据平台条件渲染不同内容。

```tsx
const { device, when } = usePlatformCondition();

return (
  <div>
    {when({
      desktop: <DesktopView />,
      mobile: <MobileView />,
      tablet: <TabletView />,
    }, <DefaultView />)}
  </div>
);
```

### useResponsive

响应式布局 Hook。

```tsx
const responsive = useResponsive({
  columns: { xs: 1, sm: 2, md: 3, lg: 4 },
  gap: { xs: 8, sm: 12, md: 16, lg: 20 },
  padding: { xs: 12, sm: 16, md: 20, lg: 24 },
});

// responsive 包含:
// - screenSize: 当前屏幕尺寸
// - windowSize: 窗口宽高
// - columns: 当前列数
// - gap: 当前间距
// - padding: 当前内边距
// - fontSize: 当前字体大小
// - isAbove(size): 是否在指定断点以上
// - isBelow(size): 是否在指定断点以下
// - isBetween(min, max): 是否在指定范围内
```

### useInteraction

交互适配 Hook。

```tsx
const interaction = useInteraction({
  longPressThreshold: 500,
  doubleTapThreshold: 300,
  swipeThreshold: 50,
  minTouchTarget: 44,
  enableHover: true,
  enableTouchFeedback: true,
});

// 触摸事件处理
<div
  onTouchStart={interaction.handleTouchStart}
  onTouchMove={interaction.handleTouchMove}
  onTouchEnd={interaction.handleTouchEnd}
>
  触摸区域
</div>
```

## 组件

### AdaptiveButton

自适应按钮组件。

```tsx
<AdaptiveButton
  variant="primary"      // 'primary' | 'secondary' | 'danger' | 'ghost'
  size="medium"          // 'small' | 'medium' | 'large'
  onClick={handleClick}
  onLongPress={handleLongPress}
  loading={false}
  disabled={false}
  icon={<Icon />}
  iconPosition="left"    // 'left' | 'right'
  fullWidth={false}
  touchFeedback={true}
  hoverEffect={true}
>
  按钮文本
</AdaptiveButton>
```

### AdaptiveLayout

自适应布局组件。

```tsx
// 网格布局
<AdaptiveLayout 
  layout="grid"
  columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
  gap={16}
>
  {items.map(item => <div key={item.id}>{item.content}</div>)}
</AdaptiveLayout>

// 堆叠布局
<AdaptiveLayout 
  layout="stack"
  stackDirection={{ xs: 'vertical', md: 'horizontal' }}
  gap={16}
>
  <div>左侧内容</div>
  <div>右侧内容</div>
</AdaptiveLayout>

// 侧边栏布局
<AdaptiveLayout layout="sidebar" sidebarBreakpoint="md">
  <AdaptiveSidebar width={280}>
    侧边栏内容
  </AdaptiveSidebar>
  <AdaptiveMain>
    主内容区
  </AdaptiveMain>
</AdaptiveLayout>
```

### AdaptiveCard

自适应卡片组件。

```tsx
<AdaptiveCard
  variant="default"      // 'default' | 'outlined' | 'elevated' | 'flat'
  padding="medium"       // 'none' | 'small' | 'medium' | 'large'
  clickable={true}
  onClick={handleClick}
  onLongPress={handleLongPress}
  header={<CardHeader title="标题" subtitle="副标题" />}
  footer={<div>底部内容</div>}
  media={<CardMedia src="image.jpg" height={200} />}
  mediaPosition="top"    // 'top' | 'bottom' | 'left' | 'right'
>
  卡片内容
</AdaptiveCard>
```

### AdaptiveContainer

自适应容器组件。

```tsx
<AdaptiveContainer 
  maxWidth="xl"          // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  centered={true}
>
  内容
</AdaptiveContainer>
```

## 平台适配指南

### 电脑应用 (Desktop)

- 使用 Electron 或 Tauri 构建
- 支持完整的鼠标交互和悬停效果
- 可以使用更复杂的布局和组件
- 支持键盘快捷键

### 网页 (Web)

- 响应式设计，适配各种屏幕尺寸
- 支持触摸和鼠标混合输入
- 优化滚动性能
- 支持 PWA 特性

### 手机 (Mobile)

- 触摸目标最小 44px
- 简化界面，突出核心功能
- 支持手势操作
- 优化滚动和动画性能

### 平板 (Tablet)

- 介于手机和桌面之间的布局
- 支持分屏和多任务
- 触摸和键盘混合输入
- 充分利用屏幕空间

## 样式适配

### CSS 变量

```css
:root {
  /* 主题色 */
  --primary-color: #3b82f6;
  --secondary-color: #6b7280;
  --danger-color: #ef4444;
  
  /* 间距 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* 圆角 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  
  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}
```

### 深色模式

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #1f2937;
    --text-color: #f9fafb;
    --border-color: #374151;
  }
}
```

### 减少动画

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 最佳实践

1. **移动优先**: 先设计移动端，再适配大屏幕
2. **触摸友好**: 确保触摸目标至少 44px
3. **性能优化**: 使用 `will-change` 和 `transform` 优化动画
4. **无障碍**: 支持键盘导航和屏幕阅读器
5. **测试**: 在真实设备上测试各种场景

## 浏览器支持

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- iOS Safari 13+
- Chrome for Android 80+

## 许可证

MIT
