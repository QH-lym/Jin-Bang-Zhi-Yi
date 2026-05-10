/**
 * 跨平台适配方案 - 主入口
 * 
 * 提供完整的跨平台适配解决方案，支持：
 * - 电脑应用 (Desktop App)
 * - 网页 (Web)
 * - 手机 (Mobile)
 * - 平板 (Tablet)
 */

// Hooks
export { 
  usePlatform, 
  usePlatformCondition,
  type PlatformType, 
  type InputType, 
  type ScreenSize,
  type DeviceInfo 
} from './hooks/usePlatform';

export { 
  useResponsive, 
  useMediaQuery, 
  useOrientation,
  type ResponsiveConfig 
} from './hooks/useResponsive';

export { 
  useInteraction, 
  useKeyboardNavigation, 
  useScrollOptimization,
  type InteractionConfig,
  type TouchData,
  type GestureType,
  type GestureEvent
} from './hooks/useInteraction';

// Components
export { 
  AdaptiveButton, 
  type AdaptiveButtonProps 
} from './components/AdaptiveButton';

export { 
  AdaptiveLayout, 
  AdaptiveGridItem, 
  AdaptiveSidebar, 
  AdaptiveMain, 
  AdaptiveContainer,
  type AdaptiveLayoutProps,
  type AdaptiveGridItemProps,
  type AdaptiveSidebarProps,
  type AdaptiveMainProps,
  type AdaptiveContainerProps
} from './components/AdaptiveLayout';

export { 
  AdaptiveCard, 
  CardHeader, 
  CardMedia,
  type AdaptiveCardProps,
  type CardHeaderProps,
  type CardMediaProps
} from './components/AdaptiveCard';

// 版本信息
export const VERSION = '1.0.0';

// 默认导出
export default {
  VERSION,
};
