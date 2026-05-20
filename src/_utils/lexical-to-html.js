// Minimal Payload Lexical → HTML converter.
// Handles the node types the chirp-cms blog actually emits. Other types
// (custom blocks, code, etc.) render as fallback text.
//
// Reference Lexical node shapes:
//   root, paragraph, heading, list, listitem, quote, link, text
//   text.format is a bitmask: 1=bold, 2=italic, 4=strikethrough, 8=underline, 16=code

const FORMAT_BOLD = 1
const FORMAT_ITALIC = 2
const FORMAT_STRIKE = 4
const FORMAT_UNDERLINE = 8
const FORMAT_CODE = 16

function escapeHtml(str) {
  if (str == null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(str) {
  return escapeHtml(str)
}

function renderText(node) {
  const fmt = node.format || 0
  let html = escapeHtml(node.text || '')
  if (fmt & FORMAT_CODE) html = `<code>${html}</code>`
  if (fmt & FORMAT_BOLD) html = `<strong>${html}</strong>`
  if (fmt & FORMAT_ITALIC) html = `<em>${html}</em>`
  if (fmt & FORMAT_UNDERLINE) html = `<u>${html}</u>`
  if (fmt & FORMAT_STRIKE) html = `<s>${html}</s>`
  return html
}

function renderChildren(children) {
  if (!Array.isArray(children)) return ''
  return children.map(renderNode).join('')
}

function renderNode(node) {
  if (!node || typeof node !== 'object') return ''

  switch (node.type) {
    case 'text':
      return renderText(node)

    case 'linebreak':
      return '<br>'

    case 'paragraph':
      return `<p>${renderChildren(node.children)}</p>`

    case 'heading': {
      const tag = node.tag && /^h[1-6]$/i.test(node.tag) ? node.tag : 'h3'
      return `<${tag}>${renderChildren(node.children)}</${tag}>`
    }

    case 'list': {
      const tag = node.listType === 'number' ? 'ol' : 'ul'
      return `<${tag}>${renderChildren(node.children)}</${tag}>`
    }

    case 'listitem':
      return `<li>${renderChildren(node.children)}</li>`

    case 'quote':
      return `<blockquote>${renderChildren(node.children)}</blockquote>`

    case 'link': {
      const fields = node.fields || {}
      const href =
        fields.linkType === 'internal' && fields.doc
          ? `/blog/${escapeAttr(fields.doc.value?.slug || '')}/`
          : escapeAttr(fields.url || '#')
      const target = fields.newTab ? ' target="_blank" rel="noopener"' : ''
      return `<a href="${href}"${target}>${renderChildren(node.children)}</a>`
    }

    case 'autolink':
      return `<a href="${escapeAttr(node.fields?.url || '#')}">${renderChildren(node.children)}</a>`

    case 'upload': {
      // Image upload — Payload exposes the media URL on node.value.url
      const url = node.value?.url
      const alt = node.value?.alt || ''
      if (!url) return ''
      return `<figure><img src="${escapeAttr(url)}" alt="${escapeAttr(alt)}" loading="lazy"></figure>`
    }

    case 'horizontalrule':
      return '<hr>'

    case 'root':
      return renderChildren(node.children)

    default:
      // Fallback: render children if present, else empty
      if (Array.isArray(node.children)) return renderChildren(node.children)
      return ''
  }
}

export function lexicalToHtml(content) {
  if (!content || typeof content !== 'object') return ''
  if (!content.root) return ''
  return renderNode(content.root)
}
