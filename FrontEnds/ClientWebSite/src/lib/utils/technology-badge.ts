const TECH_BADGE_STYLES: Record<string, string> = {
  '.net': 'border-purple-500/40 bg-purple-600/90 text-white',
  dotnet: 'border-purple-500/40 bg-purple-600/90 text-white',
  csharp: 'border-purple-500/40 bg-purple-600/90 text-white',
  javascript: 'border-yellow-500/40 bg-yellow-500/90 text-black',
  typescript: 'border-blue-500/40 bg-blue-600/90 text-white',
  react: 'border-cyan-500/40 bg-cyan-500/90 text-white',
  nextjs: 'border-slate-500/40 bg-slate-800/90 text-white',
  'next.js': 'border-slate-500/40 bg-slate-800/90 text-white',
  nodejs: 'border-green-500/40 bg-green-600/90 text-white',
  'node.js': 'border-green-500/40 bg-green-600/90 text-white',
  python: 'border-amber-500/40 bg-amber-500/90 text-black',
  java: 'border-orange-500/40 bg-orange-600/90 text-white',
  sql: 'border-sky-500/40 bg-sky-600/90 text-white',
  docker: 'border-blue-400/40 bg-blue-500/90 text-white',
  kubernetes: 'border-indigo-500/40 bg-indigo-600/90 text-white',
};

export function getTechnologyBadgeClass(tech: string): string {
  const key = tech.toLowerCase().replace(/\s+/g, '').replace(/#/g, 'sharp');
  return TECH_BADGE_STYLES[key] ?? 'border-primary/20 bg-primary/10 text-primary';
}
