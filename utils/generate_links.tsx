import Link from 'next/link'

export const title_to_url = (title: string) => {
  return encodeURIComponent(title.replace(/ /g, '_'))
}

export const generate_links = projects => {
  const links = []
  const lc_to_title = {}
  const two_hops = {}
  const two_hops_links = []

  const _to_link = (title, titleLc) => {
    const url = title_to_url(titleLc)
    return (
      <Link href={`/${url}`} key={titleLc}>
        <a>[{title}]</a>
      </Link>
    )
  }
  const to_link = key => {
    if (lc_to_title[key] !== undefined) {
      return _to_link(lc_to_title[key], key)
    }
    const title = key.replace(/_/g, ' ')
    return <span>[{title}]</span>
  }

  projects.forEach(props => {
    if (!props.exists) return
    props.json.relatedPages.links1hop.forEach(x => {
      lc_to_title[x.titleLc] = x.title
      links.push(to_link(x.titleLc))
    })
    props.json.relatedPages.links2hop.forEach(x => {
      lc_to_title[x.titleLc] = x.title

      const key = x.linksLc.join('\t')
      if (two_hops[key] === undefined) {
        two_hops[key] = [x.titleLc]
      } else {
        two_hops[key].push(x.titleLc)
      }
    })
  })
  Object.keys(two_hops).forEach(key => {
    const key_to_link = key => {
      const keys = key.split('\t')
      const links = []
      keys.forEach(x => {
        links.push('×')
        links.push(to_link(x))
      })
      links.shift()
      return links
    }
    two_hops_links.push(
      <li key={key}>
        → {key_to_link(key)} → {two_hops[key].map(to_link)}
      </li>,
    )
  })
  return { links, two_hops_links }
}
