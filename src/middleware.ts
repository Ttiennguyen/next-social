import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Xác định các trang cần đăng nhập mới xem được
const isProtectedRoute = createRouteMatcher(["/settings(.*)","/"]);

// Middleware sẽ kiểm tra: nếu người dùng truy cập vào route cần bảo vệ → bắt đăng nhập
export default clerkMiddleware((auth, req) => {
    if (isProtectedRoute(req)) auth().protect();
});

// Cấu hình để middleware chỉ chạy với các đường dẫn phù hợp
export const config = {
  matcher: [
    // Bỏ qua file tĩnh (ảnh, css, js,...) và nội bộ Next.js (_next)
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Luôn kiểm tra các route API
    '/(api|trpc)(.*)',
  ],
};