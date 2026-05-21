import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { NotificationProvider } from "./context/NotificationContext";
import { SocketProvider } from "./context/SocketContext";
import ScrollToTop from "./components/layout/ScrollToTop";

// Layouts
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";
import SellerLayout from "./layouts/SellerLayout";

// Route Guards
import { GuestRoute, ProtectedRoute, AdminRoute, SellerRoute, UserLayoutGuard } from "./components/RouteGuards";

// Pages
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import PolicyPage from "./pages/PolicyPage";
import NotFound from "./pages/NotFound";
import BecomeaSeller from "./pages/BecomeaSeller";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import UserProfile from "./pages/UserProfile";
import HotDealsPage from "./pages/HotDealsPage";
import SellerPage from "./pages/SellerPage";
import BlogPage from "./pages/BlogPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import WriteSiteReviewPage from "./pages/WriteSiteReviewPage";

// Admin
import AdminDashboard from "./Admin/pages/AdminDashboard";
import AdminSellers from "./Admin/pages/AdminSellers";
import AdminPendingSellers from "./Admin/pages/AdminPendingSellers";
import AdminUsers from "./Admin/pages/AdminUsers";
import AdminProducts from "./Admin/pages/AdminProducts";
import AdminOrders from "./Admin/pages/AdminOrders";
import AdminInquiries from "./Admin/pages/AdminInquiries";
import AdminSellerHub from "./Admin/pages/AdminSellerHub";
import AdminAddProduct from "./Admin/pages/AdminAddProduct";
import AdminAddSeller from "./Admin/pages/AdminAddSeller";
import AdminEditSeller from "./Admin/pages/AdminEditSeller";
import AdminEditProduct from "./Admin/pages/AdminEditProduct";
import AdminContacts from "./Admin/pages/AdminContacts";
import AdminReviews from "./Admin/pages/AdminReviews";
import AdminBroadcast from "./Admin/pages/AdminBroadcast";
import AdminNotifications from "./Admin/pages/AdminNotifications";
import AdminBlogs from "./Admin/pages/AdminBlogs";
import AdminAddEditBlog from "./Admin/pages/AdminAddEditBlog";
import AdminLeadAnalytics from "./Admin/pages/AdminLeadAnalytics";

// Seller
import { SellerDashboard, SellerProducts, SellerOrders, SellerLeads, SellerProfile } from "./Seller/SellerDashboard";
import AddProduct from "./Seller/AddProduct";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <NotificationProvider>
        <SocketProvider>
          <CartProvider>
            <Routes>
              {/* Guest Routes */}
              <Route element={<GuestRoute />}>
                <Route element={<UserLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                </Route>
              </Route>

              {/* Public / Standard Routes */}
              <Route element={<UserLayoutGuard />}>
                <Route element={<UserLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/products/:id" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/policy" element={<PolicyPage />} />
                  <Route path="/hot-deals" element={<HotDealsPage />} />
                  <Route path="/seller" element={<SellerPage />} />
                  <Route path="/become-a-seller" element={<BecomeaSeller />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/:slug" element={<BlogDetailPage />} />
                </Route>
              </Route>
              
              {/* Standalone Write Site Review (Public invitation link) */}
              <Route path="/site-review/write" element={<WriteSiteReviewPage />} />

              {/* Global 404 */}
              <Route path="*" element={<NotFound />} />

              {/* Protected User Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<UserLayout />}>
                  <Route path="/profile" element={<UserProfile />} />
                </Route>
              </Route>

              {/* Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/sellers" element={<AdminSellers />} />
                  <Route path="/admin/pending-sellers" element={<AdminPendingSellers />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/products" element={<AdminProducts />} />
                  <Route path="/admin/orders" element={<AdminOrders />} />
                  <Route path="/admin/inquiries" element={<AdminInquiries />} />
                  <Route path="/admin/contacts" element={<AdminContacts />} />
                  <Route path="/admin/reviews" element={<AdminReviews />} />
                  <Route path="/admin/broadcast" element={<AdminBroadcast />} />
                  <Route path="/admin/conversion-tracking" element={<AdminLeadAnalytics />} />
                  <Route path="/admin/notifications" element={<AdminNotifications />} />
                  <Route path="/admin/seller-hub" element={<AdminSellerHub />} />
                  <Route path="/admin/add-product" element={<AdminAddProduct />} />
                  <Route path="/admin/add-seller" element={<AdminAddSeller />} />
                  <Route path="/admin/sellers/edit/:id" element={<AdminEditSeller />} />
                  <Route path="/admin/products/edit/:id" element={<AdminEditProduct />} />
                  <Route path="/admin/blogs" element={<AdminBlogs />} />
                  <Route path="/admin/blogs/add" element={<AdminAddEditBlog />} />
                  <Route path="/admin/blogs/edit/:id" element={<AdminAddEditBlog />} />
                </Route>
              </Route>

              {/* Seller Routes */}
              <Route element={<SellerRoute />}>
                <Route element={<SellerLayout />}>
                  <Route path="/seller/dashboard" element={<SellerDashboard />} />
                  <Route path="/seller/products" element={<SellerProducts />} />
                  <Route path="/seller/leads" element={<SellerLeads />} />
                  <Route path="/seller/orders" element={<SellerOrders />} />
                  <Route path="/seller/profile" element={<SellerProfile />} />
                  <Route path="/seller/add-product" element={<AddProduct />} />
                </Route>
              </Route>
            </Routes>
          </CartProvider>
        </SocketProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}
