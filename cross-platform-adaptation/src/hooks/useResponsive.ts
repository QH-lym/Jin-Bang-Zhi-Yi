/**
 * 响应式布局 Hook
 * 提供灵活的响应式布局支持
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePlatform, ScreenSize } from './usePlatform';

// 响应式配置接口
export interface ResponsiveConfig {
  // 断点配置
  breakpoints?: Record<string, number>;
  // 默认列数
  columns?: number | Record<ScreenSize, number>;
  // 间距
  gap?: number | Record<ScreenSize, number>;
  // 内边距
  padding?: number | Record<ScreenSize, number>;
  // 字体大小基准
  fontSize?: number | Record<ScreenSize, number>;
}

// 默认断点配置
const DEFAULT_BREAKPOINTS: Record<ScreenSize, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * 获取响应式值
 */
function getResponsiveValue<T>(
  value: T | Record<ScreenSize, T>,
  screenSize: ScreenSize,
  defaultValue: T
): T {
  if (typeof value !== 'object' || value === null) {
    return value;
  }
  
  if (screenSize in value) {
    return (value as Record<ScreenSize, T>)[screenSize];
  }
  
  return defaultValue;
}

/**
 * 响应式布局 Hook
 */
export function useResponsive(config: ResponsiveConfig = {}) {
  const { screenSize } = usePlatform();
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const breakpoints = useMemo(() => ({
    ...DEFAULT_BREAKPOINTS,
    ...config.breakpoints,
  }), [config.breakpoints]);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 获取响应式值
  const getValue = useCallback(<T,>(
    values: T | Record<ScreenSize, T>,
    defaultValue?: T
  ): T => {
    return getResponsiveValue(values, screenSize, defaultValue ?? (values as T));
  }, [screenSize]);

  // 计算网格列数
  const columns = useMemo(() => {
    if (config.columns === undefined) {
      // 默认列数配置
      const defaultColumns: Record<ScreenSize, number> = {
        xs: 1,
        sm: 2,
        md: 3,
        lg: 4,
        xl: 5,
        '2xl': 6,
      };
      return defaultColumns[screenSize];
    }
    return getResponsiveValue(config.columns, screenSize, 1);
  }, [config.columns, screenSize]);

  // 计算间距
  const gap = useMemo(() => {
    if (config.gap === undefined) {
      const defaultGaps: Record<ScreenSize, number> = {
        xs: 8,
        sm: 12,
        md: 16,
        lg: 20,
        xl: 24,
        '2xl': 32,
      };
      return defaultGaps[screenSize];
    }
    return getResponsiveValue(config.gap, screenSize, 16);
  }, [config.gap, screenSize]);

  // 计算内边距
  const padding = useMemo(() => {
    if (config.padding === undefined) {
      const defaultPadding: Record<ScreenSize, number> = {
        xs: 12,
        sm: 16,
        md: 20,
        lg: 24,
        xl: 32,
        '2xl': 40,
      };
      return defaultPadding[screenSize];
    }
    return getResponsiveValue(config.padding, screenSize, 16);
  }, [config.padding, screenSize]);

  // 计算字体大小
  const fontSize = useMemo(() => {
    if (config.fontSize === undefined) {
      const defaultFontSizes: Record<ScreenSize, number> = {
        xs: 14,
        sm: 14,
        md: 15,
        lg: 16,
        xl: 16,
        '2xl': 17,
      };
      return defaultFontSizes[screenSize];
    }
    return getResponsiveValue(config.fontSize, screenSize, 16);
  }, [config.fontSize, screenSize]);

  // 判断是否在指定断点以上
  const isAbove = useCallback((size: ScreenSize): boolean => {
    return windowSize.width >= breakpoints[size];
  }, [windowSize.width, breakpoints]);

  // 判断是否在指定断点以下
  const isBelow = useCallback((size: ScreenSize): boolean => {
    return windowSize.width < breakpoints[size];
  }, [windowSize.width, breakpoints]);

  // 判断是否在指定断点范围内
  const isBetween = useCallback((min: ScreenSize, max: ScreenSize): boolean => {
    return windowSize.width >= breakpoints[min] && windowSize.width < breakpoints[max];
  }, [windowSize.width, breakpoints]);

  return {
    screenSize,
    windowSize,
    columns,
    gap,
    padding,
    fontSize,
    getValue,
    isAbove,
    isBelow,
    isBetween,
    breakpoints,
  };
}

/**
 * 使用媒体查询
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    setMatches(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      // 兼容旧版浏览器
      mediaQuery.addListener(handler);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
}

/**
 * 使用方向检测
 */
export function useOrientation(): {
  isLandscape: boolean;
  isPortrait: boolean;
  angle: number;
} {
  const [orientation, setOrientation] = useState(() => ({
    isLandscape: window.innerWidth > window.innerHeight,
    isPortrait: window.innerWidth <= window.innerHeight,
    angle: (screen.orientation?.angle || 0) as number,
  }));

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation({
        isLandscape: window.innerWidth > window.innerHeight,
        isPortrait: window.innerWidth <= window.innerHeight,
        angle: (screen.orientation?.angle || 0) as number,
      });
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return orientation;
}

export default useResponsive;
