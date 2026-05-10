/**
 * 跨平台适配示例应用
 * 展示如何使用适配组件和 Hooks
 */

import React, { useState } from 'react';
import {
  usePlatform,
  useResponsive,
  useInteraction,
  AdaptiveButton,
  AdaptiveLayout,
  AdaptiveCard,
  CardHeader,
  CardMedia,
  AdaptiveContainer,
} from '../src';

// 设备信息展示组件
const DeviceInfo: React.FC = () => {
  const device = usePlatform();
  const responsive = useResponsive();

  return (
    <AdaptiveCard variant="outlined" padding="medium">
      <h3>设备信息</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        <div>
          <strong>平台:</strong> {device.platform}
        </div>
        <div>
          <strong>屏幕尺寸:</strong> {device.screenSize}
        </div>
        <div>
          <strong>输入方式:</strong> {device.inputType}
        </div>
        <div>
          <strong>触摸设备:</strong> {device.isTouchDevice ? '是' : '否'}
        </div>
        <div>
          <strong>支持悬停:</strong> {device.hasHover ? '是' : '否'}
        </div>
        <div>
          <strong>窗口大小:</strong> {responsive.windowSize.width}x{responsive.windowSize.height}
        </div>
        <div>
          <strong>方向:</strong> {device.isLandscape ? '横屏' : '竖屏'}
        </div>
        <div>
          <strong>像素比:</strong> {device.pixelRatio}
        </div>
      </div>
    </AdaptiveCard>
  );
};

// 按钮展示组件
const ButtonShowcase: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const interaction = useInteraction();

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <AdaptiveCard variant="outlined" padding="medium">
      <h3>自适应按钮</h3>
      <AdaptiveLayout layout="flex" gap={12} style={{ flexWrap: 'wrap' }}>
        <AdaptiveButton variant="primary" onClick={handleClick}>
          主要按钮
        </AdaptiveButton>
        
        <AdaptiveButton variant="secondary" onClick={handleClick}>
          次要按钮
        </AdaptiveButton>
        
        <AdaptiveButton variant="danger" onClick={handleClick}>
          危险按钮
        </AdaptiveButton>
        
        <AdaptiveButton variant="ghost" onClick={handleClick}>
          幽灵按钮
        </AdaptiveButton>
        
        <AdaptiveButton variant="primary" loading={loading} onClick={handleClick}>
          加载中
        </AdaptiveButton>
        
        <AdaptiveButton variant="primary" disabled onClick={handleClick}>
          禁用按钮
        </AdaptiveButton>
        
        <AdaptiveButton variant="primary" size="small" onClick={handleClick}>
          小按钮
        </AdaptiveButton>
        
        <AdaptiveButton variant="primary" size="large" onClick={handleClick}>
          大按钮
        </AdaptiveButton>
      </AdaptiveLayout>
      
      <div style={{ marginTop: 16 }}>
        <p>
          <strong>触摸目标尺寸:</strong> {interaction.getTouchTargetSize()}px
        </p>
        <p>
          <strong>悬停效果:</strong> {interaction.getHoverConfig().enabled ? '启用' : '禁用'}
        </p>
      </div>
    </AdaptiveCard>
  );
};

// 布局展示组件
const LayoutShowcase: React.FC = () => {
  const { screenSize } = usePlatform();

  return (
    <AdaptiveCard variant="outlined" padding="medium">
      <h3>响应式布局</h3>
      <p>当前屏幕尺寸: <strong>{screenSize}</strong></p>
      
      <h4>网格布局</h4>
      <AdaptiveLayout 
        layout="grid" 
        columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5, '2xl': 6 }}
        gap={12}
        style={{ marginBottom: 24 }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              background: '#e0e7ff',
              padding: 16,
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            项目 {i}
          </div>
        ))}
      </AdaptiveLayout>

      <h4>堆叠布局</h4>
      <AdaptiveLayout 
        layout="stack" 
        stackDirection={{ xs: 'vertical', md: 'horizontal' }}
        gap={12}
      >
        <div
          style={{
            background: '#fce7f3',
            padding: 16,
            borderRadius: 8,
            flex: 1,
          }}
        >
          左侧内容
        </div>
        <div
          style={{
            background: '#d1fae5',
            padding: 16,
            borderRadius: 8,
            flex: 1,
          }}
        >
          右侧内容
        </div>
      </AdaptiveLayout>
    </AdaptiveCard>
  );
};

// 卡片展示组件
const CardShowcase: React.FC = () => {
  const { isMobile } = usePlatform();

  return (
    <AdaptiveCard variant="outlined" padding="medium">
      <h3>自适应卡片</h3>
      
      <AdaptiveLayout layout="grid" columns={{ xs: 1, md: 2 }} gap={16}>
        {/* 可点击卡片 */}
        <AdaptiveCard
          variant="elevated"
          clickable
          onClick={() => alert('卡片被点击！')}
          onLongPress={() => alert('长按触发！')}
          header={
            <CardHeader
              title="可点击卡片"
              subtitle="支持点击和长按操作"
              avatar={<div style={{ width: 40, height: 40, borderRadius: '50%', background: '#3b82f6' }} />}
            />
          }
        >
          <p>这是一个可点击的卡片组件。在触摸设备上支持点击和长按操作，在桌面设备上支持点击操作。</p>
        </AdaptiveCard>

        {/* 带媒体的卡片 */}
        <AdaptiveCard
          variant="default"
          media={
            <CardMedia
              height={isMobile ? 120 : 160}
              src="https://via.placeholder.com/400x200/3b82f6/ffffff?text=Adaptive+Card"
              alt="示例图片"
            />
          }
          header={
            <CardHeader
              title="带媒体的卡片"
              subtitle="自动适配移动端"
            />
          }
        >
          <p>卡片媒体区域会根据设备类型自动调整高度。在移动端，图片高度会降低以节省屏幕空间。</p>
        </AdaptiveCard>
      </AdaptiveLayout>
    </AdaptiveCard>
  );
};

// 平台特定内容组件
const PlatformSpecificContent: React.FC = () => {
  const { when } = usePlatformCondition();

  return (
    <AdaptiveCard variant="outlined" padding="medium">
      <h3>平台特定内容</h3>
      <p>根据当前平台显示不同内容：</p>
      
      <div style={{ 
        padding: 16, 
        background: '#f3f4f6', 
        borderRadius: 8,
        marginTop: 12 
      }}>
        {when({
          desktop: <strong>这是桌面应用版本的内容</strong>,
          mobile: <strong>这是移动应用版本的内容</strong>,
          tablet: <strong>这是平板应用版本的内容</strong>,
          web: <strong>这是网页版本的内容</strong>,
        }, <strong>未知平台</strong>)}
      </div>

      <div style={{ marginTop: 16 }}>
        <h4>输入方式适配：</h4>
        {when({
          touch: <p>您正在使用触摸设备，界面已优化触摸操作。</p>,
          mouse: <p>您正在使用鼠标，可以使用悬停效果。</p>,
          hybrid: <p>您的设备支持多种输入方式。</p>,
        })}
      </div>
    </AdaptiveCard>
  );
};

// 主应用组件
const App: React.FC = () => {
  const { isMobile } = usePlatform();

  return (
    <AdaptiveContainer maxWidth="xl" style={{ padding: isMobile ? 12 : 24 }}>
      <header style={{ marginBottom: 24 }}>
        <h1>跨平台适配方案示例</h1>
        <p>支持电脑应用、网页、手机、平板各平台</p>
      </header>

      <AdaptiveLayout 
        layout="grid" 
        columns={{ xs: 1, lg: 2 }}
        gap={16}
      >
        <DeviceInfo />
        <ButtonShowcase />
        <LayoutShowcase />
        <CardShowcase />
        <PlatformSpecificContent />
      </AdaptiveLayout>

      <footer style={{ 
        marginTop: 32, 
        padding: 16, 
        textAlign: 'center',
        color: '#6b7280',
        borderTop: '1px solid #e5e7eb'
      }}>
        <p>跨平台适配方案 v1.0.0 | React + TypeScript</p>
      </footer>
    </AdaptiveContainer>
  );
};

// 导入 usePlatformCondition
import { usePlatformCondition } from '../src/hooks/usePlatform';

export default App;
