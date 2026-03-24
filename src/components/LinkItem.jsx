function highlightText(text, query) {
  const keyword = query.trim();
  if (!keyword) return text;

  const pattern = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
  const parts = text.split(pattern);

  return parts.map((part, index) =>
    part.toLowerCase() === keyword.toLowerCase() ? <mark key={`${part}-${index}`}>{part}</mark> : part,
  );
}

export default function LinkItem({ link, query, ui }) {
  return (
    <a
      className="link-item"
      href={link.url}
      target="_blank"
      rel="noreferrer"
      title={link.url}
    >
      <span className="link-item__prompt">{ui.prompt}</span>
      <span className="link-item__name">{highlightText(link.name, query)}</span>
      <span className="link-item__url">{link.url.replace(/^https?:\/\//, '')}</span>
      <span className="link-item__hint">{ui.hint}</span>
    </a>
  );
}
