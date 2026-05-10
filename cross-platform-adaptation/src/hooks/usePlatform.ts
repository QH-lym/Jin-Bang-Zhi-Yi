/**
 * 平台检测与适配 Hook
 * 用于检测当前运行的平台类型和设备特性
 */

import { useState, useEffect, useCallback } from 'react';

// 平台类型定义
export type PlatformType = 'desktop' | 'mobile' | 'tablet' | 'web' | 'unknown';
export type InputType = 'mouse' | 'touch' | 'keyboard' | 'hybrid';
export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// 设备信息接口
export interface DeviceInfo {
  platform: PlatformType;
  isDesktop: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isWeb: boolean;
  isTouchDevice: boolean;
  inputType: InputType;
  screenSize: ScreenSize;
  isLandscape: boolean;
  pixelRatio: number;
  hasPointer: boolean;
  hasHover: boolean;
}

// 断点定义 (与 Tailwind CSS 保持一致)
const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * 检测平台类型
 */
function detectPlatform(): PlatformType {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // 检测平板
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(userAgent);
  
  // 检测手机
  const isMobile = /(iphone|ipod|android|blackberry|windows phone|webos|iemobile|opera mini|mobile)/.test(userAgent) && !isTablet;
  
  // 检测桌面应用 (Electron, Tauri 等)
  const isDesktopApp = typeof window !== 'undefined' && 
    (window.process?.versions?.electron || 
     (window as any).__TAURI__ ||
     userAgent.includes('electron'));
  
  if (isDesktopApp) return 'desktop';
  if (isTablet) return 'tablet';
  if (isMobile) return 'mobile';
  return 'web';
}

/**
 * 获取屏幕尺寸类型
 */
function getScreenSize(width: number): ScreenSize {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

/**
 * 检测输入方式
 */
function detectInputType(): InputType {
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const hasPointer = window.matchMedia('(pointer: fine)').matches;
  const hasHover = window.matchMedia('(hover: hover)').matches;
  
  if (hasTouch && hasPointer) return 'hybrid';
  if (hasTouch) return 'touch';
  if (hasPointer) return 'mouse';
  return 'keyboard';
}

/**
 * 平台检测 Hook
 */
export function usePlatform(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    const platform = detectPlatform();
    const width = window.innerWidth;
    
    return {
      platform,
      isDesktop: platform === 'desktop',
      isMobile: platform === 'mobile',
      isTablet: platform === 'tablet',
      isWeb: platform === 'web',
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      inputType: detectInputType(),
      screenSize: getScreenSize(width),
      isLandscape: window.innerWidth > window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1,
      hasPointer: window.matchMedia('(pointer: fine)').matches,
      hasHover: window.matchMedia('(hover: hover)').matches,
    };
  });

  // 更新设备信息
  const updateDeviceInfo = useCallback(() => {
    const platform = detectPlatform();
    const width = window.innerWidth;
    
    setDeviceInfo({
      platform,
      isDesktop: platform === 'desktop',
      isMobile: platform === 'mobile',
      isTablet: platform === 'tablet',
      isWeb: platform === 'web',
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      inputType: detectInputType(),
      screenSize: getScreenSize(width),
      isLandscape: window.innerWidth > window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1,
      hasPointer: window.matchMedia('(pointer: fine)').matches,
      hasHover: window.matchMedia('(hover: hover)').matches,
    });
  }, []);

  useEffect(() => {
    // 监听窗口大小变化
    const handleResize = () => {
      updateDeviceInfo();
    };

    // 监听方向变化
    const handleOrientationChange = () => {
      setTimeout(updateDeviceInfo, 100); // 延迟以确保获取正确的尺寸
    };

    // 监听输入方式变化
    const handlePointerChange = () => {
      updateDeviceInfo();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // 监听媒体查询变化
    const pointerMediaQuery = window.matchMedia('(pointer: fine)');
    const hoverMediaQuery = window.matchMedia('(hover: hover)');
    
    if (pointerMediaQuery.addEventListener) {
      pointerMediaQuery.addEventListener('change', handlePointerChange);
      hoverMediaQuery.addEventListener('change', handlePointerChange);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      
      if (pointerMediaQuery.removeEventListener) {
        pointerMediaQuery.removeEventListener('change', handlePointerChange);
        hoverMediaQuery.removeEventListener('change', handlePointerChange);
      }
    };
  }, [updateDeviceInfo]);

  return deviceInfo;
}

/**
 * 根据平台条件渲染组件
 */
export function usePlatformCondition() {
  const device = usePlatform();

  const when = useCallback(<T,>(
    conditions: Partial<Record<PlatformType | 'touch' | 'mouse' | 'hybrid', T>>,
    defaultValue?: T
  ): T | undefined => {
    // 检查平台类型
    if (conditions[device.platform] !== undefined) {
      return conditions[device.platform];
    }
    
    // 检查输入类型
    if (conditions[device.inputType] !== undefined) {
      return conditions[device.inputType];
    }
    
    return defaultValue;
  }, [device]);

  return { device, when };
}

export default usePlatform;
