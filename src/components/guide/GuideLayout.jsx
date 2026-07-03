import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ChevronRight, Lightbulb } from 'lucide-react'

const SOFT_EASE = { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
const PANEL_ANIM = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 } }

function GuideTopicContent({ topic, category, variant }) {
  const isAdmin = variant === 'admin'

  return (
    <article>
      <div className={`rounded-2xl border overflow-hidden ${
        isAdmin
          ? 'admin-card-flat border-brand-gold-200/80'
          : 'bg-white/90 dark:bg-slate-800/90 border-brand-gold-200 dark:border-slate-700 shadow-sm'
      }`}>
        <div className={`px-5 py-5 border-b ${isAdmin ? 'border-brand-gold-200/60 dark:border-brand-navy-700/50 bg-brand-gold-50/30 dark:bg-brand-navy-900/20' : 'border-brand-gold-100 dark:border-slate-700 bg-gradient-to-r from-brand-gold-50/50 to-white dark:from-slate-800 dark:to-slate-900'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isAdmin ? 'text-brand-gold-600/70 dark:text-brand-gold-400/80' : 'text-brand-gold-500/70 dark:text-brand-gold-400/80'}`}>
            {category.title}
          </p>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className={`text-xl font-extrabold tracking-tight text-gray-900 dark:text-white ${isAdmin ? 'admin-display' : ''}`}>
                {topic.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">{topic.summary}</p>
            </div>
            {topic.path && (
              <Link
                to={topic.path}
                className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors ${
                  isAdmin
                    ? 'text-brand-gold-700 dark:text-brand-gold-400 bg-brand-gold-100/80 dark:bg-brand-navy-900/30 hover:bg-brand-gold-100 dark:hover:bg-brand-navy-900/50'
                    : 'text-brand-gold-600 dark:text-brand-gold-400 bg-brand-gold-50 dark:bg-brand-navy-900/30 hover:bg-brand-gold-100 dark:hover:bg-brand-navy-900/50'
                }`}
              >
                Open page
                <ChevronRight size={14} />
              </Link>
            )}
          </div>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Steps</p>
            <ol className="space-y-2.5">
              {topic.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-extrabold ${
                      isAdmin
                        ? 'bg-brand-gold-100 dark:bg-brand-navy-900/40 text-brand-navy-800 dark:text-brand-gold-300'
                        : 'bg-brand-gold-100 dark:bg-brand-navy-900/40 text-brand-navy-900 dark:text-brand-gold-300'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {topic.tips?.length > 0 && (
            <div className={`rounded-xl px-4 py-3 border ${isAdmin ? 'bg-amber-50/80 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/40' : 'bg-amber-50/90 dark:bg-amber-900/20 border-amber-100/80 dark:border-amber-900/40'}`}>
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-2">
                <Lightbulb size={12} />
                Tips
              </p>
              <ul className="space-y-1.5">
                {topic.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-amber-950/80 dark:text-amber-200/80 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-amber-500">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function GuideCategoryOverview({ category, variant, onSelectTopic }) {
  const isAdmin = variant === 'admin'

  return (
    <div>
      <div className={`rounded-2xl px-6 py-5 border mb-5 ${
        isAdmin
          ? 'admin-card-flat border-brand-gold-200/60 bg-gradient-to-br from-brand-gold-50/50 to-white dark:from-brand-navy-900/30 dark:to-slate-800'
          : 'bg-gradient-to-br from-brand-gold-50/80 to-white dark:from-brand-navy-900/30 dark:to-slate-800 border-brand-gold-200 dark:border-slate-700 shadow-sm'
      }`}>
        <h2 className={`text-xl lg:text-2xl font-extrabold tracking-tight mb-2 text-brand-navy-900 dark:text-brand-gold-100 ${isAdmin ? 'admin-display' : ''}`}>
          {category.title}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{category.summary}</p>
      </div>

      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3 px-1">In this section</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {category.topics.map(topic => (
          <button
            key={topic.id}
            type="button"
            onClick={() => onSelectTopic(topic.id)}
            className={`text-left rounded-xl border px-4 py-3.5 transition-all group ${
              isAdmin
                ? 'admin-card-flat border-brand-gold-200/80 hover:border-brand-gold-200 dark:hover:border-brand-gold-800/60 hover:bg-brand-gold-50/40 dark:hover:bg-brand-navy-900/20'
                : 'bg-white/90 dark:bg-slate-800/90 border-brand-gold-200 dark:border-slate-700 hover:border-brand-gold-300 dark:hover:border-brand-gold-700 hover:bg-brand-gold-50/50 dark:hover:bg-brand-navy-900/20 shadow-sm'
            }`}
          >
            <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-brand-navy-900 dark:group-hover:text-brand-gold-300">
              {topic.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">{topic.summary}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function GuideToc({
  categories,
  activeTopicId,
  activeCategoryId,
  view,
  variant,
  className = '',
  tocRef,
  onCategoryClick,
  onTopicClick,
}) {
  const isAdmin = variant === 'admin'

  return (
    <nav ref={tocRef} className={className}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-4 px-2">Contents</p>
      <div className="space-y-5 pr-1">
        {categories.map(category => {
          const isCategoryActive = activeCategoryId === category.id
          const showCategoryHighlight = view === 'category' && isCategoryActive

          return (
            <div key={category.id}>
              <button
                type="button"
                onClick={() => onCategoryClick(category.id)}
                className={`block w-full text-left px-2 py-1.5 text-sm font-extrabold tracking-tight transition-colors rounded-lg ${
                  showCategoryHighlight
                    ? 'text-brand-navy-900 dark:text-brand-gold-200 bg-brand-gold-100/80 dark:bg-brand-navy-900/40'
                    : isCategoryActive
                      ? 'text-brand-navy-900 dark:text-brand-gold-200 bg-brand-gold-50/80 dark:bg-brand-navy-900/25'
                      : isAdmin
                        ? 'text-brand-navy-900 dark:text-gray-200 hover:text-brand-gold-700 dark:hover:text-brand-gold-400 hover:bg-brand-gold-50/50 dark:hover:bg-brand-navy-900/20'
                        : 'text-brand-navy-900 dark:text-gray-200 hover:text-brand-gold-600 dark:hover:text-brand-gold-400 hover:bg-brand-gold-50/50 dark:hover:bg-brand-navy-900/20'
                }`}
              >
                {category.title}
              </button>
              <ul className="mt-1.5 space-y-0.5 pl-2 border-l-2 border-gray-100 dark:border-slate-700 ml-2">
                {category.topics.map(topic => {
                  const isActive = view === 'topic' && activeTopicId === topic.id
                  return (
                    <li key={topic.id}>
                      <button
                        type="button"
                        data-toc-id={topic.id}
                        onClick={() => onTopicClick(topic.id)}
                        className={`block w-full text-left pl-2.5 pr-2 py-1.5 rounded-md text-xs leading-snug transition-all duration-200 ${
                          isActive
                            ? 'bg-brand-gold-100 dark:bg-brand-navy-900/40 text-brand-navy-900 dark:text-brand-gold-200 font-semibold border-l-2 border-brand-gold-500 -ml-[2px] pl-3'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-800 dark:hover:text-gray-100 font-medium'
                        }`}
                      >
                        {topic.title}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </nav>
  )
}

export default function GuideLayout({
  variant = 'user',
  title,
  subtitle,
  categories,
  backLink,
  backLabel,
}) {
  const firstCategory = categories[0]
  const [activeCategoryId, setActiveCategoryId] = useState(firstCategory?.id ?? null)
  const [activeTopicId, setActiveTopicId] = useState(firstCategory?.topics[0]?.id ?? null)
  const [view, setView] = useState('topic')
  const panelRef = useRef(null)
  const tocRef = useRef(null)
  const isAdmin = variant === 'admin'

  const activeCategory = useMemo(
    () => categories.find(c => c.id === activeCategoryId) ?? categories[0],
    [categories, activeCategoryId],
  )

  const activeTopic = useMemo(() => {
    if (!activeCategory) return null
    return activeCategory.topics.find(t => t.id === activeTopicId) ?? activeCategory.topics[0]
  }, [activeCategory, activeTopicId])

  const handleCategoryClick = useCallback((categoryId) => {
    setActiveCategoryId(categoryId)
    setView('category')
  }, [])

  const handleTopicClick = useCallback((topicId) => {
    for (const category of categories) {
      if (category.topics.some(t => t.id === topicId)) {
        setActiveCategoryId(category.id)
        break
      }
    }
    setActiveTopicId(topicId)
    setView('topic')
  }, [categories])

  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [view, activeTopicId, activeCategoryId])

  useEffect(() => {
    const nav = tocRef.current
    if (!nav || view !== 'topic' || !activeTopicId) return
    const activeBtn = nav.querySelector(`[data-toc-id="${activeTopicId}"]`)
    activeBtn?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeTopicId, view])

  const tocProps = {
    categories,
    activeTopicId,
    activeCategoryId,
    view,
    variant,
    tocRef,
    onCategoryClick: handleCategoryClick,
    onTopicClick: handleTopicClick,
  }

  const panelClass = `min-w-0 rounded-2xl border admin-scroll ${
    isAdmin
      ? 'admin-card-flat border-brand-gold-200/60 bg-white/50 dark:bg-slate-800/50'
      : 'bg-white/60 dark:bg-slate-800/60 border-brand-gold-200/80 dark:border-slate-700'
  } lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:overscroll-contain`

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 lg:py-10">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SOFT_EASE}
        className="mb-8"
      >
        {backLink && (
          <Link
            to={backLink}
            className={`inline-flex items-center gap-1 text-sm font-semibold mb-4 transition-colors ${
              isAdmin
                ? 'text-brand-gold-700 dark:text-brand-gold-400 hover:text-brand-navy-900 dark:hover:text-brand-gold-200'
                : 'text-brand-gold-600 dark:text-brand-gold-400 hover:text-brand-navy-900 dark:hover:text-brand-gold-200'
            }`}
          >
            ← {backLabel}
          </Link>
        )}
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
              isAdmin
                ? 'bg-gradient-to-br from-brand-gold-500 to-brand-navy-700 text-white'
                : 'bg-gradient-to-br from-brand-gold-500 to-brand-navy-700 text-white'
            }`}
          >
            <BookOpen size={22} strokeWidth={2.2} />
          </div>
          <div>
            {isAdmin ? (
              <p className="admin-kicker mb-1">Admin · Manual</p>
            ) : (
              <p className="text-xs font-bold text-brand-gold-600/80 uppercase tracking-widest mb-1">Help</p>
            )}
            <h1 className={`text-2xl lg:text-3xl font-extrabold leading-tight ${isAdmin ? 'admin-display text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>
              {title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-2xl leading-relaxed">{subtitle}</p>
          </div>
        </div>
      </motion.header>

      <div className={`lg:hidden mb-5 rounded-2xl border p-4 max-h-[min(380px,50vh)] admin-scroll ${
        isAdmin ? 'admin-card-flat border-brand-gold-200/80' : 'bg-white/90 dark:bg-slate-800/90 border-brand-gold-200 dark:border-slate-700 shadow-sm'
      }`}>
        <GuideToc {...tocProps} />
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-8 lg:items-start">
        <GuideToc
          {...tocProps}
          className="hidden lg:block sticky top-20 max-h-[calc(100vh-6rem)] admin-scroll pb-6"
        />

        <div ref={panelRef} className={`${panelClass} p-4 sm:p-5 lg:p-6`}>
          <AnimatePresence mode="wait">
            {view === 'category' && activeCategory ? (
              <motion.div
                key={`cat-${activeCategory.id}`}
                {...PANEL_ANIM}
                transition={SOFT_EASE}
              >
                <GuideCategoryOverview
                  category={activeCategory}
                  variant={variant}
                  onSelectTopic={handleTopicClick}
                />
              </motion.div>
            ) : activeTopic && activeCategory ? (
              <motion.div
                key={`topic-${activeTopic.id}`}
                {...PANEL_ANIM}
                transition={SOFT_EASE}
              >
                <GuideTopicContent
                  topic={activeTopic}
                  category={activeCategory}
                  variant={variant}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
