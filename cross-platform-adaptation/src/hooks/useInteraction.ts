/**
 * 交互适配 Hook
 * 处理不同平台的输入方式差异
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePlatform } from './usePlatform';

// 触摸事件数据接口
export interface TouchData {
  x: number;
  y: number;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  distance: number;
  angle: number;
  velocity: number;
  scale: number;
  rotation: number;
}

// 手势类型
export type GestureType = 'tap' | 'doubleTap' | 'longPress' | 'swipe' | 'pinch' | 'rotate' | 'pan';

// 手势事件数据
export interface GestureEvent {
  type: GestureType;
  touch: TouchData;
  originalEvent: Event;
}

// 交互配置
export interface InteractionConfig {
  // 长按阈值（毫秒）
  longPressThreshold?: number;
  // 双击间隔（毫秒）
  doubleTapThreshold?: number;
  // 滑动阈值（像素）
  swipeThreshold?: number;
  // 触摸目标最小尺寸
  minTouchTarget?: number;
  // 是否启用悬停效果
  enableHover?: boolean;
  // 是否启用触摸反馈
  enableTouchFeedback?: boolean;
}

// 默认配置
const DEFAULT_CONFIG: Required<InteractionConfig> = {
  longPressThreshold: 500,
  doubleTapThreshold: 300,
  swipeThreshold: 50,
  minTouchTarget: 44, // iOS 推荐的最小触摸目标尺寸
  enableHover: true,
  enableTouchFeedback: true,
};

/**
 * 交互适配 Hook
 */
export function useInteraction(config: InteractionConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { isTouchDevice, hasHover, inputType } = usePlatform();
  
  // 触摸状态
  const [touchState, setTouchState] = useState<TouchData | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [isLongPressed, setIsLongPressed] = useState(false);
  
  // 用于追踪手势的 refs
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gestureStartDistanceRef = useRef<number>(0);
  const gestureStartAngleRef = useRef<number>(0);

  /**
   * 计算两点之间的距离
   */
  const getDistance = useCallback((p1: Touch, p2: Touch): number => {
    const dx = p2.clientX - p1.clientX;
    const dy = p2.clientY - p1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  /**
   * 计算两点之间的角度
   */
  const getAngle = useCallback((p1: Touch, p2: Touch): number => {
    return Math.atan2(p2.clientY - p1.clientY, p2.clientX - p1.clientX) * 180 / Math.PI;
  }, []);

  /**
   * 处理触摸开始
   */
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const startTime = Date.now();

    touchStartRef.current = { x: startX, y: startY, time: startTime };
    setIsPressed(true);
    setIsLongPressed(false);

    // 设置长按定时器
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPressed(true);
    }, finalConfig.longPressThreshold);

    // 处理双指手势
    if (event.touches.length === 2) {
      gestureStartDistanceRef.current = getDistance(event.touches[0], event.touches[1]);
      gestureStartAngleRef.current = getAngle(event.touches[0], event.touches[1]);
    }

    setTouchState({
      x: startX,
      y: startY,
      startX,
      startY,
      deltaX: 0,
      deltaY: 0,
      distance: 0,
      angle: 0,
      velocity: 0,
      scale: 1,
      rotation: 0,
    });
  }, [finalConfig.longPressThreshold, getDistance, getAngle]);

  /**
   * 处理触摸移动
   */
  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const time = Date.now() - touchStartRef.current.time;
    const velocity = time > 0 ? distance / time : 0;

    // 如果移动距离超过阈值，取消长按
    if (distance > 10 && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    let scale = 1;
    let rotation = 0;

    // 处理双指缩放和旋转
    if (event.touches.length === 2) {
      const currentDistance = getDistance(event.touches[0], event.touches[1]);
      const currentAngle = getAngle(event.touches[0], event.touches[1]);
      
      scale = currentDistance / gestureStartDistanceRef.current;
      rotation = currentAngle - gestureStartAngleRef.current;
    }

    setTouchState(prev => prev ? {
      ...prev,
      x: touch.clientX,
      y: touch.clientY,
      deltaX,
      deltaY,
      distance,
      angle: Math.atan2(deltaY, deltaX) * 180 / Math.PI,
      velocity,
      scale,
      rotation,
    } : null);
  }, [getDistance, getAngle]);

  /**
   * 处理触摸结束
   */
  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    setIsPressed(false);
    setIsLongPressed(false);

    if (!touchStartRef.current) return;

    const endTime = Date.now();
    const duration = endTime - touchStartRef.current.time;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // 检测双击
    if (lastTapRef.current) {
      const tapInterval = endTime - lastTapRef.current.time;
      const tapDistance = Math.sqrt(
        Math.pow(touch.clientX - lastTapRef.current.x, 2) +
        Math.pow(touch.clientY - lastTapRef.current.y, 2)
      );

      if (tapInterval < finalConfig.doubleTapThreshold && tapDistance < 20) {
        // 双击事件
        lastTapRef.current = null;
        return { type: 'doubleTap' as GestureType };
      }
    }

    lastTapRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: endTime,
    };

    // 检测滑动
    if (distance > finalConfig.swipeThreshold && duration < 300) {
      const direction = Math.abs(deltaX) > Math.abs(deltaY)
        ? (deltaX > 0 ? 'right' : 'left')
        : (deltaY > 0 ? 'down' : 'up');
      
      return { type: 'swipe' as GestureType, direction };
    }

    // 检测点击
    if (distance < 10 && duration < finalConfig.longPressThreshold) {
      return { type: 'tap' as GestureType };
    }

    touchStartRef.current = null;
    return null;
  }, [finalConfig.doubleTapThreshold, finalConfig.swipeThreshold, finalConfig.longPressThreshold]);

  /**
   * 处理鼠标按下
   */
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    touchStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      time: Date.now(),
    };
    setIsPressed(true);

    longPressTimerRef.current = setTimeout(() => {
      setIsLongPressed(true);
    }, finalConfig.longPressThreshold);
  }, [finalConfig.longPressThreshold]);

  /**
   * 处理鼠标移动
   */
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!touchStartRef.current) return;

    const deltaX = event.clientX - touchStartRef.current.x;
    const deltaY = event.clientY - touchStartRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > 10 && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  /**
   * 处理鼠标释放
   */
  const handleMouseUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsPressed(false);
    setIsLongPressed(false);
    touchStartRef.current = null;
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  /**
   * 获取触摸目标尺寸
   */
  const getTouchTargetSize = useCallback(() => {
    return isTouchDevice ? finalConfig.minTouchTarget : 'auto';
  }, [isTouchDevice, finalConfig.minTouchTarget]);

  /**
   * 获取悬停效果配置
   */
  const getHoverConfig = useCallback(() => {
    return {
      enabled: finalConfig.enableHover && hasHover,
      className: hasHover ? 'hover-enabled' : 'hover-disabled',
    };
  }, [finalConfig.enableHover, hasHover]);

  /**
   * 获取焦点样式配置
   */
  const getFocusConfig = useCallback(() => {
    return {
      // 在触摸设备上，焦点样式应该更明显
      ringWidth: isTouchDevice ? 3 : 2,
      ringColor: 'var(--focus-ring-color, #3b82f6)',
    };
  }, [isTouchDevice]);

  return {
    // 状态
    isTouchDevice,
    hasHover,
    inputType,
    isPressed,
    isLongPressed,
    touchState,
    
    // 触摸事件处理
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    
    // 鼠标事件处理
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    
    // 配置获取
    getTouchTargetSize,
    getHoverConfig,
    getFocusConfig,
    
    // 原始配置
    config: finalConfig,
  };
}

/**
 * 键盘导航 Hook
 */
export function useKeyboardNavigation() {
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);
  const [isKeyboardNavigating, setIsKeyboardNavigating] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 检测是否使用键盘导航
      if (['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(event.key)) {
        setIsKeyboardNavigating(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardNavigating(false);
    };

    const handleFocus = (event: FocusEvent) => {
      setFocusedElement(event.target as HTMLElement);
    };

    const handleBlur = () => {
      setFocusedElement(null);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  return {
    focusedElement,
    isKeyboardNavigating,
  };
}

/**
 * 滚动性能优化 Hook
 */
export function useScrollOptimization() {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    isScrolling,
    scrollClassName: isScrolling ? 'is-scrolling' : '',
  };
}

export default useInteraction;
