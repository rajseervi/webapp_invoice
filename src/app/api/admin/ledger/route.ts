import { NextRequest, NextResponse } from 'next/server';
import { serverDb as db } from '@/lib/server-firebase';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';

// Simple passthrough API to reuse existing dashboard POST handlers if needed later
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partyId = searchParams.get('partyId');
    const start = searchParams.get('startDate');
    const end = searchParams.get('endDate');

    if (!partyId) {
      return NextResponse.json({ success: false, error: 'partyId required' }, { status: 400 });
    }

    const endDate = end ? new Date(end) : new Date();
    const startDate = start ? new Date(start) : new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);

    const invoicesQuery = query(
      collection(db, 'invoices'),
      where('partyId', '==', partyId),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('createdAt', 'desc')
    );

    const snap = await getDocs(invoicesQuery);
    const invoices = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ success: true, data: invoices });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}