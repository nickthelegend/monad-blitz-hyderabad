"use client";

import { useEffect, useRef, useState } from 'react';
import * as LightweightCharts from 'lightweight-charts';

interface AgentPerformanceChartProps {
    data: { time: number; value: number }[];
    height?: number;
}

export default function AgentPerformanceChart({ data, height = 400 }: AgentPerformanceChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<LightweightCharts.IChartApi | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current || !data || data.length === 0) return;

        // Clean up previous chart
        chartContainerRef.current.innerHTML = '';

        const chart = LightweightCharts.createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height,
            layout: {
                background: { type: LightweightCharts.ColorType.Solid, color: 'transparent' },
                textColor: '#d1d4dc',
            },
            grid: {
                vertLines: { color: 'rgba(198, 33, 50, 0.05)' },
                horzLines: { color: 'rgba(198, 33, 50, 0.05)' },
            },
            timeScale: {
                borderColor: 'rgba(198, 33, 50, 0.2)',
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: 'rgba(198, 33, 50, 0.2)',
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                },
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
                vertLine: {
                    color: 'rgba(198, 33, 50, 0.5)',
                    width: 1,
                    style: 1,
                    labelBackgroundColor: '#c62132',
                },
                horzLine: {
                    color: 'rgba(198, 33, 50, 0.5)',
                    width: 1,
                    style: 1,
                    labelBackgroundColor: '#c62132',
                },
            },
        });

        const areaSeries = chart.addSeries(LightweightCharts.AreaSeries, {
            lineColor: '#c62132',
            topColor: 'rgba(198, 33, 50, 0.4)',
            bottomColor: 'rgba(198, 33, 50, 0.0)',
            lineWidth: 3,
        });

        // De-duplicate and sort data
        const seen = new Set<number>();
        const cleanData = data
            .map(p => ({ time: Math.floor(p.time) as any, value: p.value }))
            .filter(p => {
                if (seen.has(p.time)) return false;
                seen.add(p.time);
                return true;
            })
            .sort((a, b) => a.time - b.time);

        areaSeries.setData(cleanData);
        chart.timeScale().fitContent();

        const handleResize = () => {
            if (chartContainerRef.current && chart) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);
        chartRef.current = chart;

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data, height]);

    return (
        <div
            ref={chartContainerRef}
            style={{
                width: '100%',
                height: `${height}px`,
                position: 'relative'
            }}
        />
    );
}
