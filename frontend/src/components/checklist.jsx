import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;

function Checklist() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [items, setItems] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newItem, setNewItem] = useState('');
  const [username, setUsername] = useState('');
  const [usernameSubmitted, setUsernameSubmitted] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchItems(selectedCategory.id);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/categories`);
      setCategories(res.data);
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

    const tempCategory = { id: Date.now(), name: newCategory };
    setCategories((prev) => [...prev, tempCategory]);
    setNewCategory('');

    try {
      const res = await axios.post(`${API_BASE}/api/categories`, { name: tempCategory.name });
      setCategories((prev) =>
        prev.map((cat) => (cat.id === tempCategory.id ? res.data : cat))
      );
    } catch (err) {
      console.error('Error adding category:', err);
      setCategories((prev) => prev.filter((cat) => cat.id !== tempCategory.id));
    }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;

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
      const res = await axios.post(`${API_BASE}/api/items`, {
        name: newItem,
        completed: false,
        category_id: selectedCategory.id,
        added_by: username,
      });
      setItems((prev) =>
        prev.map((item) => (item.id === tempItem.id ? res.data : item))
      );
    } catch (err) {
      console.error('Error adding item:', err);
      setItems((prev) => prev.filter((item) => item.id !== tempItem.id));
    }
  };

  const toggleItem = async (itemId, completed) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, completed: !completed } : item
      )
    );

    try {
      await axios.put(`${API_BASE}/api/items/${itemId}`, { completed: !completed });
    } catch (err) {
      console.error('Error toggling item:', err);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    const backup = [...categories];
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
    if (selectedCategory?.id === id) setSelectedCategory(null);

    try {
      await axios.delete(`${API_BASE}/api/categories/${id}`);
    } catch (err) {
      console.error('Error deleting category:', err);
      setCategories(backup);
    }
  };

  const deleteItem = async (id) => {
    const backup = [...items];
    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      await axios.delete(`${API_BASE}/api/items/${id}`);
    } catch (err) {
      console.error('Error deleting item:', err);
      setItems(backup);
    }
  };

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setUsernameSubmitted(true);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full font-sans bg-gradient-to-br from-purple-50 to-white text-gray-800">
      {/* Sidebar */}
      <div className="w-full md:w-1/4 bg-white border-r shadow-md p-6 space-y-6 overflow-y-auto">
        <h2 className="text-2xl font-bold text-purple-700">🗂 Categories</h2>
        <ul className="space-y-3">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className={`p-3 rounded-lg shadow flex items-center justify-between group cursor-pointer ${
                selectedCategory?.id === cat.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 hover:bg-purple-100'
              }`}
            >
              <span
                onClick={() => setSelectedCategory(cat)}
                className="flex-1"
              >
                {cat.name}
              </span>
              <span
                className="text-red-500 hover:text-red-700 cursor-pointer ml-2"
                onClick={() => deleteCategory(cat.id)}
              >
                ❌
              </span>
            </li>
          ))}
        </ul>

        <form onSubmit={handleCategorySubmit} className="flex flex-col gap-3">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            className="p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition-all"
          >
            ➕ Add Category
          </button>
        </form>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!usernameSubmitted ? (
          <form
            onSubmit={handleUsernameSubmit}
            className="flex flex-col items-center justify-center h-full space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-700">Welcome 👋</h2>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="p-3 border border-gray-300 rounded w-72 shadow focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              className="bg-green-500 text-white py-2 px-6 rounded hover:bg-green-600 transition-all"
            >
              Continue
            </button>
          </form>
        ) : selectedCategory ? (
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            <h2 className="text-3xl font-semibold text-purple-700 mb-6 text-center">
              {selectedCategory.name}
            </h2>

            <form onSubmit={handleItemSubmit} className="flex flex-col md:flex-row gap-3 mb-6">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add new item"
                className="flex-1 p-3 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-5 py-2 rounded hover:bg-blue-600 transition-all"
              >
                ➕ Add Item
              </button>
            </form>

            <ul className="space-y-3 flex-1 overflow-y-auto">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between items-center p-4 bg-white shadow rounded border border-gray-100 hover:bg-gray-50 transition-all"
                >
                  <span
                    onClick={() => toggleItem(item.id, item.completed)}
                    className={`cursor-pointer flex-1 ${
                      item.completed ? 'line-through text-gray-400' : 'text-gray-800'
                    }`}
                  >
                    ✅ {item.name}{' '}
                    <span className="text-xs italic text-gray-500">(by {item.added_by})</span>
                  </span>
                  <span
                    className="text-red-500 hover:text-red-700 cursor-pointer ml-2"
                    onClick={() => deleteItem(item.id)}
                  >
                    ❌
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-center text-gray-500 text-lg mt-16">
            Please select a category from the left to get started.
          </p>
        )}
      </div>
    </div>
  );
}

export default Checklist;
