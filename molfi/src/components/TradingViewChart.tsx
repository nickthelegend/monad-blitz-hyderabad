"use client";

import { useEffect, useRef, useState } from 'react';

interface TradingViewChartProps {
    pair: string;
    height?: number;
    showHeader?: boolean;
}

declare global {
    interface Window {
        TradingView: any;
    }
}

export default function TradingViewChart({ pair, height = 400, showHeader = false }: TradingViewChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || !containerRef.current) return;

        // Clean up previous widget
        containerRef.current.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
            if (typeof window.TradingView !== 'undefined' && containerRef.current) {
                // Map pair to TradingView format (e.g., ETH/USDT -> BINANCE:ETHUSDT)
                const symbol = pair.includes(':') ? pair : `BINANCE:${pair.replace('/', '')}`;

                new window.TradingView.widget({
                    "width": "100%",
                    "height": height,
                    "symbol": symbol,
                    "interval": "60",
                    "timezone": "Etc/UTC",
                    "theme": "dark",
                    "style": "1",
                    "locale": "en",
                    "toolbar_bg": "#0a0a0f",
                    "enable_publishing": false,
                    "hide_top_toolbar": true,
                    "hide_legend": false,
                    "save_image": false,
                    "container_id": containerRef.current.id,
                    "backgroundColor": "#0a0a0f",
                    "gridColor": "rgba(168, 85, 247, 0.05)",
                    "loading_screen": { "backgroundColor": "#0a0a0f" }
                });
            }
        };
        document.head.appendChild(script);

        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, [pair, height, mounted]);

    const containerId = `tv-chart-${pair.replace('/', '-').toLowerCase()}`;

    return (
        <div style={{ width: '100%', position: 'relative' }}>
            <div
                id={containerId}
                ref={containerRef}
                style={{
                    height: `${height}px`,
                    background: '#0a0a0f',
                    borderRadius: '12px',
                    overflow: 'hidden'
                }}
            />
        </div>
    );
}
