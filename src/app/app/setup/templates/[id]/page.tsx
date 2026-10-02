import TemplateEditorClient from './TemplateEditorClient'

export const metadata = {
  title: 'Visual Template Studio — PreOne',
}

export default async function TemplateEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <TemplateEditorClient templateId={id} />
}
