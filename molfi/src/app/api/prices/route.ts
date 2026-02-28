import { NextResponse } from 'next/server';
import { getOraclePrice, getAllPrices } from '@/lib/marketEngine';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');

  try {
    if (!symbol || symbol === 'all') {
      // Return all supported prices
      const prices = await getAllPrices();
      return NextResponse.json({ success: true, data: prices });
    }

    const symbols = symbol.split(',');
    const pricePromises = symbols.map(s => getOraclePrice(s.trim()));
    const prices = await Promise.all(pricePromises);

    return NextResponse.json({ success: true, data: prices });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
