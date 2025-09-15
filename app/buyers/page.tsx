"use client";

import { useState, useEffect } from "react";

export default function BuyersPage() {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    city: "Mohali",
  });

  const [buyers, setBuyers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBuyers();
  }, []);

  // Fetch all buyers
  async function fetchBuyers() {
    const res = await fetch("/api/buyers");
    const data = await res.json();
    setBuyers(data);
  }

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  //  Add or Update Buyer
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      //  UPDATE existing buyer
      const res = await fetch(`/api/buyers/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const updated = await res.json();
      setBuyers(buyers.map((b) => (b.id === editingId ? updated : b)));
      setEditingId(null);
    } else {
      //  CREATE new buyer
      const res = await fetch("/api/buyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setBuyers([...buyers, data]);
    }

    // Reset form after submit
    setForm({ fullName: "", phone: "", city: "Mohali" });
  };

  //  Edit buyer (fills form with existing data)
  const handleEdit = (buyer: any) => {
    setForm({
      fullName: buyer.fullName,
      phone: buyer.phone,
      city: buyer.city,
    });
    setEditingId(buyer.id);
  };

  //  Delete buyer
  const handleDelete = async (id: string) => {
    await fetch(`/api/buyers/${id}`, { method: "DELETE" });
    setBuyers(buyers.filter((b) => b.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Form */}
      <h1 className="text-2xl font-bold mb-4 text-blue-700">
        {editingId ? "Edit Buyer" : "Add Buyer"}
      </h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-3 bg-white shadow-md p-4 rounded-lg"
      >
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={form.fullName}
          onChange={handleChange}
          className="border rounded p-2 w-full focus:ring-2 focus:ring-blue-400"
          required
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          className="border rounded p-2 w-full focus:ring-2 focus:ring-blue-400"
          required
        />
        <select
          name="city"
          value={form.city}
          onChange={handleChange}
          className="border rounded p-2 w-full focus:ring-2 focus:ring-blue-400"
        >
          <option>Chandigarh</option>
          <option>Mohali</option>
          <option>Zirakpur</option>
          <option>Panchkula</option>
          <option>Other</option>
        </select>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
        >
          {editingId ? "Update Buyer" : "Add Buyer"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm({ fullName: "", phone: "", city: "Mohali" });
            }}
            className="ml-2 bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded shadow"
          >
            Cancel
          </button>
        )}
      </form>

      {/* Buyer List */}
      <h2 className="text-xl font-semibold mt-6 mb-2 text-gray-800">
        Buyer List
      </h2>
      <ul className="space-y-2">
        {buyers.map((b) => (
          <li
            key={b.id}
            className="border rounded-lg p-3 shadow-sm bg-gray-50 flex justify-between items-center"
          >
            <div>
              <span className="font-medium">{b.fullName}</span> <br />
              <span className="text-sm text-gray-600">
                {b.phone} ({b.city})
              </span>
            </div>
            <div className="space-x-3">
              <button
                onClick={() => handleEdit(b)}
                className="text-blue-600 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(b.id)}
                className="text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
