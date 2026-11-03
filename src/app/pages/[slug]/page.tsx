import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { STORE_NAME, getFooterPage } from "@/lib/medusa";

export const dynamic = "force-dynamic";

interface SupportPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SupportPageProps) {
  const { slug } = await params;
  const page = await getFooterPage(slug);
  return { title: page ? `${page.title} | ${STORE_NAME}` : STORE_NAME };
}

// The text is plain text: a blank line starts a paragraph and a single line
// break stays a line break. It is shown as text, never as HTML.
export default async function SupportPage({ params }: SupportPageProps) {
  const { slug } = await params;
  const page = await getFooterPage(slug);

  if (!page) {
    notFound();
  }

  const paragraphs = page.text.split(/\n{2,}/);

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
      <div data-testid="support-page-text" className="space-y-4 text-sm leading-7 text-zinc-700">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="whitespace-pre-line">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
