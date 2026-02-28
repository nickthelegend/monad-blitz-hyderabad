import { useState, useEffect } from 'react';
import { binancePriceService, PriceData } from './binancePriceService';

export function useLivePrices() {
    const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());

    useEffect(() => {
        binancePriceService.connect();

        const unsubscribe = binancePriceService.subscribe((updatedPrices) => {
            // Create a new map to trigger state update
            setPrices(new Map(updatedPrices));
        });

        return () => {
            unsubscribe();
            // We might not want to disconnect globally if other components use it,
            // but for now, it's fine.
        };
    }, []);

    return prices;
}
