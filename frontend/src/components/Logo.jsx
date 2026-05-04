/**
 * Logo do sistema — três documentos sobrepostos com linhas de texto.
 * SVG inline, escala via prop `className` (ex: "h-10 w-10").
 */
export default function Logo({ className = 'h-10 w-10' }) {
  return (
    <svg
      viewBox="250 110 180 220"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Central de Processos"
      className={className}
    >
      <rect x="260" y="120" width="130" height="170" rx="14" fill="#bfdbfe" />
      <rect x="275" y="135" width="130" height="170" rx="14" fill="#60a5fa" />
      <rect x="290" y="150" width="130" height="170" rx="14" fill="#2563eb" />
      <rect x="310" y="185" width="90" height="6" rx="3" fill="#ffffff" />
      <rect x="310" y="205" width="90" height="6" rx="3" fill="#ffffff" />
      <rect x="310" y="225" width="90" height="6" rx="3" fill="#ffffff" />
      <rect x="310" y="245" width="60" height="6" rx="3" fill="#ffffff" />
    </svg>
  );
}
