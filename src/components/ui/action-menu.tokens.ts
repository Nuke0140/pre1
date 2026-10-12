import { SemanticActionCategory } from './action-menu.types'

export interface CategoryStyle {
  container: string
  icon: string
}

/**
 * Enterprise Semantic Color Tokens for Action Menu Icons.
 * Carefully balanced with light/dark theme surface contrast.
 */
export const SEMANTIC_CATEGORY_STYLES: Record<SemanticActionCategory, CategoryStyle> = {
  export: {
    container: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  import: {
    container: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20',
    icon: 'text-purple-600 dark:text-purple-400',
  },
  settings: {
    container: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  audit: {
    container: 'bg-slate-500/10 dark:bg-slate-400/20 text-slate-600 dark:text-slate-300 border border-slate-500/20',
    icon: 'text-slate-600 dark:text-slate-300',
  },
  view: {
    container: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  edit: {
    container: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
    icon: 'text-indigo-600 dark:text-indigo-400',
  },
  create: {
    container: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20',
    icon: 'text-purple-700 dark:text-purple-300',
  },
  approve: {
    container: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    container: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  danger: {
    container: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20',
    icon: 'text-rose-600 dark:text-rose-400',
  },
  general: {
    container: 'bg-slate-500/10 dark:bg-slate-400/20 text-slate-600 dark:text-slate-300 border border-slate-500/20',
    icon: 'text-slate-600 dark:text-slate-300',
  },
}
