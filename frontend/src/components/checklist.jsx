import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;
const socket = io(API_BASE);

function Checklist() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [items, setItems] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newItem, setNewItem] = useState('');
  const [username, setUsername] = useState('');
  const [usernameSubmitted, setUsernameSubmitted] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch items when category changes
  useEffect(() => {
    if (selectedCategory) fetchItems(selectedCategory.id);
  }, [selectedCategory]);

  // Socket update listener
  useEffect(() => {
    const handleUpdate = () => {
      fetchCategories();
      if (selectedCategory) fetchItems(selectedCategory.id);
    };

    socket.on('update', handleUpdate);
    return () => socket.off('update', handleUpdate);
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/categories`);
      setCategories(res.data);

      if (selectedCategory) {
        const updated = res.data.find((c) => c.id === selectedCategory.id);
        setSelectedCategory(updated || null);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchItems = async (categoryId) => {
    try {
      const res = await axios.get(`${API_BASE}/api/items/${categoryId}`);
      setItems(res.data);
    } catch (err) {
      console.error('Error fetching items:', err);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      await axios.post(`${API_BASE}/api/categories`, { name: newCategory });
      setNewCategory('');
      fetchCategories();
    } catch (err) {
      console.error('Error adding category:', err);
    }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (!newItem.trim() || !selectedCategory) return;

    const tempItem = {
      id: Date.now(),
      name: newItem,
      completed: false,
      category_id: selectedCategory.id,
      added_by: username,
    };

    setItems((prev) => [...prev, tempItem]);
    setNewItem('');

    try {
      const res = await axios.post(`${API_BASE}/api/items`, tempItem);
      setItems((prev) =>
        prev.map((item) => (item.id === tempItem.id ? res.data : item))
      );
    } catch (err) {
      console.error('Error adding item:', err);
      setItems((prev) => prev.filter((item) => item.id !== tempItem.id));
    }
  };

  const toggleItem = async (itemId, completed) => {
    try {
      await axios.put(`${API_BASE}/api/items/${itemId}`, { completed: !completed });
      fetchItems(selectedCategory.id);
    } catch (err) {
      console.error('Error toggling item:', err);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await axios.delete(`${API_BASE}/api/categories/${id}`);
      setSelectedCategory(null);
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await axios.delete(`${API_BASE}/api/items/${id}`);
      fetchItems(selectedCategory.id);
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) setUsernameSubmitted(true);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Sidebar */}
      <aside className="w-full md:w-1/4 bg-white border-r p-4 md:p-6 shadow-sm">
        <h2 className="text-xl md:text-2xl font-bold text-purple-700 mb-4">📁 Categories</h2>
        <ul className="space-y-2 mb-4 overflow-y-auto max-h-[60vh]">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className={`flex justify-between items-center px-3 py-2 rounded-lg shadow-sm transition ${
                selectedCategory?.id === cat.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 hover:bg-purple-100'
              }`}
            >
              <span
                onClick={() => setSelectedCategory(cat)}
                className="flex-1 cursor-pointer"
              >
                {cat.name}
              </span>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                ❌
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={handleCategorySubmit} className="space-y-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category"
            className="w-full px-3 py-2 border rounded shadow-sm focus:ring focus:ring-purple-300"
          />
          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
          >
            ➕ Add Category
          </button>
        </form>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {!usernameSubmitted ? (
          <form
            onSubmit={handleUsernameSubmit}
            className="flex flex-col items-center justify-center h-full space-y-4"
          >
            <h2 className="text-2xl font-semibold">Welcome 👋</h2>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="px-4 py-2 border rounded shadow-sm focus:ring focus:ring-green-400"
            />
            <button
              type="submit"
              className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
            >
              Continue
            </button>
          </form>
        ) : selectedCategory ? (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-purple-700 text-center mb-6">
              {selectedCategory.name}
            </h2>

            <form onSubmit={handleItemSubmit} className="flex flex-col md:flex-row gap-3 mb-6">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add new item"
                className="flex-1 px-4 py-2 border rounded shadow-sm focus:ring focus:ring-blue-400"
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-5 py-2 rounded hover:bg-blue-600"
              >
                ➕ Add Item
              </button>
            </form>

            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between items-center p-3 bg-white border shadow rounded hover:bg-gray-50"
                >
                  <span
                    onClick={() => toggleItem(item.id, item.completed)}
                    className={`cursor-pointer flex-1 ${
                      item.completed ? 'line-through text-gray-400' : 'text-gray-800'
                    }`}
                  >
                    ✅ {item.name || '(No name)'}{' '}
                    <span className="text-xs italic text-gray-500">
                      (by {item.added_by || 'Unknown'})
                    </span>
                  </span>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    ❌
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-center text-gray-500 text-lg mt-10">
            Please select a category from the left to begin.
          </p>
        )}
      </main>
    </div>
  );
}

export default Checklist;
