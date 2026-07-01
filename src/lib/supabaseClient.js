import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

const PLACEHOLDER_MARKERS = ['your-project-ref', 'your-anon-key', 'example.com']

function isPlaceholder(value) {
  if (!value) return true
  const lower = value.toLowerCase()
  return PLACEHOLDER_MARKERS.some(marker => lower.includes(marker))
}

/** True when real backend credentials are set (not .env.example placeholders). */
export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey),
)

function createQueryBuilder(defaultData = []) {
  const response = { data: defaultData, error: null }
  const builder = {
    select: () => builder,
    insert: () => builder,
    upsert: () => builder,
    update: () => builder,
    delete: () => builder,
    eq: () => builder,
    neq: () => builder,
    in: () => builder,
    order: () => builder,
    limit: () => builder,
    filter: () => builder,
    match: () => builder,
    gte: () => builder,
    lte: () => builder,
    gt: () => builder,
    lt: () => builder,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  }
  builder.then = (onFulfilled, onRejected) => Promise.resolve(response).then(onFulfilled, onRejected)
  builder.catch = onRejected => Promise.resolve(response).catch(onRejected)
  return builder
}

function createSupabaseStub() {
  const noopSub = { unsubscribe: () => {} }
  const notConfiguredError = {
    message: 'Backend not connected. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local',
  }

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: noopSub } }),
      signInWithPassword: async () => ({ data: { session: null, user: null }, error: notConfiguredError }),
      signInWithOAuth: async () => ({ data: { url: null }, error: notConfiguredError }),
      signUp: async () => ({ data: { session: null, user: null }, error: notConfiguredError }),
      signOut: async () => ({ error: null }),
      updateUser: async () => ({ data: { user: null }, error: notConfiguredError }),
    },
    from: () => createQueryBuilder(),
    rpc: async () => ({ data: null, error: null }),
    storage: {
      from: () => ({
        getPublicUrl: path => ({ data: { publicUrl: path || '' } }),
      }),
    },
  }
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createSupabaseStub()

if (import.meta.env.DEV && !isSupabaseConfigured) {
  console.info(
    '[Daruhan] Running in frontend preview mode — no Supabase credentials. ' +
      'Copy .env.example to .env.local and add your backend keys when ready.',
  )
}
