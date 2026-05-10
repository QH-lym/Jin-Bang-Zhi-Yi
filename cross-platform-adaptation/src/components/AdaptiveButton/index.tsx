/**
 * 自适应按钮组件
 * 根据平台自动调整样式和交互方式
 */

import React, { useCallback } from 'react';
import { usePlatform } from '../../hooks/usePlatform';
import { useInteraction } from '../../hooks/useInteraction';
import './styles.css';

export interface AdaptiveButtonProps {
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent | React.TouchEvent) => void;
  onLongPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  className?: string;
  style?: React.CSSProperties;
  // 触摸特定配置
  touchFeedback?: boolean;
  // 悬停效果
  hoverEffect?: boolean;
  // 键盘快捷键
  shortcut?: string;
  // 无障碍标签
  ariaLabel?: string;
}

export const AdaptiveButton: React.FC<AdaptiveButtonProps> = ({
  children,
  onClick,
  onLongPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  style,
  touchFeedback = true,
  hoverEffect = true,
  shortcut,
  ariaLabel,
}) => {
  const { isTouchDevice, hasHover, screenSize } = usePlatform();
  const interaction = useInteraction({
    enableHover: hoverEffect && hasHover,
    enableTouchFeedback: touchFeedback,
  });

  // 处理点击事件
  const handleClick = useCallback((event: React.MouseEvent) => {
    if (disabled || loading) return;
    onClick?.(event);
  }, [disabled, loading, onClick]);

  // 处理触摸结束
  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (disabled || loading) return;
    
    const gesture = interaction.handleTouchEnd(event);
    if (gesture?.type === 'tap') {
      onClick?.(event);
    } else if (gesture?.type === 'longPress' || interaction.isLongPressed) {
      onLongPress?.();
    }
  }, [disabled, loading, onClick, onLongPress, interaction]);

  // 根据平台调整按钮尺寸
  const getButtonSize = () => {
    const baseSizes = {
      small: { height: 32, padding: '6px 12px', fontSize: 14 },
      medium: { height: 40, padding: '8px 16px', fontSize: 15 },
      large: { height: 48, padding: '12px 24px', fontSize: 16 },
    };

    // 触摸设备增大触摸目标
    if (isTouchDevice) {
      const minTouchSize = 44;
      return {
        ...baseSizes[size],
        minHeight: Math.max(baseSizes[size].height, minTouchSize),
        minWidth: Math.max(baseSizes[size].height, minTouchSize),
      };
    }

    return baseSizes[size];
  };

  // 获取变体样式
  const getVariantClass = () => {
    const variants = {
      primary: 'adaptive-btn-primary',
      secondary: 'adaptive-btn-secondary',
      danger: 'adaptive-btn-danger',
      ghost: 'adaptive-btn-ghost',
    };
    return variants[variant];
  };

  const buttonSize = getButtonSize();

  return (
    <button
      className={`
        adaptive-btn
        ${getVariantClass()}
        ${isTouchDevice ? 'adaptive-btn-touch' : 'adaptive-btn-mouse'}
        ${interaction.isPressed ? 'adaptive-btn-pressed' : ''}
        ${interaction.isLongPressed ? 'adaptive-btn-long-pressed' : ''}
        ${loading ? 'adaptive-btn-loading' : ''}
        ${fullWidth ? 'adaptive-btn-full-width' : ''}
        ${className}
      `.trim()}
      style={{
        ...style,
        padding: buttonSize.padding,
        fontSize: buttonSize.fontSize,
        minHeight: buttonSize.minHeight,
        minWidth: buttonSize.minWidth,
        width: fullWidth ? '100%' : 'auto',
      }}
      onClick={handleClick}
      onTouchStart={interaction.handleTouchStart}
      onTouchMove={interaction.handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={interaction.handleMouseDown}
      onMouseMove={interaction.handleMouseMove}
      onMouseUp={interaction.handleMouseUp}
      onMouseLeave={interaction.handleMouseUp}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      aria-busy={loading}
      data-shortcut={shortcut}
      data-platform={isTouchDevice ? 'touch' : 'mouse'}
      data-screen={screenSize}
    >
      {loading && (
        <span className="adaptive-btn-spinner" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="31.416"
              strokeDashoffset="31.416"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="31.416"
                to="0"
                dur="1s"
                repeatCount="indefinite"
              />
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 12 12"
                to="360 12 12"
                dur="1s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        </span>
      )}
      
      {icon && iconPosition === 'left' && !loading && (
        <span className="adaptive-btn-icon adaptive-btn-icon-left">{icon}</span>
      )}
      
      <span className="adaptive-btn-content">{children}</span>
      
      {icon && iconPosition === 'right' && !loading && (
        <span className="adaptive-btn-icon adaptive-btn-icon-right">{icon}</span>
      )}
      
      {/* 触摸反馈波纹效果 */}
      {touchFeedback && isTouchDevice && interaction.isPressed && (
        <span className="adaptive-btn-ripple" />
      )}
    </button>
  );
};

export default AdaptiveButton;
