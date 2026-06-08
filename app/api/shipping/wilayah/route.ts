import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  const apiKey = process.env.BINDERBYTE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  let url = '';
  if (type === 'province') {
    url = `https://api.binderbyte.com/wilayah/provinsi?api_key=${apiKey}`;
  } else if (type === 'kabupaten' && id) {
    url = `https://api.binderbyte.com/wilayah/kabupaten?api_key=${apiKey}&id_provinsi=${id}`;
  } else if (type === 'kecamatan' && id) {
    url = `https://api.binderbyte.com/wilayah/kecamatan?api_key=${apiKey}&id_kabupaten=${id}`;
  } else {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === '200') {
      return NextResponse.json(data.value);
    }
    return NextResponse.json({ error: data.messages || 'Error fetching wilayah' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
