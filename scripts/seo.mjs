import { site } from '../content/site.mjs';
import { demo } from '../content/seo.mjs';
import { escapeHtml as e, jsonScript } from './templates.mjs';

export const absolute = path => new URL(path, site.origin + '/').href;
export const organization = {
  '@type': 'Organization', '@id': absolute('/#organization'),
  name: site.company, legalName: site.company, url: 'https://solvialab.tech/',
  email: site.email,
  logo: { '@type': 'ImageObject', url: absolute('/assets/infrayard-mark.svg') },
};
const website = {
  '@type': 'WebSite', '@id': absolute('/#website'), name: site.name, alternateName: 'Infrayard by Solvia Lab',
  url: absolute('/'), inLanguage: 'en', publisher: { '@id': organization['@id'] },
};

export function graph({ path, title, description, type = 'WebPage', crumbs = [], article, modified = site.updated, extra = [] }) {
  const url = absolute(path);
  const page = {
    '@type': type, '@id': url + '#webpage', url, name: title, description,
    inLanguage: 'en', isPartOf: { '@id': website['@id'] },
    publisher: { '@id': organization['@id'] }, dateModified: modified,
    primaryImageOfPage: { '@type': 'ImageObject', url: absolute('/assets/og-image.png'), width: 1200, height: 630 },
  };
  const nodes = [organization, website, page];
  if (crumbs.length) {
    page.breadcrumb = { '@id': url + '#breadcrumb' };
    nodes.push({ '@type': 'BreadcrumbList', '@id': url + '#breadcrumb', itemListElement: crumbs.map(([name, href], index) => ({ '@type': 'ListItem', position: index + 1, name, item: absolute(href) })) });
  }
  if (article) {
    page.mainEntity = { '@id': url + '#article' };
    nodes.push({
      '@type': article.type || 'Article', '@id': url + '#article', headline: article.headline,
      description, url, mainEntityOfPage: { '@id': page['@id'] }, inLanguage: 'en',
      author: { '@id': organization['@id'] }, publisher: { '@id': organization['@id'] },
      image: absolute('/assets/og-image.png'), dateModified: modified,
      ...(article.published ? { datePublished: article.published } : {}),
    });
  }
  if (path === demo.path && demo.publishedAt) {
    if (!/^\d{4}-\d{2}-\d{2}(?:T.*(?:Z|[+-]\d{2}:\d{2}))?$/.test(demo.publishedAt) || Number.isNaN(Date.parse(demo.publishedAt))) throw new Error('Use the real ISO publication date for the demo');
    page.mainEntity = { '@id': absolute('/#product-video') };
    nodes.push({
      '@type': 'VideoObject', '@id': absolute('/#product-video'), name: demo.name,
      description: demo.description, thumbnailUrl: [absolute(demo.thumbnailPath)],
      contentUrl: absolute(demo.contentPath), url, uploadDate: demo.publishedAt,
      duration: demo.duration, inLanguage: 'en', publisher: { '@id': organization['@id'] },
    });
  }
  return { '@context': 'https://schema.org', '@graph': [...nodes, ...extra] };
}

export function head({ path, title, description, type = 'website', data, preloadPoster = false }) {
  return `<title>${e(title)}</title>
  <meta name="description" content="${e(description)}">
  <link rel="canonical" href="${absolute(path)}">
  <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">
  <meta name="author" content="${e(site.company)}">
  <meta name="theme-color" content="#f7f9fa">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon-48x48.png" type="image/png" sizes="48x48">
  <link rel="apple-touch-icon" href="/favicon-192x192.png" sizes="192x192">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="alternate" type="text/plain" href="/llms.txt" title="Infrayard AI summary">
  <link rel="alternate" type="text/plain" href="/llms-full.txt" title="Infrayard full documentation context">
  <link rel="alternate" type="text/markdown" href="/ai.md" title="Infrayard product facts">
  <meta property="og:type" content="${type}">
  <meta property="og:locale" content="en_GB">
  <meta property="og:title" content="${e(title)}">
  <meta property="og:description" content="${e(description)}">
  <meta property="og:url" content="${absolute(path)}">
  <meta property="og:site_name" content="${site.name}">
  <meta property="og:image" content="${absolute('/assets/og-image.png')}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Infrayard — self-service Kubernetes on Oracle Cloud inside your tenancy">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${e(title)}">
  <meta name="twitter:description" content="${e(description)}">
  <meta name="twitter:image" content="${absolute('/assets/og-image.png')}">
  <meta name="twitter:image:alt" content="Infrayard — self-service Kubernetes on Oracle Cloud inside your tenancy">
  ${preloadPoster ? `<link rel="preload" as="image" href="${demo.thumbnailPath}" fetchpriority="high">` : ''}
  <script type="application/ld+json">${jsonScript(data)}</script>`.replace(/[\t ]+$/gm, '');
}

export function breadcrumb(crumbs, className = 'docs-breadcrumb') {
  return `<nav class="${className}" aria-label="Breadcrumb">${crumbs.map(([name, href], index) => `${index ? '<span aria-hidden="true">/</span>' : ''}${index === crumbs.length - 1 ? `<span aria-current="page">${e(name)}</span>` : `<a href="${href}">${e(name)}</a>`}`).join('')}</nav>`;
}

export const videoCredit = `<span class="video-music-credit">Music: <a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1300046">Dream Culture — Kevin MacLeod</a> · <a href="https://creativecommons.org/licenses/by/4.0/" rel="license">CC BY 4.0</a>. Trimmed, volume adjusted and faded.</span>`;
