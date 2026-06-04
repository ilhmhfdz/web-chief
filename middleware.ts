import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Route classification
  const isAdminRoute    = pathname.startsWith('/admin');
  const isApiAdminRoute = pathname.startsWith('/api/admin');
  const isShopAuthRoute = pathname.startsWith('/cart') || pathname.startsWith('/checkout');
  // These routes require any authenticated user (ownership enforced at handler level)
  const isApiAuthRoute  = pathname.startsWith('/api/orders') || pathname === '/api/products';

  // 1. Extract token from Authorization header OR httpOnly cookie
  let token: string | undefined;
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    token = request.cookies.get('token')?.value;
  }

  // 2. Handle missing token
  if (!token) {
    const isApiRoute = isApiAdminRoute || isApiAuthRoute;
    return handleUnauthorized(request, isApiRoute);
  }

  // 3. Verify token
  try {
    const payload = await verifyJWT(token);
    
    // Enforce admin role ONLY for /admin and /api/admin routes
    if ((isAdminRoute || isApiAdminRoute) && payload.role !== 'admin') {
      return handleUnauthorized(request, isApiAdminRoute);
    }

    // 4. Attach payload to request headers for downstream API consumption
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-payload', JSON.stringify(payload));
    // Support both payload.userId (issued by signJWT) and payload.sub (OIDC standard)
    const userId = (payload.userId ?? payload.sub) as string | undefined;
    if (userId) requestHeaders.set('x-user-id', userId);
    if (payload.role) requestHeaders.set('x-user-role', payload.role as string);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    // Token is invalid or expired
    const isApiRoute = isApiAdminRoute || isApiAuthRoute;
    return handleUnauthorized(request, isApiRoute);
  }
}

/**
 * Utility to route unauthorized requests appropriately based on the requested path.
 */
function handleUnauthorized(request: NextRequest, isApi: boolean) {
  if (isApi) {
    // Return 401 JSON for API routes
    return NextResponse.json(
      { error: 'Unauthorized. Valid authentication token is required.' },
      { status: 401 }
    );
  } else {
    // Redirect to login for page routes
    const loginUrl = new URL('/login', request.url);
    // Optional: Pass the intended destination so the login page can redirect back after success
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
}

// Ensure middleware only runs on paths that need it
export const config = {
  matcher: [
    // Admin pages & API
    '/admin/:path*',
    '/api/admin/:path*',

    // Order APIs — need auth for PATCH & GET (ownership check)
    '/api/orders/:path*',

    // Product write API — POST requires admin
    '/api/products',

    // Shop pages requiring auth
    '/cart',
    '/cart/:path*',
    '/checkout',
    '/checkout/:path*',
  ],
};
