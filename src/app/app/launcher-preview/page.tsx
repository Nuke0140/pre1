import React from 'react';
import LauncherButtonGallery from '@/components/preone/LauncherButtonGallery';

export const metadata = {
  title: 'PreOne Launcher Button — Fluent Metro Preview',
  description: 'Interactive preview and test matrix for the PreOne Fluent Metro Launcher Button component.',
};

export default function LauncherPreviewPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <LauncherButtonGallery />
    </div>
  );
}
