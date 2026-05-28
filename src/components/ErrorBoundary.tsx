import { Component, type ErrorInfo, type ReactNode } from 'react'

export function ModuleFallback() {
  return (
    <div className="flex min-h-[18rem] items-center justify-center">
      <div className="glass-control rounded-2xl px-5 py-3 text-sm text-white/60">正在加载模块...</div>
    </div>
  )
}

export class ModuleErrorBoundary extends Component<
  { children: ReactNode; moduleName: string },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || '模块加载失败' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.moduleName}] render failed`, error, info)
  }

  componentDidUpdate(prevProps: { moduleName: string }) {
    if (prevProps.moduleName !== this.props.moduleName && this.state.hasError) {
      this.setState({ hasError: false, message: '' })
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-6 text-center">
        <div className="text-sm font-bold text-red-200">{this.props.moduleName}暂时无法打开</div>
        <div className="mt-2 text-xs text-white/50">{this.state.message}</div>
        <button
          type="button"
          onClick={() => this.setState({ hasError: false, message: '' })}
          className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/15"
        >
          重新打开
        </button>
      </div>
    )
  }
}
