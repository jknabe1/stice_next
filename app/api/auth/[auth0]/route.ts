import { handleLogin, handleLogout, handleCallback, handleProfile } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export async function GET(req: Request, context: { params: { auth0: string } }) {
  const { auth0 } = await context.params; // Lägg till `await` här

  try {
    switch (auth0) {
      case 'login':
        return handleLogin(req);
      case 'logout':
        return handleLogout(req);
      case 'callback':
        return handleCallback(req);
      case 'profile':
        return handleProfile(req);
      default:
        return NextResponse.json({ error: 'Invalid Auth0 route' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
