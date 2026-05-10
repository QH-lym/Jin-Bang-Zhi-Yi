/**
 * 自适应卡片组件
 * 根据平台调整卡片样式和交互
 */

import React, { useCallback } from 'react';
import { usePlatform } from '../../hooks/usePlatform';
import { useInteraction } from '../../hooks/useInteraction';
import './styles.css';

export interface AdaptiveCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  
  // 卡片变体
  variant?: 'default' | 'outlined' | 'elevated' | 'flat';
  
  // 交互配置
  clickable?: boolean;
  onClick?: () => void;
  onLongPress?: () => void;
  
  // 内容区域
  header?: React.ReactNode;
  footer?: React.ReactNode;
  media?: React.ReactNode;
  mediaPosition?: 'top' | 'bottom' | 'left' | 'right';
  
  // 尺寸
  padding?: 'none' | 'small' | 'medium' | 'large';
  
  // 无障碍
  ariaLabel?: string;
  role?: string;
}

export const AdaptiveCard: React.FC<AdaptiveCardProps> = ({
  children,
  className = '',
  style,
  variant = 'default',
  clickable = false,
  onClick,
  onLongPress,
  header,
  footer,
  media,
  mediaPosition = 'top',
  padding = 'medium',
  ariaLabel,
  role,
}) => {
  const { isTouchDevice, hasHover, screenSize } = usePlatform();
  const interaction = useInteraction({
    enableHover: hasHover && clickable,
    enableTouchFeedback: isTouchDevice && clickable,
  });

  // 处理点击
  const handleClick = useCallback(() => {
    if (clickable && onClick) {
      onClick();
    }
  }, [clickable, onClick]);

  // 处理触摸结束
  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (!clickable) return;
    
    const gesture = interaction.handleTouchEnd(event);
    if (gesture?.type === 'tap') {
      onClick?.();
    } else if (gesture?.type === 'longPress' || interaction.isLongPressed) {
      onLongPress?.();
    }
  }, [clickable, onClick, onLongPress, interaction]);

  // 获取变体类名
  const getVariantClass = () => {
    const variants = {
      default: 'adaptive-card-default',
      outlined: 'adaptive-card-outlined',
      elevated: 'adaptive-card-elevated',
      flat: 'adaptive-card-flat',
    };
    return variants[variant];
  };

  // 获取内边距类名
  const getPaddingClass = () => {
    const paddings = {
      none: 'adaptive-card-padding-none',
      small: 'adaptive-card-padding-small',
      medium: 'adaptive-card-padding-medium',
      large: 'adaptive-card-padding-large',
    };
    return paddings[padding];
  };

  // 获取媒体位置类名
  const getMediaPositionClass = () => {
    const positions = {
      top: 'adaptive-card-media-top',
      bottom: 'adaptive-card-media-bottom',
      left: 'adaptive-card-media-left',
      right: 'adaptive-card-media-right',
    };
    return positions[mediaPosition];
  };

  const cardProps = clickable ? {
    onClick: handleClick,
    onTouchStart: interaction.handleTouchStart,
    onTouchMove: interaction.handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onMouseDown: interaction.handleMouseDown,
    onMouseMove: interaction.handleMouseMove,
    onMouseUp: interaction.handleMouseUp,
    onMouseLeave: interaction.handleMouseUp,
    role: role || 'button',
    tabIndex: 0,
    'aria-label': ariaLabel,
  } : {
    role,
    'aria-label': ariaLabel,
  };

  return (
    <div
      className={`
        adaptive-card
        ${getVariantClass()}
        ${getPaddingClass()}
        ${media ? getMediaPositionClass() : ''}
        ${clickable ? 'adaptive-card-clickable' : ''}
        ${interaction.isPressed ? 'adaptive-card-pressed' : ''}
        ${isTouchDevice ? 'adaptive-card-touch' : 'adaptive-card-mouse'}
        ${className}
      `.trim()}
      style={style}
      data-variant={variant}
      data-screen={screenSize}
      data-platform={isTouchDevice ? 'touch' : 'mouse'}
      {...cardProps}
    >
      {/* 媒体区域 */}
      {media && (
        <div className="adaptive-card-media">
          {media}
        </div>
      )}
      
      {/* 内容区域 */}
      <div className="adaptive-card-content">
        {/* 头部 */}
        {header && (
          <div className="adaptive-card-header">
            {header}
          </div>
        )}
        
        {/* 主体内容 */}
        <div className="adaptive-card-body">
          {children}
        </div>
        
        {/* 底部 */}
        {footer && (
          <div className="adaptive-card-footer">
            {footer}
          </div>
        )}
      </div>
      
      {/* 触摸反馈 */}
      {clickable && isTouchDevice && interaction.isPressed && (
        <div className="adaptive-card-ripple" />
      )}
    </div>
  );
};

// 卡片头部组件
export interface CardHeaderProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  avatar?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  avatar,
  action,
  className = '',
}) => {
  return (
    <div className={`adaptive-card-header-content ${className}`}>
      {avatar && (
        <div className="adaptive-card-avatar">
          {avatar}
        </div>
      )}
      <div className="adaptive-card-header-text">
        {title && (
          <div className="adaptive-card-title">{title}</div>
        )}
        {subtitle && (
          <div className="adaptive-card-subtitle">{subtitle}</div>
        )}
      </div>
      {action && (
        <div className="adaptive-card-action">
          {action}
        </div>
      )}
    </div>
  );
};

// 卡片媒体组件
export interface CardMediaProps {
  src?: string;
  alt?: string;
  height?: number | string;
  className?: string;
  children?: React.ReactNode;
}

export const CardMedia: React.FC<CardMediaProps> = ({
  src,
  alt,
  height = 200,
  className = '',
  children,
}) => {
  const { isMobile } = usePlatform();
  
  // 移动端降低图片高度以节省空间
  const actualHeight = isMobile && typeof height === 'number' 
    ? Math.min(height, 150) 
    : height;

  return (
    <div 
      className={`adaptive-card-media-container ${className}`}
      style={{ height: typeof actualHeight === 'number' ? `${actualHeight}px` : actualHeight }}
    >
      {src ? (
        <img 
          src={src} 
          alt={alt} 
          className="adaptive-card-media-image"
          loading="lazy"
        />
      ) : (
        children
      )}
    </div>
  );
};

export default AdaptiveCard;
