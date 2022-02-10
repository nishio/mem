import Link from 'next/link'

export const generate_links = projects => {
  const links = []
  const lc_to_title = {}
  const two_hops = {}
  const two_hops_links = []

  const _to_link = (title, titleLc) => (
    <Link href={`/en/${titleLc}`} key={titleLc}>
      <a style={{ marginRight: '1em' }}>[{title}]</a>
    </Link>
  )
  const to_link = key => {
    if (lc_to_title[key] !== undefined) {
      return _to_link(lc_to_title[key], key)
    }
    return key
  }

  projects.forEach(props => {
    if (!props.exists) return
    props.json.relatedPages.links1hop.forEach(x => {
      lc_to_title[x.titleLc] = x.title
      links.push(to_link(x.titleLc))
    })
    props.json.relatedPages.links2hop.forEach(x => {
      lc_to_title[x.titleLc] = x.title

      if (two_hops[x.linksLc] === undefined) {
        two_hops[x.linksLc] = [x.titleLc]
      } else {
        two_hops[x.linksLc].push(x.titleLc)
      }
    })
  })
  Object.keys(two_hops).forEach(key => {
    two_hops_links.push(
      <li key={key}>
        → {to_link(key)} → {two_hops[key].map(to_link)}
      </li>,
    )
  })
  return { links, two_hops_links }
}
