import { User } from 'lucide-react'
import { motion } from 'framer-motion'
import { FormTitle, Field, PasswordField, SubmitButton } from './FormFields'

interface LoginFormProps {
  form: { username: string; password: string; showPassword: boolean }
  isLoading: boolean
  onSubmit: (e: React.FormEvent) => void
  onFieldChange: (field: string, value: string | boolean) => void
  onForgotPassword: () => void
  onEmailLogin: () => void
  onSmsLogin: () => void
  onRegister: () => void
}

export default function LoginForm({
  form,
  isLoading,
  onSubmit,
  onFieldChange,
  onForgotPassword,
  onEmailLogin,
  onSmsLogin,
  onRegister,
}: LoginFormProps) {
  return (
    <motion.div
      key="login"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <FormTitle title="身份验证" />
      <form onSubmit={onSubmit} className="space-y-6">
        <Field label="账号 / 邮箱 / 手机号" icon={<User className="h-5 w-5" />}>
          <input
            value={form.username}
            onChange={(event) => onFieldChange('username', event.target.value)}
            placeholder="请输入账号、邮箱或手机号"
            className="w-full rounded-xl px-12 py-3.5 text-white outline-none placeholder-white/40 glass-control focus:border-amber-500/50"
          />
        </Field>
        <PasswordField
          label="密码"
          value={form.password}
          visible={form.showPassword}
          placeholder="请输入密码"
          onChange={(value) => onFieldChange('password', value)}
          onToggle={() => onFieldChange('showPassword', !form.showPassword)}
        />
        <SubmitButton loading={isLoading} loadingText="登录中..." text="确认登录" />
      </form>
      <div className="flex justify-between text-sm">
        <button type="button" onClick={onForgotPassword} className="text-white/50 transition hover:text-amber-400">
          忘记密码？
        </button>
        <button type="button" onClick={onEmailLogin} className="text-emerald-400/80 transition hover:text-emerald-300">
          📧 邮箱登录
        </button>
        <button type="button" onClick={onSmsLogin} className="text-blue-400/80 transition hover:text-blue-300">
          📱 短信登录
        </button>
        <button type="button" onClick={onRegister} className="text-amber-400/80 transition hover:text-amber-300">
          注册账户
        </button>
      </div>
    </motion.div>
  )
}
