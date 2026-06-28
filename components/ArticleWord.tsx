const COLORS: Record<string, string> = {
  der: 'text-[#3B6FD4]',
  die: 'text-[#C0392B]',
  das: 'text-[#27835A]',
}

interface ArticleWordProps {
  german: string
  article: string
  className?: string
}

export default function ArticleWord({ german, article, className = '' }: ArticleWordProps) {
  if (!article) return <span className={className}>{german}</span>
  const color = COLORS[article] ?? ''
  const base = german.slice(article.length + 1)
  return (
    <span className={className}>
      <span className={color}>{article}</span>{' '}<span>{base}</span>
    </span>
  )
}
