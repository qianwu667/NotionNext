import BLOG from '@/blog.config'
import { getPostBlocks } from '@/lib/notion'
import { getGlobalNotionData } from '@/lib/notion/getNotionData'
import * as ThemeMap from '@/themes'
import { generateRssToPublic } from '@/lib/rss'
import { useGlobal } from '@/lib/global'
const Index = props => {
  const { theme } = useGlobal()
  const ThemeComponents = ThemeMap[theme]
  return <ThemeComponents.LayoutIndex {...props} />
}

export async function getStaticProps() {
  const from = 'index'
  const props = await getGlobalNotionData({ from })
  const { allPages, siteInfo } = props
  const allPosts = allPages.filter(page => page.type === 'Post' && page.status === 'Published')
  const meta = {
    title: `${siteInfo?.title} | ${siteInfo?.description}`,
    description: siteInfo?.description,
    image: siteInfo?.pageCover,
    slug: '',
    type: 'website'
  }
  const globalNotionData = await getGlobalNotionData({ from: 'rss' })
  await generateRssToPublic(globalNotionData?.latestPosts || []) // calling to generate the feed
  // 处理分页
  const page = 1
  let postsToShow
  if (BLOG.POST_LIST_STYLE !== 'page') {
    postsToShow = Array.from(allPosts)
  } else {
    postsToShow = allPosts?.slice(
      BLOG.POSTS_PER_PAGE * (page - 1),
      BLOG.POSTS_PER_PAGE * page
    )
    if (BLOG.POST_LIST_PREVIEW === 'true') {
      for (const i in postsToShow) {
        const post = postsToShow[i]
        if (post.password && post.password !== '') {
          continue
        }
        const blockMap = await getPostBlocks(
          post.id,
          'slug',
          BLOG.POST_PREVIEW_LINES
        )
        if (blockMap) {
          post.blockMap = blockMap
        }
      }
    }
  }
  props.posts = postsToShow

  return {
    props: {
      meta,
      ...props
    },
    revalidate: 5
  }
}

export default Index
