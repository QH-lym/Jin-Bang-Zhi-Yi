/**
 * 自适应布局组件
 * 根据屏幕尺寸和平台自动调整布局
 */

import React, { useMemo } from 'react';
import { useResponsive, ResponsiveConfig } from '../../hooks/useResponsive';
import { usePlatform, ScreenSize } from '../../hooks/usePlatform';
import './styles.css';

export interface AdaptiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  
  // 布局类型
  layout?: 'grid' | 'flex' | 'stack' | 'sidebar' | 'masonry';
  
  // 响应式配置
  responsiveConfig?: ResponsiveConfig;
  
  // 网格特定配置
  columns?: number | Record<ScreenSize, number>;
  gap?: number | Record<ScreenSize, number>;
  
  // 侧边栏配置
  sidebarWidth?: number | string;
  sidebarPosition?: 'left' | 'right';
  sidebarBreakpoint?: ScreenSize;
  
  // 堆叠配置
  stackDirection?: 'vertical' | 'horizontal' | Record<ScreenSize, 'vertical' | 'horizontal'>;
  
  // 平台特定渲染
  renderForDesktop?: React.ReactNode;
  renderForMobile?: React.ReactNode;
  renderForTablet?: React.ReactNode;
  renderForWeb?: React.ReactNode;
}

export const AdaptiveLayout: React.FC<AdaptiveLayoutProps> = ({
  children,
  className = '',
  style,
  layout = 'flex',
  responsiveConfig = {},
  columns,
  gap,
  sidebarWidth = 280,
  sidebarPosition = 'left',
  sidebarBreakpoint = 'md',
  stackDirection = 'vertical',
  renderForDesktop,
  renderForMobile,
  renderForTablet,
  renderForWeb,
}) => {
  const { isDesktop, isMobile, isTablet, isWeb, screenSize } = usePlatform();
  const responsive = useResponsive({
    ...responsiveConfig,
    columns,
    gap,
  });

  // 平台特定内容
  const platformContent = useMemo(() => {
    if (isDesktop && renderForDesktop) return renderForDesktop;
    if (isMobile && renderForMobile) return renderForMobile;
    if (isTablet && renderForTablet) return renderForTablet;
    if (isWeb && renderForWeb) return renderForWeb;
    return children;
  }, [isDesktop, isMobile, isTablet, isWeb, renderForDesktop, renderForMobile, renderForTablet, renderForWeb, children]);

  // 获取当前堆叠方向
  const currentStackDirection = useMemo(() => {
    if (typeof stackDirection === 'string') return stackDirection;
    return stackDirection[screenSize] || 'vertical';
  }, [stackDirection, screenSize]);

  // 生成布局样式
  const layoutStyles = useMemo(() => {
    const baseStyles: React.CSSProperties = {
      ...style,
    };

    switch (layout) {
      case 'grid':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: `repeat(${responsive.columns}, 1fr)`,
          gap: responsive.gap,
          padding: responsive.padding,
        };

      case 'flex':
        return {
          ...baseStyles,
          display: 'flex',
          flexWrap: 'wrap' as const,
          gap: responsive.gap,
          padding: responsive.padding,
        };

      case 'stack':
        return {
          ...baseStyles,
          display: 'flex',
          flexDirection: currentStackDirection === 'vertical' ? 'column' : 'row',
          gap: responsive.gap,
          padding: responsive.padding,
        };

      case 'sidebar':
        const showSidebar = responsive.isAbove(sidebarBreakpoint);
        return {
          ...baseStyles,
          display: 'flex',
          flexDirection: sidebarPosition === 'left' ? 'row' : 'row-reverse',
          gap: responsive.gap,
          padding: responsive.padding,
        };

      case 'masonry':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: `repeat(${responsive.columns}, 1fr)`,
          gridAutoRows: 'minmax(100px, auto)',
          gap: responsive.gap,
          padding: responsive.padding,
        };

      default:
        return baseStyles;
    }
  }, [layout, style, responsive, currentStackDirection, sidebarPosition, sidebarBreakpoint]);

  // 生成布局类名
  const layoutClassName = useMemo(() => {
    const classes = [
      'adaptive-layout',
      `adaptive-layout-${layout}`,
      `adaptive-layout-${screenSize}`,
      isDesktop ? 'adaptive-layout-desktop' : '',
      isMobile ? 'adaptive-layout-mobile' : '',
      isTablet ? 'adaptive-layout-tablet' : '',
      isWeb ? 'adaptive-layout-web' : '',
      className,
    ].filter(Boolean).join(' ');

    return classes;
  }, [layout, screenSize, isDesktop, isMobile, isTablet, isWeb, className]);

  return (
    <div
      className={layoutClassName}
      style={layoutStyles}
      data-layout={layout}
      data-screen={screenSize}
      data-platform={isDesktop ? 'desktop' : isMobile ? 'mobile' : isTablet ? 'tablet' : 'web'}
    >
      {platformContent}
    </div>
  );
};

// 自适应网格项组件
export interface AdaptiveGridItemProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  colSpan?: number | Record<ScreenSize, number>;
  rowSpan?: number;
}

export const AdaptiveGridItem: React.FC<AdaptiveGridItemProps> = ({
  children,
  className = '',
  style,
  colSpan = 1,
  rowSpan = 1,
}) => {
  const { screenSize } = usePlatform();

  const currentColSpan = useMemo(() => {
    if (typeof colSpan === 'number') return colSpan;
    return colSpan[screenSize] || 1;
  }, [colSpan, screenSize]);

  const itemStyles: React.CSSProperties = {
    ...style,
    gridColumn: `span ${currentColSpan}`,
    gridRow: `span ${rowSpan}`,
  };

  return (
    <div
      className={`adaptive-grid-item ${className}`}
      style={itemStyles}
      data-col-span={currentColSpan}
      data-row-span={rowSpan}
    >
      {children}
    </div>
  );
};

// 自适应侧边栏组件
export interface AdaptiveSidebarProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  collapsible?: boolean;
  breakpoint?: ScreenSize;
}

export const AdaptiveSidebar: React.FC<AdaptiveSidebarProps> = ({
  children,
  className = '',
  style,
  width = 280,
  collapsible = true,
  breakpoint = 'md',
}) => {
  const { isAbove } = useResponsive();
  const isVisible = isAbove(breakpoint);

  const sidebarStyles: React.CSSProperties = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    minWidth: typeof width === 'number' ? `${width}px` : width,
    display: isVisible ? 'block' : collapsible ? 'none' : 'block',
  };

  return (
    <aside
      className={`adaptive-sidebar ${className}`}
      style={sidebarStyles}
      data-visible={isVisible}
      data-collapsible={collapsible}
    >
      {children}
    </aside>
  );
};

// 自适应主内容区组件
export interface AdaptiveMainProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const AdaptiveMain: React.FC<AdaptiveMainProps> = ({
  children,
  className = '',
  style,
}) => {
  return (
    <main className={`adaptive-main ${className}`} style={style}>
      {children}
    </main>
  );
};

// 自适应容器组件
export interface AdaptiveContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  centered?: boolean;
}

export const AdaptiveContainer: React.FC<AdaptiveContainerProps> = ({
  children,
  className = '',
  style,
  maxWidth = 'xl',
  centered = true,
}) => {
  const maxWidths: Record<string, string> = {
    xs: '480px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    full: '100%',
  };

  const containerStyles: React.CSSProperties = {
    ...style,
    maxWidth: maxWidths[maxWidth],
    marginLeft: centered ? 'auto' : undefined,
    marginRight: centered ? 'auto' : undefined,
    width: '100%',
  };

  return (
    <div
      className={`adaptive-container ${className}`}
      style={containerStyles}
      data-max-width={maxWidth}
    >
      {children}
    </div>
  );
};

export default AdaptiveLayout;
