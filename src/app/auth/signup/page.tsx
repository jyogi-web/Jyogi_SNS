'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { SignUpData } from '@/types'
import { Eye, EyeOff, User, Mail, Lock, Home } from 'lucide-react'

export default function SignUpPage() {
  const [formData, setFormData] = useState<SignUpData>({
    email: '',
    password: '',
    username: '',
    displayName: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await signUp(formData)
      if (error) {
        throw new Error(error.message)
      }
      const verifyParams = new URLSearchParams({
        source: 'signup',
        email: formData.email,
      })
      router.push(`/auth/verify?${verifyParams.toString()}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '新規登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-8">
      {/* ホームに戻るボタン */}
      <Link 
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
      >
        <Home size={20} />
        <span className="text-sm">ホームに戻る</span>
      </Link>

      {/* メインコンテンツ */}
      <div className="w-full max-w-md space-y-8">
        {/* ロゴとタイトル */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <Image
              src="/JyogiIcon.png"
              alt="JyogiSNS Logo"
              width={80}
              height={80}
              className="rounded-2xl"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">新規登録</h1>
            <p className="text-gray-400">新しいアカウントを作成してください</p>
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ユーザー名 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">ユーザー名</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-12 pr-4 py-3 bg-gray-900/50 border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all ${
                  focusedField === 'username' 
                    ? 'border-blue-500/50 bg-gray-800/50' 
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                placeholder="ユーザー名を入力"
                required
              />
            </div>
          </div>

          {/* 表示名 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">表示名</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                onFocus={() => setFocusedField('displayName')}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-12 pr-4 py-3 bg-gray-900/50 border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all ${
                  focusedField === 'displayName' 
                    ? 'border-blue-500/50 bg-gray-800/50' 
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                placeholder="表示名を入力"
                required
              />
            </div>
          </div>

          {/* メールアドレス */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">メールアドレス</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-12 pr-4 py-3 bg-gray-900/50 border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all ${
                  focusedField === 'email' 
                    ? 'border-blue-500/50 bg-gray-800/50' 
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          {/* パスワード */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">パスワード</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-12 pr-12 py-3 bg-gray-900/50 border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all ${
                  focusedField === 'password' 
                    ? 'border-blue-500/50 bg-gray-800/50' 
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                placeholder="パスワードを入力"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                )}
              </button>
            </div>
          </div>

          {/* 新規登録ボタン */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 disabled:from-gray-700 disabled:to-gray-600 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed"
          >
            {loading ? '新規登録中...' : '新規登録'}
          </button>
        </form>

        {/* ログインリンク */}
        <div className="text-center">
          <p className="text-gray-400">
            既にアカウントをお持ちの方は{' '}
            <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
