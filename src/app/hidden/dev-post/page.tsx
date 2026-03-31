"use client";

import { useState } from "react";
import MarkdownRenderer from "@/components/renderer/MarkdownRenderer";
import "@/components/renderer/MarkdownRenderer.css";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

const PLACEHOLDER = `# Tiêu đề bài viết

Viết nội dung ở đây. Hỗ trợ **Markdown**, $\\LaTeX$, và code blocks.

\`\`\`cpp
#include <bits/stdc++.h>
using namespace std;
int main() {
    cout << "Hello, BQTOJ!" << endl;
}
\`\`\`

$$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$
`;

export default function PostEditorPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(PLACEHOLDER);
  const [tags, setTags] = useState("");

  return (
    <div className="flex h-[calc(100vh-96px)] overflow-hidden">

      {/* Left: Input */}
      <div className="w-1/2 flex flex-col border-r border-white/10 bg-[#0d1014]">
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <span className="text-xs text-white/40 uppercase tracking-widest font-medium">Editor</span>
        </div>

        <div className="flex flex-col gap-3 px-4 py-3 border-b border-white/10">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tiêu đề bài viết..."
            className="w-full bg-transparent text-white text-xl font-bold placeholder-white/20 outline-none"
          />
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags: dp, graph, math (cách nhau bằng dấu phẩy)"
            className="w-full bg-transparent text-sm text-white/50 placeholder-white/20 outline-none"
          />
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 resize-none bg-transparent text-white/80 text-sm font-mono px-4 py-3 outline-none leading-relaxed"
          spellCheck={false}
        />
      </div>

      {/* Right: Preview */}
      <div className="w-1/2 flex flex-col overflow-hidden bg-[#0d1014]">
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <span className="text-xs text-white/40 uppercase tracking-widest font-medium">Preview</span>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {title && (
            <h1 className="text-3xl font-bold mb-4 text-white">{title}</h1>
          )}

          {tags && (
            <div className="flex flex-wrap gap-2 mb-6">
              {tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                <span key={t} className="px-2 py-0.5 text-xs border border-white/20 rounded text-white/50">
                  #{t}
                </span>
              ))}
            </div>
          )}

          <MarkdownRenderer content={content} />
        </div>
      </div>

    </div>
  );
}