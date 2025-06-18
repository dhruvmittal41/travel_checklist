// Checklist.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

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
    const res = await axios.get('http://localhost:5001/api/categories');
    setCategories(res.data);
  };

  const fetchItems = async (categoryId) => {
    const res = await axios.get(`http://localhost:5001/api/items/${categoryId}`);
    setItems(res.data);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    const res = await axios.post('http://localhost:5001/api/categories', { name: newCategory });
    setCategories([...categories, res.data]);
    setNewCategory('');
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    const res = await axios.post('http://localhost:5001/api/items', {
      name: newItem,
      completed: false,
      category_id: selectedCategory.id,
      added_by: username
    });
    setItems([...items, { id: res.data.id, name: newItem, completed: false, added_by: username }]);
    setNewItem('');
  };

  const toggleItem = async (itemId, completed) => {
    await axios.put(`http://localhost:5001/api/items/${itemId}`, { completed: !completed });
    setItems(
      items.map((item) => (item.id === itemId ? { ...item, completed: !completed } : item))
    );
  };

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setUsernameSubmitted(true);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar for Categories */}
      <div className="w-full md:w-1/4 p-4 bg-purple-100 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-purple-800">Categories</h2>
        <ul className="space-y-2">
          {categories.map((cat) => (
            <li
              key={cat.id}
              onClick={() => setSelectedCategory(cat)}
              className={`cursor-pointer p-2 rounded-lg ${
                selectedCategory?.id === cat.id ? 'bg-purple-300 text-white' : 'bg-white'
              }`}
            >
              {cat.name}
            </li>
          ))}
        </ul>

        <form onSubmit={handleCategorySubmit} className="mt-6 flex flex-col space-y-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category"
            className="p-2 border rounded"
          />
          <button
            type="submit"
            className="bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600"
          >
            Add Category
          </button>
        </form>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        {!usernameSubmitted ? (
          <form
            onSubmit={handleUsernameSubmit}
            className="flex flex-col items-center justify-center h-full space-y-4"
          >
            <h2 className="text-lg font-bold">Enter your name to continue</h2>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              className="p-2 border rounded w-full max-w-xs"
            />
            <button
              type="submit"
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              Submit
            </button>
          </form>
        ) : selectedCategory ? (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-purple-700">{selectedCategory.name}</h2>

            <form onSubmit={handleItemSubmit} className="flex flex-col md:flex-row gap-2 mb-4">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add new item"
                className="flex-1 p-2 border rounded"
              />
              <button
                type="submit"
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                Add Item
              </button>
            </form>

            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between bg-gray-100 p-3 rounded shadow"
                >
                  <span
                    onClick={() => toggleItem(item.id, item.completed)}
                    className={`cursor-pointer flex-1 ${item.completed ? 'line-through text-gray-500' : ''}`}
                  >
                    {item.name} <span className="text-xs italic">(added by {item.added_by})</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-center text-gray-500">Select a category to view or add items.</p>
        )}
      </div>
    </div>
  );
}

export default Checklist;
