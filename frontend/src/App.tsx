import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';
import Catalog from './pages/Catalog';
import ArtworkDetail from './pages/ArtworkDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Events from './pages/Events';
import Experience from './pages/Experience';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminArtworks from './pages/admin/AdminArtworks';
import AdminCollections from './pages/admin/AdminCollections';
import AdminArtworkEdit from './pages/admin/AdminArtworkEdit';
import AdminCollectionEdit from './pages/admin/AdminCollectionEdit';
import AdminPosts from './pages/admin/AdminPosts';
import AdminPostEdit from './pages/admin/AdminPostEdit';
import AdminEvents from './pages/admin/AdminEvents';
import AdminEventEdit from './pages/admin/AdminEventEdit';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="collections" element={<Collections />} />
          <Route path="collections/:slug" element={<CollectionDetail />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="catalog/:id" element={<ArtworkDetail />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<BlogPost />} />
          <Route path="events" element={<Events />} />
        </Route>
        <Route path="/experience/:hash" element={<Experience />} />

        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="artworks" element={<AdminArtworks />} />
          <Route path="artworks/new" element={<AdminArtworkEdit />} />
          <Route path="artworks/:id/edit" element={<AdminArtworkEdit />} />
          <Route path="collections" element={<AdminCollections />} />
          <Route path="collections/new" element={<AdminCollectionEdit />} />
          <Route path="collections/:id/edit" element={<AdminCollectionEdit />} />
          <Route path="posts" element={<AdminPosts />} />
          <Route path="posts/new" element={<AdminPostEdit />} />
          <Route path="posts/:id/edit" element={<AdminPostEdit />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="events/new" element={<AdminEventEdit />} />
          <Route path="events/:id/edit" element={<AdminEventEdit />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

