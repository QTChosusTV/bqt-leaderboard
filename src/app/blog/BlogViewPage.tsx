"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkBreaks from "remark-breaks";
import "katex/dist/katex.min.css";
import Link from "next/link";
import Image from "next/image"

interface Post {
  id: number;
  title: string;
  content: string;
  tags: string[];
  username: string;
  created_at: string;
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


export default function BlogPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [elo, setElo] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("slug", id)
        .single();

      if (error) console.error(error);
      setPost(data);
      setLoading(false);
    };
    fetchPost();
  }, [id]);

  useEffect(() => {
    if (!post) return;
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('id, username')
        .eq('id', user.id)
        .single();

      if (!userData) return;

      setUsername(userData.username);

      const { data: eloData } = await supabase
        .from('leaderboard')
        .select('elo')
        .eq('username', post?.username)
        .single();

      console.log(eloData);
      

      if (eloData) setElo(eloData.elo ?? 0);

    };
    fetchUser();
  }, [post]);


  if (!id) return <p className="mt-3 ml-3">❌ Thiếu id bài viết.</p>;
  if (loading) return <p className="mt-3 ml-3">⏳ Đang tải...</p>;
  if (!post) return <p className="mt-3 ml-3">😵 Không tìm thấy bài viết.</p>;

  return (
    <div className="max-w-7xl mx-auto p-6">

        <Link href="/blogs" className="text-blue-600 hover:underline" style={{textAlign: "left"}}>← Back to blog list</Link>

        <h1 className="text-3xl font-bold mb-2 mt-5">{post.title}</h1>

        <div className="text-md text-gray-500 mb-6 flex">
            Đăng bởi
            <Image 
              src={`/assets/ranks/${getEloClass(elo ?? 0)}.png`}
              alt={`${getEloClass(elo ?? 0)}`}
              width={20}
              height={20}
              className="ml-1"
            ></Image>
            <a
              href={`/user?username=${post.username}`}
              className={getEloClass(elo ?? 0) + " mr-1"}
            >
              <strong>{post.username}</strong>
            </a>{" "}
            vào {new Date(post.created_at).toLocaleString("vi-VN")}
        </div>

        <div className="prose max-w-none [&_p]:my-5 [&_h2]:mt-2 [&_li]:my-1">
            <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
            rehypePlugins={[rehypeKatex]}
            >
            {post.content}
            </ReactMarkdown>
        </div>



        {post.tags && post.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map((t) => (
                <a
                key={t}
                href={`/blogs?tag=${t}`}
                className="px-2 py-1 text-xs border rounded hover:bg-gray-600"
                >
                #{t}
                </a>
            ))}
            </div>
        )}
    </div>
  );
}