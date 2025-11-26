'use client'

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  content: string;
  tags: string[] | null;
  username: string;
  created_at: string;
}

interface LatestPost {
  id: string;
  title: string;
  slug: string | null;
}

const getEloClass = (elo: number) => {
  if (elo >= 3000) return 'elo-3000-plus'
  if (elo >= 2700) return 'elo-2700-3000'
  if (elo >= 2500) return 'elo-2500-2700'
  if (elo >= 2300) return 'elo-2300-2500'
  if (elo >= 2100) return 'elo-2100-2300'
  if (elo >= 1900) return 'elo-1900-2100'
  if (elo >= 1750) return 'elo-1750-1900'
  if (elo >= 1600) return 'elo-1600-1750'
  if (elo >= 1500) return 'elo-1500-1600'
  if (elo >= 1400) return 'elo-1400-1500'
  if (elo >= 1200) return 'elo-1200-1400'
  if (elo >= 800) return 'elo-800-1200'
  return 'elo-0-800'
}

export default function OJBlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [username, setUsername] = useState<string | null>(null);
  const [eloMap, setEloMap] = useState<Record<string, number>>({});


  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get("tag");

  useEffect(() => {
    fetchPosts();
  }, [page, search, activeTag]); // ✅ react to page, search, and URL tag changes

  async function fetchPosts() {
    setLoading(true);
    try {
      // Base query
      let query = supabase
        .from("posts")
        .select("id,title,slug,summary,content,tags,username,created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      // Search filter
      if (search) {
        query = query.or(
          `title.ilike.%${search}%,summary.ilike.%${search}%,content.ilike.%${search}%`
        );
      }

      // Tag filter
      if (activeTag) {
        query = query.contains('tags', [activeTag]);
      }

      // Fetch posts
      const { data, error, count } = await query;
      if (error) throw error;

      setPosts(data || []);
      setTotal(count || 0);

      // Fetch Elo for all usernames in posts
      if (data && data.length > 0) {
        const usernames = Array.from(new Set(data.map(p => p.username)));
        const { data: eloData, error: eloErr } = await supabase
          .from('leaderboard')
          .select('username, elo')
          .in('username', usernames);

        if (!eloErr && eloData) {
          const map: Record<string, number> = {};
          eloData.forEach(e => map[e.username] = e.elo ?? 0);
          setEloMap(map);
        }
      }
    } catch (err) {
      console.error("Fetch posts error:", err);
    } finally {
      setLoading(false);
    }
  }



  function renderExcerpt(md: string) {
    const stripped = md
      .replace(/`[^`]*`/g, "")
      .replace(/\!\[[^\]]*\]\([^\)]+\)/g, "")
      .replace(/\[(.*?)\]\([^\)]+\)/g, "$1")
      .replace(/[#>*_\-~\\]/g, "")
      .trim();

    const firstLine = stripped.split('\n')[0];
    return firstLine.length > 100 ? firstLine.slice(0, 100) + "..." : firstLine;
  }


  return (
    <div className="max-w-10xl mx-auto p-4">
            <nav style={{marginTop: '8px', marginLeft: '-7px', marginBottom: '20px'}}>
            <Link href="/leaderboard" className="redirect-button" prefetch={false}>Leaderboard</Link>
            <Link href="/chat" className="redirect-button" prefetch={false}>Chat</Link>
            <Link href="/problemset" className="redirect-button" prefetch={false}>Problemset</Link>
            <Link href="/about" className="redirect-button" prefetch={false}>About</Link>
            <Link href="/ide" className="redirect-button" prefetch={false}>Live IDE</Link>
            <Link href="/submissions" className="redirect-button">Submissions</Link>
            <Link href="/blogs" className="redirect-button">Blogs</Link>
        </nav>
        <header className="flex items-center justify-between mb-6" style={{marginTop: 50}}>
            <h1 className="text-3xl font-extrabold">BQTOJ Blog</h1>
            <div className="flex gap-2 items-center">
            <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Tìm kiếm bài viết, ví dụ: toán, DP, thủ thuật..."
                className="border rounded px-3 py-2 text-sm w-64"
            />
            </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <section className="md:col-span-2">
            {loading ? (
                <div className="p-6 text-center">Đang tải...</div>
            ) : posts.length === 0 ? (
                <div className="p-6 text-center">Không có bài viết khớp.</div>
            ) : (
                posts.map((post) => (
                <article key={post.id} className="mb-6 p-4 border rounded-lg shadow-sm hover:shadow-md transition">
                    <div className="flex items-start gap-3">
                    <div className="flex-1">
                        <a href={`/blog?id=${post.slug ?? post.id}`} className="text-xl font-semibold hover:underline">
                        {post.title}
                        </a>
                        <p className="text-sm text-gray-500 mt-1">{new Date(post.created_at).toLocaleDateString()}</p>
                        <p className="mt-3 text-sm text-gray-100">
                        {post.summary ?? renderExcerpt(post.content)}
                        </p>


                        <div className="mt-3 flex flex-wrap gap-2">
                        {(post.tags || []).map((t) => (
                            <button
                            key={t}
                            onClick={() => router.push(`?tag=${t}`)}
                            className={`text-xs px-2 py-1 border rounded ${activeTag === t ? "bg-blue-600 text-white" : ""}`}
                            >
                            #{t}
                            </button>

                        ))}
                        </div>
                    </div>

                    <div className="w-24 text-right">
                        <a href={`/user?username=${post.username}`} className="text-sm">
                        <strong className={getEloClass(eloMap[post.username] ?? 0)}>
                        {post.username}
                        </strong>
                        </a>
                    </div>
                    </div>
                </article>
                ))
            )}

            <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">{`Trang ${page} — ${total} kết quả`}</div>
                <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded">Trước</button>
                <button onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded">Sau</button>
                </div>
            </div>
            </section>

            <aside className="space-y-4">
            <div className="p-4 border rounded">
                <h3 className="font-semibold">Bộ lọc</h3>
                <div className="mt-2">
                <button
                    onClick={() => router.push(``)}
                    className="text-sm px-2 py-1 border rounded"
                >
                    Tất cả
                </button>

                </div>
            </div>


            </aside>
        </main>
    </div>
  );
}

interface LatestPostsListProps {
  onOpen: (slug: string) => void;
}

function LatestPostsList({ onOpen }: { onOpen: (slug: string) => void }) {
  const [latest, setLatest] = useState<LatestPost[]>([]); // 👈 thêm type ở đây

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id,title,slug')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) return console.error(error);
      if (mounted) setLatest(data || []); // OK rồi ✅
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <ul className="space-y-2 mt-2">
      {latest.map(p => (
        <li key={p.id}>
          <button
            onClick={() => onOpen(p.slug ?? p.id)}
            className="text-sm hover:underline"
          >
            {p.title}
          </button>
        </li>
      ))}
    </ul>
  );
}


