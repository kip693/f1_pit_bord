import { useEffect } from 'react';

interface PageMetaOptions {
    title: string;
    description: string;
    ogImage?: string;
    url?: string;
}

export function usePageMeta({ title, description, ogImage, url }: PageMetaOptions): void {
    useEffect(() => {
        const pageUrl = url ?? window.location.href;
        const fullTitle = `${title} | F1 PitBoard`;

        document.title = fullTitle;

        function setMeta(attr: string, key: string, content: string) {
            let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute(attr, key);
                document.head.appendChild(el);
            }
            el.setAttribute('content', content);
        }

        setMeta('name', 'description', description);
        setMeta('property', 'og:title', fullTitle);
        setMeta('property', 'og:description', description);
        setMeta('property', 'og:url', pageUrl);
        setMeta('property', 'og:type', 'website');
        setMeta('property', 'og:site_name', 'F1 PitBoard');
        setMeta('property', 'og:locale', 'ja_JP');
        if (ogImage) setMeta('property', 'og:image', ogImage);
        setMeta('name', 'twitter:card', 'summary_large_image');
        setMeta('name', 'twitter:title', fullTitle);
        setMeta('name', 'twitter:description', description);
        if (ogImage) setMeta('name', 'twitter:image', ogImage);
    }, [title, description, ogImage, url]);
}
