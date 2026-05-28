import { User } from 'lucide-react'
import { motion } from 'framer-motion'
import { FormTitle, Field, PasswordField, CaptchaField, SubmitButton } from './FormFields'

interface PasswordResetProps {
  form: { username: string; captcha: string; newPassword: string; showPassword: boolean }
  isLoading: boolean
  countdown: number
  onSubmit: (e: React.FormEvent) => void
  onFieldChange: (field: string, value: string | boolean) => void
  onRequestCaptcha: () => void
  onBackToLogin: () => void
}

export default function PasswordReset({
  form,
  isLoading,
  countdown,
  onSubmit,
  onFieldChange,
  onRequestCaptcha,
  onBackToLogin,
}: PasswordResetProps) {
  return (
    <motion.div
      key="forgot"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <FormTitle title="重置密码" />
      <form onSubmit={onSubmit} className="space-y-6">
        <Field label="账号 / 邮箱 / 手机号" icon={<User className="h-5 w-5" />}>
          <input
            value={form.username}
            onChange={(event) => onFieldChange('username', event.target.value)}
            placeholder="请输入需要重置的账户"
            className="w-full rounded-xl px-12 py-3.5 text-white outline-none placeholder-white/40 glass-control focus:border-amber-500/50"
          />
        </Field>
        <CaptchaField
          value={form.captcha}
          countdown={countdown}
          onChange={(value) => onFieldChange('captcha', value)}
          onRequest={onRequestCaptcha}
        />
        <PasswordField
          label="新密码"
          value={form.newPassword}
          visible={form.showPassword}
          placeholder="请设置新密码"
          onChange={(value) => onFieldChange('newPassword', value)}
          onToggle={() => onFieldChange('showPassword', !form.showPassword)}
        />
        <SubmitButton loading={isLoading} loadingText="重置中..." text="确认重置" />
      </form>
      <div className="text-center">
        <button type="button" onClick={onBackToLogin} className="text-sm text-amber-400/80 transition hover:text-amber-300">
          返回登录
        </button>
      </div>
    </motion.div>
  )
}
