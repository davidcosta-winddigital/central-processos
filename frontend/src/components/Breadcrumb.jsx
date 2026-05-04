import { Link } from 'react-router-dom';

export default function Breadcrumb({ items }) {
  return (
    <nav className="mb-6 text-sm text-slate-500">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-slate-300">/</span>}
            {item.to ? (
              <Link to={item.to} className="hover:text-brand-600">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-slate-700">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
