import { Clock, Eye, EyeOff, Lock, Phone } from 'lucide-react'
import { motion } from 'framer-motion'

export function FormTitle({ title }: { title: string }) {
  return (
    <div className="mb-8">
      <h2 className="flex items-center gap-3 font-serif text-2xl font-bold text-white">
        <span className="h-8 w-1 rounded-full bg-amber-500" />
        {title}
      </h2>
    </div>
  )
}

export function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm text-white/60">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500/50">{icon}</span>
        {children}
      </div>
    </div>
  )
}

export function PasswordField({
  label,
  value,
  visible,
  placeholder,
  onChange,
  onToggle,
}: {
  label: string
  value: string
  visible: boolean
  placeholder: string
  onChange: (value: string) => void
  onToggle: () => void
}) {
  return (
    <Field label={label} icon={<Lock className="h-5 w-5" />}>
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl px-12 py-3.5 text-white outline-none placeholder-white/40 glass-control focus:border-amber-500/50"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500/50 transition hover:text-amber-400"
      >
        {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </Field>
  )
}

export function CaptchaField({
  value,
  countdown,
  onChange,
  onRequest,
}: {
  value: string
  countdown: number
  onChange: (value: string) => void
  onRequest: () => void
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-white/60">验证码</label>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-500/50" />
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="请输入验证码"
            className="w-full rounded-xl px-12 py-3.5 text-white outline-none placeholder-white/40 glass-control focus:border-amber-500/50"
          />
        </div>
        <button
          type="button"
          onClick={onRequest}
          disabled={countdown > 0}
          className={`rounded-xl px-5 py-3.5 transition-all ${countdown > 0 ? 'glass-control text-white/50' : 'glass-control bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'}`}
        >
          {countdown > 0 ? (
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {countdown}s
            </span>
          ) : (
            '获取验证码'
          )}
        </button>
      </div>
    </div>
  )
}

export function SubmitButton({
  loading,
  loadingText,
  text,
  onClick,
}: {
  loading: boolean
  loadingText: string
  text: string
  onClick?: () => void
}) {
  return (
    <motion.button
      type={onClick ? 'button' : 'submit'}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={loading}
      className="w-full rounded-xl bg-gradient-to-r from-red-800 to-red-600 py-4 font-bold text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all hover:from-red-700 hover:to-red-500 disabled:opacity-70"
    >
      {loading ? loadingText : text}
    </motion.button>
  )
}
