import LinkItem from './LinkItem';

export default function Category({ category, index, span = 1, query, uiCategory, uiLink }) {
  return (
    <article
      className="category"
      style={{ '--stagger-delay': `${index * 90}ms`, gridColumn: span === 2 ? 'span 2' : undefined }}
      aria-label={`${category.name} 分类`}
    >
      <header className="category__header">
        <span className="category__path">{uiCategory.pathPrefix}</span>
        <h2 className="category__title">{category.name}</h2>
        <span className="category__suffix">{uiCategory.suffix}</span>
      </header>

      <div className="category__list">
        {category.links.map((link) => (
          <LinkItem key={`${category.name}-${link.url}`} link={link} query={query} ui={uiLink} />
        ))}
      </div>
    </article>
  );
}
