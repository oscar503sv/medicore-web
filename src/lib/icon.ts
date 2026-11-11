/** Prepares a raw Lucide SVG string for inline use (decorative, sized by CSS). */
export function inlineIcon(svg: string): string {
  return svg
    .replace(/<!--[\s\S]*?-->/, '')
    .replace(/\s(width|height)="24"/g, '')
    .replace('<svg', '<svg aria-hidden="true" focusable="false"')
    .trim();
}
