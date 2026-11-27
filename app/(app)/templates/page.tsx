import { TemplateEditor } from '@/components/template-editor';

export default function TemplatesPage() {
  return <>
    <div className="page-heading"><h1>Templates</h1><p>Write and preview the SMS customers receive with their invoice.</p></div>
    <div className="section"><TemplateEditor /></div>
  </>;
}
