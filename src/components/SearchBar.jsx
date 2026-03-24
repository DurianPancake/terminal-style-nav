export default function SearchBar({ query, onQueryChange, disabled, ui }) {
  return (
    <label className="search-shell" htmlFor="terminal-search">
      <span className="search-shell__prompt">{ui.prompt}</span>
      <div className="search-shell__field-wrap">
        <input
          id="terminal-search"
          className="search-shell__input"
          type="text"
          placeholder={ui.placeholder}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          autoComplete="off"
          spellCheck="false"
          disabled={disabled}
          aria-label="搜索分类和链接"
        />
        <span className="search-shell__cursor" aria-hidden="true" />
      </div>
    </label>
  );
}
