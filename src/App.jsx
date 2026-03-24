import { useEffect, useMemo, useState } from 'react';
import Category from './components/Category';
import SearchBar from './components/SearchBar';
import { computeLayout } from './utils/computeLayout';

function createGlyphRows(rowCount = 18, tokenCount = 22) {
  const glyphSet = '01ABCDEF789XYZ$#@*+=:/?[]{}∆⟡⌁';

  return Array.from({ length: rowCount }, (_, rowIndex) =>
    Array.from({ length: tokenCount }, (_, tokenIndex) => {
      const start = (rowIndex * 5 + tokenIndex * 7) % glyphSet.length;
      return `${glyphSet[start]}${glyphSet[(start + 3) % glyphSet.length]}${glyphSet[(start + 9) % glyphSet.length]}`;
    }).join(' '),
  );
}

const GLYPH_ROWS = createGlyphRows();

const DEFAULT_UI = {
  shellTitle: '[nav@terminal ~]$',
  appTitle: 'TERMINAL NAV',
  subtitle: '基于配置驱动的命令行风格导航页，支持分类浏览、实时过滤与快速跳转。',
  eyebrowSuffix: './launch --config',
  stats: {
    categoriesLabel: 'categories',
    linksLabel: 'links',
    statusLabel: 'status',
    statusLoading: 'loading',
    statusError: 'error',
    statusReady: 'ready',
  },
  search: {
    prompt: '$ find',
    placeholder: '输入分类或链接名称…',
  },
  loading: {
    primary: '$ booting interface...',
    secondary: '正在读取',
  },
  error: {
    primary: '$ error --config-load',
    secondary: '请检查 public/config.json 的格式是否正确，并确认开发服务器能够访问该文件。',
  },
  empty: {
    fallbackQuery: 'all',
    secondary: '未找到匹配项。试试分类名、链接名或修改 public/config.json。',
  },
  category: {
    pathPrefix: '~/',
    suffix: '$',
  },
  link: {
    prompt: '➜',
    hint: '[open]',
  },
};

function mergeUi(raw) {
  if (!raw || typeof raw !== 'object') return DEFAULT_UI;
  return {
    shellTitle: raw.shellTitle?.trim() || DEFAULT_UI.shellTitle,
    appTitle: raw.appTitle?.trim() || DEFAULT_UI.appTitle,
    subtitle: raw.subtitle?.trim() || DEFAULT_UI.subtitle,
    eyebrowSuffix: raw.eyebrowSuffix?.trim() || DEFAULT_UI.eyebrowSuffix,
    stats: { ...DEFAULT_UI.stats, ...(raw.stats || {}) },
    search: { ...DEFAULT_UI.search, ...(raw.search || {}) },
    loading: { ...DEFAULT_UI.loading, ...(raw.loading || {}) },
    error: { ...DEFAULT_UI.error, ...(raw.error || {}) },
    empty: { ...DEFAULT_UI.empty, ...(raw.empty || {}) },
    category: { ...DEFAULT_UI.category, ...(raw.category || {}) },
    link: { ...DEFAULT_UI.link, ...(raw.link || {}) },
  };
}

function normalizeConfig(data) {
  if (!data || !Array.isArray(data.categories)) {
    return { categories: [], ui: DEFAULT_UI };
  }

  const categories = data.categories
    .filter((c) => c && typeof c.name === 'string' && Array.isArray(c.links))
    .map((c) => ({
      name: c.name,
      links: c.links.filter((l) => l && typeof l.name === 'string' && typeof l.url === 'string'),
    }));

  return { categories, ui: mergeUi(data.ui) };
}

export default function App() {
  const [categories, setCategories] = useState([]);
  const [ui, setUi] = useState(DEFAULT_UI);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const configPath = `${import.meta.env.BASE_URL}config.json`;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadConfig() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(configPath, {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`配置加载失败（HTTP ${response.status}）`);
        }

        const data = await response.json();
        const normalized = normalizeConfig(data);

        if (!cancelled) {
          setCategories(normalized.categories);
          setUi(normalized.ui);
        }
      } catch (loadError) {
        if (!cancelled) {
          if (loadError instanceof DOMException && loadError.name === 'AbortError') return;
          setError(loadError instanceof Error ? loadError.message : '无法读取配置文件。');
          setCategories([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadConfig();
    return () => { cancelled = true; controller.abort(); };
  }, [configPath]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const root = document.documentElement;
    let rafId = 0;

    const updatePointerGlow = (x, y) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        root.style.setProperty('--mx', `${x}px`);
        root.style.setProperty('--my', `${y}px`);
      });
    };

    const onMouseMove = (e) => updatePointerGlow(e.clientX, e.clientY);
    const onMouseLeave = () => updatePointerGlow(window.innerWidth / 2, window.innerHeight * 0.35);

    onMouseLeave();
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseout', onMouseLeave);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseout', onMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const filteredCategories = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return categories;

    return categories.reduce((result, category) => {
      const categoryMatches = category.name.toLowerCase().includes(keyword);
      const links = category.links.filter((link) => link.name.toLowerCase().includes(keyword));
      if (categoryMatches || links.length > 0) {
        result.push({ ...category, links: categoryMatches ? category.links : links });
      }
      return result;
    }, []);
  }, [categories, query]);

  const layout = useMemo(() => computeLayout(filteredCategories), [filteredCategories]);
  const totalLinks = filteredCategories.reduce((sum, c) => sum + c.links.length, 0);
  const { stats, loading: loadingText, error: errorText, empty } = ui;
  const statusText = loading ? stats.statusLoading : error ? stats.statusError : stats.statusReady;

  return (
    <div className="app-shell">
      <div className="app-shell__noise" aria-hidden="true" />
      <div className="app-shell__pointer-glow" aria-hidden="true" />
      <div className="app-shell__glyph-rain" aria-hidden="true">
        {GLYPH_ROWS.map((line, index) => (
          <span
            key={`glyph-row-${index}`}
            className="app-shell__glyph"
            style={{
              '--row': index,
              '--delay': `${(index % 8) * -0.42}s`,
              '--dur': `${6 + (index % 5) * 0.7}s`,
              '--alpha': `${0.28 + (index % 4) * 0.06}`,
            }}
          >
            {line}
          </span>
        ))}
      </div>
      <div className="app-shell__aurora" aria-hidden="true">
        <span className="app-shell__blob app-shell__blob--1" />
        <span className="app-shell__blob app-shell__blob--2" />
        <span className="app-shell__blob app-shell__blob--3" />
      </div>
      <div className="app-shell__vignette" aria-hidden="true" />

      <main className="terminal-window">
        <header className="hero">
          <div className="hero__eyebrow">
            {ui.shellTitle} {ui.eyebrowSuffix} {configPath}
          </div>
          <h1 className="hero__title">{ui.appTitle}</h1>
          <p className="hero__subtitle">{ui.subtitle}</p>
          <div className="hero__stats" aria-label="导航统计信息">
            <span>{stats.categoriesLabel}: {filteredCategories.length}</span>
            <span>{stats.linksLabel}: {totalLinks}</span>
            <span>{stats.statusLabel}: {statusText}</span>
          </div>
        </header>

        <SearchBar query={query} onQueryChange={setQuery} disabled={loading} ui={ui.search} />

        {loading ? (
          <section className="panel panel--status" aria-live="polite">
            <p className="panel__line">{loadingText.primary}</p>
            <p className="panel__line panel__line--muted">{loadingText.secondary} {configPath}</p>
          </section>
        ) : null}

        {error ? (
          <section className="panel panel--error" role="alert">
            <p className="panel__line">{errorText.primary}</p>
            <p className="panel__line panel__line--muted">{error}</p>
            <p className="panel__line panel__line--muted">{errorText.secondary}</p>
          </section>
        ) : null}

        {!loading && !error ? (
          <section className="results" aria-live="polite">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category, index) => (
                <Category
                  key={category.name}
                  category={category}
                  index={index}
                  span={layout[index]?.span ?? 1}
                  query={query}
                  uiCategory={ui.category}
                  uiLink={ui.link}
                />
              ))
            ) : (
              <section className="panel panel--empty">
                <p className="panel__line">$ find {query || empty.fallbackQuery}</p>
                <p className="panel__line panel__line--muted">{empty.secondary}</p>
              </section>
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}
