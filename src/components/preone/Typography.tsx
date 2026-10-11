import React from 'react'

export type TypographyRole =
  // Canonical PreOne Hierarchy Roles (§3)
  | 'type-display'
  | 'display'
  | 'page-title'
  | 'section-title'
  | 'card-title'
  | 'body-copy'
  | 'body-copy-sm'
  | 'field-label'
  | 'meta-copy'
  | 'data-copy'
  // Backward Compatible Aliases
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body-lg'
  | 'body'
  | 'body-sm'
  | 'caption'
  | 'label'
  | 'btn'
  | 'kpi'
  | 'data'

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType
  role?: TypographyRole
  className?: string
  children?: React.ReactNode
}

const DEFAULT_TAG_MAP: Record<TypographyRole, React.ElementType> = {
  'type-display': 'h1',
  display: 'h1',
  'page-title': 'h1',
  h1: 'h1',
  'section-title': 'h2',
  h2: 'h2',
  'card-title': 'h3',
  h3: 'h3',
  h4: 'h4',
  'body-lg': 'p',
  'body-copy': 'p',
  body: 'p',
  'body-copy-sm': 'p',
  'body-sm': 'p',
  caption: 'span',
  'meta-copy': 'span',
  'field-label': 'span',
  label: 'span',
  btn: 'span',
  kpi: 'div',
  'data-copy': 'span',
  data: 'span',
}

const ROLE_CLASS_MAP: Record<TypographyRole, string> = {
  'type-display': 'type-display t-display',
  display: 'type-display t-display',
  'page-title': 'page-title t-h1',
  h1: 'page-title t-h1',
  'section-title': 'section-title t-h2',
  h2: 'section-title t-h2',
  'card-title': 'card-title t-h3',
  h3: 'card-title t-h3',
  h4: 'card-title t-h4',
  'body-lg': 'body-copy t-body-lg',
  'body-copy': 'body-copy t-body',
  body: 'body-copy t-body',
  'body-copy-sm': 'body-copy-sm t-body-sm',
  'body-sm': 'body-copy-sm t-body-sm',
  caption: 'meta-copy t-caption',
  'meta-copy': 'meta-copy t-caption',
  'field-label': 'field-label t-label',
  label: 'field-label t-label',
  btn: 't-btn',
  kpi: 't-kpi',
  'data-copy': 'data-copy t-data',
  data: 'data-copy t-data',
}

/**
 * Canonical Typography Component (PreOne Global Design System)
 */
export function Typography({
  as,
  role = 'body-copy',
  className = '',
  children,
  ...props
}: TypographyProps) {
  const Component = as || DEFAULT_TAG_MAP[role] || 'span'
  const roleClasses = ROLE_CLASS_MAP[role] || `t-${role}`
  const combinedClass = [roleClasses, className].filter(Boolean).join(' ')

  return (
    <Component className={combinedClass} {...props}>
      {children}
    </Component>
  )
}

// ── Canonical Semantic Component Exports ──────────────────────────────────
export function TypeDisplay({ as = 'h1', className = '', children, ...props }: Omit<TypographyProps, 'role'>) {
  return <Typography role="type-display" as={as} className={className} {...props}>{children}</Typography>
}
export const Display = TypeDisplay

export function PageTitle({ as = 'h1', className = '', children, ...props }: Omit<TypographyProps, 'role'>) {
  return <Typography role="page-title" as={as} className={className} {...props}>{children}</Typography>
}
export const H1 = PageTitle

export function SectionTitle({ as = 'h2', className = '', children, ...props }: Omit<TypographyProps, 'role'>) {
  return <Typography role="section-title" as={as} className={className} {...props}>{children}</Typography>
}
export const H2 = SectionTitle

export function CardTitle({ as = 'h3', className = '', children, ...props }: Omit<TypographyProps, 'role'>) {
  return <Typography role="card-title" as={as} className={className} {...props}>{children}</Typography>
}
export const H3 = CardTitle
export const H4 = CardTitle

export function BodyCopy({ as = 'p', className = '', children, ...props }: Omit<TypographyProps, 'role'>) {
  return <Typography role="body-copy" as={as} className={className} {...props}>{children}</Typography>
}
export const Body = BodyCopy
export const BodyLg = BodyCopy

export function BodyCopySm({ as = 'p', className = '', children, ...props }: Omit<TypographyProps, 'role'>) {
  return <Typography role="body-copy-sm" as={as} className={className} {...props}>{children}</Typography>
}
export const BodySm = BodyCopySm

export function FieldLabel({ as = 'span', className = '', children, ...props }: Omit<TypographyProps, 'role'>) {
  return <Typography role="field-label" as={as} className={className} {...props}>{children}</Typography>
}
export const LabelText = FieldLabel

export function MetaCopy({ as = 'span', className = '', children, ...props }: Omit<TypographyProps, 'role'>) {
  return <Typography role="meta-copy" as={as} className={className} {...props}>{children}</Typography>
}
export const Caption = MetaCopy

export function DataCopy({ as = 'span', className = '', children, ...props }: Omit<TypographyProps, 'role'>) {
  return <Typography role="data-copy" as={as} className={className} {...props}>{children}</Typography>
}
export const DataText = DataCopy

export function BtnText({ as = 'span', className = '', children, ...props }: Omit<TypographyProps, 'role'>) {
  return <Typography role="btn" as={as} className={className} {...props}>{children}</Typography>
}

export function KPI({ as = 'div', className = '', children, ...props }: Omit<TypographyProps, 'role'>) {
  return <Typography role="kpi" as={as} className={className} {...props}>{children}</Typography>
}
