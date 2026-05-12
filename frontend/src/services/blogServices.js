import API from "./api";

// Public
export const fetchPublishedBlogs = async () => {
  const res = await API.get("/blogs");
  return res.data;
};

export const fetchBlogBySlug = async (slug) => {
  const res = await API.get(`/blogs/${slug}`);
  return res.data;
};

// Admin
export const fetchAllBlogsAdmin = async () => {
  const res = await API.get("/blogs/admin/all");
  return res.data;
};

export const fetchBlogByIdAdmin = async (id) => {
  const res = await API.get(`/blogs/admin/${id}`);
  return res.data;
};

export const createBlog = async (formData) => {
  const res = await API.post("/blogs/admin", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateBlog = async (id, formData) => {
  const res = await API.put(`/blogs/admin/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteBlog = async (id) => {
  const res = await API.delete(`/blogs/admin/${id}`);
  return res.data;
};

export const toggleBlogStatus = async (id) => {
  const res = await API.patch(`/blogs/admin/${id}/status`);
  return res.data;
};
