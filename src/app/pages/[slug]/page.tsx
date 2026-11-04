import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { RichBlocks } from "@/components/RichBlocks";
import { STORE_NAME, getFooterPage, type RichBlock } from "@/lib/medusa";

export const dynamic = "force-dynamic";

interface SupportPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SupportPageProps) {
  const { slug } = await params;
  const page = await getFooterPage(slug);
  return { title: page ? `${page.title} | ${STORE_NAME}` : STORE_NAME };
}

// The merchant's text arrives as blocks (headings, paragraphs, lists, links),
// drawn by React, never as HTML.

// Merchants often start the text with the page's own title. The page already
// shows it as its heading, so it is not repeated.
function withoutRepeatedTitle(blocks: RichBlock[], title: string): RichBlock[] {
  const first = blocks[0];
  if (first && first.type === "heading") {
    const heading = first.content
      .map((node) => (node.type === "text" ? node.text : node.type === "link" ? node.children.map((c) => c.text).join("") : " "))
      .join("")
      .replace(/[\s:]+$/, "")
      .trim()
      .toLowerCase();
    if (heading === title.trim().toLowerCase()) return blocks.slice(1);
  }
  return blocks;
}

export default async function SupportPage({ params }: SupportPageProps) {
  const { slug } = await params;
  const page = await getFooterPage(slug);

  if (!page) {
    notFound();
  }

  const blocks = withoutRepeatedTitle(page.blocks, page.title);

  return (
    <article className="max-w-3xl mx-auto space-y-6">
      <nav className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/" className="hover:text-black transition">
          {STORE_NAME}
        </Link>
        <ChevronRight size={14} />
        <span className="text-zinc-800">{page.title}</span>
      </nav>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        {page.title}
      </h1>
      <RichBlocks blocks={blocks} />
    </article>
  );
}
