import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAdminReservas } from '@/lib/admin/reservas';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  const role = session?.user?.role;
  const tenantId = session?.user?.tenantId;

  if (!session?.user || !tenantId || (role !== 'admin_tenant' && role !== 'despachador')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const reservas = await getAdminReservas(tenantId);
  return NextResponse.json({ reservas });
}
