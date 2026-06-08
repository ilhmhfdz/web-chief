import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { destination_district_id, weight = 1 } = await req.json();

    if (!destination_district_id) {
      return NextResponse.json({ error: 'destination_district_id is required' }, { status: 400 });
    }

    const apiKey = process.env.BINDERBYTE_API_KEY;
    const originDistrict = process.env.STORE_ORIGIN_DISTRICT_ID || 'district_31.74.01'; // Default Tebet, Jakarta Selatan

    if (!apiKey) {
      return NextResponse.json({ error: 'Shipping API key not configured' }, { status: 500 });
    }

    // Call BinderByte API
    // Using popular couriers: jne, sicepat, pos, jnt
    const response = await fetch('https://api.binderbyte.com/v1/cost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        api_key: apiKey,
        courier: 'jne,sicepat,pos,jnt',
        origin: originDistrict,
        destination: destination_district_id,
        weight: weight.toString()
      })
    });

    const data = await response.json();

    if (!response.ok || data.code !== '200') {
      return NextResponse.json({ error: data.message || 'Failed to fetch shipping costs' }, { status: 400 });
    }

    return NextResponse.json({ results: data.data.results });
  } catch (error: any) {
    console.error('Shipping cost error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
