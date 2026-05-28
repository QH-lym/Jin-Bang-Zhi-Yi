import { Mail, Phone, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { FormTitle, Field, PasswordField, CaptchaField, SubmitButton } from './FormFields'

interface RegisterFormProps {
  form: {
    username: string
    displayName: string
    email: string
    phone: string
    captcha: string
    password: string
    showPassword: boolean
  }
  isLoading: boolean
  countdown: number
  onSubmit: (e: React.FormEvent) => void
  onFieldChange: (field: string, value: string | boolean) => void
  onRequestCaptcha: () => void
  onBackToLogin: () => void
}

export default function RegisterForm({
  form,
  isLoading,
  countdown,
  onSubmit,
  onFieldChange,
  onRequestCaptcha,
  onBackToLogin,
}: RegisterFormProps) {
  return (
    <motion.div
      key="register"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-5"
    >
      <FormTitle title="账户注册" />
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="登录账号" icon={<User className="h-5 w-5" />}>
          <input
            value={form.username}
            onChange={(event) => onFieldChange('username', event.target.value)}
            placeholder="请设置登录账号"
            className="w-full rounded-xl px-12 py-3.5 text-white outline-none placeholder-white/40 glass-control focus:border-amber-500/50"
          />
        </Field>
        <Field label="昵称" icon={<User className="h-5 w-5" />}>
          <input
            value={form.displayName}
            onChange={(event) => onFieldChange('displayName', event.target.value)}
            placeholder="用于个人资料展示"
            className="w-full rounded-xl px-12 py-3.5 text-white outline-none placeholder-white/40 glass-control focus:border-amber-500/50"
          />
        </Field>
        <Field label="邮箱" icon={<Mail className="h-5 w-5" />}>
          <input
            value={form.email}
            onChange={(event) => onFieldChange('email', event.target.value)}
            placeholder="请输入邮箱"
            className="w-full rounded-xl px-12 py-3.5 text-white outline-none placeholder-white/40 glass-control focus:border-amber-500/50"
          />
        </Field>
        <Field label="手机号" icon={<Phone className="h-5 w-5" />}>
          <input
            value={form.phone}
            onChange={(event) => onFieldChange('phone', event.target.value)}
            placeholder="请输入手机号"
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
          label="设置密码"
          value={form.password}
          visible={form.showPassword}
          placeholder="请设置密码"
          onChange={(value) => onFieldChange('password', value)}
          onToggle={() => onFieldChange('showPassword', !form.showPassword)}
        />
        <SubmitButton loading={isLoading} loadingText="注册中..." text="立即注册" />
      </form>
      <div className="text-center">
        <button type="button" onClick={onBackToLogin} className="text-sm text-amber-400/80 transition hover:text-amber-300">
          已有账号？返回登录
        </button>
      </div>
    </motion.div>
  )
}
